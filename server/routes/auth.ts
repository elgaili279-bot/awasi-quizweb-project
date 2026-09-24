import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type User, type StudentProfile, type TeacherProfile } from '../db.ts';
import { hashPassword, verifyPassword, generateToken, authenticate, type AuthenticatedRequest } from '../auth.ts';

export const authRouter = Router();

// Helper to sanitize user object for client
function sanitizeUser(user: User) {
  const { password_hash, salt, reset_token, reset_expires, ...safe } = user;
  let profile = null;
  if (user.role === 'student') {
    profile = db.getStudentProfile(user.id);
  } else if (user.role === 'teacher') {
    profile = db.getTeacherProfile(user.id);
  }
  return { ...safe, profile };
}

// Authorized teacher registration code
const TEACHER_REGISTRATION_CODE = '090838';

// POST /api/auth/register
authRouter.post('/register', (req, res): void => {
  const {
    role,
    firstName,
    lastName,
    fullName: rawFullName,
    displayName: rawDisplayName,
    email,
    password,
    confirmPassword,
    // Student fields
    studentId,
    academicYear,
    // Teacher fields
    teacherRegistrationCode,
    teacherCode,
  } = req.body;

  const effectiveTeacherCode = teacherRegistrationCode || teacherCode || req.body.code;

  // Role validation
  if (!role || !['student', 'teacher'].includes(role)) {
    res.status(400).json({ error: 'Role must be either student or teacher.' });
    return;
  }

  // Name extraction & validation
  const effectiveFirstName = firstName ? String(firstName).trim() : '';
  const effectiveLastName = lastName ? String(lastName).trim() : '';
  let fullName = rawFullName ? String(rawFullName).trim() : `${effectiveFirstName} ${effectiveLastName}`.trim();
  let displayName = rawDisplayName ? String(rawDisplayName).trim() : effectiveFirstName || fullName;

  if (role === 'student' || role === 'teacher') {
    if (!effectiveFirstName && !rawFullName) {
      res.status(400).json({ error: 'First name is required.' });
      return;
    }
    if (!effectiveLastName && !rawFullName) {
      res.status(400).json({ error: 'Last name is required.' });
      return;
    }
  }

  if (!fullName || fullName.length < 2) {
    res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
    return;
  }

  // Email validation
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  // Password validation
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  // Check unique email
  const existingEmail = db.findUserByEmail(email.trim());
  if (existingEmail) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  // Student specific validation
  if (role === 'student') {
    const cleanStudentId = studentId ? String(studentId).trim() : '';
    if (!cleanStudentId) {
      res.status(400).json({ error: 'Student ID is required.' });
      return;
    }

    const existingStudent = db.findStudentByStudentId(cleanStudentId);
    if (existingStudent) {
      res.status(409).json({ error: 'A student account with this Student ID already exists.' });
      return;
    }

    const cleanAcademicYear = academicYear ? String(academicYear).trim() : 'Batch 99';
    if (!cleanAcademicYear) {
      res.status(400).json({ error: 'Academic Year is required.' });
      return;
    }
  }

  // Teacher specific validation
  if (role === 'teacher') {
    const cleanCode = effectiveTeacherCode ? String(effectiveTeacherCode).trim() : '';
    if (!cleanCode) {
      res.status(400).json({ error: 'Teacher Registration Code is required.' });
      return;
    }

    if (cleanCode !== TEACHER_REGISTRATION_CODE) {
      res.status(403).json({ error: 'Invalid Teacher Registration Code. Please enter the authorized faculty registration code provided by the administrator.' });
      return;
    }
  }

  const { hash, salt } = hashPassword(password);
  const userId = `usr_${role}_${crypto.randomUUID()}`;

  const newUser: User = {
    id: userId,
    email: email.trim().toLowerCase(),
    password_hash: hash,
    salt: salt,
    role,
    full_name: fullName,
    display_name: displayName,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createUser(newUser);

  if (role === 'student') {
    db.setStudentProfile({
      user_id: userId,
      student_id: String(studentId).trim(),
      academic_year: (academicYear ? String(academicYear).trim() : 'Batch 99'),
      medical_school_year: 'Batch 99',
      university: 'Faculty of Medicine, University of Khartoum',
    });
  } else if (role === 'teacher') {
    db.setTeacherProfile({
      user_id: userId,
      title_specialty: 'Faculty Educator',
      institution: 'Faculty of Medicine, University of Khartoum',
      verified: true,
    });
  }

  const token = generateToken(newUser);
  res.status(201).json({
    message: 'Registration successful.',
    token,
    user: sanitizeUser(newUser),
  });
});

// POST /api/auth/login
authRouter.post('/login', (req, res): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.findUserByEmail(email.trim());
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Account is suspended. Please contact support.' });
    return;
  }

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);
  res.json({
    message: 'Login successful.',
    token,
    user: sanitizeUser(user),
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  res.json({ user: sanitizeUser(req.user) });
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { fullName, displayName, bio, medicalSchoolYear, university, targetExam, titleSpecialty, institution } = req.body;

  const updates: Partial<User> = {};
  if (fullName && fullName.trim().length >= 2) updates.full_name = fullName.trim();
  if (displayName && displayName.trim().length >= 2) updates.display_name = displayName.trim();

  const updatedUser = db.updateUser(user.id, updates) || user;

  if (user.role === 'student') {
    const existing: StudentProfile = db.getStudentProfile(user.id) || {
      user_id: user.id,
      student_id: '',
      academic_year: 'Batch 99',
      medical_school_year: 'Batch 99 Member',
      university: 'Faculty of Medicine, University of Khartoum',
      academic_focus: 'Batch 99 Medical Curriculum',
    };
    db.setStudentProfile({
      ...existing,
      medical_school_year: medicalSchoolYear || existing.medical_school_year,
      university: university !== undefined ? university.trim() : existing.university,
      bio: bio !== undefined ? bio.trim() : existing.bio,
      academic_focus: req.body.academicFocus !== undefined ? req.body.academicFocus.trim() : existing.academic_focus,
      target_exam: targetExam !== undefined ? targetExam.trim() : existing.target_exam,
    });
  } else if (user.role === 'teacher') {
    const existing = db.getTeacherProfile(user.id) || { user_id: user.id, title_specialty: '', institution: '', verified: true };
    db.setTeacherProfile({
      ...existing,
      title_specialty: titleSpecialty !== undefined ? titleSpecialty.trim() : existing.title_specialty,
      institution: institution !== undefined ? institution.trim() : existing.institution,
      bio: bio !== undefined ? bio.trim() : existing.bio,
    });
  }

  res.json({
    message: 'Profile updated successfully.',
    user: sanitizeUser(updatedUser),
  });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400).json({ error: 'New passwords do not match.' });
    return;
  }

  const isValid = verifyPassword(currentPassword, user.password_hash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, { password_hash: hash, salt });

  res.json({ message: 'Password updated successfully.' });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req, res): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const user = db.findUserByEmail(email.trim());
  if (!user) {
    // Return generic success for privacy
    res.json({ message: 'If this email is registered, password reset instructions have been generated.' });
    return;
  }

  // Generate 6-digit verification code or token
  const resetToken = crypto.randomInt(100000, 999999).toString();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.updateUser(user.id, { reset_token: resetToken, reset_expires: resetExpires });

  // For testing / in-app flow convenience, return the token in response
  res.json({
    message: 'Password reset code generated.',
    resetCode: resetToken, // Provided directly for immediate testing verification
    expiresIn: '1 hour'
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', (req, res): void => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  const user = db.findUserByEmail(email.trim());
  if (!user || user.reset_token !== resetCode.trim()) {
    res.status(400).json({ error: 'Invalid or expired reset code.' });
    return;
  }

  if (user.reset_expires && new Date(user.reset_expires).getTime() < Date.now()) {
    res.status(400).json({ error: 'Reset code has expired.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, {
    password_hash: hash,
    salt,
    reset_token: null,
    reset_expires: null,
  });

  res.json({ message: 'Password has been successfully reset. You can now login.' });
});

// POST /api/auth/switch-role - Toggle role between student and teacher for testing/management
authRouter.post('/switch-role', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const targetRole = req.body.role === 'student' ? 'student' : 'teacher';
  const updatedUser = db.updateUser(req.user!.id, { role: targetRole });
  if (!updatedUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  if (targetRole === 'teacher' && !db.getTeacherProfile(req.user!.id)) {
    db.setTeacherProfile({
      user_id: req.user!.id,
      title_specialty: 'Academic Faculty & Assessment Coordinator',
      institution: 'Batch 99 Academic Committee',
      bio: 'Faculty & Assessment Coordinator',
      verified: true,
    });
  }
  const token = generateToken(updatedUser);
  res.json({ user: updatedUser, token, message: `Switched to ${targetRole} mode successfully.` });
});


import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type User } from '../db.ts';
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

// POST /api/auth/register
authRouter.post('/register', (req, res): void => {
  const {
    role,
    email,
    password,
    confirmPassword,
    fullName,
    displayName,
    // Student fields
    medicalSchoolYear,
    university,
    targetExam,
    // Teacher fields
    titleSpecialty,
    institution,
  } = req.body;

  // Validation
  if (!role || !['student', 'teacher'].includes(role)) {
    res.status(400).json({ error: 'Role must be either student or teacher.' });
    return;
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
    return;
  }

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
    res.status(400).json({ error: 'Display name is required (at least 2 characters).' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  // Check uniqueness
  const existingUser = db.findUserByEmail(email.trim());
  if (existingUser) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  // Role-specific validation
  if (role === 'student' && !medicalSchoolYear) {
    res.status(400).json({ error: 'Medical school year is required for student registration.' });
    return;
  }

  if (role === 'teacher' && (!titleSpecialty || !institution)) {
    res.status(400).json({ error: 'Academic title/specialty and institution are required for teacher registration.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const userId = `usr_${role}_${crypto.randomUUID()}`;

  const newUser: User = {
    id: userId,
    email: email.trim().toLowerCase(),
    password_hash: hash,
    salt: salt,
    role,
    full_name: fullName.trim(),
    display_name: displayName.trim(),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createUser(newUser);

  if (role === 'student') {
    db.setStudentProfile({
      user_id: userId,
      medical_school_year: medicalSchoolYear || 'MS1',
      university: university?.trim() || '',
      target_exam: targetExam?.trim() || 'USMLE Step 1',
    });
  } else if (role === 'teacher') {
    db.setTeacherProfile({
      user_id: userId,
      title_specialty: titleSpecialty.trim(),
      institution: institution.trim(),
      verified: true, // auto-verified for registered teacher
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
    const existing = db.getStudentProfile(user.id) || { user_id: user.id, medical_school_year: 'MS1' };
    db.setStudentProfile({
      ...existing,
      medical_school_year: medicalSchoolYear || existing.medical_school_year,
      university: university !== undefined ? university.trim() : existing.university,
      bio: bio !== undefined ? bio.trim() : existing.bio,
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

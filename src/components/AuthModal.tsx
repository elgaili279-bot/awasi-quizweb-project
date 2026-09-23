import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, GraduationCap, Stethoscope, Building, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlawasiLogo } from './AlawasiLogo';

export const AuthModal: React.FC = () => {
  const { authModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login, register } = useAuth();

  // Common Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Student specific
  const [medicalSchoolYear, setMedicalSchoolYear] = useState('MS2');
  const [university, setUniversity] = useState('');
  const [targetExam, setTargetExam] = useState('USMLE Step 1');

  // Teacher specific
  const [titleSpecialty, setTitleSpecialty] = useState('');
  const [institution, setInstitution] = useState('');

  // Forgot password
  const [resetCode, setResetCode] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
  };

  const handleModeSwitch = (mode: 'login' | 'register-student' | 'register-teacher' | 'forgot-password') => {
    resetForm();
    setAuthModalMode(mode);
    setResetStep(1);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        role: 'student',
        email: email.trim(),
        password,
        confirmPassword,
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        medicalSchoolYear,
        university: university.trim(),
        targetExam,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        role: 'teacher',
        email: email.trim(),
        password,
        confirmPassword,
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        titleSpecialty: titleSpecialty.trim(),
        institution: institution.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccess(res.message);
      if (res.resetCode) {
        setResetCode(res.resetCode);
      }
      setResetStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to request reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.resetPassword({
        email: email.trim(),
        resetCode: resetCode.trim(),
        newPassword: password,
        confirmPassword,
      });
      setSuccess(res.message);
      setTimeout(() => {
        handleModeSwitch('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill admin credentials for immediate testing
  const fillAdminCredentials = () => {
    setEmail('admin@medpulse.edu');
    setPassword('AdminPass123!');
    handleModeSwitch('login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-ivory border border-smoke/30">
              <AlawasiLogo variant="emblem" className="w-10 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {authModalMode === 'login' && 'Sign In to AWASI QIUZWEB'}
                {authModalMode === 'register-student' && 'Student Registration'}
                {authModalMode === 'register-teacher' && 'Faculty & Educator Registration'}
                {authModalMode === 'forgot-password' && 'Reset Account Password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authModalMode === 'login' && 'Access clinical question banks and progress tracking'}
                {authModalMode === 'register-student' && 'Join your medical peers preparing for board examinations'}
                {authModalMode === 'register-teacher' && 'Create accredited medical quizzes and track student mastery'}
                {authModalMode === 'forgot-password' && 'Enter your verified account email to recover access'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers if in auth flow */}
        {authModalMode !== 'forgot-password' && (
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100/70 dark:bg-slate-800/60 mx-6 mt-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => handleModeSwitch('login')}
              className={`py-2 rounded-lg transition ${
                authModalMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-amber-400 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleModeSwitch('register-student')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                authModalMode === 'register-student'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-amber-400 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Student
            </button>
            <button
              onClick={() => handleModeSwitch('register-teacher')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                authModalMode === 'register-teacher'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-amber-400 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Faculty
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@medical.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot-password')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-midnight font-bold dark:text-amber-400 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>

              {/* Admin demo auto-fill */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  Test with Pre-configured Platform Admin
                </button>
              </div>
            </form>
          )}

          {/* 2. STUDENT REGISTRATION */}
          {authModalMode === 'register-student' && (
            <form onSubmit={handleStudentRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane D."
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@medschool.edu"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Medical School Year
                  </label>
                  <select
                    value={medicalSchoolYear}
                    onChange={(e) => setMedicalSchoolYear(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="MS1">MS1 (First Year)</option>
                    <option value="MS2">MS2 (Pre-Clinical)</option>
                    <option value="MS3">MS3 (Clinical Clerkships)</option>
                    <option value="MS4">MS4 (Senior / Sub-I)</option>
                    <option value="Intern">Medical Intern (PGY-1)</option>
                    <option value="Resident">Resident Physician (PGY-2+)</option>
                    <option value="Fellow">Clinical Fellow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Board Exam
                  </label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="USMLE Step 1">USMLE Step 1</option>
                    <option value="USMLE Step 2 CK">USMLE Step 2 CK</option>
                    <option value="COMLEX Level 1">COMLEX Level 1</option>
                    <option value="COMLEX Level 2 CE">COMLEX Level 2 CE</option>
                    <option value="PLAB Part 1 / UKMLA">PLAB 1 / UKMLA</option>
                    <option value="AMC MCQ">AMC MCQ Examination</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  University / Medical School (Optional)
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Harvard Medical School"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (Min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* 3. TEACHER / FACULTY REGISTRATION */}
          {authModalMode === 'register-teacher' && (
            <form onSubmit={handleTeacherRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Gregory House"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name & Title
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. House, MD"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@teachinghospital.edu"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Title & Specialty
                  </label>
                  <input
                    type="text"
                    required
                    value={titleSpecialty}
                    onChange={(e) => setTitleSpecialty(e.target.value)}
                    placeholder="e.g. Assoc. Prof of Cardiology"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hospital / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Johns Hopkins Medicine"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (Min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Registering Faculty...' : 'Complete Faculty Registration'}
              </button>
            </form>
          )}

          {/* 4. FORGOT & RESET PASSWORD */}
          {authModalMode === 'forgot-password' && (
            <div className="space-y-4">
              {resetStep === 1 ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@medical.edu"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-white font-semibold rounded-xl text-sm transition"
                  >
                    {isSubmitting ? 'Generating Code...' : 'Send Password Reset Code'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      6-Digit Reset Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-1.5 text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password (Min 8 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-white font-semibold rounded-xl text-sm transition"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password & Login'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

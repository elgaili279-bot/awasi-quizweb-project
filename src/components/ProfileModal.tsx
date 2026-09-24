import React, { useState } from 'react';
import { X, User, Lock, CheckCircle2, AlertCircle, RefreshCw, GraduationCap, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser, switchRole } = useAuth();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  // Student specific
  const studentProfile = user?.role === 'student' ? (user.profile as any) : null;
  const [medicalSchoolYear, setMedicalSchoolYear] = useState(studentProfile?.medical_school_year || 'Batch 99 Member');
  const [studentId, setStudentId] = useState(studentProfile?.student_id || '');
  const [university, setUniversity] = useState(studentProfile?.university || 'University of Khartoum');
  const [academicFocus, setAcademicFocus] = useState(studentProfile?.academic_focus || 'Batch 99 Medical Curriculum');
  const [bio, setBio] = useState(user?.profile?.bio || '');

  // Teacher specific
  const teacherProfile = user?.role === 'teacher' ? (user.profile as any) : null;
  const [titleSpecialty, setTitleSpecialty] = useState(teacherProfile?.title_specialty || '');
  const [institution, setInstitution] = useState(teacherProfile?.institution || '');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        display_name: displayName.trim(),
        medical_school_year: medicalSchoolYear,
        university: university.trim(),
        academic_focus: academicFocus,
        title_specialty: titleSpecialty.trim(),
        institution: institution.trim(),
        bio: bio.trim(),
      });
      await refreshUser();
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 animate-in fade-in zoom-in-95">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">{user.email}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-amber-300 border border-blue-200 dark:border-blue-800">
                  {user.role === 'teacher' ? 'Faculty / Teacher' : user.role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  setIsSwitchingRole(true);
                  const nextRole = user.role === 'teacher' ? 'student' : 'teacher';
                  await switchRole(nextRole);
                  setSuccess(`Switched account mode to ${nextRole === 'teacher' ? 'Faculty / Teacher' : 'Student'}!`);
                } catch (err: any) {
                  setError(err.message || 'Failed to switch role');
                } finally {
                  setIsSwitchingRole(false);
                }
              }}
              disabled={isSwitchingRole}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              title={user.role === 'teacher' ? 'Switch to Student View' : 'Switch to Teacher / Faculty Workspace'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSwitchingRole ? 'animate-spin' : ''}`} />
              <span>{user.role === 'teacher' ? 'Switch to Student' : 'Switch to Teacher'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-amber-300 font-bold'
                : 'text-slate-500'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => { setActiveTab('password'); setError(null); setSuccess(null); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'password'
                ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-amber-300 font-bold'
                : 'text-slate-500'
            }`}
          >
            Change Password
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                />
              </div>
            </div>

            {user.role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Batch</label>
                    <select
                      value={medicalSchoolYear}
                      onChange={(e) => setMedicalSchoolYear(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                    >
                      <option value="Batch 99 Member">Batch 99 Member</option>
                      <option value="Batch 99 Student">Batch 99 Student</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Focus</label>
                    <input
                      type="text"
                      value={academicFocus}
                      onChange={(e) => setAcademicFocus(e.target.value)}
                      placeholder="e.g. Batch 99 Medical Modules"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty &amp; University</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                  />
                </div>
              </>
            )}

            {user.role === 'teacher' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Title</label>
                  <input
                    type="text"
                    value={titleSpecialty}
                    onChange={(e) => setTitleSpecialty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Teaching Hospital</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              {isSubmitting ? 'Saving...' : 'Update Profile Information'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (Min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              {isSubmitting ? 'Updating...' : 'Change Account Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  BookOpen,
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  Filter,
  PlusCircle,
  Archive,
  GraduationCap,
  Layers,
  Sparkles
} from 'lucide-react';
import { User, QuestionReport } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const AdminPortal: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'quizzes' | 'reports' | 'subjects'>('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  // Users Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Quizzes Moderation State
  const [quizzes, setQuizzes] = useState<any[]>([]);

  // Reports Moderation State
  const [reports, setReports] = useState<QuestionReport[]>([]);

  // Add Subject Form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('Stethoscope');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setOverview(res.metrics);
    } catch (err: any) {
      showToast(err.message || 'Failed to load administrative metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getAdminUsers({
        role: userRoleFilter || undefined,
        status: userStatusFilter || undefined,
        search: userSearch.trim() || undefined,
      });
      setUsers(res.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user accounts.', 'error');
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await api.getAdminQuizzes();
      setQuizzes(res.quizzes);
    } catch (err: any) {
      showToast(err.message || 'Failed to load quizzes for moderation.', 'error');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.getAdminReports();
      setReports(res.reports);
    } catch (err: any) {
      showToast(err.message || 'Failed to load flagged reports.', 'error');
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'quizzes') fetchQuizzes();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab, userRoleFilter, userStatusFilter]);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(userId, nextStatus);
      showToast(`User status set to ${nextStatus}`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleChangeUserRole = async (userId: string, role: string) => {
    try {
      await api.updateUserRole(userId, role);
      showToast(`User role updated to ${role}`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleModerateQuiz = async (quizId: string, status: string) => {
    try {
      await api.updateQuizModerationStatus(quizId, status);
      showToast(`Quiz status updated to ${status}`, 'success');
      fetchQuizzes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await api.updateReportStatus(reportId, status);
      showToast(`Report marked as ${status}`, 'success');
      fetchReports();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      await api.createSubject({
        name: newSubjectName.trim(),
        description: newSubjectDescription.trim(),
        icon: newSubjectIcon,
      });
      showToast(`Subject "${newSubjectName}" created successfully.`, 'success');
      setNewSubjectName('');
      setNewSubjectDescription('');
      fetchOverview();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
          <Shield className="w-3.5 h-3.5" />
          AWASI QIUZWEB System Administration
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
          Administrator Operations Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Governance, institutional accounts, curriculum moderation, and peer-reported medical item audit.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'quizzes'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Quizzes Moderation
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Reported Items ({overview?.pending_reports_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'subjects'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Add Subjects
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading admin KPIs...</p>
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Users</span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{overview.total_users}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {overview.students_count} students • {overview.teachers_count} teachers
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Quizzes</span>
                  <p className="text-3xl font-extrabold text-purple-600 mt-1">{overview.total_quizzes}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{overview.published_quizzes} currently published</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Questions Bank</span>
                  <p className="text-3xl font-extrabold text-blue-600 mt-1">{overview.total_questions}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Clinical items authored</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Student Attempts</span>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">{overview.total_attempts}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Avg score: {overview.platform_average_score}%</p>
                </div>
              </div>

              {/* Quick Curriculum Utility */}
              <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Demonstration & Verification Curriculum
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Load a verified USMLE Step 2 CK emergency & acute cardiology examination with board-style clinical vignettes.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.seedSampleQuiz();
                      showToast(res.message, 'success');
                      fetchOverview();
                    } catch (e: any) {
                      showToast(e.message, 'error');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
                >
                  Seed High-Yield Board Exam
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name, email, or display name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher / Faculty</option>
                <option value="admin">Administrator</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Affiliation / Standing</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border-none font-semibold capitalize"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {u.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {u.role === 'student' && u.profile && (
                          <span>{(u.profile as any).medical_school_year} • {(u.profile as any).university || 'N/A'}</span>
                        )}
                        {u.role === 'teacher' && u.profile && (
                          <span>{(u.profile as any).title_specialty} • {(u.profile as any).institution}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            u.status === 'active'
                              ? 'border-rose-300 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUIZZES MODERATION */}
      {activeTab === 'quizzes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title & Subject</th>
                  <th className="py-3 px-4">Authoring Faculty</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-center">Attempts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{q.title}</p>
                        <p className="text-[11px] text-slate-500">{q.subject_name} • {q.difficulty}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{q.creator_name}</p>
                      <p className="text-[10px] text-slate-400">{q.creator_email}</p>
                    </td>

                    <td className="py-3 px-4 text-center font-bold">{q.question_count}</td>
                    <td className="py-3 px-4 text-center font-bold">{q.attempts_count}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'draft'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5">
                      {q.status !== 'published' && (
                        <button
                          onClick={() => handleModerateQuiz(q.id, 'published')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                        >
                          Publish
                        </button>
                      )}
                      {q.status === 'published' && (
                        <button
                          onClick={() => handleModerateQuiz(q.id, 'unpublished')}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleModerateQuiz(q.id, 'archived')}
                        className="px-2 py-1 border border-slate-200 dark:border-slate-800 text-slate-600 rounded text-[11px] hover:bg-slate-100"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTED QUESTIONS */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Flagged Item Queue
            </h3>
            <span className="text-xs text-slate-400">{reports.length} total reports</span>
          </div>

          {reports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No reported questions. All items clear!
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600 uppercase text-[10px] bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                        {r.reason}
                      </span>
                      <span className="text-slate-400">• Reported by {r.reporter_name}</span>
                    </div>

                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        r.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Question: "{r.question_prompt}"
                  </p>
                  {r.details && (
                    <p className="text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg">
                      Student Feedback: "{r.details}"
                    </p>
                  )}

                  {r.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        onClick={() => handleUpdateReport(r.id, 'dismissed')}
                        className="px-3 py-1 text-slate-600 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleUpdateReport(r.id, 'resolved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUBJECT MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm max-w-xl">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New Medical Subject</h3>
            <p className="text-xs text-slate-500">Create new medical specialties for curriculum tagging.</p>
          </div>

          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Dermatology"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={newSubjectDescription}
                onChange={(e) => setNewSubjectDescription(e.target.value)}
                placeholder="Clinical description of the curriculum module..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Add Medical Subject
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

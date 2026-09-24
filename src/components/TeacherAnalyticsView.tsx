import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingDown,
  AlertTriangle,
  Users,
  Brain,
  HelpCircle,
  Sparkles,
  BookOpen,
  Mail,
  Shield,
  Plus,
  X,
  CheckCircle,
  PieChart,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TeacherAnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [rescueGroups, setRescueGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'batch' | 'questions' | 'cohorts'>('batch');

  // Modal State for Rescue/Review Group
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupSubjectId, setGroupSubjectId] = useState('');
  const [groupSchedule, setGroupSchedule] = useState('');
  const [groupNotes, setGroupNotes] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Direct confidential support message
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [targetStudent, setTargetStudent] = useState<any>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportTitle, setSupportTitle] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [batchRes, cohortRes, groupRes] = await Promise.all([
        api.getBatchAnalytics(),
        api.getStudentPerformanceCohorts(),
        api.getRescueGroups(),
      ]);
      setAnalytics(batchRes);
      setCohorts(cohortRes.cohorts || []);
      setRescueGroups(groupRes.rescue_groups || []);
    } catch (err) {
      console.error('Failed to load batch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await api.createRescueGroup({
        title: groupTitle.trim(),
        description: groupDescription.trim(),
        subject_id: groupSubjectId || undefined,
        student_ids: selectedStudentIds,
        meeting_schedule: groupSchedule.trim(),
        notes: groupNotes.trim(),
      });
      setShowGroupModal(false);
      setGroupTitle('');
      setGroupDescription('');
      setSelectedStudentIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create revision group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent || !supportMessage.trim()) return;

    try {
      setIsSendingMessage(true);
      await api.sendSupportMessage({
        student_id: targetStudent.student_id,
        title: supportTitle.trim() || 'Confidential Faculty Academic Support',
        message: supportMessage.trim(),
      });
      setShowMessageModal(false);
      setSupportMessage('');
      setSupportTitle('');
      alert('Support message dispatched privately to student notification inbox.');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-100 rounded-xl"></div>
          <div className="h-28 bg-slate-100 rounded-xl"></div>
          <div className="h-28 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-blue-900/60 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                Batch 99 Diagnostic Analytics
              </span>
              <span className="text-xs text-blue-300">Faculty & Academic Coordinator Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Batch Academic Performance & Weak Areas
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Detect curriculum topics causing widespread difficulty, inspect missed clinical questions, and privately assist struggling students.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
            <div className="text-center px-3 py-1">
              <div className="text-2xl font-black text-amber-300">
                {analytics?.overall_batch_average || 0}%
              </div>
              <div className="text-[11px] text-slate-300 font-medium">Batch Average</div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center px-3 py-1">
              <div className="text-2xl font-black text-blue-400">
                {analytics?.total_students_active || 0}
              </div>
              <div className="text-[11px] text-slate-300 font-medium">Active Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'batch'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Subject & Batch Overview
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Frequently Missed Questions ({analytics?.frequently_missed_questions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'cohorts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Confidential Cohorts & Support Groups
          </button>
        </div>
      </div>

      {/* TAB 1: Batch & Subject Overview */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total Assessments Scored
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analytics?.total_attempts_recorded || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Across all medical subjects</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Identified High-Yield Weak Topics
              </div>
              <div className="text-2xl font-black text-amber-600">
                {analytics?.batch_level_weak_areas?.length || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Topics with error rates &gt; 40%</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Faculty Support Groups
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {rescueGroups.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Active review sessions</div>
            </div>
          </div>

          {/* Subject-by-Subject Breakdown Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Subject Performance Spectrum (All Disciplines)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics?.subject_breakdowns?.map((sub: any) => {
                const isWeak = sub.average_score < 70 && sub.total_attempts > 0;
                return (
                  <div
                    key={sub.subject_id}
                    className={`p-4 rounded-xl border transition-colors ${
                      isWeak
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{sub.subject_name}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        sub.average_score >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.average_score >= 70
                          ? 'bg-blue-100 text-blue-800'
                          : sub.total_attempts === 0
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.total_attempts > 0 ? `${sub.average_score}% Avg` : 'No Attempts'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Attempts Logged:</span>
                        <strong className="text-slate-800">{sub.total_attempts}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Quizzes Published:</span>
                        <strong className="text-slate-800">{sub.quizzes_count}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Students Tested:</span>
                        <strong className="text-slate-800">{sub.active_students_count}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full ${
                          sub.average_score >= 80 ? 'bg-emerald-500' : sub.average_score >= 70 ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, sub.average_score || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Frequently Missed Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            These questions have the highest incorrect rates among Batch 99 students. Faculty can review the question prompts, explanations, and learning points to target lecture reviews.
          </div>

          <div className="space-y-3">
            {analytics?.frequently_missed_questions?.map((q: any) => (
              <div
                key={q.question_id}
                className="bg-white rounded-2xl border border-red-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                      {q.incorrect_rate}% Incorrect Rate
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-800">
                      {q.subject_name}
                    </span>
                    {q.topic_name && (
                      <span className="text-[11px] text-slate-500">
                        • {q.topic_name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    Attempted {q.total_answers} times ({q.incorrect_count} errors)
                  </span>
                </div>

                <h4 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                  {q.prompt}
                </h4>

                {q.explanation && (
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-amber-950 font-bold block mb-1">Clinical Teaching Note / Explanation:</strong>
                    {q.explanation}
                    {q.learning_point && (
                      <div className="mt-2 pt-2 border-t border-amber-200/60 font-medium text-amber-900">
                        Key Point: {q.learning_point}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Confidential Cohorts & Support Groups */}
      {activeTab === 'cohorts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confidential Faculty Cohort Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize supportive review groups and send direct private guidance to students needing assistance.
              </p>
            </div>

            <button
              onClick={() => setShowGroupModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Support / Review Group
            </button>
          </div>

          {/* Existing Rescue Groups */}
          {rescueGroups.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Revision & Support Groups ({rescueGroups.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rescueGroups.map((g) => (
                  <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{g.title}</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {g.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{g.description}</p>
                    {g.meeting_schedule && (
                      <div className="text-xs text-blue-700 font-semibold bg-blue-50 p-2 rounded-lg">
                        Schedule: {g.meeting_schedule}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Enrolled: {g.student_ids.length} student(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Cohort Performance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student Performance Spectrum (Confidential Faculty View)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Quizzes Taken</th>
                    <th className="p-3.5">First-Attempt Avg</th>
                    <th className="p-3.5">Status / Cohort</th>
                    <th className="p-3.5 text-right">Faculty Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohorts.map((student) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-bold text-slate-900">
                        {student.display_name}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {student.quizzes_completed}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-bold ${
                          student.average_score >= 80
                            ? 'text-emerald-700'
                            : student.average_score >= 65
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}>
                          {student.average_score}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          student.cohort === 'top_tier'
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.cohort === 'steady'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {student.cohort === 'needs_reinforcement' ? 'Needs Reinforcement' : student.cohort === 'top_tier' ? 'Top Tier' : 'Steady'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setTargetStudent(student);
                            setSupportTitle(`Academic Support for ${student.display_name}`);
                            setShowMessageModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg"
                        >
                          <Mail className="w-3 h-3" /> Send Private Advice
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

      {/* Create Rescue Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowGroupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Create Academic Support Group
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Schedule faculty academic review sessions for specific subjects.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Group Title</label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g., Pathology Rapid MCQ Review Workshop"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Goals, covered concepts, questions to review..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Schedule / Location</label>
                <input
                  type="text"
                  value={groupSchedule}
                  onChange={(e) => setGroupSchedule(e.target.value)}
                  placeholder="e.g., Saturday 8:00 PM (Auditorium B / Zoom)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Revision Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Confidential Support Message Modal */}
      {showMessageModal && targetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowMessageModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Send Private Academic Guidance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct, confidential message to <strong className="text-slate-700">{targetStudent.display_name}</strong>.
            </p>

            <form onSubmit={handleSendSupportMessage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Subject</label>
                <input
                  type="text"
                  value={supportTitle}
                  onChange={(e) => setSupportTitle(e.target.value)}
                  placeholder="e.g., Suggestions for Pathology and ENT Revisions"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Advice & Recommended Actions</label>
                <textarea
                  rows={5}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Write constructive, supportive academic suggestions, study references, or invitation to review sessions..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSendingMessage ? 'Sending...' : 'Send Private Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

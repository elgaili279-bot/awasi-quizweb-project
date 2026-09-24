import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  BookOpen,
  CheckCircle,
  FileEdit,
  Trash2,
  Eye,
  BarChart2,
  Clock,
  Layers,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  X,
  Radio,
  Megaphone
} from 'lucide-react';
import { Quiz } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AnnouncementsWidget } from './AnnouncementsWidget';

interface TeacherDashboardProps {
  onCreateQuiz: () => void;
  onEditQuiz: (quizId: string) => void;
  onPreviewQuiz: (quizId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onCreateQuiz,
  onEditQuiz,
  onPreviewQuiz,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats Modal
  const [selectedStatsQuizId, setSelectedStatsQuizId] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchMyQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getQuizzes({ myQuizzes: true });
      setQuizzes(res.quizzes);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuizzes();
  }, []);

  const handlePublish = async (quizId: string) => {
    try {
      const res = await api.publishQuiz(quizId);
      showToast(res.message, 'success');
      fetchMyQuizzes();
    } catch (err: any) {
      showToast(`Publishing failed: ${err.message}`, 'error');
    }
  };

  const handleUnpublish = async (quizId: string) => {
    try {
      const res = await api.unpublishQuiz(quizId);
      showToast(res.message, 'info');
      fetchMyQuizzes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (quizId: string) => {
    try {
      await api.deleteQuiz(quizId);
      showToast('Quiz deleted successfully.', 'success');
      fetchMyQuizzes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openStatsModal = async (quizId: string) => {
    setSelectedStatsQuizId(quizId);
    setStatsLoading(true);
    try {
      const res = await api.getQuizStats(quizId);
      setStatsData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load quiz statistics.', 'error');
      setSelectedStatsQuizId(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const publishedCount = quizzes.filter((q) => q.status === 'published').length;
  const draftCount = quizzes.filter((q) => q.status === 'draft').length;
  const totalAttemptsCount = quizzes.reduce((sum, q) => sum + (q.attempt_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
            Faculty & Curriculum Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Teacher Assessment Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author accredited medical quizzes, broadcast news to students, manage drafts, and monitor exam readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('alawasi-open-add-news-modal'));
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition cursor-pointer"
            title="Publish an announcement or exam alert to Batch 99 News Screen"
          >
            <Radio className="w-4 h-4 text-slate-950" />
            <span>+ Broadcast News</span>
          </button>

          <button
            onClick={onCreateQuiz}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Quiz</span>
          </button>
        </div>
      </div>

      {/* Live News Screen with Direct Teacher News Controls */}
      <AnnouncementsWidget isTeacherInterface={true} />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Authorings</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{quizzes.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">All created assessments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Published Quizzes</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{publishedCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Live for student examination</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pending Drafts</span>
            <FileEdit className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{draftCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">In curriculum preparation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Student Attempts</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-2">{totalAttemptsCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Evaluations submitted</p>
        </div>
      </div>

      {/* Quizzes List Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Your Medical Quizzes
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {quizzes.length} Quiz{quizzes.length !== 1 ? 'zes' : ''} total
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading your curriculum drafts...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs text-center">{error}</div>
        ) : quizzes.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              You haven't created any medical quizzes yet.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Build your first examination with multiple question types, clinical vignettes, and high-yield pearls.
            </p>
            <button
              onClick={onCreateQuiz}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Create First Quiz
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {quiz.status === 'published' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Published
                      </span>
                    )}
                    {quiz.status === 'draft' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Draft
                      </span>
                    )}
                    {quiz.status === 'unpublished' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        Unpublished
                      </span>
                    )}

                    <span className="text-xs text-slate-500 font-medium">
                      {quiz.subject_name} {quiz.topic_name ? `• ${quiz.topic_name}` : ''}
                    </span>
                    <span className="text-xs text-slate-400">• {quiz.difficulty}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{quiz.question_count || 0} Questions</span>
                    <span>•</span>
                    <span>{quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes} mins` : 'Untimed'}</span>
                    <span>•</span>
                    <span>{quiz.attempt_count || 0} Student Attempts</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Stats button */}
                  <button
                    onClick={() => openStatsModal(quiz.id)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    title="View Quiz Statistics"
                  >
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">Stats</span>
                  </button>

                  {/* Preview as Student */}
                  <button
                    onClick={() => onPreviewQuiz(quiz.id)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Preview Quiz as Student"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  {/* Edit in Builder */}
                  <button
                    onClick={() => onEditQuiz(quiz.id)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Edit Quiz"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Publish / Unpublish Toggle */}
                  {quiz.status === 'published' ? (
                    <button
                      onClick={() => handleUnpublish(quiz.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(quiz.id)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      Publish
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Statistics Modal */}
      {selectedStatsQuizId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Assessment Analytics
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {statsData?.title || 'Quiz Performance'}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedStatsQuizId(null); setStatsData(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statsLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Computing student metrics...</p>
              </div>
            ) : statsData ? (
              <div className="space-y-6">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Total Attempts</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {statsData.total_attempts}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Average Score</p>
                    <p className="text-2xl font-extrabold text-blue-600 mt-1">
                      {statsData.average_score}%
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Pass Rate (≥70%)</p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {statsData.pass_rate}%
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Average Time</p>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-mono text-sm">
                      {Math.floor(statsData.average_time_seconds / 60)}m {statsData.average_time_seconds % 60}s
                    </p>
                  </div>
                </div>

                {/* Per Question Difficulty Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Item Difficulty & Discrimination Breakdown
                  </h4>
                  <p className="text-xs text-slate-500">
                    Identifies questions where students struggle most (% of correct responses).
                  </p>

                  <div className="space-y-2">
                    {statsData.question_analytics.map((qa: any) => (
                      <div
                        key={qa.question_id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Item #{qa.question_number}
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              qa.accuracy_percentage >= 70
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : qa.accuracy_percentage >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {qa.accuracy_percentage}% Accuracy ({qa.correct_answers}/{qa.total_answers})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {qa.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

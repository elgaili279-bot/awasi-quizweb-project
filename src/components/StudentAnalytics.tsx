import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Trophy,
  CheckCircle2,
  Clock,
  BookOpen,
  AlertTriangle,
  Award,
  ArrowRight,
  TrendingUp,
  Flame,
  Target
} from 'lucide-react';
import { StudentAnalytics as AnalyticsType } from '../types';
import { api } from '../services/api';

interface StudentAnalyticsProps {
  onReviewAttempt: (attemptId: string) => void;
  onExploreQuizzes: () => void;
}

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({
  onReviewAttempt,
  onExploreQuizzes,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getStudentAnalytics();
        setAnalytics(res.analytics);
      } catch (err: any) {
        setError(err.message || 'Failed to load progress analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Aggregating Clinical Performance Data...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || 'Unable to load analytics.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
          Student Performance & Readiness
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Clinical Mastery Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed metrics across medical sub-disciplines, board examination readiness, and identified high-yield focus areas.
        </p>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Exams Completed</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {analytics.total_quizzes_completed}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assessed evaluations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Average Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {analytics.average_score}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all completed quizzes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Questions Answered</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            {analytics.questions_answered}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Clinical items practiced</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Overall Accuracy</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-purple-600 mt-2">
            {analytics.accuracy}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">First-attempt precision</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Subject Performance Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance by Medical Subject
              </h3>
              <span className="text-xs text-slate-400">Board exam distribution</span>
            </div>

            {analytics.subject_performance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Complete your first quiz to see subject-specific proficiency breakdowns.
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {analytics.subject_performance.map((sub) => (
                  <div key={sub.subject_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{sub.subject_name}</span>
                      <span className="font-semibold text-slate-500">
                        {sub.correct_questions} / {sub.total_questions} correct ({sub.accuracy}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.accuracy >= 75
                            ? 'bg-emerald-500'
                            : sub.accuracy >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${sub.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak Areas & Focus Topics */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Target Focus Topics (&lt;70% Accuracy)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">High-yield study opportunities identified from your mistakes</p>
              </div>
            </div>

            {analytics.weak_areas.length === 0 ? (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-amber-300 text-xs">
                Excellent! No clinical topics have fallen below 70% accuracy. Keep up the high standard!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.weak_areas.map((w) => (
                  <div
                    key={w.topic_id}
                    className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200">{w.topic_name}</span>
                      <span className="font-extrabold text-amber-700 dark:text-amber-400">{w.accuracy}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Subject: {w.subject_name} • {w.correct} of {w.total} correct
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Activity & Earned Achievements */}
        <div className="space-y-6">
          
          {/* Achievements / Milestones */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Clinical Milestones ({analytics.achievements.length})
            </h3>

            <div className="space-y-2.5">
              {analytics.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/60 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ach.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                      {ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Quiz Attempts */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Recent Evaluations
            </h3>

            {analytics.recent_activity.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No past attempts recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.recent_activity.map((rec) => (
                  <div key={rec.attempt_id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {rec.quiz_title}
                      </span>
                      <span
                        className={`font-bold ${
                          rec.percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {rec.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(rec.completed_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => onReviewAttempt(rec.attempt_id)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Review Rationale →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

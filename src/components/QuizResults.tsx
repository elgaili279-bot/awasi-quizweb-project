import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Bookmark,
  Flag,
  ArrowRight,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Share2,
  AlertCircle
} from 'lucide-react';
import { QuizAttempt, ReviewQuestion } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface QuizResultsProps {
  attemptId: string;
  onReturnToCatalog: () => void;
  onViewProgress: () => void;
  onReportQuestion: (questionId: string) => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  attemptId,
  onReturnToCatalog,
  onViewProgress,
  onReportQuestion,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');

  useEffect(() => {
    async function loadAttemptDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAttemptReview(attemptId);
        setAttempt(res.attempt);
        setQuestions(res.questions);
      } catch (err: any) {
        setError(err.message || 'Failed to load attempt review.');
      } finally {
        setLoading(false);
      }
    }

    loadAttemptDetails();
  }, [attemptId]);

  const handleToggleBookmark = async (questionId: string) => {
    try {
      const res = await api.toggleBookmark(questionId);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_bookmarked: res.is_bookmarked } : q))
      );
      showToast(res.is_bookmarked ? 'Question bookmarked' : 'Bookmark removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle bookmark.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Calculating Clinical Assessment Results...
        </p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'Could not load quiz results.'}</p>
        <button
          onClick={onReturnToCatalog}
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === 'incorrect') return !q.student_answer.is_correct;
    if (filterMode === 'correct') return q.student_answer.is_correct;
    return true;
  });

  const activeQuestion = filteredQuestions[selectedQuestionIndex] || questions[0];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  const isPassed = attempt.percentage >= 70;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner: Score & Summary */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPassed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              {isPassed ? 'Clinical Proficiency Achieved (Pass ≥70%)' : 'Needs Reinforcement (<70%)'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {attempt.quiz_title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Exam completed on {new Date(attempt.completed_at || attempt.started_at).toLocaleDateString()} at{' '}
              {new Date(attempt.completed_at || attempt.started_at).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onViewProgress}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              View My Progress
            </button>
            <button
              onClick={onReturnToCatalog}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition"
            >
              Back to Quizzes
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* Percentage */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500">Score Percentage</p>
            <p className={`text-3xl font-extrabold mt-1 ${isPassed ? 'text-blue-600 dark:text-amber-400' : 'text-amber-600'}`}>
              {attempt.percentage}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {attempt.score} of {attempt.max_score} points earned
            </p>
          </div>

          {/* Correct Answers */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500">Correct Answers</p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-3xl font-extrabold text-emerald-600">{attempt.correct_count ?? 0}</p>
              <p className="text-xs text-slate-400">/ {questions.length}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Accurate clinical judgments</p>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500">Incorrect / Missed</p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-3xl font-extrabold text-rose-600">{attempt.incorrect_count ?? 0}</p>
              <p className="text-xs text-slate-400">/ {questions.length}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">High-yield study opportunities</p>
          </div>

          {/* Time Spent */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500">Time Elapsed</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-mono">
              {formatTime(attempt.time_spent_seconds)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Exam pacing duration</p>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        
        {/* Review Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Item-by-Item Review & Rationale
            </h2>
            <p className="text-xs text-slate-500">
              Review answer choices, distractors, and faculty clinical explanations.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => { setFilterMode('all'); setSelectedQuestionIndex(0); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterMode === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-sm' : ''
              }`}
            >
              All Items ({questions.length})
            </button>
            <button
              onClick={() => { setFilterMode('incorrect'); setSelectedQuestionIndex(0); }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterMode === 'incorrect' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm' : ''
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Incorrect ({attempt.incorrect_count ?? 0})
            </button>
            <button
              onClick={() => { setFilterMode('correct'); setSelectedQuestionIndex(0); }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterMode === 'correct' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : ''
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Correct ({attempt.correct_count ?? 0})
            </button>
          </div>
        </div>

        {/* Question Selector Pills */}
        <div className="flex flex-wrap gap-2 py-2">
          {filteredQuestions.map((q, idx) => {
            const isCorrect = q.student_answer.is_correct;
            const isSelected = idx === selectedQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuestionIndex(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 font-black'
                    : ''
                } ${
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {q.question_number}
              </button>
            );
          })}
        </div>

        {/* Selected Question Details */}
        {activeQuestion && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Header: Item Number, Correct / Incorrect status & Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-sm px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  Question #{activeQuestion.question_number}
                </span>

                {activeQuestion.student_answer.is_correct ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Correct (+{activeQuestion.student_answer.points_earned} pts)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    <XCircle className="w-4 h-4" />
                    Incorrect (0 pts)
                  </span>
                )}
              </div>

              {/* Bookmark & Report buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleBookmark(activeQuestion.id)}
                  className={`p-2 rounded-xl border transition ${
                    activeQuestion.is_bookmarked
                      ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-800'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={activeQuestion.is_bookmarked ? 'Saved to Bookmarks' : 'Bookmark this question'}
                >
                  <Bookmark className={`w-4 h-4 ${activeQuestion.is_bookmarked ? 'fill-amber-600' : ''}`} />
                </button>

                <button
                  onClick={() => onReportQuestion(activeQuestion.id)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Report question error or ambiguity"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                {activeQuestion.prompt}
              </h3>
            </div>

            {/* Answer Choices with Breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Answer Analysis:
              </p>
              {activeQuestion.choices.map((choice, cIdx) => {
                const letter = String.fromCharCode(65 + cIdx);
                const isSelectedByStudent = activeQuestion.student_answer.selected_choice_ids.includes(choice.id);
                const isCorrectChoice = choice.is_correct;

                let stateClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                if (isCorrectChoice) {
                  stateClass = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100';
                } else if (isSelectedByStudent && !isCorrectChoice) {
                  stateClass = 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100';
                }

                return (
                  <div
                    key={choice.id}
                    className={`p-4 rounded-2xl border-2 transition ${stateClass} space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isCorrectChoice
                              ? 'bg-emerald-600 text-white'
                              : isSelectedByStudent
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="text-sm font-medium">{choice.choice_text}</span>
                      </div>

                      {/* Tag indicator */}
                      <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold">
                        {isCorrectChoice && (
                          <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Correct Answer
                          </span>
                        )}
                        {isSelectedByStudent && !isCorrectChoice && (
                          <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Your Selection
                          </span>
                        )}
                        {isSelectedByStudent && isCorrectChoice && (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[11px]">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Per-choice distractor rationale if provided */}
                    {choice.explanation && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 pl-9">
                        {choice.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comprehensive Faculty Explanation */}
            {activeQuestion.explanation && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  Clinical Reasoning & Pathophysiology
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeQuestion.explanation}
                </p>
              </div>
            )}

            {/* High-Yield Learning Point (Clinical Pearl) */}
            {activeQuestion.learning_point && (
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  High-Yield Clinical Pearl
                </div>
                <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                  {activeQuestion.learning_point}
                </p>
              </div>
            )}

            {/* Medical Reference Citation */}
            {activeQuestion.reference && (
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Reference:</span>
                <span className="italic">{activeQuestion.reference}</span>
              </div>
            )}

            {/* Bottom Question Nav buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedQuestionIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Previous Question
              </button>
              <button
                onClick={() => setSelectedQuestionIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                disabled={selectedQuestionIndex === filteredQuestions.length - 1}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:bg-garden dark:hover:bg-blue-500 text-white disabled:opacity-40 transition"
              >
                Next Question
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

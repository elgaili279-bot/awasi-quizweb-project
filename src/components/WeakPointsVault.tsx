import React, { useState, useEffect } from 'react';
import {
  Target,
  Brain,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  Trash2,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Award,
} from 'lucide-react';
import { api } from '../services/api';

interface WeakPointItem {
  id: string;
  student_id: string;
  question_id: string;
  subject_id: string;
  subject_name: string;
  topic_name?: string;
  medical_specialty?: string;
  times_incorrect: number;
  times_correct: number;
  is_mastered: boolean;
  last_attempted_at: string;
  mastered_at?: string;
  question: {
    id: string;
    quiz_id: string;
    type: string;
    prompt: string;
    clinical_vignette?: {
      patient_age?: number;
      patient_gender?: string;
      chief_complaint?: string;
      history?: string;
      vital_signs?: Record<string, string>;
      labs?: Record<string, string>;
    };
    explanation: string;
    learning_point: string;
    reference: string;
    difficulty: string;
    choices: Array<{
      id: string;
      choice_text: string;
      is_correct: boolean;
      explanation?: string;
    }>;
  };
}

export const WeakPointsVault: React.FC = () => {
  const [weakPoints, setWeakPoints] = useState<WeakPointItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'mastered'>('active');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Interactive Retry State
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>({});
  const [retryResults, setRetryResults] = useState<Record<string, { is_correct: boolean; explanation: string; learning_point: string }>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const fetchWeakPoints = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getWeakPoints();
      setWeakPoints(res.weak_points || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load personal revision vault.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeakPoints();
  }, []);

  const handleToggleMastered = async (questionId: string, currentMastered: boolean) => {
    try {
      await api.toggleWeakPointMastery(questionId, !currentMastered);
      setWeakPoints(prev =>
        prev.map(wp =>
          wp.question_id === questionId
            ? { ...wp, is_mastered: !currentMastered, mastered_at: !currentMastered ? new Date().toISOString() : undefined }
            : wp
        )
      );
    } catch (err: any) {
      alert(err.message || 'Error updating mastery status');
    }
  };

  const handleRemove = async (questionId: string) => {
    if (!confirm('Remove this question from your mistake vault?')) return;
    try {
      await api.deleteWeakPoint(questionId);
      setWeakPoints(prev => prev.filter(wp => wp.question_id !== questionId));
    } catch (err: any) {
      alert(err.message || 'Error deleting weak point');
    }
  };

  const handleSelectChoice = (questionId: string, choiceId: string, isMulti: boolean) => {
    setSelectedChoices(prev => {
      const current = prev[questionId] || [];
      if (isMulti) {
        return {
          ...prev,
          [questionId]: current.includes(choiceId) ? current.filter(id => id !== choiceId) : [...current, choiceId],
        };
      } else {
        return {
          ...prev,
          [questionId]: [choiceId],
        };
      }
    });
  };

  const handleRetrySubmit = async (questionId: string) => {
    const selected = selectedChoices[questionId] || [];
    if (selected.length === 0) {
      alert('Please select an answer choice.');
      return;
    }

    try {
      setIsEvaluating(true);
      const res = await api.retryWeakPointQuestion(questionId, selected);
      setRetryResults(prev => ({
        ...prev,
        [questionId]: {
          is_correct: res.is_correct,
          explanation: res.explanation,
          learning_point: res.learning_point,
        },
      }));

      // Update count locally
      setWeakPoints(prev =>
        prev.map(wp => {
          if (wp.question_id === questionId) {
            const newCorrect = res.is_correct ? wp.times_correct + 1 : wp.times_correct;
            const newIncorrect = !res.is_correct ? wp.times_incorrect + 1 : wp.times_incorrect;
            const isNowMastered = newCorrect >= 2;
            return {
              ...wp,
              times_correct: newCorrect,
              times_incorrect: newIncorrect,
              is_mastered: isNowMastered ? true : wp.is_mastered,
            };
          }
          return wp;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Error submitting answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Subjects extracted from student's actual mistakes
  const availableSubjects = Array.from(new Set(weakPoints.map(w => w.subject_name).filter(Boolean)));

  const filteredPoints = weakPoints.filter(wp => {
    if (activeFilter === 'active' && wp.is_mastered) return false;
    if (activeFilter === 'mastered' && !wp.is_mastered) return false;
    if (selectedSubject !== 'all' && wp.subject_name !== selectedSubject) return false;
    return true;
  });

  const activeCount = weakPoints.filter(w => !w.is_mastered).length;
  const masteredCount = weakPoints.filter(w => w.is_mastered).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                Active Recall Vault
              </span>
              <span className="text-xs text-blue-200">Personal Mistake Database</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Weak Points & Active Revision
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Every incorrect exam question is automatically collected here. Review clinical explanations, retry questions until mastered, and build long-term retention.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-xs">
            <div className="text-center px-3 py-1">
              <div className="text-2xl font-black text-amber-300">{activeCount}</div>
              <div className="text-[11px] text-slate-300 font-medium">Active Revisions</div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center px-3 py-1">
              <div className="text-2xl font-black text-emerald-400">{masteredCount}</div>
              <div className="text-[11px] text-slate-300 font-medium">Mastered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Subject Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeFilter === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Needs Practice ({activeCount})
          </button>
          <button
            onClick={() => setActiveFilter('mastered')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeFilter === 'mastered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mastered ({masteredCount})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Vault ({weakPoints.length})
          </button>
        </div>

        {availableSubjects.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              aria-label="Filter mistakes by Subject"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects ({weakPoints.length})</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-6 bg-slate-100 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-10 bg-slate-50 rounded"></div>
                <div className="h-10 bg-slate-50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPoints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {activeFilter === 'active' ? 'No Active Mistakes in Vault!' : 'No Weak Points in Selected Filter'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeFilter === 'active'
              ? 'Great job! As you take quizzes and timed mock exams, any questions answered incorrectly will automatically be stored here for active repetition.'
              : 'Complete more assessments to populate your personal revision dashboard.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPoints.map((wp) => {
            const q = wp.question;
            const isRetrying = activeQuestionId === wp.question_id;
            const retryResult = retryResults[wp.question_id];
            const currentSelected = selectedChoices[wp.question_id] || [];

            return (
              <div
                key={wp.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  wp.is_mastered
                    ? 'border-emerald-200/80 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {wp.subject_name}
                    </span>
                    {wp.topic_name && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                        {wp.topic_name}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-500" /> Missed {wp.times_incorrect}x
                    </span>
                    {wp.times_correct > 0 && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Correct {wp.times_correct}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleMastered(wp.question_id, wp.is_mastered)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        wp.is_mastered
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {wp.is_mastered ? 'Mastered' : 'Mark Mastered'}
                    </button>
                    <button
                      onClick={() => handleRemove(wp.question_id)}
                      title="Remove from vault"
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 md:p-5">
                  {/* Clinical Vignette if present */}
                  {q.clinical_vignette && (
                    <div className="mb-3.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-800 leading-relaxed">
                      <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" /> Clinical Vignette
                      </div>
                      {q.clinical_vignette.history && <p className="mb-1">{q.clinical_vignette.history}</p>}
                      {q.clinical_vignette.chief_complaint && (
                        <p className="font-medium text-slate-700">Chief Complaint: {q.clinical_vignette.chief_complaint}</p>
                      )}
                    </div>
                  )}

                  {/* Prompt */}
                  <h4 className="text-sm md:text-base font-bold text-slate-900 mb-4 leading-snug">
                    {q.prompt}
                  </h4>

                  {/* Active Retry Mode vs Direct Answer View */}
                  {isRetrying ? (
                    <div className="space-y-2 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Select your answer to test recall:</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {q.type === 'multi_select' ? 'Multiple choice' : 'Single best answer'}
                        </span>
                      </div>
                      {q.choices.map((choice) => {
                        const isSelected = currentSelected.includes(choice.id);
                        return (
                          <div
                            key={choice.id}
                            onClick={() => handleSelectChoice(wp.question_id, choice.id, q.type === 'multi_select')}
                            className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{choice.choice_text}</span>
                            <div
                              className={`w-4 h-4 rounded-${q.type === 'multi_select' ? 'md' : 'full'} border flex items-center justify-center ${
                                isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-end gap-2 pt-3">
                        <button
                          onClick={() => {
                            setActiveQuestionId(null);
                            setRetryResults(prev => {
                              const copy = { ...prev };
                              delete copy[wp.question_id];
                              return copy;
                            });
                          }}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRetrySubmit(wp.question_id)}
                          disabled={isEvaluating}
                          className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isEvaluating ? 'Evaluating...' : 'Check Answer'}
                        </button>
                      </div>

                      {/* Retry Result Feedback */}
                      {retryResult && (
                        <div
                          className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                            retryResult.is_correct
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-red-50 border-red-300 text-red-900'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5 mb-1">
                            {retryResult.is_correct ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Correct! Progress recorded towards mastery.
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-600" />
                                Incorrect. Review explanation below.
                              </>
                            )}
                          </div>
                          <p className="text-slate-700 mt-1">{retryResult.explanation || q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Choices with Correct Answer highlighted */}
                      <div className="space-y-1.5 mb-4">
                        {q.choices.map((choice) => (
                          <div
                            key={choice.id}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                              choice.is_correct
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600'
                            }`}
                          >
                            <span>{choice.choice_text}</span>
                            {choice.is_correct && (
                              <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation and Learning Point Box */}
                      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/70 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                            <Lightbulb className="w-4 h-4 text-amber-600" />
                            Clinical Explanation
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {q.explanation || 'Refer to the curriculum notes for detailed mechanism.'}
                          </p>
                        </div>

                        {q.learning_point && (
                          <div className="pt-2 border-t border-amber-200/50">
                            <span className="text-[11px] font-bold text-amber-950">Key Learning Point: </span>
                            <span className="text-xs text-slate-800">{q.learning_point}</span>
                          </div>
                        )}

                        {q.reference && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Reference: {q.reference}
                          </div>
                        )}
                      </div>

                      {/* Action to test active recall */}
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setActiveQuestionId(wp.question_id);
                            setSelectedChoices(prev => ({ ...prev, [wp.question_id]: [] }));
                            setRetryResults(prev => {
                              const copy = { ...prev };
                              delete copy[wp.question_id];
                              return copy;
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Test Active Recall (Retry)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

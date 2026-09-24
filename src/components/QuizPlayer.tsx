import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  Activity,
  Layers,
  CheckSquare,
  Square,
  CheckCircle2,
  X
} from 'lucide-react';
import { Quiz, Question, QuizAttempt } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface QuizPlayerProps {
  quizId: string;
  onQuizFinished: (attemptId: string) => void;
  onExit: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onQuizFinished, onExit }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({}); // question_id -> selected_choice_ids
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Initialize quiz and attempt
  useEffect(() => {
    let isMounted = true;

    async function initQuiz() {
      setLoading(true);
      setError(null);
      try {
        const [quizData, attemptRes] = await Promise.all([
          api.getQuizById(quizId),
          api.startAttempt(quizId),
        ]);

        if (!isMounted) return;

        setQuiz(quizData.quiz);
        setQuestions(quizData.questions);
        setAttemptId(attemptRes.attempt_id);

        if (quizData.quiz.time_limit_minutes > 0) {
          setSecondsRemaining(quizData.quiz.time_limit_minutes * 60);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to start quiz attempt.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initQuiz();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  // Timer Tick
  useEffect(() => {
    if (loading || !attemptId) return;

    timerRef.current = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);

      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer expired: trigger submit
          clearInterval(timerRef.current!);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, attemptId]);

  const handleSelectChoice = (questionId: string, choiceId: string, type: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'multi_select') {
        const next = current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId];
        return { ...prev, [questionId]: next };
      } else {
        // Single Best Answer / True-False: single pick
        return { ...prev, [questionId]: [choiceId] };
      }
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleForceSubmit = async () => {
    if (isSubmitting || !attemptId) return;
    setIsSubmitting(true);
    try {
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_choice_ids: answers[q.id] || [],
      }));

      const res = await (api.submitAttempt as any)(attemptId, {
        answers: answersPayload,
        time_spent_seconds: timeSpentSeconds,
        flagged_question_ids: Array.from(markedForReview),
      });

      onQuizFinished(res.attempt.id);
    } catch (err: any) {
      showToast(err.message || 'Error submitting assessment.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleSubmitConfirm = async () => {
    setShowSubmitModal(false);
    await handleForceSubmit();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Preparing Medical Exam Environment...
        </p>
        <p className="text-xs text-slate-500">Retrieving questions and initialising timed assessment</p>
      </div>
    );
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Start Assessment</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || 'This quiz has no questions available.'}</p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswers = answers[currentQ.id] || [];
  const isCurrentMarked = markedForReview.has(currentQ.id);

  const answeredCount = Object.keys(answers).filter((k) => (answers[k] || []).length > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = markedForReview.size;

  // Format Timer
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      
      {/* Top Header / Exam Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your current progress will not be saved.')) {
                onExit();
              }
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Exit Exam"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {quiz.title}
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>{quiz.subject_name}</span>
              <span>•</span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </p>
          </div>
        </div>

        {/* Timer & Submit Action */}
        <div className="flex items-center gap-3 sm:gap-4">
          {secondsRemaining !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider ${
                secondsRemaining < 120
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse border border-rose-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          )}

          <button
            onClick={() => toggleMarkForReview(currentQ.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isCurrentMarked
                ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isCurrentMarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{isCurrentMarked ? 'Marked' : 'Mark for Review'}</span>
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Examination Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left 3 Cols: Question & Choices */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Question Meta Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-garden text-midnight dark:bg-slate-700 dark:text-ivory border border-blue-500/40">
                Item #{currentIndex + 1}
              </span>
              <span className="text-xs text-slate-500 capitalize">
                {currentQ.type === 'sba' && 'Single Best Answer (Select one)'}
                {currentQ.type === 'multi_select' && 'Multiple Select (Select all that apply)'}
                {currentQ.type === 'true_false' && 'True / False Evaluation'}
                {currentQ.type === 'clinical_vignette' && 'Clinical Vignette Scenario'}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {currentQ.points || 1} Point{(currentQ.points || 1) > 1 ? 's' : ''}
            </span>
          </div>

          {/* Clinical Vignette Case Card if Present */}
          {currentQ.clinical_vignette && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-garden/25 dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Activity className="w-5 h-5 text-slate-500 dark:text-slate-400 dark:text-moss" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Patient Clinical Profile
                </h3>
              </div>

              {/* Patient Demographics */}
              {(currentQ.clinical_vignette.patient_age || currentQ.clinical_vignette.patient_sex || currentQ.clinical_vignette.chief_complaint) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                  {currentQ.clinical_vignette.patient_age && (
                    <div>
                      <span className="text-slate-400">Age: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentQ.clinical_vignette.patient_age} years</span>
                    </div>
                  )}
                  {currentQ.clinical_vignette.patient_sex && (
                    <div>
                      <span className="text-slate-400">Sex: </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentQ.clinical_vignette.patient_sex}</span>
                    </div>
                  )}
                  {currentQ.clinical_vignette.chief_complaint && (
                    <div className="sm:col-span-3">
                      <span className="text-slate-400">Chief Complaint: </span>
                      <span className="font-semibold text-blue-700 dark:text-amber-300 font-semibold">"{currentQ.clinical_vignette.chief_complaint}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Clinical History */}
              {currentQ.clinical_vignette.history && (
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">History of Present Illness: </span>
                  {currentQ.clinical_vignette.history}
                </div>
              )}

              {/* Physical Exam findings */}
              {currentQ.clinical_vignette.examination && (
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">Physical Examination: </span>
                  {currentQ.clinical_vignette.examination}
                </div>
              )}

              {/* Laboratory & Diagnostic investigations */}
              {currentQ.clinical_vignette.laboratory && (
                <div className="p-3 bg-slate-100/80 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed">
                  <span className="font-sans font-bold text-slate-900 dark:text-white block mb-1">
                    Laboratory Diagnostics:
                  </span>
                  {currentQ.clinical_vignette.laboratory}
                </div>
              )}

              {/* Imaging Findings */}
              {currentQ.clinical_vignette.imaging && (
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">Diagnostic Imaging: </span>
                  {currentQ.clinical_vignette.imaging}
                </div>
              )}
            </div>
          )}

          {/* Question Prompt */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
              {currentQ.prompt}
            </h2>
          </div>

          {/* Answer Choices List */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
              Select Answer:
            </p>
            {currentQ.choices.map((choice, cIdx) => {
              const letter = String.fromCharCode(65 + cIdx); // A, B, C, D...
              const isSelected = currentAnswers.includes(choice.id);

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelectChoice(currentQ.id, choice.id, currentQ.type)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-start gap-4 ${
                    isSelected
                      ? 'border-midnight bg-garden/40 dark:border-slate-200 dark:border-slate-800 dark:bg-slate-700/50 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {letter}
                  </div>
                  <div className="text-sm font-medium leading-relaxed pt-0.5">
                    {choice.choice_text}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-midnight-dark dark:bg-garden dark:text-midnight dark:hover:bg-ivory transition shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-garden dark:text-midnight dark:hover:bg-ivory transition shadow-xs"
              >
                Finish & Submit
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Question Grid & Progress Palette */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 sticky top-20">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-amber-400 font-bold" />
                Item Palette
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {answeredCount}/{questions.length} answered
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-moss h-full transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {questions.map((q, idx) => {
                const isAnswered = (answers[q.id] || []).length > 0;
                const isMarked = markedForReview.has(q.id);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white dark:ring-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Marked for Review ({flaggedCount})</span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-garden dark:bg-slate-700 text-blue-600 dark:text-amber-400 font-bold flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Medical Examination?
              </h3>
              <p className="text-xs text-slate-500">
                Please review your answer completion status before final score calculation.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-amber-400 font-bold font-semibold">Answered:</span>
                <span className="font-bold text-blue-600 dark:text-amber-400 font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-600 font-semibold">Unanswered:</span>
                <span className="font-bold text-rose-600">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-600 font-semibold">Marked for Review:</span>
                <span className="font-bold text-amber-600">{flaggedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg text-center">
                Warning: You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. Unanswered questions will receive 0 points.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Back to Exam
              </button>
              <button
                onClick={handleSubmitConfirm}
                disabled={isSubmitting}
                className="py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60 shadow-md shadow-blue-600/20"
              >
                {isSubmitting ? 'Calculating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

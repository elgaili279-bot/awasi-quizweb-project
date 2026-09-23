import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  Flag,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Stethoscope
} from 'lucide-react';
import { Question, Subject } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface QuestionBankViewProps {
  onReportQuestion: (questionId: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ onReportQuestion }) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarked' | 'incorrect'>('all');

  // Expanded Questions set
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, subRes] = await Promise.all([
        api.getQuestionBank({
          subject_id: selectedSubject !== 'all' ? selectedSubject : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
          search: search.trim() || undefined,
          bookmarkedOnly: activeTab === 'bookmarked',
          incorrectOnly: activeTab === 'incorrect',
        }),
        api.getSubjects(),
      ]);

      setQuestions(qRes.questions);
      setSubjects(subRes.subjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load question repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedDifficulty, activeTab]);

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleToggleBookmark = async (questionId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.toggleBookmark(questionId);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_bookmarked: res.is_bookmarked } : q))
      );
      showToast(res.is_bookmarked ? 'Question saved to bookmarks' : 'Removed from bookmarks', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle bookmark.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
          Board-Style Medical Item Repository
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Clinical Question Bank
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search thousands of board-style medical questions, review clinical explanations, and practice active recall.
        </p>
      </div>

      {/* Tabs Switcher: All / Bookmarked / Incorrect */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Published Questions
        </button>
        <button
          onClick={() => {
            if (!user) openAuthModal('login');
            else setActiveTab('bookmarked');
          }}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'bookmarked'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Bookmarked Questions
        </button>
        <button
          onClick={() => {
            if (!user) openAuthModal('login');
            else setActiveTab('incorrect');
          }}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'incorrect'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          Previously Incorrect Items
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQuestions();
          }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by prompt, diagnostic workup, or clinical pearl..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-midnight-dark dark:bg-slate-900 dark:bg-garden dark:hover:bg-blue-500 font-semibold rounded-xl text-sm transition"
          >
            Search Items
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Level:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="USMLE Step 1">USMLE Step 1</option>
              <option value="USMLE Step 2 CK">USMLE Step 2 CK</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Searching Question Bank...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 text-rose-700 text-center text-xs">{error}</div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Questions Found</h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'bookmarked'
              ? 'You have not saved any questions yet. Bookmark questions during your quizzes to practice them here!'
              : activeTab === 'incorrect'
              ? 'Great job! You have no recorded incorrect answers matching this filter.'
              : 'Try clearing your search terms or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium pl-1">
            Displaying {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>

          {questions.map((q, idx) => {
            const isExpanded = expandedQuestions.has(q.id);

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-amber-300">
                      Item #{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {q.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className={`p-2 rounded-xl border transition ${
                        q.is_bookmarked
                          ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-800'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                      }`}
                      title={q.is_bookmarked ? 'Saved to Bookmarks' : 'Bookmark this item'}
                    >
                      <Bookmark className={`w-4 h-4 ${q.is_bookmarked ? 'fill-amber-600' : ''}`} />
                    </button>

                    <button
                      onClick={() => onReportQuestion(q.id)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 transition"
                      title="Report issue"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clinical Vignette if present */}
                {q.clinical_vignette &&
                  (q.clinical_vignette.patient_age || q.clinical_vignette.chief_complaint) && (
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/60 space-y-1.5 text-xs">
                      <p className="font-bold text-blue-800 dark:text-amber-300 uppercase tracking-wider text-[10px]">
                        Clinical Case
                      </p>
                      {q.clinical_vignette.chief_complaint && (
                        <p className="text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">Chief Complaint: </span>
                          "{q.clinical_vignette.chief_complaint}"
                        </p>
                      )}
                      {q.clinical_vignette.history && (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {q.clinical_vignette.history}
                        </p>
                      )}
                      {q.clinical_vignette.laboratory && (
                        <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          Labs: {q.clinical_vignette.laboratory}
                        </p>
                      )}
                    </div>
                  )}

                {/* Prompt */}
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {q.prompt}
                </p>

                {/* Reveal / Collapse Study Accordion */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => toggleExpand(q.id)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-amber-400 hover:text-blue-700 transition"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" /> Hide Answers & Rationale
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" /> Reveal Answer Choices & Clinical Rationale
                      </>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 pt-2">
                      {/* Choices */}
                      <div className="space-y-2">
                        {q.choices.map((c, cIdx) => {
                          const letter = String.fromCharCode(65 + cIdx);
                          return (
                            <div
                              key={c.id}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                                c.is_correct
                                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {letter}
                              </span>
                              <div className="flex-1">
                                <p>{c.choice_text}</p>
                                {c.explanation && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-normal">
                                    {c.explanation}
                                  </p>
                                )}
                              </div>
                              {c.is_correct && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Clinical Explanation */}
                      {q.explanation && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1">
                          <p className="font-bold text-blue-700 dark:text-amber-300">
                            Clinical Pathophysiology & Reasoning:
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* Learning Point */}
                      {q.learning_point && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-xs space-y-1">
                          <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> High-Yield Clinical Pearl:
                          </p>
                          <p className="text-amber-900 dark:text-amber-200 font-medium">
                            {q.learning_point}
                          </p>
                        </div>
                      )}

                      {/* Reference */}
                      {q.reference && (
                        <p className="text-[11px] text-slate-400 italic">
                          Reference: {q.reference}
                        </p>
                      )}
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

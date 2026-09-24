import React, { useState, useEffect, useCallback } from 'react';
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
  Stethoscope,
  Wifi,
  WifiOff,
  DownloadCloud,
  HardDrive,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Question, Subject } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  saveQuestionsToOfflineCache,
  getQuestionsFromOfflineCache,
  getSubjectsFromOfflineCache,
  getOfflineCacheStats,
  toggleOfflineBookmark,
  OfflineCacheStats
} from '../utils/offlineQuestionCache';

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

  // Offline state & metrics
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isServingOffline, setIsServingOffline] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<OfflineCacheStats>(getOfflineCacheStats());
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarked' | 'incorrect'>('all');

  // Expanded Questions set
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Listen to browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connection restored. Syncing question repository...', 'success');
      fetchQuestions(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsServingOffline(true);
      showToast('You are now offline. Reviewing cached questions from local storage.', 'info');
      loadFromOfflineCache();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedSubject, selectedDifficulty, search, activeTab]);

  const loadFromOfflineCache = useCallback(() => {
    const cachedSubjects = getSubjectsFromOfflineCache();
    if (cachedSubjects.length > 0) {
      setSubjects(cachedSubjects);
    }

    const { questions: cachedList, totalCached } = getQuestionsFromOfflineCache({
      subject_id: selectedSubject,
      difficulty: selectedDifficulty,
      search: search.trim() || undefined,
      bookmarkedOnly: activeTab === 'bookmarked',
      incorrectOnly: activeTab === 'incorrect',
    });

    setQuestions(cachedList);
    setIsServingOffline(true);
    setCacheStats(getOfflineCacheStats());
    setLoading(false);
  }, [selectedSubject, selectedDifficulty, search, activeTab]);

  const fetchQuestions = async (preferNetwork = true) => {
    setLoading(true);
    setError(null);

    // If browser is strictly offline, load directly from cache
    if (!navigator.onLine || !preferNetwork) {
      loadFromOfflineCache();
      return;
    }

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
      setIsServingOffline(false);

      // Persist to offline local cache for subsequent disconnected reviews
      saveQuestionsToOfflineCache(qRes.questions, subRes.subjects);
      setCacheStats(getOfflineCacheStats());
    } catch (err: any) {
      console.warn('Network request failed, falling back to local question cache:', err);
      // Fallback to offline cache
      const cached = getQuestionsFromOfflineCache({
        subject_id: selectedSubject,
        difficulty: selectedDifficulty,
        search: search.trim() || undefined,
        bookmarkedOnly: activeTab === 'bookmarked',
        incorrectOnly: activeTab === 'incorrect',
      });

      if (cached.questions.length > 0 || cached.totalCached > 0) {
        setQuestions(cached.questions);
        const cachedSubjects = getSubjectsFromOfflineCache();
        if (cachedSubjects.length > 0) setSubjects(cachedSubjects);
        setIsServingOffline(true);
        setCacheStats(getOfflineCacheStats());
      } else {
        setError(err.message || 'Failed to load question repository and no local cache is available.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedDifficulty, activeTab]);

  // Pre-download all questions for full offline coverage
  const handleDownloadAllForOffline = async () => {
    if (!isOnline) {
      showToast('Cannot download new questions while offline.', 'error');
      return;
    }

    setIsDownloadingAll(true);
    try {
      // Fetch all questions with no filters to maximize offline database
      const [allQRes, subRes] = await Promise.all([
        api.getQuestionBank({}),
        api.getSubjects(),
      ]);

      saveQuestionsToOfflineCache(allQRes.questions, subRes.subjects);
      const updatedStats = getOfflineCacheStats();
      setCacheStats(updatedStats);
      showToast(
        `Successfully cached ${updatedStats.totalCached} questions locally for 100% offline study!`,
        'success'
      );

      // Refresh current view
      fetchQuestions(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to cache questions for offline use.', 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  };

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

    const currentQ = questions.find((q) => q.id === questionId);
    const currentStatus = Boolean(currentQ?.is_bookmarked);

    // If offline or serving offline cache, update local storage immediately
    if (!isOnline || isServingOffline) {
      const newStatus = toggleOfflineBookmark(questionId, currentStatus);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_bookmarked: newStatus } : q))
      );
      showToast(
        newStatus
          ? 'Saved to bookmarks (Cached locally for offline study)'
          : 'Removed from bookmarks (Cached locally)',
        'info'
      );
      return;
    }

    try {
      const res = await api.toggleBookmark(questionId);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_bookmarked: res.is_bookmarked } : q))
      );
      toggleOfflineBookmark(questionId, currentStatus);
      showToast(res.is_bookmarked ? 'Question saved to bookmarks' : 'Removed from bookmarks', 'info');
    } catch (err: any) {
      // Fallback to local bookmarking
      const newStatus = toggleOfflineBookmark(questionId, currentStatus);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_bookmarked: newStatus } : q))
      );
      showToast('Network error: Updated bookmark in local offline cache.', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header and Offline Summary Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
              Practiced Clinical Items Repository
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <HardDrive className="w-3 h-3" />
              Offline Cache Ready
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Solved Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and search clinical vignette questions you have solved in quizzes. Explore diagnostic rationales, learning points, and bookmarks even without internet.
          </p>
        </div>

        {/* Offline Sync and Cache Management Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">
              {cacheStats.totalCached} cached
            </span>
          </div>

          <button
            onClick={handleDownloadAllForOffline}
            disabled={isDownloadingAll || !isOnline}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download and cache all your solved questions to review during hospital rounds or offline"
          >
            {isDownloadingAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Caching Repository...
              </>
            ) : (
              <>
                <DownloadCloud className="w-3.5 h-3.5" />
                Cache for Offline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Offline Mode Active Banner */}
      {(!isOnline || isServingOffline) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-400/20 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                Offline Mode Active &bull; Local Storage Cache
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                You are reviewing your solved clinical questions stored in your browser. All answer rationales, bookmarks, and search filters remain fully operational.
                {cacheStats.lastSynced && (
                  <span className="block sm:inline sm:ml-2 text-[11px] text-slate-500 dark:text-slate-400">
                    (Last synced: {new Date(cacheStats.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchQuestions(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Network
          </button>
        </div>
      )}

      {/* Tabs Switcher: All / Bookmarked / Incorrect */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 transition cursor-pointer ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Solved Questions
        </button>
        <button
          onClick={() => {
            if (!user && isOnline) openAuthModal('login');
            else setActiveTab('bookmarked');
          }}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
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
            if (!user && isOnline) openAuthModal('login');
            else setActiveTab('incorrect');
          }}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
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
            fetchQuestions(isOnline);
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
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 font-semibold rounded-xl text-sm transition cursor-pointer"
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
              <option value="Curriculum Core">Curriculum Core</option>
              <option value="Clinical Case">Clinical Case</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Beginner">Foundational</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">
            {isServingOffline ? 'Loading local question cache...' : 'Searching Question Bank...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-center text-xs space-y-2">
          <p>{error}</p>
          {cacheStats.totalCached > 0 && (
            <button
              onClick={loadFromOfflineCache}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
            >
              Load {cacheStats.totalCached} Cached Questions from Storage
            </button>
          )}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-blue-600 dark:text-amber-400">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === 'bookmarked'
              ? 'No Bookmarked Questions'
              : activeTab === 'incorrect'
              ? 'No Incorrect Questions Recorded'
              : 'No Solved Questions in Your Bank Yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {activeTab === 'bookmarked'
              ? 'You have not saved any questions yet. While practicing quizzes, tap the bookmark icon on any question to save it here for quick high-yield revision.'
              : activeTab === 'incorrect'
              ? 'Great job! You have no questions recorded with incorrect attempts matching the current filter.'
              : isServingOffline
              ? 'No solved questions are cached in your offline storage. Once you connect to the internet, your solved quiz questions will sync automatically.'
              : 'The Question Bank collects all questions you have answered in practice quizzes and mock exams. Solve questions in quizzes to unlock them here with detailed diagnostic explanations and active recall rationales.'}
          </p>
          {!user ? (
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Sign In to View Your Solved Repository
            </button>
          ) : (
            <a
              href="/quizzes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Explore Quizzes to Practice
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-1 text-xs text-slate-500 font-medium">
            <span>
              Displaying {questions.length} question{questions.length !== 1 ? 's' : ''}
              {isServingOffline && ' (Offline Local Cache)'}
            </span>
            {isServingOffline && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <HardDrive className="w-3.5 h-3.5" />
                Read from Local Storage
              </span>
            )}
          </div>

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
                      className={`p-2 rounded-xl border transition cursor-pointer ${
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
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-amber-400 hover:text-blue-700 transition cursor-pointer"
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


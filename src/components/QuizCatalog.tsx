import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  HelpCircle,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  Flame,
  Stethoscope,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { Quiz, Subject } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlawasiLogo } from './AlawasiLogo';

interface QuizCatalogProps {
  onSelectQuiz: (quizId: string) => void;
  onNavigateToTeacher: () => void;
}

export const QuizCatalog: React.FC<QuizCatalogProps> = ({ onSelectQuiz, onNavigateToTeacher }) => {
  const { user, openAuthModal } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [quizzesRes, subjectsRes] = await Promise.all([
        api.getQuizzes({
          subject_id: selectedSubject === 'all' ? undefined : selectedSubject,
          difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
          search: search.trim() || undefined,
          sort: sortBy as any
        }),
        api.getSubjects()
      ]);
      setQuizzes(quizzesRes.quizzes);
      setSubjects(subjectsRes.subjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load medical quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [selectedSubject, selectedDifficulty, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalogData();
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'USMLE Step 1':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            USMLE Step 1
          </span>
        );
      case 'USMLE Step 2 CK':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            USMLE Step 2 CK
          </span>
        );
      case 'Advanced':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Advanced
          </span>
        );
      case 'Intermediate':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            Intermediate
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Foundational
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Alawasi Official Hero Banner with Blueprint Grid & New Logo */}
      <div className="relative overflow-hidden rounded-3xl alawasi-blueprint-grid text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-blue-400/30">
        {/* Radial highlight matching brand poster */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-950/80 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand description & actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              الدفعة 99 · كلية الطب جامعة الخرطوم
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                AWASI <span className="text-amber-400">QUIZWEB</span> PLATFORM
              </h1>
              <p className="text-sky-100 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-normal">
                Board-style medical question bank, active recall examinations, and evidence-based rationale crafted for medical students and clinicians.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {user?.role === 'teacher' || user?.role === 'admin' ? (
                <button
                  onClick={onNavigateToTeacher}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-400/25"
                >
                  <PlusCircle className="w-4 h-4" />
                  Author New Medical Quiz
                </button>
              ) : !user ? (
                <button
                  onClick={() => openAuthModal('register-student')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-400/25"
                >
                  Join as Medical Student
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}

              {/* Social / Accreditation handle from the official image */}
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-950/70 border border-sky-400/30 text-xs font-bold text-sky-200">
                <span className="text-amber-400 font-black">ALAWASI</span>
                <span className="text-white/40">|</span>
                <span>UofK B99</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-fidelity Alawasi Brand Emblem Card (awasi.jpg) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm p-6 sm:p-7 rounded-3xl bg-[#1673be] border-2 border-white/30 text-center shadow-2xl flex flex-col items-center">
              {/* Official New Logo Emblem with Full Arabic Text */}
              <div className="text-white w-full">
                <AlawasiLogo variant="full" className="w-full h-auto" />
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 w-full flex items-center justify-center gap-3 text-xs text-sky-100 font-semibold">
                <span>Clinical Reasoning</span>
                <span>·</span>
                <span>USMLE Prep</span>
                <span>·</span>
                <span>Shelf Exams</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by diagnosis, clinical presentation, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-semibold rounded-xl text-sm transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Subject:
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Medical Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.quiz_count || 0})</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Level:
            </span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner / Pre-Clinical</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced Clinical</option>
              <option value="USMLE Step 1">USMLE Step 1</option>
              <option value="USMLE Step 2 CK">USMLE Step 2 CK</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Attempted</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading clinical examinations...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{error}</p>
          <button
            onClick={fetchCatalogData}
            className="px-4 py-1.5 text-xs bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : quizzes.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Medical Quizzes Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {search || selectedSubject !== 'all' || selectedDifficulty !== 'all'
                ? 'No quizzes match your selected filter criteria. Try resetting filters.'
                : 'No quizzes have been published yet by faculty educators.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            {search || selectedSubject !== 'all' || selectedDifficulty !== 'all' ? (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedSubject('all');
                  setSelectedDifficulty('all');
                }}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition"
              >
                Reset All Filters
              </button>
            ) : user?.role === 'teacher' || user?.role === 'admin' ? (
              <button
                onClick={onNavigateToTeacher}
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create and Publish First Quiz
              </button>
            ) : (
              <p className="text-xs text-slate-400">Check back soon or sign in as faculty to build assessments.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {quiz.subject_name}
                  </span>
                  {getDifficultyBadge(quiz.difficulty)}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {quiz.description || 'Comprehensive clinical questions designed to test board-relevant concepts.'}
                  </p>
                </div>

                {/* Topic if specified */}
                {quiz.topic_name && (
                  <p className="text-[11px] font-medium text-blue-700 dark:text-amber-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded inline-block">
                    Topic: {quiz.topic_name}
                  </p>
                )}
              </div>

              {/* Footer Meta & Start Button */}
              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{quiz.question_count || 0}</p>
                    <p className="text-[10px]">Questions</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes}m` : 'Untimed'}
                    </p>
                    <p className="text-[10px]">Duration</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{quiz.attempt_count || 0}</p>
                    <p className="text-[10px]">Attempts</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    <span className="text-slate-400">By </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{quiz.creator_name}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!user) {
                        openAuthModal('login');
                      } else {
                        onSelectQuiz(quiz.id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-blue-800/20 transition"
                  >
                    Start Quiz
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

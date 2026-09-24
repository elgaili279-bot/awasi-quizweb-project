import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Target,
  Building2,
  Sparkles,
  Compass,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Microscope,
  Scan,
  Eye,
  Brain,
  Bug,
  Scale,
  Activity,
  X,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { Quiz, Subject } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlawasiLogo } from './AlawasiLogo';
import { AnnouncementsWidget } from './AnnouncementsWidget';

interface QuizCatalogProps {
  onSelectQuiz: (quizId: string) => void;
  onNavigateToTeacher: () => void;
}

// Medical Specialty metadata for styling and icons
export interface SpecialtyConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  badgeBg: string;
  description: string;
}

export const MEDICAL_SPECIALTIES: SpecialtyConfig[] = [
  {
    id: 'Pathology',
    name: 'Pathology',
    icon: Microscope,
    colorBg: 'bg-purple-50 dark:bg-purple-950/40',
    colorBorder: 'border-purple-200 dark:border-purple-800',
    colorText: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    description: 'Cellular adaptation, neoplasia hallmarks, histopathology, and hemodynamic disorders'
  },
  {
    id: 'Radiology',
    name: 'Radiology',
    icon: Scan,
    colorBg: 'bg-sky-50 dark:bg-sky-950/40',
    colorBorder: 'border-sky-200 dark:border-sky-800',
    colorText: 'text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200 border-sky-300 dark:border-sky-700',
    description: 'Plain radiographs, emergency trauma CT, MRI neuro-imaging, and ultrasound'
  },
  {
    id: 'Dermatology',
    name: 'Dermatology',
    icon: ShieldCheck,
    colorBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    colorBorder: 'border-fuchsia-200 dark:border-fuchsia-800',
    colorText: 'text-fuchsia-700 dark:text-fuchsia-300',
    badgeBg: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/60 dark:text-fuchsia-200 border-fuchsia-300 dark:border-fuchsia-700',
    description: 'Primary/secondary lesions, papulosquamous diseases, and dermatological emergencies'
  },
  {
    id: 'Infectious Diseases',
    name: 'Infectious Diseases',
    icon: Bug,
    colorBg: 'bg-teal-50 dark:bg-teal-950/40',
    colorBorder: 'border-teal-200 dark:border-teal-800',
    colorText: 'text-teal-700 dark:text-teal-300',
    badgeBg: 'bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    description: 'Endemic malaria, tropical fevers, antimicrobial stewardship, and sepsis'
  },
  {
    id: 'Ophthalmology',
    name: 'Ophthalmology',
    icon: Eye,
    colorBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    colorBorder: 'border-cyan-200 dark:border-cyan-800',
    colorText: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/60 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    description: 'Red eye differential, acute glaucoma, ocular trauma, and fundoscopy'
  },
  {
    id: 'ENT',
    name: 'ENT (Otorhinolaryngology)',
    icon: Activity,
    colorBg: 'bg-pink-50 dark:bg-pink-950/40',
    colorBorder: 'border-pink-200 dark:border-pink-800',
    colorText: 'text-pink-700 dark:text-pink-300',
    badgeBg: 'bg-pink-100 text-pink-900 dark:bg-pink-900/60 dark:text-pink-200 border-pink-300 dark:border-pink-700',
    description: 'Otology, rhinosinusitis, epistaxis, and upper airway obstruction'
  },
  {
    id: 'Psychiatry & Neurology',
    name: 'Psychiatry & Neurology',
    icon: Brain,
    colorBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    colorBorder: 'border-indigo-200 dark:border-indigo-800',
    colorText: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    description: 'Mood disorders, schizophrenia, psychosis, psychopharmacology, and neurology'
  },
  {
    id: 'Medical Ethics',
    name: 'Medical Ethics',
    icon: Scale,
    colorBg: 'bg-slate-50 dark:bg-slate-900',
    colorBorder: 'border-slate-200 dark:border-slate-800',
    colorText: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    description: 'Informed consent, medical autonomy, beneficence, and medico-legal duties'
  },
  {
    id: 'Toxicology & Forensic',
    name: 'Toxicology & Forensic',
    icon: Target,
    colorBg: 'bg-violet-50 dark:bg-violet-950/40',
    colorBorder: 'border-violet-200 dark:border-violet-800',
    colorText: 'text-violet-700 dark:text-violet-300',
    badgeBg: 'bg-violet-100 text-violet-900 dark:bg-violet-900/60 dark:text-violet-200 border-violet-300 dark:border-violet-700',
    description: 'Acute clinical toxidromes, overdose protocols, and forensic traumatology'
  },
  {
    id: 'Community Medicine',
    name: 'Community Medicine',
    icon: Users,
    colorBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    colorBorder: 'border-emerald-200 dark:border-emerald-800',
    colorText: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    description: 'Epidemiology, public health, biostatistics, primary health care, and disease control'
  }
];

export const QuizCatalog: React.FC<QuizCatalogProps> = ({ onSelectQuiz, onNavigateToTeacher }) => {
  const { user, openAuthModal } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [quizzesRes, subjectsRes] = await Promise.all([
        api.getQuizzes({
          subject_id: selectedSubject === 'all' ? undefined : selectedSubject,
          specialty: selectedSpecialty === 'all' ? undefined : selectedSpecialty,
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
  }, [selectedSpecialty, selectedSubject, selectedDifficulty, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalogData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSpecialty('all');
    setSelectedSubject('all');
    setSelectedDifficulty('all');
    setSortBy('newest');
  };

  // Compute counts per medical specialty across loaded or available quizzes
  const specialtyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quizzes.forEach(q => {
      const spec = q.medical_specialty || 'General Medicine';
      counts[spec] = (counts[spec] || 0) + 1;
    });
    return counts;
  }, [quizzes]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Curriculum Core':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            Curriculum Core
          </span>
        );
      case 'Clinical Case':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Clinical Case
          </span>
        );
      case 'Advanced':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Advanced Clinical
          </span>
        );
      case 'Intermediate':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            Intermediate
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Foundational
          </span>
        );
    }
  };

  const getSpecialtyBadge = (specialtyName?: string) => {
    if (!specialtyName) return null;
    const found = MEDICAL_SPECIALTIES.find(
      s => s.id.toLowerCase() === specialtyName.toLowerCase() || s.name.toLowerCase() === specialtyName.toLowerCase()
    );
    const Icon = found?.icon || Stethoscope;
    const badgeStyle = found?.badgeBg || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${badgeStyle}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{found?.name || specialtyName}</span>
      </span>
    );
  };

  const activeFilterCount = (selectedSpecialty !== 'all' ? 1 : 0) +
    (selectedSubject !== 'all' ? 1 : 0) +
    (selectedDifficulty !== 'all' ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Official Live Announcements & Academic Alerts */}
      <AnnouncementsWidget />

      {/* ======================================================== */}
      {/* 1. MEDICAL SPECIALTY STUDY SESSION ORGANIZER BAR         */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Explore Quizzes
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter by 4th-year curriculum discipline (e.g. Pathology, Radiology, ENT, Dermatology, Ophthalmology, Psychiatry, Forensic Medicine) to streamline your revision.
            </p>
          </div>

          {/* Active Subject indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Active Subject:</span>
            <span className="font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-amber-300 border border-blue-200 dark:border-blue-800">
              {selectedSpecialty === 'all' ? 'All Subjects' : selectedSpecialty}
            </span>
          </div>
        </div>

        {/* Subject Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedSpecialty('all')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 border ${
              selectedSpecialty === 'all'
                ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 border-transparent shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Subjects</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              selectedSpecialty === 'all'
                ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {quizzes.length}
            </span>
          </button>

          {MEDICAL_SPECIALTIES.map((spec) => {
            const Icon = spec.icon;
            const isSelected = selectedSpecialty.toLowerCase() === spec.id.toLowerCase();
            const count = specialtyCounts[spec.id] || 0;

            return (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(isSelected ? 'all' : spec.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? `${spec.badgeBg} ring-2 ring-blue-500 dark:ring-amber-400 shadow-sm`
                    : `${spec.colorBg} ${spec.colorText} ${spec.colorBorder} hover:brightness-95`
                }`}
                title={spec.description}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{spec.name}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70 dark:bg-slate-900/60 font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEARCH & COMPREHENSIVE FILTER / SORT CONTROLS        */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medical specialty, diagnosis, presentation, or clinical keywords..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchCatalogData();
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>

        {/* Multi-Faceted Filters & Sorting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* 1. Medical Specialty Dropdown Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
              Medical Specialty:
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Medical Specialties</option>
              {MEDICAL_SPECIALTIES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Academic Subject Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              Curriculum Subject:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All 9 Academic Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.quiz_count || 0})</option>
              ))}
            </select>
          </div>

          {/* 3. Clinical Difficulty Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              Difficulty Level:
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Difficulties</option>
              <option value="Curriculum Core">Curriculum Core</option>
              <option value="Clinical Case">Clinical Case Vignettes</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced Clinical</option>
              <option value="Beginner">Foundational</option>
            </select>
          </div>

          {/* 4. Enhanced Sorting Options */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
              Sort Quizzes By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="specialty_asc">Medical Specialty (A → Z)</option>
              <option value="specialty_desc">Medical Specialty (Z → A)</option>
              <option value="newest">Newest First</option>
              <option value="popular">Most Attempted</option>
              <option value="difficulty_desc">Difficulty (Advanced → Core)</option>
              <option value="difficulty_asc">Difficulty (Core → Advanced)</option>
              <option value="questions_desc">Question Count (Most Questions)</option>
              <option value="duration_asc">Shortest Time Limit</option>
              <option value="duration_desc">Longest Time Limit</option>
              <option value="title_asc">Title (A → Z)</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Summary Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold">Active filters:</span>
              
              {selectedSpecialty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-medium">
                  Specialty: {selectedSpecialty}
                  <button onClick={() => setSelectedSpecialty('all')} className="hover:text-rose-950 dark:hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubject !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 font-medium">
                  Subject: {subjects.find(s => s.id === selectedSubject)?.name || selectedSubject}
                  <button onClick={() => setSelectedSubject('all')} className="hover:text-blue-950 dark:hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDifficulty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-medium">
                  Level: {selectedDifficulty}
                  <button onClick={() => setSelectedDifficulty('all')} className="hover:text-amber-950 dark:hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-slate-950 dark:hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-medium">
                  Sorted: {sortBy.replace('_', ' ')}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. QUIZZES GRID & STUDY SESSION CARDS                   */}
      {/* ======================================================== */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading medical specialty examinations...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{error}</p>
          <button
            onClick={fetchCatalogData}
            className="px-4 py-1.5 text-xs bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition cursor-pointer"
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
              {search || selectedSpecialty !== 'all' || selectedSubject !== 'all' || selectedDifficulty !== 'all'
                ? `No quizzes match the selected medical specialty (${selectedSpecialty}) or search criteria.`
                : 'No quizzes have been published yet by faculty educators.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            {search || selectedSpecialty !== 'all' || selectedSubject !== 'all' || selectedDifficulty !== 'all' ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : user?.role === 'teacher' || user?.role === 'admin' ? (
              <button
                onClick={onNavigateToTeacher}
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
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
        <div className="space-y-4">
          {/* Status Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{quizzes.length}</strong> medical study {quizzes.length === 1 ? 'module' : 'modules'}
              {selectedSpecialty !== 'all' && (
                <> in <span className="font-bold text-rose-600 dark:text-rose-400">{selectedSpecialty}</span></>
              )}
            </span>
            <span className="hidden sm:inline">
              Active Recall Mode · Batch 99 Curriculum
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-amber-400/60 p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header tags: Specialty & Difficulty */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {getSpecialtyBadge(quiz.medical_specialty || quiz.subject_name)}
                    {getDifficultyBadge(quiz.difficulty)}
                  </div>

                  {/* Subject Name Tag */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      {quiz.subject_name}
                    </span>
                    {quiz.topic_name && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        • {quiz.topic_name}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition line-clamp-2 leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                      {quiz.description || 'Comprehensive clinical vignettes designed to test board-relevant concepts.'}
                    </p>
                  </div>
                </div>

                {/* Footer Meta & Start Button */}
                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{quiz.question_count || 0}</p>
                      <p className="text-[10px]">Questions</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes}m` : 'Untimed'}
                      </p>
                      <p className="text-[10px]">Duration</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{quiz.attempt_count || 0}</p>
                      <p className="text-[10px]">Attempts</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-blue-800/20 transition cursor-pointer group-hover:scale-102"
                    >
                      <span>Start Session</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

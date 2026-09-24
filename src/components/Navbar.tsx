import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  BookOpen,
  Award,
  BarChart3,
  GraduationCap,
  Shield,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  FileQuestion,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Layers,
  Sparkles,
  LogIn,
  UserPlus,
  MessageSquare,
  Target,
  Bot,
  Home,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AlawasiLogo } from './AlawasiLogo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenProfile: () => void;
  onStartCreateQuiz?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  onOpenProfile,
  onStartCreateQuiz,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const registerMenuRef = useRef<HTMLDivElement>(null);

  // Check if current view is the landing page
  const isLandingPage = !user || currentTab === 'landing';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (registerMenuRef.current && !registerMenuRef.current.contains(event.target as Node)) {
        setRegisterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const scrollToPublicSection = (id: string) => {
    setCurrentTab('landing');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Structured Nav Groups for Student
  const studentNavGroups = [
    {
      groupTitle: 'Academic Revision',
      links: [
        { id: 'catalog', label: 'Quizzes', icon: BookOpen, badge: null },
        { id: 'qbank', label: 'Question Bank', icon: FileQuestion, badge: null },
        { id: 'weak_points', label: 'Weak Points Vault', icon: Target, badge: null },
      ],
    },
    {
      groupTitle: 'MedGuide AI',
      links: [
        { id: 'ai_tutor', label: 'AWASI AI ASSISTANT', icon: Bot, badge: 'AI' },
      ],
    },
    {
      groupTitle: 'Collaboration',
      links: [
        { id: 'community', label: 'Batch Community', icon: MessageSquare, badge: null },
        { id: 'leaderboard', label: 'Leaderboards', icon: Award, badge: null },
        { id: 'progress', label: 'My Progress', icon: BarChart3, badge: null },
      ],
    },
  ];

  // Structured Nav Groups for Teacher
  const teacherNavGroups = [
    {
      groupTitle: 'Faculty Suite',
      links: [
        { id: 'faculty', label: 'Faculty Dashboard', icon: GraduationCap, badge: null },
        { id: 'teacher_analytics', label: 'Batch Analytics', icon: BarChart3, badge: null },
      ],
    },
    {
      groupTitle: 'Academic Content',
      links: [
        { id: 'catalog', label: 'Browse Quizzes', icon: BookOpen, badge: null },
        { id: 'qbank', label: 'Question Bank', icon: FileQuestion, badge: null },
      ],
    },
    {
      groupTitle: 'Interaction',
      links: [
        { id: 'ai_tutor', label: 'AWASI AI ASSISTANT', icon: Bot, badge: 'AI' },
        { id: 'community', label: 'Batch Community', icon: MessageSquare, badge: null },
        { id: 'leaderboard', label: 'Leaderboards', icon: Award, badge: null },
      ],
    },
  ];

  // Structured Nav Groups for Admin
  const adminNavGroups = [
    {
      groupTitle: 'Administration',
      links: [
        { id: 'admin', label: 'Admin Portal', icon: Shield, badge: 'Admin' },
        { id: 'faculty', label: 'Faculty Workspace', icon: GraduationCap, badge: null },
        { id: 'teacher_analytics', label: 'Batch Analytics', icon: BarChart3, badge: null },
      ],
    },
    {
      groupTitle: 'Content & Revision',
      links: [
        { id: 'catalog', label: 'Browse Quizzes', icon: BookOpen, badge: null },
        { id: 'qbank', label: 'Question Bank', icon: FileQuestion, badge: null },
        { id: 'ai_tutor', label: 'AWASI AI ASSISTANT', icon: Bot, badge: 'AI' },
        { id: 'community', label: 'Batch Community', icon: MessageSquare, badge: null },
        { id: 'leaderboard', label: 'Leaderboards', icon: Award, badge: null },
      ],
    },
  ];

  // Unauthenticated Visitor Navigation
  const publicNavLinks = [
    { label: 'Platform Home', icon: Home, action: () => scrollToPublicSection('root') },
    { label: 'Academic Purpose', icon: Layers, action: () => scrollToPublicSection('platform-foundation') },
    { label: 'Batch 99 Curriculum', icon: BookOpen, action: () => scrollToPublicSection('curriculum-focus') },
  ];

  const getNavGroups = () => {
    if (user?.role === 'admin') return adminNavGroups;
    if (user?.role === 'teacher') return teacherNavGroups;
    return studentNavGroups;
  };

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  // ========================================================
  // VIEW A: TOP NAVBAR (FOR LANDING PAGE ONLY)
  // Retains the previous horizontal top alignment across the screen
  // ========================================================
  if (isLandingPage) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              
              {/* Brand Logo Lockup */}
              <button
                onClick={() => scrollToPublicSection('root')}
                className="flex items-center focus:outline-hidden text-left group"
                aria-label="AWASI QUIZWEB Home"
              >
                <AlawasiLogo variant="compact" />
              </button>

              {/* Center Navigation Links (Desktop) */}
              <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                <button
                  onClick={() => scrollToPublicSection('root')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                >
                  Platform Home
                </button>
                <button
                  onClick={() => scrollToPublicSection('platform-foundation')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                >
                  Academic Foundation
                </button>
                <button
                  onClick={() => scrollToPublicSection('curriculum-focus')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                >
                  Batch 99 Curriculum
                </button>

                {/* Live Online Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ml-2 ${
                    isOnline
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 animate-pulse border border-amber-300/80'
                  }`}
                  title={isOnline ? 'Online live sync active' : 'Offline mode active'}
                >
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{isOnline ? 'Live' : 'Offline'}</span>
                </div>
              </nav>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Dark Mode Switcher */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-600" />
                  )}
                </button>

                {user ? (
                  /* If logged-in user visits landing page */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentTab(user.role === 'teacher' ? 'faculty' : 'catalog')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-slate-950 text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                    >
                      {user.role === 'teacher' ? 'Faculty Suite' : 'Quizzes Dashboard'}
                    </button>
                    <button
                      onClick={onOpenProfile}
                      className="w-9 h-9 rounded-full bg-blue-600 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-400 dark:hover:ring-amber-400 transition"
                      title="Open Profile"
                    >
                      {user.display_name?.charAt(0) || user.full_name?.charAt(0) || 'U'}
                    </button>
                  </div>
                ) : (
                  /* Visitor Auth CTAs */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                    >
                      Sign In
                    </button>

                    {/* Register Dropdown */}
                    <div className="relative" ref={registerMenuRef}>
                      <button
                        onClick={() => setRegisterMenuOpen(!registerMenuOpen)}
                        className="px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${registerMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {registerMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              setRegisterMenuOpen(false);
                              openAuthModal('register-student');
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-3 transition cursor-pointer"
                          >
                            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">Batch 99 Student</p>
                              <p className="text-[10px] text-slate-500">Access mock quizzes &amp; bank</p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setRegisterMenuOpen(false);
                              openAuthModal('register-teacher');
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 flex items-center gap-3 transition cursor-pointer"
                          >
                            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">Academic Faculty</p>
                              <p className="text-[10px] text-slate-500">Author &amp; analyze quizzes</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Menu Hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Open Navigation"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* Mobile slide-over drawer for landing page */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 shadow-2xl">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <AlawasiLogo variant="compact" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                  Explore Platform
                </p>
                {publicNavLinks.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={idx}
                      onClick={link.action}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Icon className="w-4 h-4 text-blue-600 dark:text-amber-400" />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register-student');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-xs"
                >
                  Register as Student
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ========================================================
  // VIEW B: LEFT SIDEBAR NAVIGATION (FOR AUTHENTICATED PAGES)
  // Quizzes, Question Bank, Faculty Dashboard, Analytics, etc.
  // ========================================================
  return (
    <>
      {/* 1. Mobile Top Bar for small screens */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs h-16 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Open Navigation Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          onClick={() => setCurrentTab(user?.role === 'teacher' ? 'faculty' : 'catalog')}
          className="flex items-center focus:outline-hidden"
          aria-label="AWASI QUIZWEB Home"
        >
          <AlawasiLogo variant="compact" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-blue-600 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
            title="Open Profile"
          >
            {user?.display_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
          </button>
        </div>
      </header>

      {/* 2. Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 shadow-2xl">
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <AlawasiLogo variant="compact" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                    : 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span>{isOnline ? 'Online · Live Sync Active' : 'Offline Mode (Cached Bank)'}</span>
              </div>

              <div className="space-y-4">
                {getNavGroups().map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
                      {group.groupTitle}
                    </p>
                    {group.links.map((link) => {
                      const Icon = link.icon;
                      const isActive = currentTab === link.id;
                      return (
                        <button
                          key={link.id}
                          onClick={() => handleSelectTab(link.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{link.label}</span>
                          </div>
                          {link.badge && (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {link.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {user?.display_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.display_name || user?.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      setCurrentTab('landing');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800/90 shadow-sm shrink-0 z-30 select-none transition-colors duration-150">
        
        {/* Brand & Identity Header */}
        <div className="p-5 pb-4 border-b border-slate-200/70 dark:border-slate-800/70 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentTab(user?.role === 'teacher' ? 'faculty' : 'catalog')}
              className="flex items-center focus:outline-hidden text-left group"
              aria-label="AWASI QUIZWEB Home"
            >
              <AlawasiLogo variant="compact" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              Faculty of Medicine · U of K
            </span>

            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOnline
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 animate-pulse'
              }`}
              title={isOnline ? 'Online live sync active' : 'Offline mode active'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isOnline ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Teacher / Admin Primary Action: Create Timed Quiz */}
        {(user?.role === 'teacher' || user?.role === 'admin') && onStartCreateQuiz && (
          <div className="px-4 pt-3 pb-1">
            <button
              onClick={onStartCreateQuiz}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white dark:from-amber-400 dark:via-amber-500 dark:to-amber-500 dark:hover:from-amber-500 dark:hover:to-amber-600 dark:text-slate-950 font-bold text-xs shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>+ Create Timed Quiz</span>
            </button>
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5 custom-scrollbar">
          {getNavGroups().map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
                {group.groupTitle}
              </p>

              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = currentTab === link.id;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleSelectTab(link.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs font-bold scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isActive
                            ? 'text-white dark:text-slate-950 scale-110'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-amber-400 group-hover:scale-110'
                        }`}
                      />
                      <span className="truncate">{link.label}</span>
                    </div>

                    {link.badge ? (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/25 text-white dark:bg-black/20 dark:text-slate-950'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-amber-400'
                        }`}
                      >
                        {link.badge}
                      </span>
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950 shrink-0 shadow-xs" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 transition-colors">
          <div className="space-y-2.5">
            <div
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs hover:border-blue-400 dark:hover:border-amber-400/60 transition cursor-pointer group"
              title="View & Edit Profile"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {user?.display_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                  {user?.display_name || user?.full_name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.role === 'student' ? 'Batch 99 Student' : user?.role === 'teacher' ? 'Faculty Educator' : 'Administrator'}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-[11px] font-medium transition cursor-pointer"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px]">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px]">Dark</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  logout();
                  setCurrentTab('landing');
                }}
                className="flex items-center gap-1 p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-medium transition cursor-pointer"
                title="Sign Out of AWASI QUIZWEB"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[10px]">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

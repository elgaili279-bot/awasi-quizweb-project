/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ReportModal } from './components/ReportModal';
import { PublicLandingPage } from './components/PublicLandingPage';
import { QuizCatalog } from './components/QuizCatalog';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResults } from './components/QuizResults';
import { TeacherDashboard } from './components/TeacherDashboard';
import { QuizBuilder } from './components/QuizBuilder';
import { StudentAnalytics } from './components/StudentAnalytics';
import { QuestionBankView } from './components/QuestionBankView';
import { LeaderboardView } from './components/LeaderboardView';
import { SubjectLeaderboardsView } from './components/SubjectLeaderboardsView';
import { CommunityHub } from './components/CommunityHub';
import { WeakPointsVault } from './components/WeakPointsVault';
import { TeacherAnalyticsView } from './components/TeacherAnalyticsView';
import { GeminiChatbot } from './components/GeminiChatbot';
import { GeminiChatWidget } from './components/GeminiChatWidget';
import { AdminPortal } from './components/AdminPortal';
import { AlawasiLogo } from './components/AlawasiLogo';

function MainApp() {
  const { user, openAuthModal } = useAuth();

  // Navigation tab: landing | catalog | qbank | leaderboard | progress | bookmarks | faculty | admin | teacher_analytics
  const [currentTab, setCurrentTab] = useState<string>(() => (user ? 'catalog' : 'landing'));

  // Exam taking state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // Reviewing attempt state
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);

  // Teacher Quiz Builder mode: null (not building) | 'new' | specific quizId
  const [builderQuizId, setBuilderQuizId] = useState<string | null>(null);

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);

  // Global Dark mode state & persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('medpulse_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('medpulse_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('medpulse_dark_mode', 'false');
    }
  }, [darkMode]);

  // Adjust currentTab based on authentication transitions
  useEffect(() => {
    if (!user) {
      setCurrentTab('landing');
    } else {
      if (currentTab === 'landing') {
        if (user.role === 'teacher') {
          setCurrentTab('faculty');
        } else if (user.role === 'admin') {
          setCurrentTab('admin');
        } else {
          setCurrentTab('catalog');
        }
      }
    }
  }, [user]);

  // Handlers
  const handleStartQuiz = (quizId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setReviewAttemptId(null);
    setActiveQuizId(quizId);
  };

  const handleQuizFinished = (attemptId: string) => {
    setActiveQuizId(null);
    setReviewAttemptId(attemptId);
  };

  const handleExitQuiz = () => {
    setActiveQuizId(null);
  };

  const handleReturnToCatalog = () => {
    setReviewAttemptId(null);
    setActiveQuizId(null);
    setCurrentTab(user?.role === 'teacher' ? 'faculty' : 'catalog');
  };

  const handleCreateNewQuiz = () => {
    setBuilderQuizId('new');
  };

  const handleEditQuiz = (quizId: string) => {
    setBuilderQuizId(quizId);
  };

  const handlePreviewQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  // If currently taking a quiz: render QuizPlayer full screen
  if (activeQuizId) {
    return (
      <QuizPlayer
        quizId={activeQuizId}
        onQuizFinished={handleQuizFinished}
        onExit={handleExitQuiz}
      />
    );
  }

  // If authoring or editing a quiz in the Teacher Quiz Builder
  if (builderQuizId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setBuilderQuizId(null);
            setCurrentTab(tab);
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenProfile={() => setProfileModalOpen(true)}
          onStartCreateQuiz={handleCreateNewQuiz}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <QuizBuilder
            quizId={builderQuizId === 'new' ? null : builderQuizId}
            onExit={() => setBuilderQuizId(null)}
            onSuccess={() => {
              setBuilderQuizId(null);
              setCurrentTab('faculty');
            }}
          />
        </main>
      </div>
    );
  }

  const isLandingPage = !user || currentTab === 'landing';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col ${isLandingPage ? '' : 'md:flex-row'} transition-colors duration-150`}>
      
      {/* Navigation: Top Navbar on Landing Page; Left Sidebar on App Pages */}
      <Navbar
        currentTab={reviewAttemptId ? '' : currentTab}
        setCurrentTab={(tab) => {
          setReviewAttemptId(null);
          setCurrentTab(tab);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenProfile={() => setProfileModalOpen(true)}
        onStartCreateQuiz={handleCreateNewQuiz}
      />

      {/* Main Content Area Container */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 min-w-0">
        {/* If reviewing an attempt */}
        {reviewAttemptId ? (
          <div className="pb-16">
            <QuizResults
              attemptId={reviewAttemptId}
              onReturnToCatalog={handleReturnToCatalog}
              onViewProgress={() => {
                setReviewAttemptId(null);
                setCurrentTab('progress');
              }}
              onReportQuestion={(qId) => setReportingQuestionId(qId)}
            />
          </div>
        ) : (!user || currentTab === 'landing') ? (
          /* ======================================================== */
          /* PUBLIC LANDING PAGE (Top Navbar Alignment)              */
          /* Excludes private question bank, quizzes, leaderboard,     */
          /* and dashboard metrics.                                    */
          /* ======================================================== */
          <PublicLandingPage
            onOpenAuth={(mode) => openAuthModal(mode)}
          />
        ) : (
          /* ======================================================== */
          /* AUTHENTICATED APPLICATION INTERFACE                      */
          /* ======================================================== */
          <div className="pb-16">
            {/* Student Dashboard & Quizzes */}
            {currentTab === 'catalog' && (
              <QuizCatalog
                onSelectQuiz={handleStartQuiz}
                onNavigateToTeacher={() => setCurrentTab('faculty')}
              />
            )}

            {/* MedGuide AI Tutor (Gemini Assistant Full View) */}
            {currentTab === 'ai_tutor' && (
              <div className="py-4">
                <GeminiChatbot />
              </div>
            )}

            {/* Question Bank (Authenticated Only) */}
            {currentTab === 'qbank' && (
              <QuestionBankView
                onReportQuestion={(qId) => setReportingQuestionId(qId)}
              />
            )}

            {/* Academic Community (Authenticated Students & Faculty) */}
            {currentTab === 'community' && <CommunityHub />}

            {/* Weak Points & Active Revision Vault (Authenticated Students) */}
            {currentTab === 'weak_points' && <WeakPointsVault />}

            {/* Leaderboards & Subject Honor Boards (Authenticated Only) */}
            {currentTab === 'leaderboard' && <SubjectLeaderboardsView />}

            {/* Student Progress (Authenticated Students Only) */}
            {currentTab === 'progress' && (
              <StudentAnalytics
                onReviewAttempt={(attemptId) => setReviewAttemptId(attemptId)}
                onExploreQuizzes={() => setCurrentTab('catalog')}
              />
            )}

            {/* Faculty / Teacher Workspace */}
            {currentTab === 'faculty' && (
              <TeacherDashboard
                onCreateQuiz={handleCreateNewQuiz}
                onEditQuiz={handleEditQuiz}
                onPreviewQuiz={handlePreviewQuiz}
              />
            )}

            {/* Teacher Diagnostic Analytics & Rescue Groups */}
            {currentTab === 'teacher_analytics' && <TeacherAnalyticsView />}

            {/* Administrator Portal (Admins Only) */}
            {currentTab === 'admin' && <AdminPortal />}
          </div>
        )}
      </main>

      {/* Global Authenticated Footer (Only displayed when authenticated, since PublicLandingPage has its own dedicated footer) */}
      {user && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlawasiLogo variant="compact" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <p className="font-medium text-slate-600 dark:text-slate-400">
                AWASI QUIZWEB PLATFORM &copy; 2026 · Batch 99 Academic Medical Assessment System
              </p>
            </div>
          </div>
        </footer>
      )}
      </div>

      {/* Floating Gemini AI Tutor Widget for Instant Access */}
      {user && currentTab !== 'ai_tutor' && !activeQuizId && (
        <GeminiChatWidget onOpenFullPage={() => setCurrentTab('ai_tutor')} />
      )}

      {/* Global Modals */}
      <AuthModal />
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <ReportModal
        questionId={reportingQuestionId}
        onClose={() => setReportingQuestionId(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}

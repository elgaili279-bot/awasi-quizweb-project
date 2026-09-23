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
import { QuizCatalog } from './components/QuizCatalog';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResults } from './components/QuizResults';
import { TeacherDashboard } from './components/TeacherDashboard';
import { QuizBuilder } from './components/QuizBuilder';
import { StudentAnalytics } from './components/StudentAnalytics';
import { QuestionBankView } from './components/QuestionBankView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminPortal } from './components/AdminPortal';
import { AlawasiLogo } from './components/AlawasiLogo';

function MainApp() {
  const { user } = useAuth();

  // Navigation tab: catalog | qbank | leaderboard | progress | bookmarks | faculty | admin
  const [currentTab, setCurrentTab] = useState<string>('catalog');

  // Exam taking state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // Reviewing attempt state
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);

  // Teacher Quiz Builder mode: null (not building) | 'new' | specific quizId
  const [builderQuizId, setBuilderQuizId] = useState<string | null>(null);

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('medpulse_dark_mode') === 'true';
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

  // If user role changes (e.g. login as teacher/admin), adjust if needed
  useEffect(() => {
    if (user?.role === 'teacher' && currentTab === 'progress') {
      setCurrentTab('faculty');
    }
  }, [user]);

  // Handlers
  const handleStartQuiz = (quizId: string) => {
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
    setCurrentTab('catalog');
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setBuilderQuizId(null);
            setCurrentTab(tab);
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenProfile={() => setProfileModalOpen(true)}
        />
        <main className="flex-1">
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-150">
      
      {/* Navigation Header */}
      <Navbar
        currentTab={reviewAttemptId ? '' : currentTab}
        setCurrentTab={(tab) => {
          setReviewAttemptId(null);
          setCurrentTab(tab);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* If reviewing an attempt */}
        {reviewAttemptId ? (
          <QuizResults
            attemptId={reviewAttemptId}
            onReturnToCatalog={handleReturnToCatalog}
            onViewProgress={() => {
              setReviewAttemptId(null);
              setCurrentTab('progress');
            }}
            onReportQuestion={(qId) => setReportingQuestionId(qId)}
          />
        ) : (
          <>
            {currentTab === 'catalog' && (
              <QuizCatalog
                onSelectQuiz={handleStartQuiz}
                onNavigateToTeacher={() => setCurrentTab('faculty')}
              />
            )}

            {currentTab === 'qbank' && (
              <QuestionBankView
                onReportQuestion={(qId) => setReportingQuestionId(qId)}
              />
            )}

            {currentTab === 'leaderboard' && <LeaderboardView />}

            {currentTab === 'progress' && (
              <StudentAnalytics
                onReviewAttempt={(attemptId) => setReviewAttemptId(attemptId)}
                onExploreQuizzes={() => setCurrentTab('catalog')}
              />
            )}

            {currentTab === 'bookmarks' && (
              <QuestionBankView
                onReportQuestion={(qId) => setReportingQuestionId(qId)}
              />
            )}

            {currentTab === 'faculty' && (
              <TeacherDashboard
                onCreateQuiz={handleCreateNewQuiz}
                onEditQuiz={handleEditQuiz}
                onPreviewQuiz={handlePreviewQuiz}
              />
            )}

            {currentTab === 'admin' && <AdminPortal />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlawasiLogo variant="compact" />
            </div>

            {/* Social channels pill from official identity */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300">
              <span className="text-[11px] font-extrabold text-blue-700 dark:text-amber-400">ALAWASI | UofK B99</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">University of Khartoum Medical Heritage</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p className="font-medium text-slate-600 dark:text-slate-400">
              AWASI QUIZWEB PLATFORM &copy; 2026 · Clinical Assessment & Medical Education System
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Evidence-Based Medicine</span>
              <span>•</span>
              <span>USMLE Step 1 &amp; 2 CK</span>
              <span>•</span>
              <span>Shelf Exams</span>
            </div>
          </div>
        </div>
      </footer>

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

import React, { useState } from 'react';
import {
  Stethoscope,
  BookOpen,
  Award,
  BarChart3,
  Bookmark,
  GraduationCap,
  Shield,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  FileQuestion,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AlawasiLogo } from './AlawasiLogo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  onOpenProfile,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="w-3 h-3" /> Administrator
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
            <GraduationCap className="w-3 h-3" /> Faculty Educator
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
            <Stethoscope className="w-3 h-3" /> Medical Student
          </span>
        );
      default:
        return null;
    }
  };

  const navLinks = [
    { id: 'catalog', label: 'Medical Quizzes', icon: BookOpen },
    { id: 'qbank', label: 'Question Bank', icon: FileQuestion },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    ...(user?.role === 'student' ? [
      { id: 'progress', label: 'My Progress', icon: BarChart3 },
      { id: 'bookmarks', label: 'Saved Pearls', icon: Bookmark },
    ] : []),
    ...(user?.role === 'teacher' || user?.role === 'admin' ? [
      { id: 'faculty', label: 'Faculty Dashboard', icon: GraduationCap },
    ] : []),
    ...(user?.role === 'admin' ? [
      { id: 'admin', label: 'Admin Portal', icon: Shield },
    ] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand with Official Alawasi Emblem */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCurrentTab('catalog'); setMobileMenuOpen(false); }}
              className="flex items-center group focus:outline-none"
              aria-label="AWASI QUIZWEB PLATFORM Home"
            >
              <AlawasiLogo variant="compact" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentTab(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-amber-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Right Actions: Dark mode toggle & User Profile / Login */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {user.display_name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
                      <div className="mt-1.5">{getRoleBadge(user.role)}</div>
                    </div>

                    <button
                      onClick={() => { onOpenProfile(); setUserDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </button>

                    <button
                      onClick={() => { logout(); setUserDropdownOpen(false); setCurrentTab('catalog'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('register-student')}
                  className="px-3.5 py-1.5 text-sm font-bold bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white rounded-lg shadow-sm shadow-blue-800/20 transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.display_name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div>{getRoleBadge(user.role)}</div>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => { setCurrentTab(link.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-amber-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => { onOpenProfile(); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Account Profile
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); setCurrentTab('catalog'); }}
                  className="w-full py-2 px-3 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }}
                  className="py-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  Log In
                </button>
                <button
                  onClick={() => { openAuthModal('register-student'); setMobileMenuOpen(false); }}
                  className="py-2 text-center text-sm font-bold bg-blue-600 text-white rounded-lg shadow-sm"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

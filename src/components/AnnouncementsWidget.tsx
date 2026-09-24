import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Megaphone,
  Pin,
  AlertCircle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Clock,
  Radio,
  FileText,
  List,
  Check,
  Award,
  Sparkles,
  RefreshCw,
  Archive,
  RotateCcw,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author_id?: string;
  author_name: string;
  category: 'exam_alert' | 'general' | 'update' | 'competition' | 'revision';
  priority: 'high' | 'normal';
  is_pinned: boolean;
  expires_at?: string | null;
  is_expired?: boolean;
  created_at: string;
  updated_at?: string;
}

interface AnnouncementsWidgetProps {
  onSelectExam?: () => void;
  onOpenCommunity?: () => void;
  compact?: boolean;
  isTeacherInterface?: boolean;
}

const AUTOPLAY_INTERVAL = 6000; // 6 seconds per news screen
const BULLETIN_STORAGE_KEY = 'alawasi_bulletin_announcements_v2';
const BULLETIN_SYNC_EVENT = 'alawasi_bulletin_updated';

// Helper to convert Date to YYYY-MM-DDTHH:MM for datetime-local input
const toDateTimeLocalString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

// Helper to check if an announcement has expired
export const isAnnouncementExpired = (item: AnnouncementItem): boolean => {
  if (!item.expires_at) return false;
  const expTime = new Date(item.expires_at).getTime();
  return !isNaN(expTime) && expTime <= Date.now();
};

// Helper to format remaining active time
const formatRemainingTime = (expiresAtStr?: string | null): { text: string; isUrgent: boolean } | null => {
  if (!expiresAtStr) return null;
  const exp = new Date(expiresAtStr).getTime();
  if (isNaN(exp)) return null;
  const now = Date.now();
  const diffMs = exp - now;
  if (diffMs <= 0) return { text: 'Expired & Hidden', isUrgent: true };

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 24) {
    return { text: `Expires in ${Math.max(1, hours)}h`, isUrgent: true };
  } else if (days === 1) {
    return { text: 'Expires tomorrow', isUrgent: true };
  } else if (days < 7) {
    return { text: `Expires in ${days} days`, isUrgent: false };
  } else {
    return {
      text: `Valid until ${new Date(expiresAtStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      isUrgent: false,
    };
  }
};

// Helper to read cached announcements from localStorage synchronously on mount
const getCachedAnnouncements = (): AnnouncementItem[] => {
  try {
    const raw = localStorage.getItem(BULLETIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse cached announcements from localStorage:', err);
  }
  return [];
};

// Helper to save announcements to localStorage and dispatch instant sync event
const saveAnnouncementsToCache = (list: AnnouncementItem[]) => {
  try {
    localStorage.setItem(BULLETIN_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem('alawasi_bulletin_timestamp', Date.now().toString());
    window.dispatchEvent(new CustomEvent(BULLETIN_SYNC_EVENT, { detail: list }));
  } catch (err) {
    console.error('Failed to save announcements to localStorage:', err);
  }
};

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({
  compact = false,
  isTeacherInterface = false,
}) => {
  const { user, openAuthModal, switchRole } = useAuth();
  const { showToast } = useToast();

  // All announcements stored in local memory (both active and expired for comprehensive management)
  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementItem[]>(getCachedAnnouncements);
  const [isLoading, setIsLoading] = useState<boolean>(() => getCachedAnnouncements().length === 0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Modals
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [manageTab, setManageTab] = useState<'active' | 'archived'>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showRolePromptModal, setShowRolePromptModal] = useState<boolean>(false);

  // Form State (for both Create & Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementItem['category']>('exam_alert');
  const [formPriority, setFormPriority] = useState<AnnouncementItem['priority']>('normal');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formHasExpiry, setFormHasExpiry] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const userRole = (user?.role || '').toLowerCase();
  const isTeacherOrAdmin = Boolean(
    isTeacherInterface ||
    userRole === 'teacher' ||
    userRole === 'admin' ||
    userRole === 'faculty' ||
    userRole === 'educator'
  );

  // Derive active (non-expired) and archived (expired) announcements
  const activeAnnouncements = allAnnouncements.filter((item) => !isAnnouncementExpired(item));
  const archivedAnnouncements = allAnnouncements.filter((item) => isAnnouncementExpired(item));

  // Helper to preset expiry date
  const setExpiryPreset = (daysFromNow: number | null) => {
    if (daysFromNow === null) {
      setFormHasExpiry(false);
      setFormExpiresAt('');
    } else {
      setFormHasExpiry(true);
      const target = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
      target.setHours(23, 59, 0, 0);
      setFormExpiresAt(toDateTimeLocalString(target));
    }
  };

  // Fetch from backend and sync with localStorage
  const fetchAnnouncements = useCallback(async () => {
    try {
      if (allAnnouncements.length === 0) {
        setIsLoading(true);
      }
      // Request both active and archived from backend
      const res = await api.getAnnouncements({ include_expired: true });
      const activeList = res.announcements || [];
      const archivedList = res.archived || [];
      const combined = [...activeList, ...archivedList];

      if (Array.isArray(combined) && combined.length > 0) {
        const cached = getCachedAnnouncements();
        const mergedMap = new Map<string, AnnouncementItem>();
        combined.forEach((item) => mergedMap.set(item.id, item));
        cached.forEach((item) => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        const finalList = Array.from(mergedMap.values()).sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setAllAnnouncements(finalList);
        saveAnnouncementsToCache(finalList);
      } else {
        const cached = getCachedAnnouncements();
        if (cached.length > 0) {
          setAllAnnouncements(cached);
        }
      }

      if (currentIndex >= (activeAnnouncements.length || 1)) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.warn('Failed to load announcements from server, using local persistence:', err);
      const cached = getCachedAnnouncements();
      if (cached.length > 0) {
        setAllAnnouncements(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [allAnnouncements.length, activeAnnouncements.length, currentIndex]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Listen for custom trigger to open news creator modal
  useEffect(() => {
    const handleOpenCreateEvent = () => {
      handleOpenCreateModal();
    };

    window.addEventListener('alawasi-open-add-news-modal', handleOpenCreateEvent);
    return () => {
      window.removeEventListener('alawasi-open-add-news-modal', handleOpenCreateEvent);
    };
  }, [isTeacherOrAdmin, user]);

  // Listen for sync events across tabs and other components on the page
  useEffect(() => {
    const handleSync = () => {
      const cached = getCachedAnnouncements();
      if (cached.length > 0) {
        setAllAnnouncements(cached);
      }
    };

    window.addEventListener(BULLETIN_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(BULLETIN_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Handle slide transition for active announcements
  const goToNext = useCallback(() => {
    if (activeAnnouncements.length === 0) return;
    setCurrentIndex((curr) => (curr + 1) % activeAnnouncements.length);
    setProgress(0);
  }, [activeAnnouncements.length]);

  const goToPrev = useCallback(() => {
    if (activeAnnouncements.length === 0) return;
    setCurrentIndex((curr) => (curr - 1 + activeAnnouncements.length) % activeAnnouncements.length);
    setProgress(0);
  }, [activeAnnouncements.length]);

  // Autoplay and ticker interval
  useEffect(() => {
    if (!isPlaying || isHovered || activeAnnouncements.length <= 1) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / AUTOPLAY_INTERVAL) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, isHovered, activeAnnouncements.length, goToNext]);

  // Open Create Modal with default presets
  const handleOpenCreateModal = () => {
    if (!isTeacherOrAdmin && !user) {
      setShowRolePromptModal(true);
      return;
    }
    setFormTitle('');
    setFormContent('');
    setFormCategory('exam_alert');
    setFormPriority('normal');
    setFormIsPinned(false);
    // Default: set expiry to 7 days in advance for timely cleanup
    setExpiryPreset(7);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: AnnouncementItem) => {
    setEditingAnnouncement(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setFormIsPinned(item.is_pinned);
    if (item.expires_at) {
      setFormHasExpiry(true);
      setFormExpiresAt(toDateTimeLocalString(new Date(item.expires_at)));
    } else {
      setFormHasExpiry(false);
      setFormExpiresAt('');
    }
  };

  // Submit Create: Persists immediately to local storage and updates the backend database
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToSubmit = formTitle.trim();
    const contentToSubmit = formContent.trim();
    if (!titleToSubmit || !contentToSubmit) {
      showToast('Please provide both headline and details for the news.', 'error');
      return;
    }

    let parsedExpiry: string | null = null;
    if (formHasExpiry && formExpiresAt) {
      const expDate = new Date(formExpiresAt);
      if (!isNaN(expDate.getTime())) {
        parsedExpiry = expDate.toISOString();
      }
    }

    try {
      setIsSubmitting(true);
      const tempId = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      const optimisticItem: AnnouncementItem = {
        id: tempId,
        title: titleToSubmit,
        content: contentToSubmit,
        author_id: user?.id,
        author_name: user?.display_name || user?.full_name || 'Academic Faculty',
        category: formCategory,
        priority: formPriority,
        is_pinned: formIsPinned,
        expires_at: parsedExpiry,
        is_expired: false,
        created_at: now,
        updated_at: now,
      };

      // 1. Immediately persist to state & localStorage
      const updatedList = formIsPinned
        ? [optimisticItem, ...allAnnouncements.filter((a) => a.id !== tempId)]
        : [...allAnnouncements.filter((a) => a.id !== tempId), optimisticItem];

      updatedList.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAllAnnouncements(updatedList);
      saveAnnouncementsToCache(updatedList);

      setShowCreateModal(false);
      setFormTitle('');
      setFormContent('');
      setCurrentIndex(0);
      setProgress(0);
      showToast('News broadcasted live to Batch 99 News Screen!', 'success');

      // 2. Persist to backend database
      try {
        const res = await api.createAnnouncement({
          title: titleToSubmit,
          content: contentToSubmit,
          category: formCategory,
          priority: formPriority,
          is_pinned: formIsPinned,
          expires_at: parsedExpiry,
        });

        if (res.announcement) {
          setAllAnnouncements((prev) => {
            const newList = prev.map((item) => (item.id === tempId ? res.announcement : item));
            saveAnnouncementsToCache(newList);
            return newList;
          });
        }
      } catch (backendErr: any) {
        console.warn('Backend announcement saved in offline cache:', backendErr);
        if (backendErr?.status === 403) {
          showToast('Notice saved in local preview. Make sure you are signed in as Teacher to broadcast permanently.', 'info');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to post news', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit: Updates local storage and persists to backend database
  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToSubmit = formTitle.trim();
    const contentToSubmit = formContent.trim();
    if (!editingAnnouncement || !titleToSubmit || !contentToSubmit) return;

    let parsedExpiry: string | null = null;
    if (formHasExpiry && formExpiresAt) {
      const expDate = new Date(formExpiresAt);
      if (!isNaN(expDate.getTime())) {
        parsedExpiry = expDate.toISOString();
      }
    }

    try {
      setIsSubmitting(true);
      const updatedItem: AnnouncementItem = {
        ...editingAnnouncement,
        title: titleToSubmit,
        content: contentToSubmit,
        category: formCategory,
        priority: formPriority,
        is_pinned: formIsPinned,
        expires_at: parsedExpiry,
        is_expired: parsedExpiry ? new Date(parsedExpiry).getTime() <= Date.now() : false,
        updated_at: new Date().toISOString(),
      };

      const updatedList = allAnnouncements.map((a) => (a.id === updatedItem.id ? updatedItem : a));
      updatedList.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAllAnnouncements(updatedList);
      saveAnnouncementsToCache(updatedList);

      setEditingAnnouncement(null);
      setFormTitle('');
      setFormContent('');
      showToast('News updated on News Screen!', 'success');

      try {
        await api.updateAnnouncement(updatedItem.id, {
          title: titleToSubmit,
          content: contentToSubmit,
          category: formCategory,
          priority: formPriority,
          is_pinned: formIsPinned,
          expires_at: parsedExpiry,
        });
      } catch (backendErr) {
        console.warn('Backend update failed, kept in local cache:', backendErr);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update news', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reactivate an expired/archived announcement (+7 days default)
  const handleReactivateAnnouncement = async (item: AnnouncementItem, days = 7) => {
    try {
      const newExp = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      newExp.setHours(23, 59, 0, 0);
      const newExpIso = newExp.toISOString();

      const updatedItem: AnnouncementItem = {
        ...item,
        expires_at: newExpIso,
        is_expired: false,
        updated_at: new Date().toISOString(),
      };

      const updatedList = allAnnouncements.map((a) => (a.id === item.id ? updatedItem : a));
      setAllAnnouncements(updatedList);
      saveAnnouncementsToCache(updatedList);

      showToast(`Reactivated news item until ${newExp.toLocaleDateString()}!`, 'success');

      try {
        await api.reactivateAnnouncement(item.id, { days, new_expires_at: newExpIso });
      } catch (err) {
        console.warn('Backend reactivate failed, updated locally:', err);
      }
    } catch (err: any) {
      showToast('Failed to reactivate news item', 'error');
    }
  };

  // Toggle Pinned Status
  const handleTogglePin = async (item: AnnouncementItem) => {
    const updatedPinned = !item.is_pinned;
    const updatedList = allAnnouncements.map((a) =>
      a.id === item.id ? { ...a, is_pinned: updatedPinned, updated_at: new Date().toISOString() } : a
    );
    updatedList.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setAllAnnouncements(updatedList);
    saveAnnouncementsToCache(updatedList);
    showToast(updatedPinned ? 'Pinned to top of News Screen' : 'Unpinned from top', 'info');

    try {
      await api.updateAnnouncement(item.id, { is_pinned: updatedPinned });
    } catch (err) {
      console.warn('Pin sync failed, retained in local cache:', err);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      setDeletingId(null);
      const remaining = allAnnouncements.filter((a) => a.id !== id);
      setAllAnnouncements(remaining);
      saveAnnouncementsToCache(remaining);

      if (currentIndex >= remaining.length) {
        setCurrentIndex(Math.max(0, remaining.length - 1));
      }

      showToast('News item permanently deleted.', 'info');

      try {
        await api.deleteAnnouncement(id);
      } catch (backendErr) {
        console.warn('Backend deletion failed, kept locally removed:', backendErr);
      }
    } catch (err: any) {
      showToast('Failed to remove news item', 'error');
    }
  };

  // Visual Category Styling
  const getCategoryMeta = (category: AnnouncementItem['category']) => {
    switch (category) {
      case 'exam_alert':
        return {
          label: 'Exam Alert',
          pillBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dotBg: 'bg-rose-400',
          gradientBorder: 'from-rose-500 via-amber-500 to-rose-600',
        };
      case 'revision':
        return {
          label: 'Revision Schedule',
          pillBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotBg: 'bg-blue-400',
          gradientBorder: 'from-blue-500 via-cyan-400 to-indigo-600',
        };
      case 'competition':
        return {
          label: 'Honor Leaderboard',
          pillBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotBg: 'bg-amber-400',
          gradientBorder: 'from-amber-400 via-yellow-400 to-orange-500',
        };
      case 'update':
        return {
          label: 'Platform Update',
          pillBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotBg: 'bg-emerald-400',
          gradientBorder: 'from-emerald-400 via-teal-400 to-green-600',
        };
      default:
        return {
          label: 'Faculty Notice',
          pillBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dotBg: 'bg-purple-400',
          gradientBorder: 'from-purple-500 via-violet-400 to-blue-600',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-lg animate-pulse mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-slate-800 rounded-lg w-1/3"></div>
          <div className="h-6 bg-slate-800 rounded-lg w-24"></div>
        </div>
        <div className="h-8 bg-slate-800 rounded-lg w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-800 rounded-lg w-1/2"></div>
      </div>
    );
  }

  // If no active announcements on screen
  if (activeAnnouncements.length === 0) {
    return (
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800/90 p-6 shadow-xl mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-700/50 text-blue-400 flex items-center justify-center mx-auto mb-3">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          Batch 99 News Screen
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          {archivedAnnouncements.length > 0
            ? `All previous notices have passed their expiry dates (${archivedAnnouncements.length} archived). Teachers can broadcast new announcements or reactivate archived posts.`
            : 'Broadcast exam schedules, curriculum updates, and academic alerts for Batch 99 students.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Broadcast News</span>
          </button>
          {archivedAnnouncements.length > 0 && isTeacherOrAdmin && (
            <button
              onClick={() => {
                setManageTab('archived');
                setShowManageModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>View Archived ({archivedAnnouncements.length})</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentItem = activeAnnouncements[currentIndex] || activeAnnouncements[0];
  const meta = getCategoryMeta(currentItem.category);
  const remainingInfo = formatRemainingTime(currentItem.expires_at);

  return (
    <section
      aria-label="Official Batch 99 News Screen"
      className="mb-6 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Electronic News Screen Container */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Top Screen Neon Accent Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${meta.gradientBorder} transition-colors duration-700`}></div>

        {/* Dynamic Countdown Progress Bar */}
        <div className="w-full bg-slate-900/60 h-0.5 relative overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-blue-400 via-amber-300 to-emerald-400 transition-all duration-100 ease-linear ${
              !isPlaying || isHovered ? 'opacity-40' : 'opacity-100'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Ambient Display Glow Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        {/* Screen Header Bar: Live Ticker Indicator, Screen Counter, Controls */}
        <div className="px-5 py-3.5 border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-3 relative z-10 bg-slate-950/40 backdrop-blur-sm">
          {/* Live Indicator & Channel Title */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                LIVE NEWS SCREEN
              </span>
              <span className="text-slate-600 text-xs hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Batch 99 Academic Broadcast
              </span>
            </div>
          </div>

          {/* Screen Controls & Teacher Actions */}
          <div className="flex items-center gap-2">
            {/* Screen Pagination Indicator */}
            <span className="text-[11px] font-mono text-slate-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
              {currentIndex + 1} / {activeAnnouncements.length}
            </span>

            {/* Play/Pause Autoplay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Screen Rotation' : 'Resume Screen Rotation'}
              aria-label={isPlaying ? 'Pause news' : 'Play news'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            {/* Manual Screen Flip Buttons (Prev / Next) */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrev}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors active:scale-95 cursor-pointer"
                title="Previous News Item"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={goToNext}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors active:scale-95 cursor-pointer"
                title="Next News Item"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Broadcast Button & Manager */}
            <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-800">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                title="Broadcast Announcement to News Screen"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Post News</span>
              </button>

              <button
                onClick={() => {
                  setManageTab('active');
                  setShowManageModal(true);
                }}
                className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer relative"
                title="News Screen Manager (Active & Archived)"
              >
                <List className="w-3.5 h-3.5" />
                {archivedAnnouncements.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active News Item Screen Surface */}
        <div className="p-5 md:p-7 relative z-10">
          <div
            key={currentItem.id}
            className="animate-in fade-in duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            {/* Left Content Area */}
            <div className="flex-1 space-y-3">
              {/* Category & Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border backdrop-blur-md ${meta.pillBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotBg}`}></span>
                  {meta.label}
                </span>

                {currentItem.priority === 'high' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertCircle className="w-3 h-3" />
                    High Priority
                  </span>
                )}

                {currentItem.is_pinned && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Pin className="w-3 h-3 fill-amber-400" />
                    Pinned Broadcast
                  </span>
                )}

                {/* Expiry Date Badge */}
                {remainingInfo && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                      remainingInfo.isUrgent
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                    }`}
                    title={`Auto-archives after ${new Date(currentItem.expires_at!).toLocaleString()}`}
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{remainingInfo.text}</span>
                  </span>
                )}

                <span className="text-[11px] text-slate-400 font-medium ml-auto md:ml-0 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {new Date(currentItem.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* News Headline */}
              <h2
                onClick={() => setSelectedAnnouncement(currentItem)}
                className="text-lg md:text-2xl font-black text-white hover:text-amber-300 transition-colors cursor-pointer tracking-tight leading-snug line-clamp-2"
              >
                {currentItem.title}
              </h2>

              {/* News Content Excerpt */}
              <p
                onClick={() => setSelectedAnnouncement(currentItem)}
                className="text-xs md:text-sm text-slate-300 line-clamp-2 leading-relaxed max-w-3xl cursor-pointer hover:text-slate-200 transition-colors"
              >
                {currentItem.content}
              </p>

              {/* Meta Info & Teacher Controls on Current Slide */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-500 font-medium">Broadcast By:</span>
                  <span className="font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                    {currentItem.author_name || 'Academic Committee'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Teacher Quick-Edit & Delete Actions on Current Item */}
                  {isTeacherOrAdmin && (
                    <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700/70">
                      <button
                        onClick={() => handleTogglePin(currentItem)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          currentItem.is_pinned
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                        }`}
                        title={currentItem.is_pinned ? 'Unpin this news' : 'Pin this news to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(currentItem)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit headline, details, or expiry date"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingId(currentItem.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete this news item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Read Full Notice Button */}
                  <button
                    onClick={() => setSelectedAnnouncement(currentItem)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all shadow-xs cursor-pointer group/btn"
                  >
                    <span>Read Details</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-amber-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Screen Indicators / Quick Selection Dots */}
        {activeAnnouncements.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {activeAnnouncements.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setProgress(0);
                  }}
                  className={`transition-all rounded-full cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 h-1.5 bg-amber-400'
                      : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Switch to: ${item.title}`}
                  aria-label={`Jump to announcement ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>{isPlaying ? 'ROTATING (6s)' : 'PAUSED'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Read Full Announcement Details                                  */}
      {/* ========================================================================= */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryMeta(selectedAnnouncement.category).pillBg}`}>
                {getCategoryMeta(selectedAnnouncement.category).label}
              </span>
              {selectedAnnouncement.is_pinned && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  <Pin className="w-3.5 h-3.5 fill-amber-500" /> Pinned
                </span>
              )}
              {selectedAnnouncement.priority === 'high' && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                  <AlertCircle className="w-3.5 h-3.5" /> High Priority
                </span>
              )}
              {selectedAnnouncement.expires_at && (
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {isAnnouncementExpired(selectedAnnouncement) ? 'Expired' : `Valid until ${new Date(selectedAnnouncement.expires_at).toLocaleDateString()}`}
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight leading-snug">
              {selectedAnnouncement.title}
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-100 dark:border-slate-800 mb-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
              {selectedAnnouncement.content}
            </div>

            {/* Expiry Details Box */}
            <div className="mb-4 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Display Duration:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedAnnouncement.expires_at
                  ? `Scheduled to auto-hide on ${new Date(selectedAnnouncement.expires_at).toLocaleString()}`
                  : 'Permanent notice (No expiry date set)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  Published on {new Date(selectedAnnouncement.created_at).toLocaleDateString()} by{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedAnnouncement.author_name}
                  </strong>
                </span>
              </div>

              {isTeacherOrAdmin && (
                <button
                  onClick={() => {
                    const item = selectedAnnouncement;
                    setSelectedAnnouncement(null);
                    handleOpenEditModal(item);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Notice
                </button>
              )}

              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Create Announcement / Broadcast News (with Expiry Date)          */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Broadcast to Batch 99 News Screen
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 ml-10">
              Publish announcements, timed mock alerts, or clinical revision updates directly on the live screen.
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  News Headline / Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Timed Mock Exam for Pathology Scheduled"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="exam_alert">Exam Alert</option>
                    <option value="revision">Academic Revision</option>
                    <option value="competition">Competition / Leaderboard</option>
                    <option value="update">Platform Update</option>
                    <option value="general">Faculty Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e: any) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">Normal Broadcast</option>
                    <option value="high">High Priority (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  News Details / Instructions *
                </label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Provide detailed exam instructions, time limits, syllabus coverage, or venue/online links..."
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              {/* ===================================================== */}
              {/* EXPIRY DATE & AUTO-ARCHIVE FIELD                     */}
              {/* ===================================================== */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Expiry Date &amp; Auto-Archive
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formHasExpiry}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setExpiryPreset(7);
                        } else {
                          setExpiryPreset(null);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  When enabled, outdated posts automatically disappear from student news screens after the specified date and move to the Archived manager.
                </p>

                {formHasExpiry && (
                  <div className="space-y-2.5 pt-1">
                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 mr-1 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(1)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition cursor-pointer"
                      >
                        +24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(3)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition cursor-pointer"
                      >
                        +3 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(7)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition cursor-pointer"
                      >
                        +1 Week (7 Days)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(14)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition cursor-pointer"
                      >
                        +2 Weeks
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(30)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 transition cursor-pointer"
                      >
                        +1 Month
                      </button>
                    </div>

                    {/* Date Time Picker Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Specified Expiry Date &amp; Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formExpiresAt}
                        onChange={(e) => setFormExpiresAt(e.target.value)}
                        required={formHasExpiry}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                Pin to top of News Screen
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to News Screen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Edit Announcement / News Item (with Expiry Date)                */}
      {/* ========================================================================= */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingAnnouncement(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Edit2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit News Item &amp; Schedule
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 ml-10">
              Update headline, instructions, priority, or adjust the auto-expiry date.
            </p>

            <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  News Headline / Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="exam_alert">Exam Alert</option>
                    <option value="revision">Academic Revision</option>
                    <option value="competition">Competition / Leaderboard</option>
                    <option value="update">Platform Update</option>
                    <option value="general">Faculty Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e: any) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">Normal Broadcast</option>
                    <option value="high">High Priority (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  News Details / Instructions *
                </label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              {/* Expiry Date Editor */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Expiry Date &amp; Auto-Archive
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formHasExpiry}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setExpiryPreset(7);
                        } else {
                          setExpiryPreset(null);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {formHasExpiry && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 mr-1 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(1)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                      >
                        +24h
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(3)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                      >
                        +3 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(7)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryPreset(14)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                      >
                        +14 Days
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Expiry Date &amp; Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formExpiresAt}
                        onChange={(e) => setFormExpiresAt(e.target.value)}
                        required={formHasExpiry}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                Pin to top of News Screen
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: News Screen Manager (Active & Archived / Expired Tabs)           */}
      {/* ========================================================================= */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowManageModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-amber-500" />
                  News Screen Control Manager
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage live broadcasts and expired/archived announcements.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowManageModal(false);
                  handleOpenCreateModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-colors mr-6 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Post News</span>
              </button>
            </div>

            {/* Manager Tabs: Active vs Archived / Expired */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 text-xs font-bold">
              <button
                onClick={() => setManageTab('active')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  manageTab === 'active'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Active Live Screen ({activeAnnouncements.length})</span>
              </button>

              <button
                onClick={() => setManageTab('archived')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  manageTab === 'archived'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived / Expired ({archivedAnnouncements.length})</span>
              </button>
            </div>

            {/* List Content */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {manageTab === 'active' ? (
                activeAnnouncements.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No active news items cycling. Click &quot;+ Post News&quot; or reactivate an archived item.
                  </div>
                ) : (
                  activeAnnouncements.map((item, idx) => {
                    const rem = formatRemainingTime(item.expires_at);
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getCategoryMeta(item.category).pillBg}`}>
                              {getCategoryMeta(item.category).label}
                            </span>
                            {item.is_pinned && (
                              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                                <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                              </span>
                            )}
                            {item.priority === 'high' && (
                              <span className="text-[10px] font-bold text-rose-500">
                                [High Priority]
                              </span>
                            )}
                            {rem && (
                              <span className={`text-[10px] font-semibold flex items-center gap-1 ${rem.isUrgent ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" />
                                {rem.text}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3">
                            <span>By {item.author_name}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            {item.expires_at && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-400">
                                  Expires: {new Date(item.expires_at).toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions for this active item */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-1">
                          <button
                            onClick={() => handleTogglePin(item)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                              item.is_pinned
                                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                            }`}
                            title={item.is_pinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setShowManageModal(false);
                              handleOpenEditModal(item);
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                            title="Edit News"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                            title="Delete News"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : archivedAnnouncements.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No expired or archived news items. Items that pass their expiry date will be listed here automatically.
                </div>
              ) : (
                archivedAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-100/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 opacity-90 hover:opacity-100 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Auto-Archived
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getCategoryMeta(item.category).pillBg}`}>
                          {getCategoryMeta(item.category).label}
                        </span>
                        <span className="text-[10px] text-rose-500 font-semibold">
                          Expired: {new Date(item.expires_at!).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-through decoration-slate-400">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.content}
                      </p>
                      <div className="text-[11px] text-slate-400 pt-1">
                        By {item.author_name} • Created {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Reactivate & Delete Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-1">
                      <button
                        onClick={() => handleReactivateAnnouncement(item, 7)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition cursor-pointer"
                        title="Extend expiry by 7 days and restore to live news screen"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reactivate (+7d)</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowManageModal(false);
                          handleOpenEditModal(item);
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Expiry Date or Content"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Role / Sign-in Prompt if unauthorized visitor tries to broadcast */}
      {/* ========================================================================= */}
      {showRolePromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Faculty News Broadcast
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Broadcasting to the official Batch 99 News Screen requires Teacher or Academic Faculty authorization.
            </p>

            <div className="space-y-2">
              {user ? (
                <button
                  onClick={async () => {
                    setShowRolePromptModal(false);
                    await switchRole('teacher');
                    showToast('Switched to Faculty / Teacher mode! Opening News Broadcaster...', 'success');
                    handleOpenCreateModal();
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  Switch My Account to Teacher Mode
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowRolePromptModal(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  Sign In as Teacher / Faculty
                </button>
              )}
              <button
                onClick={() => setShowRolePromptModal(false)}
                className="w-full py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE DIALOG                                                     */}
      {/* ========================================================================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Permanently Delete News Item?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              This notice will be removed from both active rotations and archived storage.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAnnouncement(deletingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

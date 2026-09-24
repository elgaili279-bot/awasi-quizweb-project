import { Question, Subject } from '../types';

const STORAGE_KEY_QUESTIONS = 'awasi_offline_qbank_store_v2';
const STORAGE_KEY_SUBJECTS = 'awasi_offline_subjects_v2';
const STORAGE_KEY_LAST_SYNC = 'awasi_offline_qbank_last_sync';
const STORAGE_KEY_OFFLINE_BOOKMARKS = 'awasi_offline_bookmarks';

export interface OfflineCacheStats {
  totalCached: number;
  lastSynced: string | null;
  subjectBreakdown: Record<string, number>;
}

/**
 * Saves or merges a list of questions into local storage.
 * Questions are accumulated so a student builds an offline repository of all loaded questions.
 */
export function saveQuestionsToOfflineCache(questions: Question[], subjects?: Subject[]): void {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    const questionMap: Record<string, Question> = existingRaw ? JSON.parse(existingRaw) : {};

    // Merge incoming questions
    questions.forEach((q) => {
      if (q && q.id) {
        questionMap[q.id] = {
          ...questionMap[q.id],
          ...q,
        };
      }
    });

    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questionMap));
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());

    if (subjects && subjects.length > 0) {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    }
  } catch (err) {
    console.warn('Unable to write to localStorage for offline cache:', err);
  }
}

/**
 * Retrieves subjects from offline cache.
 */
export function getSubjectsFromOfflineCache(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Retrieves and filters questions directly from the local offline cache.
 */
export function getQuestionsFromOfflineCache(filters: {
  subject_id?: string;
  difficulty?: string;
  search?: string;
  bookmarkedOnly?: boolean;
  incorrectOnly?: boolean;
}): { questions: Question[]; totalCached: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (!raw) return { questions: [], totalCached: 0 };

    const questionMap: Record<string, Question> = JSON.parse(raw);
    const allQuestions: Question[] = Object.values(questionMap);
    const totalCached = allQuestions.length;

    // Read offline bookmarks overrides
    const offlineBookmarksRaw = localStorage.getItem(STORAGE_KEY_OFFLINE_BOOKMARKS);
    const offlineBookmarks: Record<string, boolean> = offlineBookmarksRaw
      ? JSON.parse(offlineBookmarksRaw)
      : {};

    const filtered = allQuestions.filter((q) => {
      // Overwrite bookmark status if modified offline
      if (offlineBookmarks[q.id] !== undefined) {
        q.is_bookmarked = offlineBookmarks[q.id];
      }

      // 1. Subject filter
      if (filters.subject_id && filters.subject_id !== 'all') {
        if (q.subject_id !== filters.subject_id) {
          return false;
        }
      }

      // 2. Difficulty filter
      if (filters.difficulty && filters.difficulty !== 'all') {
        if (q.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()) {
          return false;
        }
      }

      // 3. Tab: Bookmarked Only
      if (filters.bookmarkedOnly) {
        if (!q.is_bookmarked) return false;
      }

      // 4. Tab: Incorrect Only
      if (filters.incorrectOnly) {
        // If question marked incorrect in history
        if (!q.is_incorrect && !q.user_stats?.has_incorrect_history) return false;
      }

      // 5. Search query match
      if (filters.search && filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        const promptMatch = q.prompt?.toLowerCase().includes(term);
        const explMatch = q.explanation?.toLowerCase().includes(term);
        const pearlMatch = q.learning_point?.toLowerCase().includes(term);
        const vignetteMatch =
          q.clinical_vignette?.chief_complaint?.toLowerCase().includes(term) ||
          q.clinical_vignette?.history?.toLowerCase().includes(term) ||
          q.clinical_vignette?.laboratory?.toLowerCase().includes(term);
        const choicesMatch = q.choices?.some((c) =>
          c.choice_text?.toLowerCase().includes(term) ||
          c.explanation?.toLowerCase().includes(term)
        );

        if (!promptMatch && !explMatch && !pearlMatch && !vignetteMatch && !choicesMatch) {
          return false;
        }
      }

      return true;
    });

    return { questions: filtered, totalCached };
  } catch (err) {
    console.error('Error reading offline question cache:', err);
    return { questions: [], totalCached: 0 };
  }
}

/**
 * Returns summary statistics for offline review banner.
 */
export function getOfflineCacheStats(): OfflineCacheStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    const lastSynced = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    if (!raw) return { totalCached: 0, lastSynced: null, subjectBreakdown: {} };

    const map: Record<string, Question> = JSON.parse(raw);
    const list = Object.values(map);
    const breakdown: Record<string, number> = {};

    list.forEach((q) => {
      const sub = q.subject_id || 'general';
      breakdown[sub] = (breakdown[sub] || 0) + 1;
    });

    return {
      totalCached: list.length,
      lastSynced,
      subjectBreakdown: breakdown,
    };
  } catch {
    return { totalCached: 0, lastSynced: null, subjectBreakdown: {} };
  }
}

/**
 * Update bookmark locally in offline mode
 */
export function toggleOfflineBookmark(questionId: string, currentStatus: boolean): boolean {
  try {
    const offlineBookmarksRaw = localStorage.getItem(STORAGE_KEY_OFFLINE_BOOKMARKS);
    const offlineBookmarks: Record<string, boolean> = offlineBookmarksRaw
      ? JSON.parse(offlineBookmarksRaw)
      : {};

    const newStatus = !currentStatus;
    offlineBookmarks[questionId] = newStatus;
    localStorage.setItem(STORAGE_KEY_OFFLINE_BOOKMARKS, JSON.stringify(offlineBookmarks));

    // Also update in question map
    const existingRaw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (existingRaw) {
      const questionMap: Record<string, Question> = JSON.parse(existingRaw);
      if (questionMap[questionId]) {
        questionMap[questionId].is_bookmarked = newStatus;
        localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questionMap));
      }
    }

    return newStatus;
  } catch {
    return !currentStatus;
  }
}

/**
 * Clear offline cache
 */
export function clearOfflineQuestionCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_QUESTIONS);
    localStorage.removeItem(STORAGE_KEY_SUBJECTS);
    localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}

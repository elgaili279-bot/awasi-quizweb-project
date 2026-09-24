import {
  User,
  Subject,
  Quiz,
  Question,
  QuizAttempt,
  ReviewQuestion,
  StudentAnalytics,
  LeaderboardEntry,
  QuestionReport,
} from '../types';

const TOKEN_KEY = 'medpulse_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.errors ? data.errors.join(', ') : 'An unexpected error occurred.');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // --- AUTH ---
  register: (payload: any) =>
    request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (payload: any) =>
    request<{ message: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: any) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetCode?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: any) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  switchRole: (role: 'student' | 'teacher') =>
    request<{ message: string; token: string; user: User }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // --- SUBJECTS ---
  getSubjects: () => request<{ subjects: Subject[] }>('/api/subjects'),
  getSubjectById: (id: string) => request<{ subject: Subject }>('/api/subjects/' + id),
  createSubject: (payload: any) =>
    request<{ subject: Subject }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- QUIZZES ---
  getQuizzes: (params?: {
    subject_id?: string;
    topic_id?: string;
    specialty?: string;
    medical_specialty?: string;
    difficulty?: string;
    search?: string;
    myQuizzes?: boolean;
    sort?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.subject_id) query.set('subject_id', params.subject_id);
    if (params?.topic_id) query.set('topic_id', params.topic_id);
    if (params?.specialty || params?.medical_specialty) {
      query.set('specialty', params.specialty || params.medical_specialty || '');
    }
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.search) query.set('search', params.search);
    if (params?.myQuizzes) query.set('myQuizzes', 'true');
    if (params?.sort) query.set('sort', params.sort);
    return request<{ quizzes: Quiz[] }>(`/api/quizzes?${query.toString()}`);
  },

  getQuizById: (id: string) =>
    request<{ quiz: Quiz; questions: Question[] }>(`/api/quizzes/${id}`),

  createQuiz: (payload: any) =>
    request<{ quiz: Quiz; message: string }>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateQuiz: (id: string, payload: any) =>
    request<{ quiz: Quiz; message: string }>(`/api/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteQuiz: (id: string) =>
    request<{ message: string }>(`/api/quizzes/${id}`, {
      method: 'DELETE',
    }),

  publishQuiz: (id: string) =>
    request<{ quiz: Quiz; message: string }>(`/api/quizzes/${id}/publish`, {
      method: 'POST',
    }),

  unpublishQuiz: (id: string) =>
    request<{ quiz: Quiz; message: string }>(`/api/quizzes/${id}/unpublish`, {
      method: 'POST',
    }),

  getQuizStats: (id: string) =>
    request<{
      quiz_id: string;
      title: string;
      total_attempts: number;
      average_score: number;
      pass_rate: number;
      average_time_seconds: number;
      question_analytics: Array<{
        question_id: string;
        question_number: number;
        prompt: string;
        total_answers: number;
        correct_answers: number;
        accuracy_percentage: number;
      }>;
    }>(`/api/quizzes/${id}/stats`),

  // --- QUESTIONS (Quiz Builder) ---
  addQuestion: (quizId: string, payload: any) =>
    request<{ question: Question; message: string }>(`/api/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateQuestion: (quizId: string, questionId: string, payload: any) =>
    request<{ question: Question; message: string }>(`/api/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteQuestion: (quizId: string, questionId: string) =>
    request<{ message: string }>(`/api/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
    }),

  // --- ATTEMPTS & SUBMISSIONS ---
  startAttempt: (quiz_id: string) =>
    request<{ attempt_id: string; quiz: any; started_at: string }>('/api/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ quiz_id }),
    }),

  submitAttempt: (
    attemptId: string,
    payload: {
      answers: Array<{ question_id: string; selected_choice_ids: string[] }>;
      time_spent_seconds: number;
    }
  ) =>
    request<{
      message: string;
      attempt: QuizAttempt;
      summary: {
        score: number;
        max_score: number;
        percentage: number;
        total_questions: number;
        correct_count: number;
        incorrect_count: number;
        unanswered_count: number;
        time_spent_seconds: number;
      };
    }>(`/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAttemptReview: (attemptId: string) =>
    request<{ attempt: QuizAttempt; questions: ReviewQuestion[] }>(`/api/attempts/${attemptId}`),

  getMyAttemptHistory: () =>
    request<{ history: QuizAttempt[] }>('/api/attempts/my/history'),

  getStudentAnalytics: () =>
    request<{ analytics: StudentAnalytics }>('/api/attempts/my/analytics'),

  // --- QUESTION BANK & BOOKMARKS ---
  getQuestionBank: (params?: {
    subject_id?: string;
    topic_id?: string;
    difficulty?: string;
    type?: string;
    search?: string;
    bookmarkedOnly?: boolean;
    incorrectOnly?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.subject_id) query.set('subject_id', params.subject_id);
    if (params?.topic_id) query.set('topic_id', params.topic_id);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.bookmarkedOnly) query.set('bookmarkedOnly', 'true');
    if (params?.incorrectOnly) query.set('incorrectOnly', 'true');
    return request<{ questions: Question[]; total: number }>(`/api/question-bank?${query.toString()}`);
  },

  toggleBookmark: (question_id: string, note?: string) =>
    request<{ question_id: string; is_bookmarked: boolean; message: string }>('/api/question-bank/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ question_id, note }),
    }),

  getBookmarks: () =>
    request<{
      bookmarks: Array<{
        bookmark_id: string;
        created_at: string;
        note?: string;
        question: Question;
      }>;
    }>('/api/question-bank/bookmarks'),

  reportQuestion: (question_id: string, reason: string, details?: string) =>
    request<{ message: string; report: QuestionReport }>('/api/question-bank/reports', {
      method: 'POST',
      body: JSON.stringify({ question_id, reason, details }),
    }),

  // --- LEADERBOARD ---
  getLeaderboard: (subject_id?: string, show_all?: boolean) => {
    const query = new URLSearchParams();
    if (subject_id) query.set('subject_id', subject_id);
    if (show_all) query.set('show_all', 'true');
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<{
      leaderboard: LeaderboardEntry[];
      top_5: LeaderboardEntry[];
      user_private_ranking: any;
      total_participants: number;
      subject_id: string | null;
      subject_name: string;
    }>(`/api/leaderboard${qStr}`);
  },

  getSubjectLeaderboardsSummary: () =>
    request<{
      subject_leaderboards: Array<{
        subject_id: string;
        subject_name: string;
        icon: string;
        top_5: Array<{
          rank: number;
          user_id: string;
          display_name: string;
          medical_school_year: string;
          quizzes_completed: number;
          total_points: number;
        }>;
        total_participants: number;
        user_private_ranking: { rank: number; total_points: number } | null;
      }>;
    }>('/api/leaderboard/subjects-summary'),

  // --- COMMUNITY ---
  getCommunityPosts: (params?: { subject_id?: string; category?: string; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject_id) query.set('subject_id', params.subject_id);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<{ posts: any[] }>(`/api/community/posts${qStr}`);
  },

  getCommunityPostById: (id: string) =>
    request<{ post: any }>(`/api/community/posts/${id}`),

  createCommunityPost: (payload: {
    title: string;
    body: string;
    subject_id?: string;
    category?: string;
    tags?: string[];
    question_id?: string;
  }) =>
    request<{ post: any; message: string }>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createCommunityReply: (postId: string, body: string) =>
    request<{ reply: any; message: string }>(`/api/community/posts/${postId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  toggleUpvotePost: (postId: string) =>
    request<{ upvoted: boolean; count: number }>(`/api/community/posts/${postId}/upvote`, {
      method: 'POST',
    }),

  toggleUpvoteReply: (replyId: string) =>
    request<{ upvoted: boolean; count: number }>(`/api/community/replies/${replyId}/upvote`, {
      method: 'POST',
    }),

  pinCommunityPost: (postId: string, is_pinned: boolean) =>
    request<{ success: boolean; message: string }>(`/api/community/posts/${postId}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ is_pinned }),
    }),

  verifyFacultyReply: (replyId: string, is_verified: boolean) =>
    request<{ success: boolean; message: string }>(`/api/community/replies/${replyId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ is_verified }),
    }),

  deleteCommunityPost: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/community/posts/${id}`, {
      method: 'DELETE',
    }),

  // --- WEAK POINTS (ACTIVE MISTAKE VAULT) ---
  getWeakPoints: () =>
    request<{
      weak_points: any[];
      total_count: number;
      active_count: number;
      mastered_count: number;
    }>('/api/weak-points'),

  toggleWeakPointMastery: (question_id: string, is_mastered: boolean) =>
    request<{ success: boolean; message: string }>(`/api/weak-points/${question_id}/master`, {
      method: 'POST',
      body: JSON.stringify({ is_mastered }),
    }),

  retryWeakPointQuestion: (question_id: string, selected_choice_ids: string[]) =>
    request<{
      is_correct: boolean;
      correct_choice_ids: string[];
      explanation: string;
      learning_point: string;
      reference: string;
      choices: any[];
    }>(`/api/weak-points/${question_id}/retry`, {
      method: 'POST',
      body: JSON.stringify({ selected_choice_ids }),
    }),

  deleteWeakPoint: (question_id: string) =>
    request<{ success: boolean; message: string }>(`/api/weak-points/${question_id}`, {
      method: 'DELETE',
    }),

  // --- ANNOUNCEMENTS ---
  getAnnouncements: (params?: { include_expired?: boolean }) => {
    const qStr = params?.include_expired ? '?include_expired=true' : '';
    return request<{
      announcements: any[];
      archived?: any[];
      total_active?: number;
      total_archived?: number;
    }>(`/api/announcements${qStr}`);
  },

  createAnnouncement: (payload: {
    title: string;
    content: string;
    category?: string;
    priority?: string;
    is_pinned?: boolean;
    expires_at?: string | null;
  }) =>
    request<{ announcement: any; message: string }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAnnouncement: (id: string, payload: {
    title?: string;
    content?: string;
    category?: string;
    priority?: string;
    is_pinned?: boolean;
    expires_at?: string | null;
  }) =>
    request<{ announcement: any; message: string }>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  reactivateAnnouncement: (id: string, payload?: { days?: number; new_expires_at?: string }) =>
    request<{ announcement: any; message: string }>(`/api/announcements/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  deleteAnnouncement: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/announcements/${id}`, {
      method: 'DELETE',
    }),

  syncAnnouncements: (announcements: any[]) =>
    request<{ announcements: any[]; message: string }>('/api/announcements/sync', {
      method: 'POST',
      body: JSON.stringify({ announcements }),
    }),

  // --- TEACHER & BATCH ANALYTICS ---
  getBatchAnalytics: () =>
    request<{
      total_students_active: number;
      total_attempts_recorded: number;
      overall_batch_average: number;
      batch_level_weak_areas: any[];
      frequently_missed_questions: any[];
      subject_breakdowns: any[];
      senior_review_group_recommendations: any[];
    }>('/api/teacher/batch-analytics'),

  getStudentPerformanceCohorts: () =>
    request<{ cohorts: any[] }>('/api/teacher/student-performance-cohorts'),

  getRescueGroups: () =>
    request<{ rescue_groups: any[] }>('/api/teacher/rescue-groups'),

  createRescueGroup: (payload: {
    title: string;
    description?: string;
    subject_id?: string;
    student_ids: string[];
    meeting_schedule?: string;
    notes?: string;
  }) =>
    request<{ group: any; message: string }>('/api/teacher/rescue-groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendSupportMessage: (payload: { student_id: string; title?: string; message: string }) =>
    request<{ success: boolean; message: string }>('/api/teacher/send-support-message', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- ADMIN ---
  getAdminOverview: () =>
    request<{
      metrics: {
        total_users: number;
        students_count: number;
        teachers_count: number;
        total_quizzes: number;
        published_quizzes: number;
        total_questions: number;
        total_attempts: number;
        platform_average_score: number;
        pending_reports_count: number;
      };
    }>('/api/admin/overview'),

  getAdminUsers: (params?: { role?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return request<{ users: User[] }>(`/api/admin/users?${query.toString()}`);
  },

  updateUserStatus: (userId: string, status: 'active' | 'suspended') =>
    request<{ message: string; user: User }>(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateUserRole: (userId: string, role: string) =>
    request<{ message: string; user: User }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  getAdminReports: () =>
    request<{ reports: QuestionReport[] }>('/api/admin/reports'),

  updateReportStatus: (reportId: string, status: 'pending' | 'resolved' | 'dismissed') =>
    request<{ message: string; report: QuestionReport }>(`/api/admin/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getAdminQuizzes: () =>
    request<{ quizzes: any[] }>('/api/admin/quizzes'),

  updateQuizModerationStatus: (quizId: string, status: string) =>
    request<{ message: string; quiz: any }>(`/api/admin/quizzes/${quizId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  seedSampleQuiz: () =>
    request<{ message: string; quiz: any }>('/api/admin/seed-sample-quiz', {
      method: 'POST',
    }),

  // --- GEMINI ACADEMIC CHATBOT & SITE GUIDE ---
  sendGeminiChatMessage: (payload: {
    message: string;
    history?: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>;
  }) =>
    request<{ reply: string; modelUsed: string }>('/api/gemini/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

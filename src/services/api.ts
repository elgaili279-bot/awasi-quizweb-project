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
    difficulty?: string;
    search?: string;
    myQuizzes?: boolean;
    sort?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.subject_id) query.set('subject_id', params.subject_id);
    if (params?.topic_id) query.set('topic_id', params.topic_id);
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
  getLeaderboard: (subject_id?: string) => {
    const query = subject_id ? `?subject_id=${subject_id}` : '';
    return request<{ leaderboard: LeaderboardEntry[]; total_participants: number }>(`/api/leaderboard${query}`);
  },

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
};

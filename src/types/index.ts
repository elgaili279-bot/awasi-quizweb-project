export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'USMLE Step 1' | 'USMLE Step 2 CK';
export type QuizStatus = 'draft' | 'published' | 'unpublished' | 'archived';
export type QuestionType = 'sba' | 'multi_select' | 'true_false' | 'clinical_vignette';

export interface StudentProfile {
  user_id: string;
  medical_school_year: string;
  university?: string;
  bio?: string;
  target_exam?: string;
}

export interface TeacherProfile {
  user_id: string;
  title_specialty: string;
  institution: string;
  bio?: string;
  verified: boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  display_name: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  profile?: StudentProfile | TeacherProfile | null;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  topics?: Topic[];
  quiz_count?: number;
}

export interface ClinicalVignetteData {
  patient_age?: number;
  patient_sex?: 'Male' | 'Female' | 'Other';
  chief_complaint?: string;
  history?: string;
  examination?: string;
  laboratory?: string;
  imaging?: string;
  additional_info?: string;
}

export interface AnswerChoice {
  id: string;
  question_id?: string;
  choice_text: string;
  is_correct?: boolean; // Only visible to teacher or after submission
  explanation?: string;
  display_order: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  prompt: string;
  clinical_vignette?: ClinicalVignetteData;
  explanation: string;
  learning_point: string;
  reference: string;
  difficulty: QuizDifficulty;
  topic_id?: string;
  points: number;
  display_order: number;
  created_at?: string;
  choices: AnswerChoice[];
  is_bookmarked?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  subject_name?: string;
  topic_id?: string;
  topic_name?: string | null;
  difficulty: QuizDifficulty;
  time_limit_minutes: number;
  status: QuizStatus;
  instructions: string;
  created_by: string;
  creator_name?: string;
  creator_role?: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  question_count?: number;
  attempt_count?: number;
  is_owner?: boolean;
}

export interface StudentAnswer {
  question_id: string;
  selected_choice_ids: string[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  subject_id?: string;
  subject_name?: string;
  difficulty?: QuizDifficulty;
  student_id: string;
  started_at: string;
  completed_at?: string | null;
  score: number;
  max_score: number;
  percentage: number;
  time_spent_seconds: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
}

export interface ReviewQuestion extends Question {
  question_number: number;
  student_answer: {
    selected_choice_ids: string[];
    is_correct: boolean;
    points_earned: number;
  };
}

export interface StudentAnalytics {
  total_quizzes_completed: number;
  average_score: number;
  questions_answered: number;
  accuracy: number;
  subject_performance: Array<{
    subject_id: string;
    subject_name: string;
    total_questions: number;
    correct_questions: number;
    accuracy: number;
  }>;
  weak_areas: Array<{
    topic_id: string;
    topic_name: string;
    subject_name: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  recent_activity: Array<{
    attempt_id: string;
    quiz_title: string;
    percentage: number;
    score: number;
    max_score: number;
    completed_at: string;
  }>;
  achievements: Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    unlocked_at: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  medical_school_year: string;
  university?: string;
  quizzes_completed: number;
  total_points: number;
  accuracy: number;
  average_score: number;
  clinical_rank: string;
}

export interface QuestionReport {
  id: string;
  question_id: string;
  reported_by: string;
  reporter_name?: string;
  question_prompt?: string;
  quiz_title?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string | null;
}

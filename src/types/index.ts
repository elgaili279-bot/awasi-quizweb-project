export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Curriculum Core' | 'Clinical Case';
export type QuizStatus = 'draft' | 'published' | 'unpublished' | 'archived';
export type QuestionType = 'sba' | 'multi_select' | 'true_false' | 'clinical_vignette';

export interface StudentProfile {
  user_id: string;
  student_id: string;
  academic_year: string;
  medical_school_year?: string;
  university?: string;
  academic_focus?: string;
  bio?: string;
  target_exam?: string;
}

export interface TeacherProfile {
  user_id: string;
  title_specialty?: string;
  institution?: string;
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
  subject_id?: string;
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
  is_incorrect?: boolean;
  user_stats?: {
    has_incorrect_history?: boolean;
  };
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  subject_ids?: string[]; // Multiple subjects for combined / comprehensive mock exams
  subject_name?: string;
  topic_id?: string;
  topic_name?: string | null;
  medical_specialty?: string;
  difficulty: QuizDifficulty;
  time_limit_minutes: number;
  max_attempts?: number; // 0 for unlimited, 1, 2, etc.
  is_mock_exam?: boolean; // Flag for realistic mock exam mode
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
  user_completed_attempts?: number; // Current logged-in student's completed attempts count
  can_attempt?: boolean;
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
  subject_ids?: string[];
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
  attempt_number?: number;
  is_first_attempt?: boolean; // Only first attempt counts on official leaderboard!
  flagged_question_ids?: string[];
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

// --- WEAK POINTS (ACTIVE MISTAKE VAULT) ---
export interface WeakPoint {
  id: string;
  student_id: string;
  question_id: string;
  subject_id: string;
  subject_name?: string;
  topic_id?: string;
  topic_name?: string;
  medical_specialty?: string;
  times_incorrect: number;
  times_correct: number;
  is_mastered: boolean;
  last_attempted_at: string;
  mastered_at?: string | null;
  question?: Question;
}

// --- INTERACTIVE ACADEMIC COMMUNITY ---
export interface CommunityReply {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  medical_school_year?: string;
  body: string;
  is_faculty_verified: boolean;
  upvotes: string[];
  has_upvoted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  medical_school_year?: string;
  title: string;
  body: string;
  subject_id?: string;
  subject_name?: string;
  category: 'clinical_question' | 'difficult_concept' | 'study_suggestion' | 'exam_clarification' | 'general_academic';
  tags: string[];
  question_id?: string;
  is_pinned: boolean;
  is_faculty_approved: boolean;
  upvotes: string[];
  has_upvoted?: boolean;
  reply_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  replies?: CommunityReply[];
}

// --- ANNOUNCEMENTS ---
export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  category: 'exam_alert' | 'general' | 'update' | 'competition' | 'revision';
  priority: 'high' | 'normal';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// --- PRIVATE ACADEMIC SUPPORT / RESCUE GROUPS ---
export interface RescueGroup {
  id: string;
  title: string;
  description: string;
  subject_id?: string;
  subject_name?: string;
  created_by: string;
  creator_name?: string;
  student_ids: string[];
  student_names?: string[];
  meeting_schedule?: string;
  notes?: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface StudentPerformanceCohort {
  user_id: string;
  display_name: string;
  email: string;
  medical_school_year: string;
  total_quizzes_completed: number;
  average_score: number;
  accuracy: number;
  level: 'Strong' | 'Developing' | 'Needs Revision';
  weak_subjects: Array<{ subject_id: string; subject_name: string; accuracy: number }>;
}

export interface BatchAnalytics {
  total_students_active: number;
  total_attempts_recorded: number;
  overall_batch_average: number;
  batch_level_weak_areas: Array<{
    topic_id: string;
    topic_name: string;
    subject_name: string;
    total_attempts: number;
    failure_rate_percentage: number;
    average_score: number;
  }>;
  frequently_missed_questions: Array<{
    question_id: string;
    prompt: string;
    subject_name: string;
    medical_specialty?: string;
    total_attempts: number;
    incorrect_count: number;
    incorrect_rate_percentage: number;
    common_distractor?: string;
  }>;
  subject_breakdowns: Array<{
    subject_id: string;
    subject_name: string;
    average_accuracy: number;
    total_questions_attempted: number;
    student_participation_count: number;
    status: 'Strong' | 'Developing' | 'Needs Revision';
  }>;
  senior_review_group_recommendations: Array<{
    subject_name: string;
    topic_name: string;
    error_rate: number;
    reason: string;
    suggested_focus: string;
  }>;
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

export interface SubjectLeaderboardResponse {
  subject_id?: string;
  subject_name?: string;
  top_5: LeaderboardEntry[];
  total_participants: number;
  current_user_rank?: {
    rank: number;
    total_points: number;
    accuracy: number;
    quizzes_completed: number;
    clinical_rank: string;
  } | null;
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

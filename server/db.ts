import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string;
  display_name: string;
  status: 'active' | 'suspended';
  reset_token?: string | null;
  reset_expires?: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
}

export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Curriculum Core' | 'Clinical Case';
export type QuizStatus = 'draft' | 'published' | 'unpublished' | 'archived';
export type QuestionType = 'sba' | 'multi_select' | 'true_false' | 'clinical_vignette';

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
  question_id: string;
  choice_text: string;
  is_correct: boolean;
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
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  subject_ids?: string[]; // Multiple subjects for combined/comprehensive exams
  topic_id?: string;
  medical_specialty?: string;
  difficulty: QuizDifficulty;
  time_limit_minutes: number; // 0 for untimed
  max_attempts?: number; // 0 for unlimited, 1, 2, etc.
  is_mock_exam?: boolean; // Real mock exam mode flag
  status: QuizStatus;
  instructions: string;
  created_by: string; // Teacher or Admin User ID
  created_at: string;
  updated_at: string;
  view_count: number;
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_choice_ids: string[];
  is_correct: boolean;
  points_earned: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  completed_at?: string | null;
  score: number;
  max_score: number;
  percentage: number;
  time_spent_seconds: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  attempt_number?: number;
  is_first_attempt?: boolean; // Strictly enforced: only first attempt counts on official leaderboard!
  flagged_question_ids?: string[];
}

export interface Bookmark {
  id: string;
  student_id: string;
  question_id: string;
  created_at: string;
  note?: string;
}

export interface QuestionReport {
  id: string;
  question_id: string;
  reported_by: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface WeakPoint {
  id: string;
  student_id: string;
  question_id: string;
  subject_id: string;
  topic_id?: string;
  times_incorrect: number;
  times_correct: number;
  is_mastered: boolean;
  last_attempted_at: string;
  mastered_at?: string | null;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  is_faculty_verified: boolean;
  upvotes: string[];
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  body: string;
  subject_id?: string;
  category: 'clinical_question' | 'difficult_concept' | 'study_suggestion' | 'exam_clarification' | 'general_academic';
  tags: string[];
  question_id?: string;
  is_pinned: boolean;
  is_faculty_approved: boolean;
  upvotes: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: 'exam_alert' | 'general' | 'update' | 'competition' | 'revision';
  priority: 'high' | 'normal';
  is_pinned: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RescueGroup {
  id: string;
  title: string;
  description: string;
  subject_id?: string;
  created_by: string;
  student_ids: string[];
  meeting_schedule?: string;
  notes?: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface PrivateNotification {
  id: string;
  user_id: string;
  type: 'support_invitation' | 'encouragement' | 'weak_point_reminder' | 'exam_alert' | 'community_reply';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  student_profiles: StudentProfile[];
  teacher_profiles: TeacherProfile[];
  subjects: Subject[];
  topics: Topic[];
  quizzes: Quiz[];
  questions: Question[];
  answer_choices: AnswerChoice[];
  quiz_attempts: QuizAttempt[];
  student_answers: StudentAnswer[];
  bookmarks: Bookmark[];
  question_reports: QuestionReport[];
  user_achievements: UserAchievement[];
  weak_points: WeakPoint[];
  community_posts: CommunityPost[];
  community_replies: CommunityReply[];
  announcements: Announcement[];
  rescue_groups: RescueGroup[];
  private_notifications: PrivateNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'medpulse_db.json');
const DB_TMP_FILE = path.join(DATA_DIR, 'medpulse_db.tmp');

class Database {
  private data: DatabaseSchema = {
    users: [],
    student_profiles: [],
    teacher_profiles: [],
    subjects: [],
    topics: [],
    quizzes: [],
    questions: [],
    answer_choices: [],
    quiz_attempts: [],
    student_answers: [],
    bookmarks: [],
    question_reports: [],
    user_achievements: [],
    weak_points: [],
    community_posts: [],
    community_replies: [],
    announcements: [],
    rescue_groups: [],
    private_notifications: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          student_profiles: parsed.student_profiles || [],
          teacher_profiles: parsed.teacher_profiles || [],
          subjects: parsed.subjects || [],
          topics: parsed.topics || [],
          quizzes: [],
          questions: [],
          answer_choices: [],
          quiz_attempts: [],
          student_answers: [],
          bookmarks: [],
          question_reports: [],
          user_achievements: parsed.user_achievements || [],
          weak_points: [],
          community_posts: parsed.community_posts || [],
          community_replies: parsed.community_replies || [],
          announcements: parsed.announcements || [],
          rescue_groups: parsed.rescue_groups || [],
          private_notifications: parsed.private_notifications || [],
        };
        this.syncBatch99Curriculum();
        this.syncInitialAnnouncementsAndCommunity();
        this.persist();
      } catch (err) {
        console.error('Failed to read database file, initializing default:', err);
        this.seedInitialConfig();
        this.syncInitialAnnouncementsAndCommunity();
        this.persist();
      }
    } else {
      this.seedInitialConfig();
      this.syncInitialAnnouncementsAndCommunity();
      this.persist();
    }
  }

  private static readonly BATCH_99_SUBJECTS: Array<{ name: string; icon: string; description: string; topics: string[] }> = [
    {
      name: 'Pathology',
      icon: 'Microscope',
      description: 'General and systemic pathology, cellular adaptation and injury, inflammation, neoplasia, hemodynamic disorders, and diagnostic histopathology.',
      topics: ['Cellular Injury & Necrosis', 'Acute & Chronic Inflammation', 'Neoplasia & Tumor Biology', 'Hemodynamic Disorders & Thromboembolism', 'Systemic Pathologies']
    },
    {
      name: 'Psychiatry',
      icon: 'Brain',
      description: 'Clinical psychiatric evaluation, affective and psychotic disorders, anxiety conditions, substance abuse, cognitive impairments, and psychopharmacology.',
      topics: ['Mood & Depressive Disorders', 'Schizophrenia & Psychotic Illness', 'Anxiety & Trauma-Related Disorders', 'Substance Abuse & Dependence', 'Clinical Psychopharmacology']
    },
    {
      name: 'Radiology',
      icon: 'Scan',
      description: 'Diagnostic medical imaging, radiographic interpretation, computed tomography (CT), magnetic resonance imaging (MRI), and ultrasound correlation.',
      topics: ['Chest & Abdominal Plain Radiographs', 'Computed Tomography (CT) Principles', 'Magnetic Resonance Imaging (MRI)', 'Ultrasound & Doppler Modalities', 'Emergency Radiologic Findings']
    },
    {
      name: 'ENT',
      icon: 'Activity',
      description: 'Otorhinolaryngology, hearing disorders, otitis media and complications, rhinosinusitis, epistaxis, upper airway obstructions, and neck lesions.',
      topics: ['Otology & Hearing Loss', 'Vestibular Disorders & Vertigo', 'Rhinosinusitis & Epistaxis', 'Pharyngolaryngeal & Airway Emergencies', 'Head & Neck Neoplasms']
    },
    {
      name: 'Ethics',
      icon: 'Scale',
      description: 'Clinical bioethics, medical professionalism, patient autonomy and informed consent, confidentiality, beneficence, and medico-legal responsibilities.',
      topics: ['Informed Consent & Decision-Making Capacity', 'Patient Autonomy & Beneficence', 'Medical Confidentiality & Privacy', 'End-of-Life Decisions & Palliative Ethics', 'Professional Conduct & Medico-Legal Duty']
    },
    {
      name: 'Dermatology',
      icon: 'ShieldCheck',
      description: 'Cutaneous anatomy, morphology of skin lesions, papulosquamous diseases, dermatological emergencies, cutaneous infections, and systemic manifestations.',
      topics: ['Primary & Secondary Cutaneous Lesions', 'Papulosquamous Disorders', 'Cutaneous Infections (Bacterial, Fungal, Viral)', 'Vesiculobullous Dermatoses', 'Dermatological Emergencies & Drug Eruptions']
    },
    {
      name: 'Forensic and Toxicology',
      icon: 'FileCheck2',
      description: 'Forensic medicine and medical jurisprudence, postmortem changes, trauma analysis, acute clinical poisonings, toxidromes, and overdose management.',
      topics: ['Postmortem Changes & Time of Death', 'Forensic Traumatology & Wound Analysis', 'Clinical Toxidromes & Antidotes', 'Common Acute Poisonings', 'Medical Jurisprudence & Autopsy Findings']
    },
    {
      name: 'Ophthalmology',
      icon: 'Eye',
      description: 'Clinical optics and refractive errors, ocular emergencies, red eye differential diagnosis, glaucoma, cataract, retinal disorders, and ophthalmoscopy.',
      topics: ['Red Eye Differential Diagnosis', 'Glaucoma (Open-Angle & Angle-Closure)', 'Cataract & Lens Pathologies', 'Retinal Diseases & Fundoscopy', 'Ocular Trauma & Acute Vision Loss']
    },
    {
      name: 'Infectious Diseases',
      icon: 'Bug',
      description: 'Clinical microbiology, endemic bacterial, viral, parasitic, and fungal infections, fever of unknown origin, infection control, and antimicrobial stewardship.',
      topics: ['Endemic Febrile Illnesses (Malaria, Typhoid, Leishmaniasis)', 'Community & Hospital-Acquired Pneumonia', 'Tuberculosis & Opportunistic Pathogens', 'Viral Hepatitis & Retroviral Syndromes', 'Antimicrobial Resistance & Rational Therapy']
    },
    {
      name: 'Community Medicine',
      icon: 'Users',
      description: 'Epidemiology, public health, biostatistics, primary health care, maternal and child health, communicable and non-communicable disease control, and environmental health.',
      topics: [
        'Epidemiology & Study Designs',
        'Biostatistics & Health Indicators',
        'Primary Health Care & Health Systems',
        'Communicable & Non-Communicable Disease Control',
        'Maternal & Child Health and Nutrition',
        'Environmental & Occupational Health'
      ]
    }
  ];

  public syncBatch99Curriculum() {
    if (!this.data.subjects) this.data.subjects = [];
    if (!this.data.topics) this.data.topics = [];

    // Replace subjects with the 9 Batch 99 curriculum subjects
    const newSubjects: Subject[] = [];
    const newTopics: Topic[] = [];

    Database.BATCH_99_SUBJECTS.forEach((sub, sIdx) => {
      const subId = `sub_${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      newSubjects.push({
        id: subId,
        name: sub.name,
        slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: sub.description,
        icon: sub.icon,
        is_active: true,
        display_order: sIdx + 1,
      });

      sub.topics.forEach((topName, tIdx) => {
        newTopics.push({
          id: `top_${subId}_${tIdx + 1}`,
          subject_id: subId,
          name: topName,
          slug: topName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `Key clinical concepts and questions in ${topName}`,
          display_order: tIdx + 1,
        });
      });
    });

    this.data.subjects = newSubjects;
    this.data.topics = newTopics;
  }

  public syncSampleQuizzesForSpecialties() {
    // No sample quizzes: database starts clean with user-created / faculty-created quizzes only
  }

  private seedInitialConfig() {
    // Hash password helper
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('AdminPass123!', salt, 100000, 64, 'sha512').toString('hex');

    const adminUser: User = {
      id: 'usr_admin_001',
      email: 'admin@medpulse.edu',
      password_hash: hash,
      salt: salt,
      role: 'admin',
      full_name: 'Dr. Elizabeth Blackwell',
      display_name: 'Platform Administrator',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.users = [adminUser];
    this.syncBatch99Curriculum();
    this.data.quizzes = [];
    this.data.questions = [];
    this.data.answer_choices = [];
    this.data.quiz_attempts = [];
    this.data.student_answers = [];
    this.data.bookmarks = [];
    this.data.question_reports = [];
    this.data.user_achievements = [];
  }

  public persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
      try {
        fs.writeFileSync(DB_TMP_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        fs.renameSync(DB_TMP_FILE, DB_FILE);
      } catch (backupErr) {
        console.error('Failed backup database write:', backupErr);
      }
    }
  }

  // --- USERS ---
  public findUserById(id: string): User | undefined {
    const u = this.data.users.find(user => user.id === id);
    if (u && u.email.toLowerCase() === 'elgaili279@gmail.com' && u.role !== 'teacher') {
      u.role = 'teacher';
      this.persist();
    }
    return u;
  }

  public findUserByEmail(email: string): User | undefined {
    const u = this.data.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (u && u.email.toLowerCase() === 'elgaili279@gmail.com' && u.role !== 'teacher') {
      u.role = 'teacher';
      this.persist();
    }
    return u;
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.users[idx];
  }

  public getAllUsers(): User[] {
    return [...this.data.users];
  }

  // --- PROFILES ---
  public getStudentProfile(userId: string): StudentProfile | undefined {
    return this.data.student_profiles.find(p => p.user_id === userId);
  }

  public findStudentByStudentId(studentId: string): StudentProfile | undefined {
    if (!studentId) return undefined;
    return this.data.student_profiles.find(
      p => p.student_id && p.student_id.trim().toLowerCase() === studentId.trim().toLowerCase()
    );
  }

  public setStudentProfile(profile: StudentProfile): StudentProfile {
    const idx = this.data.student_profiles.findIndex(p => p.user_id === profile.user_id);
    if (idx >= 0) {
      this.data.student_profiles[idx] = profile;
    } else {
      this.data.student_profiles.push(profile);
    }
    this.persist();
    return profile;
  }

  public getTeacherProfile(userId: string): TeacherProfile | undefined {
    return this.data.teacher_profiles.find(p => p.user_id === userId);
  }

  public setTeacherProfile(profile: TeacherProfile): TeacherProfile {
    const idx = this.data.teacher_profiles.findIndex(p => p.user_id === profile.user_id);
    if (idx >= 0) {
      this.data.teacher_profiles[idx] = profile;
    } else {
      this.data.teacher_profiles.push(profile);
    }
    this.persist();
    return profile;
  }

  // --- SUBJECTS & TOPICS ---
  public getSubjects(): Subject[] {
    return [...this.data.subjects].sort((a, b) => a.display_order - b.display_order);
  }

  public getSubjectById(id: string): Subject | undefined {
    return this.data.subjects.find(s => s.id === id);
  }

  public createSubject(sub: Subject): Subject {
    this.data.subjects.push(sub);
    this.persist();
    return sub;
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject | undefined {
    const idx = this.data.subjects.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.subjects[idx] = { ...this.data.subjects[idx], ...updates };
    this.persist();
    return this.data.subjects[idx];
  }

  public getTopics(subjectId?: string): Topic[] {
    if (subjectId) {
      return this.data.topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.display_order - b.display_order);
    }
    return [...this.data.topics].sort((a, b) => a.display_order - b.display_order);
  }

  public getTopicById(id: string): Topic | undefined {
    return this.data.topics.find(t => t.id === id);
  }

  public createTopic(topic: Topic): Topic {
    this.data.topics.push(topic);
    this.persist();
    return topic;
  }

  // --- QUIZZES ---
  public getQuizzes(filter?: {
    status?: QuizStatus | QuizStatus[];
    subject_id?: string;
    topic_id?: string;
    medical_specialty?: string;
    created_by?: string;
    difficulty?: QuizDifficulty;
    search?: string;
  }): Quiz[] {
    let result = [...this.data.quizzes];

    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      result = result.filter(q => statuses.includes(q.status));
    }
    if (filter?.subject_id) {
      result = result.filter(q => q.subject_id === filter.subject_id);
    }
    if (filter?.topic_id) {
      result = result.filter(q => q.topic_id === filter.topic_id);
    }
    if (filter?.medical_specialty) {
      const spec = filter.medical_specialty.toLowerCase();
      result = result.filter(q => (q.medical_specialty || '').toLowerCase() === spec);
    }
    if (filter?.created_by) {
      result = result.filter(q => q.created_by === filter.created_by);
    }
    if (filter?.difficulty) {
      result = result.filter(q => q.difficulty === filter.difficulty);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(quiz =>
        quiz.title.toLowerCase().includes(q) ||
        quiz.description.toLowerCase().includes(q) ||
        (quiz.medical_specialty && quiz.medical_specialty.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.data.quizzes.find(q => q.id === id);
  }

  public createQuiz(quiz: Quiz): Quiz {
    this.data.quizzes.push(quiz);
    this.persist();
    return quiz;
  }

  public updateQuiz(id: string, updates: Partial<Quiz>): Quiz | undefined {
    const idx = this.data.quizzes.findIndex(q => q.id === id);
    if (idx === -1) return undefined;
    this.data.quizzes[idx] = {
      ...this.data.quizzes[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.quizzes[idx];
  }

  public deleteQuiz(id: string): boolean {
    const idx = this.data.quizzes.findIndex(q => q.id === id);
    if (idx === -1) return false;
    // Cascade delete questions and choices
    const questionsToDelete = this.data.questions.filter(q => q.quiz_id === id);
    const questionIds = new Set(questionsToDelete.map(q => q.id));

    this.data.answer_choices = this.data.answer_choices.filter(c => !questionIds.has(c.question_id));
    this.data.questions = this.data.questions.filter(q => q.quiz_id !== id);
    this.data.quizzes.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- QUESTIONS & CHOICES ---
  public getQuestionsByQuizId(quizId: string): Question[] {
    return this.data.questions
      .filter(q => q.quiz_id === quizId)
      .sort((a, b) => a.display_order - b.display_order);
  }

  public getQuestionById(id: string): Question | undefined {
    return this.data.questions.find(q => q.id === id);
  }

  public createQuestion(q: Question, choices: Omit<AnswerChoice, 'question_id'>[]): Question {
    this.data.questions.push(q);
    choices.forEach((choice, idx) => {
      this.data.answer_choices.push({
        ...choice,
        id: choice.id || `choice_${crypto.randomUUID()}`,
        question_id: q.id,
        display_order: choice.display_order ?? idx + 1,
      });
    });
    this.persist();
    return q;
  }

  public updateQuestion(
    questionId: string,
    updates: Partial<Question>,
    choices?: Array<Partial<AnswerChoice> & { id?: string; choice_text: string; is_correct: boolean }>
  ): Question | undefined {
    const idx = this.data.questions.findIndex(q => q.id === questionId);
    if (idx === -1) return undefined;

    this.data.questions[idx] = { ...this.data.questions[idx], ...updates };

    if (choices) {
      // Replace choices for this question
      this.data.answer_choices = this.data.answer_choices.filter(c => c.question_id !== questionId);
      choices.forEach((c, cIdx) => {
        this.data.answer_choices.push({
          id: c.id || `choice_${crypto.randomUUID()}`,
          question_id: questionId,
          choice_text: c.choice_text,
          is_correct: c.is_correct,
          explanation: c.explanation,
          display_order: c.display_order ?? cIdx + 1,
        });
      });
    }

    this.persist();
    return this.data.questions[idx];
  }

  public deleteQuestion(id: string): boolean {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.data.answer_choices = this.data.answer_choices.filter(c => c.question_id !== id);
    this.data.questions.splice(idx, 1);
    this.persist();
    return true;
  }

  public getChoicesByQuestionId(questionId: string): AnswerChoice[] {
    return this.data.answer_choices
      .filter(c => c.question_id === questionId)
      .sort((a, b) => a.display_order - b.display_order);
  }

  public getChoicesByQuestionIds(questionIds: string[]): AnswerChoice[] {
    const set = new Set(questionIds);
    return this.data.answer_choices
      .filter(c => set.has(c.question_id))
      .sort((a, b) => a.display_order - b.display_order);
  }

  // --- QUIZ ATTEMPTS & ANSWERS ---
  public createAttempt(attempt: QuizAttempt): QuizAttempt {
    this.data.quiz_attempts.push(attempt);
    this.persist();
    return attempt;
  }

  public getAttemptById(id: string): QuizAttempt | undefined {
    return this.data.quiz_attempts.find(a => a.id === id);
  }

  public getAttemptsByStudent(studentId: string): QuizAttempt[] {
    return this.data.quiz_attempts
      .filter(a => a.student_id === studentId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  public getAttemptsByQuizId(quizId: string): QuizAttempt[] {
    return this.data.quiz_attempts.filter(a => a.quiz_id === quizId);
  }

  public recordAttemptSubmission(
    attemptId: string,
    submissionData: {
      score: number;
      max_score: number;
      percentage: number;
      time_spent_seconds: number;
      completed_at: string;
      student_answers: StudentAnswer[];
    }
  ): QuizAttempt | undefined {
    const idx = this.data.quiz_attempts.findIndex(a => a.id === attemptId);
    if (idx === -1) return undefined;

    this.data.quiz_attempts[idx] = {
      ...this.data.quiz_attempts[idx],
      score: submissionData.score,
      max_score: submissionData.max_score,
      percentage: submissionData.percentage,
      time_spent_seconds: submissionData.time_spent_seconds,
      completed_at: submissionData.completed_at,
      status: 'completed',
    };

    // Remove any previous answers for this attempt (if partial saved)
    this.data.student_answers = this.data.student_answers.filter(sa => sa.attempt_id !== attemptId);
    this.data.student_answers.push(...submissionData.student_answers);

    this.persist();
    return this.data.quiz_attempts[idx];
  }

  public getStudentAnswersByAttemptId(attemptId: string): StudentAnswer[] {
    return this.data.student_answers.filter(sa => sa.attempt_id === attemptId);
  }

  public getAllCompletedAttempts(): QuizAttempt[] {
    return this.data.quiz_attempts.filter(a => a.status === 'completed');
  }

  public getAllStudentAnswers(): StudentAnswer[] {
    return [...this.data.student_answers];
  }

  public getAllQuestions(): Question[] {
    return [...this.data.questions];
  }

  // --- BOOKMARKS ---
  public getBookmarksByStudent(studentId: string): Bookmark[] {
    return this.data.bookmarks.filter(b => b.student_id === studentId);
  }

  public isQuestionBookmarked(studentId: string, questionId: string): boolean {
    return this.data.bookmarks.some(b => b.student_id === studentId && b.question_id === questionId);
  }

  public toggleBookmark(studentId: string, questionId: string, note?: string): boolean {
    const idx = this.data.bookmarks.findIndex(b => b.student_id === studentId && b.question_id === questionId);
    if (idx >= 0) {
      this.data.bookmarks.splice(idx, 1);
      this.persist();
      return false; // unbookmarked
    } else {
      this.data.bookmarks.push({
        id: `bm_${crypto.randomUUID()}`,
        student_id: studentId,
        question_id: questionId,
        created_at: new Date().toISOString(),
        note: note || '',
      });
      this.persist();
      return true; // bookmarked
    }
  }

  // --- QUESTION REPORTS ---
  public createReport(report: QuestionReport): QuestionReport {
    this.data.question_reports.push(report);
    this.persist();
    return report;
  }

  public getReports(): QuestionReport[] {
    return [...this.data.question_reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public updateReport(id: string, updates: Partial<QuestionReport>): QuestionReport | undefined {
    const idx = this.data.question_reports.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.data.question_reports[idx] = { ...this.data.question_reports[idx], ...updates };
    this.persist();
    return this.data.question_reports[idx];
  }

  // --- ACHIEVEMENTS ---
  public getAchievements(userId: string): UserAchievement[] {
    return this.data.user_achievements.filter(a => a.user_id === userId);
  }

  public awardAchievement(userId: string, achievement: Omit<UserAchievement, 'id' | 'user_id' | 'unlocked_at'>) {
    const exists = this.data.user_achievements.some(a => a.user_id === userId && a.code === achievement.code);
    if (!exists) {
      this.data.user_achievements.push({
        ...achievement,
        id: `ach_${crypto.randomUUID()}`,
        user_id: userId,
        unlocked_at: new Date().toISOString(),
      });
      this.persist();
    }
  }
  // --- INITIAL ANNOUNCEMENTS & COMMUNITY SYNC ---
  private syncInitialAnnouncementsAndCommunity() {
    if (this.data.announcements.length === 0) {
      const admin = this.data.users.find(u => u.role === 'admin') || this.data.users[0];
      const adminId = admin ? admin.id : 'user_admin_001';

      this.data.announcements.push(
        {
          id: 'ann_welcome_mock',
          title: 'Official Launch of Batch 99 Mock Examination Series',
          content: 'The academic coordination committee has finalized the timed Mock Exam schedules covering the 9 core subjects (Pathology, Psychiatry, Radiology, ENT, Ethics, Dermatology, Forensic & Toxicology, Ophthalmology, and Infectious Diseases). Timed mock exams feature live countdown timers and strict single-first-attempt leaderboard records.',
          author_id: adminId,
          category: 'exam_alert',
          priority: 'high',
          is_pinned: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ann_community_intro',
          title: 'Interactive Academic Community & Weak Points Vault Active',
          content: 'Batch 99 students can now discuss clinical questions, clarify complex concepts, and review personal mistakes automatically saved in their Weak Points mistake vault to master difficult high-yield topics.',
          author_id: adminId,
          category: 'update',
          priority: 'normal',
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
    }

    if (this.data.community_posts.length === 0) {
      const student = this.data.users.find(u => u.role === 'student');
      const teacher = this.data.users.find(u => u.role === 'teacher');
      const entSubject = this.data.subjects.find(s => s.name === 'ENT');
      const pathSubject = this.data.subjects.find(s => s.name === 'Pathology');

      if (student && entSubject) {
        const postId = 'post_ent_audiometry';
        this.data.community_posts.push({
          id: postId,
          author_id: student.id,
          title: 'Differentiating Carhart Notch vs Acoustic Neuroma Roll-Over on Audiometry',
          body: 'When reviewing pure-tone audiometry for Otosclerosis vs Retrocochlear pathologies, what is the fastest clinical heuristic to avoid confusing the 2000 Hz bone conduction dip (Carhart notch) with high-frequency sensorineural losses? Any high-yield mnemonics for Batch 99 exams?',
          subject_id: entSubject.id,
          category: 'difficult_concept',
          tags: ['ENT', 'Audiometry', 'Otosclerosis', 'Carhart Notch'],
          is_pinned: true,
          is_faculty_approved: true,
          upvotes: [student.id],
          view_count: 42,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        });

        if (teacher) {
          this.data.community_replies.push({
            id: 'rep_ent_faculty_1',
            post_id: postId,
            author_id: teacher.id,
            body: 'Excellent question! Remember that Carhart Notch is an *artifactual* bone conduction dip at 2 kHz caused by stapedial fixation reducing the inertial component of bone conduction. It resolves completely following successful stapedotomy. In contrast, acoustic neuroma presents with disproportionately poor Speech Discrimination Scores (PB rollover) relative to pure-tone thresholds.',
            is_faculty_verified: true,
            upvotes: [student.id, teacher.id],
            created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          });
        }
      }
    }
  }

  // --- WEAK POINTS (ACTIVE MISTAKE VAULT) ---
  public getWeakPointsByStudent(studentId: string): WeakPoint[] {
    return this.data.weak_points
      .filter(w => w.student_id === studentId)
      .sort((a, b) => new Date(b.last_attempted_at).getTime() - new Date(a.last_attempted_at).getTime());
  }

  public recordWeakPoint(studentId: string, questionId: string, subjectId: string, topicId?: string): WeakPoint {
    const existingIdx = this.data.weak_points.findIndex(w => w.student_id === studentId && w.question_id === questionId);
    const now = new Date().toISOString();

    if (existingIdx >= 0) {
      const current = this.data.weak_points[existingIdx];
      this.data.weak_points[existingIdx] = {
        ...current,
        times_incorrect: current.times_incorrect + 1,
        is_mastered: false, // reset mastery upon fresh mistake
        mastered_at: null,
        last_attempted_at: now,
      };
      this.persist();
      return this.data.weak_points[existingIdx];
    } else {
      const newWeak: WeakPoint = {
        id: `wp_${crypto.randomUUID()}`,
        student_id: studentId,
        question_id: questionId,
        subject_id: subjectId,
        topic_id: topicId,
        times_incorrect: 1,
        times_correct: 0,
        is_mastered: false,
        last_attempted_at: now,
        mastered_at: null,
      };
      this.data.weak_points.push(newWeak);
      this.persist();
      return newWeak;
    }
  }

  public recordWeakPointSuccess(studentId: string, questionId: string): void {
    const existingIdx = this.data.weak_points.findIndex(w => w.student_id === studentId && w.question_id === questionId);
    if (existingIdx >= 0) {
      const current = this.data.weak_points[existingIdx];
      const newTimesCorrect = current.times_correct + 1;
      const isMastered = newTimesCorrect >= 2; // Auto-master after 2 consecutive correct answers
      this.data.weak_points[existingIdx] = {
        ...current,
        times_correct: newTimesCorrect,
        is_mastered: isMastered ? true : current.is_mastered,
        mastered_at: isMastered && !current.is_mastered ? new Date().toISOString() : current.mastered_at,
        last_attempted_at: new Date().toISOString(),
      };
      this.persist();
    }
  }

  public setWeakPointMastered(studentId: string, questionId: string, isMastered: boolean): boolean {
    const existingIdx = this.data.weak_points.findIndex(w => w.student_id === studentId && w.question_id === questionId);
    if (existingIdx === -1) return false;
    this.data.weak_points[existingIdx] = {
      ...this.data.weak_points[existingIdx],
      is_mastered: isMastered,
      mastered_at: isMastered ? new Date().toISOString() : null,
      last_attempted_at: new Date().toISOString(),
    };
    this.persist();
    return true;
  }

  public deleteWeakPoint(studentId: string, questionId: string): boolean {
    const idx = this.data.weak_points.findIndex(w => w.student_id === studentId && w.question_id === questionId);
    if (idx === -1) return false;
    this.data.weak_points.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- INTERACTIVE ACADEMIC COMMUNITY ---
  public getCommunityPosts(filter?: {
    subject_id?: string;
    category?: string;
    search?: string;
    sort?: 'newest' | 'upvotes' | 'replies';
  }): CommunityPost[] {
    let posts = [...this.data.community_posts];

    if (filter?.subject_id) {
      posts = posts.filter(p => p.subject_id === filter.subject_id);
    }

    if (filter?.category) {
      posts = posts.filter(p => p.category === filter.category);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (filter?.sort === 'upvotes') {
      posts.sort((a, b) => b.upvotes.length - a.upvotes.length);
    } else if (filter?.sort === 'replies') {
      const getReplyCount = (id: string) => this.data.community_replies.filter(r => r.post_id === id).length;
      posts.sort((a, b) => getReplyCount(b.id) - getReplyCount(a.id));
    } else {
      // Pinned posts first, then newest
      posts.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return posts;
  }

  public getCommunityPostById(id: string): CommunityPost | undefined {
    return this.data.community_posts.find(p => p.id === id);
  }

  public createCommunityPost(post: CommunityPost): CommunityPost {
    this.data.community_posts.push(post);
    this.persist();
    return post;
  }

  public updateCommunityPost(id: string, updates: Partial<CommunityPost>): CommunityPost | undefined {
    const idx = this.data.community_posts.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.community_posts[idx] = {
      ...this.data.community_posts[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.data.community_posts[idx];
  }

  public deleteCommunityPost(id: string): boolean {
    const idx = this.data.community_posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.community_posts.splice(idx, 1);
    this.data.community_replies = this.data.community_replies.filter(r => r.post_id !== id);
    this.persist();
    return true;
  }

  public toggleUpvotePost(postId: string, userId: string): { upvoted: boolean; count: number } {
    const post = this.data.community_posts.find(p => p.id === postId);
    if (!post) return { upvoted: false, count: 0 };
    const idx = post.upvotes.indexOf(userId);
    let upvoted = false;
    if (idx >= 0) {
      post.upvotes.splice(idx, 1);
      upvoted = false;
    } else {
      post.upvotes.push(userId);
      upvoted = true;
    }
    this.persist();
    return { upvoted, count: post.upvotes.length };
  }

  public getCommunityRepliesByPostId(postId: string): CommunityReply[] {
    return this.data.community_replies
      .filter(r => r.post_id === postId)
      .sort((a, b) => {
        if (a.is_faculty_verified !== b.is_faculty_verified) return a.is_faculty_verified ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }

  public createCommunityReply(reply: CommunityReply): CommunityReply {
    this.data.community_replies.push(reply);
    this.persist();
    return reply;
  }

  public deleteCommunityReply(id: string): boolean {
    const idx = this.data.community_replies.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.community_replies.splice(idx, 1);
    this.persist();
    return true;
  }

  public toggleUpvoteReply(replyId: string, userId: string): { upvoted: boolean; count: number } {
    const rep = this.data.community_replies.find(r => r.id === replyId);
    if (!rep) return { upvoted: false, count: 0 };
    const idx = rep.upvotes.indexOf(userId);
    let upvoted = false;
    if (idx >= 0) {
      rep.upvotes.splice(idx, 1);
      upvoted = false;
    } else {
      rep.upvotes.push(userId);
      upvoted = true;
    }
    this.persist();
    return { upvoted, count: rep.upvotes.length };
  }

  public verifyFacultyReply(replyId: string, isVerified: boolean): boolean {
    const rep = this.data.community_replies.find(r => r.id === replyId);
    if (!rep) return false;
    rep.is_faculty_verified = isVerified;
    this.persist();
    return true;
  }

  public pinCommunityPost(postId: string, isPinned: boolean): boolean {
    const post = this.data.community_posts.find(p => p.id === postId);
    if (!post) return false;
    post.is_pinned = isPinned;
    this.persist();
    return true;
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(includeExpired = false): Announcement[] {
    const now = Date.now();
    let list = [...this.data.announcements];
    if (!includeExpired) {
      list = list.filter(a => {
        if (!a.expires_at) return true;
        const exp = new Date(a.expires_at).getTime();
        return isNaN(exp) || exp > now;
      });
    }
    return list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public getArchivedAnnouncements(): Announcement[] {
    const now = Date.now();
    return this.data.announcements.filter(a => {
      if (!a.expires_at) return false;
      const exp = new Date(a.expires_at).getTime();
      return !isNaN(exp) && exp <= now;
    }).sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  }

  public createAnnouncement(ann: Announcement): Announcement {
    const existingIdx = this.data.announcements.findIndex(a => a.id === ann.id);
    if (existingIdx >= 0) {
      this.data.announcements[existingIdx] = ann;
    } else {
      this.data.announcements.unshift(ann);
    }
    this.persist();
    return ann;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | undefined {
    const idx = this.data.announcements.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.data.announcements[idx] = {
      ...this.data.announcements[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.data.announcements[idx];
  }

  public deleteAnnouncement(id: string): boolean {
    const idx = this.data.announcements.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.announcements.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- RESCUE GROUPS (PRIVATE ACADEMIC SUPPORT) ---
  public getRescueGroups(userId?: string, isTeacherOrAdmin?: boolean): RescueGroup[] {
    if (isTeacherOrAdmin) {
      return [...this.data.rescue_groups].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (userId) {
      return this.data.rescue_groups
        .filter(g => g.student_ids.includes(userId))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [];
  }

  public createRescueGroup(group: RescueGroup): RescueGroup {
    this.data.rescue_groups.push(group);
    this.persist();
    return group;
  }

  public updateRescueGroup(id: string, updates: Partial<RescueGroup>): RescueGroup | undefined {
    const idx = this.data.rescue_groups.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    this.data.rescue_groups[idx] = { ...this.data.rescue_groups[idx], ...updates };
    this.persist();
    return this.data.rescue_groups[idx];
  }

  public deleteRescueGroup(id: string): boolean {
    const idx = this.data.rescue_groups.findIndex(g => g.id === id);
    if (idx === -1) return false;
    this.data.rescue_groups.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- NOTIFICATIONS ---
  public getNotificationsByUser(userId: string): PrivateNotification[] {
    return this.data.private_notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createNotification(notif: PrivateNotification): PrivateNotification {
    this.data.private_notifications.push(notif);
    this.persist();
    return notif;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const n = this.data.private_notifications.find(item => item.id === id && item.user_id === userId);
    if (!n) return false;
    n.is_read = true;
    this.persist();
    return true;
  }

  // --- TEACHER BATCH ANALYTICS ---
  public getBatchAnalytics(): any {
    const activeStudents = this.data.users.filter(u => u.role === 'student' && u.status === 'active');
    const completedAttempts = this.data.quiz_attempts.filter(a => a.status === 'completed');
    const allAnswers = this.data.student_answers;
    const allQuestions = this.data.questions;
    const allSubjects = this.data.subjects;
    const allTopics = this.data.topics;
    const allChoices = this.data.answer_choices;

    const overallBatchAverage = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedAttempts.length)
      : 0;

    // 1. Topic-level failure rate analysis
    const topicStats: Record<string, { totalAttempts: number; correctCount: number }> = {};
    allAnswers.forEach(ans => {
      const q = allQuestions.find(ques => ques.id === ans.question_id);
      if (q && q.topic_id) {
        if (!topicStats[q.topic_id]) {
          topicStats[q.topic_id] = { totalAttempts: 0, correctCount: 0 };
        }
        topicStats[q.topic_id].totalAttempts++;
        if (ans.is_correct) topicStats[q.topic_id].correctCount++;
      }
    });

    const batchLevelWeakAreas = Object.entries(topicStats)
      .map(([topicId, stats]) => {
        const topic = allTopics.find(t => t.id === topicId);
        const subject = topic ? allSubjects.find(s => s.id === topic.subject_id) : null;
        const failureRate = stats.totalAttempts > 0
          ? Math.round(((stats.totalAttempts - stats.correctCount) / stats.totalAttempts) * 100)
          : 0;
        const avgScore = stats.totalAttempts > 0 ? Math.round((stats.correctCount / stats.totalAttempts) * 100) : 0;
        return {
          topic_id: topicId,
          topic_name: topic ? topic.name : 'Unknown Topic',
          subject_name: subject ? subject.name : 'Curriculum',
          total_attempts: stats.totalAttempts,
          failure_rate_percentage: failureRate,
          average_score: avgScore,
        };
      })
      .sort((a, b) => b.failure_rate_percentage - a.failure_rate_percentage)
      .slice(0, 10);

    // 2. Questions most frequently missed
    const questionStats: Record<string, { total: number; incorrect: number; chosenChoices: Record<string, number> }> = {};
    allAnswers.forEach(ans => {
      if (!questionStats[ans.question_id]) {
        questionStats[ans.question_id] = { total: 0, incorrect: 0, chosenChoices: {} };
      }
      questionStats[ans.question_id].total++;
      if (!ans.is_correct) {
        questionStats[ans.question_id].incorrect++;
        ans.selected_choice_ids.forEach(cid => {
          questionStats[ans.question_id].chosenChoices[cid] = (questionStats[ans.question_id].chosenChoices[cid] || 0) + 1;
        });
      }
    });

    const frequentlyMissedQuestions = Object.entries(questionStats)
      .filter(([_, s]) => s.total > 0 && s.incorrect > 0)
      .map(([qId, s]) => {
        const q = allQuestions.find(item => item.id === qId);
        const quiz = q ? this.data.quizzes.find(item => item.id === q.quiz_id) : null;
        const subject = quiz ? allSubjects.find(item => item.id === (q?.subject_id || quiz.subject_id)) : null;
        
        // Find most popular wrong choice
        let topDistractorText = '';
        let maxDistractorCount = 0;
        Object.entries(s.chosenChoices).forEach(([cId, count]) => {
          if (count > maxDistractorCount) {
            maxDistractorCount = count;
            const choice = allChoices.find(c => c.id === cId);
            if (choice && !choice.is_correct) {
              topDistractorText = choice.choice_text;
            }
          }
        });

        return {
          question_id: qId,
          prompt: q ? q.prompt : 'Medical Question',
          subject_name: subject ? subject.name : 'General Medical',
          medical_specialty: quiz?.medical_specialty || 'General',
          total_attempts: s.total,
          incorrect_count: s.incorrect,
          incorrect_rate_percentage: Math.round((s.incorrect / s.total) * 100),
          common_distractor: topDistractorText || undefined,
        };
      })
      .sort((a, b) => b.incorrect_rate_percentage - a.incorrect_rate_percentage)
      .slice(0, 10);

    // 3. Subject-level analysis
    const subjectBreakdowns = allSubjects.map(sub => {
      const subjectQuizzes = this.data.quizzes.filter(q => q.subject_id === sub.id || (q.subject_ids && q.subject_ids.includes(sub.id)));
      const quizIds = new Set(subjectQuizzes.map(q => q.id));
      const subjectAttempts = completedAttempts.filter(a => quizIds.has(a.quiz_id));
      const subjectAnswers = allAnswers.filter(ans => {
        const q = allQuestions.find(item => item.id === ans.question_id);
        return q && (q.subject_id === sub.id || quizIds.has(q.quiz_id));
      });

      const totalQAttempted = subjectAnswers.length;
      const correctQ = subjectAnswers.filter(a => a.is_correct).length;
      const accuracy = totalQAttempted > 0 ? Math.round((correctQ / totalQAttempted) * 100) : 0;
      const participatingStudentIds = new Set(subjectAttempts.map(a => a.student_id));

      let status: 'Strong' | 'Developing' | 'Needs Revision' = 'Developing';
      if (accuracy >= 75) status = 'Strong';
      else if (accuracy < 50) status = 'Needs Revision';

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        average_accuracy: accuracy,
        total_questions_attempted: totalQAttempted,
        student_participation_count: participatingStudentIds.size,
        status,
      };
    });

    // 4. Curriculum Weak Area Recommendations
    const seniorReviewGroupRecommendations = batchLevelWeakAreas.slice(0, 5).map(weak => ({
      subject_name: weak.subject_name,
      topic_name: weak.topic_name,
      error_rate: weak.failure_rate_percentage,
      reason: `Batch error rate is ${weak.failure_rate_percentage}% across ${weak.total_attempts} attempts.`,
      suggested_focus: `Conduct a targeted clinical case breakdown session on ${weak.topic_name} with focus on differential diagnosis and exam traps.`,
    }));

    return {
      total_students_active: activeStudents.length,
      total_attempts_recorded: completedAttempts.length,
      overall_batch_average: overallBatchAverage,
      batch_level_weak_areas: batchLevelWeakAreas,
      frequently_missed_questions: frequentlyMissedQuestions,
      subject_breakdowns: subjectBreakdowns,
      senior_review_group_recommendations: seniorReviewGroupRecommendations,
    };
  }

  // --- PRIVATE STUDENT PERFORMANCE COHORTS (FOR AUTHORIZED FACULTY ONLY) ---
  public getStudentPerformanceCohorts(): any[] {
    const students = this.data.users.filter(u => u.role === 'student' && u.status === 'active');
    const completedAttempts = this.data.quiz_attempts.filter(a => a.status === 'completed');
    const allAnswers = this.data.student_answers;
    const allSubjects = this.data.subjects;
    const allQuestions = this.data.questions;
    const allQuizzes = this.data.quizzes;

    return students.map(student => {
      const profile = this.getStudentProfile(student.id);
      const studentAttempts = completedAttempts.filter(a => a.student_id === student.id);
      const attemptIds = new Set(studentAttempts.map(a => a.id));
      const studentAnswers = allAnswers.filter(ans => attemptIds.has(ans.attempt_id));

      const totalAnswered = studentAnswers.length;
      const totalCorrect = studentAnswers.filter(a => a.is_correct).length;
      const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
      const avgScore = studentAttempts.length > 0
        ? Math.round(studentAttempts.reduce((sum, a) => sum + a.percentage, 0) / studentAttempts.length)
        : 0;

      let level: 'Strong' | 'Developing' | 'Needs Revision' = 'Developing';
      if (accuracy >= 75 && totalAnswered >= 5) level = 'Strong';
      else if (accuracy < 50 || (totalAnswered >= 5 && avgScore < 50)) level = 'Needs Revision';

      // Identify weak subjects (< 50% accuracy)
      const weakSubjects: Array<{ subject_id: string; subject_name: string; accuracy: number }> = [];
      allSubjects.forEach(sub => {
        const subQuizzes = allQuizzes.filter(q => q.subject_id === sub.id);
        const subQuizIds = new Set(subQuizzes.map(q => q.id));
        const subAnswers = studentAnswers.filter(ans => {
          const q = allQuestions.find(item => item.id === ans.question_id);
          return q && (q.subject_id === sub.id || subQuizIds.has(q.quiz_id));
        });

        if (subAnswers.length >= 3) {
          const subAcc = Math.round((subAnswers.filter(a => a.is_correct).length / subAnswers.length) * 100);
          if (subAcc < 60) {
            weakSubjects.push({
              subject_id: sub.id,
              subject_name: sub.name,
              accuracy: subAcc,
            });
          }
        }
      });

      return {
        user_id: student.id,
        display_name: student.display_name,
        email: student.email,
        medical_school_year: profile?.medical_school_year || 'Medical Student',
        total_quizzes_completed: studentAttempts.length,
        average_score: avgScore,
        accuracy,
        level,
        weak_subjects: weakSubjects,
      };
    });
  }
}

export const db = new Database();

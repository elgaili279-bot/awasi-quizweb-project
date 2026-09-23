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

export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'USMLE Step 1' | 'USMLE Step 2 CK';
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
  topic_id?: string;
  difficulty: QuizDifficulty;
  time_limit_minutes: number; // 0 for untimed
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
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to read database file, initializing default:', err);
        this.seedInitialConfig();
        this.persist();
      }
    } else {
      this.seedInitialConfig();
      this.persist();
    }
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

    const initialSubjectsList: Array<{ name: string; icon: string; description: string; topics: string[] }> = [
      {
        name: 'Internal Medicine',
        icon: 'Stethoscope',
        description: 'Adult disease prevention, diagnosis, and non-surgical management.',
        topics: ['Cardiovascular System', 'Pulmonology', 'Gastroenterology & Hepatology', 'Nephrology', 'Endocrinology', 'Hematology & Oncology', 'Rheumatology', 'Infectious Disease']
      },
      {
        name: 'Surgery',
        icon: 'Activity',
        description: 'Surgical conditions, pre-operative evaluation, trauma, and postoperative care.',
        topics: ['Acute Abdomen', 'Trauma & Critical Care', 'Surgical Oncology', 'Vascular Surgery', 'Cardiothoracic Surgery', 'Wound Healing & Shock']
      },
      {
        name: 'Pediatrics',
        icon: 'Baby',
        description: 'Neonatal care, childhood development, pediatric infections, and congenital disorders.',
        topics: ['Neonatology & APGAR', 'Growth & Developmental Milestones', 'Pediatric Pulmonology (Croup, Epiglottitis)', 'Congenital Heart Disease', 'Pediatric Infections & Vaccines']
      },
      {
        name: 'Obstetrics & Gynecology',
        icon: 'HeartHandshake',
        description: 'Pregnancy management, labor & delivery complications, and reproductive health.',
        topics: ['Prenatal Care & Normal Labor', 'Hypertensive Disorders of Pregnancy', 'Obstetric Hemorrhage', 'Gynecologic Oncology', 'Infertility & Menstrual Disorders']
      },
      {
        name: 'Emergency Medicine',
        icon: 'Flame',
        description: 'Immediate stabilization, toxicology, resuscitation, and acute presentations.',
        topics: ['Advanced Cardiac Life Support (ACLS)', 'Shock & Resuscitation', 'Toxicology & Overdose', 'Trauma Resuscitation', 'Environmental Emergencies']
      },
      {
        name: 'Pathology',
        icon: 'Microscope',
        description: 'Cellular adaptation, inflammation, neoplasia, and organ system pathophysiology.',
        topics: ['Cellular Injury & Necrosis', 'Acute & Chronic Inflammation', 'Neoplasia & Tumor Biology', 'Hemodynamic Disorders & Thromboembolism', 'Autoimmune Pathologies']
      },
      {
        name: 'Pharmacology',
        icon: 'Pill',
        description: 'Drug mechanisms of action, pharmacokinetics, adverse effects, and contraindications.',
        topics: ['Autonomic Nervous System Drugs', 'Cardiovascular Pharmacotherapy', 'Antimicrobial Agents', 'Neuropharmacology & Analgesics', 'Chemotherapeutic Agents']
      },
      {
        name: 'Physiology',
        icon: 'Gauge',
        description: 'Normal human functional mechanisms across body systems.',
        topics: ['Action Potentials & Excitable Tissues', 'Cardiac Cycle & Hemodynamics', 'Renal Clearance & Acid-Base Balance', 'Respiratory Mechanics & Gas Exchange', 'Endocrine Feedback Loops']
      },
      {
        name: 'Anatomy',
        icon: 'Bone',
        description: 'Gross anatomy, neuroanatomy, embryology, and clinical anatomical correlations.',
        topics: ['Upper & Lower Extremity', 'Thorax & Mediastinum', 'Abdomen & Pelvis', 'Head & Neck', 'Cranial Nerves & Neurovascular Pathways']
      },
      {
        name: 'Microbiology',
        icon: 'Bug',
        description: 'Bacteriology, virology, mycology, parasitology, and mechanism of pathogenicity.',
        topics: ['Gram-Positive Cocci & Bacilli', 'Gram-Negative Organisms', 'Respiratory & Gastrointestinal Viruses', 'Systemic Mycoses', 'Opportunistic Pathogens in Immunocompromise']
      },
      {
        name: 'Neurology & Neuroscience',
        icon: 'Brain',
        description: 'Central and peripheral nervous system disorders, localized lesions, and stroke.',
        topics: ['Ischemic & Hemorrhagic Stroke', 'Epilepsy & Seizures', 'Movement Disorders & Parkinsonism', 'Demyelinating Diseases (Multiple Sclerosis)', 'Peripheral Neuropathies']
      },
      {
        name: 'Psychiatry',
        icon: 'Sparkles',
        description: 'Mental health disorders, DSM criteria, psychotherapy, and psychopharmacology.',
        topics: ['Mood & Depressive Disorders', 'Schizophrenia & Psychotic Disorders', 'Anxiety & Trauma-Related Disorders', 'Substance Use Disorders', 'Childhood Psychiatric Conditions']
      },
      {
        name: 'Biochemistry & Genetics',
        icon: 'Dna',
        description: 'Metabolic pathways, inborn errors of metabolism, and molecular genetics.',
        topics: ['Glycolysis, Krebs Cycle & ETC', 'Lipid Metabolism & Dyslipidemias', 'Inborn Errors of Metabolism', 'Chromosomal & Mendelian Genetics', 'Vitamin & Micronutrient Deficiencies']
      },
      {
        name: 'Dermatology',
        icon: 'Shield',
        description: 'Cutaneous lesions, inflammatory dermatoses, and skin malignancies.',
        topics: ['Melanoma & Non-Melanoma Skin Cancers', 'Papulosquamous Disorders (Psoriasis, Lichen Planus)', 'Vesiculobullous Diseases (Pemphigus vs Pemphigoid)', 'Cutaneous Infections']
      },
      {
        name: 'Medical Ethics & Clinical Skills',
        icon: 'BookOpen',
        description: 'Bioethics, patient autonomy, informed consent, and core diagnostic communication.',
        topics: ['Informed Consent & Capacity', 'Patient Confidentiality & HIPAA', 'End-of-Life Decisions & Advance Directives', 'Medical Malpractice & Error Disclosure']
      }
    ];

    const subjects: Subject[] = [];
    const topics: Topic[] = [];

    initialSubjectsList.forEach((sub, sIdx) => {
      const subId = `sub_${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      subjects.push({
        id: subId,
        name: sub.name,
        slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: sub.description,
        icon: sub.icon,
        is_active: true,
        display_order: sIdx + 1,
      });

      sub.topics.forEach((topName, tIdx) => {
        topics.push({
          id: `top_${subId}_${tIdx + 1}`,
          subject_id: subId,
          name: topName,
          slug: topName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `Key clinical concepts and questions in ${topName}`,
          display_order: tIdx + 1,
        });
      });
    });

    this.data.users = [adminUser];
    this.data.subjects = subjects;
    this.data.topics = topics;
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
      fs.writeFileSync(DB_TMP_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(DB_TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- USERS ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
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
        quiz.description.toLowerCase().includes(q)
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
}

export const db = new Database();

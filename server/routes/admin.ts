import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import { db } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../auth.ts';

export const adminRouter = Router();

// Middleware: all admin routes require 'admin' role
adminRouter.use(authenticate, requireRole('admin'));

// GET /api/admin/overview - Platform metrics
adminRouter.get('/overview', (_req, res): void => {
  const users = db.getAllUsers();
  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const quizzes = db.getQuizzes();
  const publishedQuizzes = quizzes.filter(q => q.status === 'published');
  const questions = db.getAllQuestions();
  const attempts = db.getAllCompletedAttempts();
  const reports = db.getReports();
  const pendingReports = reports.filter(r => r.status === 'pending');

  const platformAvgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0;

  res.json({
    metrics: {
      total_users: users.length,
      students_count: students.length,
      teachers_count: teachers.length,
      total_quizzes: quizzes.length,
      published_quizzes: publishedQuizzes.length,
      total_questions: questions.length,
      total_attempts: attempts.length,
      platform_average_score: platformAvgScore,
      pending_reports_count: pendingReports.length,
    },
  });
});

// GET /api/admin/users - List users
adminRouter.get('/users', (req, res): void => {
  const { role, status, search } = req.query;
  let users = db.getAllUsers();

  if (role) {
    users = users.filter(u => u.role === role);
  }
  if (status) {
    users = users.filter(u => u.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.display_name.toLowerCase().includes(q)
    );
  }

  const enriched = users.map(u => {
    const { password_hash, salt, reset_token, ...safe } = u;
    let profile = null;
    if (u.role === 'student') profile = db.getStudentProfile(u.id);
    else if (u.role === 'teacher') profile = db.getTeacherProfile(u.id);

    return {
      ...safe,
      profile,
    };
  });

  res.json({ users: enriched });
});

// PUT /api/admin/users/:id/status - Toggle user active / suspended
adminRouter.put('/users/:id/status', (req: AuthenticatedRequest, res: Response): void => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    res.status(400).json({ error: 'Status must be active or suspended.' });
    return;
  }

  // Prevent suspending self
  if (req.user?.id === req.params.id) {
    res.status(400).json({ error: 'Administrators cannot suspend their own account.' });
    return;
  }

  const updated = db.updateUser(req.params.id, { status });
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ message: `User status updated to ${status}.`, user: updated });
});

// PUT /api/admin/users/:id/role - Change user role
adminRouter.put('/users/:id/role', (req: AuthenticatedRequest, res: Response): void => {
  const { role } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Role must be student, teacher, or admin.' });
    return;
  }

  if (req.user?.id === req.params.id && role !== 'admin') {
    res.status(400).json({ error: 'Administrators cannot demote themselves.' });
    return;
  }

  const updated = db.updateUser(req.params.id, { role });
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ message: `User role updated to ${role}.`, user: updated });
});

// GET /api/admin/reports - View reported questions
adminRouter.get('/reports', (_req, res): void => {
  const reports = db.getReports();
  const allUsers = db.getAllUsers();
  const allQuestions = db.getAllQuestions();
  const allQuizzes = db.getQuizzes();

  const enriched = reports.map(r => {
    const reporter = allUsers.find(u => u.id === r.reported_by);
    const question = allQuestions.find(q => q.id === r.question_id);
    const quiz = question ? allQuizzes.find(qz => qz.id === question.quiz_id) : null;

    return {
      ...r,
      reporter_name: reporter ? reporter.display_name : 'Unknown Student',
      question_prompt: question ? question.prompt : 'Deleted question',
      quiz_title: quiz ? quiz.title : 'Unknown quiz',
    };
  });

  res.json({ reports: enriched });
});

// PUT /api/admin/reports/:id - Resolve or dismiss report
adminRouter.put('/reports/:id', (req, res): void => {
  const { status } = req.body;
  if (!['pending', 'resolved', 'dismissed'].includes(status)) {
    res.status(400).json({ error: 'Status must be pending, resolved, or dismissed.' });
    return;
  }

  const updated = db.updateReport(req.params.id, {
    status,
    resolved_at: status !== 'pending' ? new Date().toISOString() : null,
  });

  if (!updated) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  res.json({ message: `Report marked as ${status}.`, report: updated });
});

// GET /api/admin/quizzes - View all quizzes across the platform
adminRouter.get('/quizzes', (_req, res): void => {
  const quizzes = db.getQuizzes();
  const subjects = db.getSubjects();
  const users = db.getAllUsers();
  const attempts = db.getAllCompletedAttempts();

  const enriched = quizzes.map(q => {
    const subject = subjects.find(s => s.id === q.subject_id);
    const creator = users.find(u => u.id === q.created_by);
    const quizAttempts = attempts.filter(a => a.quiz_id === q.id);
    const questions = db.getQuestionsByQuizId(q.id);

    return {
      ...q,
      subject_name: subject?.name || 'General Medical',
      creator_name: creator ? creator.display_name : 'Unknown Faculty',
      creator_email: creator?.email,
      question_count: questions.length,
      attempts_count: quizAttempts.length,
    };
  });

  res.json({ quizzes: enriched });
});

// PUT /api/admin/quizzes/:id/status - Moderate quiz status
adminRouter.put('/quizzes/:id/status', (req, res): void => {
  const { status } = req.body;
  if (!['draft', 'published', 'unpublished', 'archived'].includes(status)) {
    res.status(400).json({ error: 'Invalid quiz status.' });
    return;
  }

  const updated = db.updateQuiz(req.params.id, { status });
  if (!updated) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  res.json({ message: `Quiz status updated to ${status}.`, quiz: updated });
});

// POST /api/admin/seed-sample-quiz - Seeds high-yield sample board examination
adminRouter.post('/seed-sample-quiz', (req: AuthenticatedRequest, res: Response): void => {
  const subjects = db.getSubjects();
  const internalMed = subjects.find(s => s.slug === 'internal-medicine') || subjects[0];
  const topics = db.getTopics(internalMed.id);
  const topicId = topics.length > 0 ? topics[0].id : undefined;
  const adminUser = req.user!;
  const now = new Date().toISOString();
  const quizId = `quiz_${crypto.randomUUID()}`;

  const sampleQuiz = db.createQuiz({
    id: quizId,
    title: 'Clinical Vignettes: Acute Cardiovascular & Emergency Care',
    description: 'High-yield board-style examination focusing on early diagnostic workup, ECG interpretation, and evidence-based pharmacotherapy.',
    subject_id: internalMed.id,
    topic_id: topicId,
    difficulty: 'USMLE Step 2 CK',
    time_limit_minutes: 15,
    status: 'published',
    instructions: 'Each question presents a clinical scenario. Select the single best answer. Rationales and high-yield clinical pearls will be provided upon completion.',
    created_by: adminUser.id,
    view_count: 0,
    created_at: now,
    updated_at: now,
  });

  // Question 1
  const q1Id = `q_${crypto.randomUUID()}`;
  db.createQuestion(
    {
      id: q1Id,
      quiz_id: sampleQuiz.id,
      type: 'clinical_vignette',
      prompt: 'Which of the following is the most appropriate next step in the emergency management of this patient?',
      clinical_vignette: {
        patient_age: 64,
        patient_sex: 'Male',
        chief_complaint: 'Substernal crushing chest pressure radiating to left jaw',
        history: 'A 64-year-old male arrives at the emergency department with severe chest pain that began 45 minutes ago while shoveling snow. He has a 15-year history of hypertension and hyperlipidemia. He reports associated nausea, diaphoresis, and shortness of breath.',
        examination: 'BP 146/92 mmHg, HR 98 bpm, RR 20/min, SpO2 98% on room air. Auscultation reveals an S4 gallop without murmurs or lung crackles.',
        laboratory: 'ECG demonstrates 3.5 mm ST-segment elevation in leads II, III, and aVF with reciprocal ST depression in leads I and aVL. High-sensitivity troponin I is pending.',
      },
      explanation: 'The patient presents with an acute ST-elevation myocardial infarction (STEMI) involving the inferior wall (leads II, III, and aVF), most commonly caused by occlusion of the Right Coronary Artery (RCA). The immediate standard of care is emergent reperfusion via Percutaneous Coronary Intervention (PCI) within 90 minutes of medical contact (door-to-balloon time), along with chewable aspirin and an oral P2Y12 inhibitor.',
      learning_point: 'Door-to-balloon time for primary PCI in STEMI is <90 minutes at a PCI-capable facility, or <120 minutes if transfer is required.',
      reference: "2023 ACC/AHA Guideline for the Management of Patients With Acute Coronary Syndromes; Harrison's Internal Medicine 21st Ed., Ch. 275",
      difficulty: 'USMLE Step 2 CK',
      topic_id: topicId,
      points: 1,
      display_order: 1,
      created_at: now,
    },
    [
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Administer chewable aspirin and activate catheterization laboratory for emergent PCI',
        is_correct: true,
        explanation: 'Correct: Dual antiplatelet therapy (aspirin + P2Y12 inhibitor) and prompt mechanical reperfusion is the gold standard for acute STEMI.',
        display_order: 1,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Wait for initial troponin I and CK-MB laboratory results before intervention',
        is_correct: false,
        explanation: 'Incorrect: STEMI diagnosis is made electrocardiographically; reperfusion should never be delayed awaiting cardiac biomarker results.',
        display_order: 2,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Administer sublingual nitroglycerin and intravenous metoprolol without ECG monitoring',
        is_correct: false,
        explanation: 'Incorrect: Nitrates can precipitate severe hypotension in inferior/right ventricular infarctions due to preload dependence.',
        display_order: 3,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Perform an urgent CT angiogram of the chest to rule out pulmonary embolism',
        is_correct: false,
        explanation: 'Incorrect: The ECG diagnostic findings of STEMI take clear clinical priority.',
        display_order: 4,
      },
    ]
  );

  // Question 2
  const q2Id = `q_${crypto.randomUUID()}`;
  db.createQuestion(
    {
      id: q2Id,
      quiz_id: sampleQuiz.id,
      type: 'clinical_vignette',
      prompt: 'Which of the following is the most likely diagnosis?',
      clinical_vignette: {
        patient_age: 23,
        patient_sex: 'Female',
        chief_complaint: 'Migratory lower abdominal pain and anorexia',
        history: 'A 23-year-old medical student reports abdominal discomfort that began 14 hours ago as dull peri-umbilical aching. Over the past 4 hours, the pain has sharpened and relocated to the right lower quadrant. She has vomited twice and has complete anorexia.',
        examination: 'Temperature 38.2°C (100.8°F), HR 102 bpm. Marked tenderness at McBurney point with involuntary guarding. Palpation of the left lower quadrant elicits pain in the right lower quadrant.',
        laboratory: 'WBC 14,800/mm³ with 82% neutrophils. Urine pregnancy test is negative.',
      },
      explanation: 'The classic presentation of dull periumbilical pain shifting to focal RLQ somatic pain (McBurney point) along with anorexia ("hamburger sign"), fever, and positive Rovsing sign (RLQ pain with LLQ palpation) is pathognomonic for acute appendicitis. Appendiceal luminal obstruction leads to initial visceral pain (T10 dermatome), followed by transmural inflammation irritating the parietal peritoneum.',
      learning_point: 'Appendicitis pain begins visceral (periumbilical T10) then shifts to somatic (RLQ McBurney point) once the parietal peritoneum is inflamed.',
      reference: "Sabiston Textbook of Surgery, 21st Ed., Chapter 51",
      difficulty: 'Intermediate',
      topic_id: topicId,
      points: 1,
      display_order: 2,
      created_at: now,
    },
    [
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Acute Appendicitis',
        is_correct: true,
        explanation: 'Correct: Classic pain migration from periumbilical to RLQ with fever and Rovsing sign.',
        display_order: 1,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Ruptured Ovarian Cyst',
        is_correct: false,
        explanation: 'Incorrect: Sudden unilateral pelvic pain following strenuous activity without periumbilical prodrome.',
        display_order: 2,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Nephrolithiasis',
        is_correct: false,
        explanation: 'Incorrect: Typically presents as severe colicky flank pain radiating to the groin with hematuria, not periumbilical migration.',
        display_order: 3,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Acute Diverticulitis',
        is_correct: false,
        explanation: 'Incorrect: Most commonly affects the sigmoid colon in older adults, causing left lower quadrant tenderness.',
        display_order: 4,
      },
    ]
  );

  // Question 3
  const q3Id = `q_${crypto.randomUUID()}`;
  db.createQuestion(
    {
      id: q3Id,
      quiz_id: sampleQuiz.id,
      type: 'sba',
      prompt: 'A 71-year-old female presents with sudden onset of right facial droop and right arm weakness that began 80 minutes ago. Non-contrast head CT excludes intracranial hemorrhage. Blood pressure is 168/94 mmHg, and blood glucose is 128 mg/dL. Which of the following is the most appropriate acute therapy?',
      explanation: 'In acute ischemic stroke with symptom onset within 4.5 hours and no contraindications (such as active bleeding, recent intracranial surgery, or platelets <100,000), intravenous thrombolysis with alteplase (tPA) or tenecteplase is the recommended first-line therapy to restore cerebral perfusion.',
      learning_point: 'Intravenous thrombolysis (tPA) is indicated within 4.5 hours of symptom onset for acute ischemic stroke without hemorrhage on non-contrast CT.',
      reference: "2019 AHA/ASA Guidelines for the Early Management of Patients With Acute Ischemic Stroke",
      difficulty: 'USMLE Step 2 CK',
      topic_id: topicId,
      points: 1,
      display_order: 3,
      created_at: now,
    },
    [
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Intravenous Alteplase (recombinant tissue plasminogen activator)',
        is_correct: true,
        explanation: 'Correct: The patient is within the 4.5-hour thrombolytic window and has no CT evidence of hemorrhage.',
        display_order: 1,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Immediate administration of high-dose intravenous heparin',
        is_correct: false,
        explanation: 'Incorrect: Full-dose anticoagulation is contraindicated in acute stroke due to high risk of fatal hemorrhagic transformation.',
        display_order: 2,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Aggressive blood pressure lowering with IV labetalol to BP < 120/80 mmHg',
        is_correct: false,
        explanation: 'Incorrect: Overly aggressive BP reduction impairs cerebral perfusion in penumbral brain tissue. BP is tolerated up to 185/110 mmHg prior to tPA.',
        display_order: 3,
      },
      {
        id: `c_${crypto.randomUUID()}`,
        choice_text: 'Oral aspirin 325 mg with discharge home for outpatient MRI',
        is_correct: false,
        explanation: 'Incorrect: Patient requires emergent inpatient acute stroke management and evaluation for mechanical thrombectomy.',
        display_order: 4,
      },
    ]
  );

  res.json({
    message: 'High-yield sample medical board exam seeded successfully!',
    quiz: sampleQuiz,
  });
});


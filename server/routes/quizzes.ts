import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type Quiz, type Question, type AnswerChoice, type QuizStatus, type QuizDifficulty } from '../db.ts';
import { authenticate, optionalAuthenticate, requireRole, type AuthenticatedRequest } from '../auth.ts';

export const quizzesRouter = Router();

// Validation helper for publishing
function validateQuizForPublish(quizId: string): { valid: boolean; errors: string[] } {
  const quiz = db.getQuizById(quizId);
  const errors: string[] = [];

  if (!quiz) {
    return { valid: false, errors: ['Quiz not found.'] };
  }

  if (!quiz.title || quiz.title.trim().length < 3) {
    errors.push('Quiz title is required (at least 3 characters).');
  }

  if (!quiz.subject_id) {
    errors.push('Quiz must be assigned to a medical subject.');
  }

  const questions = db.getQuestionsByQuizId(quizId);
  if (questions.length === 0) {
    errors.push('Quiz must contain at least one question before it can be published.');
  } else {
    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      if (!q.prompt || q.prompt.trim().length < 5) {
        errors.push(`Question #${qNum} prompt is missing or too short.`);
      }

      const choices = db.getChoicesByQuestionId(q.id);
      if (q.type === 'true_false') {
        if (choices.length !== 2) {
          errors.push(`Question #${qNum} (True/False) must have exactly 2 choices.`);
        }
      } else {
        if (choices.length < 2) {
          errors.push(`Question #${qNum} must have at least 2 answer choices.`);
        }
      }

      const correctChoices = choices.filter(c => c.is_correct);
      if (correctChoices.length === 0) {
        errors.push(`Question #${qNum} has no correct answer selected.`);
      }

      if (q.type === 'sba' && correctChoices.length > 1) {
        errors.push(`Question #${qNum} is Single Best Answer but has multiple correct choices.`);
      }

      // Check empty choice text
      choices.forEach((c, cIdx) => {
        if (!c.choice_text || c.choice_text.trim().length === 0) {
          errors.push(`Question #${qNum} choice #${cIdx + 1} cannot be empty.`);
        }
      });
    });
  }

  return { valid: errors.length === 0, errors };
}

// GET /api/quizzes
// Public students see only published quizzes
// Teachers can see their own quizzes (drafts + published) via ?myQuizzes=true
quizzesRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { subject_id, topic_id, specialty, medical_specialty, difficulty, search, myQuizzes, sort } = req.query;
  const user = req.user;

  let filterStatus: QuizStatus[] = ['published'];
  let filterCreator: string | undefined = undefined;

  if (myQuizzes === 'true') {
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      res.status(403).json({ error: 'Only teachers or administrators can view private quiz dashboards.' });
      return;
    }
    // Teacher sees their own regardless of status
    filterStatus = ['draft', 'published', 'unpublished', 'archived'];
    if (user.role === 'teacher') {
      filterCreator = user.id;
    }
  }

  const targetSpecialty = (specialty || medical_specialty) ? String(specialty || medical_specialty).trim() : undefined;

  let quizzes = db.getQuizzes({
    status: filterStatus,
    subject_id: subject_id ? String(subject_id) : undefined,
    topic_id: topic_id ? String(topic_id) : undefined,
    medical_specialty: targetSpecialty,
    difficulty: difficulty ? (String(difficulty) as QuizDifficulty) : undefined,
    search: search ? String(search) : undefined,
    created_by: filterCreator,
  });

  // Enrich quizzes with subject name, topic name, question count, creator display name
  const subjects = db.getSubjects();
  const topics = db.getTopics();
  const allUsers = db.getAllUsers();
  const allAttempts = db.getAllCompletedAttempts();

  const enriched = quizzes.map(q => {
    const subject = subjects.find(s => s.id === q.subject_id);
    const topic = topics.find(t => t.id === q.topic_id);
    const creator = allUsers.find(u => u.id === q.created_by);
    const questions = db.getQuestionsByQuizId(q.id);
    const attempts = allAttempts.filter(a => a.quiz_id === q.id);

    // Fallback inferred specialty if not explicitly set
    let inferredSpecialty = q.medical_specialty;
    if (!inferredSpecialty) {
      if (subject?.name) {
        if (subject.name.toLowerCase().includes('pathology')) inferredSpecialty = 'Pathology';
        else if (subject.name.toLowerCase().includes('psychiatry')) inferredSpecialty = 'Psychiatry & Neurology';
        else if (subject.name.toLowerCase().includes('radiology')) inferredSpecialty = 'Radiology';
        else if (subject.name.toLowerCase().includes('ent')) inferredSpecialty = 'ENT';
        else if (subject.name.toLowerCase().includes('dermatology')) inferredSpecialty = 'Dermatology';
        else if (subject.name.toLowerCase().includes('ophthalmology')) inferredSpecialty = 'Ophthalmology';
        else if (subject.name.toLowerCase().includes('infectious')) inferredSpecialty = 'Infectious Diseases';
        else if (subject.name.toLowerCase().includes('ethics')) inferredSpecialty = 'Medical Ethics';
        else if (subject.name.toLowerCase().includes('forensic')) inferredSpecialty = 'Forensic & Toxicology';
        else inferredSpecialty = subject.name;
      } else {
        inferredSpecialty = 'General Medicine';
      }
    }

    return {
      ...q,
      medical_specialty: inferredSpecialty,
      subject_name: subject?.name || 'General Medical',
      topic_name: topic?.name || null,
      question_count: questions.length,
      creator_name: creator ? creator.display_name : 'Faculty Educator',
      creator_role: creator?.role,
      attempt_count: attempts.length,
    };
  });

  // Filter enriched by targetSpecialty if not already filtered
  let filteredList = enriched;
  if (targetSpecialty && targetSpecialty.toLowerCase() !== 'all') {
    filteredList = filteredList.filter(q => 
      (q.medical_specialty || '').toLowerCase() === targetSpecialty.toLowerCase()
    );
  }

  // Handle comprehensive sorting
  if (sort === 'popular') {
    filteredList.sort((a, b) => b.attempt_count - a.attempt_count);
  } else if (sort === 'oldest') {
    filteredList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sort === 'specialty_asc') {
    filteredList.sort((a, b) => (a.medical_specialty || '').localeCompare(b.medical_specialty || ''));
  } else if (sort === 'specialty_desc') {
    filteredList.sort((a, b) => (b.medical_specialty || '').localeCompare(a.medical_specialty || ''));
  } else if (sort === 'title_asc') {
    filteredList.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'questions_desc') {
    filteredList.sort((a, b) => b.question_count - a.question_count);
  } else if (sort === 'duration_asc') {
    filteredList.sort((a, b) => (a.time_limit_minutes || 999) - (b.time_limit_minutes || 999));
  } else if (sort === 'duration_desc') {
    filteredList.sort((a, b) => (b.time_limit_minutes || 0) - (a.time_limit_minutes || 0));
  } else if (sort === 'difficulty_asc') {
    const diffWeights: Record<string, number> = {
      'Beginner': 1,
      'Curriculum Core': 2,
      'Intermediate': 3,
      'Clinical Case': 4,
      'Advanced': 5,
    };
    filteredList.sort((a, b) => (diffWeights[a.difficulty] || 3) - (diffWeights[b.difficulty] || 3));
  } else if (sort === 'difficulty_desc') {
    const diffWeights: Record<string, number> = {
      'Beginner': 1,
      'Curriculum Core': 2,
      'Intermediate': 3,
      'Clinical Case': 4,
      'Advanced': 5,
    };
    filteredList.sort((a, b) => (diffWeights[b.difficulty] || 3) - (diffWeights[a.difficulty] || 3));
  } else {
    // newest default
    filteredList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  res.json({ quizzes: filteredList });
});

// GET /api/quizzes/:id
quizzesRouter.get('/:id', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  const user = req.user;
  const isOwner = user && (user.id === quiz.created_by || user.role === 'admin');

  // If not published and not owner/admin, block access
  if (quiz.status !== 'published' && !isOwner) {
    res.status(404).json({ error: 'Quiz not found or is currently in draft.' });
    return;
  }

  const subject = db.getSubjectById(quiz.subject_id);
  const topic = quiz.topic_id ? db.getTopicById(quiz.topic_id) : null;
  const creator = db.findUserById(quiz.created_by);
  const questions = db.getQuestionsByQuizId(quiz.id);

  // If preview or student taking the quiz:
  // For student taking quiz (or public viewing before/during quiz):
  // HIDE is_correct, explanation, learning_point to prevent inspect cheating!
  const sanitizedQuestions = questions.map(q => {
    const rawChoices = db.getChoicesByQuestionId(q.id);
    const choices = rawChoices.map(c => {
      if (isOwner) {
        return c; // Owner/teacher sees complete choice details with is_correct
      }
      return {
        id: c.id,
        question_id: c.question_id,
        choice_text: c.choice_text,
        display_order: c.display_order,
      };
    });

    if (isOwner) {
      return {
        ...q,
        choices,
      };
    }

    return {
      id: q.id,
      quiz_id: q.quiz_id,
      type: q.type,
      prompt: q.prompt,
      clinical_vignette: q.clinical_vignette,
      difficulty: q.difficulty,
      topic_id: q.topic_id,
      points: q.points,
      display_order: q.display_order,
      choices,
    };
  });

  res.json({
    quiz: {
      ...quiz,
      subject_name: subject?.name || 'General Medical',
      topic_name: topic?.name || null,
      creator_name: creator?.display_name || 'Faculty Educator',
      is_owner: !!isOwner,
    },
    questions: sanitizedQuestions,
  });
});

// POST /api/quizzes - Create new quiz (Teacher or Admin only)
quizzesRouter.post('/', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const {
    title,
    description,
    subject_id,
    subject_ids,
    topic_id,
    medical_specialty,
    specialty,
    difficulty,
    time_limit_minutes,
    max_attempts,
    is_mock_exam,
    instructions,
  } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Quiz title is required.' });
    return;
  }

  if (!subject_id && (!Array.isArray(subject_ids) || subject_ids.length === 0)) {
    res.status(400).json({ error: 'Subject is required.' });
    return;
  }

  const primarySubjectId = subject_id || (Array.isArray(subject_ids) && subject_ids.length > 0 ? subject_ids[0] : 'sub_pathology');

  const newQuiz: Quiz = {
    id: `quiz_${crypto.randomUUID()}`,
    title: title.trim(),
    description: description?.trim() || '',
    subject_id: primarySubjectId,
    subject_ids: Array.isArray(subject_ids) ? subject_ids : undefined,
    topic_id: topic_id || undefined,
    medical_specialty: (medical_specialty || specialty)?.trim() || undefined,
    difficulty: difficulty || 'Intermediate',
    time_limit_minutes: Number(time_limit_minutes) || 0,
    max_attempts: max_attempts !== undefined ? Number(max_attempts) : 0,
    is_mock_exam: !!is_mock_exam,
    status: 'draft',
    instructions: instructions?.trim() || 'Select the single best answer or all applicable choices. Clinical reasoning is advised.',
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    view_count: 0,
  };

  db.createQuiz(newQuiz);
  res.status(201).json({ quiz: newQuiz, message: 'Quiz draft created successfully.' });
});

// PUT /api/quizzes/:id - Update Quiz details (Teacher Owner or Admin only)
quizzesRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  // Security Ownership Check
  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied. You can only modify your own quizzes.' });
    return;
  }

  const {
    title,
    description,
    subject_id,
    subject_ids,
    topic_id,
    medical_specialty,
    specialty,
    difficulty,
    time_limit_minutes,
    max_attempts,
    is_mock_exam,
    instructions,
  } = req.body;

  const updated = db.updateQuiz(quiz.id, {
    ...(title && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(subject_id && { subject_id }),
    ...(subject_ids !== undefined && { subject_ids: Array.isArray(subject_ids) ? subject_ids : undefined }),
    ...(topic_id !== undefined && { topic_id: topic_id || undefined }),
    ...((medical_specialty !== undefined || specialty !== undefined) && { medical_specialty: (medical_specialty || specialty)?.trim() || undefined }),
    ...(difficulty && { difficulty }),
    ...(time_limit_minutes !== undefined && { time_limit_minutes: Number(time_limit_minutes) }),
    ...(max_attempts !== undefined && { max_attempts: Number(max_attempts) }),
    ...(is_mock_exam !== undefined && { is_mock_exam: !!is_mock_exam }),
    ...(instructions !== undefined && { instructions: instructions.trim() }),
  });

  res.json({ quiz: updated, message: 'Quiz updated successfully.' });
});

// DELETE /api/quizzes/:id - Delete quiz (Teacher Owner or Admin only)
quizzesRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  // Security Ownership Check
  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied. You can only delete your own quizzes.' });
    return;
  }

  db.deleteQuiz(quiz.id);
  res.json({ message: 'Quiz deleted successfully.' });
});

// POST /api/quizzes/:id/publish - Validate and Publish Quiz
quizzesRouter.post('/:id/publish', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  // Security Ownership Check
  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied. You can only publish your own quizzes.' });
    return;
  }

  // Strict Validation
  const validation = validateQuizForPublish(quiz.id);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Quiz cannot be published because it failed validation.',
      errors: validation.errors,
    });
    return;
  }

  const updated = db.updateQuiz(quiz.id, { status: 'published' });
  res.json({ quiz: updated, message: 'Quiz published successfully! Students can now access and take this quiz.' });
});

// POST /api/quizzes/:id/unpublish - Unpublish Quiz
quizzesRouter.post('/:id/unpublish', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied. You can only unpublish your own quizzes.' });
    return;
  }

  const updated = db.updateQuiz(quiz.id, { status: 'unpublished' });
  res.json({ quiz: updated, message: 'Quiz unpublished.' });
});

// POST /api/quizzes/:id/questions - Add question to quiz
quizzesRouter.post('/:id/questions', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  const {
    type,
    prompt,
    clinical_vignette,
    explanation,
    learning_point,
    reference,
    difficulty,
    topic_id,
    points,
    choices,
  } = req.body;

  if (!prompt || !prompt.trim()) {
    res.status(400).json({ error: 'Question prompt is required.' });
    return;
  }

  if (!Array.isArray(choices) || choices.length < 2) {
    res.status(400).json({ error: 'At least 2 answer choices are required.' });
    return;
  }

  const existingQuestions = db.getQuestionsByQuizId(quiz.id);
  const questionId = `q_${crypto.randomUUID()}`;

  const newQuestion: Question = {
    id: questionId,
    quiz_id: quiz.id,
    type: type || 'sba',
    prompt: prompt.trim(),
    clinical_vignette: clinical_vignette || undefined,
    explanation: explanation?.trim() || '',
    learning_point: learning_point?.trim() || '',
    reference: reference?.trim() || '',
    difficulty: difficulty || quiz.difficulty,
    topic_id: topic_id || quiz.topic_id,
    points: Number(points) || 1,
    display_order: existingQuestions.length + 1,
    created_at: new Date().toISOString(),
  };

  db.createQuestion(newQuestion, choices);
  const createdChoices = db.getChoicesByQuestionId(questionId);

  res.status(201).json({
    question: {
      ...newQuestion,
      choices: createdChoices,
    },
    message: 'Question added successfully.',
  });
});

// PUT /api/quizzes/:id/questions/:questionId - Edit question and choices
quizzesRouter.put('/:id/questions/:questionId', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  const question = db.getQuestionById(req.params.questionId);
  if (!question || question.quiz_id !== quiz.id) {
    res.status(404).json({ error: 'Question not found in this quiz.' });
    return;
  }

  const {
    type,
    prompt,
    clinical_vignette,
    explanation,
    learning_point,
    reference,
    difficulty,
    topic_id,
    points,
    choices,
  } = req.body;

  const updated = db.updateQuestion(
    question.id,
    {
      ...(type && { type }),
      ...(prompt && { prompt: prompt.trim() }),
      ...(clinical_vignette !== undefined && { clinical_vignette }),
      ...(explanation !== undefined && { explanation: explanation.trim() }),
      ...(learning_point !== undefined && { learning_point: learning_point.trim() }),
      ...(reference !== undefined && { reference: reference.trim() }),
      ...(difficulty && { difficulty }),
      ...(topic_id !== undefined && { topic_id }),
      ...(points !== undefined && { points: Number(points) }),
    },
    choices
  );

  const updatedChoices = db.getChoicesByQuestionId(question.id);
  res.json({
    question: {
      ...updated,
      choices: updatedChoices,
    },
    message: 'Question updated successfully.',
  });
});

// DELETE /api/quizzes/:id/questions/:questionId - Delete question
quizzesRouter.delete('/:id/questions/:questionId', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  const success = db.deleteQuestion(req.params.questionId);
  if (!success) {
    res.status(404).json({ error: 'Question not found.' });
    return;
  }

  res.json({ message: 'Question deleted successfully.' });
});

// GET /api/quizzes/:id/stats - Teacher stats for their quiz
quizzesRouter.get('/:id/stats', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  if (quiz.created_by !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied. You can only view statistics for your own quizzes.' });
    return;
  }

  const attempts = db.getAttemptsByQuizId(quiz.id).filter(a => a.status === 'completed');
  const questions = db.getQuestionsByQuizId(quiz.id);
  const allAnswers = db.getAllStudentAnswers();

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0
    ? Math.round((attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts) * 10) / 10
    : 0;
  const passCount = attempts.filter(a => a.percentage >= 70).length;
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;
  const avgTimeSeconds = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / totalAttempts)
    : 0;

  // Question difficulty analysis: what % of students answered each question correctly
  const questionAnalytics = questions.map((q, idx) => {
    const questionAnswers = allAnswers.filter(ans => ans.question_id === q.id);
    const totalAnswered = questionAnswers.length;
    const correctCount = questionAnswers.filter(ans => ans.is_correct).length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return {
      question_id: q.id,
      question_number: idx + 1,
      prompt: q.prompt,
      total_answers: totalAnswered,
      correct_answers: correctCount,
      accuracy_percentage: accuracy,
    };
  });

  res.json({
    quiz_id: quiz.id,
    title: quiz.title,
    status: quiz.status,
    total_attempts: totalAttempts,
    average_score: avgScore,
    pass_rate: passRate,
    average_time_seconds: avgTimeSeconds,
    question_analytics: questionAnalytics,
  });
});

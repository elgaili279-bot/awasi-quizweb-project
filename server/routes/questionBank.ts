import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticate, optionalAuthenticate, type AuthenticatedRequest } from '../auth.ts';

export const questionBankRouter = Router();

// GET /api/question-bank - Browse searchable questions from published quizzes
questionBankRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { subject_id, topic_id, difficulty, type, search, bookmarkedOnly, incorrectOnly } = req.query;
  const user = req.user;

  // Only questions belonging to PUBLISHED quizzes
  const publishedQuizzes = db.getQuizzes({ status: 'published' });
  const publishedQuizIds = new Set(publishedQuizzes.map(q => q.id));

  let questions = db.getAllQuestions().filter(q => publishedQuizIds.has(q.quiz_id));

  if (subject_id) {
    const quizMap = new Map(publishedQuizzes.map(q => [q.id, q]));
    questions = questions.filter(q => quizMap.get(q.quiz_id)?.subject_id === subject_id);
  }

  if (topic_id) {
    questions = questions.filter(q => q.topic_id === topic_id);
  }

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  if (type) {
    questions = questions.filter(q => q.type === type);
  }

  if (search && typeof search === 'string') {
    const query = search.toLowerCase();
    questions = questions.filter(q =>
      q.prompt.toLowerCase().includes(query) ||
      (q.explanation && q.explanation.toLowerCase().includes(query)) ||
      (q.learning_point && q.learning_point.toLowerCase().includes(query))
    );
  }

  // Filter bookmarked
  let studentBookmarks: string[] = [];
  if (user) {
    studentBookmarks = db.getBookmarksByStudent(user.id).map(b => b.question_id);
    if (bookmarkedOnly === 'true') {
      const bmSet = new Set(studentBookmarks);
      questions = questions.filter(q => bmSet.has(q.id));
    }
  }

  // Filter previously incorrect
  if (user && incorrectOnly === 'true') {
    const studentAttempts = db.getAttemptsByStudent(user.id).map(a => a.id);
    const studentAnswers = db.getAllStudentAnswers().filter(ans => studentAttempts.includes(ans.attempt_id));
    const incorrectQuestionIds = new Set(studentAnswers.filter(ans => !ans.is_correct).map(ans => ans.question_id));
    questions = questions.filter(q => incorrectQuestionIds.has(q.id));
  }

  const subjects = db.getSubjects();
  const topics = db.getTopics();
  const bmSet = new Set(studentBookmarks);

  // Return questions with their associated quiz metadata and choices
  const formatted = questions.map(q => {
    const quiz = publishedQuizzes.find(qz => qz.id === q.quiz_id);
    const subject = quiz ? subjects.find(s => s.id === quiz.subject_id) : null;
    const topic = q.topic_id ? topics.find(t => t.id === q.topic_id) : null;
    const rawChoices = db.getChoicesByQuestionId(q.id);

    return {
      id: q.id,
      quiz_id: q.quiz_id,
      quiz_title: quiz?.title || 'Medical Quiz',
      subject_name: subject?.name || 'General Medical',
      topic_name: topic?.name || null,
      type: q.type,
      prompt: q.prompt,
      clinical_vignette: q.clinical_vignette,
      difficulty: q.difficulty,
      points: q.points,
      explanation: q.explanation,
      learning_point: q.learning_point,
      reference: q.reference,
      is_bookmarked: bmSet.has(q.id),
      choices: rawChoices.map(c => ({
        id: c.id,
        choice_text: c.choice_text,
        is_correct: c.is_correct,
        explanation: c.explanation,
      })),
    };
  });

  res.json({ questions: formatted, total: formatted.length });
});

// POST /api/bookmarks/toggle
questionBankRouter.post('/bookmarks/toggle', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { question_id, note } = req.body;

  if (!question_id) {
    res.status(400).json({ error: 'Question ID is required.' });
    return;
  }

  const isBookmarked = db.toggleBookmark(user.id, question_id, note);
  res.json({
    question_id,
    is_bookmarked: isBookmarked,
    message: isBookmarked ? 'Question bookmarked for high-yield review.' : 'Question removed from bookmarks.',
  });
});

// GET /api/bookmarks
questionBankRouter.get('/bookmarks', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const bookmarks = db.getBookmarksByStudent(user.id);
  const questions = db.getAllQuestions();
  const quizzes = db.getQuizzes();
  const subjects = db.getSubjects();

  const enriched = bookmarks.map(b => {
    const q = questions.find(quest => quest.id === b.question_id);
    const quiz = q ? quizzes.find(qz => qz.id === q.quiz_id) : null;
    const subject = quiz ? subjects.find(s => s.id === quiz.subject_id) : null;
    const choices = q ? db.getChoicesByQuestionId(q.id) : [];

    return {
      bookmark_id: b.id,
      created_at: b.created_at,
      note: b.note,
      question: q ? {
        ...q,
        quiz_title: quiz?.title,
        subject_name: subject?.name,
        choices,
      } : null,
    };
  }).filter(b => b.question !== null);

  res.json({ bookmarks: enriched });
});

// POST /api/reports - Report a medical question issue
questionBankRouter.post('/reports', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { question_id, reason, details } = req.body;

  if (!question_id || !reason) {
    res.status(400).json({ error: 'Question ID and reason are required.' });
    return;
  }

  const question = db.getQuestionById(question_id);
  if (!question) {
    res.status(404).json({ error: 'Question not found.' });
    return;
  }

  const report = db.createReport({
    id: `rep_${crypto.randomUUID()}`,
    question_id,
    reported_by: user.id,
    reason: reason.trim(),
    details: details?.trim() || '',
    status: 'pending',
    created_at: new Date().toISOString(),
    resolved_at: null,
  });

  res.status(201).json({
    message: 'Report submitted. Platform clinical moderators will review this question.',
    report,
  });
});

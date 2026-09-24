import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticate, optionalAuthenticate, type AuthenticatedRequest } from '../auth.ts';

export const questionBankRouter = Router();

// GET /api/question-bank - Browse questions solved by the user in quiz practice sessions
questionBankRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { subject_id, topic_id, difficulty, type, search, bookmarkedOnly, incorrectOnly } = req.query;
  const user = req.user;

  // If unauthenticated or no user, student has not solved questions in quizzes yet
  if (!user) {
    res.json({ questions: [], total: 0, totalSolved: 0 });
    return;
  }

  // Find all questions the student has solved/answered in any completed quiz attempts
  const studentAttempts = db.getAttemptsByStudent(user.id);
  const attemptIds = studentAttempts.map(a => a.id);
  const studentAnswers = db.getAllStudentAnswers().filter(ans => attemptIds.includes(ans.attempt_id));

  // Build a map of solved questions with performance metrics
  const solvedQuestionMap = new Map<string, {
    is_correct: boolean;
    selected_choice_id: string;
    attempt_count: number;
    has_incorrect: boolean;
    has_correct: boolean;
  }>();

  studentAnswers.forEach(ans => {
    const choiceId = ans.selected_choice_ids && ans.selected_choice_ids.length > 0 ? ans.selected_choice_ids[0] : '';
    const existing = solvedQuestionMap.get(ans.question_id);
    if (!existing) {
      solvedQuestionMap.set(ans.question_id, {
        is_correct: ans.is_correct,
        selected_choice_id: choiceId,
        attempt_count: 1,
        has_incorrect: !ans.is_correct,
        has_correct: ans.is_correct,
      });
    } else {
      existing.attempt_count += 1;
      existing.is_correct = ans.is_correct;
      existing.selected_choice_id = choiceId;
      if (!ans.is_correct) existing.has_incorrect = true;
      if (ans.is_correct) existing.has_correct = true;
    }
  });

  const allQuestions = db.getAllQuestions();
  let solvedQuestions = allQuestions.filter(q => solvedQuestionMap.has(q.id));

  const allQuizzes = db.getQuizzes();
  const quizMap = new Map(allQuizzes.map(q => [q.id, q]));

  if (subject_id && subject_id !== 'all') {
    solvedQuestions = solvedQuestions.filter(q => {
      const qz = quizMap.get(q.quiz_id);
      return q.subject_id === subject_id || qz?.subject_id === subject_id;
    });
  }

  if (topic_id && topic_id !== 'all') {
    solvedQuestions = solvedQuestions.filter(q => q.topic_id === topic_id);
  }

  if (difficulty && difficulty !== 'all') {
    solvedQuestions = solvedQuestions.filter(q => q.difficulty === difficulty);
  }

  if (type && type !== 'all') {
    solvedQuestions = solvedQuestions.filter(q => q.type === type);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const query = search.toLowerCase().trim();
    solvedQuestions = solvedQuestions.filter(q =>
      q.prompt.toLowerCase().includes(query) ||
      (q.explanation && q.explanation.toLowerCase().includes(query)) ||
      (q.learning_point && q.learning_point.toLowerCase().includes(query)) ||
      (q.clinical_vignette?.chief_complaint && q.clinical_vignette.chief_complaint.toLowerCase().includes(query)) ||
      (q.clinical_vignette?.history && q.clinical_vignette.history.toLowerCase().includes(query))
    );
  }

  // Filter bookmarked
  const studentBookmarks = db.getBookmarksByStudent(user.id).map(b => b.question_id);
  const bmSet = new Set(studentBookmarks);
  if (bookmarkedOnly === 'true') {
    solvedQuestions = solvedQuestions.filter(q => bmSet.has(q.id));
  }

  // Filter previously incorrect
  if (incorrectOnly === 'true') {
    solvedQuestions = solvedQuestions.filter(q => {
      const info = solvedQuestionMap.get(q.id);
      return info?.has_incorrect === true;
    });
  }

  const subjects = db.getSubjects();
  const topics = db.getTopics();

  // Return questions with their associated quiz metadata, student response, and choices
  const formatted = solvedQuestions.map(q => {
    const quiz = quizMap.get(q.quiz_id);
    const subject = quiz ? subjects.find(s => s.id === quiz.subject_id) : subjects.find(s => s.id === q.subject_id);
    const topic = q.topic_id ? topics.find(t => t.id === q.topic_id) : null;
    const rawChoices = db.getChoicesByQuestionId(q.id);
    const solvedInfo = solvedQuestionMap.get(q.id);

    return {
      id: q.id,
      quiz_id: q.quiz_id,
      subject_id: q.subject_id || quiz?.subject_id,
      quiz_title: quiz?.title || 'Clinical Practice Quiz',
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
      is_incorrect: solvedInfo ? !solvedInfo.is_correct : false,
      user_selected_choice_id: solvedInfo?.selected_choice_id,
      attempt_count: solvedInfo?.attempt_count || 1,
      choices: rawChoices.map(c => ({
        id: c.id,
        choice_text: c.choice_text,
        is_correct: c.is_correct,
        explanation: c.explanation,
      })),
    };
  });

  res.json({
    questions: formatted,
    total: formatted.length,
    totalSolved: solvedQuestionMap.size,
  });
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

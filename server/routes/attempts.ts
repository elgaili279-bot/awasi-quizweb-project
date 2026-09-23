import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type QuizAttempt, type StudentAnswer } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../auth.ts';

export const attemptsRouter = Router();

// POST /api/attempts/start - Student starts a quiz attempt
attemptsRouter.post('/start', authenticate, requireRole('student', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { quiz_id } = req.body;

  if (!quiz_id) {
    res.status(400).json({ error: 'Quiz ID is required.' });
    return;
  }

  const quiz = db.getQuizById(quiz_id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  if (quiz.status !== 'published' && user.role !== 'admin') {
    res.status(400).json({ error: 'Only published quizzes can be taken.' });
    return;
  }

  const questions = db.getQuestionsByQuizId(quiz.id);
  if (questions.length === 0) {
    res.status(400).json({ error: 'This quiz has no questions available.' });
    return;
  }

  const attemptId = `att_${crypto.randomUUID()}`;
  const maxScore = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  const attempt: QuizAttempt = {
    id: attemptId,
    quiz_id: quiz.id,
    student_id: user.id,
    started_at: new Date().toISOString(),
    completed_at: null,
    score: 0,
    max_score: maxScore,
    percentage: 0,
    time_spent_seconds: 0,
    status: 'in_progress',
  };

  db.createAttempt(attempt);

  res.status(201).json({
    attempt_id: attempt.id,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      time_limit_minutes: quiz.time_limit_minutes,
      instructions: quiz.instructions,
    },
    started_at: attempt.started_at,
  });
});

// POST /api/attempts/:id/submit - Student submits answers
// Server calculates score strictly from database correct answers!
attemptsRouter.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const attempt = db.getAttemptById(req.params.id);

  if (!attempt) {
    res.status(404).json({ error: 'Quiz attempt not found.' });
    return;
  }

  // Security: only the student who started the attempt (or admin) can submit
  if (attempt.student_id !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized to submit this attempt.' });
    return;
  }

  // Accidental double submission prevention
  if (attempt.status === 'completed') {
    res.status(400).json({
      error: 'This attempt has already been submitted and scored.',
      attempt_id: attempt.id,
      score: attempt.score,
      percentage: attempt.percentage,
    });
    return;
  }

  const { answers, time_spent_seconds } = req.body;
  // answers is an array: [{ question_id: string, selected_choice_ids: string[] }]
  if (!Array.isArray(answers)) {
    res.status(400).json({ error: 'Invalid answers format. Expected an array of answers.' });
    return;
  }

  const quiz = db.getQuizById(attempt.quiz_id);
  if (!quiz) {
    res.status(404).json({ error: 'Associated quiz no longer exists.' });
    return;
  }

  const questions = db.getQuestionsByQuizId(quiz.id);
  const questionMap = new Map(questions.map(q => [q.id, q]));

  let totalScoreEarned = 0;
  let maxScorePossible = 0;
  const recordedStudentAnswers: StudentAnswer[] = [];

  questions.forEach(q => {
    const qPoints = q.points || 1;
    maxScorePossible += qPoints;

    const studentAns = answers.find(a => a.question_id === q.id);
    const selectedChoiceIds: string[] = Array.isArray(studentAns?.selected_choice_ids)
      ? studentAns.selected_choice_ids
      : [];

    const dbChoices = db.getChoicesByQuestionId(q.id);
    const correctChoiceIds = new Set(dbChoices.filter(c => c.is_correct).map(c => c.id));

    let isCorrect = false;

    if (q.type === 'sba' || q.type === 'true_false') {
      // Single choice must match exactly one correct choice
      if (selectedChoiceIds.length === 1 && correctChoiceIds.has(selectedChoiceIds[0])) {
        isCorrect = true;
      }
    } else if (q.type === 'multi_select') {
      // All correct choices must be selected, and NO incorrect choices selected
      const selectedSet = new Set(selectedChoiceIds);
      const allCorrectSelected = Array.from(correctChoiceIds).every(id => selectedSet.has(id));
      const noIncorrectSelected = selectedChoiceIds.every(id => correctChoiceIds.has(id));
      if (allCorrectSelected && noIncorrectSelected && correctChoiceIds.size > 0) {
        isCorrect = true;
      }
    } else {
      // Clinical vignette or other: evaluate against correct choices
      if (selectedChoiceIds.length > 0 && selectedChoiceIds.every(id => correctChoiceIds.has(id)) && selectedChoiceIds.length === correctChoiceIds.size) {
        isCorrect = true;
      }
    }

    const pointsEarned = isCorrect ? qPoints : 0;
    totalScoreEarned += pointsEarned;

    recordedStudentAnswers.push({
      id: `ans_${crypto.randomUUID()}`,
      attempt_id: attempt.id,
      question_id: q.id,
      selected_choice_ids: selectedChoiceIds,
      is_correct: isCorrect,
      points_earned: pointsEarned,
    });
  });

  const percentage = maxScorePossible > 0 ? Math.round((totalScoreEarned / maxScorePossible) * 100) : 0;
  const completedAt = new Date().toISOString();
  const timeSpent = Number(time_spent_seconds) || Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(attempt.started_at).getTime()) / 1000));

  const updatedAttempt = db.recordAttemptSubmission(attempt.id, {
    score: totalScoreEarned,
    max_score: maxScorePossible,
    percentage,
    time_spent_seconds: timeSpent,
    completed_at: completedAt,
    student_answers: recordedStudentAnswers,
  });

  // Award Achievements based on actual student progress
  db.awardAchievement(user.id, {
    code: 'FIRST_QUIZ',
    title: 'Clinical Induction',
    description: 'Completed your first medical assessment.',
    icon: 'GraduationCap',
  });

  if (percentage === 100) {
    db.awardAchievement(user.id, {
      code: 'PERFECT_SCORE',
      title: 'Board Certified Perfection',
      description: 'Scored a perfect 100% on a medical examination.',
      icon: 'Trophy',
    });
  }

  const allStudentCompletedAttempts = db.getAttemptsByStudent(user.id).filter(a => a.status === 'completed');
  if (allStudentCompletedAttempts.length >= 5) {
    db.awardAchievement(user.id, {
      code: 'HIGH_YIELD_STREAK',
      title: 'Dedicated Resident',
      description: 'Completed 5 medical quizzes on the platform.',
      icon: 'Award',
    });
  }

  res.json({
    message: 'Quiz submitted and evaluated successfully.',
    attempt: updatedAttempt,
    summary: {
      score: totalScoreEarned,
      max_score: maxScorePossible,
      percentage,
      total_questions: questions.length,
      correct_count: recordedStudentAnswers.filter(a => a.is_correct).length,
      incorrect_count: recordedStudentAnswers.filter(a => !a.is_correct && a.selected_choice_ids.length > 0).length,
      unanswered_count: recordedStudentAnswers.filter(a => a.selected_choice_ids.length === 0).length,
      time_spent_seconds: timeSpent,
    },
  });
});

// GET /api/attempts/:id - Review completed attempt with explanations
attemptsRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const attempt = db.getAttemptById(req.params.id);

  if (!attempt) {
    res.status(404).json({ error: 'Quiz attempt not found.' });
    return;
  }

  // Security check: only attempt owner or admin
  if (attempt.student_id !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied to view this quiz attempt.' });
    return;
  }

  const quiz = db.getQuizById(attempt.quiz_id);
  const questions = db.getQuestionsByQuizId(attempt.quiz_id);
  const studentAnswers = db.getStudentAnswersByAttemptId(attempt.id);
  const studentBookmarks = db.getBookmarksByStudent(user.id);

  const reviewQuestions = questions.map((q, idx) => {
    const choices = db.getChoicesByQuestionId(q.id);
    const studentAns = studentAnswers.find(sa => sa.question_id === q.id);
    const isBookmarked = studentBookmarks.some(b => b.question_id === q.id);

    return {
      id: q.id,
      question_number: idx + 1,
      type: q.type,
      prompt: q.prompt,
      clinical_vignette: q.clinical_vignette,
      explanation: q.explanation,
      learning_point: q.learning_point,
      reference: q.reference,
      difficulty: q.difficulty,
      points: q.points,
      choices: choices.map(c => ({
        id: c.id,
        choice_text: c.choice_text,
        is_correct: c.is_correct,
        explanation: c.explanation,
        display_order: c.display_order,
      })),
      student_answer: {
        selected_choice_ids: studentAns?.selected_choice_ids || [],
        is_correct: studentAns?.is_correct || false,
        points_earned: studentAns?.points_earned || 0,
      },
      is_bookmarked: isBookmarked,
    };
  });

  const correctCount = studentAnswers.filter(a => a.is_correct).length;
  const incorrectCount = studentAnswers.filter(a => !a.is_correct && a.selected_choice_ids.length > 0).length;
  const unansweredCount = questions.length - studentAnswers.filter(a => a.selected_choice_ids.length > 0).length;

  res.json({
    attempt: {
      ...attempt,
      quiz_title: quiz?.title || 'Medical Quiz',
      subject_id: quiz?.subject_id,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
    },
    questions: reviewQuestions,
  });
});

// GET /api/attempts/my-history - Student's quiz attempt history
attemptsRouter.get('/my/history', authenticate, requireRole('student', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const attempts = db.getAttemptsByStudent(user.id);
  const quizzes = db.getQuizzes();
  const subjects = db.getSubjects();

  const history = attempts.map(a => {
    const quiz = quizzes.find(q => q.id === a.quiz_id);
    const subject = quiz ? subjects.find(s => s.id === quiz.subject_id) : null;

    return {
      id: a.id,
      quiz_id: a.quiz_id,
      quiz_title: quiz?.title || 'Medical Quiz',
      subject_name: subject?.name || 'General Medicine',
      difficulty: quiz?.difficulty || 'Intermediate',
      score: a.score,
      max_score: a.max_score,
      percentage: a.percentage,
      time_spent_seconds: a.time_spent_seconds,
      status: a.status,
      started_at: a.started_at,
      completed_at: a.completed_at,
    };
  });

  res.json({ history });
});

// GET /api/student/analytics - Student analytics dashboard
attemptsRouter.get('/my/analytics', authenticate, requireRole('student', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const completedAttempts = db.getAttemptsByStudent(user.id).filter(a => a.status === 'completed');
  const allQuizzes = db.getQuizzes();
  const allSubjects = db.getSubjects();
  const allTopics = db.getTopics();
  const allQuestions = db.getAllQuestions();
  const allStudentAnswers = db.getAllStudentAnswers();

  // Find all answers by this student across completed attempts
  const studentAttemptIds = new Set(completedAttempts.map(a => a.id));
  const myAnswers = allStudentAnswers.filter(ans => studentAttemptIds.has(ans.attempt_id));

  const totalQuizzes = completedAttempts.length;
  const avgScore = totalQuizzes > 0
    ? Math.round((completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzes) * 10) / 10
    : 0;
  const totalQuestionsAnswered = myAnswers.length;
  const totalCorrect = myAnswers.filter(a => a.is_correct).length;
  const overallAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0;

  // Breakdown by Subject
  const subjectStatsMap: Record<string, { name: string; total: number; correct: number }> = {};
  allSubjects.forEach(s => {
    subjectStatsMap[s.id] = { name: s.name, total: 0, correct: 0 };
  });

  // Breakdown by Topic
  const topicStatsMap: Record<string, { name: string; subjectName: string; total: number; correct: number }> = {};

  myAnswers.forEach(ans => {
    const q = allQuestions.find(quest => quest.id === ans.question_id);
    if (!q) return;

    const quiz = allQuizzes.find(qz => qz.id === q.quiz_id);
    if (quiz && quiz.subject_id && subjectStatsMap[quiz.subject_id]) {
      subjectStatsMap[quiz.subject_id].total += 1;
      if (ans.is_correct) subjectStatsMap[quiz.subject_id].correct += 1;
    }

    if (q.topic_id) {
      const topic = allTopics.find(t => t.id === q.topic_id);
      if (topic) {
        if (!topicStatsMap[topic.id]) {
          const sub = allSubjects.find(s => s.id === topic.subject_id);
          topicStatsMap[topic.id] = {
            name: topic.name,
            subjectName: sub?.name || 'General',
            total: 0,
            correct: 0,
          };
        }
        topicStatsMap[topic.id].total += 1;
        if (ans.is_correct) topicStatsMap[topic.id].correct += 1;
      }
    }
  });

  const subjectPerformance = Object.entries(subjectStatsMap)
    .filter(([_, data]) => data.total > 0)
    .map(([subId, data]) => ({
      subject_id: subId,
      subject_name: data.name,
      total_questions: data.total,
      correct_questions: data.correct,
      accuracy: Math.round((data.correct / data.total) * 100),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  // Weak areas: topics with accuracy < 70%
  const weakAreas = Object.entries(topicStatsMap)
    .map(([topicId, data]) => {
      const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return {
        topic_id: topicId,
        topic_name: data.name,
        subject_name: data.subjectName,
        total: data.total,
        correct: data.correct,
        accuracy: acc,
      };
    })
    .filter(item => item.accuracy < 70 && item.total >= 1)
    .sort((a, b) => a.accuracy - b.accuracy);

  // Recent timeline (last 5 attempts)
  const recentActivity = completedAttempts.slice(0, 5).map(att => {
    const quiz = allQuizzes.find(q => q.id === att.quiz_id);
    return {
      attempt_id: att.id,
      quiz_title: quiz?.title || 'Medical Quiz',
      percentage: att.percentage,
      score: att.score,
      max_score: att.max_score,
      completed_at: att.completed_at,
    };
  });

  const achievements = db.getAchievements(user.id);

  res.json({
    analytics: {
      total_quizzes_completed: totalQuizzes,
      average_score: avgScore,
      questions_answered: totalQuestionsAnswered,
      accuracy: overallAccuracy,
      subject_performance: subjectPerformance,
      weak_areas: weakAreas,
      recent_activity: recentActivity,
      achievements,
    },
  });
});

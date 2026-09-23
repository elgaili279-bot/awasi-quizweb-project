import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import { db, type QuizDifficulty } from '../db.ts';
import { optionalAuthenticate, type AuthenticatedRequest } from '../auth.ts';

export const leaderboardRouter = Router();

const DIFFICULTY_MULTIPLIERS: Record<QuizDifficulty, number> = {
  'Beginner': 1.0,
  'Intermediate': 1.15,
  'Advanced': 1.3,
  'USMLE Step 1': 1.4,
  'USMLE Step 2 CK': 1.5,
};

function getClinicalRank(points: number): string {
  if (points >= 1000) return 'Chief Resident';
  if (points >= 500) return 'Senior Resident';
  if (points >= 250) return 'Junior Resident';
  if (points >= 100) return 'Medical Intern';
  return 'Medical Scholar';
}

// GET /api/leaderboard - Returns real educational leaderboard
leaderboardRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { subject_id } = req.query;
  const allUsers = db.getAllUsers().filter(u => u.status === 'active' && (u.role === 'student' || u.role === 'admin'));
  const allCompletedAttempts = db.getAllCompletedAttempts();
  const allQuizzes = db.getQuizzes();
  const allAnswers = db.getAllStudentAnswers();

  // If subject_id filter applied, filter attempts to that subject
  let filteredAttempts = allCompletedAttempts;
  if (subject_id) {
    const quizIdsInSubject = new Set(allQuizzes.filter(q => q.subject_id === subject_id).map(q => q.id));
    filteredAttempts = allCompletedAttempts.filter(a => quizIdsInSubject.has(a.quiz_id));
  }

  const quizMap = new Map(allQuizzes.map(q => [q.id, q]));

  const studentLeaderboard = allUsers.map(user => {
    const studentProfile = db.getStudentProfile(user.id);
    const userAttempts = filteredAttempts.filter(a => a.student_id === user.id);
    const attemptIds = new Set(userAttempts.map(a => a.id));
    const userAnswers = allAnswers.filter(ans => attemptIds.has(ans.attempt_id));

    let points = 0;
    userAttempts.forEach(att => {
      const quiz = quizMap.get(att.quiz_id);
      const diffMultiplier = quiz ? (DIFFICULTY_MULTIPLIERS[quiz.difficulty] || 1.0) : 1.0;
      let attemptBase = att.score * 10 * diffMultiplier;

      // Accuracy bonus to encourage learning quality
      if (att.percentage === 100) attemptBase += 50;
      else if (att.percentage >= 90) attemptBase += 30;
      else if (att.percentage >= 80) attemptBase += 15;

      points += Math.round(attemptBase);
    });

    const totalQuestions = userAnswers.length;
    const totalCorrect = userAnswers.filter(ans => ans.is_correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const averageScore = userAttempts.length > 0
      ? Math.round(userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length)
      : 0;

    return {
      user_id: user.id,
      display_name: user.display_name,
      role: user.role,
      medical_school_year: studentProfile?.medical_school_year || 'Medical Student',
      university: studentProfile?.university || '',
      quizzes_completed: userAttempts.length,
      total_points: points,
      accuracy,
      average_score: averageScore,
      clinical_rank: getClinicalRank(points),
    };
  });

  // Only include students who have at least 1 completed attempt OR show all students
  // Sorting strictly by total_points DESC, then accuracy DESC
  const ranked = studentLeaderboard
    .filter(s => s.quizzes_completed > 0)
    .sort((a, b) => b.total_points - a.total_points || b.accuracy - a.accuracy)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  res.json({
    leaderboard: ranked,
    total_participants: ranked.length,
  });
});

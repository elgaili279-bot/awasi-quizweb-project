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
  'Curriculum Core': 1.25,
  'Clinical Case': 1.4,
};

function getClinicalRank(points: number): string {
  if (points >= 1000) return 'Chief Resident';
  if (points >= 500) return 'Senior Resident';
  if (points >= 250) return 'Junior Resident';
  if (points >= 100) return 'Medical Intern';
  return 'Medical Scholar';
}

// GET /api/leaderboard - Returns real educational leaderboard strictly adhering to the First Attempt Rule & Top 5 Privacy
leaderboardRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { subject_id, show_all } = req.query;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  const allUsers = db.getAllUsers().filter(u => u.status === 'active' && u.role === 'student');
  const allCompletedAttempts = db.getAllCompletedAttempts();
  const allQuizzes = db.getQuizzes();
  const allAnswers = db.getAllStudentAnswers();
  const allSubjects = db.getSubjects();

  // If subject_id filter applied, filter to quizzes in that subject (or combined quizzes containing it)
  let activeQuizzes = allQuizzes;
  if (subject_id) {
    activeQuizzes = allQuizzes.filter(q => q.subject_id === subject_id || (q.subject_ids && q.subject_ids.includes(subject_id as string)));
  }
  const activeQuizIds = new Set(activeQuizzes.map(q => q.id));

  const quizMap = new Map(allQuizzes.map(q => [q.id, q]));

  // Leaderboard strictly uses FIRST COMPLETED ATTEMPT of each student for every quiz
  const studentLeaderboard = allUsers.map(user => {
    const studentProfile = db.getStudentProfile(user.id);
    const userCompletedAttempts = allCompletedAttempts
      .filter(a => a.student_id === user.id && activeQuizIds.has(a.quiz_id))
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    // Deduplicate: Keep strictly the earliest (first) completed attempt per quiz
    const firstAttemptsMap = new Map<string, typeof userCompletedAttempts[0]>();
    userCompletedAttempts.forEach(att => {
      if (!firstAttemptsMap.has(att.quiz_id)) {
        firstAttemptsMap.set(att.quiz_id, att);
      }
    });

    const officialFirstAttempts = Array.from(firstAttemptsMap.values());
    const officialAttemptIds = new Set(officialFirstAttempts.map(a => a.id));
    const officialAnswers = allAnswers.filter(ans => officialAttemptIds.has(ans.attempt_id));

    let points = 0;
    officialFirstAttempts.forEach(att => {
      const quiz = quizMap.get(att.quiz_id);
      const diffMultiplier = quiz ? (DIFFICULTY_MULTIPLIERS[quiz.difficulty] || 1.0) : 1.0;
      let attemptBase = att.score * 10 * diffMultiplier;

      // Accuracy bonus
      if (att.percentage === 100) attemptBase += 50;
      else if (att.percentage >= 90) attemptBase += 30;
      else if (att.percentage >= 80) attemptBase += 15;

      points += Math.round(attemptBase);
    });

    const totalQuestions = officialAnswers.length;
    const totalCorrect = officialAnswers.filter(ans => ans.is_correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const averageScore = officialFirstAttempts.length > 0
      ? Math.round(officialFirstAttempts.reduce((sum, a) => sum + a.percentage, 0) / officialFirstAttempts.length)
      : 0;

    return {
      user_id: user.id,
      display_name: user.display_name,
      role: user.role,
      medical_school_year: studentProfile?.medical_school_year || 'Medical Student',
      university: studentProfile?.university || '',
      quizzes_completed: officialFirstAttempts.length,
      total_attempts_count: userCompletedAttempts.length,
      total_points: points,
      accuracy,
      average_score: averageScore,
      clinical_rank: getClinicalRank(points),
    };
  });

  // Ranking strictly by total_points DESC, then accuracy DESC
  const rankedAll = studentLeaderboard
    .filter(s => s.quizzes_completed > 0)
    .sort((a, b) => b.total_points - a.total_points || b.accuracy - a.accuracy)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  // Find current user's private rank
  let userPrivateRanking: (typeof rankedAll[0] & { total_participants: number }) | null = null;
  if (currentUserId) {
    const myRankIdx = rankedAll.findIndex(r => r.user_id === currentUserId);
    if (myRankIdx >= 0) {
      userPrivateRanking = {
        ...rankedAll[myRankIdx],
        total_participants: rankedAll.length,
      };
    }
  }

  // Top 5 Privacy Rule: Public leaderboard shows ONLY top 5 students
  // Teachers/Admins can see full list if requested with show_all=true
  const isTeacherOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin';
  const top5 = (show_all === 'true' && isTeacherOrAdmin) ? rankedAll : rankedAll.slice(0, 5);

  const selectedSubject = subject_id ? allSubjects.find(s => s.id === subject_id) : null;

  res.json({
    top_5: top5,
    leaderboard: top5,
    user_private_ranking: userPrivateRanking,
    total_participants: rankedAll.length,
    subject_id: subject_id || null,
    subject_name: selectedSubject ? selectedSubject.name : 'Overall Batch 99 Leaderboard',
  });
});

// GET /api/leaderboard/subjects-summary - Returns Top 5 widgets data for all curriculum subjects
leaderboardRouter.get('/subjects-summary', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const currentUserId = req.user?.id;
  const allUsers = db.getAllUsers().filter(u => u.status === 'active' && u.role === 'student');
  const allCompletedAttempts = db.getAllCompletedAttempts();
  const allQuizzes = db.getQuizzes();
  const allSubjects = db.getSubjects();
  const quizMap = new Map(allQuizzes.map(q => [q.id, q]));

  const summaries = allSubjects.map(subject => {
    const subjectQuizzes = allQuizzes.filter(q => q.subject_id === subject.id || (q.subject_ids && q.subject_ids.includes(subject.id)));
    const subjectQuizIds = new Set(subjectQuizzes.map(q => q.id));

    const subjectRanked = allUsers.map(user => {
      const studentProfile = db.getStudentProfile(user.id);
      const userCompletedAttempts = allCompletedAttempts
        .filter(a => a.student_id === user.id && subjectQuizIds.has(a.quiz_id))
        .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

      // First attempt rule
      const firstAttemptsMap = new Map<string, typeof userCompletedAttempts[0]>();
      userCompletedAttempts.forEach(att => {
        if (!firstAttemptsMap.has(att.quiz_id)) {
          firstAttemptsMap.set(att.quiz_id, att);
        }
      });
      const firstAttempts = Array.from(firstAttemptsMap.values());

      let points = 0;
      firstAttempts.forEach(att => {
        const quiz = quizMap.get(att.quiz_id);
        const diffMultiplier = quiz ? (DIFFICULTY_MULTIPLIERS[quiz.difficulty] || 1.0) : 1.0;
        let attemptBase = att.score * 10 * diffMultiplier;
        if (att.percentage === 100) attemptBase += 50;
        else if (att.percentage >= 90) attemptBase += 30;
        points += Math.round(attemptBase);
      });

      return {
        user_id: user.id,
        display_name: user.display_name,
        medical_school_year: studentProfile?.medical_school_year || 'Medical Student',
        quizzes_completed: firstAttempts.length,
        total_points: points,
      };
    })
    .filter(s => s.quizzes_completed > 0)
    .sort((a, b) => b.total_points - a.total_points)
    .map((e, idx) => ({ ...e, rank: idx + 1 }));

    let userRank: { rank: number; total_points: number } | null = null;
    if (currentUserId) {
      const idx = subjectRanked.findIndex(r => r.user_id === currentUserId);
      if (idx >= 0) {
        userRank = { rank: subjectRanked[idx].rank, total_points: subjectRanked[idx].total_points };
      }
    }

    return {
      subject_id: subject.id,
      subject_name: subject.name,
      icon: subject.icon,
      top_5: subjectRanked.slice(0, 5),
      total_participants: subjectRanked.length,
      user_private_ranking: userRank,
    };
  });

  res.json({ subject_leaderboards: summaries });
});

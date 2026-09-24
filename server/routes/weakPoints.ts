import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import { db } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../auth.ts';

export const weakPointsRouter = Router();

// GET /api/weak-points - Get logged-in student's weak points with full question metadata
weakPointsRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const weakPoints = db.getWeakPointsByStudent(user.id);
  const subjects = db.getSubjects();
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
  const topics = db.getTopics();
  const topicMap = new Map(topics.map(t => [t.id, t.name]));

  const enriched = weakPoints.map(wp => {
    const question = db.getQuestionById(wp.question_id);
    const choices = question ? db.getChoicesByQuestionId(question.id) : [];
    const quiz = question ? db.getQuizById(question.quiz_id) : null;

    return {
      id: wp.id,
      student_id: wp.student_id,
      question_id: wp.question_id,
      subject_id: wp.subject_id,
      subject_name: subjectMap.get(wp.subject_id) || 'Curriculum',
      topic_id: wp.topic_id,
      topic_name: wp.topic_id ? topicMap.get(wp.topic_id) : null,
      medical_specialty: quiz?.medical_specialty || 'Clinical Core',
      times_incorrect: wp.times_incorrect,
      times_correct: wp.times_correct,
      is_mastered: wp.is_mastered,
      last_attempted_at: wp.last_attempted_at,
      mastered_at: wp.mastered_at,
      question: question ? {
        id: question.id,
        quiz_id: question.quiz_id,
        type: question.type,
        prompt: question.prompt,
        clinical_vignette: question.clinical_vignette,
        explanation: question.explanation,
        learning_point: question.learning_point,
        reference: question.reference,
        difficulty: question.difficulty,
        points: question.points,
        choices: choices.map(c => ({
          id: c.id,
          choice_text: c.choice_text,
          is_correct: c.is_correct,
          explanation: c.explanation,
          display_order: c.display_order,
        })),
      } : null,
    };
  }).filter(wp => wp.question !== null);

  res.json({
    weak_points: enriched,
    total_count: enriched.length,
    active_count: enriched.filter(w => !w.is_mastered).length,
    mastered_count: enriched.filter(w => w.is_mastered).length,
  });
});

// POST /api/weak-points/:question_id/master - Toggle mastered status
weakPointsRouter.post('/:question_id/master', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { is_mastered } = req.body;
  const success = db.setWeakPointMastered(user.id, req.params.question_id, is_mastered !== false);

  if (!success) {
    res.status(404).json({ error: 'Question not found in student weak points list.' });
    return;
  }

  res.json({
    success: true,
    message: is_mastered !== false ? 'Marked as mastered!' : 'Restored to active revision list.',
  });
});

// POST /api/weak-points/:question_id/retry - Active recall retry submission
weakPointsRouter.post('/:question_id/retry', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { selected_choice_ids } = req.body;
  const question = db.getQuestionById(req.params.question_id);

  if (!question) {
    res.status(404).json({ error: 'Question not found.' });
    return;
  }

  const choices = db.getChoicesByQuestionId(question.id);
  const correctChoiceIds = new Set(choices.filter(c => c.is_correct).map(c => c.id));
  const selected = Array.isArray(selected_choice_ids) ? selected_choice_ids : [];

  let isCorrect = false;
  if (question.type === 'sba' || question.type === 'true_false') {
    isCorrect = selected.length === 1 && correctChoiceIds.has(selected[0]);
  } else if (question.type === 'multi_select') {
    isCorrect = selected.length === correctChoiceIds.size && selected.every(id => correctChoiceIds.has(id));
  } else {
    isCorrect = selected.length > 0 && selected.every(id => correctChoiceIds.has(id));
  }

  if (isCorrect) {
    db.recordWeakPointSuccess(user.id, question.id);
  } else {
    const quiz = db.getQuizById(question.quiz_id);
    db.recordWeakPoint(user.id, question.id, question.subject_id || quiz?.subject_id || 'sub_pathology', question.topic_id);
  }

  res.json({
    is_correct: isCorrect,
    correct_choice_ids: Array.from(correctChoiceIds),
    explanation: question.explanation,
    learning_point: question.learning_point,
    reference: question.reference,
    choices: choices.map(c => ({
      id: c.id,
      choice_text: c.choice_text,
      is_correct: c.is_correct,
      explanation: c.explanation,
    })),
  });
});

// DELETE /api/weak-points/:question_id - Remove question from weak points
weakPointsRouter.delete('/:question_id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const success = db.deleteWeakPoint(user.id, req.params.question_id);
  if (!success) {
    res.status(404).json({ error: 'Question not found in weak points.' });
    return;
  }
  res.json({ success: true, message: 'Question removed from weak points.' });
});

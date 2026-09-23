import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type Subject, type Topic } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../auth.ts';

export const subjectsRouter = Router();

// GET /api/subjects - public
subjectsRouter.get('/', (_req, res): void => {
  const subjects = db.getSubjects();
  const allTopics = db.getTopics();
  const publishedQuizzes = db.getQuizzes({ status: 'published' });

  const enriched = subjects.map(s => {
    const topics = allTopics.filter(t => t.subject_id === s.id);
    const quizCount = publishedQuizzes.filter(q => q.subject_id === s.id).length;
    return {
      ...s,
      topics,
      quiz_count: quizCount,
    };
  });

  res.json({ subjects: enriched });
});

// GET /api/subjects/:id - public
subjectsRouter.get('/:id', (req, res): void => {
  const subject = db.getSubjectById(req.params.id);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found.' });
    return;
  }
  const topics = db.getTopics(subject.id);
  const quizCount = db.getQuizzes({ status: 'published', subject_id: subject.id }).length;

  res.json({
    subject: {
      ...subject,
      topics,
      quiz_count: quizCount,
    },
  });
});

// POST /api/subjects - Admin only
subjectsRouter.post('/', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { name, description, icon } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Subject name is required.' });
    return;
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const allSubjects = db.getSubjects();
  const newSubject: Subject = {
    id: `sub_${slug.replace(/-/g, '_')}_${crypto.randomBytes(3).toString('hex')}`,
    name: name.trim(),
    slug,
    description: description?.trim() || '',
    icon: icon?.trim() || 'BookOpen',
    is_active: true,
    display_order: allSubjects.length + 1,
  };

  db.createSubject(newSubject);
  res.status(201).json({ subject: newSubject });
});

// PUT /api/subjects/:id - Admin only
subjectsRouter.put('/:id', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { name, description, icon, is_active, display_order } = req.body;
  const updated = db.updateSubject(req.params.id, {
    ...(name && { name: name.trim(), slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') }),
    ...(description !== undefined && { description: description.trim() }),
    ...(icon && { icon: icon.trim() }),
    ...(is_active !== undefined && { is_active }),
    ...(display_order !== undefined && { display_order: Number(display_order) }),
  });

  if (!updated) {
    res.status(404).json({ error: 'Subject not found.' });
    return;
  }
  res.json({ subject: updated });
});

// POST /api/subjects/:id/topics - Admin only
subjectsRouter.post('/:id/topics', authenticate, requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
  const subject = db.getSubjectById(req.params.id);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found.' });
    return;
  }

  const { name, description } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Topic name is required.' });
    return;
  }

  const existingTopics = db.getTopics(subject.id);
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newTopic: Topic = {
    id: `top_${subject.id}_${crypto.randomBytes(3).toString('hex')}`,
    subject_id: subject.id,
    name: name.trim(),
    slug,
    description: description?.trim() || '',
    display_order: existingTopics.length + 1,
  };

  db.createTopic(newTopic);
  res.status(201).json({ topic: newTopic });
});

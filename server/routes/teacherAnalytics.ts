import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type RescueGroup, type PrivateNotification } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../auth.ts';

export const teacherAnalyticsRouter = Router();

// All routes in this file require Teacher or Admin role
teacherAnalyticsRouter.use(authenticate, requireRole('teacher', 'admin'));

// GET /api/teacher/batch-analytics - Get batch-level weak areas and curriculum analytics
teacherAnalyticsRouter.get('/batch-analytics', (_req: AuthenticatedRequest, res: Response): void => {
  const stats = db.getBatchAnalytics();
  res.json(stats);
});

// GET /api/teacher/student-performance-cohorts - Private performance categories
teacherAnalyticsRouter.get('/student-performance-cohorts', (_req: AuthenticatedRequest, res: Response): void => {
  const cohorts = db.getStudentPerformanceCohorts();
  res.json({ cohorts });
});

// GET /api/teacher/rescue-groups - List all private support sessions / rescue groups
teacherAnalyticsRouter.get('/rescue-groups', (_req: AuthenticatedRequest, res: Response): void => {
  const groups = db.getRescueGroups(undefined, true);
  const subjects = db.getSubjects();
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
  const allUsers = db.getAllUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u.display_name]));

  const enriched = groups.map(g => ({
    id: g.id,
    title: g.title,
    description: g.description,
    subject_id: g.subject_id,
    subject_name: g.subject_id ? subjectMap.get(g.subject_id) : 'Multidisciplinary',
    created_by: g.created_by,
    creator_name: userMap.get(g.created_by) || 'Academic Faculty',
    student_ids: g.student_ids,
    student_names: g.student_ids.map(id => userMap.get(id) || 'Student'),
    meeting_schedule: g.meeting_schedule,
    notes: g.notes,
    status: g.status,
    created_at: g.created_at,
  }));

  res.json({ rescue_groups: enriched });
});

// POST /api/teacher/rescue-groups - Create a private support session / rescue group
teacherAnalyticsRouter.post('/rescue-groups', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { title, description, subject_id, student_ids, meeting_schedule, notes } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Group title is required.' });
    return;
  }

  const newGroup: RescueGroup = {
    id: `rescue_${crypto.randomUUID()}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    subject_id: subject_id || undefined,
    created_by: user.id,
    student_ids: Array.isArray(student_ids) ? student_ids : [],
    meeting_schedule: meeting_schedule || undefined,
    notes: notes || undefined,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  db.createRescueGroup(newGroup);

  // Send private notification to invited students without publicly labeling them
  if (Array.isArray(student_ids)) {
    student_ids.forEach((sId: string) => {
      db.createNotification({
        id: `notif_${crypto.randomUUID()}`,
        user_id: sId,
        type: 'support_invitation',
        title: `Academic Support Session: ${newGroup.title}`,
        message: `You have been invited to an academic review session organized by ${user.display_name}. Schedule: ${meeting_schedule || 'Check with group organizer'}.`,
        link: '/community',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });
  }

  res.status(201).json({ group: newGroup, message: 'Academic support group created and private invitations sent.' });
});

// POST /api/teacher/send-support-message - Send private encouragement to a student
teacherAnalyticsRouter.post('/send-support-message', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { student_id, title, message } = req.body;

  if (!student_id || !message) {
    res.status(400).json({ error: 'Student ID and message are required.' });
    return;
  }

  const notif: PrivateNotification = {
    id: `notif_${crypto.randomUUID()}`,
    user_id: student_id,
    type: 'encouragement',
    title: title || 'Academic Faculty Message',
    message: message.trim(),
    is_read: false,
    created_at: new Date().toISOString(),
  };

  db.createNotification(notif);
  res.json({ success: true, message: 'Private message sent to student.' });
});

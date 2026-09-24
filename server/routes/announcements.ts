import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type Announcement } from '../db.ts';
import { authenticate, requireRole, optionalAuthenticate, type AuthenticatedRequest } from '../auth.ts';

export const announcementsRouter = Router();

// Helper to enrich announcement with author info and expiration status
function enrichAnnouncement(a: Announcement) {
  const author = db.findUserById(a.author_id);
  const now = Date.now();
  const is_expired = a.expires_at ? new Date(a.expires_at).getTime() <= now : false;
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    author_id: a.author_id,
    author_name: author ? author.display_name : 'Academic Committee',
    category: a.category,
    priority: a.priority,
    is_pinned: !!a.is_pinned,
    expires_at: a.expires_at || null,
    is_expired,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

// GET /api/announcements - Get announcements (active for rotation, plus archived list for managers)
announcementsRouter.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const includeExpired = req.query.include_expired === 'true' || req.query.all === 'true';
  const announcements = db.getAnnouncements(includeExpired);
  const archived = db.getArchivedAnnouncements();

  res.json({
    announcements: announcements.map(enrichAnnouncement),
    archived: archived.map(enrichAnnouncement),
    total_active: announcements.length,
    total_archived: archived.length,
  });
});

// POST /api/announcements - Teacher / Admin create announcement
announcementsRouter.post('/', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { title, content, category, priority, is_pinned, expires_at } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Announcement headline is required.' });
    return;
  }

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Announcement details are required.' });
    return;
  }

  const now = new Date().toISOString();
  let parsedExpiresAt: string | null = null;
  if (expires_at && typeof expires_at === 'string' && expires_at.trim()) {
    const expDate = new Date(expires_at.trim());
    if (!isNaN(expDate.getTime())) {
      parsedExpiresAt = expDate.toISOString();
    }
  }

  const ann: Announcement = {
    id: `ann_${crypto.randomUUID()}`,
    title: title.trim(),
    content: content.trim(),
    author_id: user.id,
    category: category || 'general',
    priority: priority || 'normal',
    is_pinned: !!is_pinned,
    expires_at: parsedExpiresAt,
    created_at: now,
    updated_at: now,
  };

  db.createAnnouncement(ann);
  res.status(201).json({
    announcement: enrichAnnouncement(ann),
    message: 'Announcement broadcasted successfully to Batch 99 News Screen.',
  });
});

// POST /api/announcements/sync - Sync announcements
announcementsRouter.post('/sync', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { announcements } = req.body;
  if (Array.isArray(announcements)) {
    announcements.forEach((ann: any) => {
      if (ann && ann.id && ann.title && ann.content) {
        const existing = db.getAnnouncements(true).find(a => a.id === ann.id);
        if (!existing) {
          db.createAnnouncement({
            id: ann.id,
            title: ann.title.trim(),
            content: ann.content.trim(),
            author_id: req.user!.id,
            category: ann.category || 'general',
            priority: ann.priority || 'normal',
            is_pinned: !!ann.is_pinned,
            expires_at: ann.expires_at ? new Date(ann.expires_at).toISOString() : null,
            created_at: ann.created_at || new Date().toISOString(),
            updated_at: ann.updated_at || new Date().toISOString(),
          });
        }
      }
    });
  }
  const all = db.getAnnouncements(true).map(enrichAnnouncement);
  res.json({ announcements: all, message: 'Announcements synchronized successfully.' });
});

// PUT /api/announcements/:id - Teacher / Admin update announcement
announcementsRouter.put('/:id', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { title, content, category, priority, is_pinned, expires_at } = req.body;

  let parsedExpiresAt: string | null | undefined = undefined;
  if (expires_at !== undefined) {
    if (expires_at && typeof expires_at === 'string' && expires_at.trim()) {
      const expDate = new Date(expires_at.trim());
      parsedExpiresAt = !isNaN(expDate.getTime()) ? expDate.toISOString() : null;
    } else {
      parsedExpiresAt = null;
    }
  }

  const updated = db.updateAnnouncement(req.params.id, {
    title: title ? title.trim() : undefined,
    content: content ? content.trim() : undefined,
    category,
    priority,
    is_pinned: is_pinned !== undefined ? !!is_pinned : undefined,
    expires_at: parsedExpiresAt,
  });

  if (!updated) {
    res.status(404).json({ error: 'Announcement not found.' });
    return;
  }

  res.json({
    announcement: enrichAnnouncement(updated),
    message: 'Announcement updated successfully.',
  });
});

// POST /api/announcements/:id/reactivate - Extend or reactivate an expired announcement
announcementsRouter.post('/:id/reactivate', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { days = 7, new_expires_at } = req.body;
  let targetExpiry: string | null = null;

  if (new_expires_at && typeof new_expires_at === 'string' && new_expires_at.trim()) {
    const d = new Date(new_expires_at.trim());
    if (!isNaN(d.getTime())) targetExpiry = d.toISOString();
  } else {
    // Default extend by X days from now
    const d = new Date(Date.now() + Math.max(1, Number(days) || 7) * 24 * 60 * 60 * 1000);
    targetExpiry = d.toISOString();
  }

  const updated = db.updateAnnouncement(req.params.id, {
    expires_at: targetExpiry,
    updated_at: new Date().toISOString(),
  });

  if (!updated) {
    res.status(404).json({ error: 'Announcement not found.' });
    return;
  }

  res.json({
    announcement: enrichAnnouncement(updated),
    message: `Announcement reactivated until ${targetExpiry ? new Date(targetExpiry).toLocaleDateString() : 'indefinite'}.`,
  });
});

// DELETE /api/announcements/:id - Teacher / Admin delete announcement
announcementsRouter.delete('/:id', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteAnnouncement(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Announcement not found.' });
    return;
  }
  res.json({ success: true, message: 'Announcement permanently removed.' });
});

import express from 'express';
import type { Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { db, type CommunityPost, type CommunityReply } from '../db.ts';
import { authenticate, requireRole, optionalAuthenticate, type AuthenticatedRequest } from '../auth.ts';

export const communityRouter = Router();

// GET /api/community/posts - List posts with search, subject filter, and sort
communityRouter.get('/posts', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { subject_id, category, search, sort } = req.query;
  const currentUserId = req.user?.id;

  const rawPosts = db.getCommunityPosts({
    subject_id: subject_id as string,
    category: category as string,
    search: search as string,
    sort: sort as any,
  });

  const subjects = db.getSubjects();
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

  const enriched = rawPosts.map(p => {
    const author = db.findUserById(p.author_id);
    const authorProfile = author ? db.getStudentProfile(author.id) : null;
    const replies = db.getCommunityRepliesByPostId(p.id);

    return {
      id: p.id,
      author_id: p.author_id,
      author_name: author ? author.display_name : 'Batch 99 Doctor',
      author_role: author ? author.role : 'student',
      medical_school_year: authorProfile?.medical_school_year || 'Medical Student',
      title: p.title,
      body: p.body,
      subject_id: p.subject_id,
      subject_name: p.subject_id ? subjectMap.get(p.subject_id) : 'General Academic',
      category: p.category,
      tags: p.tags || [],
      question_id: p.question_id,
      is_pinned: !!p.is_pinned,
      is_faculty_approved: !!p.is_faculty_approved,
      upvotes: p.upvotes || [],
      has_upvoted: currentUserId ? (p.upvotes || []).includes(currentUserId) : false,
      reply_count: replies.length,
      view_count: p.view_count || 0,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  });

  res.json({ posts: enriched });
});

// GET /api/community/posts/:id - View single post with replies
communityRouter.get('/posts/:id', optionalAuthenticate, (req: AuthenticatedRequest, res: Response): void => {
  const currentUserId = req.user?.id;
  const post = db.getCommunityPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Academic discussion not found.' });
    return;
  }

  // Increment view count
  db.updateCommunityPost(post.id, { view_count: (post.view_count || 0) + 1 });

  const author = db.findUserById(post.author_id);
  const authorProfile = author ? db.getStudentProfile(author.id) : null;
  const subject = post.subject_id ? db.getSubjectById(post.subject_id) : null;

  const rawReplies = db.getCommunityRepliesByPostId(post.id);
  const enrichedReplies = rawReplies.map(r => {
    const repAuthor = db.findUserById(r.author_id);
    const repProfile = repAuthor ? db.getStudentProfile(repAuthor.id) : null;
    return {
      id: r.id,
      post_id: r.post_id,
      author_id: r.author_id,
      author_name: repAuthor ? repAuthor.display_name : 'Colleague',
      author_role: repAuthor ? repAuthor.role : 'student',
      medical_school_year: repProfile?.medical_school_year || 'Medical Student',
      body: r.body,
      is_faculty_verified: !!r.is_faculty_verified,
      upvotes: r.upvotes || [],
      has_upvoted: currentUserId ? (r.upvotes || []).includes(currentUserId) : false,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });

  res.json({
    post: {
      id: post.id,
      author_id: post.author_id,
      author_name: author ? author.display_name : 'Batch 99 Doctor',
      author_role: author ? author.role : 'student',
      medical_school_year: authorProfile?.medical_school_year || 'Medical Student',
      title: post.title,
      body: post.body,
      subject_id: post.subject_id,
      subject_name: subject ? subject.name : 'General Academic',
      category: post.category,
      tags: post.tags || [],
      question_id: post.question_id,
      is_pinned: !!post.is_pinned,
      is_faculty_approved: !!post.is_faculty_approved,
      upvotes: post.upvotes || [],
      has_upvoted: currentUserId ? (post.upvotes || []).includes(currentUserId) : false,
      reply_count: enrichedReplies.length,
      view_count: (post.view_count || 0) + 1,
      created_at: post.created_at,
      updated_at: post.updated_at,
      replies: enrichedReplies,
    },
  });
});

// POST /api/community/posts - Create academic post
communityRouter.post('/posts', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { title, body, subject_id, category, tags, question_id } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Post title is required.' });
    return;
  }

  if (!body || !body.trim()) {
    res.status(400).json({ error: 'Discussion content is required.' });
    return;
  }

  const now = new Date().toISOString();
  const newPost: CommunityPost = {
    id: `post_${crypto.randomUUID()}`,
    author_id: user.id,
    title: title.trim(),
    body: body.trim(),
    subject_id: subject_id || undefined,
    category: category || 'clinical_question',
    tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
    question_id: question_id || undefined,
    is_pinned: false,
    is_faculty_approved: user.role === 'teacher' || user.role === 'admin',
    upvotes: [user.id],
    view_count: 1,
    created_at: now,
    updated_at: now,
  };

  db.createCommunityPost(newPost);
  res.status(201).json({ post: newPost, message: 'Academic discussion posted successfully.' });
});

// POST /api/community/posts/:id/reply - Reply to post
communityRouter.post('/posts/:id/reply', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const post = db.getCommunityPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  const { body } = req.body;
  if (!body || !body.trim()) {
    res.status(400).json({ error: 'Reply content is required.' });
    return;
  }

  const now = new Date().toISOString();
  const isFaculty = user.role === 'teacher' || user.role === 'admin';

  const reply: CommunityReply = {
    id: `rep_${crypto.randomUUID()}`,
    post_id: post.id,
    author_id: user.id,
    body: body.trim(),
    is_faculty_verified: isFaculty,
    upvotes: [user.id],
    created_at: now,
    updated_at: now,
  };

  db.createCommunityReply(reply);

  // Notify original post author if different user
  if (post.author_id !== user.id) {
    db.createNotification({
      id: `notif_${crypto.randomUUID()}`,
      user_id: post.author_id,
      type: 'community_reply',
      title: 'New Response on Your Academic Discussion',
      message: `${user.display_name} replied to "${post.title.substring(0, 45)}..."`,
      link: `/community/${post.id}`,
      is_read: false,
      created_at: now,
    });
  }

  res.status(201).json({ reply, message: 'Response published successfully.' });
});

// POST /api/community/posts/:id/upvote - Upvote post
communityRouter.post('/posts/:id/upvote', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const result = db.toggleUpvotePost(req.params.id, user.id);
  res.json(result);
});

// POST /api/community/replies/:id/upvote - Upvote reply
communityRouter.post('/replies/:id/upvote', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const result = db.toggleUpvoteReply(req.params.id, user.id);
  res.json(result);
});

// PUT /api/community/posts/:id/pin - Teacher/Admin pin post
communityRouter.put('/posts/:id/pin', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { is_pinned } = req.body;
  const success = db.pinCommunityPost(req.params.id, !!is_pinned);
  if (!success) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }
  res.json({ success: true, message: `Post ${is_pinned ? 'pinned' : 'unpinned'} successfully.` });
});

// PUT /api/community/replies/:id/verify - Teacher/Admin verify reply
communityRouter.put('/replies/:id/verify', authenticate, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response): void => {
  const { is_verified } = req.body;
  const success = db.verifyFacultyReply(req.params.id, !!is_verified);
  if (!success) {
    res.status(404).json({ error: 'Reply not found.' });
    return;
  }
  res.json({ success: true, message: 'Faculty verification updated.' });
});

// DELETE /api/community/posts/:id - Author, teacher, or admin delete
communityRouter.delete('/posts/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const post = db.getCommunityPostById(req.params.id);

  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  if (post.author_id !== user.id && user.role !== 'admin' && user.role !== 'teacher') {
    res.status(403).json({ error: 'Unauthorized to delete this post.' });
    return;
  }

  db.deleteCommunityPost(post.id);
  res.json({ success: true, message: 'Discussion removed.' });
});

// DELETE /api/community/replies/:id - Delete reply
communityRouter.delete('/replies/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const replies = db.getAllQuestions(); // dummy check
  const success = db.deleteCommunityReply(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Reply not found.' });
    return;
  }
  res.json({ success: true, message: 'Reply deleted.' });
});

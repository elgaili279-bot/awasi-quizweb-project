import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Plus,
  ThumbsUp,
  Pin,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Sparkles,
  Send,
  X,
  User,
  ShieldCheck,
  Tag,
  Clock,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Subject } from '../types';

interface CommunityPostItem {
  id: string;
  author_id: string;
  author_name: string;
  author_role: 'student' | 'teacher' | 'admin';
  medical_school_year?: string;
  title: string;
  body: string;
  subject_id?: string;
  subject_name?: string;
  category: 'clinical_question' | 'difficult_concept' | 'study_suggestion' | 'exam_clarification' | 'general_academic';
  tags: string[];
  question_id?: string;
  is_pinned: boolean;
  is_faculty_approved: boolean;
  upvotes: string[];
  has_upvoted: boolean;
  reply_count: number;
  view_count: number;
  created_at: string;
  replies?: CommunityReplyItem[];
}

interface CommunityReplyItem {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  medical_school_year?: string;
  body: string;
  is_faculty_verified: boolean;
  upvotes: string[];
  has_upvoted: boolean;
  created_at: string;
}

const CATEGORY_META = {
  clinical_question: { label: 'Clinical Question', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  difficult_concept: { label: 'Difficult Concept', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  study_suggestion: { label: 'Study Suggestion', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  exam_clarification: { label: 'Exam Clarification', badge: 'bg-red-50 text-red-700 border-red-200' },
  general_academic: { label: 'General Academic', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CommunityHub: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPostItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'replies'>('newest');

  // Modal / Creation State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newCategory, setNewCategory] = useState<keyof typeof CATEGORY_META>('clinical_question');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reply State
  const [replyBody, setReplyBody] = useState('');
  const [isReplying, setIsReplying] = useState<boolean>(false);

  const fetchSubjects = async () => {
    try {
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCommunityPosts({
        subject_id: selectedSubject !== 'all' ? selectedSubject : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        sort: sortBy,
      });
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedSubject, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleOpenPost = async (postId: string) => {
    try {
      const res = await api.getCommunityPostById(postId);
      setSelectedPost(res.post);
    } catch (err) {
      console.error('Failed to load post details:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    try {
      setIsSubmitting(true);
      const tagsArray = newTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await api.createCommunityPost({
        title: newTitle.trim(),
        body: newBody.trim(),
        subject_id: newSubjectId || undefined,
        category: newCategory,
        tags: tagsArray,
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewBody('');
      setNewSubjectId('');
      setNewTags('');
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to submit discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUpvotePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleUpvotePost(postId);
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              has_upvoted: res.upvoted,
              upvotes: res.upvoted ? [...p.upvotes, user?.id || ''] : p.upvotes.filter(id => id !== user?.id),
            };
          }
          return p;
        })
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => prev ? {
          ...prev,
          has_upvoted: res.upvoted,
          upvotes: res.upvoted ? [...prev.upvotes, user?.id || ''] : prev.upvotes.filter(id => id !== user?.id),
        } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating upvote');
    }
  };

  const handleToggleUpvoteReply = async (replyId: string) => {
    try {
      const res = await api.toggleUpvoteReply(replyId);
      if (selectedPost && selectedPost.replies) {
        setSelectedPost({
          ...selectedPost,
          replies: selectedPost.replies.map(r =>
            r.id === replyId
              ? {
                  ...r,
                  has_upvoted: res.upvoted,
                  upvotes: res.upvoted ? [...r.upvotes, user?.id || ''] : r.upvotes.filter(id => id !== user?.id),
                }
              : r
          ),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error upvoting reply');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyBody.trim()) return;

    try {
      setIsReplying(true);
      await api.createCommunityReply(selectedPost.id, replyBody.trim());
      setReplyBody('');
      // Reload current post to show the new reply
      handleOpenPost(selectedPost.id);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setIsReplying(false);
    }
  };

  const handleVerifyFaculty = async (replyId: string, currentStatus: boolean) => {
    try {
      await api.verifyFacultyReply(replyId, !currentStatus);
      if (selectedPost && selectedPost.replies) {
        setSelectedPost({
          ...selectedPost,
          replies: selectedPost.replies.map(r =>
            r.id === replyId ? { ...r, is_faculty_verified: !currentStatus } : r
          ),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to verify reply');
    }
  };

  const handlePinPost = async (postId: string, currentPin: boolean) => {
    try {
      await api.pinCommunityPost(postId, !currentPin);
      fetchPosts();
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, is_pinned: !currentPin } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update pin status');
    }
  };

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Community Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                Batch 99 Academic Forum
              </span>
              <span className="text-xs text-blue-200">Interactive Medical Community</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Academic Questions & Collaboration
            </h1>
            <p className="text-xs md:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Ask clinical questions, discuss difficult concepts, clarify exam nuances, and exchange high-yield study insights in a verified academic setting.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs md:text-sm transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Start Discussion
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions by keyword, concept, or disease..."
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Subject Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              aria-label="Filter discussions by subject"
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              aria-label="Sort discussions"
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="replies">Most Active</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Topics
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No discussions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Be the first to start an academic discussion, ask a medical question, or share study guidance for Batch 99.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            Post First Question
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const catMeta = CATEGORY_META[post.category] || CATEGORY_META.general_academic;

            return (
              <div
                key={post.id}
                onClick={() => handleOpenPost(post.id)}
                className={`bg-white rounded-2xl border transition-all duration-200 p-5 cursor-pointer shadow-xs hover:shadow-md ${
                  post.is_pinned
                    ? 'border-amber-300/80 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${catMeta.badge}`}>
                        {catMeta.label}
                      </span>
                      {post.subject_name && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {post.subject_name}
                        </span>
                      )}
                      {post.is_pinned && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          <Pin className="w-3 h-3 fill-amber-600" /> Pinned
                        </span>
                      )}
                      {post.is_faculty_approved && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Faculty Endorsed
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1.5 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {post.body}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" /> {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      <span className="text-slate-600 font-medium">
                        By {post.author_name}
                        {post.author_role === 'teacher' && (
                          <span className="ml-1 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            Faculty
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {post.reply_count} responses
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {post.view_count} views
                      </span>
                    </div>
                  </div>

                  {/* Upvote Button */}
                  <button
                    onClick={(e) => handleToggleUpvotePost(post.id, e)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-colors ${
                      post.has_upvoted
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 mb-0.5 ${post.has_upvoted ? 'fill-blue-600' : ''}`} />
                    <span className="text-xs font-bold">{post.upvotes.length}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discussion Detail & Replies Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${CATEGORY_META[selectedPost.category]?.badge || ''}`}>
                  {CATEGORY_META[selectedPost.category]?.label || 'Academic Discussion'}
                </span>
                {selectedPost.subject_name && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                    {selectedPost.subject_name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isTeacherOrAdmin && (
                  <button
                    onClick={() => handlePinPost(selectedPost.id, selectedPost.is_pinned)}
                    className={`p-1.5 rounded-lg text-xs font-medium border ${
                      selectedPost.is_pinned
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              {/* Question / Post Info */}
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2 leading-tight">
                  {selectedPost.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{selectedPost.author_name}</span>
                  <span>•</span>
                  <span>{selectedPost.medical_school_year}</span>
                  <span>•</span>
                  <span>{new Date(selectedPost.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {selectedPost.body}
                </div>
              </div>

              {/* Replies Section */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Responses ({selectedPost.replies?.length || 0})</span>
                  <span className="text-[11px] text-slate-400 font-normal">All replies are peer & faculty reviewed</span>
                </h3>

                {selectedPost.replies && selectedPost.replies.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPost.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-xl border transition-all ${
                          reply.is_faculty_verified
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {reply.author_name}
                            </span>
                            {reply.author_role === 'teacher' && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                Faculty
                              </span>
                            )}
                            {reply.is_faculty_verified && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified Answer
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isTeacherOrAdmin && (
                              <button
                                onClick={() => handleVerifyFaculty(reply.id, reply.is_faculty_verified)}
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                                  reply.is_faculty_verified
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {reply.is_faculty_verified ? 'Unverify' : 'Verify'}
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleUpvoteReply(reply.id)}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                                reply.has_upvoted
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${reply.has_upvoted ? 'fill-blue-600' : ''}`} />
                              <span>{reply.upvotes.length}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No replies yet. Share your understanding or answer below.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Reply Form) */}
            <form onSubmit={handleSendReply} className="p-3 md:p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <input
                type="text"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write an academic reply or clinical clarification..."
                className="flex-1 px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isReplying || !replyBody.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Ask Batch 99 Academic Forum
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Post questions about medical concepts, difficult exam items, or revision strategies.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question / Discussion Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Differentiating Carhart Notch from high-frequency SNHL on audiometry"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">General Academic</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discussion Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="clinical_question">Clinical Question</option>
                    <option value="difficult_concept">Difficult Concept</option>
                    <option value="study_suggestion">Study Suggestion</option>
                    <option value="exam_clarification">Exam Clarification</option>
                    <option value="general_academic">General Academic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Explanation / Query
                </label>
                <textarea
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Describe your reasoning, clinical context, or specific area of confusion..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g., ENT, Audiometry, Otosclerosis"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

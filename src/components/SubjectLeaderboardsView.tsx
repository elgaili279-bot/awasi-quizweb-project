import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  ShieldCheck,
  Lock,
  User,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SubjectLeaderboardSummary {
  subject_id: string;
  subject_name: string;
  icon: string;
  top_5: Array<{
    rank: number;
    user_id: string;
    display_name: string;
    medical_school_year: string;
    quizzes_completed: number;
    total_points: number;
  }>;
  total_participants: number;
  user_private_ranking: { rank: number; total_points: number } | null;
}

export const SubjectLeaderboardsView: React.FC = () => {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<SubjectLeaderboardSummary[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<any[]>([]);
  const [userPrivateRank, setUserPrivateRank] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'subjects' | 'overall'>('subjects');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [subRes, overallRes] = await Promise.all([
          api.getSubjectLeaderboardsSummary(),
          api.getLeaderboard(),
        ]);
        setSummaries(subRes.subject_leaderboards || []);
        setOverallLeaderboard(overallRes.top_5 || []);
        setUserPrivateRank(overallRes.user_private_ranking || null);
      } catch (err) {
        console.error('Failed to load leaderboards:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-base" title="1st Place">🥇</span>;
      case 2:
        return <span className="text-base" title="2nd Place">🥈</span>;
      case 3:
        return <span className="text-base" title="3rd Place">🥉</span>;
      default:
        return (
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-2xl p-6 text-slate-950 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-950 text-amber-300 uppercase tracking-wider">
                Batch 99 Academic Rankings
              </span>
              <span className="text-xs text-slate-900 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> First-Attempt Rule Enforced
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
              Subject Honor Boards & Rankings
            </h1>
            <p className="text-xs md:text-sm text-slate-900/90 mt-1 max-w-2xl leading-relaxed font-medium">
              Only your first attempt on any assessment counts toward the official ranking. Subsequent attempts are strictly for active learning. Privacy-first: Top 5 displayed publicly.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-white/60 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Privacy Safeguard</div>
              <div className="text-[11px] text-slate-700">Top 5 Only & Private Personal Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Authenticated Student's Personal Private Rank Card */}
      {user && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Your Private Standing
                </span>
                <span className="text-xs text-slate-400">Encrypted to you</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {user.display_name}
              </h3>
              <p className="text-xs text-slate-500">
                Rankings calculated from verified 1st attempts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-center px-2">
              <div className="text-xl font-black text-blue-600">
                {userPrivateRank ? `#${userPrivateRank.rank}` : 'Unranked'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Batch Rank</div>
            </div>
            <div className="h-7 w-px bg-slate-200"></div>
            <div className="text-center px-2">
              <div className="text-xl font-black text-slate-900">
                {userPrivateRank ? userPrivateRank.total_points : 0}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Rank Points</div>
            </div>
            <div className="h-7 w-px bg-slate-200"></div>
            <div className="text-center px-2">
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                {userPrivateRank?.clinical_rank || 'Medical Scholar'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tier</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'subjects'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Subject Leaderboards (Top 5)
          </button>
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'overall'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overall Batch Honor Board
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Batch 99 Official System
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-8 bg-slate-100 rounded"></div>
                <div className="h-8 bg-slate-100 rounded"></div>
                <div className="h-8 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'subjects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((sub) => (
            <div
              key={sub.subject_id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sub.icon || '📚'}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {sub.subject_name}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {sub.total_participants} participating students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top 5 List */}
                <div className="space-y-1.5 mb-4">
                  {sub.top_5.length > 0 ? (
                    sub.top_5.map((student) => {
                      const isCurrentUser = user && user.id === student.user_id;
                      return (
                        <div
                          key={student.user_id}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                            isCurrentUser
                              ? 'bg-blue-50 border border-blue-200 font-bold text-blue-950'
                              : 'bg-slate-50/70 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getRankBadge(student.rank)}
                            <span className="truncate max-w-[140px] font-semibold">
                              {student.display_name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-amber-700">
                            {student.total_points} pts
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No attempts recorded yet for this subject.
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Footer (Private Rank in Subject) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Your Rank:</span>
                <span className="font-bold text-slate-800">
                  {sub.user_private_ranking
                    ? `#${sub.user_private_ranking.rank} (${sub.user_private_ranking.total_points} pts)`
                    : 'Not attempted yet'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Overall Batch Top 5 */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Crown className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Batch 99 Overall Honor Roll (Top 5)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accumulated first-attempt scores across all curriculum medical disciplines
            </p>
          </div>

          <div className="space-y-2">
            {overallLeaderboard.map((student) => {
              const isCurrentUser = user && user.id === student.user_id;
              return (
                <div
                  key={student.user_id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50 border-blue-300 font-bold text-blue-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 flex justify-center">
                      {getRankBadge(student.rank)}
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-bold flex items-center gap-2">
                        {student.display_name}
                        {isCurrentUser && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {student.clinical_rank || 'Medical Scholar'} • {student.quizzes_completed} first attempts
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-700">
                      {student.total_points} pts
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {student.accuracy}% accuracy
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center leading-relaxed">
            <Lock className="w-3.5 h-3.5 inline-block text-slate-400 mr-1" />
            To respect student privacy and foster a positive learning climate, rankings below Top 5 are not published to peers. Check your private score card above for personal tracking.
          </div>
        </div>
      )}
    </div>
  );
};

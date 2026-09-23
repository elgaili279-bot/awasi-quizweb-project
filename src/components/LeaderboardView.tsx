import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Flame,
  Stethoscope,
  Filter,
  CheckCircle2,
  Users,
  Target,
  Sparkles
} from 'lucide-react';
import { LeaderboardEntry, Subject } from '../types';
import { api } from '../services/api';

export const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lbRes, subRes] = await Promise.all([
        api.getLeaderboard(selectedSubject !== 'all' ? selectedSubject : undefined),
        api.getSubjects(),
      ]);
      setLeaderboard(lbRes.leaderboard);
      setSubjects(subRes.subjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load medical leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedSubject]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-400/30">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-md">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-md">
          3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center">
        {rank}
      </div>
    );
  };

  const getClinicalTitleBadge = (title: string) => {
    switch (title) {
      case 'Chief Resident':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">Chief Resident</span>;
      case 'Senior Resident':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-amber-300 border border-amber-300">Senior Resident</span>;
      case 'Junior Resident':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">Junior Resident</span>;
      case 'Medical Intern':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">Medical Intern</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Medical Scholar</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
            Active Recall & Exam Mastery
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Clinical Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Peer rankings based on clinical accuracy, board examination difficulty, and verified mastery points.
          </p>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs self-start md:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Discipline:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Specialties</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-6 text-white shadow-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          Evidence-Based Point Formula
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Mastery points are awarded from real scored attempts. Points scale with board difficulty multipliers (USMLE Step 2: 1.5x, Step 1: 1.4x) plus clinical precision bonuses for ≥90% accuracy.
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Calculating Peer Rankings...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Quiz Records Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first medical student to complete an assessment and claim the top of the leaderboard!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Medical Scholar</th>
                  <th className="py-4 px-6">Clinical Standing</th>
                  <th className="py-4 px-6 text-center">Quizzes</th>
                  <th className="py-4 px-6 text-center">Accuracy</th>
                  <th className="py-4 px-6 text-right">Mastery Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getRankBadge(entry.rank)}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {entry.display_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.medical_school_year}
                          {entry.university ? ` • ${entry.university}` : ''}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {getClinicalTitleBadge(entry.clinical_rank)}
                    </td>

                    <td className="py-4 px-6 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {entry.quizzes_completed}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="font-extrabold text-blue-600 dark:text-amber-400">
                        {entry.accuracy}%
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 font-extrabold text-base text-slate-900 dark:text-white">
                        <Flame className="w-4 h-4 text-amber-500" />
                        {entry.total_points.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

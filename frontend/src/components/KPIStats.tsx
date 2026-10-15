'use client';

import { RefreshCw, CheckCircle2, ShieldCheck, Bug, Layers, FileCode2, AlertTriangle, Sparkles } from 'lucide-react';

type KPIStatsProps = {
  syncing: boolean;
  processing: boolean;
  loading?: boolean;
  totalTickets: number;
  processedCount: number;
  avgQuality: number;
  qualityPercent: number;
  epicCount: number;
  storyCount: number;
  bugCount: number;
  criticalBugCount: number;
};

export default function KPIStats({
  syncing,
  processing,
  loading = false,
  totalTickets,
  processedCount,
  avgQuality,
  qualityPercent,
  epicCount,
  storyCount,
  bugCount,
  criticalBugCount,
}: KPIStatsProps) {
  const coveragePercent = totalTickets > 0 ? Math.round((processedCount / totalTickets) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {/* ── Card 1: Total Tickets ── */}
      <div className="relative rounded-2xl overflow-hidden p-[1px] group">
        {syncing || loading ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[conic-gradient(from_0deg,transparent_0_280deg,#6366f1_360deg)] animate-[spin_2s_linear_infinite] z-0" />
        ) : (
          <div className="absolute inset-0 bg-white/5 opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
        <div
          className="relative z-10 h-full p-5 rounded-2xl flex flex-col justify-between"
          style={{
            background: 'rgba(15, 15, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </div>
          </div>
          <div className="my-3">
            {loading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{totalTickets}</span>
                <span className="text-xs text-slate-400">synced</span>
              </div>
            )}
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ── Card 2: AI Processed ── */}
      <div className="relative rounded-2xl overflow-hidden p-[1px] group">
        {processing || loading ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[conic-gradient(from_0deg,transparent_0_280deg,#10b981_360deg)] animate-[spin_2s_linear_infinite] z-0" />
        ) : (
          <div className="absolute inset-0 bg-white/5 opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
        <div
          className="relative z-10 h-full p-5 rounded-2xl flex flex-col justify-between"
          style={{
            background: 'rgba(15, 15, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="my-3">
            {loading ? (
              <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{processedCount}</span>
                <span className="text-xs font-semibold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {coveragePercent}% done
                </span>
              </div>
            )}
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.min(100, coveragePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Card 3: Avg Ticket Quality ── */}
      <div
        className="glass p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Quality Score</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          {loading ? (
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black ${
                  avgQuality >= 75 ? 'text-emerald-400' :
                  avgQuality >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {avgQuality}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded ml-auto border border-purple-500/20">
                {qualityPercent}% Good+
              </span>
            </div>
          )}
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              avgQuality >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
              avgQuality >= 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              'bg-gradient-to-r from-rose-500 to-red-400'
            }`}
            style={{ width: `${Math.min(100, avgQuality)}%` }}
          />
        </div>
      </div>

      {/* ── Card 4: Issue Breakdown ── */}
      <div
        className="glass p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Issue Breakdown</span>
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Bug className="w-4 h-4" />
          </div>
        </div>
        <div className="my-2.5">
          {loading ? (
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-1.5 bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-[10px] text-purple-300 font-bold block uppercase">Epics</span>
                <span className="text-sm font-black text-white">{epicCount}</span>
              </div>
              <div className="rounded-lg p-1.5 bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[10px] text-blue-300 font-bold block uppercase">Stories</span>
                <span className="text-sm font-black text-white">{storyCount}</span>
              </div>
              <div className="rounded-lg p-1.5 bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-300 font-bold block uppercase">Bugs</span>
                <span className="text-sm font-black text-white">{bugCount}</span>
              </div>
            </div>
          )}
        </div>
        {!loading && criticalBugCount > 0 ? (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{criticalBugCount} P0/P1 Critical Defect{criticalBugCount > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            All tickets categorized &amp; tracked
          </div>
        )}
      </div>
    </div>
  );
}

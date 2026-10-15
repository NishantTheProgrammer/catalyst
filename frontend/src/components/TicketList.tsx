'use client';

import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  X,
  Bug,
  Layers,
  FileWarning,
  AlertTriangle,
  Bot,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket } from '@/types';

type TicketListProps = {
  tickets: Ticket[];
  loading: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  selectedQuality: string | null;
  setSelectedQuality: (q: string | null) => void;
  processing: boolean;
};

export default function TicketList({
  tickets,
  loading,
  selectedCategory,
  setSelectedCategory,
  selectedQuality,
  setSelectedQuality,
  processing,
}: TicketListProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Code':
        return <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'Data':
        return <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'Configuration':
        return <FileWarning className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'Requirement':
        return <FileWarning className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const displayedTickets = useMemo(() => {
    return tickets.filter((t) => {
      let match = true;
      if (selectedCategory) {
        match = match && !!t.is_processed && !!t.analysis && t.analysis.category === selectedCategory;
      }
      if (selectedQuality) {
        match = match && !!t.is_processed && !!t.quality && t.quality.quality_level === selectedQuality;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.jira_id.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        match = match && (matchesId || matchesTitle || matchesDesc);
      }
      return match;
    });
  }, [tickets, selectedCategory, selectedQuality, searchQuery]);

  return (
    <div
      className="glass rounded-2xl overflow-hidden animate-fade-in"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}
    >
      {/* ── Table Top Bar: Filters & Search ── */}
      <div className="p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Tickets Registry</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
              {displayedTickets.length} of {tickets.length}
            </span>
          </div>

          {selectedCategory && (
            <span
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 cursor-pointer hover:bg-purple-500/25 transition-colors"
            >
              <span>Category: {selectedCategory}</span>
              <X className="w-3 h-3 ml-0.5" />
            </span>
          )}

          {selectedQuality && (
            <span
              onClick={() => setSelectedQuality(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/25 transition-colors"
            >
              <span>Quality: {selectedQuality}</span>
              <X className="w-3 h-3 ml-0.5" />
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, title or keyword..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table View ── */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading Jira tickets registry...</p>
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-sm font-semibold text-slate-300 mb-1">
              {tickets.length > 0 ? 'No tickets match your filters' : 'No Jira tickets synced yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {tickets.length > 0
                ? 'Try resetting the active category or quality filters above.'
                : 'Click "Sync Jira" in the header to ingest tickets from your configured project.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                <th className="py-3.5 px-5 whitespace-nowrap">Ticket</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Project</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Type</th>
                <th className="py-3.5 px-5 font-semibold">Title</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Sprint</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Category</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Quality</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {displayedTickets.map((ticket) => {
                const isExpanded = expandedTicketId === ticket.id;
                const project = ticket.jira_id.includes('-') ? ticket.jira_id.split('-')[0] : 'JIRA';

                return (
                  <React.Fragment key={ticket.id}>
                    <tr
                      className={`border-b border-white/5 transition-colors cursor-pointer hover:bg-white/[0.04] ${
                        isExpanded ? 'bg-white/[0.03]' : ''
                      }`}
                      onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                    >
                      {/* Ticket Key */}
                      <td className="py-3.5 px-5">
                        <a
                          href={ticket.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 transition-colors whitespace-nowrap"
                        >
                          <span>{ticket.jira_id}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          {project}
                        </span>
                      </td>

                      {/* Issue Type */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                            ticket.issue_type === 'Epic'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/25'
                              : ticket.issue_type === 'Bug'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/25'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                          }`}
                        >
                          {ticket.issue_type || 'Story'}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-5 max-w-md">
                        <span className="text-slate-200 line-clamp-1 font-medium" title={ticket.title}>
                          {ticket.title}
                        </span>
                      </td>

                      {/* Sprint */}
                      <td className="py-3.5 px-5">
                        {ticket.sprint && ticket.sprint !== 'Unassigned' ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 whitespace-nowrap">
                            {ticket.sprint}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* Defect Category */}
                      <td className="py-3.5 px-5">
                        {ticket.is_processed && ticket.analysis ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            {getCategoryIcon(ticket.analysis.category)}
                            <span className="text-xs font-medium text-slate-300">
                              {ticket.analysis.category}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                            {processing && <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />}
                            <span>{processing ? 'Analyzing...' : 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* Quality Score */}
                      <td className="py-3.5 px-5">
                        {ticket.is_processed && ticket.quality ? (
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                              ticket.quality.quality_score >= 75
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                                : ticket.quality.quality_score >= 60
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/25'
                            }`}
                          >
                            {ticket.quality.quality_score} pts
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* Chevron Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Expand ticket details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* ── Expandable Details Card ── */}
                    {isExpanded && (
                      <tr className="bg-black/30 border-b border-white/5">
                        <td colSpan={8} className="p-0">
                          <div className="p-5 sm:p-7 space-y-6">
                            {/* Description Box */}
                            <div className="rounded-xl p-4 sm:p-5 bg-white/[0.02] border border-white/10">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Jira Description
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                                {ticket.description || 'No description provided in Jira.'}
                              </p>
                            </div>

                            {/* AI Evaluation Breakdown */}
                            {ticket.is_processed && ticket.analysis && ticket.quality ? (
                              <div className="space-y-6">
                                {/* 3 Stat Badges */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                      Quality Tier
                                    </span>
                                    <span className="font-bold text-sm text-white">
                                      {ticket.quality.quality_level}
                                    </span>
                                  </div>

                                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                      Sprint Readiness
                                    </span>
                                    <span className="font-bold text-sm text-white">
                                      {ticket.quality.implementation_readiness}
                                    </span>
                                  </div>

                                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                      AI Agent Ready
                                    </span>
                                    <div className="flex items-center gap-1.5 font-bold text-sm">
                                      {ticket.quality.ai_agent_ready ? (
                                        <>
                                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                          <span className="text-emerald-300">Ready for Autonomous Dev</span>
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="w-4 h-4 text-rose-400" />
                                          <span className="text-rose-300">Requires Human Context</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Reason & Confidence */}
                                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/15">
                                    <div className="flex items-center gap-2">
                                      <Bot className="w-4 h-4 text-indigo-400" />
                                      <h4 className="font-bold text-xs text-indigo-300">AI Classification Rationale</h4>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                      {ticket.analysis.confidence}% CONFIDENCE
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 italic leading-relaxed">
                                    "{ticket.analysis.reason}"
                                  </p>
                                </div>

                                {/* 5-Pillar Score Cards */}
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <span>5-Pillar Readiness Scores</span>
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(ticket.quality.criteria_scores).map(([key, data]) => (
                                      <div
                                        key={key}
                                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="capitalize font-bold text-xs text-slate-200">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                          </span>
                                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                                            {data.score}/{data.maxScore}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-snug">{data.reason}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Actionable Feedback: Gaps & Recommendations */}
                                {(ticket.quality.gaps.length > 0 || ticket.quality.recommendations.length > 0) && (
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                                      Actionable Recommendations
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {ticket.quality.gaps.map((gap, i) => (
                                        <div
                                          key={`gap-${i}`}
                                          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5"
                                        >
                                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-bold text-xs text-amber-300 mb-0.5">Identified Gap</p>
                                            <p className="text-xs text-slate-300 leading-relaxed">{gap.issue}</p>
                                          </div>
                                        </div>
                                      ))}
                                      {ticket.quality.recommendations.map((rec, i) => (
                                        <div
                                          key={`rec-${i}`}
                                          className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5"
                                        >
                                          <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-bold text-xs text-indigo-300 mb-0.5">Recommendation</p>
                                            <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Bug Analysis (if bug) */}
                                {ticket.bug_analysis && (
                                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                                      <Bug className="w-4 h-4 text-rose-400" />
                                      <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                                        Defect Diagnostics &amp; Impact
                                      </h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                                          Severity
                                        </span>
                                        <span
                                          className={`font-bold ${
                                            ticket.bug_analysis.severity.startsWith('P0')
                                              ? 'text-red-400'
                                              : ticket.bug_analysis.severity.startsWith('P1')
                                              ? 'text-orange-400'
                                              : 'text-yellow-400'
                                          }`}
                                        >
                                          {ticket.bug_analysis.severity}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                                          Root Cause
                                        </span>
                                        <span className="font-bold text-white">
                                          {ticket.bug_analysis.root_cause_type}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                                          Reproducible
                                        </span>
                                        <span
                                          className={`font-bold ${
                                            ticket.bug_analysis.is_reproducible ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {ticket.bug_analysis.is_reproducible ? 'Confirmed' : 'Unconfirmed'}
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 col-span-2 sm:col-span-1">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                                          Impact
                                        </span>
                                        <span className="text-slate-300 line-clamp-2">
                                          {ticket.bug_analysis.impact_summary}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              !processing && (
                                <div className="text-center py-6 text-xs text-slate-500 italic bg-white/[0.01] rounded-xl border border-white/5">
                                  This ticket has not been evaluated by AI yet. Click "Run AI Analysis" to trigger evaluation.
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

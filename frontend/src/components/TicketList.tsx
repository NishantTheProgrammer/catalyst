import React, { useState } from "react";
import { RefreshCw, X, Bug, Layers, FileWarning, AlertTriangle, Bot, ChevronUp, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Ticket } from "@/types";

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
  processing
}: TicketListProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Code": return <Bug className="w-4 h-4 text-rose-400" />;
      case "Data": return <Layers className="w-4 h-4 text-blue-400" />;
      case "Configuration": return <FileWarning className="w-4 h-4 text-amber-400" />;
      case "Requirement": return <FileWarning className="w-4 h-4 text-amber-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden mt-4 animate-fade-in animate-delay-3">
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-black/20">
        <h2 className="text-xl font-semibold flex items-center flex-wrap gap-2">
          Recent Defect Activity 
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 text-primary text-sm px-2.5 py-1 bg-primary/10 hover:bg-primary/20 transition-colors rounded-full cursor-pointer" onClick={() => setSelectedCategory(null)}>
              <span>Category: {selectedCategory}</span>
              <X className="w-3 h-3 ml-1" />
            </span>
          )}
          {selectedQuality && (
            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors rounded-full cursor-pointer" onClick={() => setSelectedQuality(null)}>
              <span>Quality: {selectedQuality}</span>
              <X className="w-3 h-3 ml-1" />
            </span>
          )}
        </h2>
      </div>
      
      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin opacity-50" />
          </div>
        ) : (() => {
          const displayedTickets = tickets.filter(t => {
            let match = true;
            if (selectedCategory) {
              match = match && !!t.is_processed && !!t.analysis && t.analysis.category === selectedCategory;
            }
            if (selectedQuality) {
              match = match && !!t.is_processed && !!t.quality && t.quality.quality_level === selectedQuality;
            }
            return match;
          });

          if (displayedTickets.length === 0) {
            return (
              <div className="text-center py-12 text-muted-foreground">
                {tickets.length > 0 ? `No tickets found for selected filters.` : 'No tickets found. Click "Sync Jira" to fetch data.'}
              </div>
            );
          }

          return (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm text-muted-foreground bg-white/[0.01]">
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Ticket</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Project</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Type</th>
                  <th className="py-4 px-6 font-medium">Title</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Sprint</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Category</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Quality</th>
                  <th className="py-4 px-6 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {displayedTickets.map((ticket) => {
                  const isExpanded = expandedTicketId === ticket.id;
                  const project = ticket.jira_id.includes('-') ? ticket.jira_id.split('-')[0] : 'Unknown';

                  return (
                    <React.Fragment key={ticket.id}>
                      <tr className={`border-b border-white/5 transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}>
                        <td className="py-4 px-6">
                          <a 
                            href={ticket.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-mono px-2 py-1 bg-primary/20 hover:bg-primary/40 text-primary-foreground rounded transition-colors inline-block whitespace-nowrap"
                          >
                            {ticket.jira_id}
                          </a>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-300">{project}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                            ticket.issue_type === 'Epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            ticket.issue_type === 'Bug'  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                                           'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {ticket.issue_type || 'Story'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm line-clamp-2" title={ticket.title}>{ticket.title}</span>
                        </td>
                        <td className="py-4 px-6">
                          {ticket.sprint && ticket.sprint !== "Unassigned" ? (
                            <span className="text-xs font-mono px-2 py-1 bg-blue-500/20 text-blue-400 rounded whitespace-nowrap">
                              {ticket.sprint}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {ticket.is_processed && ticket.analysis ? (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {getCategoryIcon(ticket.analysis.category)}
                              <span className="text-sm font-medium">{ticket.analysis.category}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                              {processing ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                              {processing ? "Processing..." : "Pending"}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {ticket.is_processed && ticket.quality ? (
                            <span className={`text-xs font-mono px-2.5 py-1 rounded whitespace-nowrap ${
                              ticket.quality.quality_score >= 75 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              ticket.quality.quality_score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {ticket.quality.quality_score} QUAL
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <tr className="bg-black/30 border-b border-white/5 shadow-inner">
                          <td colSpan={8} className="p-0">
                            <div className="p-6 md:p-8 animate-fade-in flex flex-col gap-6">
                              {/* Description Section */}
                              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                  Description
                                </h4>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {ticket.description}
                                </p>
                              </div>

                              {/* AI Analysis Details */}
                              {ticket.is_processed && ticket.analysis && ticket.quality ? (
                                <div className="flex flex-col gap-6">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Classification</span>
                                      <span className="font-medium text-white">{ticket.quality.quality_level}</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Readiness</span>
                                      <span className="font-medium text-white">{ticket.quality.implementation_readiness}</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground uppercase tracking-wider">AI Agent Ready</span>
                                      <span className="font-medium text-white flex items-center gap-2">
                                        {ticket.quality.ai_agent_ready ? (
                                          <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Yes</>
                                        ) : (
                                          <><AlertCircle className="w-4 h-4 text-rose-400" /> No</>
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                                      <h4 className="font-medium text-white">Analysis Reason</h4>
                                      <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
                                        {ticket.analysis.confidence}% CONFIDENCE
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-300 italic">
                                      "{ticket.analysis.reason}"
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium text-white border-b border-white/10 pb-2 mb-3">Scoring Breakdown</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {Object.entries(ticket.quality.criteria_scores).map(([key, data]) => (
                                        <div key={key} className="flex flex-col bg-black/20 p-4 rounded-lg border border-white/5">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="capitalize font-medium text-sm text-gray-200">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="font-mono text-xs text-white bg-white/10 px-2 py-0.5 rounded">{data.score}/{data.maxScore}</span>
                                          </div>
                                          <span className="text-xs text-muted-foreground leading-relaxed">{data.reason}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {(ticket.quality.gaps.length > 0 || ticket.quality.recommendations.length > 0) && (
                                    <div className="mt-2">
                                      <h4 className="font-medium text-amber-400 border-b border-amber-500/20 pb-2 mb-3">Actionable Feedback</h4>
                                      <div className="flex flex-col gap-3">
                                        {ticket.quality.gaps.map((gap, i) => (
                                          <div key={`gap-${i}`} className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex flex-col gap-2">
                                            <div className="flex items-start gap-3">
                                              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                              <div>
                                                <span className="font-medium text-amber-200 text-sm block mb-1">Identified Gap</span>
                                                <span className="text-amber-100/70 text-sm">{gap.issue}</span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        {ticket.quality.recommendations.map((rec, i) => (
                                          <div key={`rec-${i}`} className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex flex-col gap-2">
                                            <div className="flex items-start gap-3">
                                              <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                              <div>
                                                <span className="font-medium text-blue-200 text-sm block mb-1">Recommendation</span>
                                                <span className="text-blue-100/70 text-sm">{rec}</span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {ticket.bug_analysis && (
                                    <div className="bg-rose-500/5 rounded-xl p-5 border border-rose-500/20">
                                      <h4 className="font-medium text-rose-400 border-b border-rose-500/20 pb-2 mb-4 flex items-center gap-2">
                                        <Bug className="w-4 h-4" /> Bug Analysis
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Severity</span>
                                          <span className={`text-sm font-semibold ${
                                            ticket.bug_analysis.severity.startsWith('P0') ? 'text-red-400' :
                                            ticket.bug_analysis.severity.startsWith('P1') ? 'text-orange-400' :
                                            ticket.bug_analysis.severity.startsWith('P2') ? 'text-yellow-400' : 'text-green-400'
                                          }`}>{ticket.bug_analysis.severity}</span>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Root Cause</span>
                                          <span className="text-sm font-medium text-white">{ticket.bug_analysis.root_cause_type}</span>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Reproducible</span>
                                          <span className={`text-sm font-semibold ${ticket.bug_analysis.is_reproducible ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {ticket.bug_analysis.is_reproducible ? 'Yes' : 'No'}
                                          </span>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-1 col-span-2 md:col-span-1">
                                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Impact</span>
                                          <span className="text-xs text-gray-300 leading-relaxed">{ticket.bug_analysis.impact_summary}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                !processing && (
                                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10 text-muted-foreground">
                                    This ticket has not been analyzed yet.
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
          );
        })()}
      </div>
    </div>
  );
}

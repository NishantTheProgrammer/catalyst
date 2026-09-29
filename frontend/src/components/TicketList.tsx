import { useState } from "react";
import { RefreshCw, X, Bug, Layers, FileWarning, AlertTriangle, Bot, ChevronUp, ChevronDown } from "lucide-react";
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
      
      <div className="p-6 flex flex-col gap-4">
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

          return displayedTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {tickets.length > 0 ? `No tickets found for selected filters.` : 'No tickets found. Click "Sync Jira" to fetch data.'}
            </div>
          ) : (
            displayedTickets.map((ticket) => (
              <div key={ticket.id} className="flex flex-col gap-2">
                <div className="glass-card p-5 rounded-xl flex flex-col md:flex-row gap-6 transition-all hover:bg-white/[0.03]">
                  
                  {/* Ticket Details */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <a 
                        href={ticket.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-mono px-2 py-1 bg-primary/20 hover:bg-primary/40 text-primary-foreground rounded transition-colors cursor-pointer"
                      >
                        {ticket.jira_id}
                      </a>
                      <h3 className="font-medium text-lg leading-tight">{ticket.title}</h3>
                      {ticket.sprint && (
                        <span className="text-xs font-mono px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {ticket.sprint}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                      {ticket.description}
                    </p>
                  </div>
                  
                  {/* AI Analysis Result */}
                  <div className="w-full md:w-[450px] shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                    {ticket.is_processed && ticket.analysis ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(ticket.analysis.category)}
                            <span className="font-medium text-sm">{ticket.analysis.category}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded flex items-center justify-center">
                              {ticket.analysis.confidence}% CONF
                            </span>
                            {ticket.quality && (
                              <button 
                                onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                className={`text-xs font-mono px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                                  ticket.quality.quality_score >= 75 ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' :
                                  ticket.quality.quality_score >= 60 ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                }`}
                              >
                                {ticket.quality.quality_score}/100 QUAL
                                {expandedTicketId === ticket.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{ticket.analysis.reason}"
                        </p>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-sm text-gray-500 gap-2">
                        {processing ? (
                          <>
                             <Bot className="w-5 h-5 text-primary animate-pulse" />
                             <span className="animate-pulse text-primary/80">AI Analyzing...</span>
                          </>
                        ) : (
                          "Unprocessed - Awaiting AI Analysis"
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expanded Quality Details */}
                {expandedTicketId === ticket.id && ticket.quality && (
                  <div className="p-5 bg-black/40 rounded-xl border border-white/5 animate-fade-in text-sm text-gray-300 flex flex-col gap-6 ml-4 mr-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Classification</span>
                        <span className="font-medium text-white">{ticket.quality.quality_level}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Readiness</span>
                        <span className="font-medium text-white">{ticket.quality.implementation_readiness}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">AI Agent Ready</span>
                        <span className="font-medium text-white">{ticket.quality.ai_agent_ready ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white border-b border-white/10 pb-2 mb-3">Scoring Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(ticket.quality.criteria_scores).map(([key, data]) => (
                          <div key={key} className="flex flex-col bg-white/5 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-mono text-xs text-white">{data.score}/{data.maxScore}</span>
                            </div>
                            <span className="text-xs text-muted-foreground leading-relaxed">{data.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {(ticket.quality.gaps.length > 0 || ticket.quality.recommendations.length > 0) && (
                      <div>
                        <h4 className="font-medium text-amber-400 border-b border-amber-500/20 pb-2 mb-3">AI Actionable Feedback</h4>
                        <div className="flex flex-col gap-3">
                          {ticket.quality.gaps.map((gap, i) => (
                            <div key={`gap-${i}`} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <span className="font-medium text-amber-200">Missing/Unclear: {gap.issue}</span>
                              </div>
                            </div>
                          ))}
                          {ticket.quality.recommendations.map((rec, i) => (
                            <div key={`rec-${i}`} className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-blue-400" />
                                <span className="font-medium text-blue-200">Recommendation: {rec}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )})()}
      </div>
    </div>
  );
}

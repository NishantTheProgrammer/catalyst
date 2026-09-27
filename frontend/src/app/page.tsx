"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Bot, Bug, FileWarning, Layers, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

type AnalysisResult = {
  id: number;
  category: string;
  confidence: number;
  reason: string;
};

type CriteriaScore = { score: number; maxScore: number; reason: string };
type TicketQuality = {
  quality_score: number;
  quality_level: string;
  implementation_readiness: string;
  criteria_scores: Record<string, CriteriaScore>;
  gaps: { issue: string; why: string; suggestion: string; priority: string }[];
  recommendations: string[];
  ai_agent_ready: boolean;
};

type Ticket = {
  id: number;
  jira_id: string;
  title: string;
  description: string;
  status: string;
  created_date: string;
  link: string;
  is_processed: boolean;
  analysis: AnalysisResult | null;
  quality: TicketQuality | null;
};

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [maxResults, setMaxResults] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [summary, setSummary] = useState({ overall_status: "Unknown", summary_text: "Based on current defect trend" });

  const fetchTickets = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/summary");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchSummary();
  }, []);

  // Poll for tickets while AI is processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (processing) {
      interval = setInterval(() => {
        fetchTickets();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processing]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`http://localhost:8000/api/sync?max_results=${maxResults}`, { method: "POST" });
      await fetchTickets();
    } catch (err) {
      console.error("Failed to sync", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await fetch("http://localhost:8000/api/process", { method: "POST" });
    } catch (err) {
      console.error("Failed to process", err);
    } finally {
      setProcessing(false);
      await fetchTickets(); // Final sync when done
      await fetchSummary();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Code defect": return <Bug className="w-4 h-4 text-rose-400" />;
      case "Data defect": return <Layers className="w-4 h-4 text-blue-400" />;
      case "Requirement gap": return <FileWarning className="w-4 h-4 text-amber-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const processedCount = tickets.filter(t => t.is_processed).length;
  
  const categoryData = Object.entries(
    tickets.reduce((acc, t) => {
      if (t.is_processed && t.analysis) {
        acc[t.analysis.category] = (acc[t.analysis.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const categories = Array.from(new Set(tickets.filter(t => t.is_processed && t.analysis).map(t => t.analysis!.category)));

  const trendData = Object.entries(
    tickets.reduce((acc, t) => {
      const date = t.created_date ? t.created_date.substring(0, 10) : "Unknown";
      if (date !== "Unknown" && t.is_processed && t.analysis) {
        if (!acc[date]) {
          acc[date] = { date };
          categories.forEach(c => acc[date][c] = 0);
        }
        const cat = t.analysis.category;
        acc[date][cat] = (acc[date][cat] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, any>)
  ).sort((a, b) => a[0].localeCompare(b[0])).map(([_, data]) => data);
  
  const qualityTickets = tickets.filter(t => t.is_processed && t.quality);
  const avgQuality = qualityTickets.length ? Math.round(qualityTickets.reduce((acc, t) => acc + t.quality!.quality_score, 0) / qualityTickets.length) : 0;
  const goodOrExcellent = qualityTickets.filter(t => t.quality!.quality_level === "Good" || t.quality!.quality_level === "Excellent").length;
  const qualityPercent = qualityTickets.length ? Math.round((goodOrExcellent / qualityTickets.length) * 100) : 0;

  const qualityLevels = ["Excellent", "Good", "Fair", "Poor", "Inadequate"];
  const qualityDistribution = qualityLevels.map(level => ({
    name: level,
    value: qualityTickets.filter(t => t.quality!.quality_level === level).length
  }));
  
  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex justify-between items-end mb-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              NASA Reviewer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-1">AI-Powered Project Risk Intelligence</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-lg border border-border">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Load Limit:</label>
            <input 
              type="number" 
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 15)}
              className="w-16 bg-transparent border-b border-white/20 text-white outline-none text-center appearance-none"
              min="1"
              max="100"
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/80 hover:bg-secondary border border-border transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Jira
          </button>
          
          <button 
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50"
          >
            <Bot className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
            Run AI Analysis
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in animate-delay-1">
        <div className="relative rounded-2xl overflow-hidden p-[1.5px]">
          {syncing ? (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] bg-[conic-gradient(from_0deg,transparent_0_280deg,#3b82f6_360deg)] animate-[spin_2s_linear_infinite] z-0" />
          ) : (
            <div className="absolute inset-0 z-0" />
          )}
          <div className={`glass-panel h-full p-6 rounded-2xl flex flex-col gap-2 relative z-10 ${syncing ? 'bg-[#111113]' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <RefreshCw className="w-16 h-16" />
            </div>
            <h3 className="text-muted-foreground font-medium">Total Tickets</h3>
            <p className="text-4xl font-bold">{tickets.length}</p>
          </div>
        </div>
        
        <div className="relative rounded-2xl overflow-hidden p-[1.5px]">
          {processing ? (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] bg-[conic-gradient(from_0deg,transparent_0_280deg,#10b981_360deg)] animate-[spin_2s_linear_infinite] z-0" />
          ) : (
            <div className="absolute inset-0 z-0" />
          )}
          <div className={`glass-panel h-full p-6 rounded-2xl flex flex-col gap-2 relative z-10 ${processing ? 'bg-[#111113]' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle className="w-16 h-16" />
            </div>
            <h3 className="text-muted-foreground font-medium">AI Processed</h3>
            <p className="text-4xl font-bold text-emerald-400">{processedCount}</p>
            <p className="text-sm text-emerald-400/70">{tickets.length > 0 ? Math.round((processedCount/tickets.length)*100) : 0}% coverage</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <h3 className="text-muted-foreground font-medium">Project Health</h3>
          <p className={`text-4xl font-bold ${
            summary.overall_status === 'Stable' ? 'text-emerald-400' :
            summary.overall_status === 'Watch' ? 'text-amber-400' :
            summary.overall_status === 'At Risk' ? 'text-rose-400' :
            'text-gray-500'
          }`}>
            {summary.overall_status}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-3" title={summary.summary_text}>
            {summary.summary_text}
          </p>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <h3 className="text-muted-foreground font-medium">Avg Ticket Quality</h3>
          <p className={`text-4xl font-bold ${
            avgQuality >= 75 ? 'text-emerald-400' :
            avgQuality >= 60 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {avgQuality}/100
          </p>
          <p className="text-sm text-emerald-400/70">{qualityPercent}% Good/Excellent</p>
        </div>
      </div>

      {/* Charts Row */}
      {processedCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in animate-delay-2 mt-4">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Quality Distribution</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Defect Breakdown</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
                        className="cursor-pointer transition-opacity duration-300 hover:opacity-80"
                        style={{ opacity: selectedCategory && selectedCategory !== entry.name ? 0.3 : 1 }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {categoryData.map((entry, index) => (
                <div 
                  key={entry.name} 
                  onClick={() => setSelectedCategory(selectedCategory === entry.name ? null : entry.name)}
                  className={`flex items-center gap-2 text-xs cursor-pointer transition-all ${
                    selectedCategory && selectedCategory !== entry.name ? 'opacity-30' : 'opacity-100 hover:text-white'
                  } ${!selectedCategory ? 'text-muted-foreground' : ''}`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Defects Over Time</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  {categories.map((category, index) => (
                    <Line 
                      key={category}
                      type="monotone" 
                      dataKey={category} 
                      name={category}
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: COLORS[index % COLORS.length] }} 
                      activeDot={{ r: 6 }} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="glass-panel rounded-2xl overflow-hidden mt-4 animate-fade-in animate-delay-3">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-semibold">
            Recent Defect Activity {selectedCategory && <span className="text-primary text-sm ml-2 px-2 py-1 bg-primary/10 rounded-full">Filtering by: {selectedCategory}</span>}
          </h2>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-primary animate-spin opacity-50" />
            </div>
          ) : (() => {
            const displayedTickets = tickets.filter(t => {
              if (!selectedCategory) return true;
              if (!t.is_processed || !t.analysis) return false;
              return t.analysis.category === selectedCategory;
            });

            return displayedTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {tickets.length > 0 ? `No tickets found for category "${selectedCategory}".` : 'No tickets found. Click "Sync Jira" to fetch data.'}
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
                      
                      {ticket.quality.gaps.length > 0 && (
                        <div>
                          <h4 className="font-medium text-rose-400 border-b border-rose-500/20 pb-2 mb-3">Identified Gaps</h4>
                          <div className="flex flex-col gap-2">
                            {ticket.quality.gaps.map((gap, i) => (
                              <div key={i} className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                  <span className="font-medium text-rose-200">{gap.issue}</span>
                                  <span className="text-[10px] uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded ml-auto">{gap.priority}</span>
                                </div>
                                <p className="text-xs text-rose-200/70"><strong>Why it matters:</strong> {gap.why}</p>
                                <p className="text-xs text-rose-200/90"><strong>Suggestion:</strong> {gap.suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {ticket.quality.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-400 border-b border-blue-500/20 pb-2 mb-3">Recommendations</h4>
                          <ul className="list-disc list-inside text-xs space-y-2 text-blue-200/80">
                            {ticket.quality.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )})()}
        </div>
      </div>
    </main>
  );
}

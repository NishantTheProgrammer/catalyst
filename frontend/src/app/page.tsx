"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Bot, Bug, FileWarning, Layers } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

type AnalysisResult = {
  id: number;
  category: string;
  confidence: number;
  reason: string;
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
};

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [maxResults, setMaxResults] = useState(15);
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
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <h3 className="text-muted-foreground font-medium">Total Tickets</h3>
          <p className="text-4xl font-bold">{tickets.length}</p>
        </div>
        
        <div className="relative rounded-2xl overflow-hidden p-[1.5px]">
          {processing ? (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_280deg,#10b981_360deg)] animate-[spin_2s_linear_infinite] z-0" />
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
      </div>

      {/* Charts Row */}
      {processedCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in animate-delay-2 mt-4">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
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
          <h2 className="text-xl font-semibold">Recent Defect Activity</h2>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-primary animate-spin opacity-50" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tickets found. Click "Sync Jira" to fetch data.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="glass-card p-5 rounded-xl flex flex-col md:flex-row gap-6 transition-all hover:bg-white/[0.03]">
                
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
                        <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
                          {ticket.analysis.confidence}% CONF
                        </span>
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}

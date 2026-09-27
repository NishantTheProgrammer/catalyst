"use client";

import { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Bot, Bug, FileWarning, Layers } from "lucide-react";

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
  is_processed: boolean;
  analysis: AnalysisResult | null;
};

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  useEffect(() => {
    fetchTickets();
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
      await fetch("http://localhost:8000/api/sync", { method: "POST" });
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
        
        <div className="flex gap-4">
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
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h3 className="text-muted-foreground font-medium">AI Processed</h3>
          <p className="text-4xl font-bold text-emerald-400">{processedCount}</p>
          <p className="text-sm text-emerald-400/70">{tickets.length > 0 ? Math.round((processedCount/tickets.length)*100) : 0}% coverage</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
          <h3 className="text-muted-foreground font-medium">Project Health</h3>
          {processedCount > 0 ? (
            <p className="text-4xl font-bold text-amber-400">At Risk</p>
          ) : (
            <p className="text-4xl font-bold text-gray-500">Unknown</p>
          )}
          <p className="text-sm text-muted-foreground">Based on current defect trend</p>
        </div>
      </div>

      {/* Ticket List */}
      <div className="glass-panel rounded-2xl overflow-hidden mt-4 animate-fade-in animate-delay-2">
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
                    <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded text-gray-300">
                      {ticket.jira_id}
                    </span>
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

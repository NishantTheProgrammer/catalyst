"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import KPIStats from "@/components/KPIStats";
import Charts from "@/components/Charts";
import TicketList from "@/components/TicketList";
import { Ticket, AnalysisResult, TicketQuality, CriteriaScore } from "@/types";

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [maxResults, setMaxResults] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
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
      interval = setInterval(async () => {
        await fetchTickets();
        await fetchSummary();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processing]);

  // When tickets update, check if we're done processing
  useEffect(() => {
    if (processing && tickets.length > 0) {
      const allProcessed = tickets.every(t => t.is_processed);
      if (allProcessed) {
        setProcessing(false);
      }
    }
  }, [tickets, processing]);

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
    const hasUnprocessed = tickets.some(t => !t.is_processed);
    if (!hasUnprocessed) return;
    
    setProcessing(true);
    try {
      await fetch("http://localhost:8000/api/process", { method: "POST" });
    } catch (err) {
      console.error("Failed to process", err);
      setProcessing(false);
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
  
  const qualityMetrics = useMemo(() => {
    let clarity = 0, completeness = 0, context = 0, reproducibility = 0, dependencies = 0;
    let count = 0;
    tickets.forEach(t => {
      if (t.is_processed && t.quality && t.quality.criteria_scores) {
        count++;
        // All new criteria are max 20, normalize to 100
        clarity += ((t.quality.criteria_scores.clarity?.score || 0) / 20) * 100;
        completeness += ((t.quality.criteria_scores.completeness?.score || 0) / 20) * 100;
        context += ((t.quality.criteria_scores.context?.score || 0) / 20) * 100;
        reproducibility += ((t.quality.criteria_scores.reproducibility?.score || 0) / 20) * 100;
        dependencies += ((t.quality.criteria_scores.dependencies?.score || 0) / 20) * 100;
      }
    });
    
    if (count === 0) return [];
    
    return [
      { metric: "Clarity", score: Math.round(clarity / count) },
      { metric: "Completeness", score: Math.round(completeness / count) },
      { metric: "Context", score: Math.round(context / count) },
      { metric: "Reproducibility", score: Math.round(reproducibility / count) },
      { metric: "Dependencies", score: Math.round(dependencies / count) }
    ];
  }, [tickets]);
  
  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <Header 
        maxResults={maxResults}
        setMaxResults={setMaxResults}
        syncing={syncing}
        handleSync={handleSync}
        processing={processing}
        handleProcess={handleProcess}
      />

      <KPIStats 
        syncing={syncing}
        processing={processing}
        totalTickets={tickets.length}
        processedCount={processedCount}
        avgQuality={avgQuality}
        qualityPercent={qualityPercent}
      />

      {/* Charts Row */}
      {processedCount > 0 && (
        <Charts 
          qualityDistribution={qualityDistribution}
          qualityMetrics={qualityMetrics}
          categoryData={categoryData}
          categories={categories}
          trendData={trendData}
          selectedQuality={selectedQuality}
          setSelectedQuality={setSelectedQuality}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          colors={COLORS}
        />
      )}

      {/* Ticket List */}
      <TicketList 
        tickets={tickets}
        loading={loading}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        processing={processing}
      />
    </main>
  );
}

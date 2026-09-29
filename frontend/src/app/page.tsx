"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import KPIStats from "@/components/KPIStats";
import Charts from "@/components/Charts";
import TicketList from "@/components/TicketList";
import Sidebar from "@/components/Sidebar";
import Insights from "@/components/Insights";
import Settings from "@/components/Settings";
import Chatbot from "@/components/Chatbot";
import SprintDashboard from "@/components/SprintDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Ticket, AnalysisResult, TicketQuality, CriteriaScore } from "@/types";

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [maxResults, setMaxResults] = useState(15);
  const [daysBack, setDaysBack] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [summary, setSummary] = useState({ overall_status: "Unknown", summary_text: "Based on current defect trend" });
  const [activeTab, setActiveTab] = useState("dashboard");

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
      await fetch(`http://localhost:8000/api/sync?max_results=${maxResults}&days_back=${daysBack}`, { method: "POST" });
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

  const handleRefreshInsights = async () => {
    setRefreshingInsights(true);
    try {
      await fetch("http://localhost:8000/api/summary/refresh", { method: "POST" });
      await fetchSummary();
    } catch (err) {
      console.error("Failed to refresh summary", err);
    } finally {
      setRefreshingInsights(false);
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

  const {
    processedCount,
    categoryData,
    categories,
    trendData,
    avgQuality,
    qualityPercent,
    qualityDistribution,
    qualityMetrics
  } = useDashboardStats(tickets);
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <Header 
            maxResults={maxResults}
            setMaxResults={setMaxResults}
            daysBack={daysBack}
            setDaysBack={setDaysBack}
            syncing={syncing}
            handleSync={handleSync}
            processing={processing}
            handleProcess={handleProcess}
          />

          {activeTab === "dashboard" && (
            <>
              <KPIStats 
                syncing={syncing}
                processing={processing}
                totalTickets={tickets.length}
                processedCount={processedCount}
                avgQuality={avgQuality}
                qualityPercent={qualityPercent}
              />

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
            </>
          )}

          {activeTab === "sprints" && (
            <SprintDashboard 
              tickets={tickets} 
              syncing={syncing} 
              processing={processing} 
              colors={COLORS} 
            />
          )}

          {activeTab === "tickets" && (
            <TicketList 
              tickets={tickets}
              loading={loading}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedQuality={selectedQuality}
              setSelectedQuality={setSelectedQuality}
              processing={processing}
            />
          )}

          {activeTab === "insights" && (
            <Insights 
              summary={summary} 
              tickets={tickets} 
              processing={refreshingInsights} 
              handleProcess={handleRefreshInsights} 
            />
          )}

          {activeTab === "settings" && (
            <Settings />
          )}
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}

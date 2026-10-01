"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Ticket } from "@/types";

interface DashboardContextType {
  tickets: Ticket[];
  loading: boolean;
  syncing: boolean;
  processing: boolean;
  refreshingInsights: boolean;
  maxResults: number;
  setMaxResults: (val: number) => void;
  daysBack: number;
  setDaysBack: (val: number) => void;
  summary: { overall_status: string; summary_text: string };
  handleSync: () => Promise<void>;
  handleProcess: () => Promise<void>;
  handleRefreshInsights: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [maxResults, setMaxResults] = useState(15);
  const [daysBack, setDaysBack] = useState(30);
  const [summary, setSummary] = useState({ overall_status: "Unknown", summary_text: "Based on current defect trend" });

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tickets`);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/summary`);
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sync?max_results=${maxResults}&days_back=${daysBack}`, { method: "POST" });
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/process`, { method: "POST" });
    } catch (err) {
      console.error("Failed to process", err);
      setProcessing(false);
    }
  };

  const handleRefreshInsights = async () => {
    setRefreshingInsights(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/summary/refresh`, { method: "POST" });
      await fetchSummary();
    } catch (err) {
      console.error("Failed to refresh summary", err);
    } finally {
      setRefreshingInsights(false);
    }
  };

  return (
    <DashboardContext.Provider value={{
      tickets, loading, syncing, processing, refreshingInsights,
      maxResults, setMaxResults, daysBack, setDaysBack, summary,
      handleSync, handleProcess, handleRefreshInsights
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

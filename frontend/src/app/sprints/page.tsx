"use client";

import React from "react";
import SprintDashboard from "@/components/SprintDashboard";
import { useDashboard } from "@/context/DashboardContext";

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function SprintsPage() {
  const { tickets, syncing, processing } = useDashboard();

  return (
    <SprintDashboard 
      tickets={tickets} 
      syncing={syncing} 
      processing={processing} 
      colors={COLORS} 
    />
  );
}

"use client";

import React from "react";
import Insights from "@/components/Insights";
import { useDashboard } from "@/context/DashboardContext";

export default function InsightsPage() {
  const { summary, tickets, refreshingInsights, handleRefreshInsights } = useDashboard();

  return (
    <Insights 
      summary={summary} 
      tickets={tickets} 
      processing={refreshingInsights} 
      handleProcess={handleRefreshInsights} 
    />
  );
}

"use client";

import React, { useState } from "react";
import KPIStats from "@/components/KPIStats";
import Charts from "@/components/Charts";
import { useDashboard } from "@/context/DashboardContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function DashboardPage() {
  const { tickets, syncing, processing } = useDashboard();
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    processedCount,
    categoryData,
    categories,
    trendData,
    avgQuality,
    qualityPercent,
    qualityDistribution,
    qualityMetrics,
    epicCount,
    storyCount,
    bugCount,
    criticalBugCount
  } = useDashboardStats(tickets);

  return (
    <>
      <KPIStats 
        syncing={syncing}
        processing={processing}
        totalTickets={tickets.length}
        processedCount={processedCount}
        avgQuality={avgQuality}
        qualityPercent={qualityPercent}
        epicCount={epicCount}
        storyCount={storyCount}
        bugCount={bugCount}
        criticalBugCount={criticalBugCount}
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
  );
}

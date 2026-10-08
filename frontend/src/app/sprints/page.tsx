"use client";

import React, { useMemo, useState } from "react";
import SprintDashboard from "@/components/SprintDashboard";
import { useDashboard } from "@/context/DashboardContext";

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function SprintsPage() {
  const { tickets, syncing, processing } = useDashboard();

  const sprintNames = useMemo(() => {
    const names = Array.from(new Set(tickets.map(t => t.sprint || 'Backlog'))).sort();
    return names;
  }, [tickets]);

  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const activeSprint = selectedSprint || sprintNames[sprintNames.length - 1] || '';

  return (
    <SprintDashboard
      tickets={tickets}
      syncing={syncing}
      processing={processing}
      colors={COLORS}
      sprintNames={sprintNames}
      selectedSprint={activeSprint}
      onSprintChange={setSelectedSprint}
    />
  );
}

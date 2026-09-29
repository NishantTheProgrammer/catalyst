"use client";

import React, { useState } from "react";
import TicketList from "@/components/TicketList";
import { useDashboard } from "@/context/DashboardContext";

export default function TicketsPage() {
  const { tickets, loading, processing } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);

  return (
    <TicketList 
      tickets={tickets}
      loading={loading}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      selectedQuality={selectedQuality}
      setSelectedQuality={setSelectedQuality}
      processing={processing}
    />
  );
}

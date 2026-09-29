"use client";

import React from "react";
import Header from "./Header";
import { useDashboard } from "@/context/DashboardContext";

export default function HeaderWrapper() {
  const {
    maxResults,
    setMaxResults,
    daysBack,
    setDaysBack,
    syncing,
    handleSync,
    processing,
    handleProcess
  } = useDashboard();

  return (
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
  );
}

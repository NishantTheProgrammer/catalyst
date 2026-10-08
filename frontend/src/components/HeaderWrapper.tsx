"use client";

import React from "react";
import Header from "./Header";
import { useDashboard } from "@/context/DashboardContext";

export default function HeaderWrapper() {
  const {
    syncing,
    handleSync,
    processing,
    handleProcess
  } = useDashboard();

  return (
    <Header
      syncing={syncing}
      handleSync={handleSync}
      processing={processing}
      handleProcess={handleProcess}
    />
  );
}

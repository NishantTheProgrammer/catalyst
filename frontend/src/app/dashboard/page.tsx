'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import KPIStats from '@/components/KPIStats';
import Charts from '@/components/Charts';
import { useDashboard } from '@/context/DashboardContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Bot, ArrowRight, Sparkles, Layers, ShieldCheck, FileCode2 } from 'lucide-react';

const COLORS = ['#f43f5e', '#3b82f6', '#fbbf24', '#10b981', '#a855f7', '#64748b'];

export default function DashboardPage() {
  const { tickets, syncing, processing, loading, handleProcess } = useDashboard();
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
    criticalBugCount,
  } = useDashboardStats(tickets);

  return (
    <div className="space-y-8 animate-fade-in">
      <KPIStats
        loading={loading}
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

      {processedCount > 0 ? (
        <div className="space-y-8">
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

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/tickets"
              className="glass p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Explore Defect Registry &amp; Diagnostics
                  </h4>
                  <p className="text-xs text-slate-400">
                    View 5-pillar scores, identified gaps, and AI recommendations for all {tickets.length} tickets
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </Link>

            <Link
              href="/sprints"
              className="glass p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    Sprint Telemetry &amp; Health Radar
                  </h4>
                  <p className="text-xs text-slate-400">
                    Comparative sprint analysis, health scores, and QA-Dev bounce tracking
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </Link>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="glass rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-5 border border-white/10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-white">Ready for AI Defect &amp; Quality Intelligence</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {tickets.length > 0
                  ? `You have ${tickets.length} Jira tickets synced. Click below to run the multi-agent pipeline and generate defect taxonomy, radar charts, and risk forecasts.`
                  : 'No tickets loaded yet. Click "Sync Jira" in the header to import your active project tickets.'}
              </p>
            </div>
            {tickets.length > 0 && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Bot className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
                <span>{processing ? 'Analyzing tickets...' : 'Run AI Analysis Now'}</span>
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

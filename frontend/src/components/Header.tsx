'use client';

import { usePathname } from 'next/navigation';
import { RefreshCw, Bot, Sparkles, Layers, FileCode2, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

type HeaderProps = {
  syncing: boolean;
  handleSync: () => void;
  processing: boolean;
  handleProcess: () => void;
};

const routeHeaders: Record<string, { badge: string; title: string; subtitle: string; icon: any }> = {
  '/dashboard': {
    badge: 'AI-Powered Project Intelligence • LangGraph Multi-Agent',
    title: 'Dashboard',
    subtitle: 'Comprehensive Jira metrics overview, defect classifications & project health synthesis',
    icon: Sparkles,
  },
  '/sprints': {
    badge: 'Sprint Intelligence & Comparative Metrics',
    title: 'Sprint Analysis',
    subtitle: 'Cross-sprint quality trends, defect distributions, severity breakdown & health scores',
    icon: Layers,
  },
  '/tickets': {
    badge: 'Jira Defect Registry & Quality Assessment',
    title: 'Tickets & Diagnostics',
    subtitle: '5-pillar ticket quality scoring, root-cause categorization & actionable AI recommendations',
    icon: FileCode2,
  },
  '/insights': {
    badge: 'Executive Synthesis & Risk Intelligence',
    title: 'AI Insights',
    subtitle: 'Strategic project health overview, defect risk forecasting & automated recommendations',
    icon: ShieldCheck,
  },
  '/settings': {
    badge: 'Configuration & Integrations',
    title: 'Settings',
    subtitle: 'Manage Jira connections, project sync depth, and LLM providers (Ollama / OpenAI / Gemini)',
    icon: SettingsIcon,
  },
};

export default function Header({
  syncing,
  handleSync,
  processing,
  handleProcess,
}: HeaderProps) {
  const pathname = usePathname();
  const currentHeader = routeHeaders[pathname] || routeHeaders['/dashboard'];
  const HeaderIcon = currentHeader.icon;

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10 animate-fade-in">
      {/* Left: Badge + Gradient Title + Subtitle */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-3">
          <HeaderIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentHeader.badge}</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text tracking-tight"
          style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #a855f7, #ec4899)' }}
        >
          {currentHeader.title}
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
          {currentHeader.subtitle}
        </p>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">

        {/* Sync Jira Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="glass px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Jira'}</span>
        </button>

        {/* Run AI Analysis Button */}
        <button
          onClick={handleProcess}
          disabled={processing}
          className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/50"
        >
          <Bot className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
          <span>{processing ? 'Analyzing...' : 'Run AI Analysis'}</span>
        </button>
      </div>
    </header>
  );
}

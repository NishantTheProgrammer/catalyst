'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  FileCode2,
  Sparkles,
  Settings,
  Calculator,
  Info,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Code2,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/sprints',   label: 'Sprints',     icon: Layers },
  { href: '/tickets',   label: 'Tickets',     icon: FileCode2 },
  { href: '/insights',  label: 'AI Insights', icon: Sparkles },
  { href: '/settings',  label: 'Settings',    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <aside
      className="flex flex-col h-full w-64"
      style={{
        background: 'rgba(15,15,30,0.97)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5 shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-white tracking-wide truncate">Catalyst</p>
          <p className="text-xs text-slate-500 truncate">Jira Risk Intelligence</p>
        </div>
      </div>

      {/* Scrollable Center: Nav + Scoring Guide */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-4">
        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (pathname === '/' && href === '/dashboard');
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: active ? '#818cf8' : '#94a3b8',
                  border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quality Scoring Guide Widget */}
        <div
          className="rounded-xl p-3 text-xs flex flex-col gap-2.5"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scoring System</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              0 - 100 Pts
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            AI evaluates Jira tickets across 5 quality pillars (20 pts each):
          </p>

          <div className="space-y-2 mt-0.5">
            {/* Pillar 1: Clarity & Completeness */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Clarity &amp; Completeness
                </span>
                <span className="font-bold text-indigo-400">40 pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  style={{ width: '40%' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Clarity (20 pts)</span>
                <span>Completeness (20 pts)</span>
              </div>
            </div>

            {/* Pillar 2: Technical Context */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Technical Context
                </span>
                <span className="font-bold text-purple-300">20 pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400"
                  style={{ width: '20%' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Context &amp; Constraints</span>
                <span>20 pts</span>
              </div>
            </div>

            {/* Pillar 3: Reproducibility & Deps */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Reproducibility &amp; Deps
                </span>
                <span className="font-bold text-emerald-300">40 pts</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: '40%' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Repro Steps (20 pts)</span>
                <span>Dependencies (20 pts)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowScoringModal(true)}
            className="w-full py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-medium text-indigo-300 hover:text-white transition-colors border border-indigo-500/20 flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
          >
            <Info className="w-3 h-3 text-indigo-400" />
            <span>How Scoring Calculates</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5 shrink-0 flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold tracking-wide text-slate-300">NASA Reviewer v1.0</span>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Zap className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>Ollama + LangGraph</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: always-visible fixed sidebar ── */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-64 z-50">
        {sidebarContent}
      </div>

      {/* ── Mobile: top header bar with hamburger ── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(15,15,30,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">Catalyst</span>
            <span className="text-[10px] text-slate-400 ml-1.5">Jira Risk Intelligence</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Mobile: drawer backdrop + sliding sidebar ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Interactive How Scoring Calculates Modal ── */}
      <AnimatePresence>
        {showScoringModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setShowScoringModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl bg-[#0f0f1e] border border-white/10 shadow-2xl p-5 sm:p-7 text-white flex flex-col gap-6 z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">How Quality Scoring Works</h2>
                    <p className="text-xs text-slate-400">AI-Powered 5-Point Jira Ticket Quality Evaluation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScoringModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="space-y-4 text-slate-300 text-xs sm:text-sm">
                <p className="text-slate-400 leading-relaxed">
                  Catalyst utilizes local LLMs and LangGraph multi-agent pipelines to grade Jira tickets across 5 rigorous pillars on a 0–100 scale, flagging incomplete specifications before work enters active sprints.
                </p>

                {/* Pillar 1: Clarity & Completeness */}
                <div
                  className="p-4 rounded-xl flex flex-col gap-2.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-sm text-white">1. Clarity &amp; Completeness</h3>
                    </div>
                    <span className="font-black text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      40 Pts Total
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-200">Clarity</span>
                        <span className="text-indigo-400 font-bold text-xs">20 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Evaluates unambiguity of the problem statement, concise business goals, and clear acceptance criteria.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-200">Completeness</span>
                        <span className="text-indigo-400 font-bold text-xs">20 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Ensures all required technical components, error flows, edge conditions, and user personas are documented.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pillar 2: Context & Architecture */}
                <div
                  className="p-4 rounded-xl flex flex-col gap-2.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-white">2. Technical Context &amp; Architecture Boundaries</h3>
                    </div>
                    <span className="font-black text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                      20 Pts Total
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 mt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-200">Context &amp; Constraints</span>
                      <span className="text-purple-400 font-bold text-xs">20 pts</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Specifies impacted microservices, schema changes, API endpoints, performance SLA requirements, and architectural constraints.
                    </p>
                  </div>
                </div>

                {/* Pillar 3: Correctness, Reproducibility & Deps */}
                <div
                  className="p-4 rounded-xl flex flex-col gap-2.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-sm text-white">3. Reproducibility &amp; Dependencies</h3>
                    </div>
                    <span className="font-black text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      40 Pts Total
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-200">Reproducibility</span>
                        <span className="text-emerald-400 font-bold text-xs">20 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Exact steps to reproduce, sample input payloads, stack traces, and verification test cases.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-200">Dependencies</span>
                        <span className="text-emerald-400 font-bold text-xs">20 pts</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Explicit identification of upstream blocking tickets, external vendor contracts, or hardware prerequisites.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Why Jira Status Callout */}
                <div
                  className="p-3.5 rounded-xl flex items-start gap-3 text-xs"
                  style={{
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300 text-xs mb-0.5">
                      Why does a created Jira ticket not guarantee readiness?
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Jira only verifies required custom fields are filled with text. The Catalyst AI evaluator analyzes syntactic and semantic completeness: missing reproduction steps, vague acceptance criteria, or unverified cross-service assumptions are caught early to prevent sprint churn and QA bounce cycles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button Footer */}
              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowScoringModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Got it, close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

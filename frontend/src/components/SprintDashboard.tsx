'use client';

import { useMemo } from 'react';
import { Ticket } from '@/types';
import {
  CalendarDays,
  TrendingUp,
  BarChart2,
  Activity,
  ShieldAlert,
  Target,
  TrendingDown,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useSprintStats } from '@/hooks/useDashboardStats';

type SprintDashboardProps = {
  loading?: boolean;
  tickets: Ticket[];
  syncing: boolean;
  processing: boolean;
  colors: string[];
  sprintNames: string[];
  selectedSprint: string;
  onSprintChange: (sprint: string) => void;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-xl text-xs flex flex-col gap-1 shadow-2xl border"
        style={{
          background: 'rgba(15, 15, 30, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {label && <p className="font-bold text-slate-200 border-b border-white/10 pb-1 mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`tip-${index}`} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-400 capitalize">{entry.name || 'Value'}:</span>
            <span className="font-mono font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SprintDashboard({
  loading,
  tickets,
  colors,
  sprintNames,
  selectedSprint,
  onSprintChange,
}: SprintDashboardProps) {
  // Aggregate data by Sprint
  const sprintData = useMemo(() => {
    const dataBySprint: Record<string, any> = {};
    const categories = new Set<string>();

    tickets.forEach((t) => {
      const sprint = t.sprint || 'Unassigned';
      if (!dataBySprint[sprint]) {
        dataBySprint[sprint] = {
          sprint,
          total: 0,
          processed: 0,
          qualitySum: 0,
          qualityCount: 0,
        };
      }

      dataBySprint[sprint].total += 1;

      if (t.is_processed) {
        dataBySprint[sprint].processed += 1;
        if (t.quality) {
          dataBySprint[sprint].qualitySum += t.quality.quality_score;
          dataBySprint[sprint].qualityCount += 1;
        }
        if (t.analysis) {
          const cat = t.analysis.category;
          categories.add(cat);
          dataBySprint[sprint][cat] = (dataBySprint[sprint][cat] || 0) + 1;
        }
      }
    });

    const formattedData = Object.values(dataBySprint)
      .sort((a, b) => a.sprint.localeCompare(b.sprint))
      .map((d) => ({
        ...d,
        avgQuality: d.qualityCount > 0 ? Math.round(d.qualitySum / d.qualityCount) : 0,
      }));

    return { formattedData, categoryList: Array.from(categories) };
  }, [tickets]);

  const { formattedData, categoryList } = sprintData;
  const {
    sprintSeverityData,
    bugCriticalityData,
    sprintHealthScores,
    crossSprintRadarData,
    radarSprintNames,
    sprintLineData,
    sprintNames: hookSprintNames,
  } = useSprintStats(tickets);

  const selectedTickets = tickets.filter((t) => (t.sprint || 'Backlog') === selectedSprint);

  const individualSeverityData = selectedTickets
    .map((t) => {
      let score = 40;
      if (t.issue_type === 'Bug' && t.bug_analysis) {
        if (t.bug_analysis.severity === 'P0-Critical') score = 100;
        else if (t.bug_analysis.severity === 'P1-High') score = 75;
        else if (t.bug_analysis.severity === 'P2-Medium') score = 50;
        else score = 25;
      } else {
        const p = (t.priority || 'Medium').toLowerCase();
        if (p === 'critical' || p === 'highest') score = 75;
        else if (p === 'high') score = 60;
        else if (p === 'low' || p === 'lowest') score = 20;
      }
      return { ticket: t.jira_id, title: t.title.substring(0, 30), severityScore: score, type: t.issue_type };
    })
    .sort((a, b) => b.severityScore - a.severityScore);

  const individualCriticalityData = selectedTickets
    .map((t) => {
      let score = 40;
      if (t.issue_type === 'Bug' && t.bug_analysis) {
        if (t.bug_analysis.severity === 'P0-Critical') score = 100;
        else if (t.bug_analysis.severity === 'P1-High') score = 75;
        else if (t.bug_analysis.severity === 'P2-Medium') score = 50;
        else score = 25;
      } else {
        const p = (t.priority || 'Medium').toLowerCase();
        if (p === 'critical' || p === 'highest') score = 75;
        else if (p === 'high') score = 60;
        else if (p === 'low' || p === 'lowest') score = 20;
      }
      if ((t.timeline_deviation_days ?? 0) > 7) score = Math.min(100, score + 20);
      else if ((t.timeline_deviation_days ?? 0) > 0) score = Math.min(100, score + 10);
      if ((t.bounce_count || 0) > 2) score = Math.min(100, score + 15);
      return {
        ticket: t.jira_id,
        title: t.title.substring(0, 30),
        criticalityScore: score,
        deviation: t.timeline_deviation_days ?? 0,
        bounces: t.bounce_count || 0,
      };
    })
    .sort((a, b) => b.criticalityScore - a.criticalityScore);

  const bounceData = selectedTickets
    .filter((t) => (t.bounce_count || 0) > 0)
    .map((t) => ({
      ticket: t.jira_id,
      title: t.title.substring(0, 25),
      bounceCount: t.bounce_count || 0,
      status: t.status,
      type: t.issue_type,
    }))
    .sort((a, b) => b.bounceCount - a.bounceCount);

  if (formattedData.length === 0) {
    if (loading) {
      return (
        <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center min-h-[350px]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Aggregating sprint metrics...</p>
        </div>
      );
    }
    return (
      <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center min-h-[350px]">
        <p className="text-slate-400 text-sm">No sprint data available. Click "Sync Jira" to ingest sprint tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Sprint Drill-down Selector Header ── */}
      <div className="glass p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Sprint Drill-down Analysis</h2>
            <p className="text-xs text-slate-400">Inspect individual ticket severity, criticality, and bounce telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sprint:</span>
          <div className="relative">
            <select
              value={selectedSprint}
              onChange={(e) => onSprintChange(e.target.value)}
              className="bg-black/40 border border-white/10 px-4 py-2 pr-9 rounded-xl text-white text-xs sm:text-sm font-semibold outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              {sprintNames.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Sprint Health Score Cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Sprint Health Scores</h3>
          </div>
          <span className="text-xs text-slate-500">Composite: quality, bug ratio &amp; resolution index</span>
        </div>

        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
          {sprintHealthScores.map((item) => (
            <div
              key={item.sprint}
              className={`glass p-4 rounded-xl min-w-[160px] flex flex-col justify-between shrink-0 transition-all ${
                item.sprint === selectedSprint ? 'border-indigo-500/50 bg-indigo-500/5' : ''
              }`}
            >
              <span className="text-xs font-semibold text-slate-400 truncate">{item.sprint}</span>
              <div className="my-2">
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    item.healthScore >= 75
                      ? 'text-emerald-400'
                      : item.healthScore >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {item.healthScore}
                </span>
                <span className="text-xs text-slate-500 ml-1">/ 100</span>
              </div>
              {item.delta !== null && (
                <span
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    item.delta > 0
                      ? 'text-emerald-400'
                      : item.delta < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {item.delta > 0 ? '↑ +' : item.delta < 0 ? '↓ ' : '→ '}
                  {item.delta} vs prev
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparative Sprint Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Volume by Sprint */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" /> Ticket Volume
            </h3>
            <span className="text-xs text-slate-400">Total vs Processed</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Total Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="processed" name="AI Analyzed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Score Trend */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Avg Quality Score
            </h3>
            <span className="text-xs text-slate-400">0–100 Scale</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.35)" fontSize={11} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avgQuality"
                  name="Quality Score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#020617' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Categories Stacked */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" /> Defect Distribution per Sprint
            </h3>
            <span className="text-xs text-slate-400">Stacked Taxonomy</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {categoryList.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={colors[index % colors.length]}
                    radius={index === categoryList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Severity & Bug vs Story side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-400" /> Ticket Severity per Sprint
            </h3>
            <span className="text-xs text-slate-400">Critical / High / Med / Low</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sprintSeverityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Critical" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="High" fill="#f97316" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Medium" fill="#eab308" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Low" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" /> Bug vs Story per Sprint
            </h3>
            <span className="text-xs text-slate-400">P0/P1 High-Risk Callout</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bugCriticalityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="stories" name="Stories" stackId="a" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="totalBugs" name="Total Bugs" stackId="a" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="criticalBugs" name="P0/P1 Bugs" fill="#ff0000" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Cross-Sprint Radar ── */}
      <div className="glass p-6 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">Cross-Sprint Performance Radar</h3>
          </div>
          <span className="text-xs text-slate-400">Comparing last 4 sprints across 5 health axes</span>
        </div>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={crossSprintRadarData}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} />
              {radarSprintNames.map((sprintName, index) => (
                <Radar
                  key={sprintName}
                  name={sprintName}
                  dataKey={sprintName}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <RechartsTooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Individual Ticket Severity for Selected Sprint ── */}
      <div className="glass p-6 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-400" />
              Ticket Severity — {selectedSprint}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Severity score (0–100) per individual Jira ticket in this sprint
            </p>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={individualSeverityData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="ticket" stroke="rgba(255,255,255,0.35)" fontSize={10} angle={-35} textAnchor="end" tickMargin={5} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.35)" fontSize={11} />
              <RechartsTooltip
                content={<CustomTooltip />}
                formatter={(value: any, name: any, props: any) => [value, `${props.payload.type} — ${props.payload.title}`]}
              />
              <Bar dataKey="severityScore" name="Severity Score" radius={[4, 4, 0, 0]}>
                {individualSeverityData.map((entry) => (
                  <Cell
                    key={entry.ticket}
                    fill={entry.severityScore >= 90 ? '#ef4444' : entry.severityScore >= 70 ? '#f97316' : entry.severityScore >= 45 ? '#eab308' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── To-and-Fro Dev ↔ QA Bouncing Tracker ── */}
      {bounceData.length > 0 ? (
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                To-and-Fro QA Bouncing Tracker — {selectedSprint}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tickets caught in excessive QA ↔ Dev ping-pong</p>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bounceData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="ticket" stroke="rgba(255,255,255,0.35)" fontSize={10} width={55} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="bounceCount" name="Bounces" radius={[0, 4, 4, 0]}>
                  {bounceData.map((entry) => (
                    <Cell
                      key={entry.ticket}
                      fill={entry.bounceCount >= 4 ? '#ef4444' : entry.bounceCount >= 2 ? '#f97316' : '#eab308'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass p-5 rounded-2xl flex items-center gap-3 text-slate-400">
          <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm">
            No to-and-fro bouncing detected in <strong className="text-white">{selectedSprint}</strong>. All tickets are progressing cleanly.
          </span>
        </div>
      )}

      {/* ── Sprint-to-Sprint Metric Comparison ── */}
      <div className="glass p-6 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Sprint-to-Sprint Metrics
          </h3>
          <span className="text-xs text-slate-400">Comparative Telemetry</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sprintLineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="metric" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.35)" fontSize={11} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {hookSprintNames.map((sprintName, index) => (
                <Line
                  key={sprintName}
                  type="monotone"
                  dataKey={sprintName}
                  name={sprintName}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

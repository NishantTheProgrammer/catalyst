import { useMemo } from "react";
import { Ticket } from "@/types";
import { CalendarDays, TrendingUp, BarChart2, Activity, ShieldAlert, Target, TrendingDown } from "lucide-react";
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useSprintStats } from '@/hooks/useDashboardStats';

type SprintDashboardProps = {
  tickets: Ticket[];
  syncing: boolean;
  processing: boolean;
  colors: string[];
  sprintNames: string[];
  selectedSprint: string;
  onSprintChange: (sprint: string) => void;
};

export default function SprintDashboard({ tickets, colors, sprintNames, selectedSprint, onSprintChange }: SprintDashboardProps) {
  // Aggregate data by Sprint
  const sprintData = useMemo(() => {
    const dataBySprint: Record<string, any> = {};
    const categories = new Set<string>();

    tickets.forEach(t => {
      const sprint = t.sprint || "Unassigned";
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

    const formattedData = Object.values(dataBySprint).sort((a, b) => a.sprint.localeCompare(b.sprint)).map(d => ({
      ...d,
      avgQuality: d.qualityCount > 0 ? Math.round(d.qualitySum / d.qualityCount) : 0,
    }));

    return { formattedData, categoryList: Array.from(categories) };
  }, [tickets]);

  const { formattedData, categoryList } = sprintData;
  const { sprintSeverityData, bugCriticalityData, sprintHealthScores, crossSprintRadarData, radarSprintNames, sprintLineData, sprintNames: hookSprintNames } = useSprintStats(tickets);

  const selectedTickets = tickets.filter(t => (t.sprint || 'Backlog') === selectedSprint);

  const individualSeverityData = selectedTickets.map(t => {
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
  }).sort((a, b) => b.severityScore - a.severityScore);

  const individualCriticalityData = selectedTickets.map(t => {
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
      bounces: t.bounce_count || 0
    };
  }).sort((a, b) => b.criticalityScore - a.criticalityScore);

  const bounceData = selectedTickets
    .filter(t => (t.bounce_count || 0) > 0)
    .map(t => ({
      ticket: t.jira_id,
      title: t.title.substring(0, 25),
      bounceCount: t.bounce_count || 0,
      status: t.status,
      type: t.issue_type
    }))
    .sort((a, b) => b.bounceCount - a.bounceCount);

  if (formattedData.length === 0) {
    return (
      <div className="bg-card/50 p-12 rounded-2xl border border-border flex flex-col items-center justify-center text-center backdrop-blur-xl">
        <p className="text-muted-foreground">No sprint data available. Sync tickets to start.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 bg-card/50 p-4 rounded-2xl border border-border backdrop-blur-xl">
        <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Drill-down Sprint:</span>
        <select
          value={selectedSprint}
          onChange={e => onSprintChange(e.target.value)}
          className="bg-secondary/30 border border-border px-3 py-2 rounded-lg text-white text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
        >
          {sprintNames.map(s => (
            <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Showing {selectedTickets.length} tickets — individual severity, criticality & bounce analysis
        </span>
      </div>

      <div className="flex items-center justify-between bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Comparative Sprint Analysis</h2>
            <p className="text-sm text-muted-foreground">Compare performance and metrics across different sprints</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in animate-delay-2 mt-4">
        {/* Ticket Volume by Sprint */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" /> Ticket Volume
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Legend />
                <Bar dataKey="total" name="Total Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="processed" name="Processed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Score Trend */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Avg Quality Score
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="avgQuality" name="Quality Score" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Categories Stacked by Sprint */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 lg:col-span-2">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-400" /> Defect Distribution per Sprint
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Legend />
                {categoryList.map((category, index) => (
                  <Bar key={category} dataKey={category} stackId="a" fill={colors[index % colors.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sprint Health Score Cards */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-card/50 p-4 rounded-2xl border border-border backdrop-blur-xl">
          <div className="p-2 bg-primary/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Sprint Health Scores</h3>
          <p className="text-sm text-muted-foreground">Higher is better — composite of quality, bug ratio, and resolution rate</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {sprintHealthScores.map(item => (
            <div key={item.sprint} className="glass-panel p-5 rounded-2xl min-w-[155px] flex flex-col gap-1 shrink-0">
              <span className="text-xs text-muted-foreground truncate">{item.sprint}</span>
              <span className={`text-3xl font-bold ${
                item.healthScore >= 75 ? 'text-emerald-400' :
                item.healthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>{item.healthScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
              {item.delta !== null && (
                <span className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${
                  item.delta > 0 ? 'text-emerald-400' :
                  item.delta < 0 ? 'text-rose-400' : 'text-muted-foreground'
                }`}>
                  {item.delta > 0 ? '↑' : item.delta < 0 ? '↓' : '→'}
                  {item.delta > 0 ? '+' : ''}{item.delta} vs prev
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Severity & Bug charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" /> Ticket Severity per Sprint
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sprintSeverityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend />
                <Bar dataKey="Critical" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="High" fill="#f97316" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Medium" fill="#eab308" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Low" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" /> Bug vs Story per Sprint
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bugCriticalityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sprint" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend />
                <Bar dataKey="stories" name="Stories" stackId="a" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="totalBugs" name="Total Bugs" stackId="a" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="criticalBugs" name="P0/P1 Bugs" fill="#ff0000" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cross-Sprint Radar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" /> Cross-Sprint Performance Radar
        </h3>
        <p className="text-sm text-muted-foreground -mt-2">Last 4 sprints compared across 5 health metrics (all values out of 100)</p>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={crossSprintRadarData}>
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              {radarSprintNames.map((sprintName, index) => (
                <Radar
                  key={sprintName}
                  name={sprintName}
                  dataKey={sprintName}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend />
              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Ticket Severity */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-400" />
          Ticket Severity — {selectedSprint}
          <span className="text-xs text-muted-foreground font-normal ml-2">Y: severity score (0–100) · X: individual tickets</span>
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={individualSeverityData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="ticket" stroke="rgba(255,255,255,0.4)" fontSize={10} angle={-35} textAnchor="end" tickMargin={5} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
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

      {/* Individual Ticket Criticality */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-red-400" />
          Ticket Criticality — {selectedSprint}
          <span className="text-xs text-muted-foreground font-normal ml-2">composite: severity + timeline deviation + bounces</span>
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={individualCriticalityData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="ticket" stroke="rgba(255,255,255,0.4)" fontSize={10} angle={-35} textAnchor="end" tickMargin={5} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(value: any, name: any, props: any) => [`${value} (dev ${props.payload.deviation}d, bounced ${props.payload.bounces}x)`, props.payload.title]}
              />
              <Bar dataKey="criticalityScore" name="Criticality Score" radius={[4, 4, 0, 0]}>
                {individualCriticalityData.map((entry) => (
                  <Cell
                    key={entry.ticket}
                    fill={entry.criticalityScore >= 85 ? '#dc2626' : entry.criticalityScore >= 65 ? '#f97316' : entry.criticalityScore >= 45 ? '#eab308' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* To-and-Fro Tracker */}
      {bounceData.length > 0 ? (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            To-and-Fro Tracker — {selectedSprint}
            <span className="text-xs text-muted-foreground font-normal ml-2">tickets bouncing between Dev ↔ QA</span>
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bounceData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} allowDecimals={false} label={{ value: 'Bounce Count', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis type="category" dataKey="ticket" stroke="rgba(255,255,255,0.4)" fontSize={10} width={55} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: any, name: any, props: any) => [`${value} bounces — ${props.payload.title}`, `Status: ${props.payload.status}`]}
                />
                <Bar dataKey="bounceCount" name="Dev↔QA Bounces" radius={[0, 4, 4, 0]}>
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
        <div className="glass-panel p-5 rounded-2xl border border-border flex items-center gap-3 text-muted-foreground">
          <TrendingDown className="w-5 h-5 text-emerald-400" />
          <span className="text-sm">No to-and-fro bouncing detected in <strong className="text-white">{selectedSprint}</strong> — all tickets are moving forward cleanly.</span>
        </div>
      )}

      {/* Sprint-to-Sprint Line Comparison */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Sprint-to-Sprint Metric Comparison
          <span className="text-xs text-muted-foreground font-normal ml-2">one colored line per sprint across all metrics</span>
        </h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sprintLineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="metric" stroke="rgba(255,255,255,0.4)" fontSize={11} tickMargin={10} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Legend />
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

import { useMemo } from "react";
import { Ticket } from "@/types";
import { CalendarDays, TrendingUp, BarChart2, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

type SprintDashboardProps = {
  tickets: Ticket[];
  syncing: boolean;
  processing: boolean;
  colors: string[];
};

export default function SprintDashboard({ tickets, colors }: SprintDashboardProps) {
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

  if (formattedData.length === 0) {
    return (
      <div className="bg-card/50 p-12 rounded-2xl border border-border flex flex-col items-center justify-center text-center backdrop-blur-xl">
        <p className="text-muted-foreground">No sprint data available. Sync tickets to start.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
    </div>
  );
}

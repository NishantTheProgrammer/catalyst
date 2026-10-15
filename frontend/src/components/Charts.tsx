'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Target, PieChart as PieIcon, TrendingUp, Filter } from 'lucide-react';

type ChartsProps = {
  qualityDistribution: { name: string; value: number }[];
  qualityMetrics: { metric: string; score: number }[];
  categoryData: { name: string; value: number }[];
  categories: string[];
  trendData: any[];
  selectedQuality: string | null;
  setSelectedQuality: (q: string | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  colors: string[];
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

export default function Charts({
  qualityDistribution,
  qualityMetrics,
  categoryData,
  categories,
  trendData,
  selectedQuality,
  setSelectedQuality,
  selectedCategory,
  setSelectedCategory,
  colors,
}: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* ── Chart 1: Quality Distribution ── */}
      <div
        className="glass p-6 rounded-2xl flex flex-col justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">Quality Distribution</h3>
          </div>
          {selectedQuality && (
            <button
              onClick={() => setSelectedQuality(null)}
              className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-emerald-500/25 transition-colors"
            >
              <Filter className="w-3 h-3" />
              <span>{selectedQuality} (clear)</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-4">Click bars to filter the tickets registry below</p>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qualityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {qualityDistribution.map((entry, index) => {
                  const isSelected = selectedQuality === entry.name;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      cursor="pointer"
                      fill={entry.name.includes('Excellent') ? '#10b981' : entry.name.includes('Good') ? '#38bdf8' : entry.name.includes('Needs') ? '#fbbf24' : '#f43f5e'}
                      onClick={() => setSelectedQuality(isSelected ? null : entry.name)}
                      style={{
                        opacity: selectedQuality && !isSelected ? 0.3 : 1,
                        transition: 'all 200ms ease',
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Chart 2: Criteria Averages Radar ── */}
      <div
        className="glass p-6 rounded-2xl flex flex-col justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">5-Pillar Quality Averages</h3>
          </div>
          <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            Scale 0-100
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Normalized radar benchmarking across all evaluated tickets</p>

        <div className="h-[250px] w-full flex items-center justify-center">
          {qualityMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qualityMetrics}>
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                <Radar name="Score" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25} strokeWidth={2} />
                <RechartsTooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Run AI Analysis to compute 5-pillar radar metrics
            </div>
          )}
        </div>
      </div>

      {/* ── Chart 3: Defect Breakdown ── */}
      <div
        className="glass p-6 rounded-2xl flex flex-col justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">Defect Classification</h3>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-purple-500/25 transition-colors"
            >
              <Filter className="w-3 h-3" />
              <span>{selectedCategory} (clear)</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-2">AI-categorized defect taxonomy (Code, Data, Config, Req)</p>

        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, index) => {
                  const isSelected = selectedCategory === entry.name;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      onClick={() => setSelectedCategory(isSelected ? null : entry.name)}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        opacity: selectedCategory && !isSelected ? 0.3 : 1,
                      }}
                    />
                  );
                })}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 pt-3 border-t border-white/5">
          {categoryData.map((entry, index) => {
            const isSelected = selectedCategory === entry.name;
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? null : entry.name)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-white/40 bg-white/10 text-white shadow-sm'
                    : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span>{entry.name}</span>
                <span className="font-mono text-[10px] opacity-75">({entry.value})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chart 4: Defects Over Time ── */}
      <div
        className="glass p-6 rounded-2xl flex flex-col justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">Defect Activity Timeline</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            By Ingestion Date
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Volume and category progression over Jira creation dates</p>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={11} tickMargin={8} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              {categories.map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  name={category}
                  stackId="a"
                  fill={colors[index % colors.length]}
                  radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

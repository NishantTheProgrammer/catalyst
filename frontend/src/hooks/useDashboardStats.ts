import { useMemo } from 'react';
import { Ticket } from '@/types';

export function useDashboardStats(tickets: Ticket[]) {
  return useMemo(() => {
    const processedCount = tickets.filter(t => t.is_processed).length;
    
    const categoryData = Object.entries(
      tickets.reduce((acc, t) => {
        if (t.is_processed && t.analysis) {
          acc[t.analysis.category] = (acc[t.analysis.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const categories = Array.from(new Set(tickets.filter(t => t.is_processed && t.analysis).map(t => t.analysis!.category)));

    const dates = tickets.filter(t => t.created_date).map(t => new Date(t.created_date!));
    let groupType = "day";
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const diffDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 3600 * 24);
      if (diffDays > 120) groupType = "month";
      else if (diffDays > 30) groupType = "week";
    }

    const trendData = Object.entries(
      tickets.reduce((acc, t) => {
        if (!t.created_date || !t.is_processed || !t.analysis) return acc;
        
        let dateKey = t.created_date.substring(0, 10);
        if (groupType === "month") {
          const d = new Date(t.created_date);
          dateKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else if (groupType === "week") {
          const d = new Date(t.created_date);
          d.setUTCDate(d.getUTCDate() - d.getUTCDay());
          dateKey = `Week of ${d.toLocaleString('default', { month: 'short', day: 'numeric' })}`;
        }
        
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, sortKey: t.created_date };
          categories.forEach(c => acc[dateKey][c] = 0);
        }
        
        acc[dateKey][t.analysis.category] = (acc[dateKey][t.analysis.category] || 0) + 1;
        return acc;
      }, {} as Record<string, any>)
    ).sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey)).map(([_, data]) => {
      const { sortKey, ...rest } = data;
      return rest;
    });
    
    const qualityTickets = tickets.filter(t => t.is_processed && t.quality);
    const avgQuality = qualityTickets.length ? Math.round(qualityTickets.reduce((acc, t) => acc + t.quality!.quality_score, 0) / qualityTickets.length) : 0;
    const goodOrExcellent = qualityTickets.filter(t => t.quality!.quality_level === "Good" || t.quality!.quality_level === "Excellent").length;
    const qualityPercent = qualityTickets.length ? Math.round((goodOrExcellent / qualityTickets.length) * 100) : 0;

    const qualityLevels = ["Excellent", "Good", "Fair", "Poor", "Inadequate"];
    const qualityDistribution = qualityLevels.map(level => ({
      name: level,
      value: qualityTickets.filter(t => t.quality!.quality_level === level).length
    }));
    
    let clarity = 0, completeness = 0, context = 0, reproducibility = 0, dependencies = 0;
    let count = 0;
    tickets.forEach(t => {
      if (t.is_processed && t.quality && t.quality.criteria_scores) {
        count++;
        clarity += ((t.quality.criteria_scores.clarity?.score || 0) / 20) * 100;
        completeness += ((t.quality.criteria_scores.completeness?.score || 0) / 20) * 100;
        context += ((t.quality.criteria_scores.context?.score || 0) / 20) * 100;
        reproducibility += ((t.quality.criteria_scores.reproducibility?.score || 0) / 20) * 100;
        dependencies += ((t.quality.criteria_scores.dependencies?.score || 0) / 20) * 100;
      }
    });
    
    const qualityMetrics = count === 0 ? [] : [
      { metric: "Clarity", score: Math.round(clarity / count) },
      { metric: "Completeness", score: Math.round(completeness / count) },
      { metric: "Context", score: Math.round(context / count) },
      { metric: "Reproducibility", score: Math.round(reproducibility / count) },
      { metric: "Dependencies", score: Math.round(dependencies / count) }
    ];

    return {
      processedCount,
      categoryData,
      categories,
      trendData,
      avgQuality,
      qualityPercent,
      qualityDistribution,
      qualityMetrics
    };
  }, [tickets]);
}

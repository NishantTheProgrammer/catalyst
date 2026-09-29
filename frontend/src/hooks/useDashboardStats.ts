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

    const trendData = Object.entries(
      tickets.reduce((acc, t) => {
        const date = t.created_date ? t.created_date.substring(0, 10) : "Unknown";
        if (date !== "Unknown" && t.is_processed && t.analysis) {
          if (!acc[date]) {
            acc[date] = { date };
            categories.forEach(c => acc[date][c] = 0);
          }
          const cat = t.analysis.category;
          acc[date][cat] = (acc[date][cat] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, any>)
    ).sort((a, b) => a[0].localeCompare(b[0])).map(([_, data]) => data);
    
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

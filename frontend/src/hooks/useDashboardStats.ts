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

    const epicCount = tickets.filter(t => t.issue_type === 'Epic').length;
    const storyCount = tickets.filter(t => t.issue_type === 'Story').length;
    const bugCount = tickets.filter(t => t.issue_type === 'Bug').length;
    const criticalBugCount = tickets.filter(t =>
      t.issue_type === 'Bug' &&
      t.bug_analysis != null &&
      (t.bug_analysis.severity === 'P0-Critical' || t.bug_analysis.severity === 'P1-High')
    ).length;

    return {
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
      criticalBugCount
    };
  }, [tickets]);
}

export function useSprintStats(tickets: Ticket[]) {
  return useMemo(() => {
    const bySprint: Record<string, {
      sprint: string; total: number; processedCount: number;
      Critical: number; High: number; Medium: number; Low: number;
      totalBugs: number; criticalBugs: number; resolvedBugs: number; stories: number;
      qualitySum: number; qualityCount: number; aiReadyCount: number;
    }> = {};

    tickets.forEach(t => {
      const s = t.sprint || 'Backlog';
      if (!bySprint[s]) {
        bySprint[s] = { sprint: s, total: 0, processedCount: 0,
          Critical: 0, High: 0, Medium: 0, Low: 0,
          totalBugs: 0, criticalBugs: 0, resolvedBugs: 0, stories: 0,
          qualitySum: 0, qualityCount: 0, aiReadyCount: 0 };
      }
      const d = bySprint[s];
      d.total += 1;
      if (t.is_processed) d.processedCount += 1;

      const p = (t.priority || 'Medium').toLowerCase();
      if (p === 'critical' || p === 'highest') d.Critical += 1;
      else if (p === 'high') d.High += 1;
      else if (p === 'low' || p === 'lowest') d.Low += 1;
      else d.Medium += 1;

      if (t.issue_type === 'Bug') {
        d.totalBugs += 1;
        const isDone = ['Done', 'Resolved', 'Closed'].includes(t.status);
        if (isDone) d.resolvedBugs += 1;
        if (t.bug_analysis &&
          (t.bug_analysis.severity === 'P0-Critical' || t.bug_analysis.severity === 'P1-High')) {
          d.criticalBugs += 1;
        }
      }
      if (t.issue_type === 'Story') d.stories += 1;

      if (t.quality) {
        d.qualitySum += t.quality.quality_score;
        d.qualityCount += 1;
        if (t.quality.ai_agent_ready) d.aiReadyCount += 1;
      }
    });

    const sorted = Object.values(bySprint).sort((a, b) => a.sprint.localeCompare(b.sprint));

    const sprintSeverityData = sorted.map(d => ({
      sprint: d.sprint, Critical: d.Critical, High: d.High,
      Medium: d.Medium, Low: d.Low
    }));

    const bugCriticalityData = sorted.map(d => ({
      sprint: d.sprint,
      totalBugs: d.totalBugs,
      criticalBugs: d.criticalBugs,
      resolvedBugs: d.resolvedBugs,
      stories: d.stories,
      bugRatio: d.total > 0 ? Math.round((d.totalBugs / d.total) * 100) / 100 : 0
    }));

    const healthList = sorted.map(d => {
      const avgQ = d.qualityCount > 0 ? d.qualitySum / d.qualityCount : 50;
      const bugRatio = d.total > 0 ? d.totalBugs / d.total : 0;
      const resolvedRate = d.totalBugs > 0 ? d.resolvedBugs / d.totalBugs : 1;
      return {
        sprint: d.sprint,
        healthScore: Math.round(avgQ * 0.4 + (1 - bugRatio) * 100 * 0.3 + resolvedRate * 100 * 0.3)
      };
    });

    const sprintHealthScores = healthList.map((item, i) => ({
      ...item,
      prevHealthScore: i > 0 ? healthList[i - 1].healthScore : null,
      delta: i > 0 ? item.healthScore - healthList[i - 1].healthScore : null
    }));

    const last4 = sorted.slice(-4);
    const radarSprintNames = last4.map(d => d.sprint);
    const metrics = ['Avg Quality', 'Bug-Free Rate', 'Critical Rate', 'AI-Ready Rate', 'Completion %'];

    const crossSprintRadarData = metrics.map(metric => {
      const row: Record<string, string | number> = { metric };
      last4.forEach(d => {
        const avgQ = d.qualityCount > 0 ? d.qualitySum / d.qualityCount : 0;
        const bugRatio = d.total > 0 ? d.totalBugs / d.total : 0;
        const critRate = d.total > 0 ? (d.Critical / d.total) * 100 : 0;
        const aiRate = d.processedCount > 0 ? (d.aiReadyCount / d.processedCount) * 100 : 0;
        const compRate = d.total > 0 ? (d.processedCount / d.total) * 100 : 0;
        if (metric === 'Avg Quality')    row[d.sprint] = Math.round(avgQ);
        if (metric === 'Bug-Free Rate')  row[d.sprint] = Math.round((1 - bugRatio) * 100);
        if (metric === 'Critical Rate')  row[d.sprint] = Math.round(critRate);
        if (metric === 'AI-Ready Rate')  row[d.sprint] = Math.round(aiRate);
        if (metric === 'Completion %')   row[d.sprint] = Math.round(compRate);
      });
      return row;
    });

    return { sprintSeverityData, bugCriticalityData, sprintHealthScores,
             crossSprintRadarData, radarSprintNames };
  }, [tickets]);
}

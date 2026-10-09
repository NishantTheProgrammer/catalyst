export type AnalysisResult = {
  id: number;
  category: string;
  confidence: number;
  reason: string;
};

export type CriteriaScore = { score: number; maxScore: number; reason: string };

export type TicketQuality = {
  quality_score: number;
  quality_level: string;
  implementation_readiness: string;
  criteria_scores: Record<string, CriteriaScore>;
  gaps: { issue: string; why: string; suggestion: string; priority: string }[];
  recommendations: string[];
  ai_agent_ready: boolean;
};

export type BugAnalysis = {
  id: number;
  severity: string;
  root_cause_type: string;
  is_reproducible: boolean;
  impact_summary: string;
};

export type Ticket = {
  id: number;
  jira_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  issue_type: string;
  sprint: string | null;
  sprint_id: number | null;
  sprint_state: string | null;
  sprint_start: string | null;
  sprint_end: string | null;
  created_date: string;
  resolution_date: string | null;
  due_date: string | null;
  parent_story_key: string | null;
  comment_count: number;
  comments_text: string;
  status_history: { from: string; to: string; at: string }[];
  bounce_count: number;
  timeline_deviation_days: number | null;
  link: string;
  is_processed: boolean;
  analysis: AnalysisResult | null;
  quality: TicketQuality | null;
  bug_analysis: BugAnalysis | null;
};

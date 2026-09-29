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

export type Ticket = {
  id: number;
  jira_id: string;
  title: string;
  description: string;
  status: string;
  sprint: string | null;
  created_date: string;
  link: string;
  is_processed: boolean;
  analysis: AnalysisResult | null;
  quality: TicketQuality | null;
};

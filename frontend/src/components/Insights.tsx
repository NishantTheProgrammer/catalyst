import { Bot, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Ticket } from "@/types";

type InsightsProps = {
  summary: {
    overall_status: string;
    summary_text: string;
  };
  tickets: Ticket[];
};

export default function Insights({ summary, tickets }: InsightsProps) {
  const processedTickets = tickets.filter(t => t.is_processed && t.analysis);
  const codeDefects = processedTickets.filter(t => t.analysis?.category === "Code defect").length;
  const reqGaps = processedTickets.filter(t => t.analysis?.category === "Requirement gap").length;
  
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-card/50 border border-border p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Executive AI Summary</h2>
        </div>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          {summary.summary_text || "No insights available yet. Please run AI analysis on your tickets."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-secondary/30 border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Overall Status</div>
              <div className="font-semibold text-lg">{summary.overall_status}</div>
            </div>
          </div>
          
          <div className="bg-secondary/30 border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-rose-500/20 rounded-full text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Code Defects</div>
              <div className="font-semibold text-lg">{codeDefects}</div>
            </div>
          </div>

          <div className="bg-secondary/30 border border-border p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Requirement Gaps</div>
              <div className="font-semibold text-lg">{reqGaps}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

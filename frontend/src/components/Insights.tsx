import { Bot, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Ticket } from "@/types";

type InsightsProps = {
  summary: {
    overall_status: string;
    summary_text: string;
  };
  tickets: Ticket[];
  processing: boolean;
  handleProcess: () => void;
};

export default function Insights({ summary, tickets, processing, handleProcess }: InsightsProps) {
  const processedTickets = tickets.filter(t => t.is_processed && t.analysis);
  const codeDefects = processedTickets.filter(t => t.analysis?.category === "Code").length;
  const reqGaps = processedTickets.filter(t => t.analysis?.category === "Requirement").length;
  
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-card/50 border border-border p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Executive AI Summary</h2>
          </div>
          <button 
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/80 hover:bg-secondary border border-border transition-all disabled:opacity-50 text-sm"
          >
            <Bot className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
            {processing ? 'Analyzing...' : 'Refresh Insights'}
          </button>
        </div>
        
        <div className="text-lg text-muted-foreground leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-foreground mt-6 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-foreground mt-5 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-foreground mt-4 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-primary" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-primary" {...props} />,
              li: ({node, ...props}) => <li className="" {...props} />,
              strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
              a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic opacity-80" {...props} />,
              code: ({node, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '')
                return !match ? (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="block bg-muted p-4 rounded-lg text-sm font-mono text-foreground overflow-x-auto mb-4" {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {(summary.summary_text || "No insights available yet. Please run AI analysis on your tickets.").replace(/\\n/g, '\n')}
          </ReactMarkdown>
        </div>

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

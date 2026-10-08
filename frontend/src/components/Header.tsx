import { Activity, RefreshCw, Bot } from "lucide-react";

type HeaderProps = {
  syncing: boolean;
  handleSync: () => void;
  processing: boolean;
  handleProcess: () => void;
};

export default function Header({
  syncing,
  handleSync,
  processing,
  handleProcess
}: HeaderProps) {
  return (
    <header className="flex justify-between items-end mb-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            NASA Reviewer
          </h1>
        </div>
        <p className="text-muted-foreground text-lg ml-1">AI-Powered Project Risk Intelligence</p>
      </div>
      
      <div className="flex gap-4 items-center">
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/80 hover:bg-secondary border border-border transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Sync Jira
        </button>
        
        <button 
          onClick={handleProcess}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50"
        >
          <Bot className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
          Run AI Analysis
        </button>
      </div>
    </header>
  );
}

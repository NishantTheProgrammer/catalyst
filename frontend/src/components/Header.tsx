import { Activity, RefreshCw, Bot } from "lucide-react";

type HeaderProps = {
  maxResults: number;
  setMaxResults: (val: number) => void;
  daysBack: number;
  setDaysBack: (val: number) => void;
  syncing: boolean;
  handleSync: () => void;
  processing: boolean;
  handleProcess: () => void;
};

export default function Header({
  maxResults,
  setMaxResults,
  daysBack,
  setDaysBack,
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
        <div className="flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-lg border border-border">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Days Back:</label>
          <input 
            type="number" 
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
            className="w-12 bg-transparent border-b border-white/20 text-white outline-none text-center appearance-none"
            min="1"
            max="365"
          />
          <div className="w-px h-4 bg-white/20 mx-1"></div>
          <label className="text-sm text-muted-foreground whitespace-nowrap">Load Limit:</label>
          <input 
            type="number" 
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value) || 15)}
            className="w-12 bg-transparent border-b border-white/20 text-white outline-none text-center appearance-none"
            min="1"
            max="200"
          />
        </div>
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

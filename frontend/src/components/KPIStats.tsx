import { RefreshCw, CheckCircle, ShieldCheck } from "lucide-react";

type KPIStatsProps = {
  syncing: boolean;
  processing: boolean;
  totalTickets: number;
  processedCount: number;
  avgQuality: number;
  qualityPercent: number;
};

export default function KPIStats({
  syncing,
  processing,
  totalTickets,
  processedCount,
  avgQuality,
  qualityPercent
}: KPIStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in animate-delay-1">
      <div className="relative rounded-2xl overflow-hidden p-[1.5px]">
        {syncing ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] bg-[conic-gradient(from_0deg,transparent_0_280deg,#3b82f6_360deg)] animate-[spin_2s_linear_infinite] z-0" />
        ) : (
          <div className="absolute inset-0 z-0" />
        )}
        <div className={`glass-panel h-full p-6 rounded-2xl flex flex-col gap-2 relative z-10 ${syncing ? 'bg-[#111113]' : ''}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RefreshCw className="w-16 h-16" />
          </div>
          <h3 className="text-muted-foreground font-medium">Total Tickets</h3>
          <p className="text-4xl font-bold">{totalTickets}</p>
        </div>
      </div>
      
      <div className="relative rounded-2xl overflow-hidden p-[1.5px]">
        {processing ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] bg-[conic-gradient(from_0deg,transparent_0_280deg,#10b981_360deg)] animate-[spin_2s_linear_infinite] z-0" />
        ) : (
          <div className="absolute inset-0 z-0" />
        )}
        <div className={`glass-panel h-full p-6 rounded-2xl flex flex-col gap-2 relative z-10 ${processing ? 'bg-[#111113]' : ''}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h3 className="text-muted-foreground font-medium">AI Processed</h3>
          <p className="text-4xl font-bold text-emerald-400">{processedCount}</p>
          <p className="text-sm text-emerald-400/70">{totalTickets > 0 ? Math.round((processedCount/totalTickets)*100) : 0}% coverage</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck className="w-16 h-16" />
        </div>
        <h3 className="text-muted-foreground font-medium">Avg Ticket Quality</h3>
        <p className={`text-4xl font-bold ${
          avgQuality >= 75 ? 'text-emerald-400' :
          avgQuality >= 60 ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {avgQuality}/100
        </p>
        <p className="text-sm text-emerald-400/70">{qualityPercent}% Good/Excellent</p>
      </div>
    </div>
  );
}

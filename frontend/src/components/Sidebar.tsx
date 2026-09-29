import { LayoutDashboard, Ticket, Lightbulb, Settings } from "lucide-react";
import clsx from "clsx";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "insights", label: "AI Insights", icon: Lightbulb },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/50 flex flex-col min-h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Catalyst
        </h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
              activeTab === item.id
                ? "bg-primary/20 text-primary font-medium border border-primary/30"
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
        NASA Reviewer v1.0
      </div>
    </aside>
  );
}

import { Link, useLocation } from "react-router-dom";
import { Bot, Database, LayoutDashboard, FileText, Settings, BarChart2 } from "lucide-react";
import { agents } from "@/config/agents";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">SEO Agents</h1>
          <p className="text-[10px] font-mono text-muted-foreground">Command Center</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {/* Overview */}
        <div className="mb-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isActive("/")
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Agents */}
        <div className="mt-4 mb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Agents
          </span>
        </div>
        {agents.map((agent) => (
          <Link
            key={agent.id}
            to={agent.path}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isActive(agent.path)
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <agent.icon className={cn("h-4 w-4", agent.colorClass)} />
            {agent.shortTitle}
          </Link>
        ))}

        {/* Tools */}
        <div className="mt-4 mb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </span>
        </div>
        <Link
          to="/seo-auditor"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            isActive("/seo-auditor")
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <BarChart2 className="h-4 w-4 text-agent-writer" />
          SEO Auditor
        </Link>

        {/* Data */}
        <div className="mt-4 mb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Data
          </span>
        </div>
        <Link
          to="/database"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            isActive("/database")
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <Database className="h-4 w-4" />
          Task Database
        </Link>
        <Link
          to="/collaboration"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            isActive("/collaboration")
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Collaboration
        </Link>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3 space-y-1">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            isActive("/settings")
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-status-complete animate-pulse-slow" />
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </div>
    </aside>
  );
}

import { Link } from "react-router-dom";
import { agents } from "@/config/agents";
import { cn } from "@/lib/utils";
import { ArrowRight, Bot } from "lucide-react";
import { sampleTasks } from "@/data/completed-tasks";

const Index = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage your SEO agent fleet
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Agents", value: String(agents.length), sub: "all systems" },
          { label: "Tasks Completed", value: String(sampleTasks.length), sub: "this week" },
          { label: "Keywords Tracked", value: "1.2k", sub: "+120 new" },
          { label: "Content Score", value: "87", sub: "avg across pages" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Agent Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          SEO Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <Link
              key={agent.id}
              to={agent.path}
              className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 hover:glow-primary"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", agent.bgClass)}>
                  <agent.icon className={cn("h-5 w-5", agent.colorClass)} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="mt-3 text-sm font-medium text-foreground">{agent.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-status-idle" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Idle</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Tasks
          </h2>
          <Link to="/database" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {sampleTasks.slice(0, 3).map((task) => {
            const agent = agents.find((a) => a.id === task.agentId);
            return (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                {agent && <agent.icon className={cn("h-4 w-4 shrink-0", agent.colorClass)} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {new Date(task.createdAt).toLocaleDateString()} · {task.type.toUpperCase()}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full",
                  task.type === "json" ? "bg-agent-analyst/10 text-agent-analyst" : "bg-agent-writer/10 text-agent-writer"
                )}>
                  {task.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;

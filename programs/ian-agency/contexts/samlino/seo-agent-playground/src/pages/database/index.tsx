import { useState } from "react";
import { sampleTasks, CompletedTask } from "@/data/completed-tasks";
import { agents } from "@/config/agents";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileJson, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function DatabasePage() {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const filtered = filterAgent === "all" 
    ? sampleTasks 
    : sampleTasks.filter((t) => t.agentId === filterAgent);

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Task Database</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Completed tasks stored as JSON or Markdown — shared across all agents
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterAgent("all")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            filterAgent === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          All
        </button>
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setFilterAgent(agent.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filterAgent === agent.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {agent.shortTitle}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const agent = agents.find((a) => a.id === task.agentId);
          const isExpanded = expandedTask === task.id;

          return (
            <div key={task.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/30 transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                {task.type === "json" ? (
                  <FileJson className="h-4 w-4 text-agent-analyst shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-agent-writer shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                </div>
                {agent && (
                  <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0", agent.bgClass, agent.colorClass)}>
                    {agent.shortTitle}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-4">
                  <div className="flex gap-2 mb-3">
                    {task.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <pre className="text-xs text-foreground/80 font-mono bg-muted/50 rounded-md p-4 overflow-x-auto max-h-96 whitespace-pre-wrap">
                    {task.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No completed tasks found for this filter.
        </div>
      )}
    </div>
  );
}

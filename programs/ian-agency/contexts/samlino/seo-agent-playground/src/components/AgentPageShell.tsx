import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { agents } from "@/config/agents";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Loader2, Bot, User, Settings } from "lucide-react";
import { AgentConfigPanel, AgentConfigData } from "@/components/AgentConfigPanel";

interface AgentPageShellProps {
  agentId: string;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

export function AgentPageShell({ agentId }: AgentPageShellProps) {
  const agent = agents.find((a) => a.id === agentId);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfigData>(() => {
    try {
      const stored = localStorage.getItem(`agent-config-${agentId}`);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { systemInstructions: "" };
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleConfigSave = (config: AgentConfigData) => {
    setAgentConfig(config);
    try {
      localStorage.setItem(`agent-config-${agentId}`, JSON.stringify(config));
    } catch { /* ignore quota errors */ }
  };

  if (!agent) {
    return <div className="p-8 text-muted-foreground">Agent not found</div>;
  }

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || trimmed.length > 5000 || isProcessing) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsProcessing(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Simulate agent acknowledgment (replace with real API later)
    setTimeout(() => {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `Task received. The ${agent.title} will process your request:\n\n"${trimmed.slice(0, 200)}${trimmed.length > 200 ? "..." : ""}"\n\n⏳ Agent pipeline not yet connected. Connect a backend to enable processing.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsProcessing(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="shrink-0 border-b border-border p-4 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", agent.bgClass)}>
            <agent.icon className={cn("h-5 w-5", agent.colorClass)} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{agent.title}</h1>
            <p className="text-xs text-muted-foreground">{agent.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Configure
            </button>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", isProcessing ? "bg-status-running animate-pulse" : "bg-status-idle")} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {isProcessing ? "Processing" : "Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 lg:px-8 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl mb-4", agent.bgClass)}>
              <agent.icon className={cn("h-8 w-8", agent.colorClass)} />
            </div>
            <h2 className="text-base font-medium text-foreground mb-1">
              {agent.title}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Describe your task below. Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Shift+Enter</kbd> for new lines.
            </p>
            {/* Suggestions */}
            <div className="mt-6 flex flex-wrap gap-2 max-w-md justify-center">
              {getPlaceholderSuggestions(agentId).map((s) => (
                <button
                  key={s}
                  onClick={() => { setPrompt(s); textareaRef.current?.focus(); }}
                  className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 hover:bg-accent hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3 max-w-3xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              msg.role === "user" ? "bg-secondary" : agent.bgClass
            )}>
              {msg.role === "user"
                ? <User className="h-3.5 w-3.5 text-secondary-foreground" />
                : <agent.icon className={cn("h-3.5 w-3.5", agent.colorClass)} />
              }
            </div>
            <div className={cn(
              "rounded-lg px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-secondary text-secondary-foreground"
                : "bg-card border border-border text-foreground"
            )}>
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 max-w-3xl">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", agent.bgClass)}>
              <agent.icon className={cn("h-3.5 w-3.5", agent.colorClass)} />
            </div>
            <div className="rounded-lg bg-card border border-border px-4 py-3">
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border p-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end rounded-lg border border-border bg-card focus-within:border-primary/50 focus-within:glow-primary transition-all">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder(agentId)}
              maxLength={5000}
              rows={1}
              disabled={isProcessing}
              className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isProcessing}
              className={cn(
                "m-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                prompt.trim() && !isProcessing
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground text-right">
            {prompt.length}/5000
          </p>
        </div>
      </div>
    
      {/* Config Panel */}
      <AgentConfigPanel
        agentId={agentId}
        agentTitle={agent.title}
        colorClass={agent.colorClass}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        config={agentConfig}
        onSave={handleConfigSave}
      />
    </div>
  );
}

function getPlaceholder(agentId: string): string {
  const map: Record<string, string> = {
    "competitor-researcher": "Enter a competitor URL or domain to analyze...",
    "keyword-analyst": "Enter a topic or seed keyword to research...",
    "content-writer": "Describe the content you need written...",
    "content-composer": "Paste a draft or describe the content to compose...",
    "content-analyst": "Paste content or a URL to analyze...",
    "performance-reviewer": "Enter a page URL or topic to review performance...",
    "opportunity-explorer": "Describe your niche or market to explore...",
    "schema-generator": "Paste a published page URL to generate its JSON-LD schema...",
    "prototyper": "Describe the component you want to build for comparaja.pt...",
  };
  return map[agentId] || "Enter your prompt...";
}

function getPlaceholderSuggestions(agentId: string): string[] {
  const map: Record<string, string[]> = {
    "competitor-researcher": [
      "Analyze acmecorp.com backlinks",
      "Compare top 5 competitors for SaaS CRM",
      "Find content gaps vs competitor.io",
    ],
    "keyword-analyst": [
      "Find keywords for 'content marketing'",
      "Cluster keywords around 'AI tools'",
      "Analyze search intent for 'best CRM'",
    ],
    "content-writer": [
      "Write a blog post about SEO in 2026",
      "Create an outline for a product comparison",
      "Draft meta descriptions for landing pages",
    ],
    "content-composer": [
      "Format this draft for WordPress",
      "Add internal links to the article",
      "Structure content with proper headings",
    ],
    "content-analyst": [
      "Score this article for SEO readability",
      "Check keyword density and placement",
      "Evaluate E-E-A-T signals in content",
    ],
    "performance-reviewer": [
      "Review rankings for /blog/seo-guide",
      "Generate weekly traffic report",
      "Identify pages losing rankings",
    ],
    "opportunity-explorer": [
      "Find untapped keywords in our niche",
      "Suggest content ideas from performance data",
      "Identify trending topics in our market",
    ],
    "schema-generator": [
      "https://example.com/blog/article",
      "Generate schema for a news article",
      "Extract author profile from a bio page",
    ],
    "prototyper": [
      "Build a FAQ accordion section",
      "Create a comparison table component",
      "Generate a hero banner variant",
    ],
  };
  return map[agentId] || ["Enter a prompt to get started"];
}

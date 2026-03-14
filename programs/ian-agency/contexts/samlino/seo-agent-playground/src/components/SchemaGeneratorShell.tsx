import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { agents } from "@/config/agents";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Loader2, Bot, User, Settings, Copy, Check, Braces } from "lucide-react";
import { AgentConfigPanel, AgentConfigData } from "@/components/AgentConfigPanel";

interface SchemaGeneratorShellProps {
  agentId: string;
}

interface MessageMetadata {
  authorsFound?: number;
  editorsFound?: number;
  pageTitle?: string;
  jobId?: string;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  isSchema?: boolean;
  metadata?: MessageMetadata;
}

interface GenerateResponse {
  job_id: string;
  status: string;
  schema_json: Record<string, unknown> | null;
  page_title: string | null;
  authors_found: number;
  editors_found: number;
  error?: string;
}

const SCHEMA_TYPES = ["Article", "BlogPosting", "NewsArticle", "WebPage"] as const;
type SchemaType = (typeof SCHEMA_TYPES)[number];

export function SchemaGeneratorShell({ agentId }: SchemaGeneratorShellProps) {
  const agent = agents.find((a) => a.id === agentId);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SchemaType>("Article");
  const [configOpen, setConfigOpen] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfigData>(() => {
    try {
      const stored = localStorage.getItem(`agent-config-${agentId}`);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { systemInstructions: "" };
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore copy errors
    }
  };

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isProcessing) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsProcessing(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      setProcessingStep("Scraping page content...");

      const response = await fetch("/api/schema/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          schema_type: selectedType,
          instructions: agentConfig.systemInstructions || "",
        }),
      });

      setProcessingStep("Building JSON-LD schema...");

      if (!response.ok) {
        let detail = "Schema generation failed";
        try {
          const err = await response.json();
          detail = err.detail || detail;
        } catch {
          // ignore json parse errors
        }
        throw new Error(detail);
      }

      const data: GenerateResponse = await response.json();

      const schemaText = JSON.stringify(data.schema_json, null, 2);
      const agentMessageId = crypto.randomUUID();

      const agentMessage: Message = {
        id: agentMessageId,
        role: "agent",
        content: schemaText,
        timestamp: new Date(),
        isSchema: true,
        metadata: {
          authorsFound: data.authors_found,
          editorsFound: data.editors_found,
          pageTitle: data.page_title ?? undefined,
          jobId: data.job_id,
        },
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error occurred"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="shrink-0 border-b border-border p-4 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
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
            {/* Schema type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as SchemaType)}
              disabled={isProcessing}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
            >
              {SCHEMA_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Configure
            </button>
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isProcessing ? "bg-status-running animate-pulse" : "bg-status-idle",
                )}
              />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {isProcessing ? "Scraping" : "Ready"}
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
              <Braces className={cn("h-8 w-8", agent.colorClass)} />
            </div>
            <h2 className="text-base font-medium text-foreground mb-1">{agent.title}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Paste a published page URL below. The agent will scrape the page, follow author links,
              and generate a complete JSON-LD schema block.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 max-w-md justify-center">
              {SUGGESTION_URLS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPrompt(s);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 hover:bg-accent hover:text-foreground transition-colors font-mono"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" ? "max-w-xl ml-auto flex-row-reverse" : "max-w-4xl")}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                msg.role === "user" ? "bg-secondary" : agent.bgClass,
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-secondary-foreground" />
              ) : (
                <Braces className={cn("h-3.5 w-3.5", agent.colorClass)} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {msg.isSchema ? (
                /* Schema output — dedicated card with copy button */
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  {/* Metadata bar */}
                  {msg.metadata && (
                    <div className="flex items-center gap-4 border-b border-border px-4 py-2 bg-muted/30">
                      {msg.metadata.pageTitle && (
                        <span className="text-xs text-foreground font-medium truncate max-w-xs">
                          {msg.metadata.pageTitle}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-3 shrink-0">
                        {msg.metadata.authorsFound !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ✓ {msg.metadata.authorsFound} author{msg.metadata.authorsFound !== 1 ? "s" : ""}
                          </span>
                        )}
                        {msg.metadata.editorsFound !== undefined && msg.metadata.editorsFound > 0 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ✓ {msg.metadata.editorsFound} editor{msg.metadata.editorsFound !== 1 ? "s" : ""}
                          </span>
                        )}
                        {msg.metadata.jobId && msg.metadata.jobId !== "unsaved" && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            id: {msg.metadata.jobId.slice(0, 8)}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <><Check className="h-3 w-3 text-status-complete" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3" /> Copy JSON</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* JSON body */}
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <pre className="p-4 text-xs font-mono text-foreground leading-relaxed whitespace-pre">
                      {msg.content}
                    </pre>
                  </div>
                  <div className="border-t border-border px-4 py-1.5">
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {msg.timestamp.toLocaleTimeString()} · JSON-LD @graph · {selectedType}
                    </p>
                  </div>
                </div>
              ) : (
                /* Regular message */
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-card border border-border text-foreground",
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Processing indicator with step label */}
        {isProcessing && (
          <div className="flex gap-3 max-w-4xl">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", agent.bgClass)}>
              <Braces className={cn("h-3.5 w-3.5", agent.colorClass)} />
            </div>
            <div className="rounded-lg bg-card border border-border px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              {processingStep && (
                <span className="text-xs text-muted-foreground font-mono">{processingStep}</span>
              )}
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
              placeholder="Paste a published page URL to generate its JSON-LD schema..."
              maxLength={2048}
              rows={1}
              disabled={isProcessing}
              className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 font-mono"
            />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isProcessing}
              className={cn(
                "m-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                prompt.trim() && !isProcessing
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground",
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground text-right">
            {prompt.length}/2048 · Schema type: {selectedType}
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

const SUGGESTION_URLS = [
  "https://example.com/blog/article",
  "https://yoursite.com/news/story",
  "https://myblog.com/post/title",
];

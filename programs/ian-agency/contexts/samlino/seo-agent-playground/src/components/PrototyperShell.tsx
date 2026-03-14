import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { agents } from "@/config/agents";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Settings, Loader2, ChevronDown, ChevronRight,
  Copy, Check, Blocks, Wand2, FileCode, Upload
} from "lucide-react";
import { AgentConfigPanel, AgentConfigData } from "@/components/AgentConfigPanel";

interface PrototyperShellProps {
  agentId: string;
}

type Phase = "briefing" | "analyzing" | "generating" | "output";

interface BriefingForm {
  componentName: string;
  targetPage: string;
  placement: string;
  requirements: string;
}

interface CssClassEntry {
  name: string;
  source: string;
}

interface CssKnowledge {
  layout: CssClassEntry[];
  typography: CssClassEntry[];
  components: CssClassEntry[];
  buttons: CssClassEntry[];
  states: CssClassEntry[];
  icons: CssClassEntry[];
  [key: string]: CssClassEntry[];
}

interface GeneratedOutput {
  html: string;
  css: string;
  js: string;
}

type OutputTab = "html" | "css" | "js";

const CATEGORY_LABELS: Record<string, string> = {
  layout: "Layout & Grid",
  typography: "Typography",
  components: "Components",
  buttons: "Buttons & CTAs",
  states: "States",
  icons: "Icons (icomoon)",
};

const PHASES: { id: Phase; label: string }[] = [
  { id: "briefing", label: "Brief" },
  { id: "analyzing", label: "Analyze" },
  { id: "generating", label: "Generate" },
  { id: "output", label: "Output" },
];

// Minimal regex-based syntax highlighter — no dependencies needed
function highlightCode(code: string, lang: OutputTab): string {
  if (!code) return "";
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (lang === "html") {
    return escaped
      .replace(/(&lt;\/?)([\w-]+)/g, '<span style="color:#7dd3fc">$1$2</span>')
      .replace(/([\w-]+=)/g, '<span style="color:#86efac">$1</span>')
      .replace(/("([^"]*)")/g, '<span style="color:#fde68a">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span style="color:#6b7280;font-style:italic">$1</span>');
  }
  if (lang === "css") {
    return escaped
      .replace(/(\.[\w-]+|#[\w-]+|[\w-]+(?=\s*\{))/g, '<span style="color:#7dd3fc">$1</span>')
      .replace(/([\w-]+)(\s*:)/g, '<span style="color:#86efac">$1</span>$2')
      .replace(/(:.*?;)/g, '<span style="color:#fde68a">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
  }
  // js
  return escaped
    .replace(/\b(const|let|var|function|return|if|else|for|while|class|new|this|document|window)\b/g, '<span style="color:#c084fc">$1</span>')
    .replace(/("([^"]*)")/g, '<span style="color:#fde68a">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span style="color:#6b7280;font-style:italic">$1</span>');
}

export function PrototyperShell({ agentId }: PrototyperShellProps) {
  const agent = agents.find((a) => a.id === agentId);

  const [phase, setPhase] = useState<Phase>("briefing");
  const [form, setForm] = useState<BriefingForm>({
    componentName: "",
    targetPage: "",
    placement: "",
    requirements: "",
  });
  const [availablePages, setAvailablePages] = useState<string[]>([]);
  const [cssKnowledge, setCssKnowledge] = useState<CssKnowledge | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("layout");
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("html");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [copiedTab, setCopiedTab] = useState<OutputTab | null>(null);
  const [copiedClass, setCopiedClass] = useState<string | null>(null);
  const [insertStatus, setInsertStatus] = useState<"idle" | "inserting" | "success" | "error">("idle");
  const [insertMessage, setInsertMessage] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfigData>(() => {
    try {
      const stored = localStorage.getItem(`agent-config-${agentId}`);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { systemInstructions: "" };
  });

  useEffect(() => {
    fetch("/api/prototyper/pages")
      .then((r) => r.json())
      .then((data) => setAvailablePages(data.pages ?? []))
      .catch(() =>
        setAvailablePages(["Credito-habitacao.html", "credito-habitacao/artigos/spread.html"])
      );
  }, []);

  const handleConfigSave = (config: AgentConfigData) => {
    setAgentConfig(config);
    try {
      localStorage.setItem(`agent-config-${agentId}`, JSON.stringify(config));
    } catch { /* ignore */ }
  };

  const handleAnalyze = async () => {
    setPhase("analyzing");
    setIsProcessing(true);
    setProcessingStep("Reading site CSS files...");
    try {
      const res = await fetch("/api/prototyper/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_page: form.targetPage }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setCssKnowledge(data.knowledge);
      setPhase("generating");
    } catch {
      setPhase("briefing");
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleGenerate = async () => {
    setPhase("generating");
    setIsProcessing(true);
    setGenerateError(null);
    setProcessingStep("Calling Claude...");
    try {
      const res = await fetch("/api/prototyper/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component_name: form.componentName,
          target_page: form.targetPage,
          placement: form.placement,
          requirements: form.requirements,
          instructions: agentConfig.systemInstructions || "",
        }),
      });
      if (!res.ok) {
        let detail = "Generation failed";
        try { const err = await res.json(); detail = err.detail || detail; } catch { /* ignore */ }
        throw new Error(detail);
      }
      const data: GeneratedOutput = await res.json();
      setOutput(data);
      setPhase("output");
      setActiveTab("html");
      setInsertStatus("idle");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unknown error");
      setPhase(cssKnowledge ? "generating" : "briefing");
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleInsert = async () => {
    if (!output) return;
    setInsertStatus("inserting");
    setInsertMessage("");
    try {
      const res = await fetch("/api/prototyper/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_page: form.targetPage,
          placement: form.placement,
          html: output.html,
          css: output.css,
          js: output.js,
        }),
      });
      const data = await res.json();
      setInsertStatus(data.success ? "success" : "error");
      setInsertMessage(data.message || "");
    } catch {
      setInsertStatus("error");
      setInsertMessage("Request failed");
    }
  };

  const handleCopy = async (content: string, tab: OutputTab) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch { /* ignore */ }
  };

  const handleCopyClass = async (className: string) => {
    try {
      await navigator.clipboard.writeText(className);
      setCopiedClass(className);
      setTimeout(() => setCopiedClass(null), 1500);
    } catch { /* ignore */ }
  };

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === phase);
  const canAnalyze = form.targetPage.trim().length > 0 && !isProcessing;
  const canGenerate = form.componentName.trim().length > 0 && !isProcessing;

  const getTabContent = (tab: OutputTab) => output?.[tab] ?? "";

  if (!agent) {
    return <div className="p-8 text-muted-foreground">Agent not found</div>;
  }

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
                {isProcessing ? processingStep ?? "Processing" : "Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body — two-column split */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

        {/* LEFT PANEL: Briefing + CSS Knowledge */}
        <div className="lg:w-[400px] shrink-0 flex flex-col border-r border-border overflow-y-auto">

          {/* Phase stepper */}
          <div className="shrink-0 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-1">
              {PHASES.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1">
                  <div className={cn(
                    "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider",
                    i <= currentPhaseIndex ? "text-agent-prototyper" : "text-muted-foreground/50"
                  )}>
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      i < currentPhaseIndex
                        ? "bg-status-complete"
                        : i === currentPhaseIndex
                          ? "bg-agent-prototyper animate-pulse"
                          : "bg-muted-foreground/25"
                    )} />
                    {p.label}
                  </div>
                  {i < PHASES.length - 1 && (
                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/25 mx-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Briefing Form */}
          <div className="px-5 py-4 space-y-3 border-b border-border">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Briefing
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Component name</label>
              <input
                type="text"
                value={form.componentName}
                onChange={(e) => setForm((f) => ({ ...f, componentName: e.target.value }))}
                placeholder="e.g. FAQ Accordion, Comparison Table"
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Target page</label>
              <select
                value={form.targetPage}
                onChange={(e) => setForm((f) => ({ ...f, targetPage: e.target.value }))}
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">Select a page…</option>
                {availablePages.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Placement</label>
              <input
                type="text"
                value={form.placement}
                onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
                placeholder="e.g. after .breadcrumbs, before .footer"
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Design requirements</label>
              <textarea
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                placeholder="Describe the component's purpose, sections, interactivity, and any specific design preferences..."
                rows={4}
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-y min-h-[80px]"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors",
                canAnalyze
                  ? "bg-agent-prototyper/20 text-agent-prototyper border border-agent-prototyper/30 hover:bg-agent-prototyper/30"
                  : "bg-muted/30 text-muted-foreground border border-border cursor-not-allowed"
              )}
            >
              {isProcessing && phase === "analyzing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCode className="h-3.5 w-3.5" />
              )}
              {cssKnowledge ? "Re-analyze Styles" : "Analyze Site Styles"}
            </button>
          </div>

          {/* CSS Knowledge Accordion */}
          {cssKnowledge && (
            <div className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Site CSS Classes <span className="normal-case font-normal">(click to copy)</span>
              </h3>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const entries = cssKnowledge[cat] ?? [];
                if (entries.length === 0) return null;
                const isOpen = expandedCategory === cat;
                return (
                  <div key={cat} className="rounded-md border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isOpen ? null : cat)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                    >
                      <span className="text-xs font-medium text-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{entries.length}</span>
                        {isOpen
                          ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="p-2 flex flex-wrap gap-1.5 bg-muted/5">
                        {entries.map((entry) => (
                          <button
                            key={entry.name}
                            onClick={() => handleCopyClass(entry.name)}
                            title={`From: ${entry.source}.css`}
                            className={cn(
                              "text-[10px] font-mono px-2 py-1 rounded border transition-colors",
                              copiedClass === entry.name
                                ? "bg-agent-prototyper/20 border-agent-prototyper/50 text-agent-prototyper"
                                : "bg-card border-border text-muted-foreground hover:text-agent-prototyper hover:border-agent-prototyper/40"
                            )}
                          >
                            .{entry.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate button — sticky at bottom */}
          <div className="shrink-0 p-5 border-t border-border space-y-2">
            {generateError && (
              <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-2.5 py-2 leading-snug">
                {generateError}
              </p>
            )}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                canGenerate
                  ? "bg-agent-prototyper text-background hover:opacity-90"
                  : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              )}
            >
              {isProcessing && phase === "generating" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isProcessing && phase === "generating" ? processingStep ?? "Generating..." : "Generate Component"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Output */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!output ? (
            /* Empty / loading state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              {isProcessing ? (
                <>
                  <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", agent.bgClass)}>
                    <Loader2 className={cn("h-8 w-8 animate-spin", agent.colorClass)} />
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">{processingStep}</p>
                </>
              ) : (
                <>
                  <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", agent.bgClass)}>
                    <Blocks className={cn("h-8 w-8", agent.colorClass)} />
                  </div>
                  <h2 className="text-base font-medium text-foreground">Prototyper</h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Fill in the briefing, analyze the site's CSS classes, then generate a component that fits seamlessly into comparaja.pt.
                  </p>
                  <div className="mt-4 space-y-1.5 text-left">
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Try building:</p>
                    {["FAQ accordion section", "Comparison table with site styling", "Hero banner variant", "Newsletter signup block"].map((s) => (
                      <div key={s} className="text-xs text-muted-foreground border border-border rounded px-2.5 py-1.5">
                        {s}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Output tabs */}
              <div className="shrink-0 flex items-end border-b border-border px-4 pt-3 gap-0.5">
                {(["html", "css", "js"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-md border border-b-0 transition-colors",
                      activeTab === tab
                        ? "bg-card border-border text-foreground"
                        : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto pb-2 flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(getTabContent(activeTab), activeTab)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {copiedTab === activeTab
                      ? <Check className="h-3 w-3 text-status-complete" />
                      : <Copy className="h-3 w-3" />}
                    {copiedTab === activeTab ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="flex-1 overflow-auto p-4 bg-muted/5">
                {getTabContent(activeTab) ? (
                  <pre
                    className="text-xs font-mono leading-relaxed whitespace-pre"
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(getTabContent(activeTab), activeTab),
                    }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No {activeTab.toUpperCase()} generated for this component.
                  </p>
                )}
              </div>

              {/* Insert footer */}
              <div className="shrink-0 border-t border-border p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">
                    Target: <span className="font-mono">{form.targetPage || "—"}</span>
                    {form.placement && (
                      <> · <span className="font-mono">{form.placement}</span></>
                    )}
                  </p>
                  {insertMessage && (
                    <p className={cn(
                      "text-[10px] mt-0.5",
                      insertStatus === "success" ? "text-status-complete" : "text-destructive"
                    )}>
                      {insertMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleInsert}
                  disabled={insertStatus === "inserting" || !form.targetPage}
                  className={cn(
                    "shrink-0 flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors",
                    insertStatus === "success"
                      ? "bg-status-complete/20 text-status-complete border border-status-complete/30"
                      : insertStatus === "error"
                        ? "bg-destructive/20 text-destructive border border-destructive/30"
                        : form.targetPage
                          ? "bg-agent-prototyper text-background hover:opacity-90"
                          : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {insertStatus === "inserting" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : insertStatus === "success" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {insertStatus === "success" ? "Inserted" : insertStatus === "error" ? "Failed" : "Insert into Page"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

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

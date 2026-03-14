import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Trash2,
  Save,
  Upload,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";

export interface AgentConfigData {
  systemInstructions: string;
}

interface SkillFile {
  filename: string;
  size_bytes: number;
}

interface AgentConfigPanelProps {
  agentId: string;
  agentTitle: string;
  colorClass: string;
  open: boolean;
  onClose: () => void;
  config: AgentConfigData;
  onSave: (config: AgentConfigData) => void;
}

export function AgentConfigPanel({
  agentId,
  agentTitle,
  colorClass,
  open,
  onClose,
  config,
  onSave,
}: AgentConfigPanelProps) {
  const [instructions, setInstructions] = useState(config.systemInstructions);

  // Skills state (loaded from backend)
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState("");

  // Add skill modes
  const [addMode, setAddMode] = useState<"idle" | "paste">("idle");
  const [pasteFilename, setPasteFilename] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync instructions when config prop changes (panel re-opens)
  useEffect(() => {
    if (open) {
      setInstructions(config.systemInstructions);
      fetchSkills();
    }
  }, [open]);

  // ── Skills API ──────────────────────────────────────────────

  const fetchSkills = async () => {
    setSkillsLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/skills`);
      if (res.ok) setSkills(await res.json());
    } catch {
      // ignore network errors
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/agents/${agentId}/skills`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) await fetchSkills();
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasteSave = async () => {
    const name = pasteFilename.trim();
    const body = pasteContent.trim();
    if (!name || !body) return;
    setSaving(true);
    try {
      const params = new URLSearchParams({ filename: name, content: body });
      const res = await fetch(`/api/agents/${agentId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      if (res.ok) {
        setPasteFilename("");
        setPasteContent("");
        setAddMode("idle");
        await fetchSkills();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (filename: string) => {
    try {
      const res = await fetch(
        `/api/agents/${agentId}/skills/${encodeURIComponent(filename)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        if (expandedSkill === filename) {
          setExpandedSkill(null);
          setExpandedContent("");
        }
        await fetchSkills();
      }
    } catch {
      // ignore
    }
  };

  const handleToggleView = async (filename: string) => {
    if (expandedSkill === filename) {
      setExpandedSkill(null);
      setExpandedContent("");
      return;
    }
    try {
      const res = await fetch(
        `/api/agents/${agentId}/skills/${encodeURIComponent(filename)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setExpandedContent(data.content);
        setExpandedSkill(filename);
      }
    } catch {
      // ignore
    }
  };

  // ── Instructions save ───────────────────────────────────────

  const handleSave = () => {
    onSave({ systemInstructions: instructions.trim().slice(0, 10000) });
    onClose();
  };

  if (!open) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-border bg-card shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Configure Agent
            </h2>
            <p className={cn("text-xs font-mono", colorClass)}>{agentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ── System Instructions ── */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              System Instructions
            </label>
            <p className="text-[11px] text-muted-foreground">
              Define how this agent behaves, its persona, output format, and
              constraints. Sent with every request.
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={10000}
              rows={8}
              placeholder={getInstructionPlaceholder(agentId)}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-y min-h-[120px]"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {instructions.length}/10,000
            </p>
          </div>

          {/* ── Skills (file-based) ── */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Skills
            </label>
            <p className="text-[11px] text-muted-foreground">
              Markdown documents with domain knowledge the agent reads at
              runtime. Upload <code className="text-[10px]">.md</code> files or
              paste content directly.
            </p>

            {/* Skill list */}
            <div className="space-y-1.5 mt-2">
              {skillsLoading && (
                <div className="flex items-center gap-2 py-3 justify-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Loading skills...
                  </span>
                </div>
              )}

              {!skillsLoading && skills.length === 0 && (
                <p className="text-xs text-muted-foreground/60 italic py-2">
                  No skill files yet
                </p>
              )}

              {skills.map((skill) => (
                <div key={skill.filename}>
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 group">
                    <button
                      onClick={() => handleToggleView(skill.filename)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      {expandedSkill === skill.filename ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">
                        {skill.filename}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatSize(skill.size_bytes)}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill.filename)}
                      className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expanded content preview */}
                  {expandedSkill === skill.filename && (
                    <div className="mt-1 rounded-md border border-border bg-muted/10 overflow-hidden">
                      <pre className="p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed">
                        {expandedContent}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {skills.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {skills.length} skill{skills.length !== 1 ? "s" : ""} loaded
              </p>
            )}

            {/* Add skill actions */}
            {addMode === "idle" && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  Upload .md
                </button>
                <button
                  onClick={() => setAddMode("paste")}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Paste as text
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,text/markdown"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Paste-as-text form */}
            {addMode === "paste" && (
              <div className="mt-2 space-y-2 rounded-md border border-border bg-muted/10 p-3">
                <input
                  value={pasteFilename}
                  onChange={(e) => setPasteFilename(e.target.value)}
                  placeholder="filename.md"
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 font-mono"
                />
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste your skill content here (markdown)..."
                  rows={6}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-y min-h-[80px] font-mono leading-relaxed"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setAddMode("idle");
                      setPasteFilename("");
                      setPasteContent("");
                    }}
                    className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasteSave}
                    disabled={
                      !pasteFilename.trim() || !pasteContent.trim() || saving
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                      pasteFilename.trim() && pasteContent.trim() && !saving
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {saving && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    Save Skill
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          <button
            onClick={handleSave}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            Save Instructions
          </button>
        </div>
      </div>
    </>
  );
}

function getInstructionPlaceholder(agentId: string): string {
  const map: Record<string, string> = {
    "competitor-researcher":
      "You are an SEO competitor research agent. Analyze competitor domains for backlink profiles, content gaps, and keyword opportunities. Output structured JSON with actionable insights...",
    "keyword-analyst":
      "You are a keyword research specialist. Identify high-value keyword clusters, analyze search intent, and estimate traffic potential. Group keywords by topic relevance...",
    "content-writer":
      "You are an SEO content writer. Create engaging, well-structured content optimized for target keywords. Follow E-E-A-T guidelines and maintain a natural tone...",
    "content-composer":
      "You are a content composer. Take drafts and structure them for publishing — add proper formatting, internal links, meta tags, and schema markup...",
    "content-analyst":
      "You are a content quality analyst. Score content for readability, keyword optimization, E-E-A-T signals, and technical SEO compliance...",
    "performance-reviewer":
      "You are a performance analytics agent. Track keyword rankings, organic traffic trends, and conversion metrics. Identify winning and declining pages...",
    "opportunity-explorer":
      "You are a market opportunity scout. Analyze all available data to identify content gaps, trending topics, and untapped keyword niches...",
    "schema-generator":
      "Customize how the Schema Generator agent produces JSON-LD. E.g. 'Always set inLanguage to pt-BR' or 'Include FAQPage when the page has an FAQ section'...",
    "prototyper":
      "You are a front-end prototyper for comparaja.pt. Reuse site classes: .grid-container, .grid-item-lg-N, .cja-btn, .content-container. Output in Portuguese. Return JSON {html, css, js}.",
  };
  return map[agentId] || "Define how this agent should behave...";
}

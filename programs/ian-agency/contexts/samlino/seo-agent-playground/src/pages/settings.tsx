import { useEffect, useState } from "react";
import {
  RefreshCw,
  LogOut,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Building2,
  BarChart3,
  User,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agents } from "@/config/agents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthInfo {
  loggedIn?: boolean;
  authMethod?: string;
  email?: string;
  orgId?: string;
  orgName?: string;
  subscriptionType?: string;
  error?: string;
}

interface DailyActivity {
  date: string;
  messageCount?: number;
  toolCallCount?: number;
  sessionCount?: number;
}

interface ModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

interface StatsInfo {
  totalSessions?: number;
  totalMessages?: number;
  lastComputedAt?: string;
  dailyActivity?: DailyActivity[];
  modelUsage?: Record<string, ModelUsage>;
}

interface OrgInfo {
  name?: string;
  url?: string;
  logo?: string;
}

interface SettingsData {
  auth: AuthInfo;
  stats: StatsInfo;
  org: OrgInfo;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTokens(n: number | undefined): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtNumber(n: number | undefined): string {
  if (!n) return "0";
  return n.toLocaleString();
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function modelDisplayName(key: string): string {
  const map: Record<string, string> = {
    "claude-opus-4-5": "Opus 4.5",
    "claude-opus-4-6": "Opus 4.6",
    "claude-sonnet-4-5": "Sonnet 4.5",
    "claude-sonnet-4-6": "Sonnet 4.6",
    "claude-haiku-4-5": "Haiku 4.5",
    "claude-haiku-4-5-20251001": "Haiku 4.5",
  };
  return map[key] ?? key;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

const AVAILABLE_MODELS = [
  { value: "sonnet", label: "Claude Sonnet 4.6" },
  { value: "opus", label: "Claude Opus 4.6" },
  { value: "haiku", label: "Claude Haiku 4.5" },
] as const;

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggedOutMsg, setLoggedOutMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Model configuration state
  const [modelSettings, setModelSettings] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [claudeRes, appRes] = await Promise.all([
        fetch("/api/settings/claude"),
        fetch("/api/settings"),
      ]);
      if (!claudeRes.ok) throw new Error(`HTTP ${claudeRes.status}`);
      setData(await claudeRes.json());
      if (appRes.ok) setModelSettings(await appRes.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const updateModelSetting = async (key: string, value: string) => {
    setModelSettings((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
    await fetch(`/api/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/settings/claude/logout", { method: "POST" });
      const result = await res.json();
      if (result.status === "logged_out") {
        setLoggedOutMsg("You have been logged out.");
        await fetchSettings();
      } else {
        setLoggedOutMsg(`Logout issue: ${result.message || "unknown error"}`);
      }
    } catch (err) {
      setLoggedOutMsg(`Error: ${String(err)}`);
    } finally {
      setLoggingOut(false);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-destructive mb-3">Failed to load settings: {error}</p>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const auth = data?.auth ?? {};
  const stats = data?.stats ?? {};
  const org = data?.org ?? {};

  // Latest daily activity entry
  const latestActivity = stats.dailyActivity?.at(-1);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="shrink-0 border-b border-border px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Claude Code account & usage information</p>
          </div>
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 py-6 max-w-3xl space-y-8">

        {/* ── Section 1: Claude Account ──────────────────────────────────── */}
        <section>
          <SectionHeading icon={User} title="Claude Account" subtitle="OAuth session managed by the Claude Code CLI" />

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            {/* Login status badge */}
            <div className="flex items-center gap-2">
              {auth.loggedIn ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-status-complete" />
                  <span className="text-sm font-medium text-foreground">Logged in</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-muted-foreground">Not logged in</span>
                </>
              )}
            </div>

            {/* Auth details grid */}
            {auth.loggedIn && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {auth.email && (
                  <>
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground font-mono text-xs">{auth.email}</span>
                  </>
                )}
                {auth.authMethod && (
                  <>
                    <span className="text-muted-foreground">Auth method</span>
                    <span className="text-foreground capitalize">{auth.authMethod}</span>
                  </>
                )}
                {auth.orgName && (
                  <>
                    <span className="text-muted-foreground">Organisation</span>
                    <span className="text-foreground">{auth.orgName}</span>
                  </>
                )}
                {auth.subscriptionType && (
                  <>
                    <span className="text-muted-foreground">Plan</span>
                    <span className="text-foreground capitalize">{auth.subscriptionType}</span>
                  </>
                )}
              </div>
            )}

            {auth.error && !auth.loggedIn && (
              <p className="text-xs text-muted-foreground font-mono">{auth.error}</p>
            )}

            {/* Logged-out notice */}
            {loggedOutMsg && (
              <div className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-2">
                <p className="text-xs text-foreground">{loggedOutMsg}</p>
                <div className="flex items-start gap-2">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Run this in your terminal to log back in:</p>
                    <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded">
                      claude auth login
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => { setLoggedOutMsg(null); fetchSettings(); }}
                  className="text-xs text-primary hover:underline"
                >
                  Refresh after logging in
                </button>
              </div>
            )}

            {/* Logout button */}
            {auth.loggedIn && !loggedOutMsg && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {loggingOut
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <LogOut className="h-3.5 w-3.5" />
                }
                {loggingOut ? "Logging out…" : "Log Out"}
              </button>
            )}
          </div>
        </section>

        {/* ── Section 2: Usage Statistics ───────────────────────────────── */}
        <section>
          <SectionHeading
            icon={BarChart3}
            title="Usage Statistics"
            subtitle="Local session data from ~/.claude/stats-cache.json"
          />

          {Object.keys(stats).length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No local stats found. Run some Claude Code sessions first.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total Sessions" value={fmtNumber(stats.totalSessions)} />
                <StatCard label="Total Messages" value={fmtNumber(stats.totalMessages)} />
                <StatCard label="Last Updated" value={fmtDate(stats.lastComputedAt)} />
              </div>

              {/* Today's activity */}
              {latestActivity && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                    Latest Activity — {fmtDate(latestActivity.date)}
                  </p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Messages</p>
                      <p className="text-foreground font-semibold">{fmtNumber(latestActivity.messageCount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Tool calls</p>
                      <p className="text-foreground font-semibold">{fmtNumber(latestActivity.toolCallCount)}</p>
                    </div>
                    {latestActivity.sessionCount !== undefined && (
                      <div>
                        <p className="text-muted-foreground text-xs">Sessions</p>
                        <p className="text-foreground font-semibold">{fmtNumber(latestActivity.sessionCount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token usage by model */}
              {stats.modelUsage && Object.keys(stats.modelUsage).length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                    Token Usage by Model
                  </p>
                  <div className="space-y-3">
                    {Object.entries(stats.modelUsage).map(([model, usage]) => (
                      <div key={model}>
                        <p className="text-xs text-muted-foreground mb-1.5">{modelDisplayName(model)}</p>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Input</p>
                            <p className="text-foreground font-mono text-xs">{fmtTokens(usage.inputTokens)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Output</p>
                            <p className="text-foreground font-mono text-xs">{fmtTokens(usage.outputTokens)}</p>
                          </div>
                          {(usage.cacheReadTokens ?? 0) > 0 && (
                            <div>
                              <p className="text-[10px] text-muted-foreground">Cache reads</p>
                              <p className="text-foreground font-mono text-xs">{fmtTokens(usage.cacheReadTokens)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan limits note */}
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Session and weekly plan rate limits (the "100% used / 77% used" counters) are only
                    available on the Claude website — they cannot be read via the CLI.
                  </p>
                  <a
                    href="https://claude.ai/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    View plan limits on claude.ai
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3: AI Model Configuration ────────────────────────── */}
        <section>
          <SectionHeading
            icon={Cpu}
            title="AI Model Configuration"
            subtitle="Choose which Claude model each agent uses"
          />

          <div className="space-y-4">
            {/* Default model */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Default Model</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Used by IAn and any agent without a custom override
                  </p>
                </div>
                <Select
                  value={modelSettings.default_model || "sonnet"}
                  onValueChange={(v) => updateModelSetting("default_model", v)}
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Per-agent overrides */}
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                Per-Agent Overrides
              </p>
              <div className="space-y-3">
                {agents.map((agent) => {
                  const key = `agent_${agent.id}_model`;
                  const hasOverride = !!modelSettings[key];
                  const Icon = agent.icon;
                  const defaultLabel = AVAILABLE_MODELS.find(
                    (m) => m.value === (modelSettings.default_model || "sonnet")
                  )?.label ?? "Sonnet 4.6";

                  return (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn("h-4 w-4", agent.colorClass)} />
                        <span className="text-sm text-foreground">{agent.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasOverride && (
                          <span className="text-[10px] text-muted-foreground italic">
                            default
                          </span>
                        )}
                        <Select
                          value={modelSettings[key] || "_default"}
                          onValueChange={(v) =>
                            updateModelSetting(key, v === "_default" ? "" : v)
                          }
                        >
                          <SelectTrigger className={cn(
                            "w-48 h-8 text-xs",
                            !hasOverride && "text-muted-foreground"
                          )}>
                            <SelectValue>
                              {hasOverride
                                ? AVAILABLE_MODELS.find((m) => m.value === modelSettings[key])?.label
                                : `Use Default (${defaultLabel})`}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_default" className="text-xs">
                              Use Default ({defaultLabel})
                            </SelectItem>
                            {AVAILABLE_MODELS.map((m) => (
                              <SelectItem key={m.value} value={m.value} className="text-xs">
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Organisation Config ───────────────────────────── */}
        <section>
          <SectionHeading
            icon={Building2}
            title="Organisation Config"
            subtitle="Read from backend/.env — edit to change"
          />

          <div className="rounded-lg border border-border bg-card p-5">
            {org.name || org.url ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {org.name && (
                  <>
                    <span className="text-muted-foreground">Name</span>
                    <span className="text-foreground">{org.name}</span>
                  </>
                )}
                {org.url && (
                  <>
                    <span className="text-muted-foreground">URL</span>
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-xs font-mono flex items-center gap-1"
                    >
                      {org.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </>
                )}
                {org.logo && (
                  <>
                    <span className="text-muted-foreground">Logo</span>
                    <span className="text-foreground font-mono text-xs truncate">{org.logo}</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No org config loaded. Check your backend/.env file.
              </p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

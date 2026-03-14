# Agent Enterprise

## What This Is

Agent Enterprise is a ground-up rebuild of the legacy AI-Enterprise system into one lightweight monorepo that serves the operator dashboard, agent registry, program inventory, and future orchestration runtime from a single local server.

## Core Value

Operate the portfolio through one low-memory, restartable control plane that is readable, auditable, and reachable through one Tailscale entry point.

## Current Milestone: v1 Lean Monorepo Foundation

**Goal:** Replace the legacy multi-process stack with a single-process Node control plane that serves the existing dashboard references, classifies copied agent/program assets correctly, and creates a safe base for later agent and program wiring.

**Current status (2026-03-12):**
- Audit complete for the copied `agents copy/` and `programs/` trees
- Existing dashboard HTML references are present and treated as the canonical UI contract
- No `.planning/` state existed before this bootstrap
- Phase 1 is now planned; execution has not started

**Target features:**
- One Node server for API delivery, static frontend delivery, orchestration metadata, and future execution hooks
- One same-origin dashboard delivery path built from the existing HTML references
- One local SQLite state store for control-plane metadata and runtime state
- Explicit separation between active modules, remote surfaces, migration holds, and stubs
- One-command local restart and one Tailscale-reachable entry point

## Requirements

### Active

- Build the single-process control-plane foundation without inheriting legacy Vite and worker sprawl
- Preserve the five local dashboard HTML files as the visual and structural contract for the new frontend
- Normalize the copied agent/program folders into registries before any runtime execution is added
- Keep secrets server-side and keep heavy brownfield holds dormant by default

### Out Of Scope

- Recreating the legacy AI-Enterprise FastAPI plus Vite plus autonomous-worker topology
- Booting Samlino, TCG Index scraping, or other brownfield holds as part of Phase 1 startup
- Full connector wiring for Shopify, Billy, cPanel, Supabase, or provider APIs in Phase 1
- Agent execution, program mutations, or autonomous write paths before the base server is stable

## Context

The new project starts with three useful assets:

- `01-agent-overview.html` through `05-agent-chat.html` at the repo root
- copied agent definitions under `agents copy/`
- copied program definitions under `programs/`

The audit showed that most agent packets are prompt and routing metadata, not standalone services. The audit also showed that most program folders are either remote manifests, placeholders, or migration holds. The real long-lived runtime requirement for Phase 1 is therefore much smaller than the legacy system implied.

## Constraints

- **Single process:** one long-lived Node server if at all possible
- **Single origin:** the backend must serve the frontend directly; no separate dev server in Phase 1
- **Frontend first:** the existing HTML references are the contract, not optional inspiration
- **Low memory:** no always-on brownfield child apps, no request-path heavy workers, no duplicate API surfaces
- **Server-side secrets only:** nothing sensitive in browser storage or shipped bundles
- **Operational simplicity:** one restart command, one Tailscale path, one place to inspect health

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat the current root HTML files as canonical UI references | They already define the dashboard structure the rebuild must serve | Accepted |
| Use one Node server for API plus frontend delivery | This directly addresses the legacy multi-process sprawl | Accepted |
| Prefer static HTML, CSS, and small ES modules in Phase 1 | The first milestone needs delivery stability, not SPA complexity | Accepted |
| Treat copied agent folders as registry source material, not runtimes | The audit found prompt packs and routing docs, not independent services | Accepted |
| Classify programs as `active`, `remote`, `hold`, or `stub` before wiring | The copied tree mixes real apps, remote manifests, placeholders, and heavy holds | Accepted |
| Keep heavy brownfield runtimes off by default | TCG Index and Samlino carry their own frontend stacks and should not bloat the base server | Accepted |

---
*Last updated: 2026-03-12 during Phase 1 planning bootstrap*

# State: Agent Enterprise

## Current Status

**Date:** 2026-03-12
**Status:** Phase 2 executed; ready to plan program contract and trigger wiring

## Confirmed Facts

- The repo contains five dashboard HTML references at the root and they are the canonical frontend contract.
- The repo contains copied agent packets under `agents copy/` and copied program material under `programs/`.
- Most agent folders are prompt and routing metadata, not standalone services.
- Most program folders are either remote manifests, placeholders, or migration holds.
- Two Billy reporting apps are near-duplicates and should converge into one tenant-aware module later.
- The legacy AI-Enterprise stack used split frontend/backend entrypoints and request-path child execution patterns that must not be recreated.
- A single Fastify server now serves `/health`, `/api/meta`, `/api/agents`, `/api/programs`, `/api/system-map`, the bootstrap pages, and the five canonical prototype HTML files.
- Local control-plane state now persists in `.data/control-plane.sqlite`.
- Canonical registries now exist at `agents/registry.json` and `programs/registry.json`, with all Phase 1 agent execution disabled.
- The agent registry now runs on schema version 2 with explicit runtime adapters, enablement state, health expectations, and typed dependency references.
- SQLite now persists `agent_runtime_state`, including per-agent health, adapter, and last-run metadata.
- The control plane now exposes runtime-aware `/api/agents`, `/api/agents/:agentId`, `/health`, and `/api/system-map` responses through one in-process agent manager.
- The first enabled agent set contains four low-risk in-process lanes; two more agents are marked `ready`, three are `blocked`, and two heavy lanes are explicitly `held`.
- `client/pages/agents.html` now renders a live Phase 2 runtime matrix from same-origin APIs without introducing a second frontend runtime.

## Open Risks

- Some brownfield folders still contain their own frontend or scraping stacks and could bloat the base server if booted by accident.
- External connector credentials are referenced in copied docs, but program wiring has not validated them yet and Phase 3 must keep them disabled by default.
- The `tailscale` CLI is not available in this execution environment, so the Tailscale wrapper was verified statically rather than exercised live.
- Terminal verification confirmed the `/agents` route and client contract, but not a browser-rendered visual review of the page.

## Decision Log

### 2026-03-12 - Bootstrap `.planning/` manually
- Reason: `$gsd-plan-phase` could not run because `Agent Enterprise` had no existing `.planning/ROADMAP.md`.
- Outcome: bootstrap the minimal GSD project scaffold and write the Phase 1 planning packet directly in this repo.

### 2026-03-12 - Frontend delivery mode
- Reason: the user wants frontend-first delivery against the existing HTML files while avoiding legacy Vite sprawl.
- Outcome: Phase 1 plans for backend-served static HTML, CSS, and small ES modules. No separate Vite dev server.

### 2026-03-12 - Runtime model
- Reason: the audit found mostly registry metadata and only a few real brownfield runtimes.
- Outcome: treat agents and programs as registries first; runtime adapters become opt-in later phases.

### 2026-03-12 - Brownfield holds
- Reason: `baltzer/TCG-index` and `ian-agency/contexts/samlino/seo-agent-playground` carry their own heavier stacks.
- Outcome: classify them as holds and keep them out of Phase 1 startup.

### 2026-03-12 - Scope root verification away from brownfield tests
- Reason: the first `npm test` run picked up legacy reporting-app tests under `programs/`.
- Outcome: root verification is now scoped to `tests/server/*.test.js` so Phase 1 proves only the new control-plane surface.

### 2026-03-12 - Preserve prototype files as canonical UI
- Reason: the user wants the rebuild to target the existing dashboard rather than replace it.
- Outcome: the server now delivers the original five HTML prototypes directly, while new lightweight `client/pages/` surfaces consume live Phase 1 APIs.

### 2026-03-12 - Phase 2 activation strategy
- Reason: the Phase 1 registry is descriptive but not runtime-capable, and execute-phase wave grouping must stay sequential where dependencies exist.
- Outcome: Phase 2 is planned as three sequential waves: registry/runtime model upgrade, in-process health/adapter layer, then first low-risk agent enablement with operator-facing health reads.

### 2026-03-12 - Phase 2 planning without CONTEXT.md
- Reason: no Phase 2 `CONTEXT.md` existed, but roadmap, requirements, state, and Phase 1 verification already captured the needed constraints.
- Outcome: proceeded with planning directly from the existing project state rather than blocking on discuss-phase.

### 2026-03-12 - Normalize runtime truth before enabling agents
- Reason: raw copied agent packets carried mixed notes and legacy dependency text that could not safely drive runtime policy directly.
- Outcome: introduced registry v2 normalization so routes and health logic consume explicit runtime, enablement, and dependency fields instead of freeform notes.

### 2026-03-12 - Keep Phase 2 activation narrow and dry-run only
- Reason: the project still carries heavy brownfield holds, and the user explicitly wants low memory and one-process operation.
- Outcome: enabled only four low-risk in-process agents, left `engineer` and `platform-reliability-task` as `ready`, and kept heavy or legacy lanes `blocked` or `held`.

### 2026-03-12 - Preserve last-run metadata across health refresh
- Reason: runtime verification exposed that a successful invoke could lose persisted last-run metadata when health state refreshed.
- Outcome: the agent manager now merges prior persisted state into each refresh so run history survives health recomputation and restart.

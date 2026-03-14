# Roadmap: Agent Enterprise

## Overview

Agent Enterprise is a clean-slate rebuild of the legacy agentic system. The rebuild starts with the existing HTML dashboard references plus audited copies of agent and program source material, then turns that input into one lightweight monorepo with one runtime, one origin, and one Tailscale entry point.

The roadmap is intentionally short. It front-loads the minimal delivery foundation, then adds agent wiring, program triggers, and live dashboard behavior in controlled layers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): planned roadmap work
- Decimal phases (2.1, 2.2): urgent insertions if the rebuild uncovers blocking corrections

- [x] **Phase 1: Single-Process Control Plane Bootstrap** - Build the one-process Node foundation, serve the canonical dashboard references, and expose read-only inventory and health routes
- [x] **Phase 2: Agent Registry And Health Wiring** - Normalize agents into runtime-capable registry records and wire enabled agents one by one with health checks
- [ ] **Phase 3: Program Contract And Trigger Wiring** - Classify programs, enable safe connectors, and attach programs to explicit trigger models
- [ ] **Phase 4: Operator Dashboard Live Integration** - Turn the dashboard into a live monitor and invoke surface backed by same-origin APIs and controlled runtime state

## Phase Details

### Phase 1: Single-Process Control Plane Bootstrap
**Goal**: Deliver one Node server that serves health and inventory APIs plus the canonical dashboard references from the same origin, backed by local SQLite state and a documented Tailscale entry path.
**Depends on**: Nothing (first phase)
**Requirements**: [INF-01, INF-02, INF-04, UI-01, UI-02, REG-01, OPS-01, OPS-02, PH1-01]
**Success Criteria** (what must be TRUE):
  1. One long-lived Node process serves `/health`, `/api/meta`, the dashboard routes, and local state without a separate frontend dev server.
  2. The canonical HTML references are reachable through the new delivery path and remain the structural source of truth for the frontend.
  3. Local SQLite state exists for control-plane metadata, inventory snapshots, and restart-safe runtime bookkeeping.
  4. Agents and programs are exposed as read-only inventory data only; no agent execution or heavy brownfield holds start during Phase 1 boot.
  5. A single Tailscale-ready startup path exists and can be verified with one command.
**Plans**: 3 plans

Plans:
- [x] 01-00: Establish the monorepo scaffold, package contract, and validation harness
- [x] 01-01: Build the single Node server, SQLite foundation, and same-origin dashboard delivery
- [x] 01-02: Normalize read-only registries, expose inventory routes, and lock the Tailscale startup path

### Phase 2: Agent Registry And Health Wiring
**Goal**: Convert the audited agent packets into runtime-capable registry records and enable controlled agent execution one capability at a time.
**Depends on**: Phase 1
**Requirements**: [INF-03, REG-01, REG-03, OPS-01, PH2-01]
**Success Criteria** (what must be TRUE):
  1. Agent records include purpose, dependencies, runtime capability tags, and enablement state.
  2. Enabled agents expose health checks and explicit runtime adapters without spawning per-agent servers.
  3. Heavy or legacy agent paths remain disabled and visibly marked instead of auto-starting.
**Plans**: 3 plans

Plans:
- [x] 02-00: Upgrade the registry shape, normalization layer, and persisted agent-state foundation
- [x] 02-01: Build the in-process agent manager, adapter catalog, and health read model
- [x] 02-02: Enable the first low-risk agents and wire the operator-facing health surface

### Phase 3: Program Contract And Trigger Wiring
**Goal**: Classify programs, wire the safe connector layer, and attach explicit trigger models to the programs that are actually active.
**Depends on**: Phase 2
**Requirements**: [REG-02, REG-03, SEC-01, SEC-02, PH3-01]
**Success Criteria** (what must be TRUE):
  1. Every program is classified as `active`, `remote`, `hold`, or `stub`.
  2. Only approved connectors and child-process paths can run, with server-side secret loading and explicit enablement.
  3. Reporting, remote manifests, and other active modules have clear trigger models without inheriting legacy process sprawl.
**Plans**: TBD

### Phase 4: Operator Dashboard Live Integration
**Goal**: Bind the operator dashboard to live same-origin APIs so the interface can monitor, inspect, and invoke governed runtime behavior.
**Depends on**: Phase 3
**Requirements**: [UI-03, OPS-02, PH4-01]
**Success Criteria** (what must be TRUE):
  1. The dashboard pages render live inventory, health, and run-state data from the single server.
  2. Operator flows can inspect and invoke governed actions without leaving the same-origin interface.
  3. Live updates do not depend on a second dev server or a fleet of background workers.
**Plans**: TBD

# Requirements: Agent Enterprise

**Defined:** 2026-03-12
**Core Value:** Operate the portfolio through one low-memory, restartable control plane that is readable, auditable, and reachable through one Tailscale entry point.

## Foundation And Architecture

- [x] **INF-01**: One long-lived backend process serves API routes, frontend assets, and orchestration metadata from the same origin
- [x] **INF-02**: One Tailscale entry point and one restart command bring the full Phase 1 system online
- [x] **INF-03**: No agent or program gets a dedicated long-lived runtime unless explicitly activated later
- [x] **INF-04**: Control-plane state is stored locally in SQLite while business data remains in native external systems

## Frontend Delivery

- [x] **UI-01**: `01-agent-overview.html` through `05-agent-chat.html` remain the canonical structural contract for the operator UI
- [x] **UI-02**: Phase 1 frontend delivery uses backend-served static HTML, CSS, and small ES modules instead of a separate Vite SPA
- [ ] **UI-03**: The dashboard can render live inventory and health data from same-origin JSON endpoints without browser-side secrets

## Registry And Runtime Modeling

- [x] **REG-01**: Copied agent markdown packets are normalized into registry records and capability tags, not treated as standalone runtimes
- [ ] **REG-02**: Programs are classified as `active`, `remote`, `hold`, or `stub` before connector or execution work begins
- [x] **REG-03**: Runtime execution adapters are opt-in and capability-based rather than implied by folder presence

## Operations And Security

- [x] **OPS-01**: `/health`, `/api/meta`, `/api/agents`, `/api/programs`, and `/api/system-map` exist before any agent execution is enabled
- [x] **OPS-02**: Logs, state, registry snapshots, and last-run metadata survive restart in local storage
- [ ] **SEC-01**: Secrets stay server-side, namespaced by integration, and never ship in browser storage or bundles
- [ ] **SEC-02**: High-risk connectors, child processes, and brownfield holds stay disabled unless explicitly enabled

## Delivery Phases

- [x] **PH1-01**: Phase 1 delivers the minimal single-process server and Tailscale entry point without agent execution
- [x] **PH2-01**: Phase 2 wires agents incrementally with health checks and explicit runtime adapters
- [ ] **PH3-01**: Phase 3 connects programs to trigger models, connector policies, and execution boundaries
- [ ] **PH4-01**: Phase 4 makes the dashboard monitor, inspect, and invoke live routes from the same origin

## Out Of Scope

| Feature | Reason |
|---------|--------|
| Rebuilding the legacy multi-process AI-Enterprise topology | Directly conflicts with the new single-process constraint |
| Starting TCG Index scraping or Samlino frontend stacks during Phase 1 boot | They are brownfield holds, not foundation runtime requirements |
| Browser-side secret management or bundle-injected tokens | Rejected by the security model |
| Agent execution in Phase 1 | Phase 1 is a delivery and registry foundation, not an execution milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INF-01 | Phase 1 | Completed |
| INF-02 | Phase 1 | Completed |
| INF-03 | Phase 2 | Completed |
| INF-04 | Phase 1 | Completed |
| UI-01 | Phase 1 | Completed |
| UI-02 | Phase 1 | Completed |
| UI-03 | Phase 4 | Planned |
| REG-01 | Phase 1 | Completed |
| REG-02 | Phase 3 | Planned |
| REG-03 | Phase 2 | Completed |
| OPS-01 | Phase 1 | Completed |
| OPS-02 | Phase 1 | Completed |
| SEC-01 | Phase 3 | Planned |
| SEC-02 | Phase 3 | Planned |
| PH1-01 | Phase 1 | Completed |
| PH2-01 | Phase 2 | Completed |
| PH3-01 | Phase 3 | Planned |
| PH4-01 | Phase 4 | Planned |

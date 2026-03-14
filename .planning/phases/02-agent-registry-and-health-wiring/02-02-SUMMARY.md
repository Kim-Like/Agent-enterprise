---
phase: 02-agent-registry-and-health-wiring
plan: 02
subsystem: ui
tags: ["agents", "ui", "runtime", "enablement", "delivery"]
requires:
  - phase: 02-01
    provides: agent manager, runtime catalog, runtime-aware health and route surface
provides:
  - first low-risk enabled agent set
  - per-agent detail read model
  - operator-facing runtime matrix on the agents page
affects: ["phase-3-program-wiring", "phase-4-operator-dashboard"]
tech-stack:
  added: []
  patterns:
    [
      "first activation set stays narrow and explicit",
      "operator-facing runtime truth comes from same-origin APIs",
      "held and blocked agents remain visible without auto-starting"
    ]
key-files:
  created:
    [
      "tests/server/agent-runtime.test.js"
    ]
  modified:
    [
      "agents/registry.json",
      "server/src/lib/agent-manager.js",
      "server/src/routes/agents.js",
      "server/src/routes/meta.js",
      "server/src/routes/system-map.js",
      "client/pages/agents.html"
    ]
key-decisions:
  - "Limit the first enabled set to low-risk governance and internal lanes instead of enabling every copied agent packet."
  - "Expose enablement and health detail through the operator UI without adding a mutation route or background worker."
patterns-established:
  - "Ready agents can be surfaced before they become invokable."
  - "The operator UI shows held and blocked reasons directly from runtime policy metadata."
requirements-completed: [INF-03, OPS-01, PH2-01]
duration: manual execution session
completed: 2026-03-12
---

# Phase 2 Plan 02 Summary

**First controlled agent activation set with per-agent runtime detail and a live operator-facing health matrix**

## Performance

- **Duration:** manual execution session
- **Started:** 2026-03-12 manual execute-phase fallback
- **Completed:** 2026-03-12T09:41:09Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Enabled the first low-risk agent set while keeping heavy and legacy lanes explicitly ready, blocked, or held.
- Added `/api/agents/:agentId` detail reads so operator tooling can inspect runtime truth for a single agent.
- Rebuilt `client/pages/agents.html` into a Phase 2 runtime matrix that shows enablement, health, runtime adapter, dependencies, and policy flags.

## Task Commits

`Agent Enterprise` is not initialized as a git repository, so the normal atomic-commit chain could not run. Task completion was tracked through passing tests and live route verification instead.

## Files Created/Modified

- `agents/registry.json` - defines the first explicit enabled, ready, blocked, and held agent states
- `server/src/lib/agent-manager.js` - preserves persisted run metadata while refreshing health and enablement state
- `server/src/routes/agents.js` - adds per-agent detail reads and runtime-aware list summaries
- `server/src/routes/meta.js` - exposes agent enablement and health inventory to the control-plane metadata surface
- `server/src/routes/system-map.js` - reports adapter coverage and brownfield hold breakdowns
- `client/pages/agents.html` - live Phase 2 agent matrix for the same-origin dashboard
- `tests/server/agent-runtime.test.js` - verifies first enablement, hold enforcement, runtime detail reads, and page contract

## Decisions Made

- Limited Phase 2 activation to `ian-master`, `data-observability-task`, `automation-quality-task`, and `portfolio-pmo-task`; `engineer` and `platform-reliability-task` stay ready but not invokable yet.
- Kept heavy lanes such as `baltzer-tcg-index-task` and `samlino-seo-agent-task` visibly held rather than silently disabled.

## Deviations from Plan

### Auto-fixed Issues

**1. Health refresh was clearing persisted last-run metadata after successful invocation**
- **Found during:** Task 3 (runtime verification)
- **Issue:** `agentManager.refreshAll()` rewrote agent state after each invocation without preserving `lastRunAt` and `details.lastRun`, so the runtime verification could not prove restart-safe run history.
- **Fix:** Merged prior persisted state back into the refresh write path before storing new health data.
- **Files modified:** `server/src/lib/agent-manager.js`
- **Verification:** `npm test`

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Correctness fix only. It strengthened the Phase 2 persistence guarantee without changing scope.

## Issues Encountered

- Terminal verification could confirm the `/agents` route and live API payloads, but not a browser-rendered visual review of the page.

## User Setup Required

None - the first enabled set uses in-process dry-run handlers only.

## Next Phase Readiness

Phase 3 can now attach program trigger contracts to a real runtime surface with explicit enablement, truthful health, and an operator-facing agent matrix already in place.

---
*Phase: 02-agent-registry-and-health-wiring*
*Completed: 2026-03-12*

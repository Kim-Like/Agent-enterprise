---
phase: 02-agent-registry-and-health-wiring
plan: 00
subsystem: registry
tags: ["registry", "sqlite", "agents", "normalization", "testing"]
requires:
  - phase: 01-02
    provides: canonical agent inventory, read-only inventory routes, local startup contract
provides:
  - registry v2 contract with explicit runtime and enablement fields
  - normalized agent registry loader for the control plane
  - persisted SQLite state for per-agent health and last-run metadata
affects: ["02-01", "02-02", "phase-3-program-wiring"]
tech-stack:
  added: []
  patterns:
    [
      "registry normalization before runtime policy",
      "sqlite-backed agent runtime state",
      "machine-readable enablement and hold policy"
    ]
key-files:
  created:
    [
      "server/src/lib/agent-registry.js",
      "tests/server/support.js",
      "tests/server/agent-registry.test.js"
    ]
  modified:
    [
      "agents/registry.json",
      "server/src/db/init.js",
      "server/src/app.js",
      "tests/server/bootstrap.test.js"
    ]
key-decisions:
  - "Keep agent activation explicit through registry metadata instead of inferring execution from copied folders."
  - "Persist agent runtime state in the existing SQLite database rather than introducing a second state store."
patterns-established:
  - "Registry records normalize runtime, enablement, health, and typed dependency references before route logic consumes them."
  - "Brownfield-heavy agents can remain visible through held or blocked states without becoming runnable."
requirements-completed: [REG-01, REG-03]
duration: manual execution session
completed: 2026-03-12
---

# Phase 2 Plan 00 Summary

**Registry v2 with normalized runtime metadata, typed dependency refs, and persisted SQLite agent state**

## Performance

- **Duration:** manual execution session
- **Started:** 2026-03-12 manual execute-phase fallback
- **Completed:** 2026-03-12T09:41:09Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Upgraded `agents/registry.json` into a Phase 2 contract with explicit enablement, runtime adapters, health expectations, and typed dependencies.
- Added the normalization layer that converts the raw registry into safe runtime-capable records before the server boots routes or health logic.
- Extended the existing SQLite store with `agent_runtime_state` so per-agent health and last-run metadata survive restart.

## Task Commits

`Agent Enterprise` is not initialized as a git repository, so the normal atomic-commit chain could not run. Task completion was tracked through passing tests and direct file verification instead.

## Files Created/Modified

- `agents/registry.json` - upgraded to schema version 2 with runtime policy, dependency aliases, and explicit agent overrides
- `server/src/lib/agent-registry.js` - normalizes raw registry records into the Phase 2 runtime model
- `server/src/db/init.js` - adds persisted per-agent runtime state helpers in the existing SQLite database
- `server/src/app.js` - boots the app with the normalized agent registry
- `tests/server/support.js` - shared app bootstrap helper for the expanded server test suite
- `tests/server/agent-registry.test.js` - locks registry normalization and persisted state behavior

## Decisions Made

- Kept the registry as the single source of truth for enablement and hold policy so copied folders still cannot imply live execution.
- Stored runtime state in the Phase 1 SQLite file to preserve the one-process and one-state-store boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. Bootstrap test import gap after the shared test harness refactor**
- **Found during:** Task 3 (Wave 0 registry contract verification)
- **Issue:** `tests/server/bootstrap.test.js` referenced `path.join(...)` without importing `node:path`, which caused the full suite to fail once the shared support helper was in place.
- **Fix:** Restored the missing `node:path` import so the Phase 1 bootstrap contract continues to verify alongside the new Phase 2 registry tests.
- **Files modified:** `tests/server/bootstrap.test.js`
- **Verification:** `npm test`

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Necessary test-harness repair only. No scope creep.

## Issues Encountered

- The repo is still not a git repository, so summary bookkeeping remained manual.

## User Setup Required

None - no external service configuration was required for registry normalization.

## Next Phase Readiness

The server now has a normalized runtime-capable agent model and persisted per-agent state, so the adapter catalog and health manager can build on stable inputs rather than raw inventory notes.

---
*Phase: 02-agent-registry-and-health-wiring*
*Completed: 2026-03-12*

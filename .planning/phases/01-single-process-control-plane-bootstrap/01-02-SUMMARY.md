---
phase: 01-single-process-control-plane-bootstrap
plan: 02
subsystem: registry
tags: [registry, agents, programs, tailscale, operations]
requires:
  - phase: 01-01
    provides: same-origin server, sqlite state, route layer
provides:
  - canonical agent and program registry files
  - read-only inventory and system-map APIs
  - local and tailscale startup scripts
affects: [phase-2-agent-wiring, phase-3-program-wiring, phase-4-operator-dashboard]
tech-stack:
  added: [json-registry-models, bash-startup-contracts]
  patterns:
    [
      inventory-before-execution,
      classification-first program modeling,
      one-command runtime operations
    ]
key-files:
  created:
    [
      agents/registry.json,
      programs/registry.json,
      server/src/routes/agents.js,
      server/src/routes/programs.js,
      server/src/routes/system-map.js,
      scripts/start.sh,
      scripts/tailscale-serve.sh,
      tests/server/registry.test.js
    ]
  modified: []
key-decisions:
  - "Keep every agent runtime disabled in Phase 1 and expose them only as inventory."
  - "Classify programs as active, remote, hold, or stub before enabling connectors or child processes."
patterns-established:
  - "Brownfield holds are visible to the dashboard but inert at startup."
  - "Operational boot paths are expressed as repo-owned scripts rather than tribal shell history."
requirements-completed: [INF-02, REG-01, OPS-01, PH1-01]
duration: 38min
completed: 2026-03-12
---

# Phase 1 Plan 02 Summary

**Read-only agent and program registries with inventory APIs, system map output, and one-command startup scripts**

## Performance

- **Duration:** 38 min
- **Started:** 2026-03-12T08:10:00Z
- **Completed:** 2026-03-12T08:47:59Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Normalized 42 agent packets and 21 program modules into canonical JSON registries.
- Added `/api/agents`, `/api/programs`, and `/api/system-map` as read-only Phase 1 inventory endpoints.
- Added `scripts/start.sh` and `scripts/tailscale-serve.sh` to make local boot and Tailscale serving explicit.

## Task Commits

`Agent Enterprise` is not initialized as a git repository, so the normal atomic-commit chain could not run. Task completion was tracked through passing tests and live boot verification instead.

## Files Created/Modified

- `agents/registry.json` - canonical normalized agent inventory
- `programs/registry.json` - canonical normalized program inventory
- `server/src/routes/agents.js` - read-only agent API
- `server/src/routes/programs.js` - read-only program API
- `server/src/routes/system-map.js` - aggregated runtime and inventory system map
- `scripts/start.sh` - single-command local boot
- `scripts/tailscale-serve.sh` - single-command Tailscale serve wrapper
- `tests/server/registry.test.js` - inventory and system-map verification

## Decisions Made

- Collapsed mergeable and heavy-risk findings into metadata flags instead of letting those packets imply live runtimes.
- Chose `tailscale serve --bg --https=<port> http://127.0.0.1:<port>` syntax in the wrapper to keep Tailscale integration explicit and local-loopback only.

## Deviations from Plan

### Auto-fixed Issues

**1. Tailscale CLI could not be executed in this environment**
- **Found during:** Task 3 (startup script verification)
- **Issue:** `tailscale` is not installed in the execution environment, so the serve wrapper could not be run end-to-end here.
- **Fix:** Verified the local boot path live, added a startup-script test, and left the Tailscale wrapper ready for execution on the target machine.
- **Files modified:** `scripts/tailscale-serve.sh`, `tests/server/bootstrap.test.js`
- **Verification:** `npm test`, live `./scripts/start.sh` plus `curl http://127.0.0.1:3000/health`

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Minor verification gap only. The local runtime path is fully validated; Tailscale execution remains machine-dependent.

## Issues Encountered

- The execution environment did not include the `tailscale` CLI, so only static verification of that wrapper was possible here.

## User Setup Required

If Tailscale is installed on the target machine, run `./scripts/tailscale-serve.sh` to bind the control plane to a served HTTPS port.

## Next Phase Readiness

Phase 2 can now wire agent health and enablement against canonical registry records without changing the startup contract.

---
*Phase: 01-single-process-control-plane-bootstrap*
*Completed: 2026-03-12*

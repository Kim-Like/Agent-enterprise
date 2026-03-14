# Phase 2 Research: Agent Registry And Health Wiring

## Current Baseline

- Phase 1 created a single Fastify control plane with one SQLite file and read-only inventory routes.
- `agents/registry.json` currently exposes 42 agents with good descriptive metadata, but it is still a static Phase 1 inventory model.
- Every agent record is hard-coded to `runtime.executionEnabled: false`, and there is no runtime adapter catalog, agent manager, or agent-specific health model yet.
- `server/src/app.js` loads registries at boot and registers only global routes. There is no current extension point for per-agent state beyond the raw registry payload.
- `/api/agents` currently returns the registry almost verbatim. `/api/system-map` aggregates counts, but it cannot distinguish `disabled`, `ready`, `degraded`, or `enabled` agents.

## What Phase 2 Must Add

### Registry V2 Shape

Phase 2 should turn the current descriptive registry into a runtime-capable registry without implying automatic execution.

Minimum fields still missing from each agent record:

- `enablement.state`
  - `registry_only`
  - `disabled`
  - `ready`
  - `degraded`
  - `enabled`
- `enablement.reason`
  - explicit explanation for why an agent is disabled or held
- `runtime.adapter`
  - one adapter identifier rather than a loose mode string
- `runtime.entry`
  - path or function target the adapter resolves
- `runtime.invocation`
  - `manual`, `event`, `scheduled`, or `none`
- `dependencies.agents`
  - upstream agent dependencies
- `dependencies.connectors`
  - external systems or secrets required for healthy readiness
- `health.probes`
  - the checks the server can run without doing real work
- `health.expected`
  - success criteria or degraded states
- `policy.hold`
  - explicit brownfield/legacy hold flag
- `policy.allowChildProcess`
  - default false, opt-in only

The current `mergeCandidate` and `heavyDependencyRisk` flags are useful, but they are advisory. Phase 2 needs machine-actionable runtime and health fields.

### In-Process Agent Manager

Add one internal agent manager layer in the Node server. Do not add per-agent servers or resident workers.

The manager should own:

- loading and validating the registry
- building runtime-capable views from static records
- computing readiness and health
- exposing aggregate and per-agent read models
- optionally invoking only agents explicitly marked `enabled`

Keep it in-process and synchronous where possible. Child processes, if allowed later, must remain short-lived and opt-in.

### Runtime Adapter Catalog

Phase 2 should introduce an explicit adapter catalog rather than special-casing agents inside routes.

Recommended initial adapters:

- `registry-only`
  - always non-executable, health derived from metadata completeness
- `in-process-function`
  - calls a local function exported by the server codebase
- `connector-probe`
  - non-executing adapter that only validates config and external reachability assumptions
- `child-process`
  - declared but disabled by default; used only when an agent explicitly opts in later

The adapter contract should support:

- `describe(agent)`
- `checkHealth(agent, context)`
- `canInvoke(agent, context)`
- `invoke(agent, payload, context)` (optional in Phase 2 for the few enabled agents)

### Health Model

Health checks should prove readiness, not perform work.

Recommended health dimensions:

- registry completeness
- adapter availability
- required environment presence
- connector configuration presence
- dependency agent readiness
- hold/legacy policy state

Expose both aggregate and per-agent views:

- enrich `/api/agents` with `enablement` and `healthSummary`
- add a detail route such as `/api/agents/:id`
- optionally add `/api/agents/:id/health` if the detail route becomes too large

Health status vocabulary should stay small:

- `healthy`
- `degraded`
- `blocked`
- `disabled`
- `held`

### Persistence Model

Reuse the existing SQLite file.

Phase 2 likely needs persisted tables for:

- agent enablement overrides
- last successful health check per agent
- last error per agent
- last invocation metadata for enabled agents

Do not add a queue yet. Persist only the metadata needed to survive restart and make the dashboard honest.

## Sensible Activation Order

Do not enable every agent in Phase 2. Start with low-risk orchestrators that mostly validate internal metadata.

Recommended first wave:

1. `engineer`
2. `ian-master`
3. `artisan-master`
4. `lavprishjemmeside-master`

Recommended second wave:

5. `baltzer-master`
6. `portfolio-pmo-task`
7. `data-observability-task`

Keep these disabled but visible:

- `father`
  - still better treated as a governance root until invoke flows exist
- `samlino-seo-agent-task`
  - tied to a brownfield hold
- `baltzer-tcg-index-task`
  - depends on a heavy scrape stack
- placeholder-driven tasks such as `baltzer-events-task` and `baltzer-workforce-salary-task`

## Codebase Extension Points

The current Phase 1 structure suggests these likely file targets:

- `server/src/app.js`
  - inject the future agent manager and new routes
- `server/src/routes/agents.js`
  - move from raw registry output to health-aware read models
- `server/src/routes/system-map.js`
  - report enabled/disabled/held counts and adapter coverage
- `agents/registry.json`
  - upgrade records to runtime-capable shape

New modules are likely warranted:

- `server/src/lib/agent-registry.js`
- `server/src/lib/agent-health.js`
- `server/src/lib/agent-state.js`
- `server/src/runtimes/*.js`
- `tests/server/agent-registry.test.js`
- `tests/server/agent-health.test.js`
- `tests/server/agent-runtime.test.js`

## Common Pitfalls

- Treating folder presence as proof that an agent is executable
- Letting health checks perform connector writes or expensive work
- Enabling parent and child agents without explicit dependency semantics
- Auto-starting child processes during server boot
- Mixing program-level connector state into agent health without a clear boundary
- Upgrading the registry shape without migration helpers for existing Phase 1 JSON

## Validation Architecture

- Keep the Phase 2 test harness on `node:test` and Fastify injection.
- Add focused tests for:
  - registry normalization and validation
  - enablement gating
  - adapter selection
  - health aggregation
  - per-agent detail routes
- Preserve the root `npm test` contract and keep brownfield program tests out of scope.
- Add manual verification only for connector-dependent health checks when secrets are intentionally absent.

## Code Examples

### Runtime-capable agent shape

```json
{
  "id": "engineer",
  "enablement": {
    "state": "ready",
    "reason": "local adapter available"
  },
  "runtime": {
    "adapter": "in-process-function",
    "entry": "server/src/runtimes/engineer.js",
    "invocation": "manual"
  },
  "health": {
    "probes": ["registry", "adapter", "env"],
    "expected": "healthy"
  }
}
```

### Adapter contract

```js
export function createAdapterCatalog() {
  return {
    "registry-only": {
      canInvoke: () => false,
      checkHealth(agent) {
        return { status: "disabled", checks: ["metadata-only"] };
      },
    },
  };
}
```

## Confidence

- **High**: keep one process, add an in-process agent manager, use adapter IDs instead of implicit runtime behavior
- **Medium**: exact first enabled agents and exact route surface for per-agent health
- **Medium**: how much Phase 2 should persist invocation metadata versus deferring that to Phase 3

# Phase 2 Verification

## Scope

Phase 2 was verified against the implemented agent registry v2 contract, in-process runtime manager, runtime-aware health routes, first-agent enablement set, and the operator-facing agents page contract.

## Checks Run

- `npm test`
  - Result: pass
  - Coverage: bootstrap structure, env loading, startup scripts, delivery, registry normalization, persisted agent state, health evaluation, runtime adapters, enablement gating, per-agent detail routes, system map
- `./scripts/start.sh`
  - Result: pass
  - Follow-up: `curl http://127.0.0.1:3000/health`
  - Response: `status=ok`, `agents=42`, `programs=21`, `enabled=4`, `ready=2`, `blocked=3`, `held=2`, `invokable=4`
- `curl http://127.0.0.1:3000/api/agents/ian-master`
  - Result: pass
  - Evidence: `health.status=healthy`, `runtime.adapter=in-process-function`, `invocation.available=true`
- `curl http://127.0.0.1:3000/agents`
  - Result: pass
  - Evidence: same-origin Phase 2 agents page is served with the runtime-matrix UI contract

## Requirement Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| `INF-03` | Complete | No dedicated long-lived runtime was added; all adapters run inside the existing Node process |
| `REG-03` | Complete | Runtime adapters are explicit registry metadata and catalog entries, not implied by folder presence |
| `OPS-01` | Complete | Existing health and agent routes now expose runtime-aware truth, including per-agent detail reads |
| `PH2-01` | Complete | Phase 2 delivered incremental agent wiring, health checks, and a first controlled enablement set |

## Residual Risk

- External program connectors are still intentionally disabled or unverified; Phase 3 must keep those boundaries explicit.
- Heavy brownfield holds remain present in the registry and should stay out of startup until their execution policy is implemented.
- Terminal verification confirmed the `/agents` route and API contract, but not a browser-rendered visual review of the page.
- The `tailscale` CLI is still unavailable in this environment, so the Phase 1 Tailscale wrapper remains statically verified only.

## Conclusion

Phase 2 is complete. The control plane now has a normalized runtime-capable agent registry, persisted health and last-run state, an in-process adapter catalog, a first safe enabled set, and an operator-facing agent matrix that reports real enablement and health from same-origin APIs.

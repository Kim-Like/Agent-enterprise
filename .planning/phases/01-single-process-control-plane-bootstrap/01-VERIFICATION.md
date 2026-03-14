# Phase 1 Verification

## Scope

Phase 1 was verified against the implemented single-process control plane, inventory APIs, local SQLite state, and startup scripts.

## Checks Run

- `npm test`
  - Result: pass
  - Coverage: bootstrap structure, env loading, startup script contract, health/meta delivery, page delivery, agent inventory, program classification, system map
- `./scripts/start.sh`
  - Result: pass
  - Follow-up: `curl http://127.0.0.1:3000/health`
  - Response: `status=ok`, `mode=single-process-control-plane`, `agents=42`, `programs=21`

## Requirement Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| `INF-01` | Complete | One Fastify server serves pages and APIs from the same origin |
| `INF-02` | Complete with Tailscale caveat | `scripts/start.sh` verified live, `scripts/tailscale-serve.sh` verified statically because `tailscale` CLI is unavailable here |
| `INF-04` | Complete | Local SQLite state at `.data/control-plane.sqlite` |
| `UI-01` | Complete | Canonical `01` through `05` HTML prototypes are served directly |
| `UI-02` | Complete | No Vite or second frontend process was added |
| `REG-01` | Complete | `agents/registry.json` and `programs/registry.json` normalize the copied source material |
| `OPS-01` | Complete | `/health`, `/api/meta`, `/api/agents`, `/api/programs`, `/api/system-map` exist |
| `OPS-02` | Complete | Runtime metadata and registry snapshots persist in local SQLite |
| `PH1-01` | Complete | Minimal single-process server and startup contract delivered without agent execution |

## Residual Risk

- Tailscale serve could not be executed in this environment because the `tailscale` CLI is missing.
- Brownfield program folders still contain their own legacy dependencies and test suites; the root package now avoids pulling them into Phase 1 verification, but Phase 2 should keep that boundary explicit.

## Conclusion

Phase 1 is complete. The new repo now has one backend process, one test scope, one local state store, one read-only inventory model, and one local startup path. Tailscale runtime validation should be performed on the target machine that actually has the CLI installed.

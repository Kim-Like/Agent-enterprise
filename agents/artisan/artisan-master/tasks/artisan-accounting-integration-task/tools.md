# Artisan Accounting Integration Task - Tools

## Primary Tooling
- Artisan reporting app code in `programs/artisan/reporting.theartisan.dk`.
- Billy API credentials and integration endpoints (no secret leakage in repo).
- SQLite/FastAPI control-plane APIs for queueing, status, and error capture.

## Control Plane and Verification
- FastAPI endpoints: `/api/tasks`, `/api/errors`, `/api/system-map`, `/api/datastores/verify`.
- Runtime health checks: `/health` and `/api/meta/runtime`.
- Local/Tailscale access: `http://localhost:8001` and `http://100.96.78.62:8001`.

## Security and Reliability Guardrails
- Never hardcode secrets; rely on `.env` and environment injection.
- Validate queue context keys: `program_id`, `scope_path`, `acceptance_criteria`, `dependencies`, `constraints`, `handoff_to`.
- Escalate cross-domain security/reliability incidents to Engineer with error-log traceability.

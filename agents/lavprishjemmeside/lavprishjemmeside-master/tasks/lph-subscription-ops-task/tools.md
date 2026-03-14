# LPH Subscription Ops Task - Tools

## Primary Tooling
- Client subscription scope under `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/ljdesignstudio.dk`
- MySQL-backed reporting queries with safe aggregation boundaries
- `programs/lavprishjemmeside/PROJECT_CONTEXT.md` and `programs/lavprishjemmeside/CHANGELOG.md`

## Control Plane and Verification
- `/health`
- `/api/meta`
- `/api/system-map`
- `/api/programs`
- `/api/tasks/intake`
- `/api/tasks/:taskId`
- local control-plane origin: `http://127.0.0.1:3000`
- remote estate checks: `npm run lavpris:inventory`, `npm run lavpris:health`, `npm run lavpris:repo-status`

## Security and Reliability Guardrails
- Never hardcode secrets; rely on `.env` and environment injection.
- Keep client reporting and subscription operations within safe aggregation boundaries.
- If the task changes client-management behavior or reporting workflow, update `programs/lavprishjemmeside/CHANGELOG.md` before handoff.
- Escalate cross-domain security or runtime incidents to Engineer with concrete evidence.

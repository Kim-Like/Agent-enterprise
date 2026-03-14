# LPH Ads Dashboard Task - Tools

## Primary Tooling
- Ads dashboard scope under `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/lavprishjemmeside.dk`
- Connector jobs and transformation logic for ads APIs
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
- Separate connector reliability from reporting-layer interpretation.
- If the task changes ads-facing product behavior or operator workflow, update `programs/lavprishjemmeside/CHANGELOG.md` before handoff.
- Escalate cross-domain security or runtime incidents to Engineer with concrete evidence.

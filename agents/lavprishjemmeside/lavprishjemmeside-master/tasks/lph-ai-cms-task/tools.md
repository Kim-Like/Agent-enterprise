# LPH AI CMS Task - Tools

## Primary Tooling
- Lavprishjemmeside codebase in `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/lavprishjemmeside.dk`
- cPanel MySQL access patterns and environment-bound credentials
- `programs/lavprishjemmeside/PROJECT_CONTEXT.md` and `programs/lavprishjemmeside/CHANGELOG.md`

## Control Plane and Verification
- `/health`
- `/api/meta`
- `/api/system-map`
- `/api/programs`
- `/api/tasks/intake`
- `/api/tasks/:taskId`
- local control-plane origin: `http://127.0.0.1:3000`
- remote estate checks: `npm run lavpris:preflight`, `npm run lavpris:health`, `npm run lavpris:repo-status`

## Security and Reliability Guardrails
- Never hardcode secrets; rely on `.env` and environment injection.
- Treat cPanel MySQL as the application source of truth and Agent Enterprise SQLite as orchestration-only state.
- If the task changes CMS behavior, publish workflow, or operator contract, update `programs/lavprishjemmeside/CHANGELOG.md` before handoff.
- Escalate cross-domain security or runtime incidents to Engineer with concrete evidence.

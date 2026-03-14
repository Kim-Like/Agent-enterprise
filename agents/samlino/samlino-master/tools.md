# Samlino Master - Tools

## Domain Tooling
- Program workspace: `programs/ian-agency/contexts/samlino/seo-agent-playground`
- Runtime modules: `runtime/schema_runtime.py`, `runtime/audit_runtime.py`, `runtime/prototyper_runtime.py`
- Datastore: `programs/ian-agency/contexts/samlino/seo-agent-playground/data/samlino.db`

## Samlino APIs
- `GET /api/programs/samlino-seo-agent-playground/inventory`
- `GET /api/programs/samlino-seo-agent-playground/functions`
- `POST /api/programs/samlino-seo-agent-playground/ops-action`
- `POST /api/samlino/schema/generate`
- `GET /api/samlino/schema/history`
- `POST /api/samlino/audits/{project_slug}/upload/pages`
- `POST /api/samlino/audits/{project_slug}/upload/links`
- `POST /api/samlino/audits/{project_slug}/upload/keywords`
- `GET /api/samlino/audits/{project_slug}/snapshot`
- `POST /api/samlino/prototyper/generate`
- `POST /api/samlino/prototyper/insert`

## Core Contract Interfaces
- `POST /api/tasks/{task_id}/delegate`
- `POST /api/tasks/{task_id}/result`
- `POST /api/tasks/{task_id}/escalate`

## Guardrails
- Keep Samlino write actions allowlisted through `samlino_ops_actions.json`.
- Do not reintroduce legacy standalone backend runtime.
- Keep telemetry complete for orchestrator decisions.

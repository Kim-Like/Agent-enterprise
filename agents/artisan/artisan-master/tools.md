# Artisan Master - Tools

## Domain Tooling
- WordPress codebase and child theme under `programs/artisan/the-artisan-wp`
- Reporting application under `programs/artisan/reporting.theartisan.dk`
- Dedicated reporting cPanel MySQL datastore (`ARTISAN_REPORTING_DB_*`)
- Brevo campaign/contact tooling and responsive email QA workflow
- Billy API integration surfaces for accounting sync
- cPanel Git deployment controls and MySQL operational checks

## Control Plane Tooling
- Task orchestration via `/api/tasks` and `/api/execute`
- Error triage via `/api/errors` and engineer escalation routes
- Registry/context visibility via `/api/system-map` and workspace APIs
- WordPress inventory and diagnostics:
  - `GET /api/programs/artisan-wordpress/inventory`
  - `POST /api/programs/artisan-wordpress/ssh-check`
  - `POST /api/programs/artisan-wordpress/ops-action` (write authorized)
- Daily intake classification:
  - `POST /api/workspace/artisan/intake-classify`

## Guardrails
- Keep business data in native app datastores; do not mirror sensitive data into orchestration DB.
- Preserve deterministic ownership and queue context contracts.
- Use controlled SSH operations only; no free-form shell execution in master workflows.

## Delegation vNext Interfaces
- `POST /api/tasks/{task_id}/delegate` for specialist assignment with structured mission payloads.
- `POST /api/tasks/{task_id}/result` for structured specialist completion packets.
- `POST /api/tasks/{task_id}/escalate` for blocked-task escalation with engineer takeover.
- `specialist_invocations` as mandatory decision telemetry.
- `task_result_packets` and `task_escalations` as lifecycle evidence stores.


## Warn-Only Contract Governance
- Contract enforcement is permanent warn-only (`ORCH_CONTRACT_MODE=warn_only`).
- Use `backend/system/orchestration_policy.py` helpers for boundary, warning, and observability logic.
- Include boundary/model/warning metadata in telemetry decision envelopes.
- Never reject tasks solely because optional orchestration contract fields are absent.

## Model and Context Control Interfaces

- `GET /api/models/catalog?agent_id={agent_id}`
- `PATCH /api/models/agents/{agent_id}` (admin)
- `PATCH /api/chat/threads/{thread_id}/model`
- `GET /api/chat/threads/{thread_id}/context-usage`
- `POST /api/chat/threads/{thread_id}/context-refresh`

Policy reminders:

- `opus_46` is engineer-only.
- `haiku_30` is disabled.
- fallback profile is `sonnet_46`.

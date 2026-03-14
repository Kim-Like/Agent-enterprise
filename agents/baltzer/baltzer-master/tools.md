# Baltzer Master - Tools

## Domain Tooling
- Shopify workspace in `programs/baltzer/shopify`
- TCG index migration-hold contract in `programs/baltzer/TCG-index`
- Event module path in `programs/baltzer/event-management-platform`
- Workforce module path in `programs/baltzer/employee-schedule-salary-api`
- Reporting/accounting app in `programs/baltzer/reporting.baltzergames.dk`

## Control Plane and Ops
- Queue/error visibility through `/api/tasks`, `/api/errors`, and workspace chat
- Datastore checks through `/api/datastores/verify`
- Runtime health via `/health` and `/api/meta/runtime`

## Guardrails
- Preserve Shopify/source-system truth; orchestration DB stores control state only.
- Escalate systemic reliability and security issues to Engineer.

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

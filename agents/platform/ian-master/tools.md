# IAn Master - Tools

## Governance Tooling
- `task_queue` for portfolio planning and execution tracking
- `error_log` for blocker ownership and incident accountability
- `execution_history` for throughput and quality trend analysis
- Workspace overview and system-map APIs for control-plane observability

## Operating Interfaces
- `/api/tasks`, `/api/errors`, `/api/agents`, `/api/system-map`, `/api/workspace/system-overview`
- Weekly review templates and program registry manifests under `README/`

## Guardrails
- No objective remains unowned.
- All cross-domain dependencies must be explicit and time-bounded.

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

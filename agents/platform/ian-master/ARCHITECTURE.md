# IAn Master Architecture

Parent: `father`

## Owned Program ID

- `ian-control-plane`

## Task Agents

- `ian-research-task`
- `ian-implementation-task`
- `portfolio-pmo-task`
- `automation-quality-task`

## Core Responsibility

Provide governance and standards for all masters while preserving deterministic control-plane behavior.


## Warn-Only Governance
- Boundary planning and overlap detection are contract-driven using the shared orchestration policy module.
- Contract violations are warnings, not blockers; orchestration remains autonomous.
- Structured result/escalation packets are mandatory interface targets for specialists.
- Operational diagnostics are triaged by `correlation_id` in telemetry and queue records.

## Claude Runtime Policy

- Use model profiles through policy-aware controls (`/api/models/catalog`, thread-level model override).
- Masters are not permitted to run `opus_46`; denied requests fall back to `sonnet_46` with warnings.
- `haiku_30` is a visible legacy profile and remains disabled by policy.
- Use context usage status (`ok|warning|critical|over`) to decide when to trigger context refresh carryover.

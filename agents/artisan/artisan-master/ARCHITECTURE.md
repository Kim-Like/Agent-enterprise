# Artisan Master Architecture

Parent: `father`

## Owned Program IDs

- `artisan-reporting`
- `artisan-wordpress`
- `artisan-email-marketing`

## Task Agents

- `artisan-accounting-integration-task`
- `artisan-wp-b2b-task`
- `artisan-brevo-lifecycle-task`

## Routing Rule

All Artisan objectives must resolve to one of the owned program IDs before execution.


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

## WordPress Operations Layer

- Canonical inventory endpoint: `GET /api/programs/artisan-wordpress/inventory`
- Deterministic diagnostics endpoint: `POST /api/programs/artisan-wordpress/ssh-check`
- Controlled action endpoint: `POST /api/programs/artisan-wordpress/ops-action`
- Operational authority mode for artisan master is `controlled_ops` (allowlist only).

## Daily Request Intake Layer

- Intake classification endpoint: `POST /api/workspace/artisan/intake-classify`
- Intake taxonomy:
  - `content`
  - `catalog`
  - `b2b_access`
  - `order_issue`
  - `checkout_issue`
  - `design_adjustment`
  - `incident`

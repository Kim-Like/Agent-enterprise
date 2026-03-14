# Baltzer Master Architecture

Parent: `father`

## Owned Program IDs

- `baltzer-tcg-index`
- `baltzer-reporting`
- `baltzer-shopify`

## Task Agents

- `baltzer-tcg-index-task`
- `baltzer-shopify-core-task`
- `baltzer-events-task`
- `baltzer-workforce-salary-task`
- `baltzer-accounting-integration-task`

## Routing Rule

Every Baltzer objective must map to one owned program ID before task decomposition.


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

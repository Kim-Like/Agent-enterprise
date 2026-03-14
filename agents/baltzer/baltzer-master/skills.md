# Baltzer Master - Skills

## Domain Competencies
1. Shopify commerce operations architecture and webhook-safe event handling.
2. TCG pricing intelligence workflows and local replacement planning for the demoted stack.
3. Event operations platform planning and lifecycle governance.
4. Workforce scheduling and salary API integration design.
5. Reporting/accounting synchronization for finance visibility.

## Execution Standards
1. Partition objectives into Shopify, TCG, events, workforce, or accounting tracks.
2. Enforce idempotency and replay safety for webhook/event-driven flows.
3. Tie every release to monitoring checkpoints and incident response ownership.
4. Keep security-sensitive integrations under least-privilege constraints.

## Orchestration vNext Standards
1. Decompose each objective into non-overlapping specialist tasks with explicit boundaries.
2. Delegate through structured mission envelopes with acceptance criteria and deliverables.
3. Enforce map-reduce context compression before specialist outputs return to master validation.
4. Use blocked-task escalation protocol instead of free-form failure responses.
5. Ensure each route/delegate/result/escalate decision is traceable through `specialist_invocations` and `correlation_id`.


## Orchestrator Hardening v2 (Warn-Only)
1. Use matrix-based boundary decomposition before selecting a specialist.
2. Keep specialist missions mutually exclusive and deterministic; if overlap is detected, pick one winner and emit warnings.
3. Delegate with structured mission envelopes and preserve `correlation_id` in all descendant tasks.
4. Require map-reduce specialist outputs and attach compression warnings when quality or token telemetry is weak.
5. Escalate blocked work through structured escalation contracts; do not use free-form failure dumps.
6. Persist route/delegate/compress/result/escalate decision envelopes to `specialist_invocations`.

## Model and Context Governance

1. Apply model policy deterministically: master identities cannot execute `opus_46`.
2. Treat denied profile selections as warn-only policy events and continue with fallback profile.
3. Keep specialist mission envelopes compact and rely on map-reduce outputs to protect context.
4. Use context usage telemetry and continuation carryovers to keep the same topic progressing without overflow.
5. Ensure model decisions, fallbacks, and context actions are captured in `specialist_invocations` decision payloads.

## 2026-03-01 Kanban Governance v1

- Kanban lifecycle mapping is status/stage-first: planning, assigned, in_progress, blocked, completed, closed.
- Task versions (`v1`, `v1.1`, `v2`) are board metadata and do not replace status/execution_stage truth.
- Every stage transition must use guarded API contracts and produce audit trail entries.
- Archived duplicate tasks are excluded from default dashboards and Kanban views.
- WIP thresholds are warn-only and must trigger prioritization/rebalancing actions instead of hard blocking.

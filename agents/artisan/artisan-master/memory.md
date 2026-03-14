# Artisan Master Memory

Status: active

## Owned Program Scope

- `programs/artisan/reporting.theartisan.dk`
- `programs/artisan/the-artisan-wp`
- `programs/artisan/e-mail-marketing`

## Datastore Context

- reporting app: dedicated cPanel MySQL + Billy API
- WordPress: MySQL on cPanel

## Current Priorities

1. reporting reliability and accounting integration quality
2. WP/B2B workflow stability
3. Brevo pipeline setup in email-marketing workspace

## 2026-02-28 Orchestration vNext

- Master now delegates via structured mission envelopes and correlation-aware receipts.
- Specialist outputs are expected through structured result packets (`/api/tasks/{task_id}/result`).
- Blocked execution escalates through structured protocol (`/api/tasks/{task_id}/escalate`).
- Route/delegate/result/escalate decisions are audited in `specialist_invocations`.

## 2026-02-28 Orchestrator Hardening v2 (Warn-Only)

- Master orchestration now aligns on matrix-driven task boundaries with deterministic overlap resolution.
- Contract enforcement remains warn-only permanent (`ORCH_CONTRACT_MODE=warn_only`).
- Delegation/result/escalation flows now carry structured warning metadata for autonomous triage.
- Correlation-first observability is required across route/delegate/result/escalate telemetry.

## 2026-03-01 Claude Control and Continuity

- Master docs now align with model catalog, thread model override, context usage, and context refresh workflows.
- Hard policy alignment recorded: `opus_46` engineer-only, `haiku_30` disabled, `sonnet_46` fallback.
- Context continuity now uses carryover packets with thread lineage instead of oversized single-thread transcripts.

## 2026-03-01 Reporting SQL Cutover

- Reporting state moved to dedicated cPanel MySQL tables for overrides, labour allocations, fixed allocations, and distribution rules.
- One-shot migration flow is `db:schema` -> `db:migrate` -> `db:verify`.
- Specialist execution remains `spec.artisan.accounting`, with engineer escalation authority unchanged.

## 2026-03-01 Remaining Migration v1

- Added Billy account snapshot + sync capability (`/api/accounts`, `/api/accounts/sync`) backed by `reporting_billy_accounts`.
- Added supplier rule governance (`/api/supplier-rules*`) backed by `reporting_supplier_rules`.
- Legacy supplier classification parity restored through DB-first matching with mapping fallback.
- Added `/rules` management UI for account sync, supplier rule CRUD, and unmatched supplier suggestions.

## 2026-03-01 WordPress Capability Hardening v1

- Canonical runtime confirmed under `~/public_html`.
- Active theme confirmed as `template=saren` and `stylesheet=saren-child`.
- B2B plugin confirmed active at `wp-content/plugins/artisan-b2b-portal`.
- Added deterministic endpoints for inventory, SSH checks, and controlled operations.
- Added non-programmer intake classification endpoint for daily request routing.
- Added first-party WordPress maps/runbook in `programs/artisan/the-artisan-wp/*.md`.

## 2026-03-01 Kanban Governance v1

- Kanban lifecycle mapping is status/stage-first: planning, assigned, in_progress, blocked, completed, closed.
- Task versions (`v1`, `v1.1`, `v2`) are board metadata and do not replace status/execution_stage truth.
- Every stage transition must use guarded API contracts and produce audit trail entries.
- Archived duplicate tasks are excluded from default dashboards and Kanban views.
- WIP thresholds are warn-only and must trigger prioritization/rebalancing actions instead of hard blocking.

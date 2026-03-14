# Samlino Master Memory

Status: active

## Owned Scope
- `programs/ian-agency/contexts/samlino/seo-agent-playground`

## Datastore Context
- Primary datastore: `programs/ian-agency/contexts/samlino/seo-agent-playground/data/samlino.db`
- Legacy mixed-store model removed from active runtime.

## Current Priorities
1. Stabilize Samlino v3 control-plane routes and runtime modules.
2. Keep specialist boundary decomposition deterministic and non-overlapping.
3. Preserve complete delegate/result/escalate telemetry across Samlino flows.

## 2026-03-01 Samlino v3 Rewrite
- Standalone legacy Samlino backend architecture replaced by control-plane-native route/service model.
- Specialist topology expanded from coarse two-specialist model to full SEO workflow specialist set.
- Samlino inventory/functions/ops APIs added for engineer/father oversight.
- Runtime state standardized on program-local SQLite (`samlino.db`).

## 2026-03-01 Kanban Governance v1

- Kanban lifecycle mapping is status/stage-first: planning, assigned, in_progress, blocked, completed, closed.
- Task versions (`v1`, `v1.1`, `v2`) are board metadata and do not replace status/execution_stage truth.
- Every stage transition must use guarded API contracts and produce audit trail entries.
- Archived duplicate tasks are excluded from default dashboards and Kanban views.
- WIP thresholds are warn-only and must trigger prioritization/rebalancing actions instead of hard blocking.

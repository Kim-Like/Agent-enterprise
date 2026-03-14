# Samlino Opportunity Explorer Task - Tools

## Primary Tooling
- Samlino runtime modules in `programs/ian-agency/contexts/samlino/seo-agent-playground/runtime`.
- Program datastore: `programs/ian-agency/contexts/samlino/seo-agent-playground/data/samlino.db`.
- Control-plane APIs under `/api/samlino/*` and `/api/tasks/*`.

## Guardrails
- No free-form shell mutation outside scoped operations.
- Keep warn-only orchestration metadata attached to outputs.
- Preserve `correlation_id` in all payload hops.

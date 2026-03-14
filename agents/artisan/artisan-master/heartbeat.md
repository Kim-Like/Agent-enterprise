# Artisan Master Spawn Rules

1. Route reporting/accounting objectives to `artisan-accounting-integration-task`.
2. Route WordPress/B2B/theme objectives to `artisan-wp-b2b-task`.
3. Route Brevo campaign/lifecycle objectives to `artisan-brevo-lifecycle-task`.
4. Require each task to return validation evidence and rollout/rollback notes.
5. Escalate infrastructure, auth, and data-integrity incidents to Engineer immediately.


## Warn-Only Orchestration Rules
6. Build a boundary plan from the matrix before specialist assignment.
7. When two boundaries overlap, select deterministic winner and emit `contract_warnings`.
8. Attach mission contract metadata (`mission_id`, `boundary_set_id`, `observability_tags`) to task context.
9. Preserve `correlation_id` across parent, child, result, and escalation flows.

## Claude Context Rules

1. Default master chat/runtime profile should remain `sonnet_46` unless policy allows another profile.
2. If model override is requested, verify policy outcome and record warnings/fallbacks.
3. Before long analysis turns, check `/api/chat/threads/{thread_id}/context-usage`.
4. If context status is `critical` or `over`, create a continuation via `/api/chat/threads/{thread_id}/context-refresh` and continue work there.

## Daily Intake Rules (Non-Programmer)

1. Use `POST /api/workspace/artisan/intake-classify` for every daily request.
2. Route by output specialist recommendation unless override is explicitly justified in task context.
3. Use WordPress control endpoints for diagnostics before escalating:
- `GET /api/programs/artisan-wordpress/inventory`
- `POST /api/programs/artisan-wordpress/ssh-check`
4. Only use allowlisted operations for runtime changes:
- `backup_db`, `backup_files`, `flush_cache`, `service_status`, `deploy_pull`

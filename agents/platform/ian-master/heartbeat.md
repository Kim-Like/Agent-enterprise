# IAn Master Spawn Rules

1. Route PMO/status/risk work to `portfolio-pmo-task`.
2. Route quality gate and automation governance work to `automation-quality-task`.
3. Route implementation coordination work to `ian-implementation-task`.
4. Route research and option analysis work to `ian-research-task`.
5. Escalate direct deep technical implementation to Engineer when specialist execution is required.


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

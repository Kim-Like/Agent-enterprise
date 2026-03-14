# Samlino Product Ops Task - Skills

## Domain Competencies
1. Product operations sequencing across discovery, build, and launch gates.
2. Experiment design with measurable acceptance criteria and outcomes.
3. Backlog shaping tied to business impact and engineering capacity.

## Execution Standards
1. Use Claude CLI (OAuth runtime) when AI generation/planning is required; no API-key-only fallback paths in v1.
2. Keep Python typing Python 3.9-safe (`Optional[T]`), and preserve deterministic ownership (`master_id`, `program_id`).
3. Always include tests/verification evidence and update task memory with blockers, risks, and next handoff.

## Definition of Done
- Deliverable is reproducible with explicit verification evidence.
- Acceptance criteria are met and handoff path is unambiguous.
- MEMORY and queue/error state are updated for the next agent hop.

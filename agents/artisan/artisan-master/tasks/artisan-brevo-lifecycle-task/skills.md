# Artisan Brevo Lifecycle Task - Skills

## Domain Competencies
1. Brevo campaign lifecycle orchestration with segmentation and trigger hygiene.
2. Canva-to-responsive-HTML email conversion with client-safe markup patterns.
3. Deliverability optimization (SPF/DKIM alignment, list quality, bounce handling).

## Execution Standards
1. Use Claude CLI (OAuth runtime) when AI generation/planning is required; no API-key-only fallback paths in v1.
2. Keep Python typing Python 3.9-safe (`Optional[T]`), and preserve deterministic ownership (`master_id`, `program_id`).
3. Always include tests/verification evidence and update task memory with blockers, risks, and next handoff.

## Definition of Done
- Deliverable is reproducible with explicit verification evidence.
- Acceptance criteria are met and handoff path is unambiguous.
- MEMORY and queue/error state are updated for the next agent hop.

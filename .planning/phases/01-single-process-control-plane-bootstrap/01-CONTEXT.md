# Phase 1: Single-Process Control Plane Bootstrap - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning
**Source:** Manual bootstrap from user brief, repo audit, and legacy topology review

<domain>
## Phase Boundary

Phase 1 delivers only the foundation needed to serve the dashboard and expose inventory safely:

- one long-lived Node server
- one same-origin delivery path for the dashboard references
- one local SQLite file for control-plane state
- read-only inventory and health routes
- one documented Tailscale entry path

This phase does **not** deliver:

- agent execution
- program mutations
- heavy brownfield app startup
- full connector wiring
- separate frontend tooling

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- The existing root HTML files are the canonical frontend contract for the rebuild.
- The rebuild must use one long-lived backend process.
- The backend must serve the frontend directly from the same origin.
- Phase 1 must not introduce a separate Vite dev server.
- Copied agent folders are registry source material, not proof of runtime processes.
- Program folders must be classified before anything runtime-capable is enabled.
- Heavy holds stay dormant in Phase 1.
- One Tailscale entry point is required.

### Claude's Discretion
- Exact Node framework and internal folder boundaries inside `server/`
- Exact SQLite wrapper and migration shape
- Exact organization of tests and static client pages as long as the root HTML contract is preserved

</decisions>

<specifics>
## Specific Ideas

- Normalize `agents copy/` into canonical `agents/` during implementation rather than preserving the copied folder name forever.
- Keep `programs/` split by actual behavior: `active`, `remote`, `hold`, `stub`.
- Converge the two Billy reporting apps later into one tenant-aware reporting module.
- Keep TCG Index and Samlino brownfield stacks explicitly outside the base server boot path.

</specifics>

<deferred>
## Deferred Ideas

- Agent execution adapters and health-driven runtime wiring
- Program trigger models and connector policy enforcement
- Live dashboard invoke flows and real-time updates
- Brownfield migrations for TCG Index, Samlino, and remote cPanel surfaces

</deferred>

---

*Phase: 01-single-process-control-plane-bootstrap*
*Context gathered: 2026-03-12 via manual planning bootstrap*

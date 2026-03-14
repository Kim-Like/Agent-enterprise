# Lavprishjemmeside V2.0 Design

## System Framing

Lavprishjemmeside V2 lives across multiple systems, but the external agent only owns one writable slice.

### Writable Slice

- `programs/lavprishjemmeside/`
- `programs/lavprishjemmeside/local-mirror/`

This is the only implementation surface the external agent may change.

### Outside-Folder Systems

- Agent Enterprise server runtime and orchestration
- generated client agents and master agent packets outside this folder
- repo-root validation commands
- root `.env.local`
- launchd and Tailscale Funnel
- cPanel live repos
- cPanel live databases
- live env secrets

These systems are not optional context. They are part of the real production architecture. The external agent must respect them, not replace them.

## Canonical V2 Documentation Design

The canonical V2 planning set now lives in this folder:

- `requirements.md`
- `design.md`
- `tasks.md`

Supporting execution docs:

- `EXTERNAL_AGENT_INSTRUCTIONS.md`
- `EXTERNAL_AGENT_PROMPT.md`
- `OUTSIDE_FOLDER_DEPENDENCIES.md`
- `CPANEL_HANDOFF_CONTRACT.md`
- `ROLLBACK_AND_REPAIR.md`

## Product Design Direction

### 1. Stronger Admin And Master Experience

The CMS should feel more deliberate, premium, and operationally useful.

This includes:

- stronger dashboard information hierarchy
- stronger master dashboard/operator feel
- clearer admin navigation and state design
- better overall interaction quality

### 2. Better CMS Productivity

The earlier richer V2 ambition should be selectively restored.

This includes:

- page workflow clarity
- design-system workflow clarity
- component workflow clarity
- better assistant/AI interaction quality where it helps the CMS workflow

### 3. Installation And Onboarding As Product

Installation and the assistant wizard are not only technical steps. They are product experiences.

They must be:

- explicit
- confidence-building
- recovery-friendly
- honest about operator-owned live steps

### 4. More Mature Commerce

The commerce lane should feel more trustworthy and operationally mature.

This means:

- better storefront trust and conversion flow
- better admin catalog and order operations
- better documented contracts for payments and schema
- better AI/assistant support for commerce-related work

### 5. Better Operator Intelligence

The master lane should feel like a real control console.

This includes:

- AI usage visibility
- assistant health visibility
- provider visibility and master-only switching
- honest unavailable-data states when the data lives outside the folder

## Architecture Boundaries

### Folder-Owned Product Layer

The external agent may design and implement:

- in-folder planning docs
- local CMS mirror code
- local CMS runtime docs
- dashboard/master UI changes in the mirror
- install/wizard/shop/productivity improvements in the mirror
- operator handoff artifacts

### Operator-Owned Live Layer

The human operator owns:

- SSH execution
- live SQL execution
- live env changes
- live rebuild/restart actions
- release-health and production verification
- repair-vs-rollback decision execution

### Outside-Folder Agentic Layer

The external agent may describe contracts for:

- master agent behavior
- generated client-agent dependencies
- provider routing
- AI usage telemetry

But it may not fabricate replacements for those systems.

## cPanel And Database Handoff Design

The real database and live runtime live on cPanel.

The external agent must therefore operate with a first-class handoff model:

- design the change in-folder
- document the exact live action required
- hand it back to the operator

### Required Operator Packet Types

- SQL schema / migration handoff
- seed-data handoff
- env/config handoff
- live verification checklist
- rollback note

### SQL Handoff Contract

Every DB-affecting phase must be able to hand back:

- purpose
- affected sites
- exact SQL artifact
- run order
- idempotency expectation
- rollback/revert path
- verification queries

### Env / Config Handoff Contract

Every live config-affecting phase must be able to hand back:

- purpose
- affected sites
- variable list
- expected value shape
- apply location
- restart/rebuild note
- rollback note
- verification step

## Phase Design

### Phase 0: Baseline Freeze And Operator Safety

Purpose:

- establish the known-good baseline and the safety rules for rollback

### Phase 1: Documentation Authority Reset

Purpose:

- make this folder the true canonical V2 source

### Phase 2: Major Design/Admin Uplift Foundation

Purpose:

- restore stronger V2 product ambition and set the direction for a more premium admin/master experience

### Phase 3: Install Hardening And Wizard Refinement

Purpose:

- make first-run setup both safer and more polished

### Phase 4: Ecommerce Major Uplift

Purpose:

- improve storefront, admin operations, and commerce trust without breaking payments

### Phase 5: CMS/Admin Productivity Uplift

Purpose:

- bring back the strongest useful parts of the richer earlier V2 vision

### Phase 6: Master AI Visibility And Provider Switching

Purpose:

- improve operator intelligence and master-only control

### Phase 7: Final Handoff And Safety Gate

Purpose:

- finish with a decision-complete operator package, not a vague implementation summary

## Documentation Rules

### No Undocumented Contracts

If code changes a structured expectation, docs must change too.

Applies to:

- schema
- seed behavior
- request/response contracts
- env contracts
- install/wizard/workflow behavior
- outside-folder dependency contracts

### No Alternative Implementations For Blocked Systems

If a needed system is outside the folder:

1. document the dependency
2. document the expected interface
3. prepare the operator packet if live work is needed
4. stop at the boundary

## Validation Model

Validation is split across:

- folder-owned documentation and implementation checks
- operator-owned cPanel execution and live verification
- rollback readiness against the baseline

The external agent is complete only when the folder is implementation-ready and the operator handoff is execution-ready.

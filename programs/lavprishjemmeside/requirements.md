# Lavprishjemmeside V2.0 Requirements

## Overview

Lavprishjemmeside V2.0 is a 24-hour external-agent sprint executed inside `programs/lavprishjemmeside/`, while the live runtime, live database, live environment, and SSH rollout remain operator-owned on cPanel.

This sprint must serve two goals at the same time:

- deliver a materially stronger V2 product
- keep execution safe across a complex intertwined system

Lavprishjemmeside is not just one site. It is a connected estate made of:

- the program-level handoff and planning layer in this folder
- the GitHub-synced CMS code in `local-mirror/`
- the live parent site and API on cPanel
- the governed client site `ljdesignstudio.dk`
- the outside-folder Agent Enterprise control plane, master agent, and generated client agents

The external agent must improve the product without pretending it owns cPanel, the live database, or the outside-folder orchestration layer.

## V2 Intent

The V2 sprint is a hybrid plan.

It must keep the current priorities:

- documentation and handoff hardening
- install hardening
- wizard refinement
- ecommerce uplift
- master AI visibility
- master-only provider switching
- rollback safety

And it must explicitly restore stronger V2 product ambition:

- major design/admin uplift
- better dashboard and master UX
- better pages/design-system/components productivity
- more polished assistant and AI workflow quality

V2 is not only about safer execution. It must clearly feel like a stronger product.

## Delivery Requirements

### DR-1: Canonical Planning Lives In-Folder

The canonical V2 planning set SHALL live in:

- `programs/lavprishjemmeside/requirements.md`
- `programs/lavprishjemmeside/design.md`
- `programs/lavprishjemmeside/tasks.md`

Acceptance criteria:

1. These three files are the authoritative V2 planning set for the external agent.
2. No second planning set outside this folder acts as a competing authority.
3. No redundant mirror or redirect plan remains to confuse the external agent.

### DR-2: External-Agent Boundary

The external sprint agent SHALL treat `programs/lavprishjemmeside/` as the only writable scope.

Acceptance criteria:

1. The external agent is explicitly forbidden from writing outside this folder.
2. Outside-folder systems are documented as dependencies with a handoff path.
3. The external agent is explicitly told not to invent substitute runtime, database, or orchestration solutions.

### DR-3: Operator-Owned Live Execution

The live database, live environment, SSH deployment, and production verification SHALL remain operator-owned.

Acceptance criteria:

1. The external agent does not claim to execute live cPanel work.
2. The external agent must hand exact operator packets back for DB, env, and verification work.
3. The operator handoff format is explicit, reusable, and phase-safe.

### DR-4: Phase Discipline

The sprint SHALL execute in a fixed, descriptive phase order.

Acceptance criteria:

1. Each phase defines objective, product intent, implementation lanes, acceptance, and hard stop conditions.
2. Each phase ends with a structured handoff.
3. The phase plan is detailed enough to implement without additional architectural decisions.

### DR-5: Changelog And Contract Discipline

Behavior changes and structured contract changes SHALL be documented, not just coded.

Acceptance criteria:

1. Both changelog copies are updated for behavior changes.
2. Schema, API, env, proxy, and workflow changes leave behind updated handoff docs.
3. No phase is complete if a new contract lives only in code.

## Product Requirements

### PR-1: Documentation Authority And Handoff Hardening

The Lavprishjemmeside folder SHALL become a self-contained execution and handoff package.

Acceptance criteria:

1. Read order is explicit.
2. Canonical, reference, and historical docs are clearly separated.
3. Outside-folder dependencies are documented with owner, purpose, interface, and handoff action.
4. No active handoff doc points at retired legacy path roots.

### PR-2: Major Design And Admin Uplift

V2 SHALL materially improve the admin experience.

Acceptance criteria:

1. Dashboard and master surfaces aim for a stronger, more premium operational experience.
2. Admin shell and navigation quality are treated as first-class V2 work.
3. Interaction quality, information hierarchy, and workflow clarity improve meaningfully.

### PR-3: CMS Productivity Uplift

V2 SHALL restore selected richer V2 ambitions around CMS productivity.

Acceptance criteria:

1. Pages workflows are improved.
2. Design-system and component workflows are improved.
3. Assistant and AI flows feel more polished and intentional.
4. Restored ambition is selective and practical, not a blind revival of all old scope.

### PR-4: New-Client Installation Hardening

The CMS installation flow SHALL become safer and more repeatable.

Acceptance criteria:

1. Database bootstrap and schema sequencing are explicit and retry-safe.
2. Node/runtime readiness is part of the install contract.
3. Base site rollout validation is part of installation success criteria.
4. Installation failures produce actionable handoff information.

### PR-5: Assistant Wizard Refinement

The client setup wizard SHALL become more polished, strict, and recovery-friendly.

Acceptance criteria:

1. Setup steps are clearer.
2. Validation is stronger.
3. Preview quality is higher.
4. Resume and retry behavior is defined.
5. The wizard remains locked to the dedicated client assistant.

### PR-6: Ecommerce Major Uplift

The first-party shop SHALL move toward a more professional operational baseline.

Acceptance criteria:

1. Browse, product, cart, and checkout UX improve.
2. Product customization controls are added where supported by the current model.
3. Admin catalog, order, shipping, discount, and settings workflows improve.
4. Assistant guidance for commerce workflows improves.
5. Existing Flatpay / Frisbii contracts are preserved.

### PR-7: Master Dashboard AI Usage And Consumption

The master dashboard SHALL expose more useful AI operations visibility.

Acceptance criteria:

1. Client AI usage and consumption become visible at a useful level.
2. Assistant status becomes more visible.
3. Missing or outside-folder data is surfaced explicitly, not faked.

### PR-8: Master-Only Provider Switching

The master lane SHALL support Codex/OpenAI vs Anthropic switching without client exposure.

Acceptance criteria:

1. Provider choice remains master-only.
2. Provider choice and resulting workflow path are auditable.
3. Outside-folder routing work is handed off, not fabricated locally.

### PR-9: cPanel Operator Handoff

The sprint SHALL define a first-class operator handoff path for live execution.

Acceptance criteria:

1. SQL/schema handoffs have a standard structure.
2. Seed-data handoffs have a standard structure.
3. Env/config handoffs have a standard structure.
4. Verification and rollback notes are mandatory where live execution is required.

### PR-10: Repair And Rollback Readiness

The sprint SHALL preserve a practical recovery path to the current known-good state.

Acceptance criteria:

1. Rollback docs stay current.
2. Parent and pilot-client baseline state is explicit.
3. Critical flows are explicit.
4. The default rule is repair once, then rollback if stability is not restored.

## Non-Functional Requirements

### NFR-1: No Alternative Runtime Solutions

The external agent must not create:

- alternative databases
- replacement orchestrators
- fake provider routers
- substitute runtime paths
- fake local versions of cPanel-only work

### NFR-2: Documentation Completeness

The folder output must be sufficient for another engineer or operator to continue immediately.

That includes:

- release notes
- schema docs
- API/env/workflow contract docs
- operator handoff packets
- rollback instructions

### NFR-3: Safety Over Cleverness

If work depends on cPanel, secrets, or outside-folder Agent Enterprise systems, the external agent must stop at the boundary and prepare the operator packet instead of improvising.

## Explicit Non-Goals

- automatic live deployment by the external agent
- client-facing provider switching
- reintroducing the retired CMS-side personal-agent path
- inventing new infrastructure to avoid operator handoff
- automatically reviving email/subscription as active V2 scope without a separate decision

---
name: lavprishjemmeside-master-orchestrator
description: Use this skill whenever work touches lavprishjemmeside.dk, the Lavprishjemmeside CMS, ljdesignstudio.dk, client-website governance, CMS rollout on cPanel/MySQL, SEO or ads dashboards, subscription or client operations, or when the user wants architecture critique, optimization ideas, enterprise-level CMS improvements, release planning, or operational guidance for that estate. Also use it whenever a change should update programs/lavprishjemmeside/CHANGELOG.md.
---

# Lavprishjemmeside Master Orchestrator

This skill turns the Lavprishjemmeside lane into a project-aware master orchestrator inside Agent Enterprise. Use it to reason about the CMS, the governed client sites, the remote cPanel estate, and the broader product direction of an enterprise-grade CMS plus client website management tool.

## Load Context In This Order

1. Read `programs/lavprishjemmeside/README.md` first for the current operating model and essential doc set.
2. Read `programs/lavprishjemmeside/PROJECT_CONTEXT.md` when the task touches architecture, deployment, cPanel, MySQL, admin features, or release process.
3. Read `programs/lavprishjemmeside/BRAND_VISION.md` when the task touches positioning, UX, content direction, or design decisions.
4. Read `programs/lavprishjemmeside/CHANGELOG.md` before closing any change that affects the CMS or client-site management behavior.
5. Read `docs/lavpris-ssh-first-operations.md` and `docs/theartis-cpanel-estate-operations.md` when the task touches remote SSH, cPanel paths, health probes, or repo status.
6. Read `agents/lavprishjemmeside/lavprishjemmeside-master/*.md` when you need the current master-lane packet, routing, or guardrails.

Only load the deeper files that match the request. Do not bulk-load the whole program tree if the question is narrow.

## Operating Model

- Treat Lavprishjemmeside as a remote-first estate governed from Agent Enterprise.
- Keep remote repos and cPanel-hosted MySQL as the CMS source of truth.
- Distinguish between control-plane work inside Agent Enterprise, remote CMS or client-site work inside the Lavprishjemmeside repos, and operator-contract or release-process work.
- Frame recommendations around enterprise readiness: repeatability, observability, auditability, rollback safety, client onboarding, and maintainable multi-site governance.

## Route The Request Before Answering

Classify the request into one primary lane:

1. `cms-core`
2. `client-site-governance`
3. `seo-ads-observability`
4. `subscription-client-ops`
5. `remote-release-ops`
6. `enterprise-improvement`

If two lanes overlap, choose one owner and list the second as a dependency instead of blending both into one vague plan.

## What Good Output Looks Like

When the user asks for advice, review, or planning, structure the answer around:

- current objective
- scope boundary
- affected surfaces
- recommendation or implementation plan
- risks and verification
- changelog impact

When the user asks for optimization or improvement ideas, prefer leverage over novelty. Suggest improvements that reduce operator load, improve release safety, strengthen content governance, or make multi-site delivery easier to maintain.

## Enterprise CMS Improvement Lens

Use these lenses when proposing improvements:

- multi-site governance and per-client isolation
- publish, preview, rollback, and release auditability
- component-library governance and reusable content schemas
- role-based admin access and safer operational permissions
- SEO, ads, and analytics data reliability
- MySQL schema evolution and additive migrations
- cPanel-hosted Node.js reliability and recovery
- client onboarding, subscription visibility, and service-level clarity
- changelog and release-note discipline

Do not suggest enterprise patterns that ignore the actual hosting reality. cPanel, LiteSpeed, remote MySQL, and remote repos are real constraints here.

## Changelog Discipline

This rule is mandatory for this lane:

- If you implement or document a change that affects Lavprishjemmeside CMS behavior, client-site management behavior, release or ops process, or operator expectations, update `programs/lavprishjemmeside/CHANGELOG.md` in `[Unreleased]` before handoff.
- Use concise `Added`, `Changed`, `Fixed`, or `Database migrations` entries.
- If the change is documentation or orchestration only, record it under `Changed`.
- If no changelog update is required, say so explicitly in the handoff.

## Guardrails

- Do not invent local-first code paths for the remote Lavprishjemmeside repos.
- Do not treat control-plane SQLite as the CMS application datastore.
- Do not recommend direct live-site edits where repo-backed or scripted verification exists.
- Do not hide uncertainty. If `BRAND_VISION.md` still contains placeholders, state your assumptions instead of inventing brand facts.
- Escalate infrastructure, cPanel, MySQL, and cross-domain runtime risk to Engineer early.

## Starter Prompt Pack

See `STARTER-PROMPTS.md` for example prompts that should trigger this skill.

## Draft Evaluation Prompts

See `evals/evals.json` for initial test prompts to use if you want to benchmark or refine this skill later.

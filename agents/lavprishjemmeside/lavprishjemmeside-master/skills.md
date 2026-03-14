# Lavprishjemmeside Master - Skills

## Domain Competencies
1. Remote-first AI CMS governance on cPanel and MySQL.
2. Enterprise-grade storefront and e-commerce governance across catalog, variants, cart, checkout, orders, shipping, discounts, and payment flows.
3. Enterprise-grade client website management across the parent site and governed client sites.
4. SEO, ads, analytics, and reporting surfaces that support commercial decision-making.
5. Subscription and client operations that reduce operator friction and improve retention.

## Master Orchestration Standards
1. Read `programs/lavprishjemmeside/README.md` first, then load `PROJECT_CONTEXT.md`, `BRAND_VISION.md`, or `CHANGELOG.md` only when the task needs them.
2. Classify each objective as CMS core, storefront or checkout, order or payment operations, client-site governance, SEO or ads observability, subscription or client ops, or remote release and cPanel operations.
3. Keep control-plane work, remote CMS work, and operator-contract work clearly separated.
4. Escalate cPanel, MySQL, runtime, and security risk to Engineer early with concrete evidence.
5. Prefer improvements that increase repeatability, observability, release safety, and multi-site governance rather than one-off features.
6. For Lavprishjemmeside v2.0, preserve the delivery chain `Bolt.new -> GitHub -> cPanel over SSH`.
7. Treat GitHub as the shared code-sync surface and cPanel as the live deployment target.
8. Do not describe or execute Lavprishjemmeside live rollout as a GitHub deployment.

## Enterprise Improvement Lens
1. Strengthen publish, preview, rollback, and release auditability.
2. Improve component, content-schema, and design-system governance for reuse across client sites.
3. Reduce operator toil in client onboarding, shop configuration, catalog updates, and lifecycle reporting.
4. Improve analytics, SEO, and ads reliability without coupling those concerns to fragile UI logic.
5. Keep recommendations grounded in the real cPanel, payment gateway, and remote-repo constraints of this estate.

## Change-Control Rule
1. Any implemented change that affects Lavprishjemmeside CMS behavior, client-site management behavior, release contract, or operator expectations must update `programs/lavprishjemmeside/CHANGELOG.md` under `[Unreleased]` before handoff.
2. Documentation and orchestration changes belong under `Changed`.
3. Run `npm run lavpris:release-health` before concluding the work and surface any pending rollout or client-update warning in the handoff.
4. If no changelog update is needed, say that explicitly in the handoff.

## Output Discipline
1. Summaries should name the current objective, affected surfaces, recommended next step, risks, verification, and changelog impact.
2. When the brand file is incomplete, label assumptions instead of inventing brand facts.

## 2026-03-01 Kanban Governance v1

- Kanban lifecycle mapping is status/stage-first: planning, assigned, in_progress, blocked, completed, closed.
- Task versions (`v1`, `v1.1`, `v2`) are board metadata and do not replace status/execution_stage truth.
- Every stage transition must use guarded API contracts and produce audit trail entries.
- Archived duplicate tasks are excluded from default dashboards and Kanban views.
- WIP thresholds are warn-only and must trigger prioritization/rebalancing actions instead of hard blocking.

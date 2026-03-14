# Lavprishjemmeside Master Memory

Status: active

## Current Baseline

- canonical root docs live in `programs/lavprishjemmeside/`
- canonical local GitHub checkout lives in `programs/lavprishjemmeside/local-mirror/`
- remote authority remains on cPanel and the remote repos
- shared sync repo: `https://github.com/kimjeppesen01/lavprishjemmeside.dk`
- Bolt.new is an approved builder surface, but not the live deployment target
- `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/lavprishjemmeside.dk`
- `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/ljdesignstudio.dk`
- `https://lavprishjemmeside.dk/`
- `https://api.lavprishjemmeside.dk/health`
- `https://ljdesignstudio.dk/`
- `https://api.ljdesignstudio.dk/health`

## Datastore Context

- primary app datastore: MySQL on cPanel
- required env keys: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

## Current Priorities

1. AI CMS stability, publish safety, and rollout quality
2. enterprise-grade client website management improvements
3. SEO/Ads dashboard reliability and trustworthy analytics
4. subscription and client-ops consistency

## Change-Control Rule

- Any change that affects CMS behavior, client-site management behavior, release process, or operator expectations must update `programs/lavprishjemmeside/CHANGELOG.md` under `[Unreleased]` before handoff.
- If the work is documentation or orchestration only, log it under `Changed`.

## Orchestration Reminder

- Route work into CMS core, client-site governance, SEO or ads observability, subscription ops, or remote release and cPanel operations.
- Escalate infrastructure, security, cPanel, or MySQL risk to Engineer early.
- Prefer essential-root-doc loading over legacy sprawl.

## 2026-03-13 Lavprishjemmeside v2.0 Access Verification

- GitHub SSH access to `git@github.com:kimjeppesen01/lavprishjemmeside.dk.git` is available from this machine.
- `npm run lavpris:mirror-pull` creates or updates the canonical local mirror at `programs/lavprishjemmeside/local-mirror/`.
- `npm run lavpris:sync-status` compares GitHub, the local mirror, and the cPanel repo before rollout.
- Dry-run push permission is available for the GitHub repo, so Agent Enterprise can verify and prepare repo-bound rollout work.
- cPanel SSH alias `cp10-lavpris` is reachable and the remote Lavprishjemmeside repo/site paths are writable.
- Current sync check: GitHub, the local mirror, and the cPanel repo HEAD all resolve to `f4a85fab7ce24ad5c64db19cdd9b5fbfcbc70bae`, and `npm run lavpris:sync-status` is green.
- Root-cause note: the earlier `api/package-lock.json` drift came from the default SSH Node `v10` / npm `6` toolchain rewriting the lockfile; use the cPanel Node 22 path for package operations.
- Live rollout path for v2.0 is `Bolt.new -> GitHub -> cPanel over SSH`, not GitHub-hosted deployment.

## 2026-03-01 Kanban Governance v1

- Kanban lifecycle mapping is status/stage-first: planning, assigned, in_progress, blocked, completed, closed.
- Task versions (`v1`, `v1.1`, `v2`) are board metadata and do not replace status/execution_stage truth.
- Every stage transition must use guarded API contracts and produce audit trail entries.
- Archived duplicate tasks are excluded from default dashboards and Kanban views.
- WIP thresholds are warn-only and must trigger prioritization/rebalancing actions instead of hard blocking.

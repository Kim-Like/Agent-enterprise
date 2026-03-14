# Lavprishjemmeside Program

Lavprishjemmeside is the remote-first CMS and client-site management program inside Agent Enterprise.

It governs four connected surfaces:

- the parent program manifest in this folder
- the Lavprishjemmeside CMS mirror in `local-mirror/`
- the primary `lavprishjemmeside.dk` site on cPanel
- the governed client site `ljdesignstudio.dk`

This folder is intentionally trimmed to the essential root documents. It does not pretend the live cPanel repos are local first-party code inside Agent Enterprise.

## External-Agent Read Order

If an external agent only has access to this folder, read in this order:

1. `README.md`
2. `PROJECT_CONTEXT.md`
3. `CHANGELOG.md`
4. `EXTERNAL_AGENT_INSTRUCTIONS.md`
5. `EXTERNAL_AGENT_PROMPT.md`
6. `requirements.md`
7. `design.md`
8. `tasks.md`
9. `CPANEL_HANDOFF_CONTRACT.md`
10. `OUTSIDE_FOLDER_DEPENDENCIES.md`
11. `ROLLBACK_AND_REPAIR.md`
12. `DOCUMENT_AUTHORITY_MAP.md`

## Essential Root Docs

- `README.md`
- `PROJECT_CONTEXT.md`
- `BRAND_VISION.md`
- `CHANGELOG.md`
- `EXTERNAL_AGENT_INSTRUCTIONS.md`
- `EXTERNAL_AGENT_PROMPT.md`
- `requirements.md`
- `design.md`
- `tasks.md`
- `CPANEL_HANDOFF_CONTRACT.md`
- `OUTSIDE_FOLDER_DEPENDENCIES.md`
- `ROLLBACK_AND_REPAIR.md`
- `DOCUMENT_AUTHORITY_MAP.md`

The removed files `README_1.0.md`, `README_INSTALL.md`, and `BRAND_VISION_EXAMPLE.md` were folded into this smaller set.

## Authority

- Program manifest: `lavprishjemmeside-root`
- Primary CMS surface: `lavprishjemmeside-cms`
- Owner master: `lavprishjemmeside-master`
- Shared GitHub repo: `https://github.com/kimjeppesen01/lavprishjemmeside.dk`
- Build platform: `https://bolt.new`
- cPanel deployment repo: `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/lavprishjemmeside.dk`
- cPanel companion repo: `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/ljdesignstudio.dk`
- Live site: `https://lavprishjemmeside.dk/`
- CMS health: `https://api.lavprishjemmeside.dk/health`
- Client site: `https://ljdesignstudio.dk/`
- Client API health: `https://api.ljdesignstudio.dk/health`

## Operating Model

- Agent Enterprise is the governance and orchestration layer.
- GitHub is the shared code sync surface between Bolt.new and Agent Enterprise.
- The canonical local working checkout for GitHub-synced Lavprishjemmeside code is `programs/lavprishjemmeside/local-mirror/`.
- Bolt.new is an allowed build surface, but its changes must be synced back into GitHub before Agent Enterprise treats them as deployable.
- The CMS repos remain remote on `cp10.nordicway.dk` and are the live deployment mirrors.
- Agent Enterprise may push the GitHub-synced repository state to cPanel over SSH.
- The required handoff chain is `Bolt.new -> GitHub -> cPanel live runtime`.
- Lavprishjemmeside assistants no longer run inside the CMS repo. The CMS reaches Agent Enterprise through a Funnel-backed Lavpris public ingress, while the control plane stays private.

## What This Program Covers

- AI CMS core and admin workflows
- first-party e-commerce storefront, checkout, and order-management flows
- SSH-first rollout and cPanel operational reliability
- generated per-client assistant provisioning
- Funnel-backed assistant access from shared cPanel hosting
- page, component, and design-system governance
- parent-site and governed client-site consistency

## Agent Enterprise Operations

Use the repo-level estate commands from the Agent Enterprise root:

```bash
npm run lavpris:mirror-pull
npm run lavpris:sync-status
npm run lavpris:path-health
npm run lavpris:rollout-status
npm run lavpris:release-health
npm run lavpris:preflight
npm run lavpris:inventory
npm run lavpris:health
npm run lavpris:repo-status
```

Use `npm run lavpris:mirror-pull` to create or fast-forward the canonical local mirror, `npm run lavpris:sync-status` to compare GitHub, the local mirror, and the cPanel repo, and `npm run lavpris:release-health` as the final release gate before handoff. Use `PROJECT_CONTEXT.md` for the deeper CMS/runtime summary, `DOCUMENT_AUTHORITY_MAP.md` to distinguish canonical docs from reference docs, and the handoff pack `introduction.md`, `techstack.md`, and `developer.md` for internal/operator onboarding.

## External Sprint Safety

- External sprint agents may edit only `programs/lavprishjemmeside/`.
- Use `EXTERNAL_AGENT_PROMPT.md` as the startup prompt for a fresh external agent.
- The canonical V2 planning set is `requirements.md`, `design.md`, and `tasks.md`.
- Any DB, env, or live cPanel work must be handed back through `CPANEL_HANDOFF_CONTRACT.md`.
- Everything outside this folder must be treated as a documented dependency, not editable scope.
- Internal/operator docs under `local-mirror/docs/` remain valuable, but they are not the execution authority for the external sprint.

## Change Control

Any Engineer, Codex, or Claude Code change that affects the Lavprishjemmeside CMS, client-site management behavior, release contract, or operator expectations must update `CHANGELOG.md` under `[Unreleased]` before handoff. Internal/operator handoff is not fully closed until `npm run lavpris:release-health` has been checked and any warning has been surfaced explicitly.

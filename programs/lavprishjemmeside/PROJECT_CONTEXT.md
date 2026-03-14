# lavprishjemmeside.dk — Program Context

## Overview

Lavprishjemmeside is a Danish business-website CMS program governed from Agent Enterprise. The live CMS and client installs run on Nordicway cPanel; Agent Enterprise owns orchestration, remote operations, and the client-assistant runtime.

The live CMS now also includes a first-party e-commerce module with public storefront routes under `/shop/*`, admin shop management under `/admin/shop/*`, and Flatpay / Frisbii payment handling.

**Live URL**: https://lavprishjemmeside.dk  
**API URL**: https://api.lavprishjemmeside.dk  
**GitHub**: https://github.com/kimjeppesen01/lavprishjemmeside.dk

## Essential Document Set

Treat these as the essential root docs for the Lavprishjemmeside program inside Agent Enterprise:

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

## Change-Control Rule

Any Engineer, Codex, or Claude Code change that affects Lavprishjemmeside CMS behavior, client-site management behavior, release process, assistant access, or operator documentation should add an entry to `CHANGELOG.md` under `[Unreleased]` before handoff.

For the external sprint, that rule applies to both:

- `programs/lavprishjemmeside/CHANGELOG.md`
- `programs/lavprishjemmeside/local-mirror/CHANGELOG.md`

## Authority Chain And Sync Contract

- **Live production runtime**: cPanel remains the live source of what is currently serving traffic.
- **Shared repo authority**: `https://github.com/kimjeppesen01/lavprishjemmeside.dk` is the shared sync point between Bolt.new and Agent Enterprise.
- **Canonical local checkout**: `programs/lavprishjemmeside/local-mirror/` is the approved local working mirror for GitHub-synced Lavprishjemmeside code inside Agent Enterprise.
- **Builder surface**: Bolt.new is allowed as a design/build workspace, but its changes are not deployment-ready until they are exported or merged into GitHub.
- **Deployment operator**: Agent Enterprise is allowed to push the GitHub-synced repository version to cPanel over SSH.
- **Required sync order**: `Bolt.new -> GitHub -> cPanel`.
- **Drift rule**: if a hotfix lands directly on cPanel, backport it to GitHub immediately so Bolt.new, GitHub, and Agent Enterprise do not diverge.

## Assistant Access Contract

- The CMS browser talks only to local `/assistant` routes inside each CMS install.
- The CMS server reaches Agent Enterprise through a Funnel-backed public ingress URL.
- The public ingress exposes only the Lavpris assistant route family under `/api/lavpris/...`.
- The full Agent Enterprise control plane, generic `/api/chat`, `/api/agents`, `/api/work`, and UI pages stay private.
- Each site is hard-bound to one generated client agent through `AGENT_ENTERPRISE_SITE_KEY`, `AGENT_ENTERPRISE_SITE_TOKEN`, and `AGENT_ENTERPRISE_CLIENT_AGENT_ID`.
- The assistant’s job is CMS guidance and PM-style ticket shaping for Engineer; it is not a general agent picker.

## Program Surfaces

| Surface | Role |
|---|---|
| `programs/lavprishjemmeside/` | Program manifest and governance docs |
| `programs/lavprishjemmeside/local-mirror/` | Canonical local CMS mirror for sync, planning, rollout prep, and docs |
| `/home/theartis/repositories/lavprishjemmeside.dk` | Live cPanel repo for the parent CMS |
| `/home/theartis/repositories/ljdesignstudio.dk` | Live cPanel repo for the governed client site |
| Agent Enterprise private control plane | Orchestration, workboard, generated client agents |
| Lavpris public ingress + Tailscale Funnel | Public assistant access path from shared cPanel hosting |

## External Sprint Boundary

The planned 24-hour external sprint is intentionally folder-confined.

- Writable scope: `programs/lavprishjemmeside/`
- Execution authority: `requirements.md`, `design.md`, `tasks.md`, and `CPANEL_HANDOFF_CONTRACT.md`
- Outside-folder systems: documented in `OUTSIDE_FOLDER_DEPENDENCIES.md`

If a feature requires repo-root Agent Enterprise code, secrets, rollout tooling, cPanel runtime changes, or Tailscale/launchd changes, the external agent must stop at the handoff boundary, prepare the operator packet where needed, and record a follow-up instead of coding around it.

## Current Commerce Module

- Public storefront routes: `/shop/`, `/shop/[category]`, `/shop/produkt/[slug]`, `/shop/kurv`, `/shop/checkout`, `/shop/ordre/[token]`
- Admin shop routes: `/admin/shop/products`, `/admin/shop/orders`, `/admin/shop/settings`
- API route families: `/shop`, `/shop/admin`, `/shop/flatpay`
- Payment gateway: Flatpay / Frisbii
- Schema note: `node api/run-schema.cjs` still handles the core CMS schema, but shop-enabled installs currently also need `api/src/schema_shop.sql` applied

## Current Operating Rules

- Deploy code, schema, and env changes over SSH. The CMS publish button is not a code deployment tool.
- Use the publish button only for content/theme/header-footer rebuilds from the code already on the server.
- Treat Funnel reachability as a prerequisite for any CMS install that should use the assistant module.
- New installs must provision a draft assistant during setup; first admin login completes the wizard.
- Do not reintroduce `personal-agent`, Slack-based IAN automation, or generic public control-plane exposure.

## cPanel Notes

- Host: `cp10.nordicway.dk`
- SSH port: `33`
- cPanel user: `theartis`
- Default SSH `node` is legacy; use `/opt/alt/alt-nodejs22/root/usr/bin/node`
- CMS API restart marker: `api/tmp/restart.txt`
- Use `DB_HOST=127.0.0.1` on cPanel, not `localhost`
- Never write to `public_html`

## Where Detailed CMS Docs Live

The detailed CMS runtime, deployment, and assistant docs now live in the local mirror:

- `local-mirror/PROJECT_CONTEXT.md`
- `local-mirror/docs/SSH_FIRST_OPERATIONS.md`
- `local-mirror/docs/UPSTREAM_UPDATES.md`
- `local-mirror/docs/CLIENT_ASSISTANT_ARCHITECTURE.md`
- `local-mirror/docs/ROLLOUT_MANUAL.md`

Large feature/spec docs inside the mirror may still contain historical implementation detail. Treat the deploy/runtime authority as the documents listed above, not older GitHub Actions or IAN references.

# Lavprishjemmeside Introduction

> Reference-only: internal/operator handoff overview. External sprint agents should execute from `EXTERNAL_AGENT_INSTRUCTIONS.md`, `requirements.md`, `design.md`, and `tasks.md`.

## Purpose

Lavprishjemmeside is a Danish business-website CMS program operated from Agent Enterprise. It is not just one website. It is a combined product, deployment model, and client-operations lane made up of:

- the parent CMS and marketing site at `lavprishjemmeside.dk`
- the API/admin runtime behind `api.lavprishjemmeside.dk`
- governed client installs such as `ljdesignstudio.dk`
- the Agent Enterprise orchestration layer that now owns assistant runtime, ticket flow, and rollout governance

This document is the high-level handover brief for a developer who needs to understand what the project is, how the pieces fit together, and what the current live architecture actually is.

## What The Product Does

At the CMS level, Lavprishjemmeside is an Astro frontend plus Node.js admin/API product for building and maintaining business websites. The current feature set includes:

- a component-based page system
- a design-system editor
- header and footer management
- media management
- AI-assisted page generation
- a first-party shop module with storefront, cart, checkout, and order pages
- traffic/analytics surfaces
- a master/admin surface for higher-privilege operations
- a client-facing assistant module at `/admin/assistant/`

At the program level, Lavprishjemmeside is also the governance layer for client installs. The parent system can provision and operate client sites that use the same CMS runtime while keeping each install bound to its own assistant and environment.

## Current Live Surfaces

### Parent CMS

- Site: `https://lavprishjemmeside.dk`
- API: `https://api.lavprishjemmeside.dk`
- cPanel repo: `/home/theartis/repositories/lavprishjemmeside.dk`
- cPanel site root: `/home/theartis/lavprishjemmeside.dk`

### First Governed Client

- Site: `https://ljdesignstudio.dk`
- API: `https://api.ljdesignstudio.dk`
- cPanel repo: `/home/theartis/repositories/ljdesignstudio.dk`
- cPanel site root: `/home/theartis/ljdesignstudio.dk`

### Agent Enterprise Ownership

- Agent Enterprise private control plane owns orchestration, workboard, generated client agents, and ticket flow.
- A dedicated Lavpris public ingress exposes only the assistant route family.
- Shared cPanel hosting reaches Agent Enterprise through a Tailscale Funnel URL.

## Current Architecture In One Sentence

The browser talks only to the CMS; the CMS talks to Agent Enterprise; Agent Enterprise owns the assistant.

More precisely:

```text
Browser -> CMS /assistant routes -> CMS API proxy -> Lavpris public ingress -> private Agent Enterprise control plane
```

That separation is intentional. The CMS never exposes generic Agent Enterprise chat surfaces, agent pickers, model selectors, or site tokens to the browser.

## Program Folder Structure

This folder is the program manifest, not the main application working tree.

### Root Program Folder

- `README.md`
- `PROJECT_CONTEXT.md`
- `BRAND_VISION.md`
- `CHANGELOG.md`
- `introduction.md`
- `techstack.md`
- `developer.md`
- `cms/`
- `client-sites/`
- `local-mirror/`

### What Each Area Means

- `programs/lavprishjemmeside/`
  The program-level authority surface inside Agent Enterprise.

- `programs/lavprishjemmeside/local-mirror/`
  The canonical local working mirror for the GitHub-synced CMS code. This is where most implementation work happens when you are changing the CMS itself.

- `programs/lavprishjemmeside/cms/`
  Lightweight authority notes about the CMS surface as a governed product.

- `programs/lavprishjemmeside/client-sites/`
  Lightweight authority notes about governed client installs.

## Source Of Truth And Sync Order

There are several moving parts, so source-of-truth discipline matters.

### Authority Chain

- Live production behavior is whatever is currently serving from cPanel.
- GitHub is the shared code-sync surface between Bolt.new and Agent Enterprise.
- `local-mirror/` is the approved local working checkout inside Agent Enterprise.
- Agent Enterprise is the orchestration and deployment owner for the assistant lane.

### Required Sync Order

```text
Bolt.new -> GitHub -> cPanel
```

If a hotfix lands directly on cPanel, it must be backported to GitHub and then reflected in `local-mirror/` to avoid drift.

## Assistant Model

The old CMS-side IAN / `personal-agent` path is retired.

The current assistant model is:

- `lavprishjemmeside-master` is the orchestrator and owner of client assistants.
- each client gets one generated agent under `agents/lavprishjemmeside/clients/<site>/`
- the CMS assistant wizard writes the client-specific `soul.md` and `user.md`
- the browser stays locked to one site-specific client-support assistant
- engineering handoff becomes Accepted-stage work in Agent Enterprise

### First Live Client Assistant

The first live governed assistant is:

- site: `ljdesignstudio.dk`
- generated agent: `lavpris-client-ljdesignstudio-dk`

## Key Product Responsibilities

Lavprishjemmeside currently owns these concerns:

- CMS editing and publishing workflows
- e-commerce storefront, checkout, payment, and order-management workflows
- parent-site and client-site template/runtime consistency
- AI page assembly and CMS-guided content generation
- client assistant onboarding, chat, and ticket shaping
- SSH-first rollout discipline on cPanel
- assistant access via Funnel-backed ingress instead of direct public control-plane exposure

## What Is Explicitly Retired

These are no longer the live direction:

- CMS-side `personal-agent/`
- Slack-driven IAN runtime as the production assistant path
- GitHub Actions deploy as the primary deployment contract
- exposing the full Agent Enterprise control plane publicly for CMS use

## How To Read The Project

If you are newly taking over the project as an internal/operator developer, read in this order:

1. `README.md`
2. `PROJECT_CONTEXT.md`
3. `CHANGELOG.md`
4. `EXTERNAL_AGENT_INSTRUCTIONS.md`
5. `requirements.md`
6. `design.md`
7. `tasks.md`
8. `CPANEL_HANDOFF_CONTRACT.md`
9. `OUTSIDE_FOLDER_DEPENDENCIES.md`
10. `ROLLBACK_AND_REPAIR.md`
11. `introduction.md`
12. `techstack.md`
13. `developer.md`

## What A New Developer Should Understand First

- This is a remote-first project. The important runtime is on cPanel, not only on your local machine.
- `local-mirror/` is where CMS code changes should be made locally.
- Agent Enterprise is not optional glue. It is now part of the production architecture.
- The assistant feature is a cross-system implementation touching the CMS, Agent Enterprise, and infrastructure.
- The publish button is not a substitute for a real rollout when code, schema, or env changed.
- Change-control discipline matters. If you alter behavior, update `CHANGELOG.md` and run `npm run lavpris:release-health` before calling the work done.
- The external sprint boundary is strict. Do not assume an external agent can edit repo-root infrastructure or runtime services.

## Short Handover Summary

Lavprishjemmeside is a CMS product plus client governance system. The CMS itself lives in `local-mirror/` and on cPanel. The assistant runtime lives in Agent Enterprise. The current deployment model is SSH-first, the current assistant access model is Funnel-backed, and the current first governed client is `ljdesignstudio.dk`.

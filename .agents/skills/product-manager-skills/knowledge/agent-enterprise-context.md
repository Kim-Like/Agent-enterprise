# Agent Enterprise Context

Read this file whenever the user mentions `Agent Enterprise`, the control plane, `package.json`, `agents/registry.json`, `programs/registry.json`, activation order, master lanes, Lavpris, Theartis, cPanel estate, or remote SSH-first operations.

## Source of Truth

Use this priority order:

1. Repo-root `package.json`
2. Repo-root `agents/registry.json`
3. Repo-root `programs/registry.json`
4. Repo-root `docs/lavpris-ssh-first-operations.md`
5. Repo-root `docs/theartis-cpanel-estate-operations.md`
6. Legacy docs and READMEs that still say `AI-Enterprise`

If legacy wording conflicts with the current registries or runtime files, side with the current registries and call the mismatch out explicitly.

## Current Operating Model

- Canonical project name: `agent-enterprise`
- Purpose: single-process control plane for the Agent Enterprise rebuild
- Runtime posture: registry-first planning, explicit execution boundaries, no hidden long-lived worker model
- PM job in this repo: improve governance, sequencing, problem framing, and tradeoff quality without inventing capabilities that the current runtime model does not support

## Program Classes

Read `programs/registry.json` first when the user asks what to prioritize, what is live, or what should be activated next.

- `active`: worth surfacing in the control plane now
- `remote`: real surfaces that stay primarily outside the local runtime
- `hold`: intentionally dormant brownfield or heavy-stack work
- `stub`: placeholder scaffolds without meaningful runtime value yet

Use these classes as real product constraints, not labels to ignore. If a recommendation treats a `remote`, `hold`, or `stub` surface like a ready local module, push back.

Important current examples:

- `ian-agency`, `artisan-reporting`, `baltzer-reporting`, and `personal-assistant` are surfaced as current work
- Lavprishjemmeside surfaces are `remote`, not local first-party runtime modules
- Several Baltzer and Personal Assistant modules are still `stub`
- `seo-agent-playground` and `TCG-index` are `hold`, which means dormant by policy, not merely delayed

## Agent Enablement States

Read `agents/registry.json` first when the user asks about activation order, task readiness, or lane sequencing.

- `enabled`: part of the current safe activation set
- `ready`: technically prepared but intentionally not invoking yet
- `blocked`: dependent on missing external runtime or program maturity
- `held`: intentionally dormant due to risk, weight, or legacy coupling

Current sequencing signals to respect:

- Early active set includes `ian-master`, `data-observability-task`, `automation-quality-task`, `portfolio-pmo-task`, and `engineer`
- `platform-reliability-task` is `ready`, not fully active
- Several Baltzer tasks are `blocked`
- `baltzer-tcg-index-task` and `samlino-seo-agent-task` are `held`

Do not recommend skipping blocked dependencies or collapsing these states into a vague "in progress" bucket.

## Remote Estate Operations

For Lavpris or Theartis requests, read the repo-root ops docs before giving advice.

### Lavprishjemmeside

- Managed as an SSH-first remote estate
- This phase is read-only
- `Agent Enterprise` holds the operator contract and inspection tooling, not deploy or rollback automation

### Theartis Estate

- The account has write-capable surfaces, but the current phase only verifies writable paths
- Deploy automation, rollback automation, arbitrary remote shell execution from the dashboard, and secrets sync remain out of scope

When reviewing plans or requests for these estates:

- distinguish repo-backed surfaces from live-root-only surfaces
- name the actual risk boundary
- call out when a request assumes automation that the current control plane does not have

## Working Rules

- Use `Agent Enterprise` by default in your response language
- Translate older `AI-Enterprise` wording only when it still matches the current registry/runtime state
- For control-plane roadmaps and PRDs, anchor every recommendation to the current program classes, agent enablement states, and single-process runtime boundary
- If the user gives only a vague control-plane request, identify the decision that needs to be made before drafting artifacts

## Maintenance Note

This is a vendored project-local overlay on top of the upstream `product-manager-skills` package. If the upstream package changes, refresh it manually: reinstall to a temp location, diff, and then reapply the Agent Enterprise overlay instead of assuming automatic updates will preserve local edits.

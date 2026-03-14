# External Agent Instructions

This file is the execution contract for any external AI agent working in the full Agent Enterprise external monorepo.

## Read This First

Read in this order before changing anything:

1. `README.md`
2. `EXTERNAL_AGENT_INSTRUCTIONS.md`
3. `EXTERNAL_AGENT_PROMPT.md`
4. `OPERATOR_HANDOFF_CONTRACT.md`
5. `REPO_SYNC_POLICY.md`
6. `EXPORT_SANITIZATION_MANIFEST.md`
7. `AGENTS.md`
8. `INTRODUCTION.md`
9. `TECHSTACK.md`
10. the canonical docs for the program or subsystem you are touching

## Path Classes

### Editable By External Agent

- `agents/**`
- `.agents/**`
- `client/**`
- `config/**`
- `docs/**`
- `programs/**`
- `server/**`
- `tests/**`
- `.planning/**`
- package manifests and repo policy docs

### Visible But Operator-Owned

- operator runbooks describing cPanel, DB, mail, rollout, or estate operations
- package scripts that are intentionally blocked through `scripts/operator_only.sh`
- `programs/lavprishjemmeside/local-mirror/**` as a context/work copy governed by `REPO_SYNC_POLICY.md`

### Excluded From This Repo

- `.env.local`
- `.data/**`
- `.logs/**`
- `node_modules/**`
- local machine helper artifacts
- nested Git metadata

## Hard Rules

1. You may not execute or simulate SSH, cPanel, database, Roundcube, mailbox, env-secret, or live rollout work.
2. If work crosses that boundary, stop and prepare the operator packet defined in `OPERATOR_HANDOFF_CONTRACT.md`.
3. Do not invent substitute runtimes, fake local databases, replacement mail flows, or secret placeholders that pretend to be real.
4. Keep work reviewable and PR-ready.
5. Update the relevant changelog and contract docs whenever behavior or interfaces change.

## Program-Specific Rule

If a task targets a specific program, load that program's canonical docs before editing. For Lavprishjemmeside, the required set is:

- `programs/lavprishjemmeside/README.md`
- `programs/lavprishjemmeside/PROJECT_CONTEXT.md`
- `programs/lavprishjemmeside/CHANGELOG.md`
- `programs/lavprishjemmeside/requirements.md`
- `programs/lavprishjemmeside/design.md`
- `programs/lavprishjemmeside/tasks.md`
- `programs/lavprishjemmeside/CPANEL_HANDOFF_CONTRACT.md`

## Required PR / Handoff Shape

Every deliverable must include:

- concise summary of what changed
- files or subsystems changed
- tests/checks run
- docs/changelog updated
- operator handoff artifacts, if any remote execution is required
- `local-mirror` sync note, if Lavprishjemmeside CMS subtree changed
- blockers or unresolved risks

## Completion Rule

You may claim implementation complete only when:

- the code/docs in this repo are updated
- remote work has been converted into an explicit operator packet where needed
- no hidden dependency on SSH, cPanel, DB, or email access remains

You may not claim production rollout, cPanel verification, live DB migration, or mailbox changes complete from this repo.

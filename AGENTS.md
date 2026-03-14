# Agent Enterprise External Repo Instructions

This repository is the external-collaboration copy of Agent Enterprise.

Read these first:

1. `README.md`
2. `EXTERNAL_AGENT_INSTRUCTIONS.md`
3. `OPERATOR_HANDOFF_CONTRACT.md`
4. `REPO_SYNC_POLICY.md`
5. `EXPORT_SANITIZATION_MANIFEST.md`

Hard rules:

- do not execute or simulate SSH, cPanel, DB, Roundcube, mailbox, env-secret, or live rollout work
- use `OPERATOR_HANDOFF_CONTRACT.md` for any remote-execution requirement
- when touching Lavprishjemmeside, load the canonical docs under `programs/lavprishjemmeside/`
- do not treat blocked package scripts as bugs; they are intentionally operator-only in this repo

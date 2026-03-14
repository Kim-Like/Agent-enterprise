# Rollback And Repair

This document freezes the current known-good baseline before the Lavprishjemmeside V2 sprint.

It serves two actors:

- the external implementation agent, which must preserve this recovery boundary while working inside `programs/lavprishjemmeside/`
- the human operator, who owns SSH, cPanel, database, env, and live restore execution

## Baseline Date

- Snapshot date: `2026-03-14`
- Parent live reference: `lavprishjemmeside.dk`
- Pilot client reference: `ljdesignstudio.dk`

## Current Baseline References

### Local Mirror Git Baseline

- Local mirror path: `programs/lavprishjemmeside/local-mirror/`
- Branch: `main`
- HEAD: `f25e38320c2fcfebb1a79c0e3e1dcc2ca037a685`
- Remote: `git@github.com:kimjeppesen01/lavprishjemmeside.dk.git`

Note:

- The local mirror working tree is not the rollback authority by itself. The live parent and pilot-client health snapshots below are the recovery reference until a new sprint baseline is intentionally cut.

### Parent Live Snapshot

- Site: `https://lavprishjemmeside.dk`
- API: `https://api.lavprishjemmeside.dk/health`
- Build: `1.0.0+7aefe6e.dirty`
- Commit: `7aefe6ece17dc977da237eeb9599fa7882b98dd7`
- Changelog SHA: `852b001ed84f71d9b74fdce66c262db15f4eddec6b874ea0ab3a8489371286db`
- Last deployed at: `2026-03-14T11:14:40.000Z`

### Pilot Client Live Snapshot

- Site: `https://ljdesignstudio.dk`
- API: `https://api.ljdesignstudio.dk/health`
- Build: `1.0.0+cbf534d.dirty`
- Commit: `cbf534d040160cbcaf410e17224dab69093ece9d`
- Changelog SHA: `852b001ed84f71d9b74fdce66c262db15f4eddec6b874ea0ab3a8489371286db`
- Last deployed at: `2026-03-14T11:14:13.000Z`

Raw health snapshots are stored in `baselines/2026-03-14/`.

## Critical Flows

Repair or rollback decisions are based on these flows:

1. admin login and dashboard load
2. publish/build flow
3. assistant wizard and assistant chat
4. shop browse, product, cart, checkout, and order confirmation
5. shop admin products, orders, and settings
6. new-client installation baseline

If any critical flow breaks after the V2 sprint rollout, the first response is a bounded repair cycle. If one repair cycle does not restore the broken critical flow, revert to the saved baseline.

## Repair-First Rule

Use this sequence after a failed V2 rollout:

1. identify the failing critical flow
2. verify whether the issue is content/config/data or code
3. attempt one bounded repair cycle
4. re-test the broken flow
5. if the flow is still broken, initiate rollback

Bounded repair means:

- one targeted repair attempt for the confirmed failure
- no open-ended live debugging on production while more flows are breaking

## Rollback Trigger

Rollback is the default next step when:

- a critical flow remains broken after one bounded repair cycle
- the fix path requires unplanned risky changes under time pressure
- the failure affects both the parent site and the pilot client
- payment, assistant, or install flows become unreliable and cannot be quickly stabilized

## Required Operator Snapshots Before Pulling V2

These steps are operator-owned and must happen before the V2 rollout:

1. archive the current cPanel repo for `lavprishjemmeside.dk`
2. archive the current cPanel repo for `ljdesignstudio.dk`
3. dump the parent site database
4. dump the pilot-client database
5. preserve the current `api/.env` files outside the repo without committing secrets
6. record the current `/health` responses again immediately before rollout

## Database Dump Requirements

Required dumps:

- parent site database for `lavprishjemmeside.dk`
- pilot-client database for `ljdesignstudio.dk`

Minimum expectation:

- a full SQL dump before V2 rollout
- clear labeling with site, date, and time
- stored outside the git repo and outside the public web root

The external agent does not run these dumps. If a phase changes schema or seed expectations, it must hand back the exact DB/schema packet defined in `CPANEL_HANDOFF_CONTRACT.md`.

## Restore Checklist

### Parent Site Restore

1. restore the archived cPanel repo state for `lavprishjemmeside.dk`
2. restore the matching parent database dump
3. restore the known-good `api/.env`
4. rebuild and restart the Node app using the existing SSH-first runbook
5. verify `/health`, `/admin/`, `/admin/assistant/`, and the critical shop flows

### Pilot Client Restore

1. restore the archived cPanel repo state for `ljdesignstudio.dk`
2. restore the matching client database dump
3. restore the known-good `api/.env`
4. rebuild and restart the Node app using the existing SSH-first runbook
5. verify `/health`, `/admin/`, `/admin/assistant/`, and the critical shop flows

## Current Deploy And Env Contract

These are part of the recovery contract, but values remain secret and must not be committed:

- `AGENT_ENTERPRISE_URL`
- `AGENT_ENTERPRISE_PROVISION_TOKEN`
- `AGENT_ENTERPRISE_SITE_KEY`
- `AGENT_ENTERPRISE_SITE_TOKEN`
- `AGENT_ENTERPRISE_CLIENT_AGENT_ID`
- `AGENT_ENTERPRISE_LAVPRIS_MASTER_TOKEN` on the parent where applicable
- `LAVPRIS_PARENT_API_URL` where applicable
- `FLATPAY_*`
- SMTP/email credentials

The external agent may document env contracts and required variable changes, but it must not fabricate secret values or invent substitute runtime paths when operator-owned config is missing.

## What This Rollback Package Does Not Do

- it does not perform the backup automatically
- it does not store secrets
- it does not claim that repo-root release-health has been run
- it does not replace the SSH-first operator runbook

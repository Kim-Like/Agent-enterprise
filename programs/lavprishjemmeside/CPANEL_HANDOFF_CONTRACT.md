# cPanel Operator Handoff Contract

This document defines what the external agent must hand to the operator whenever a phase requires SSH, cPanel, live SQL, env changes, or production verification.

## Rule

If work depends on cPanel or live runtime execution, the external agent must not improvise a substitute solution. It must prepare the correct operator packet and stop at the handoff boundary.

## Handoff Packet Types

### SQL Schema / Migration Handoff

Required fields:

- purpose
- affected sites
- exact SQL file path or SQL patch
- run order
- idempotency expectation
- rollback/revert path
- verification queries
- post-run notes

### Seed Data Handoff

Required fields:

- purpose
- affected sites
- exact seed artifact
- re-run safety
- verification step

### Env / Config Handoff

Required fields:

- purpose
- affected sites
- variables affected
- expected value shape
- apply location
- restart or rebuild note
- rollback note
- verification step

### Live Verification Checklist

Required fields:

- affected sites
- health endpoints
- admin routes to verify
- shop routes to verify if relevant
- assistant routes to verify if relevant
- expected success conditions

### Rollback Note

Required fields:

- target baseline
- rollback trigger
- artifacts the operator should restore

## SQL Handoff Template

```md
## SQL Handoff

### Purpose
- <why this change exists>

### Affected Sites
- <lavprishjemmeside.dk / ljdesignstudio.dk / future installs>

### Artifact
- <exact SQL file or patch path>

### Run Order
1. <step>
2. <step>

### Idempotency
- <safe to re-run / additive only / one-time migration>

### Rollback
- <revert method or rollback rule>

### Verification Queries
- <query>
- <query>

### Post-Run Notes
- <restart, build, or verification note>
```

## Env / Config Handoff Template

```md
## Env / Config Handoff

### Purpose
- <why this change is needed>

### Affected Sites
- <site list>

### Variables
- <VAR_NAME>: <expected value shape, never secret value>

### Apply Location
- <api/.env or other path>

### Restart / Build Requirement
- <required action>

### Rollback
- <how to revert>

### Verification
- <health endpoint, route check, or UI check>
```

## Non-Negotiable Rule

If the external agent knows a phase requires live cPanel execution and does not produce the relevant packet, the phase is incomplete.

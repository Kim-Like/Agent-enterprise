# Operator Handoff Contract

This file defines what the external agent must hand back whenever work requires operator-only execution.

Operator-only means:

- SSH
- cPanel runtime actions
- direct database changes
- Roundcube or mailbox actions
- env/secret changes
- live verification or rollback steps

## Packet Types

### 1. SQL / Database Packet

Required fields:

- purpose
- affected application or program
- affected environments or sites
- exact SQL file or patch
- run order
- idempotency expectation
- verification queries
- rollback note

### 2. cPanel Runtime Packet

Required fields:

- purpose
- affected host/sites
- repo or site paths involved
- exact commands or file actions the operator must perform
- restart/rebuild note
- verification checklist
- rollback note

### 3. Env / Secret Packet

Required fields:

- purpose
- affected application or site
- variable names
- expected value shape, never real secret values
- where to apply them
- restart/rebuild implication
- rollback note

### 4. Mail / Roundcube Packet

Required fields:

- purpose
- affected domain/mailbox
- requested mailbox or routing change
- any DNS or SMTP dependency
- verification steps
- rollback note

### 5. Live Verification Packet

Required fields:

- surfaces to verify
- exact URLs, commands, or admin flows
- expected results
- failure conditions

## Rule

If a task needs one of these packets and the packet is missing, the task is incomplete.

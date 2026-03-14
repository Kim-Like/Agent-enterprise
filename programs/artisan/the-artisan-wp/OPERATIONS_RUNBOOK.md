# The Artisan WordPress Operations Runbook

## Scope

Applies to:

- `reporting.theartisan.dk` control-plane orchestration for WP/B2B operations
- live WordPress runtime under `~/public_html`
- B2B plugin `artisan-b2b-portal`
- `saren` + `saren-child` theme stack

## Primary Verification Endpoints

- `GET /api/programs/artisan-wordpress/inventory`
- `POST /api/programs/artisan-wordpress/ssh-check`
- `POST /api/programs/artisan-wordpress/ops-action` (write-authorized)

## SSH Preconditions

Required env keys:

- `CPANEL_SSH_HOST`
- `CPANEL_SSH_PORT`
- `CPANEL_SSH_USER`
- `CPANEL_SSH_KEY_PATH`

## Controlled Ops Actions

Allowed actions:

- `service_status`
- `backup_db`
- `backup_files`
- `flush_cache`
- `deploy_pull`

No free-form shell execution is permitted through control-plane routes.

## Daily Intake Workflow (Artisan Master)

1. Intake request through workspace template.
2. Classify via `POST /api/workspace/artisan/intake-classify`.
3. Route task to specialist:
- WP/B2B/catalog/design: `spec.artisan.wp_b2b`
- Reporting/accounting: `spec.artisan.accounting`
- Campaign/email lifecycle: `spec.artisan.brevo_lifecycle`
4. Require structured result packet with verification and rollback notes.
5. Escalate blocked tasks to Engineer using structured escalation payload.

## Incident Triage

1. Run `inventory`.
2. Run `ssh-check` for `theme_plugin` and `db_probe`.
3. Capture correlation ID in escalation record.
4. If runtime mutation required, run only allowlisted `ops-action`.

## Backout

If a WP/B2B change introduces regression:

1. restore from latest `backup_files` artifact
2. restore latest `backup_db` dump if DB rollback is needed
3. re-run `inventory` and `ssh-check` to confirm active state

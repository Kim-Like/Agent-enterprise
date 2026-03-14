# Lavprishjemmeside Developer Handover

> Reference-only: internal/operator runbook. External sprint agents should use `EXTERNAL_AGENT_INSTRUCTIONS.md`, `requirements.md`, `design.md`, `tasks.md`, and `OUTSIDE_FOLDER_DEPENDENCIES.md` as execution authority.

## Goal Of This Document

This is the working runbook for the next developer. It explains how to safely continue development, where to make changes, how to deploy them, and what pitfalls already exist in the current setup.

If `introduction.md` explains what the project is and `techstack.md` explains what it runs on, this document explains how to actually work on it.

## First-Day Reading Order

Read these before touching code:

1. `README.md`
2. `PROJECT_CONTEXT.md`
3. `introduction.md`
4. `techstack.md`
5. `developer.md`
6. `local-mirror/docs/CLIENT_ASSISTANT_ARCHITECTURE.md`
7. `local-mirror/docs/SSH_FIRST_OPERATIONS.md`
8. `local-mirror/docs/UPSTREAM_UPDATES.md`
9. `local-mirror/docs/ROLLOUT_MANUAL.md`
10. `CHANGELOG.md`

## Working Rules

### Rule 1: Use The Local Mirror For CMS Code

Do CMS implementation work in:

- `programs/lavprishjemmeside/local-mirror/`

Do not treat `programs/lavprishjemmeside/` root as the main app codebase. It is the program manifest and handoff layer.

### Rule 2: Treat Deployment As SSH-First

The publish button is not a full deploy path.

Use SSH when:

- code changed
- schema changed
- `api/.env` changed
- assistant integration changed

Use the publish button only when the live repo already has the intended code and you only need a rebuild/sync for content, theme, or header/footer changes.

### Rule 3: Do Not Reintroduce Retired Assistant Paths

Do not reintroduce:

- `personal-agent/`
- Slack-driven IAN runtime as the production path
- generic public Agent Enterprise chat access for the CMS

The live assistant model is the Funnel-backed Agent Enterprise integration.

### Rule 4: Update The Changelog

If you change:

- CMS behavior
- assistant behavior
- rollout behavior
- operator docs
- data model expectations

then update `CHANGELOG.md` under `[Unreleased]` before handoff.

For Lavprishjemmeside work, handoff is not complete until you also run:

```bash
npm run lavpris:release-health
```

That command verifies the changelog copies, active path health, live parent telemetry, and client update drift.

## Where To Make Changes

### If You Are Changing UI Or Frontend Pages

Work in:

- `local-mirror/src/pages/`
- `local-mirror/src/components/`
- `local-mirror/src/layouts/`
- `local-mirror/src/styles/`
- `local-mirror/src/data/`

Typical areas:

- `src/pages/admin/assistant.astro`
- `src/pages/admin/shop/products.astro`
- `src/pages/admin/shop/orders.astro`
- `src/pages/admin/shop/settings.astro`
- `src/pages/shop/*.astro`
- `src/pages/admin/pages.astro`
- `src/pages/admin/styling.astro`
- `src/components/Product*.astro`
- `src/components/CartDrawer.astro`
- `src/scripts/cart.js`
- `src/components/*.astro`

### If You Are Changing CMS API Behavior

Work in:

- `local-mirror/api/server.cjs`
- `local-mirror/api/src/routes/`
- `local-mirror/api/src/services/`
- `local-mirror/api/src/middleware/`

Examples:

- auth changes: `api/src/routes/auth.js`
- assistant proxy changes: `api/src/routes/assistant.js`
- shop public API: `api/src/routes/shop-public.cjs`
- shop admin API: `api/src/routes/shop-admin.cjs`
- Flatpay webhook handling: `api/src/routes/shop-flatpay.cjs`
- payment service: `api/src/services/flatpay.cjs`
- commerce emails: `api/src/services/shop-email.cjs`
- publish behavior: `api/src/routes/publish.js`
- AI generation logic: `api/src/routes/ai-generate.js`

### If You Are Changing Database Shape

Work in:

- `local-mirror/api/src/schema*.sql`
- `local-mirror/api/run-schema.cjs`

For commerce changes, also check:

- `local-mirror/api/src/schema_shop.sql`

Keep changes additive whenever possible. The schema runner is intentionally written to be safe to re-run on live installs.

### If You Are Changing Assistant Runtime Behavior

That is cross-system work.

You will likely need to touch:

- CMS proxy:
  - `local-mirror/api/src/routes/assistant.js`
  - `local-mirror/api/src/services/agent-enterprise.js`
  - `local-mirror/src/pages/admin/assistant.astro`
- Agent Enterprise:
  - `server/src/routes/lavpris.js`
  - `server/src/lib/lavpris-rollout.js`
  - `server/src/lib/lavpris-path-health.js`
  - `server/src/lib/lavpris-client-agents.js`
  - `server/src/lavpris-public-ingress.js`
  - `agents/lavprishjemmeside/templates/client-agent/`
  - `agents/lavprishjemmeside/clients/<site>/`

## Common Development Tasks

### 1. Pull The Latest CMS State Into The Local Mirror

From Agent Enterprise root:

```bash
npm run lavpris:mirror-pull
npm run lavpris:sync-status
```

Use this before editing if you are unsure whether GitHub, local mirror, and cPanel are aligned.

Before handoff, also run:

```bash
npm run lavpris:release-health
```

Interpret the result like this:

- `0`: aligned
- `1`: visible rollout warning such as pending parent deploy or client sites behind
- `2`: hard failure such as missing telemetry, stale active paths, or changelog mismatch

### 2. Inspect The CMS Locally

From `local-mirror/`:

```bash
npm install
npm run dev
```

For API-only checks:

```bash
node api/server.cjs
```

### 3. Re-run Schema Locally Or On Server

```bash
node api/run-schema.cjs
```

Use this when additive schema files were introduced.

If the install should have the shop module enabled, also apply:

```bash
mysql -u <user> -p <database> < api/src/schema_shop.sql
```

### 4. Build The Site

```bash
npm run build
```

Remember that build runs `scripts/generate-theme.mjs` before Astro.

## Deployment Playbooks

### Existing Install Rollout

Use this for parent or client-site updates:

1. Update the repo under `~/repositories/<domain>`
2. Preserve local `api/.env`
3. Run schema if needed:
   - `node api/run-schema.cjs`
   - if the shop module is being enabled for the first time: `mysql -u <user> -p <database> < api/src/schema_shop.sql`
4. Verify rollout env:
   - `AGENT_ENTERPRISE_URL`
   - `AGENT_ENTERPRISE_PROVISION_TOKEN`
   - `AGENT_ENTERPRISE_LAVPRIS_MASTER_TOKEN` on the parent site when full rollout visibility is needed
   - `LAVPRIS_PARENT_API_URL` if the parent API origin differs from the default `https://api.lavprishjemmeside.dk`
5. Build the site:
   - `npm run build`
6. Sync `dist/` to the site root
7. Restart the API
8. Verify `/health`, `/admin/`, `/admin/assistant/`, and `/rollout/status`
9. Run `npm run lavpris:release-health` from Agent Enterprise and surface any warning in the handoff

### New Install

Use:

```bash
npm run setup
```

The installer:

- writes `api/.env`
- runs schema
- creates the admin user
- provisions a draft assistant in Agent Enterprise
- writes the site binding values back into `api/.env`
- builds the frontend

After that, finish cPanel Node.js app setup and log into `/admin/assistant/` to complete the wizard.

If the site should use the e-commerce module, also:

- add the `FLATPAY_*` values to `api/.env`
- register the webhook URL `/shop/flatpay/webhook` in Flatpay / Frisbii
- create products in `/admin/shop/products`

### Agent Enterprise Rollout

If you change Lavpris assistant behavior in Agent Enterprise:

1. update the relevant `server/` or `agents/` files
2. run `npm test` at Agent Enterprise root
3. restart:
   - Agent Enterprise control plane
   - Lavpris public ingress
4. verify:
   - `http://127.0.0.1:3000/health`
   - `http://127.0.0.1:8000/health`
   - Funnel URL `/health`

## Current Live Operational Reality

### CMS Hosting

- CMS repos live on `cp10.nordicway.dk`
- cPanel user is `theartis`
- do not write to `public_html`
- work against the repo clones under `/home/theartis/repositories/...`

### Agent Enterprise Hosting

- Agent Enterprise currently runs on the always-on Mac host
- the Lavpris ingress runs separately on the same machine
- Tailscale Funnel exposes the ingress publicly

### Assistant Access Model

- browser only calls CMS-local `/assistant`
- CMS API uses site binding values from `api/.env`
- Agent Enterprise public ingress exposes only `/api/lavpris/...`
- each site is locked to one generated client agent

### Shop Module

- public routes live under `/shop/*`
- admin routes live under `/admin/shop/*`
- payments use Flatpay / Frisbii hosted checkout
- webhook completion path is `/shop/flatpay/webhook`

## cPanel-Specific Quirks

### Use Node 22, Not Whatever `node` Happens To Be

On cPanel, the shell default `node` can be too old.

Use:

```bash
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
```

or the app-specific CloudLinux Node 22 path when needed.

### Prefer CloudLinux App Restart For Node Apps

This is reliable:

```bash
cloudlinux-selector restart --json --interpreter nodejs --app-root /home/theartis/repositories/<domain>/api
```

Treat `touch api/tmp/restart.txt` as a legacy fallback only. The primary restart contract is the CloudLinux restart command above, especially when stale `lsnode` workers are present.

### cPanel Build Resource Limits Are Real

Astro/esbuild builds can fail on cPanel because of per-user process limits.

If a build crashes with thread/process errors, retry with constrained worker settings:

```bash
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
export GOMAXPROCS=1
export RAYON_NUM_THREADS=1
export npm_config_jobs=1
export CI=1
npm run build
```

This is a real, observed workaround and should be treated as part of the current operational runbook.

## Assistant-Specific Notes

### Generated Client Agents

Generated client-agent packets live under:

- `agents/lavprishjemmeside/clients/lavprishjemmeside-dk/`
- `agents/lavprishjemmeside/clients/ljdesignstudio-dk/`

Framework-owned templates live under:

- `agents/lavprishjemmeside/templates/client-agent/`

Client-specific `soul.md` and `user.md` are updated through the CMS wizard via Agent Enterprise.

### Current First Live Client

The main real-world validation site is:

- `ljdesignstudio.dk`

Use that site first when validating assistant behavior.

### Ticket Flow

The assistant does not assign work directly to Engineer from the browser.

The intended flow is:

1. client talks to dedicated assistant
2. assistant helps shape a brief
3. client explicitly approves ticket send
4. Agent Enterprise creates Accepted-stage engineering work
5. operator / Engineer review continues in Agent Enterprise

## Troubleshooting

### `/admin/assistant/` Loads But Assistant State Fails

Check:

- `AGENT_ENTERPRISE_URL`
- `AGENT_ENTERPRISE_SITE_KEY`
- `AGENT_ENTERPRISE_SITE_TOKEN`
- `AGENT_ENTERPRISE_CLIENT_AGENT_ID`
- Funnel `/health`
- Lavpris ingress `/health`

### Assistant Wizard Writes Packets But Chat Does Not Open

Check both:

- CMS page logic in `src/pages/admin/assistant.astro`
- session targeting flow through:
  - `api/src/routes/assistant.js`
  - `api/src/services/agent-enterprise.js`
  - `server/src/routes/lavpris.js`
  - `server/src/lib/lavpris-client-agents.js`

This path has already had one production bug where empty sessions existed but the composer did not render because the page only showed chat when messages were already present.

### Checkout Creates Orders But Payment Never Marks Them Paid

Check:

- `FLATPAY_WEBHOOK_SECRET`
- `FLATPAY_WEBHOOK_URL`
- route mount order in `api/server.cjs`
- `api/src/routes/shop-flatpay.cjs`
- whether `api/src/schema_shop.sql` was applied and `shop_settings` row exists

### API Route Looks Correct On Disk But Live Traffic Is Wrong

Possible cause:

- stale CloudLinux `lsnode` workers

Try:

- `cloudlinux-selector restart --json --interpreter nodejs --app-root ...`
- if necessary, inspect and clear stale workers carefully

### Build Fails On Local macOS

Potential cause:

- local `esbuild` binary incompatibility on older macOS versions

If local build is blocked, do not guess. Either:

- build on a compatible machine
- or build on cPanel with constrained worker settings

## Recommended Handoff Checklist After Any Change

1. Update code in the right surface:
   - CMS
   - Agent Enterprise
   - or both
2. Update `CHANGELOG.md`
3. Run the relevant verification:
   - `npm test` for Agent Enterprise
   - CMS API syntax/build checks
4. Roll out over SSH if the change affects live runtime
5. Verify:
   - site
   - API `/health`
   - assistant UI if relevant
6. Write a short handoff note that says:
   - what changed
   - what was verified
   - what was not verified
   - any operational caveats

## Final Advice To The Next Developer

Treat Lavprishjemmeside as one product with three inseparable concerns:

- CMS product code
- deployment/hosting reality on cPanel
- assistant/orchestration reality in Agent Enterprise

If you work in only one of those layers and forget the others, you will create drift or break production behavior. The safest path is to assume every meaningful assistant change is cross-system until proven otherwise.

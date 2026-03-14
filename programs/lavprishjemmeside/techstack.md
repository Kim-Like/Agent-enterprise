# Lavprishjemmeside Tech Stack

> Reference-only: internal/operator stack map. External sprint agents should treat this as context, not as the sprint authority.

## Stack Summary

Lavprishjemmeside is a split system:

- a static-site and admin frontend built with Astro
- a Node.js + Express CMS API using MySQL
- an Agent Enterprise backend using Fastify + SQLite for orchestration and assistant runtime
- cPanel hosting for the CMS installs
- a Mac-hosted Agent Enterprise runtime exposed to cPanel through Tailscale Funnel

This document lists the concrete technologies, runtime boundaries, important directories, and operational constraints a developer needs before making changes.

## Application Layers

| Layer | Technology | Notes |
|---|---|---|
| Parent + client frontend | Astro 5 | Static build into `dist/` |
| Styling | Tailwind CSS 4 | Build-time styling with generated theme tokens |
| Frontend motion | GSAP | Used for presentation and interaction polish |
| CMS API | Node.js + Express 5 | CommonJS API runtime under `local-mirror/api/` |
| Database | MySQL / MariaDB | One DB per site install on cPanel |
| Auth | JWT + bcrypt | Admin authentication and protected CMS endpoints |
| AI generation in CMS | Anthropic SDK | Used for AI page/content assembly routes |
| Email/password reset | Nodemailer + Resend-compatible config | Password reset flow and SMTP fallback behavior |
| Analytics integration | Google APIs | Search Console / GA4 surfaces |
| Media | Multer + Pexels integration | Uploads and stock media workflows |
| Commerce payments | Flatpay / Frisbii | Hosted checkout session + signed webhooks |
| Agent orchestration | Agent Enterprise | Private control plane plus Lavpris ingress |
| Agent Enterprise server | Fastify | Single-process control plane |
| Agent Enterprise persistence | SQLite | Control-plane state, tasks, generated client-agent records |
| Public assistant ingress | Fastify service + Tailscale Funnel | Narrow public surface for CMS assistant access |

## CMS Codebase Layout

Primary local code checkout:

- `programs/lavprishjemmeside/local-mirror/`

### Frontend Structure

- `src/pages/`
  Astro routes for site pages and admin pages
- `src/pages/shop/`
  storefront, category, product, cart, checkout, and order-confirmation pages
- `src/pages/admin/`
  CMS/admin UI, including:
  - `assistant.astro`
  - `dashboard.astro`
  - `shop/products.astro`
  - `shop/orders.astro`
  - `shop/settings.astro`
  - `pages.astro`
  - `styling.astro`
  - `header-footer.astro`
  - `media.astro`
  - `traffic.astro`
  - `master.astro`
- `src/components/`
  reusable site components and component-library entries
- `src/scripts/cart.js`
  localStorage-backed cart state used by the shop flow
- `src/layouts/`
  shared layout wrappers
- `src/styles/`
  generated and shared theme files
- `src/data/`
  generated design/header-footer data used at build time

### Backend Structure

- `api/server.cjs`
  route registration and API bootstrap
- `api/src/routes/`
  route modules by domain
- `api/src/services/`
  integrations and helper services
- `api/src/middleware/`
  auth, logging, caching, rate limiting
- `api/src/db.js`
  MySQL connection pool
- `api/run-schema.cjs`
  additive schema runner

### Operational Docs

- `docs/CLIENT_ASSISTANT_ARCHITECTURE.md`
- `docs/SSH_FIRST_OPERATIONS.md`
- `docs/UPSTREAM_UPDATES.md`
- `docs/ROLLOUT_MANUAL.md`
- `docs/DEPLOY_HEALTHCHECK.md`
- `docs/DEPLOY_NEW_DOMAIN.md`

## Frontend Stack Details

From `local-mirror/package.json`:

- `astro`
- `@astrojs/sitemap`
- `tailwindcss`
- `@tailwindcss/vite`
- `gsap`

### Build Scripts

- `npm run dev`
  Astro dev server
- `npm run build`
  runs `scripts/generate-theme.mjs` and then `astro build`
- `npm run setup`
  installer for a new site
- `npm run verify`
  deploy verification helper
- `npm run package`
  ZIP/package generation flow

### Build-Time Token Generation

`scripts/generate-theme.mjs` regenerates:

- `src/styles/theme.css`
- `src/data/design-features.json`
- `src/data/header-footer.json`
- `public/.htaccess`

That means the frontend build depends on current API-side design settings and layout data.

## CMS API Stack Details

From `local-mirror/api/package.json`:

- `express`
- `helmet`
- `cors`
- `jsonwebtoken`
- `bcrypt`
- `mysql2`
- `nodemailer`
- `multer`
- `googleapis`
- `@anthropic-ai/sdk`
- `express-rate-limit`
- `node-cache`
- `dotenv`

### Mounted CMS API Route Groups

Mounted in `api/server.cjs`:

- `/health`
- `/events`
- `/auth`
- `/sessions`
- `/design-settings`
- `/header-footer`
- `/theme-presets`
- `/theme-settings`
- `/components`
- `/page-components`
- `/ai`
- `/ai-generate`
- `/ai-prompt-settings`
- `/assistant`
- `/rollout`
- `/shop/flatpay`
- `/shop/admin`
- `/shop`
- `/publish`
- `/media`
- `/traffic`
- `/master`

### Important Route Domains

- `auth.js`
  login, registration, current user, password reset
- `components.js` and `page-components.js`
  component library and page composition
- `design-settings.js`, `theme-presets.js`, `theme-settings.js`
  design-system and visual configuration
- `ai-context.js`, `ai-generate.js`, `ai-prompt-settings.js`
  AI-assisted content and page generation
- `assistant.js`
  CMS-local proxy to Agent Enterprise
- `rollout.js`
  CMS-local rollout-status proxy for parent/client update warnings
- `shop-public.cjs`
  public products, categories, cart validation, shipping, discounts, order create, and order lookup
- `shop-admin.cjs`
  admin CRUD for catalog, orders, shipping, discounts, settings, and dashboard stats
- `shop-flatpay.cjs`
  Flatpay / Frisbii webhook processing
- `flatpay.cjs`
  payment session creation and webhook signature verification
- `shop-email.cjs`
  Danish customer/admin transactional mail templates for commerce
- `publish.js`
  rebuild-and-sync for code already on the server
- `master.js`
  privileged operational routes

### Release Telemetry Contract

`GET /health` is now part of the release system, not just a liveness probe. The `cms` payload is expected to include:

- `release_version`
- `api_version`
- `build`
- `commit`
- `commit_short`
- `git_ref`
- `git_committed_at`
- `dirty`
- `update_channel`
- `changelog_sha`
- `changelog_updated_at`
- `last_deployed_at`

`GET /rollout/status` is the browser-safe CMS route for update visibility. It proxies to Agent Enterprise and drives the parent pending-rollout banner plus the client-side `Opdatering tilgængelig` warning.

## CMS Database Model

The CMS uses MySQL. `api/run-schema.cjs` applies additive schema files in a fixed order.

### Core Tables

From `schema.sql` and related files:

- `events`
- `users`
- `content_pages`
- `security_logs`
- `sessions`
- `design_settings`
- `theme_presets`
- `components`
- `page_components`
- `ai_usage`
- `header_footer_settings`
- `media`
- `password_reset_tokens`
- `page_meta`
- `ai_prompt_settings`
- `site_theme_settings`
- `sites`
- `kanban_items`
- `master_audit_log`
- `assistant_settings`

### Important Schema Extensions

- design feature toggles
- theme modes and theme settings
- component source/version fields
- modern mega-menu header/footer fields
- assistant local state
- master/kanban support tables
- shop catalog, checkout, order, and payment tables via `schema_shop.sql`

### Shop Module Schema Note

`schema_shop.sql` is currently separate from the default `node api/run-schema.cjs` flow. Shop-enabled installs need both:

1. `node api/run-schema.cjs`
2. `mysql -u <user> -p <database> < api/src/schema_shop.sql`

The shop schema adds:

- `product_categories`
- `products`
- `product_variants`
- `product_images`
- `customers`
- `shipping_methods`
- `discount_codes`
- `orders`
- `order_items`
- `order_events`
- `shop_settings`

### Assistant Local CMS Table

`schema_assistant_settings.sql` adds the CMS-local assistant state row used to store:

- assistant status
- assistant name
- site key
- bound client-agent id
- last session id
- questionnaire JSON
- preview `user.md` and `soul.md`

## Agent Enterprise Stack Details

Relevant directories:

- `server/`
- `agents/lavprishjemmeside/`
- `config/`
- `scripts/`

### Agent Enterprise Runtime

- server framework: Fastify
- persistence: SQLite at `.data/control-plane.sqlite`
- registry model: file-backed agent/program registries with generated overlay support
- assistant runtime: generated client agents stored under `agents/lavprishjemmeside/clients/`

### Relevant Agent Enterprise Files

- `server/src/routes/lavpris.js`
  Lavpris assistant route family
- `server/src/lib/lavpris-client-agents.js`
  generated client-agent service
- `server/src/lavpris-public-ingress.js`
  narrow public ingress service
- `server/src/lib/internal-api.js`
  internal trust boundary between ingress and control plane
- `agents/lavprishjemmeside/templates/client-agent/`
  framework-controlled packet templates
- `agents/lavprishjemmeside/clients/<site>/`
  generated client-agent packets per site

## Assistant Network Stack

### Public Path

```text
Browser -> CMS /assistant routes -> CMS API proxy -> Funnel URL -> Lavpris public ingress -> private Agent Enterprise
```

### Public Ingress Route Family

Only these routes are meant to be public:

- `GET /health`
- `POST /api/lavpris/client-agents/provision`
- `GET /api/lavpris/sites/:siteKey/assistant`
- `PATCH /api/lavpris/sites/:siteKey/assistant/setup`
- `POST /api/lavpris/sites/:siteKey/assistant/sessions`
- `POST /api/lavpris/sites/:siteKey/assistant/sessions/:sessionId/messages`
- `POST /api/lavpris/sites/:siteKey/assistant/tickets`

Everything else should stay private or return `404`.

## Hosting And Infrastructure

### CMS Hosting

- platform: cPanel / LiteSpeed / CloudLinux
- SSH host: `cp10.nordicway.dk`
- SSH port: `33`
- user: `theartis`
- repo roots:
  - `/home/theartis/repositories/lavprishjemmeside.dk`
  - `/home/theartis/repositories/ljdesignstudio.dk`

### Node On cPanel

Important quirk:

- default SSH `node` may be legacy
- use the CloudLinux Node 22 toolchain for builds and schema work

Known good path:

- `/opt/alt/alt-nodejs22/root/usr/bin`

For Node app restarts on cPanel, `cloudlinux-selector restart --json --interpreter nodejs --app-root <repo>/api` is more reliable than assuming `touch api/tmp/restart.txt` alone will always refresh stale workers.

### Agent Enterprise Hosting

Current live model:

- private control plane running on the Mac host
- Lavpris public ingress running on the same Mac host
- Tailscale Funnel exposing the ingress to the internet

Relevant scripts:

- `scripts/start_agent_enterprise.sh`
- `scripts/start_lavpris_public_ingress.sh`
- `scripts/tailscale-funnel.sh`

## Environment Variables

### CMS Install Env

Important values written to `api/.env`:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`
- `PASSWORD_RESET_BASE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM_NAME`
- `EMAIL_FROM_ADDRESS`
- `ANTHROPIC_API_KEY`
- `GITHUB_PAT`
- `PUBLIC_SITE_URL`
- `PUBLIC_API_URL`
- `FLATPAY_API_KEY`
- `FLATPAY_WEBHOOK_SECRET`
- `FLATPAY_TEST_MODE`
- `FLATPAY_WEBHOOK_URL`
- `FLATPAY_ACCEPT_URL`
- `FLATPAY_CANCEL_URL`
- `AGENT_ENTERPRISE_URL`
- `AGENT_ENTERPRISE_PROVISION_TOKEN`
- `AGENT_ENTERPRISE_SITE_KEY`
- `AGENT_ENTERPRISE_SITE_TOKEN`
- `AGENT_ENTERPRISE_CLIENT_AGENT_ID`

### Agent Enterprise Env

Important values from `config/env.example`:

- `HOST`
- `PORT`
- `PUBLIC_ORIGIN`
- `AGENT_ENTERPRISE_INTERNAL_TOKEN`
- `LAVPRIS_PUBLIC_INGRESS_HOST`
- `LAVPRIS_PUBLIC_INGRESS_PORT`
- `LAVPRIS_PUBLIC_INGRESS_ORIGIN`
- `APP_DATA_DIR`
- `SQLITE_PATH`
- `SESSION_SECRET`
- `ADMIN_TOKEN`
- `LAVPRIS_PROVISION_TOKEN`
- `CLAUDE_BINARY` / `CLAUDE_BINARY_PATH`
- `ANTHROPIC_API_KEY`
- cPanel SSH and path variables

## Testing And Verification

### Agent Enterprise

- `npm test` at the Agent Enterprise root
- current tests cover Lavpris client-agent provisioning, session locking, ingress restrictions, and ticket creation

### CMS

Typical checks:

- `node --check` on API JS files
- `npm run build`
- `/health` checks
- `/admin/assistant/` load test

### Deploy Health Checks

- `https://api.<domain>/health`
- `https://<domain>/`
- `https://<domain>/admin/assistant/`

## Known Constraints

- Shared cPanel hosting cannot join the tailnet directly.
- cPanel builds can hit process/thread limits; if Astro/esbuild crashes, forcing lower worker counts can help:
  - `GOMAXPROCS=1`
  - `RAYON_NUM_THREADS=1`
  - `npm_config_jobs=1`
  - `CI=1`
- Older local macOS environments may hit `esbuild` binary compatibility issues, so do not assume every local machine can build this repo without adjustment.

## Tech Stack Bottom Line

This project is not “just an Astro site” and not “just a Node CMS.” It is a multi-surface system:

- Astro/Tailwind/GSAP for the site and admin UI
- Express/MySQL for the per-site CMS runtime
- Fastify/SQLite for Agent Enterprise orchestration
- Tailscale Funnel as the bridge between shared cPanel hosting and the private assistant backend
- SSH-first operational discipline for releases

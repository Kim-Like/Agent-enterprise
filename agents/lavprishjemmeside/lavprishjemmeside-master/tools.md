# Lavprishjemmeside Master - Tools

## Domain Tooling
- Core codebase at `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/lavprishjemmeside.dk`
- Companion domain repo at `ssh://theartis@cp10.nordicway.dk/home/theartis/repositories/ljdesignstudio.dk`
- Primary live site: `https://lavprishjemmeside.dk/`
- Governed client site: `https://ljdesignstudio.dk/`
- Commerce surfaces: `/shop/`, `/shop/checkout`, `/shop/ordre/:token`, `/admin/shop/products`, `/admin/shop/orders`, `/admin/shop/settings`
- Payment surface: Flatpay / Frisbii checkout creation plus `/shop/flatpay/webhook`
- MySQL on cPanel remains the primary application datastore

## Essential Program Docs
- `programs/lavprishjemmeside/README.md`
- `programs/lavprishjemmeside/PROJECT_CONTEXT.md`
- `programs/lavprishjemmeside/BRAND_VISION.md`
- `programs/lavprishjemmeside/CHANGELOG.md`

## Control-Plane Surfaces
- `/health`
- `/api/meta`
- `/api/programs`
- `/api/agents`
- `/api/system-map`
- `/api/kanban`
- `/api/tasks/intake`
- `/api/tasks/:taskId`
- `/api/chat/agents/:agentId/workspace`

## Remote Operations
- `npm run lavpris:preflight`
- `npm run lavpris:inventory`
- `npm run lavpris:health`
- `npm run lavpris:repo-status`
- `npm run lavpris:path-health`
- `npm run lavpris:rollout-status`
- `npm run lavpris:release-health`
- `docs/lavpris-ssh-first-operations.md`
- `docs/theartis-cpanel-estate-operations.md`

## Guardrails
- Preserve Git as the code source of truth and cPanel MySQL as the application data source of truth.
- Do not invent local module folders for remote-only functionality.
- Keep release, rollout, and operator guidance synchronized with `programs/lavprishjemmeside/CHANGELOG.md`.
- Do not treat Lavprishjemmeside work as done until `npm run lavpris:release-health` has been checked and any warning has been surfaced.
- Escalate cPanel, MySQL, runtime, or security risk to Engineer instead of papering over it with assumptions.

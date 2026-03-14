# Phase 1 Research: Single-Process Control Plane Bootstrap

## Audit Snapshot

- The copied agent tree is mostly prompt packs, routing rules, and capability notes.
- The copied program tree mixes a few real local apps with many placeholders, remote manifests, and brownfield holds.
- The legacy runtime problems to avoid are split frontend/backend entrypoints, request-path child-process execution, and excessive polling.

## Standard Stack

- **Runtime:** Node 20+ in plain JavaScript ESM
- **Server:** Fastify
- **Static delivery:** `@fastify/static`
- **State:** local SQLite
- **Schema and env validation:** Zod
- **Logging:** Pino via Fastify defaults
- **Frontend delivery:** backend-served HTML, CSS, and small ES modules
- **Tests:** `node:test` plus Fastify injection
- **Process control:** one `npm run start` path plus one Tailscale serve wrapper

## Frontend Recommendation

Use backend-served static HTML and small ES modules for Phase 1.

Reason:
- the canonical dashboard already exists as HTML
- the first milestone is delivery and runtime simplification, not frontend abstraction
- a separate Vite dev server would immediately recreate the legacy split-origin failure mode

Revisit a single Vite app only if later phases prove the static approach cannot support the interaction complexity. Do not start there.

## Architecture Patterns

### Same-Origin Control Plane
- Serve pages and APIs from one Fastify app.
- Keep page routes and API routes in the same process and port space.

### Registry-As-Data
- Represent agents and programs as records in JSON or SQLite-backed registries.
- Add capability tags such as `registry_only`, `remote_manifest`, `hold`, `stub`, `execution_capable`.
- Do not infer runtime behavior from directory presence alone.

### Activation Gates
- Require explicit enablement for connectors, child processes, and brownfield modules.
- Keep holds and stubs visible in inventory but inert at boot.

### Read-Only First
- Phase 1 should expose health, meta, and inventory reads before any mutation endpoints.
- This keeps the dashboard useful while the execution model is still being built.

## Don't Hand-Roll

- A custom frontend build system for Phase 1
- WebSockets for initial dashboard delivery
- A durable queue or background worker fleet before agent execution exists
- Browser-side secret storage
- Automatic brownfield-app boot orchestration
- Per-agent or per-program runtime daemons

## Common Pitfalls

- Recreating separate frontend and backend entrypoints "just for dev"
- Letting request handlers spawn heavy local model or scraper processes
- Treating copied markdown packets as proof that a runtime service must exist
- Starting migration holds like TCG Index or Samlino at base-server boot
- Collapsing remote manifests and active local modules into one undifferentiated `programs/` model
- Building Phase 1 around polling-heavy "live" behavior instead of stable delivery and inventory reads

## Validation Architecture

- Use `node:test` and Fastify injection so the server can be tested without opening extra ports.
- Keep Phase 1 validation centered on:
  - boot correctness
  - static page delivery
  - same-origin API delivery
  - registry classification
  - startup contract correctness
- Add a manual verification step for the Tailscale path and desktop/mobile dashboard fidelity.

## Code Examples

### App bootstrap boundary

```js
import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({ logger: true });
  // register env, db, routes, and static delivery here
  return app;
}
```

### Registry classification shape

```js
{
  "id": "artisan-reporting",
  "kind": "program",
  "status": "active",
  "runtime": "local_http",
  "enabled": false
}
```

### Inventory-first route pattern

```js
app.get("/api/programs", async () => {
  return { programs: registry.listPrograms() };
});
```

## Confidence

- **High**: one-process same-origin delivery, registry-first modeling, static frontend delivery for Phase 1
- **Medium**: exact Fastify plus SQLite implementation details, because the repo has no runtime yet

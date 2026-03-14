# Outside-Folder Dependencies

This map exists to stop an external agent from inventing new paths or fake replacements for systems that live outside `programs/lavprishjemmeside/`.

## Rule

If a dependency below is needed, implement only the in-folder part and record the outside-folder follow-up in the phase handoff.

## Dependency Map

| Dependency | Location | Purpose | Owner | Expected Interface | External-Agent Action |
|---|---|---|---|---|---|
| Agent Enterprise server routes | repo-root `server/src/**` | Assistant orchestration, rollout status, provider routing, usage data | Internal operator | Existing CMS-facing APIs and documented contracts | Do not edit; document blockers or contract expectations |
| Agent packets outside this folder | repo-root `agents/**` | Master/client agent behavior and prompts | Internal operator | Existing packet contract only | Do not create replacements inside this folder |
| Repo-root validation commands | repo-root `package.json` scripts | Mirror sync, rollout status, release-health | Internal operator | Mentioned in docs as operator checks | Do not claim to have run them unless mirrored locally and actually run |
| Root env files | repo-root `.env.local`, live `.env` files | Secrets and runtime configuration | Internal operator | Env names documented in handoff docs | Never create substitute secret stores |
| Launchd services | `~/Library/LaunchAgents/*.plist` | Mac-host service management for Agent Enterprise | Internal operator | Health endpoints and operator runbooks | Treat as read-only background infrastructure |
| Tailscale Funnel | Mac host / Tailnet | Public ingress path for assistant access | Internal operator | Funnel-backed URL used by CMS | Do not replace with ad hoc public exposure |
| cPanel live repos | `/home/theartis/repositories/<domain>` | Live runtime for parent and client sites | Internal operator | SSH-first rollout contract | Do not treat local mirror edits as deployed |
| Live databases | cPanel MySQL/MariaDB | Production site state | Internal operator | Schema docs and operator-run migrations | Document schema expectations only |
| Live secrets | cPanel env, payment keys, SMTP keys | Payments, email, assistant bindings | Internal operator | Existing env contract | Never commit placeholders that look like real secrets |
| Parent and client health endpoints | `https://api.lavprishjemmeside.dk/health`, `https://api.ljdesignstudio.dk/health` | Live health and rollback baseline visibility | Internal operator | Read-only health JSON | Safe to reference and snapshot; not writable scope |
| Root operator runbook | `docs/lavpris-ssh-first-operations.md` | Estate-level deployment and service contract | Internal operator | Reference-only guidance | Use for context, not as external execution scope |

## Common Boundary Decisions

### If the work needs provider switching logic

- Build only the in-folder UX, proxy contract, and handoff notes.
- Stop before implementing repo-root provider routing.

### If the work needs assistant orchestration changes

- Build only the CMS-side behavior that belongs in `local-mirror/`.
- Stop before changing repo-root agent or server runtime.

### If the work needs live rollout validation

- Prepare the implementation and the operator checklist.
- Do not claim production rollout complete.

### If the work needs cPanel database or env execution

- Prepare the exact operator packet using `CPANEL_HANDOFF_CONTRACT.md`.
- Hand back SQL, run order, verification queries, env deltas, and rollback notes.
- Do not invent an alternative database, local secret store, or substitute runtime path.

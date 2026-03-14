# Lavprishjemmeside SSH-First Operations

> Operator-only execution doc: keep this for context and handoff accuracy, but do not execute the SSH, cPanel, DB, or rollout steps from the external monorepo. Use `OPERATOR_HANDOFF_CONTRACT.md` instead.

Lavprishjemmeside is managed as an SSH-first remote estate. The live CMS and sites stay on `cp10.nordicway.dk`, GitHub is the shared sync point with Bolt.new, and Agent Enterprise is allowed to push the GitHub-synced repo state to cPanel over SSH.

## Authority

- Local SSH alias: `cp10-lavpris`
- Host: `cp10.nordicway.dk`
- User: `theartis`
- Port: `33`
- Local key: `/Users/IAn/.ssh/cpanel_theartisan`
- Remote GitHub alias: `github-kimjeppesen`
- Remote Node runtime path: `/opt/alt/alt-nodejs22/root/usr/bin`

## Source-Of-Truth Chain

- Bolt.new is an allowed build surface for Lavprishjemmeside work.
- `https://github.com/kimjeppesen01/lavprishjemmeside.dk` is the shared repo sync point between Bolt.new and Agent Enterprise.
- The remote cPanel repos are deployment mirrors that serve the live site and API.
- Agent Enterprise may push the GitHub-synced repo state to cPanel over SSH.
- The required order is `Bolt.new -> GitHub -> cPanel`.
- If an emergency fix lands directly on cPanel, mirror it back to GitHub immediately to remove drift.

## Live Surfaces

### Parent CMS

- Domain: `lavprishjemmeside.dk`
- API: `https://api.lavprishjemmeside.dk/health`
- Admin: `https://lavprishjemmeside.dk/admin/`
- Repo: `/home/theartis/repositories/lavprishjemmeside.dk`
- Web root: `/home/theartis/lavprishjemmeside.dk`

### Governed Client Site

- Domain: `ljdesignstudio.dk`
- API: `https://api.ljdesignstudio.dk/health`
- Admin: `https://ljdesignstudio.dk/admin/`
- Repo: `/home/theartis/repositories/ljdesignstudio.dk`
- Web root: `/home/theartis/ljdesignstudio.dk`

## Agent Access Topology

- The full Agent Enterprise control plane stays private on the always-on Mac host that currently serves as the Lavpris Agent Enterprise node.
- Default private control-plane bind: `127.0.0.1:3000`.
- A separate Lavpris public ingress process exposes only the `/api/lavpris/...` assistant surface.
- Default public-ingress bind: `127.0.0.1:8000`.
- Tailscale Funnel exposes the Lavpris public ingress, not the full control plane.
- The CMS on shared cPanel uses the Funnel HTTPS origin as `AGENT_ENTERPRISE_URL`.
- Browser traffic remains local to the CMS and only uses `/assistant`; the CMS server is the only component that talks to the Funnel URL.

Current live host notes:

- Host role: always-on local Mac acting as the Agent Enterprise server
- Tailnet IP: `100.96.78.62`
- MagicDNS hostname: `ians-macbook-pro.tail774d10.ts.net`

## Service Runbooks

Current long-lived services on the Mac host:

- `com.agent-enterprise.control-plane`
  `launchd` job running the private control plane with `scripts/start_agent_enterprise.sh`.
- `com.agent-enterprise.lavpris-public-ingress`
  `launchd` job running the restricted assistant ingress with `scripts/start_lavpris_public_ingress.sh`.
- Tailscale Funnel on the same host
  Publishes the ingress using `scripts/tailscale-funnel.sh`. Keep the Funnel binding active for the public CMS assistant path.

If this moves to a dedicated Linux server later, use equivalent long-lived services there, but do not change the assistant surface or trust boundaries.

Required environment contract:

- `AGENT_ENTERPRISE_INTERNAL_TOKEN`
- `AGENT_ENTERPRISE_LAVPRIS_MASTER_TOKEN`
- `LAVPRIS_PUBLIC_INGRESS_HOST`
- `LAVPRIS_PUBLIC_INGRESS_PORT`
- existing Lavpris SSH variables from `config/env.example`

## Read-Only Commands

All Lavpris shell helpers live in `scripts/lavpris/` and load `.env.local` first, then `.env`.

- `npm run lavpris:preflight`
  Verifies the local key, the `cp10-lavpris` SSH alias, remote repo/site paths, remote Node runtime, and the remote `github-kimjeppesen` alias.
- `npm run lavpris:inventory`
  Prints host/user details, repo/site roots, current `lsnode` API workers, and the active `sites` table inventory from the Lavpris CMS control database.
- `npm run lavpris:health`
  Checks API health payloads and site HEAD status for `lavprishjemmeside.dk` and `ljdesignstudio.dk`.
- `npm run lavpris:repo-status`
  Prints `origin`, branch, SHA, and drift buckets for each remote repo.

Direct shell usage is also supported:

```bash
bash scripts/lavpris/ssh_health.sh lavprishjemmeside.dk
bash scripts/lavpris/ssh_repo_status.sh ljdesignstudio.dk
```

## Local Mirror Workflow

- Canonical local checkout: `programs/lavprishjemmeside/local-mirror/`
- `npm run lavpris:mirror-pull`
  Creates the local checkout on first use or fast-forwards it from GitHub when clean.
- `npm run lavpris:sync-status`
  Compares GitHub `main`, the local mirror, and the cPanel repo. It exits non-zero when drift is detected, so use it before rollout.
- `npm run lavpris:path-health`
  Scans active repo and `.codex` config surfaces for stale legacy roots such as the retired `AI-Enterprise` repo root.
- `npm run lavpris:rollout-status`
  Shows whether the local source, the live parent site, and the governed client sites are aligned.
- `npm run lavpris:release-health`
  The Lavprishjemmeside release gatekeeper. It checks changelog sync, active path health, parent rollout status, and client update drift before handoff.
- Do not run the default SSH `node`/`npm` toolchain for Lavprishjemmeside package operations. The default shell resolves to Node `v10` and npm `6`, which can rewrite `api/package-lock.json`. Use the cPanel Node 22 path or the app virtualenv when package work is required.
- GitHub Actions gotcha: any YAML file left in `.github/workflows/` still runs, even when renamed `*.disabled.yml`. The old Lavprishjemmeside workflow was archived to stop repeated `dist/.htaccess` and `dist/` churn.

## Write Boundaries

The bundled Lavpris shell helpers are read-only inspection tools. They do not perform deploys by themselves.

Allowed from Agent Enterprise when explicitly intended:

- push the GitHub-synced Lavprishjemmeside repo state to cPanel over SSH
- verify the deployed commit and health endpoints after SSH rollout
- use cPanel repo operations that preserve the `Bolt.new -> GitHub -> cPanel` chain
- provision or rotate Lavpris assistant bindings through the Funnel-backed public ingress

Still out of scope:

- direct ad hoc live-root edits that bypass Git
- onboarding new client sites without updating GitHub and the canonical mirror
- rollback automation not tied to the GitHub-synced repo state
- repo resets that discard unknown remote work
- exposing generic control-plane UI or `/api/chat`, `/api/agents`, or `/api/work` through Funnel
- dashboard write controls for SSH rollout
- ad hoc local clones outside the canonical mirror path

Security rules carried over from legacy:

- no tokenized Git remotes
- no secrets committed to the repo
- no copying live `.env` contents into `Agent Enterprise`
- no direct Funnel exposure of the full control plane

## Operational Notes

- For live Agent Enterprise assistant uptime, treat the Mac host as production infrastructure.
- The CMS publish button still does not deploy new code, schema, or env changes. It only rebuilds from code already present on the cPanel server.
- For Lavprishjemmeside work, update `programs/lavprishjemmeside/CHANGELOG.md` and run `npm run lavpris:release-health` before calling the work complete.
- On cPanel, prefer `cloudlinux-selector restart --json --interpreter nodejs --app-root /home/theartis/repositories/<domain>/api` over relying on `touch api/tmp/restart.txt` alone.

## Legacy References

These documents remain the historical source material for the contract:

- `programs/lavprishjemmeside/README.md`
- `programs/lavprishjemmeside/cms/README.md`
- `programs/lavprishjemmeside/client-sites/lavprishjemmeside.dk/README.md`
- `programs/lavprishjemmeside/client-sites/ljdesignstudio.dk/README.md`
- `/Users/IAn/IAn/README/lavprishjemmeside-control-map.md`
- `/Users/IAn/IAn/README/lavpris-release-method.md`
- `/Users/IAn/IAn/README/lavpris-client-onboarding-method.md`
- `/Users/IAn/IAn/README/lavpris-security-rotation-log.md`

The older `/Users/IAn/IAn/scripts/lavpris/*` scripts are reference only. Agent Enterprise now owns its own Lavpris SSH helpers and does not depend on the `IAn` repo at runtime.

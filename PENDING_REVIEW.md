# Pending Review

This is the current backlog and contract-gap review for `Agent Enterprise`, based on the live repo state, the Fastify route set, the registries, the remote-ops docs, and a clean `npm test` run with 46 passing tests.

## Baseline

Current verified baseline:

- control plane boots as one Fastify process
- SQLite state store is wired
- 42 agents are modeled
- 21 programs are modeled
- 10 agents are currently invokable
- 46 server tests pass

This means the repo is no longer a skeleton. The main pending work is now promotion, contract cleanup, selective activation, and program implementation.

## Findings

### High: project metadata advertises API routes that do not exist

Evidence:

- `server/src/lib/project-catalog.js` still references `/api/tasks` and `/api/errors`
- `GET /api/tasks` returns `404`
- `GET /api/errors` returns `404`

Impact:

- new maintainers and new LLMs can be misled about what the live control plane actually exposes
- portfolio/project detail panels can drift away from the real Fastify contract

Required action:

- either implement those routes
- or remove/replace the advertised endpoints in `project-catalog.js`

### High: most operator pages are still prototype-backed rather than promoted delivery pages

Current page state:

- delivered: `/`, `/agents`, `/workboard`
- prototype or alias: `/overview`, `/programs`, `/kanban`, `/projects`, `/projects/:projectId`, `/chat`, and the raw `01-05` prototype HTML files

Impact:

- the app is usable, but not all important surfaces have been promoted from prototype naming and prototype status
- route permanence is still ambiguous for new maintainers

Required action:

- decide which routes are canonical long-term surfaces
- promote those pages out of prototype status
- remove or clearly demote raw HTML prototype entrypoints once the promoted routes are stable

### High: 10 programs are still stub-only and not yet real workloads

Stub programs:

- `artisan-email-marketing`
- `baltzer-shopify`
- `baltzer-employee-schedule-salary-api`
- `baltzer-event-management-platform`
- `baltzer-social-media-management`
- `personal-assistant-task-manager`
- `personal-assistant-calendar-management`
- `personal-assistant-email-management`
- `personal-assistant-social-media-management`
- `personal-assistant-fitness-dashboard`

Impact:

- the portfolio map is broader than the actual executable estate
- several task lanes remain blocked because their backing programs are still placeholders

Required action:

- choose which stub becomes the next real contract
- define runtime, data boundaries, ownership, and safety rules before enabling related lanes

### Medium: specialist agent enablement is still narrow

Current enablement mix:

- enabled: 10
- ready: 1
- blocked: 3
- held: 2
- disabled: 26

Currently enabled:

- `engineer`
- `ian-master`
- `artisan-master`
- `baltzer-master`
- `lavprishjemmeside-master`
- `personal-assistant-master`
- `samlino-master`
- `data-observability-task`
- `automation-quality-task`
- `portfolio-pmo-task`

Ready but not yet invokable:

- `platform-reliability-task`

Blocked:

- `baltzer-events-task`
- `baltzer-shopify-core-task`
- `baltzer-workforce-salary-task`

Held:

- `baltzer-tcg-index-task`
- `samlino-seo-agent-task`

Additional note:

- the root orchestrator `father` is still `disabled` and `registry-only`

Impact:

- master-lane orchestration exists, but most specialist execution lanes are still roadmap surfaces
- there is still a large gap between modeled capability and executable capability

Required action:

- define the next safe activation set
- unblock only the lanes backed by non-placeholder programs
- decide whether `father` should remain intentionally non-invokable or be promoted later

### Medium: remote-estate operations are still policy-limited

Lavprishjemmeside:

- SSH-first and read-only for this phase
- no deploy automation
- no rollback automation
- no onboarding automation
- no dashboard-triggered write path

Theartis estate:

- write access is verified
- still no deploy automation
- still no rollback automation
- still no dashboard-triggered write actions
- still no secrets sync from live `.env` files

Thirdwave:

- still a live-root-only brownfield site
- no repo extraction on `cp10`
- direct changes remain higher risk than repo-backed surfaces

Impact:

- the repo can inspect and validate the remote estate, but it does not yet manage it end-to-end

Required action:

- decide whether the control plane should stay SSH-first and human-operated
- or define a narrow write/deploy contract for specific remote surfaces

### Medium: legacy references are still embedded in current project metadata and planning docs

Observed drift:

- `server/src/lib/project-catalog.js` still hardcodes `AI-Enterprise` legacy roots for docs and context
- `.planning/PROJECT.md` still contains stale bootstrap-era wording, including older phase framing
- some planning material still references `agents copy/` or earlier activation assumptions

Impact:

- new maintainers can confuse historical context with current truth
- new LLMs may anchor on stale file paths and stale operating assumptions

Required action:

- update `.planning/PROJECT.md`
- remove or isolate legacy-root assumptions from `project-catalog.js`
- keep registries and current docs as the primary source of truth

### Medium: startup and env ergonomics are still rough

Current behavior:

- the Node server reads only process env
- `scripts/start.sh` does not source `.env.local`
- only the remote shell helper families source `.env.local` and `.env`

Impact:

- operators can assume `.env.local` will be read automatically when it will not
- startup behavior differs from the remote maintenance scripts

Required action:

- either add a shared env-loading bootstrap for local server scripts
- or keep the current behavior and document it everywhere consistently

### Low to Medium: validation is strong at the server layer but still thin at the UI and network edges

Already covered:

- bootstrap
- env loading
- routes
- registry normalization
- runtime state
- chat memory
- workflow/task lifecycle
- remote-ops script presence and syntax

Still missing or manual:

- browser E2E coverage
- visual regression coverage
- Tailscale live validation on a machine with the CLI and the right tailnet
- remote estate integration runs against live infrastructure

Impact:

- the internal contracts are in good shape
- operator UX regressions and real-network regressions can still slip through

Required action:

- add a browser-level smoke path for `/`, `/agents`, `/workboard`, `/projects`, and `/chat`
- add one real Tailscale validation step on the target machine

## Program Backlog Detail

Programs already active locally:

- `ian-agency`
- `artisan-reporting`
- `baltzer-reporting`
- `personal-assistant-root`

Programs still remote rather than locally managed:

- `artisan-wordpress`
- `lavprishjemmeside-root`
- `lavprishjemmeside-cms`
- `lavprishjemmeside-site-main`
- `lavprishjemmeside-site-ljdesignstudio`

Programs intentionally on hold:

- `samlino-seo-agent-playground`
- `baltzer-tcg-index`

The main gap is not visibility. The main gap is converting visible surfaces into clear runtime contracts one by one.

## Recommended Next Order

1. Fix contract drift in `server/src/lib/project-catalog.js`, especially `/api/errors` and `/api/tasks`.
2. Promote `/projects`, `/chat`, `/kanban`, and `/programs` from prototype-backed shells into explicit delivered surfaces.
3. Decide the next safe activation set after the current 10 enabled lanes.
4. Pick one stub program to graduate into a real runtime contract.
5. Decide whether remote estates remain inspection-first or gain narrow write/deploy workflows.
6. Refresh stale planning and legacy-reference docs so new LLMs stop inheriting the wrong context.

## Open Questions

- Should `father` stay registry-only, or should it become an invokable root lane?
- Should `/api/errors` be implemented, or should error ownership stay implicit inside existing task/chat flows?
- Should there be a public `GET /api/tasks` list route, or is `/api/kanban` the intended list surface?
- Which stub program is strategically first: a Baltzer blocker, an Artisan workflow, or a Personal Assistant module?
- Is the next remote-estate step write automation, deploy automation, or continued read-only verification?

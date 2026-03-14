---
phase: 01
slug: single-process-control-plane-bootstrap
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-12
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + Fastify inject |
| **Config file** | none - use root `package.json` scripts |
| **Quick run command** | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="phase-01|bootstrap|delivery|registry"` |
| **Full suite command** | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="phase-01|bootstrap|delivery|registry"`
- **After every plan wave:** Run `cd '/Users/IAn/Agent/Agent Enterprise' && npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-00-01 | 00 | 0 | PH1-01 | integration | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="bootstrap|structure"` | ❌ W0 | ⬜ pending |
| 01-01-01 | 01 | 1 | INF-01 | integration | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="server|health|delivery"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | REG-01 | integration | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="registry|inventory|startup"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `tests/server/bootstrap.test.js` - server scaffold and package contract checks
- [ ] `tests/server/delivery.test.js` - static route and `/health` delivery checks
- [ ] `tests/server/registry.test.js` - inventory and classification checks
- [ ] `package.json` scripts for `start`, `dev`, and `test`

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tailscale reachability | INF-02 | Depends on local network and Tailscale serve configuration | Start the server, expose it through the planned Tailscale path, and load the overview page from a second device |
| HTML contract fidelity | UI-01 | Visual comparison to the canonical root HTML files is still manual in Phase 1 | Compare the delivered pages against `01-agent-overview.html` through `05-agent-chat.html` on desktop and mobile widths |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

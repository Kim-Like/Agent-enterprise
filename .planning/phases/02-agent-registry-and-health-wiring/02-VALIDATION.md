---
phase: 02
slug: agent-registry-and-health-wiring
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + Fastify inject |
| **Config file** | none - use root `package.json` scripts |
| **Quick run command** | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="agent|health|adapter|runtime|registry"` |
| **Full suite command** | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="agent|health|adapter|runtime|registry"`
- **After every plan wave:** Run `cd '/Users/IAn/Agent/Agent Enterprise' && npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-00-01 | 00 | 1 | REG-01 | integration | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="registry|agent"` | ❌ W0 | ⬜ pending |
| 02-01-01 | 01 | 2 | OPS-01 | integration | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="health|adapter|agent"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 3 | INF-03 | integration | `cd '/Users/IAn/Agent/Agent Enterprise' && npm test -- --test-name-pattern="runtime|enablement|agent"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `tests/server/agent-registry.test.js` - runtime-capable registry validation and migration coverage
- [ ] `tests/server/agent-health.test.js` - agent health aggregation and detail-route checks
- [ ] `tests/server/agent-runtime.test.js` - adapter gating, enablement, and invocation boundary coverage
- [ ] server-side fixtures or helper modules for adapter catalog and persisted agent state

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Held or legacy agents remain visibly disabled in the operator UI | PH2-01 | The current Phase 1 pages are lightweight HTML surfaces rather than a full dashboard test harness | Start the server, open `/agents`, and confirm held agents and disabled reasons are visible without any auto-start behavior |
| Connector-probe health with real secrets | OPS-01 | External credentials may be intentionally absent in local planning and CI-like runs | Add the required env vars on the target machine, restart the server, and confirm enabled agents move from `blocked` to `healthy` without spawning extra runtimes |

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

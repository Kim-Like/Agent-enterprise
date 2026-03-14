# MEMORY.md — IAn Session Memory

> Living state document. Updated at the end of every session.
> For structural truth (what exists), see `ARCHITECTURE.md`.
> For identity and rules, see `soul.md`.

---

## Active Work

- **Next up:** Wire 7 stub agents with identity docs and real skills
  - Agents needing identity + skills: competitor-researcher, keyword-analyst, content-writer, content-composer, content-analyst, performance-reviewer, opportunity-explorer
- **No blockers.**

---

## Recent Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-27 | Created IAn master agent (soul, user, skill, ARCHITECTURE) | Central orchestrator needed to delegate across 9 sub-agents |
| 2026-02-27 | Migrated from Hosted DB to SQLite | Local-first simplicity; all data in `backend/db/app.db` |
| 2026-02-27 | Added per-agent model selection | Settings UI + `settings` table; cascade: explicit → agent override → default → sonnet |
| 2026-02-27 | Created MEMORY.md | Session continuity — IAn needs living state across context windows |

> Prune entries older than 2 weeks.

---

## Agent Status Notes

| Agent | Status | Notes |
|---|---|---|
| schema-generator | Functional | Full pipeline: scrape → JSON-LD → SQLite. ComparaJá-specific skills in place (584-line SCHEMA_SKILL.md). Quality gate: Google Rich Results Test. |
| prototyper | Functional | Component generation from brief. CSS namespacing: `cja-proto-*`. Has PROTOTYPER_SKILL.md + style-skill.md. |
| competitor-researcher | Stub | Backend agent file exists. No identity docs, no real skills. |
| keyword-analyst | Stub | Backend agent file exists. No identity docs, no real skills. |
| content-writer | Stub | Backend agent file exists. No identity docs, no real skills. |
| content-composer | Stub | Backend agent file exists. No identity docs, no real skills. |
| content-analyst | Stub | Backend agent file exists. No identity docs, no real skills. |
| performance-reviewer | Stub | Backend agent file exists. No identity docs, no real skills. |
| opportunity-explorer | Stub | Backend agent file exists. No identity docs, no real skills. |

---

## Patterns & Conventions

- **Stub agent scaffold:** Copy `competitor_researcher_agent.py` pattern — imports, `_AGENT_ID`, `_SYSTEM_PROMPT`, `run()` function
- **Skill file directories:** Kebab-case under `backend/skills/{agent-id}/`
- **Identity doc directories:** `backend/identity/{agent-id}/` with USER.md, SOUL.md, PLAN.md
- **Model config keys:** Stored in `settings` table as `agent_{agent-id}_model` (e.g. `agent_schema-generator_model`)
- **Frontend agent registration:** Add to `src/config/agents.ts` with id, title, path, colors, icon
- **New agent extension:** Follow the 8-step pattern in `ARCHITECTURE.md` — no shortcuts, no partial scaffolds

---

## Sam's Preferences

- Always use SQLite, not Hosted DB
- Plan before executing non-trivial tasks
- IAn delegates — never does sub-agent work himself
- Use Claude Code Task tool for sub-agent invocation with full context (soul + skill + brief)

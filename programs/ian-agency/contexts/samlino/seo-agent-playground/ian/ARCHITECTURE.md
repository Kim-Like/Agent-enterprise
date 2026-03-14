# ARCHITECTURE.md — SEO Agent Playground

> IAn's project bible. Read this before every architectural decision.
> Update this after every significant structural change.

---

## Mission & Purpose

The **SEO Agent Playground** is a multi-agent SEO platform built for:
- **ComparaJá.pt** (primary client) — Portuguese financial comparison platform (YMYL, Banco de Portugal regulated)
- **samlino.dk** — secondary site

The platform provides a React UI where each agent has its own interface, backed by a Python FastAPI service that calls Claude. Agents are specialists — each one does one thing with deep expertise.

**Operator:** Sam (project owner). Communicates directly with IAn via Claude Code.

---

## Tech Stack

| Layer | Technology | Version | Port |
|---|---|---|---|
| Frontend | React + TypeScript + Vite | React 18.3, Vite 5.4 | 8080 |
| Styling | TailwindCSS + shadcn/ui (Radix) | Tailwind 3.4 | — |
| Routing | React Router | v6.30 | — |
| Data fetching | TanStack Query | v5.83 | — |
| Backend | Python FastAPI | 3.11+ | 8001 |
| AI runtime | Anthropic Claude (configurable per-agent) | SDK latest | API |
| Storage | SQLite (local, `backend/db/app.db`) | stdlib | — |
| Scraping | Playwright + BeautifulSoup4 | — | — |

**Start commands:**
```bash
# Backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8001

# Frontend
npm run dev
```

---

## Directory Structure

```
seo-agent-playground/
│
├── CLAUDE.md                        # IAn entry point (Claude Code config)
│
├── ian/                             # IAn's identity & architecture reference
│   ├── user.md                      # IAn operating context
│   ├── soul.md                      # IAn identity & non-negotiable rules
│   ├── skill.md                     # IAn competencies & delegation matrix
│   └── ARCHITECTURE.md              # ← this file
│
├── src/                             # React/TypeScript frontend
│   ├── config/
│   │   └── agents.ts                # Master agent registry (all 9 agents)
│   ├── App.tsx                      # React Router setup + all routes
│   ├── index.css                    # Global styles + Tailwind
│   ├── pages/
│   │   ├── Index.tsx                # Dashboard (stats + agent grid)
│   │   ├── settings.tsx             # Settings page
│   │   └── agents/                  # One subdirectory per agent
│   │       ├── competitor-researcher/index.tsx
│   │       ├── keyword-analyst/index.tsx
│   │       ├── content-writer/index.tsx
│   │       ├── content-composer/index.tsx
│   │       ├── content-analyst/index.tsx
│   │       ├── performance-reviewer/index.tsx
│   │       ├── opportunity-explorer/index.tsx
│   │       ├── schema-generator/index.tsx
│   │       └── prototyper/index.tsx
│   └── components/
│       ├── AgentPageShell.tsx       # Generic chat UI (7 SEO agents)
│       ├── SchemaGeneratorShell.tsx # Schema-specific UI (URL + type input, JSON display)
│       ├── PrototyperShell.tsx      # Prototyper two-panel UI (brief + code output)
│       ├── AgentConfigPanel.tsx     # Slide-out drawer: system instructions + skill upload
│       └── AppSidebar.tsx           # Left navigation
│
├── backend/                         # Python FastAPI backend
│   ├── main.py                      # App entry point, all routes registered here
│   ├── config.py                    # Env var loading (ANTHROPIC_API_KEY, HOSTED_DB_*, ORG_*)
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Secret config (never commit)
│   ├── .env.example                 # Template for .env
│   │
│   ├── agent/                       # Agent implementations
│   │   ├── claude_client.py         # Anthropic SDK wrapper
│   │   ├── skills.py                # Skill file loader (list/read/save/delete)
│   │   ├── schema_agent.py          # ✅ Schema generation logic
│   │   ├── prototyper_agent.py      # ✅ Component generation + CSS analysis
│   │   ├── content_writer_agent.py  # 🔧 Stub
│   │   ├── content_composer_agent.py # 🔧 Stub
│   │   ├── content_analyst_agent.py # 🔧 Stub
│   │   ├── keyword_analyst_agent.py # 🔧 Stub
│   │   ├── competitor_researcher_agent.py # 🔧 Stub
│   │   ├── opportunity_explorer_agent.py  # 🔧 Stub
│   │   └── performance_reviewer_agent.py  # 🔧 Stub
│   │
│   ├── scraper/                     # Web scraping
│   │   ├── page_scraper.py          # Playwright + BS4: page content, author links, breadcrumbs
│   │   ├── author_scraper.py        # Bio page scraping (parallel, max 5 authors + 3 editors)
│   │   └── social_extractor.py      # Social media link extraction from bio pages
│   │
│   ├── schema/                      # JSON-LD builder
│   │   ├── builder.py               # Builds @graph from scraped data
│   │   └── org_identity.py          # Organization node from env config
│   │
│   ├── db/                          # Database layer
│   │   ├── sqlite_client.py         # Local SQLite client (replaces Hosted DB)
│   │   ├── app.db                   # SQLite database file (auto-created, gitignored)
│   │   └── models.py                # Pydantic models: GenerateRequest, GenerateResponse
│   │
│   ├── identity/                    # Schema Generator identity docs (legacy location)
│   │   ├── USER.md                  # Schema agent operating context
│   │   ├── SOUL.md                  # Schema agent identity
│   │   └── PLAN.md                  # Schema agent roadmap
│   │
│   └── skills/                      # Agent skill documents (loaded at runtime)
│       ├── prototyper/
│       │   ├── PROTOTYPER_SKILL.md  # Core prototyper rules
│       │   └── style-skill.md       # ComparaJá design system reference
│       └── schema-generator/
│           └── SCHEMA_SKILL.md      # ComparaJá-specific JSON-LD rules
│
├── seo-auditor/                     # Standalone SEO audit tool (not yet integrated)
│   ├── audit-server/
│   │   ├── audit_server.py
│   │   └── .env
│   └── index.html
│
├── www.comparaja.pt/                # Exported comparaja.pt site files (for Prototyper)
├── www.samlino.dk/                  # Exported samlino.dk site files
│
└── .claude/                         # Claude Code permissions config
    └── settings.json
```

---

## Agent Roster

| ID | Title | Status | Shell | Backend | Identity | Skills |
|---|---|---|---|---|---|---|
| `schema-generator` | Schema Generator | ✅ Functional | `SchemaGeneratorShell` | `schema_agent.py` | `backend/identity/` | `backend/skills/schema-generator/` |
| `prototyper` | Prototyper | ✅ Functional | `PrototyperShell` | `prototyper_agent.py` | — | `backend/skills/prototyper/` |
| `competitor-researcher` | Competitor Researcher | 🔧 Stub | `AgentPageShell` | `competitor_researcher_agent.py` | — | `backend/skills/competitor-researcher/` |
| `keyword-analyst` | Keyword Analyst | 🔧 Stub | `AgentPageShell` | `keyword_analyst_agent.py` | — | `backend/skills/keyword-analyst/` |
| `content-writer` | Content Writer | 🔧 Stub | `AgentPageShell` | `content_writer_agent.py` | — | `backend/skills/content-writer/` |
| `content-composer` | Content Composer | 🔧 Stub | `AgentPageShell` | `content_composer_agent.py` | — | `backend/skills/content-composer/` |
| `content-analyst` | Content Analyst | 🔧 Stub | `AgentPageShell` | `content_analyst_agent.py` | — | `backend/skills/content-analyst/` |
| `performance-reviewer` | Performance Reviewer | 🔧 Stub | `AgentPageShell` | `performance_reviewer_agent.py` | — | `backend/skills/performance-reviewer/` |
| `opportunity-explorer` | Opportunity Explorer | 🔧 Stub | `AgentPageShell` | `opportunity_explorer_agent.py` | — | `backend/skills/opportunity-explorer/` |

---

## API Endpoints

All registered in `backend/main.py`. Base URL: `http://localhost:8001`

### System
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe → `{status: "ok", version: "1.0.0"}` |

### Schema Generation
| Method | Path | Description |
|---|---|---|
| POST | `/api/schema/generate` | Full pipeline: scrape → build JSON-LD → save → return |
| GET | `/api/schema/history` | Recent generations (metadata only, no full JSON) |
| GET | `/api/schema/{generation_id}` | Single generation record with full JSON-LD |

### Authors
| Method | Path | Description |
|---|---|---|
| GET | `/api/authors` | Cached author profiles, optional `?domain=` filter |

### Skills Management
| Method | Path | Description |
|---|---|---|
| GET | `/api/agents/{agent_id}/skills` | List skill files for agent |
| GET | `/api/agents/{agent_id}/skills/{filename}` | Read single skill file |
| POST | `/api/agents/{agent_id}/skills` | Upload .md file or paste as text |
| DELETE | `/api/agents/{agent_id}/skills/{filename}` | Delete skill file |

### Prototyper
| Method | Path | Description |
|---|---|---|
| GET | `/api/prototyper/pages` | List HTML files in `www.comparaja.pt/` |
| POST | `/api/prototyper/analyze` | Extract CSS class categories from site copy |
| POST | `/api/prototyper/generate` | Call Claude to generate component → `{html, css, js}` |
| POST | `/api/prototyper/insert` | Inject component into target page in site copy |

### SEO Auditor
| Method | Path | Description |
|---|---|---|
| GET | `/api/seo/data?project={slug}` | Return all crawl_pages + crawl_links for a project |
| POST | `/api/seo/upload/pages?project={slug}` | Upload Screaming Frog "Internal HTML" CSV → wipe + replace crawl_pages |
| POST | `/api/seo/upload/links?project={slug}` | Upload Screaming Frog "All Outlinks" CSV → wipe + replace crawl_links |
| POST | `/api/seo/upload/keywords?project={slug}` | Upload keyword CSV → update existing crawl_pages with keyword data |

### Settings
| Method | Path | Description |
|---|---|---|
| GET | `/api/settings/claude` | Auth status + usage stats + org identity |
| POST | `/api/settings/claude/logout` | Log out Claude Code OAuth session |
| GET | `/api/settings` | All app settings (model config, etc.) as key-value dict |
| PUT | `/api/settings/{key}` | Update a setting. Body: `{"value": "..."}` |

---

## Data Flows

### 1. Schema Generation
```
User → SchemaGeneratorShell (URL + schema_type)
  → POST /api/schema/generate
  → scrape_page() [Playwright + BS4]
  → scrape_author() × N [parallel, ThreadPoolExecutor, max 5 authors + 3 editors]
  → build_schema() [JSON-LD @graph builder]
  → DatabaseClient.save_schema() [SQLite, non-blocking, failure doesn't block response]
  → GenerateResponse {job_id, status, schema_json, page_title, authors_found, editors_found}
  → SchemaGeneratorShell displays JSON + metadata bar
```

### 2. Component Prototyping
```
User → PrototyperShell (brief: component_name, target_page, placement, requirements)
  → POST /api/prototyper/analyze → CSS class categories (shown in accordion)
  → POST /api/prototyper/generate
  → prototyper_agent.generate_component()
  → Claude API [PROTOTYPER_SKILL.md + style-skill.md + CSS reference in system prompt]
  → {html: "...", css: "...", js: "..."}
  → PrototyperShell displays code tabs (HTML/CSS/JS)
  → Optional: POST /api/prototyper/insert → injects into target page in www.comparaja.pt/
```

### 3. Generic Agent (Stub)
```
User → AgentPageShell (message text)
  → No backend call yet (mock response displayed)
  → AgentConfigPanel: system instructions + skill .md uploads stored in backend/skills/{id}/
```

---

## Database Schema (SQLite — `backend/db/app.db`)

### `schema_generations`
| Column | Type | Description |
|---|---|---|
| id | TEXT | Primary key (uuid hex) |
| url | TEXT | Input URL |
| canonical_url | TEXT | Extracted canonical |
| schema_type | TEXT | Article / BlogPosting / NewsArticle / WebPage |
| schema_json | TEXT | Full JSON-LD @graph (JSON string) |
| page_title | TEXT | Extracted page title |
| authors_found | INTEGER | Number of author bios scraped |
| editors_found | INTEGER | Number of editor bios scraped |
| created_at | TEXT | Generation timestamp (ISO 8601) |

### `author_profiles`
| Column | Type | Description |
|---|---|---|
| id | TEXT | Primary key (uuid hex) |
| profile_url | TEXT | Author bio page URL (UNIQUE) |
| name | TEXT | Full name |
| job_title | TEXT | Job title |
| description | TEXT | Bio text (max 500 chars) |
| social_links | TEXT | Extracted social URLs (JSON string) |
| scraped_at | TEXT | Last scrape timestamp (ISO 8601) |

### `schema_generation_authors` (join table)
| Column | Type | Description |
|---|---|---|
| generation_id | TEXT | FK → schema_generations |
| author_id | TEXT | FK → author_profiles |
| role | TEXT | author / editor |

### `settings` (key-value store)
| Column | Type | Description |
|---|---|---|
| key | TEXT | Primary key (e.g. `default_model`, `agent_schema-generator_model`) |
| value | TEXT | Setting value (e.g. `sonnet`, `opus`, `haiku`) |
| updated_at | TEXT | Last update timestamp (ISO 8601) |

### `seo_projects`
| Column | Type | Description |
|---|---|---|
| id | TEXT | Primary key (uuid hex) |
| slug | TEXT | Unique slug (comparaja, samlino) |
| name | TEXT | Display name |
| domain | TEXT | Site domain (e.g. comparaja.pt) |
| created_at | TEXT | Creation timestamp |

### `crawl_pages`
| Column | Type | Description |
|---|---|---|
| id | TEXT | Primary key (uuid hex) |
| project_id | TEXT | FK → seo_projects |
| url | TEXT | Page URL (UNIQUE per project) |
| status_code | INTEGER | HTTP status |
| robots_directive | TEXT | Meta robots value |
| indexability | TEXT | Indexable / Non-Indexable |
| canonical_url | TEXT | Canonical link |
| title | TEXT | Page title |
| meta_description | TEXT | Meta description |
| h1 | TEXT | First H1 |
| word_count | INTEGER | Body word count |
| main_keyword | TEXT | Primary keyword (from keywords CSV) |
| secondary_keywords | TEXT | Secondary keywords (from keywords CSV) |
| target_questions | TEXT | Target questions (from keywords CSV) |
| audit_json | TEXT | Claude content audit result (JSON string) |
| audit_date | TEXT | Audit timestamp |

### `crawl_links`
| Column | Type | Description |
|---|---|---|
| id | TEXT | Primary key (uuid hex) |
| project_id | TEXT | FK → seo_projects |
| source_url | TEXT | Link source page |
| destination_url | TEXT | Link target URL |
| anchor_text | TEXT | Anchor text |
| is_external | INTEGER | 0 = internal, 1 = external |
| status_code | INTEGER | HTTP status |
| is_follow | INTEGER | 1 = follow, 0 = nofollow |

---

## Environment Variables

All in `backend/.env` (never commit):

```
ORG_NAME=                 # Publisher name (e.g. ComparaJá)
ORG_URL=                  # Publisher URL (e.g. https://www.comparaja.pt)
ORG_LOGO_URL=             # Publisher logo URL
ORG_SAME_AS=              # Comma-separated social profile URLs
BACKEND_PORT=8001         # FastAPI server port
ALLOWED_ORIGINS=http://localhost:8080  # CORS origins
CLAUDE_BINARY_PATH=       # Optional: explicit path to claude CLI binary
```

No API keys needed — Claude calls use the Claude Code CLI OAuth session.
Model selection is stored in the SQLite `settings` table, configurable via Settings UI.

Seo auditor also has `seo-auditor/audit-server/.env` with `ANTHROPIC_API_KEY` (uses Anthropic SDK directly).

---

## Identity Document System

Every agent follows this three-document pattern:

| Document | Purpose | Style |
|---|---|---|
| `USER.md` | Operating context: how the agent is invoked, input/output contracts, environment | Technical, factual |
| `SOUL.md` | Identity: who the agent is, non-negotiable rules, quality standards, what it is NOT | Declarative, firm |
| `SKILL.md` | Capabilities: what the agent knows, how it applies knowledge, specific techniques | Reference-style, actionable |

Optional:
- `PLAN.md` — development roadmap for the agent itself (phases, status, next steps)

IAn's documents (`ian/`) follow the same pattern but at developer/meta level, not application level.
Sub-agent documents live in `backend/identity/{agent}/` and `backend/skills/{agent}/`.

### Model Configuration
- Default model and per-agent overrides stored in SQLite `settings` table
- Configurable via Settings page UI (`/settings` → "AI Model Configuration")
- Resolution order: explicit `model` param → `agent_{id}_model` setting → `default_model` setting → `"sonnet"` fallback
- Valid models: `sonnet` (Sonnet 4.6), `opus` (Opus 4.6), `haiku` (Haiku 4.5)

---

## Frontend Component Architecture

### Shell Components

| Component | Used by | Key features |
|---|---|---|
| `AgentPageShell` | 7 generic SEO agents | Chat interface, auto-resize textarea, mock responses, AgentConfigPanel drawer |
| `SchemaGeneratorShell` | `schema-generator` | URL input, schema type select, processing steps display, JSON output card with metadata |
| `PrototyperShell` | `prototyper` | Two-panel (brief + output), CSS accordion, code tabs (HTML/CSS/JS), insert-to-page button |

### AgentConfigPanel
Slide-out drawer available on all agents. Provides:
- System instructions textarea (10,000 char limit, pre-populated per agent type)
- Skill file management: list, upload .md, paste-as-text, delete
- Calls `GET/POST/DELETE /api/agents/{agentId}/skills`

### AppSidebar
Static left navigation. Agent list is dynamically generated from `src/config/agents.ts`.
Sections: Dashboard | Agents (9) | Tools (SEO Auditor) | Data (Database, Collaboration) | Settings

---

## Extension Pattern: Adding a New Agent

IAn follows these 8 steps in sequence. Do not skip steps.

### Step 1 — Register agent metadata
File: `src/config/agents.ts`
```typescript
{
  id: "new-agent-id",
  title: "Agent Title",
  shortTitle: "Short",
  description: "One-line description of what this agent does",
  icon: SomeLucideIcon,
  colorClass: "text-agent-{name}",
  bgClass: "bg-agent-{name}/10",
  status: "idle",
  path: "/agents/new-agent-id",
}
```
Also add Tailwind color vars in `tailwind.config.ts` if using a new color key.

### Step 2 — Create agent page
File: `src/pages/agents/new-agent-id/index.tsx`
```tsx
import AgentPageShell from "@/components/AgentPageShell";
export default function NewAgentPage() {
  return <AgentPageShell agentId="new-agent-id" />;
}
```
Use a specialised shell if the agent needs a unique UI.

### Step 3 — Register route
File: `src/App.tsx`
```tsx
import NewAgentPage from "@/pages/agents/new-agent-id";
// Inside <Routes>:
<Route path="/agents/new-agent-id" element={<NewAgentPage />} />
```

### Step 4 — Create backend agent file
File: `backend/agent/new_agent_id_agent.py`
Minimum stub:
```python
def run(prompt: str, instructions: str = "", skills: list[str] = []) -> str:
    # TODO: implement
    return "Agent not yet implemented."
```

### Step 5 — Register API route
File: `backend/main.py`
```python
from agent.new_agent_id_agent import run as new_agent_run

class NewAgentRequest(BaseModel):
    prompt: str
    instructions: str = ""

@app.post("/api/agents/new-agent-id/run", tags=["new-agent-id"])
def run_new_agent(req: NewAgentRequest) -> dict:
    result = new_agent_run(req.prompt, req.instructions)
    return {"result": result}
```

### Step 6 — Create identity documents
Directory: `backend/identity/new-agent-id/`
Files: `USER.md`, `SOUL.md`, `PLAN.md`
Follow the patterns in `backend/identity/` (schema generator) as reference.

### Step 7 — Create skill document
Directory: `backend/skills/new-agent-id/`
File: `{AGENT_NAME}_SKILL.md`
Follow the pattern in `backend/skills/prototyper/PROTOTYPER_SKILL.md`.

### Step 8 — Verify skills API
Test that `GET /api/agents/new-agent-id/skills` returns `[]` (empty, not 404).
Skills are stored in `backend/skills/new-agent-id/` — the directory is auto-created by `agent/skills.py`.

**After all 8 steps:** Update `ian/ARCHITECTURE.md` — Agent Roster table and any new API endpoints.

---

## Roadmap Status

### Phase 1 — Complete ✅
- Frontend: all 9 agent shells wired and navigable
- Schema Generator: full pipeline (scrape → JSON-LD → Hosted DB)
- Prototyper: full pipeline (CSS analysis → component generation → insert-to-page)
- AgentConfigPanel: system instructions + skill file management
- Skills API: full CRUD for all agent skill files
- Settings page: Claude auth status + org identity display

### Phase 2 — In Progress 🔧
- Wire 7 stub backend agents to Claude (generic chat completion)
- Connect AgentPageShell to real backend endpoints (remove mock responses)
- Schema Generator: validation gates (schema.org validator, diff view, author profile caching)
- Prototyper: style-skill.md integration as dynamic design token reference

### Phase 3 — Planned 📋
- SEO Auditor: integrate `seo-auditor/` tool into main platform
- Database page: query and display Hosted DB records
- Collaboration page: multi-user task history
- Schema Generator: bulk input (sitemap, CSV), webhook output, scheduled re-generation
- Performance tracking: external data source integration (GSC, GA4)

---

## Key Conventions

- **Agent IDs** use kebab-case: `schema-generator`, `content-writer`
- **Backend agent files** use snake_case: `schema_agent.py`, `content_writer_agent.py`
- **API routes** use kebab-case paths: `/api/agents/schema-generator/skills`
- **Skill files** use UPPER_SNAKE_CASE: `SCHEMA_SKILL.md`, `PROTOTYPER_SKILL.md`
- **@id convention** (JSON-LD): `{url}#{type}` — e.g. `https://example.com/page#article`
- **CSS namespace** (Prototyper): `cja-proto-{component}__{element}` — never use site classes
- **Language** (ComparaJá outputs): always `pt-PT`
- **Currency** (ComparaJá): always `EUR`

---

*Last updated: 2026-02-27 — Migrated from Hosted DB to SQLite. Added model selection settings (UI + backend + DB). Updated all agent files to use settings-based model resolution.*

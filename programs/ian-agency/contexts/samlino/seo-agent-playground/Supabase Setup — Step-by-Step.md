Hosted DB Setup — Step-by-Step
Context
The backend (backend/db/hosteddb_client.py) needs three tables and a service_role key. All setup is in the Hosted DB dashboard — no CLI required.

Step 1 — Create a new Hosted DB project
Go to hosteddb.com → New project
Name: seo-agent-playground
Region: EU West (closest to Denmark)
Set a strong DB password and save it
Click Create new project — wait ~2 min for provisioning
Step 2 — Get your credentials
Project Settings → API:

What	Where	Maps to
Project URL	"Project URL" field	HOSTED_DB_URL
service_role key	"Project API keys" → service_role → Reveal	HOSTED_DB_SERVICE_ROLE_KEY
Use service_role (not anon) — the backend needs it to bypass RLS for writes. Never expose this key to the browser.

Step 3 — Create the three tables
SQL Editor → New query — paste and run all at once:


CREATE TABLE schema_generations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  url           text NOT NULL,
  canonical_url text,
  page_title    text,
  schema_type   text NOT NULL DEFAULT 'Article',
  schema_json   jsonb NOT NULL,
  author_count  int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'complete'
);
CREATE INDEX ON schema_generations (created_at DESC);
CREATE INDEX ON schema_generations (url);

CREATE TABLE author_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  profile_url   text NOT NULL UNIQUE,
  name          text NOT NULL,
  job_title     text,
  bio           text,
  headshot_url  text,
  website_url   text,
  social_links  jsonb NOT NULL DEFAULT '{}',
  same_as       jsonb NOT NULL DEFAULT '[]',
  domain        text
);
CREATE INDEX ON author_profiles (domain);
CREATE INDEX ON author_profiles (name);

CREATE TABLE schema_generation_authors (
  generation_id uuid NOT NULL REFERENCES schema_generations(id) ON DELETE CASCADE,
  author_id     uuid NOT NULL REFERENCES author_profiles(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'author',
  PRIMARY KEY (generation_id, author_id)
);

ALTER TABLE schema_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_generation_authors ENABLE ROW LEVEL SECURITY;
Expected output: Success. No rows returned.

Verify: Table Editor should show all 3 tables.

Step 4 — Create backend/.env
Copy backend/.env.example → backend/.env and fill in:


HOSTED_DB_URL=https://xxxxxxxxxxxxxxxxxxxx.hosteddb.co
HOSTED_DB_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ORG_NAME=Your Organisation Name
ORG_URL=https://yourdomain.com
ORG_LOGO_URL=https://yourdomain.com/logo.png
ORG_SAME_AS=https://twitter.com/yourhandle,https://linkedin.com/company/yourco

BACKEND_PORT=8001
ALLOWED_ORIGINS=http://localhost:8080
Step 5 — Install and start the backend

cd /Users/samlino/Samlino/seo-agent-playground/backend
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload --port 8001
Step 6 — Verify health + first schema

# Health check
curl http://localhost:8001/health
# → {"status":"ok","version":"1.0.0"}

# First real generation
curl -X POST http://localhost:8001/api/schema/generate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_REAL_PAGE_URL","schema_type":"Article"}'
# → {"job_id":"...","status":"complete","schema_json":{...},"authors_found":N}
Then open Hosted DB → Table Editor → schema_generations — you should see one row with schema_json populated.

Step 7 — Start the frontend

cd /Users/samlino/Samlino/seo-agent-playground
npm run dev
Open http://localhost:8080 → Schema Generator in sidebar → paste URL → JSON-LD renders with Copy button.

Schema Generator Agent — Implementation Plan
Context
The SEO Agent Playground (/Users/samlino/Samlino/seo-agent-playground/) is a React frontend with 7 simulated SEO agents — all frontend-only with fake 1.2s responses and no backend. This plan adds an 8th real agent: Schema Generator, which scrapes a published URL, follows its author/editor links, and produces a complete JSON-LD structured data block, stored in Hosted DB.

This is a completely separate system from IAN (the personal agent). It has its own SOUL, USER, and PLAN identity files, its own Python backend, and its own Hosted DB database.

Architecture

[React Frontend :8080]
    ↓ POST /api/schema/generate  (via Vite proxy)
[Python FastAPI Backend :8001]
    ├── Stage 1: Scrape target page (Playwright + BS4)
    ├── Stage 2: Follow author/editor links, scrape bio pages (parallel, max 5 authors + 3 editors)
    ├── Stage 3: Extract social media links from bio pages
    ├── Stage 4: Build full JSON-LD @graph (Article, Person, Organization, WebSite, WebPage, BreadcrumbList)
    └── Stage 5: Persist to Hosted DB → return JSON to frontend
Files to Create / Modify
New — Python Backend (seo-agent-playground/backend/)

backend/
├── main.py                       # FastAPI app (CORS, lifespan, /api/schema/generate, /api/schema/history, /api/authors, /health)
├── config.py                     # Frozen dataclasses: Config + OrgIdentity (same pattern as IAN)
├── requirements.txt              # fastapi, uvicorn, anthropic, playwright, beautifulsoup4, lxml, httpx, pydantic, python-dotenv, hosteddb
├── .env.example                  # ANTHROPIC_API_KEY, HOSTED_DB_URL, HOSTED_DB_SERVICE_ROLE_KEY, ORG_NAME, ORG_URL, ORG_LOGO_URL, ORG_SAME_AS, BACKEND_PORT, ALLOWED_ORIGINS
├── scraper/
│   ├── __init__.py
│   ├── page_scraper.py           # Playwright headless → BS4; returns PageData dataclass
│   ├── author_scraper.py         # Visits author/editor bio URLs; returns AuthorData dataclass
│   └── social_extractor.py      # Pure function: scan all <a href> against SOCIAL_PATTERNS dict
├── schema/
│   ├── __init__.py
│   ├── builder.py                # Assembles full JSON-LD @graph from PageData + list[AuthorData]
│   └── org_identity.py          # Loads OrgIdentity from config, returns Organization node dict
├── db/
│   ├── __init__.py
│   ├── hosteddb_client.py        # upsert author_profiles, insert schema_generations, link join table
│   └── models.py                 # Pydantic models matching Hosted DB column names
└── identity/
    ├── SOUL.md                   # SEO agent identity (scrape-first, never invent, Google Rich Results standard)
    ├── USER.md                   # Deployment context (FastAPI, HTTP-driven, single-shot per request)
    └── PLAN.md                   # 3-phase roadmap (Core Pipeline → Validation → Bulk/Automation)
Modified — React Frontend
File	Change
src/config/agents.ts	Add schema-generator entry (8th agent), import Braces from lucide-react
src/App.tsx	Import SchemaGeneratorPage, add <Route path="/agents/schema-generator">
src/components/AgentPageShell.tsx	Add "schema-generator" entries to getPlaceholder() and getPlaceholderSuggestions()
src/index.css	Add --agent-schema: 280 70% 60%; to :root agent colors block
tailwind.config.ts	Add schema: "hsl(var(--agent-schema))" to colors.agent
vite.config.ts	Add proxy: { "/api": { target: "http://localhost:8001", changeOrigin: true } } to server
src/pages/Index.tsx	Update "Active Agents" stat from 7 to 8
New — React Frontend
File	Purpose
src/pages/agents/schema-generator/index.tsx	Minimal page shell (renders <SchemaGeneratorShell agentId="schema-generator" />)
src/components/SchemaGeneratorShell.tsx	Extended agent shell with real API call; renders JSON output with copy button and metadata summary
Scraping Pipeline Detail
page_scraper.py → PageData dataclass
Uses sync_playwright (same pattern as IAN's tools/browser.py):

User-Agent header set to SchemaGeneratorBot/1.0
wait_until="domcontentloaded" + optional 5s wait for article, main, .article-body
BS4 strips <script>, <style>, <nav>, <footer>, <header>, <aside>
Fields extracted:

url, canonical_url (<link rel=canonical>), title, meta_description, og_image
article_body (visible text, stripped)
date_published, date_modified (from <meta property="article:published_time">, <time datetime="">, or existing JSON-LD)
breadcrumbs (from <nav aria-label="breadcrumb"> or existing BreadcrumbList JSON-LD)
author_links: [rel="author"], a.author, a[href*="/author/"], a[href*="/redaktor/"]
editor_links: elements with text "redigeret af", "edited by", "reviewed by" + adjacent anchors
language (from <html lang="">), keywords (from <meta name="keywords">)
raw_schema (all existing <script type="application/ld+json"> parsed)
author_scraper.py → AuthorData dataclass
Visits each bio URL (max 5 authors + 3 editors in parallel via ThreadPoolExecutor). Extraction priority:

Existing Person JSON-LD on bio page (highest fidelity)
Schema.org microdata (itemprop="name", itemprop="description")
OpenGraph tags (og:title, og:description, og:image)
CSS class heuristics (.author-name, .author-bio, .author-photo, h1, p.bio)
social_extractor.py for social links
social_extractor.py — pure function
Scans all <a href> against platform patterns:


SOCIAL_PATTERNS = {
    "twitter":   ["twitter.com/", "x.com/"],
    "linkedin":  ["linkedin.com/in/", "linkedin.com/pub/"],
    "instagram": ["instagram.com/"],
    "facebook":  ["facebook.com/"],
    "youtube":   ["youtube.com/@", "youtube.com/channel/"],
    "tiktok":    ["tiktok.com/@"],
    "threads":   ["threads.net/"],
}
Returns dict[platform → first_matched_url].

JSON-LD Schema Output Structure
builder.py produces a single @graph (Google-recommended for multi-type pages):


{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite",       "@id": "{org_url}/#website" },
    { "@type": "Organization",  "@id": "{org_url}/#organization", "sameAs": [...] },
    { "@type": "WebPage",       "@id": "{canonical}#webpage" },
    { "@type": "Article",       "@id": "{canonical}#article", "author": [{"@id": "{author_url}#person"}] },
    { "@type": "Person",        "@id": "{author_url}#person", "sameAs": [...social links...] },
    { "@type": "BreadcrumbList","@id": "{canonical}#breadcrumb" }
  ]
}
@id convention: {canonical}#article, {profile_url}#person, {org_url}/#organization
Rule: omit any field that could not be confidently extracted (no invention).

Hosted DB Tables

-- Table 1
CREATE TABLE schema_generations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  url           text NOT NULL,
  canonical_url text,
  page_title    text,
  schema_type   text NOT NULL DEFAULT 'Article',
  schema_json   jsonb NOT NULL,
  author_count  int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'complete'
);

-- Table 2
CREATE TABLE author_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  profile_url   text NOT NULL UNIQUE,
  name          text NOT NULL,
  job_title     text,
  bio           text,
  headshot_url  text,
  website_url   text,
  social_links  jsonb NOT NULL DEFAULT '{}',
  same_as       jsonb NOT NULL DEFAULT '[]',
  domain        text
);

-- Table 3 (join)
CREATE TABLE schema_generation_authors (
  generation_id uuid NOT NULL REFERENCES schema_generations(id) ON DELETE CASCADE,
  author_id     uuid NOT NULL REFERENCES author_profiles(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'author',  -- 'author' | 'editor'
  PRIMARY KEY (generation_id, author_id)
);
author_profiles uses UPSERT ON CONFLICT (profile_url) so re-scraping the same author updates their bio rather than duplicating.
RLS: enable on all tables; backend uses HOSTED_DB_SERVICE_ROLE_KEY for writes.

API Endpoints
Method	Path	Description
GET	/health	Liveness check
POST	/api/schema/generate	Main pipeline: scrape → build → save → return JSON-LD
GET	/api/schema/history?limit=20	Recent generations from Hosted DB
GET	/api/authors?domain=	Cached author profiles
POST /api/schema/generate request body:


{ "url": "https://...", "schema_type": "Article" }
Response: GenerateResponse — { job_id, status, schema_json, page_title, authors_found, editors_found }

Identity Files (separate from IAN)
backend/identity/SOUL.md — Scrape-first, never invent. Output must pass Google Rich Results Test. Always include Article + Person + Organization + WebSite + BreadcrumbList. @id pattern is non-negotiable. Omit missing fields rather than guess.

backend/identity/USER.md — FastAPI service, HTTP-driven, single-shot per request, called by SEO Agent Playground frontend. Outputs are stored in Hosted DB for audit.

backend/identity/PLAN.md — Phase 1: Core pipeline (current). Phase 2: Schema validation + Google Rich Results Test API. Phase 3: Bulk URL/sitemap input + CMS webhook.

Frontend: SchemaGeneratorShell.tsx
Extends the AgentPageShell visual pattern but:

Input is a URL field (textarea still works; suggestion chips pre-fill real-looking example URLs)
handleSubmit calls fetch("/api/schema/generate", { method: "POST", ... }) instead of the fake timeout
Agent message bubble renders <pre> of JSON-LD with a Copy JSON button
Below JSON: small metadata bar — ✓ Authors found: N, ✓ Breadcrumbs: N items, Job ID: ...
Error states shown inline in the message thread
Implementation Order
Create backend/ directory skeleton (all __init__.py + .env.example)
Write backend/requirements.txt and backend/config.py
Write backend/scraper/social_extractor.py (pure function, zero dependencies)
Write backend/scraper/page_scraper.py (Playwright + BS4; mirror IAN's tools/browser.py pattern)
Write backend/scraper/author_scraper.py (depends on social_extractor)
Write backend/schema/builder.py and org_identity.py
Write backend/db/models.py and hosteddb_client.py
Write backend/main.py (wire everything)
Write identity files (SOUL.md, USER.md, PLAN.md)
Create Hosted DB tables via SQL editor in Hosted DB dashboard
Frontend: add --agent-schema to src/index.css
Frontend: add schema color to tailwind.config.ts
Frontend: add agent entry to src/config/agents.ts (import Braces icon)
Frontend: add Vite proxy to vite.config.ts
Frontend: create src/pages/agents/schema-generator/index.tsx
Frontend: create src/components/SchemaGeneratorShell.tsx
Frontend: add "schema-generator" to getPlaceholder() + getPlaceholderSuggestions() in AgentPageShell.tsx
Frontend: add route to src/App.tsx
Frontend: update agent count in src/pages/Index.tsx
Verification
cd seo-agent-playground/backend && pip install -r requirements.txt && playwright install chromium
Start backend: uvicorn main:app --reload --port 8001
curl http://localhost:8001/health → {"status":"ok"}
curl -X POST http://localhost:8001/api/schema/generate -H "Content-Type: application/json" -d '{"url":"https://REAL_PAGE_URL"}' → JSON-LD in response, row in Hosted DB
Start frontend: npm run dev (port 8080)
Open browser → navigate to Schema Generator agent → submit a URL → verify JSON-LD renders in chat + copy button works
Open Hosted DB dashboard → confirm rows in schema_generations and author_profiles
Paste output into Google Rich Results Test → zero errors
User approved the plan
Here's the complete Hosted DB setup guide — 7 steps, nothing to code:

Step 1 — Create project at hosteddb.com → New project → region EU West → wait ~2 min

Step 2 — Copy credentials from Project Settings → API:

Project URL → HOSTED_DB_URL
service_role key (not anon) → HOSTED_DB_SERVICE_ROLE_KEY
Step 3 — Run the SQL in SQL Editor → New query — copy the block from backend/identity/PLAN.md (the full CREATE TABLE block with all 3 tables + RLS). Expected result: Success. No rows returned.

Step 4 — Create .env — copy backend/.env.example → backend/.env and fill in your Hosted DB URL, service_role key, and your organisation identity (name, URL, logo, social links)

Step 5 — Install and start backend:


cd seo-agent-playground/backend
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload --port 8001
Step 6 — Verify:


curl http://localhost:8001/health
# → {"status":"ok","version":"1.0.0"}
Then post a real URL and check Table Editor → schema_generations for the row.

Step 7 — Start frontend (npm run dev) → Schema Generator in sidebar → paste URL.
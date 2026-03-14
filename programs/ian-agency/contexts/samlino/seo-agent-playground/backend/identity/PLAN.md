# PLAN.md — SEO Schema Generator Roadmap

## Phase 1 — Core Pipeline ✅ (Current)

Objective: Single URL → complete JSON-LD → Hosted DB

Deliverables:
- [x] FastAPI: `POST /api/schema/generate`
- [x] Playwright + BeautifulSoup page scraper (`page_scraper.py`)
- [x] Author bio follower with parallel scraping (`author_scraper.py`)
- [x] Social media link extractor (`social_extractor.py`)
- [x] JSON-LD builder with full `@graph` (`builder.py`)
- [x] Hosted DB: `schema_generations` + `author_profiles` + join table
- [x] React frontend: 8th agent card + `SchemaGeneratorShell`

Success criteria:
1. Every generated schema passes Google Rich Results Test without errors
2. `Person` nodes contain at minimum: `name`, `url`, `sameAs` (≥1 social link when found)
3. `BreadcrumbList` present on all article-type pages where breadcrumbs exist
4. Hosted DB stores every generation with full JSON for audit

---

## Phase 2 — Validation & Quality (Next)

Objective: Automated quality gates

Planned:
- [ ] Schema.org JSON-LD validator integration (local validation without Google API)
- [ ] Diff view: compare generated schema vs existing schema already on the page
- [ ] Author profile cache: check Hosted DB before re-scraping (use `updated_at` + TTL)
- [ ] Missing fields report: surface what couldn't be extracted and why
- [ ] Google Rich Results Test API integration (async ping after generation)

---

## Phase 3 — Bulk & Automation (Future)

Objective: Scale to many pages

Planned:
- [ ] Sitemap URL input: parse `sitemap.xml` and generate schemas for all URLs
- [ ] CSV batch input: accept a file of URLs via the frontend
- [ ] Webhook output: POST generated schema JSON to a configured endpoint (CMS integration)
- [ ] Re-generation scheduling: detect stale schemas when author bios change
- [ ] Deployment: containerise backend with Docker, deploy alongside frontend

---

## Database Migrations

All Hosted DB table SQL is in `backend/db/` comments and the project PLAN.md.
Apply via Hosted DB SQL Editor (no CLI migrations in Phase 1).

```sql
-- Run in Hosted DB SQL Editor:

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

-- Enable RLS on all tables
ALTER TABLE schema_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_generation_authors ENABLE ROW LEVEL SECURITY;

-- Backend writes with service role key (bypasses RLS)
-- Frontend reads (future): add SELECT policy for anon if needed
```

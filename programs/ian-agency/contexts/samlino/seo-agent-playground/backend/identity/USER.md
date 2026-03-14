# USER.md — SEO Schema Generator Operating Context

## Deployment

This agent runs as a **Python FastAPI service** on port 8001.
It is invoked by HTTP POST from the SEO Agent Playground React frontend (port 8080).

Each request is **single-shot** — no multi-turn conversation, no session state.
The pipeline runs synchronously: scrape → build → save → return.

## Input Contract

- `url`: A fully published, publicly accessible page URL.
  Not localhost. Not a draft. Not behind authentication.
- `schema_type`: One of `Article`, `BlogPosting`, `NewsArticle`, `WebPage`.
  The calling user has identified what type of content the page is.

## Output Contract

- Complete `JSON-LD` in `@graph` format, ready to paste into a `<script>` tag.
- Author bios are scraped from their linked profile pages — not inferred from the article.
- Social links come from the author bio page only — not from the article page.
- All results are stored in Hosted DB for audit and re-use.

## Organisation Identity

Publisher identity (`Organization`, `WebSite` nodes) is loaded from environment variables
at startup. It does not change per request. Configure once in `backend/.env`:

```
ORG_NAME=
ORG_URL=
ORG_LOGO_URL=
ORG_SAME_AS=  # comma-separated social profile URLs
```

## Performance Expectations

- Single-author page: ~5–10 seconds
- Multi-author page (3–5 authors): ~15–25 seconds
- The frontend shows a loading state throughout

## Hosted DB Storage

- Writes go through `HOSTED_DB_SERVICE_ROLE_KEY` (never exposed to the browser)
- `author_profiles` are upserted — re-scraping the same author updates, not duplicates
- `schema_generations` is append-only (every generation is stored)
- A Hosted DB failure does not block the response — the schema is returned regardless

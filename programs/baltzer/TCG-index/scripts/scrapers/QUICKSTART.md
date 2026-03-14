# Proxy Scraper Quick Start

**Full docs:** [docs/CARDMARKET_SCRAPER.md](../../docs/CARDMARKET_SCRAPER.md)

## Setup (Bright Data)

1. Add to `.env` (project root):
   ```
   PROXY_ENDPOINT=http://brd-customer-XXX-zone-cardmarket:password@brd.superproxy.io:33335
   ```
2. `npm run test-proxy`
3. `npm run scrape-top-proxy`

~35–45 min for 99 cards. Uses click-through (no direct URL) to avoid rate limits.

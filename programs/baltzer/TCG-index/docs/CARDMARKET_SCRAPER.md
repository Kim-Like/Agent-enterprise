# Cardmarket Scraper — Official Documentation

This is the **single source of truth** for the Cardmarket scraper. It documents how the working solution operates and what approaches have failed.

---

## Quick Start

```bash
# 1. Install browser (first time)
npx patchright install chromium

# 2. Add to .env (project root)
# HOSTED_DB_URL=...
# HOSTED_DB_SERVICE_ROLE_KEY=...
# PROXY_ENDPOINT=http://brd-customer-XXX-zone-cardmarket:password@brd.superproxy.io:33335

# 3. Test proxy
npm run test-proxy

# 4. Run Top 99 scraper
npm run scrape-top-proxy
```

**Runtime:** ~35–45 min for 99 cards. Uses checkpoints—resume if interrupted.

---

## How It Works

### The Working Approach: Click-Through Navigation

The scraper **does not** use `page.goto(productUrl)` for product pages. Direct URL navigation triggers Cardmarket rate limiting (429) after 3–5 requests. Instead, it navigates **like a human** by clicking links.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLICK-THROUGH FLOW (WORKING)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Load Weekly Top Cards page (once)                                   │
│     https://www.cardmarket.com/en/Magic/Data/Weekly-Top-Cards           │
│                                                                         │
│  2. Extract 99 card links from DOM (page.evaluate)                      │
│     Selectors: a.galleryBox, a.card[href*="/Products/Singles/"]         │
│                                                                         │
│  3. For each card (index 0..98):                                        │
│     a. Dismiss cookie consent + remove overlays                         │
│     b. Click link via humanClickLink (see strategies below)             │
│     c. Wait for product page URL                                        │
│     d. Extract: lowest_price, market_price, available_count             │
│     e. page.goBack() → return to Top Cards                              │
│     f. Delay 12–20s, breather every 8 cards                             │
│                                                                         │
│  4. Scrape same cards from TCGPlayer (search by name + set)              │
│                                                                         │
│  5. Persist to Hosted DB → compute_arbitrage_opportunities                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Click Strategies (human-simulator.ts)

When Playwright’s normal `locator.click()` fails (e.g. “element not visible” due to overlays), the scraper tries three strategies in order:

| Order | Strategy | Description |
|-------|----------|-------------|
| 1 | **evaluate click** | `page.evaluate` → `element.click()` in browser context. Bypasses Playwright visibility checks. |
| 2 | **mouse coords** | Get element center via `getBoundingClientRect()`, move mouse there, `page.mouse.click(x, y)`. |
| 3 | **locator force** | `locator.click({ force: true })` — ignores visibility. |

Before clicking, `removeBlockingOverlays()` hides cookie/consent banners via `display: none`.

### Key Components

| File | Role |
|------|------|
| `unified-scraper.ts` | Main flow: Top 99, click-through loop, TCGPlayer, DB persistence |
| `human-simulator.ts` | `humanClickLink`, `removeBlockingOverlays`, click strategies |
| `cloudflare-handler.ts` | Initial page load, Cloudflare challenge detection |
| `scraper-config.ts` | Delays (12–20s), proxy, CONSERVATIVE mode |

### Proxy (Bright Data)

- **Required** for reliable scraping. Without proxy: blocked after ~5 requests.
- **Format:** `http://brd-customer-XXX-zone-cardmarket:password@brd.superproxy.io:33335`
- **IP rotation:** Do NOT add `-session-` to username. Without session = new IP per connection.
- **Optional:** `PROXY_COUNTRY=de` for EU IPs.

---

## What Does Not Work

This section summarizes approaches that have been tried and **failed**. Do not revert to these.

### ❌ Direct URL Navigation (`page.goto(productUrl)`)

- **What:** Extract links, then `page.goto(url)` for each product.
- **Result:** Rate limited (429) after 3–5 requests.
- **Why:** Cardmarket detects repeated direct navigation as bot behavior.

### ❌ Playwright `locator.click()` (without force / evaluate)

- **What:** `cardLinks.nth(i).click()` or `humanClickLocator()`.
- **Result:** "Element is not visible" — cookie consent or overlays block the element.
- **Why:** Playwright enforces visibility; overlays make the link “not visible” even when in viewport.

### ❌ Bright Data Web Unlocker API

- **What:** Server-side fetch via Web Unlocker API (no browser).
- **Result:** Returns Cloudflare challenge page; cannot parse product content.
- **Why:** Cardmarket’s Cloudflare blocks even the Unlocker for this site.

### ❌ URL Parameters on Top Cards Page

- **What:** Add query params to Weekly Top Cards URL (e.g. `?limit=99`).
- **Result:** Triggers Cloudflare more aggressively.
- **Rule:** Use only `https://www.cardmarket.com/en/Magic/Data/Weekly-Top-Cards` with no params.

### ❌ Manual User-Agent / Header Overrides

- **What:** Override User-Agent to Chrome 131, inject extra headers.
- **Result:** Header/binary mismatch → 403/429.
- **Rule:** Let Patchright manage headers; do not over-stealth.

### ❌ Sticky Session (`-session-` in proxy username)

- **What:** Add `-session-XXXX` to Bright Data username for “same IP” per session.
- **Result:** Same IP gets blocked; rotation does not occur.
- **Rule:** Use basic username only (no `-session-`) for IP rotation.

### ❌ Multiple Parallel Workers for Cardmarket Top 99

- **What:** Run 3+ workers, each clicking different cards.
- **Result:** Click logic unreliable; workers hit “element not visible”.
- **Note:** Top 99 uses a single browser, single session. Catalog scrape can use parallel workers.

---

## Available Scripts

| Script | Use Case |
|--------|----------|
| `npm run scrape-top-proxy` | **Primary.** Top 99 via click-through. Requires proxy. |
| `npm run scrape-top-proxy-skip` | Same, but skips TCG failures (no retries). Use when TCG struggles. |
| `npm run scrape-catalog-proxy` | Full catalog from DB (requires `import-mtg` first). |
| `npm run test-proxy` | Verify proxy and Cloudflare bypass. |
| `npm run scrape-worker` | UI-triggered (Settings → Run Scrape). Same logic as scrape-top-proxy. |
| `npm run import-mtg` | One-time. Import MTG catalog (~77k cards). |

---

## Configuration

### Environment Variables

```env
HOSTED_DB_URL=https://your-project.hosteddb.co
HOSTED_DB_SERVICE_ROLE_KEY=your_key

# Required for scrape-top-proxy
PROXY_ENDPOINT=http://brd-customer-XXX-zone-cardmarket:password@brd.superproxy.io:33335

# Optional
PROXY_COUNTRY=de          # EU IPs
CONSERVATIVE=1            # Used by scrape-top-proxy (12–20s delays)
HEADLESS=true             # Default: visible browser (better for Cloudflare)
```

### Checkpoints

- **Location:** `.scraper-checkpoints/cardmarket-single-checkpoint.json`
- **Resume:** Automatically resumes from last completed index.
- **Fresh start:** `rm -f .scraper-checkpoints/cardmarket-single-checkpoint.json`

---

## Data Extracted

Per product page:

| Field | Selector / Source | Stored As |
|-------|-------------------|-----------|
| `lowest_price` | `dt:has-text("From") + dd`, fallback `.article-row .price-container` | Cents (EUR) |
| `market_price` | `dt:has-text("Price Trend") + dd` | Cents (EUR) |
| `available_count` | `dt:has-text("Available") + dd` | Integer |

---

## Troubleshooting

### "Element is not visible"

- Overlays (cookie consent) block the link. `removeBlockingOverlays()` should help.
- If it persists, the evaluate-based click (`element.click()`) should still work—verify it runs first.

### Rate limited (429)

- Ensure proxy is configured and `npm run test-proxy` passes.
- Do not use direct URL navigation; use click-through only.
- If still limited: increase delays in `scraper-config.ts` (CONSERVATIVE_CONFIG).

### Cloudflare challenge on initial load

- `CloudflareHandler.navigateWithProtection()` waits for challenge resolution.
- Run with visible browser: `HEADLESS=false npm run scrape-top-proxy`.
- Delete `.scraper-sessions/` and `.scraper-checkpoints/` for a fresh start.

### No cards in dashboard

- Arbitrage requires snapshots from **both** Cardmarket and TCGPlayer for the same product.
- Run `npm run scrape-top-proxy`.
- Check Settings page for snapshot counts per market.

---

## Related Docs

- **scraping_instructions.md** — General scraping overview, price trends, architecture.
- **scripts/scrapers/QUICKSTART.md** — Minimal proxy setup.

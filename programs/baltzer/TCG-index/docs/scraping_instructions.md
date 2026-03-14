# Scraping Instructions

## Overview

This system scrapes card prices from **Cardmarket** and **TCGPlayer** to:
1. Find **arbitrage opportunities** (price differences between markets)
2. Track **price trends** (top gainers / top decliners over time)

---

## Cardmarket Scraper (Primary)

**→ [CARDMARKET_SCRAPER.md](./CARDMARKET_SCRAPER.md)** — Official documentation.

Covers: how the click-through flow works, proxy setup, what doesn't work, troubleshooting.

### Quick Start

```bash
npx patchright install chromium
# Add PROXY_ENDPOINT to .env (see CARDMARKET_SCRAPER.md)
npm run test-proxy
npm run scrape-top-proxy
```

---

## Price Trends (Top Gainers / Decliners)

### How It Works

Price trends require **at least 2 scrapes** of the same products:

```
Scrape 1 (Day 1): Card A = $10.00
Scrape 2 (Day 2): Card A = $12.00
→ Price change: +$2.00 (+20%)
```

The system uses a `price_trends` database view that compares the two most recent snapshots for each product.

### Setup

1. **Run migration** (one-time):
   ```sql
   -- Run in Hosted DB SQL Editor
   -- File: database/migrations/006_price_trends.sql
   ```

2. **Scrape twice** (with time between):
   ```bash
   npm run scrape-top-proxy  # Day 1
   # Wait 24+ hours
   npm run scrape-top-proxy  # Day 2
   ```

3. **View trends** at `/trends` in the app

### Database Functions

```sql
-- Get top 20 price increases
SELECT * FROM get_top_gainers('Cardmarket', 20, 100);

-- Get top 20 price drops  
SELECT * FROM get_top_decliners('TCGPlayer', 20, 100);

-- View all trends
SELECT * FROM price_trends WHERE previous_price IS NOT NULL;
```

---

## Available Scripts

| Script | Use Case |
|--------|----------|
| `npm run scrape-top-proxy` | **Primary.** Top 99, click-through. See [CARDMARKET_SCRAPER.md](./CARDMARKET_SCRAPER.md). |
| `npm run scrape-catalog-proxy` | Full catalog from DB (requires import-mtg first). |
| `npm run test-proxy` | Verify proxy and Cloudflare bypass. |
| `npm run scrape-worker` | UI-triggered. Settings → Run Scrape. Same as scrape-top-proxy. |
| `npm run import-mtg` | One-time. Import MTG catalog (~77k cards). |

---

## Troubleshooting

### No Arbitrage Opportunities

Arbitrage requires snapshots from **both** markets for the same `product_key`:
- Run `npm run scrape-top-proxy`
- Check Settings page for snapshot counts per market

### No Trends Showing

Trends require **2+ snapshots** for the same product:
- First scrape = baseline price
- Second scrape = comparison price
- Run scraper again after 24+ hours

### Prices Look Wrong

Prices are stored in **cents**:
- `$7.00` = `700` in database
- `€12.50` = `1250` in database

### Database Functions Missing

Run migrations in order:
```sql
-- Hosted DB SQL Editor
\i database/migrations/006_price_trends.sql
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SCRAPING FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cardmarket Top 99  ─┬─►  products                          │
│  TCGPlayer (same)   ─┤    market_products                   │
│                      │    market_snapshots (with timestamp) │
│                      │          │                           │
│                      │          ▼                           │
│                      │    ┌─────────────────┐               │
│                      │    │ price_trends    │ ◄─ View       │
│                      │    │ (compares last  │               │
│                      │    │  2 snapshots)   │               │
│                      │    └─────────────────┘               │
│                      │          │                           │
│                      ▼          ▼                           │
│           compute_arbitrage_opportunities()                 │
│                      │                                      │
│                      ▼                                      │
│              ┌───────────────┐    ┌───────────────┐         │
│              │   Arbitrage   │    │    Trends     │         │
│              │   Dashboard   │    │   Dashboard   │         │
│              │   (/)         │    │   (/trends)   │         │
│              └───────────────┘    └───────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Schedule

| Frequency | Script | Purpose |
|-----------|--------|---------|
| Daily | `npm run scrape-top-proxy` | Keep arbitrage + trends fresh |
| Weekly | `npm run import-mtg` | Update card catalog (if new sets released) |
| As needed | Manual compute | `SELECT compute_arbitrage_opportunities();` |

---

## Reference

- **[CARDMARKET_SCRAPER.md](./CARDMARKET_SCRAPER.md)** — Cardmarket scraper (how it works, what doesn't work)

# Cloudflare Bypass Scraper for Trading Cards

A production-ready scraper for **Cardmarket** and **TCGPlayer** that reliably bypasses Cloudflare protection using residential proxies and fingerprint rotation.

## Why You're Getting Blocked After 5 Requests

Cloudflare uses multiple detection layers:

1. **TLS Fingerprinting** - Chromium/Playwright have known signatures
2. **Browser Fingerprinting** - Canvas, WebGL, fonts, etc.
3. **Behavioral Analysis** - Navigation patterns, timing, mouse movements
4. **IP Reputation** - Your IP gets flagged after repeated automation detection

Even with Patchright (anti-detection Playwright fork), the **same IP + fingerprint** making sequential requests triggers detection. The solution is **residential proxy rotation** combined with **fingerprint rotation**.

---

## Quick Start (2 Hours to Full Catalog)

### 1. Get a Residential Proxy (Required for Scale)

| Provider | Cost | Quality | Free Trial | Best For |
|----------|------|---------|------------|----------|
| [Bright Data](https://brightdata.com) | ~$15/GB | ⭐⭐⭐⭐⭐ | 7 days | Cloudflare bypass |
| [Oxylabs](https://oxylabs.io) | ~$12/GB | ⭐⭐⭐⭐⭐ | 7 days | Enterprise |
| [Smartproxy](https://smartproxy.com) | ~$8/GB | ⭐⭐⭐⭐ | 3 days | Value |
| [IPRoyal](https://iproyal.com) | ~$5/GB | ⭐⭐⭐ | Pay-as-you-go | Budget |

**Estimated bandwidth for full catalog:**
- 99 cards: ~50 MB
- 1,000 cards: ~500 MB  
- 10,000 cards: ~5 GB

### 2. Install & Configure

```bash
# Clone and install
cd your-project
npm install

# Install Patchright browser
npx patchright install chromium
```

Create/update `.env`:

```env
HOSTED_DB_URL=https://your-project.hosteddb.co
HOSTED_DB_SERVICE_ROLE_KEY=your_key_here

# Residential proxy endpoint (get from your provider dashboard)
# Format varies by provider:
PROXY_ENDPOINT=http://username:password@proxy.provider.com:port
```

### 3. Test Your Proxy

```bash
npm run test-proxy
```

This will:
- Verify proxy connectivity
- Test Cloudflare bypass on Cardmarket
- Check IP rotation
- Confirm TCGPlayer access

### 4. Run the Scraper

```bash
# Top 99 cards (primary - click-through flow)
npm run scrape-top-proxy

# Full catalog (requires import-mtg first)
npm run scrape-catalog-proxy

# Clear checkpoints to start fresh
rm -rf .scraper-checkpoints .scraper-sessions
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL SCRAPING ARCHITECTURE               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│   │Worker 0 │  │Worker 1 │  │Worker 2 │  │Worker 3 │  ...      │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│        │            │            │            │                 │
│        ▼            ▼            ▼            ▼                 │
│   ┌─────────────────────────────────────────────────┐           │
│   │              Residential Proxy Pool              │           │
│   │         (Auto-rotating IPs per request)          │           │
│   └─────────────────────────────────────────────────┘           │
│        │            │            │            │                 │
│        ▼            ▼            ▼            ▼                 │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│   │   CM    │  │   CM    │  │  TCG    │  │  TCG    │           │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                 │
│   Features:                                                     │
│   • Fingerprint rotation every N requests                       │
│   • Human behavior simulation (mouse, scroll, timing)           │
│   • Checkpoint/resume support                                   │
│   • Automatic Cloudflare challenge detection & retry            │
│   • Session persistence across runs                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Parallel Workers** | 5 workers by default, configurable |
| **Fingerprint Rotation** | New browser fingerprint every 10 requests |
| **Residential Proxies** | Different IP per worker, auto-rotating |
| **Human Behavior** | Mouse movements, scrolling, realistic timing |
| **Checkpoint/Resume** | Survives crashes, resumes where it left off |
| **Session Persistence** | Reuses Cloudflare cookies between runs |
| **Tracker Blocking** | Blocks analytics that aid fingerprinting |

---

## Configuration

Edit `src/scraper-config.ts` to adjust:

```typescript
// Production config (with proxy)
export const PRODUCTION_CONFIG: ScraperConfig = {
  proxy: {
    enabled: true,
    endpoint: process.env.PROXY_ENDPOINT || '',
    rotateEveryRequests: 10,  // New fingerprint every 10 requests
  },
  parallelWorkers: 5,           // 5 parallel browser instances
  minDelayBetweenRequests: 2000, // 2-4 second delays
  maxDelayBetweenRequests: 4000,
  maxRetries: 3,                // Retry failed requests 3 times
  // ...
};
```

### Performance Estimates

| Cards | Workers | Delay | Est. Time |
|-------|---------|-------|-----------|
| 99 | 5 | 3s | ~5 min |
| 1,000 | 5 | 3s | ~40 min |
| 5,000 | 5 | 3s | ~3 hours |
| 10,000 | 10 | 2s | ~3 hours |

---

## Proxy Provider Setup Examples

### Bright Data (Recommended)

1. Sign up at [brightdata.com](https://brightdata.com)
2. Create a "Residential" zone
3. Get your endpoint from the dashboard:

```env
PROXY_ENDPOINT=http://brd-customer-XXXXX-zone-residential:XXXXX@brd.superproxy.io:22225
```

### Smartproxy

1. Sign up at [smartproxy.com](https://smartproxy.com)
2. Create residential proxy user
3. Endpoint format:

```env
PROXY_ENDPOINT=http://username:password@gate.smartproxy.com:7777
```

### IPRoyal (Budget)

1. Sign up at [iproyal.com](https://iproyal.com)
2. Purchase residential proxies
3. Endpoint format:

```env
PROXY_ENDPOINT=http://username:password_streaming-1:12321@geo.iproyal.com:12321
```

---

## Troubleshooting

### Still Getting Blocked

1. **Check proxy quality**: Run `npm run test-proxy`
2. **Reduce concurrency**: Set `parallelWorkers: 2`
3. **Increase delays**: Set `minDelayBetweenRequests: 5000`
4. **Try different proxy provider**: Bright Data has best CF bypass

### Slow Performance

1. **Increase workers**: `parallelWorkers: 10`
2. **Reduce delays**: `minDelayBetweenRequests: 1500`
3. **Use premium proxy**: Faster providers = faster scraping

### Checkpoints Not Working

```bash
# Clear and restart
rm -rf .scraper-checkpoints .scraper-sessions
npm run scrape-top-proxy
```

### Price Extraction Failing

The scrapers use CSS selectors that may change. If prices aren't extracting:
1. Run in visible mode: `HEADLESS=false npm run scrape-top-proxy`
2. Inspect the page structure
3. Update selectors in `unified-scraper.ts`

---

## Project Structure

```
cloudflare-bypass-scraper/
├── src/
│   ├── scraper-config.ts      # Configuration (proxy, timing, workers)
│   ├── browser-manager.ts     # Browser lifecycle, fingerprints, sessions
│   ├── human-behavior.ts      # Mouse movements, scrolling, typing
│   ├── parallel-scraper.ts    # Work queue, checkpoints, parallel execution
│   ├── unified-scraper.ts     # Main entry point, CM + TCG scrapers
│   └── test-proxy.ts          # Proxy verification script
├── .scraper-sessions/         # Browser sessions (auto-created)
├── .scraper-checkpoints/      # Progress checkpoints (auto-created)
├── package.json
└── tsconfig.json
```

---

## Cost Comparison

### Without Proxies (Your Current Situation)
- 💸 Free
- ❌ Blocked after ~5 requests
- 🐌 ~99 cards/day (with 24hr cooldowns)
- ⏱️ Weeks to scrape full catalog

### With Residential Proxies
- 💰 ~$5-15 per full catalog scrape
- ✅ No blocks
- 🚀 ~10,000+ cards/hour
- ⏱️ 2 hours to scrape full catalog

**ROI**: A single arbitrage opportunity covering the proxy cost pays for months of scraping.

---

## Next Steps

1. **Get a proxy** (Bright Data free trial recommended)
2. **Run `npm run test-proxy`** to verify
3. **Run `npm run scrape-top-proxy`** to scrape
4. **Check your dashboard** for arbitrage opportunities

---

## License

MIT

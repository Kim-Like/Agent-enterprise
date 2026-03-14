npm run scrape-tcg-only# Cardmarket Top 99 Cards Scraper - Implementation Guide

## Overview

This document provides step-by-step implementation instructions for scraping the top 99 cards from [Cardmarket Weekly Top Cards](https://www.cardmarket.com/en/Magic/Data/Weekly-Top-Cards) and navigating to each product's detail page.

**Key Challenges:**
- Cloudflare protection (403 errors on direct requests)
- Bot detection and rate limiting
- Dynamic content loading
- Session persistence requirements

---

## Project Structure

```
project/
├── package.json
├── .env
├── tsconfig.json
├── src/
│   ├── scraper/
│   │   ├── cardmarket-top-cards.ts      # Main scraper
│   │   ├── browser-manager.ts           # Patchright browser setup
│   │   ├── human-simulator.ts           # Human-like behavior
│   │   ├── cloudflare-handler.ts        # Cloudflare bypass logic
│   │   └── checkpoint-manager.ts        # Resume interrupted scrapes
│   ├── db/
│   │   └── hosteddb-client.ts           # Database operations
│   └── types/
│       └── index.ts                     # TypeScript interfaces
├── .cardmarket-profiles/                # Browser session storage
└── .cardmarket-checkpoint.json          # Resume state
```

---

## Step 1: Install Dependencies

### package.json

```json
{
  "name": "cardmarket-scraper",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "scrape-top": "tsx src/scraper/cardmarket-top-cards.ts",
    "scrape-top-proxy": "USE_PROXY=true tsx src/scraper/cardmarket-top-cards.ts",
    "test-proxy": "tsx src/scraper/test-proxy.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@hosteddb/hosteddb-js": "^2.45.0",
    "dotenv": "^16.4.5",
    "patchright": "^1.49.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

### Install Commands

```bash
npm install
npx patchright install chromium
```

> **Why Patchright?** Patchright is a Playwright fork that patches browser fingerprinting detection vectors. Regular Playwright gets detected by Cloudflare's bot protection.

---

## Step 2: Environment Configuration

### .env

```env
# Hosted DB (for data persistence)
HOSTED_DB_URL=https://your-project.hosteddb.co
HOSTED_DB_SERVICE_ROLE_KEY=your_service_role_key

# Residential Proxy (Bright Data recommended)
PROXY_ENDPOINT=http://brd-customer-hl_XXXXX-zone-cardmarket:password@brd.superproxy.io:33335

# Optional: Worker ID for parallel scraping
WORKER_ID=0
```

---

## Step 3: TypeScript Types

### src/types/index.ts

```typescript
export interface CardData {
  rank: number;
  name: string;
  setName: string;
  productUrl: string;
  imageUrl?: string;
  // Price data from detail page
  priceFrom?: number;      // in cents
  priceTrend?: number;     // in cents
  availableItems?: number;
}

export interface ScraperCheckpoint {
  lastProcessedIndex: number;
  extractedCards: CardData[];
  timestamp: string;
  completed: boolean;
}

export interface BrowserConfig {
  headless: boolean;
  proxy?: {
    server: string;
  };
  profileDir: string;
  workerId: number;
}
```

---

## Step 4: Browser Manager (Anti-Detection)

### src/scraper/browser-manager.ts

```typescript
import { chromium, Browser, BrowserContext, Page } from 'patchright';
import path from 'path';
import fs from 'fs';
import { BrowserConfig } from '../types/index.js';

const PROFILE_DIR = '.cardmarket-profiles';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = {
      headless: process.env.HEADLESS === 'true',
      profileDir: PROFILE_DIR,
      workerId: parseInt(process.env.WORKER_ID || '0'),
      ...config,
    };

    if (process.env.USE_PROXY === 'true' && process.env.PROXY_ENDPOINT) {
      this.config.proxy = { server: process.env.PROXY_ENDPOINT };
    }
  }

  async launch(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    // Ensure profile directory exists
    const profilePath = path.join(
      this.config.profileDir,
      `worker-${this.config.workerId}`
    );
    
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }

    // Launch with anti-detection settings
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-infobars',
        '--window-size=1920,1080',
        '--start-maximized',
      ],
    });

    // Create persistent context with fingerprint noise
    this.context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'Europe/Berlin', // Cardmarket is EU-based
      geolocation: { latitude: 52.52, longitude: 13.405 }, // Berlin
      permissions: ['geolocation'],
      ...(this.config.proxy && { proxy: this.config.proxy }),
      // Anti-fingerprinting
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
    });

    // Load saved cookies/storage if exists
    const storagePath = path.join(profilePath, 'storage.json');
    if (fs.existsSync(storagePath)) {
      try {
        const storage = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
        if (storage.cookies) {
          await this.context.addCookies(storage.cookies);
        }
        console.log('✓ Loaded saved session');
      } catch (e) {
        console.log('⚠ Could not load saved session, starting fresh');
      }
    }

    // Block tracking scripts that aid fingerprinting
    await this.context.route('**/*', (route) => {
      const url = route.request().url();
      const blockedPatterns = [
        'google-analytics',
        'googletagmanager',
        'facebook.net',
        'doubleclick',
        'hotjar',
        'clarity.ms',
      ];
      
      if (blockedPatterns.some(p => url.includes(p))) {
        return route.abort();
      }
      return route.continue();
    });

    const page = await this.context.newPage();
    
    // Inject anti-detection scripts
    await this.injectAntiDetection(page);

    return { browser: this.browser, context: this.context, page };
  }

  private async injectAntiDetection(page: Page): Promise<void> {
    await page.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override chrome runtime
      (window as any).chrome = {
        runtime: {},
      };

      // Override permissions query
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission } as PermissionStatus);
        }
        return originalQuery(parameters);
      };

      // Add noise to canvas fingerprinting
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
        const context = originalGetContext.apply(this, [type, ...args] as any);
        if (type === '2d' && context) {
          const originalGetImageData = (context as CanvasRenderingContext2D).getImageData;
          (context as CanvasRenderingContext2D).getImageData = function(...args: any[]) {
            const imageData = originalGetImageData.apply(this, args as any);
            // Add tiny noise to prevent fingerprinting
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + (Math.random() - 0.5)));
            }
            return imageData;
          };
        }
        return context;
      };

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'de'],
      });
    });
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async saveSession(): Promise<void> {
    if (!this.context) return;
    
    const profilePath = path.join(
      this.config.profileDir,
      `worker-${this.config.workerId}`
    );
    const storagePath = path.join(profilePath, 'storage.json');

    try {
      const cookies = await this.context.cookies();
      fs.writeFileSync(storagePath, JSON.stringify({ cookies }, null, 2));
      console.log('✓ Session saved');
    } catch (e) {
      console.error('⚠ Failed to save session:', e);
    }
  }

  async close(): Promise<void> {
    await this.saveSession();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}
```

---

## Step 5: Human Behavior Simulator

### src/scraper/human-simulator.ts

```typescript
import { Page } from 'patchright';

export class HumanSimulator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Random delay between actions (human-like timing)
   */
  async randomDelay(minMs: number = 500, maxMs: number = 2000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
    await this.page.waitForTimeout(delay);
  }

  /**
   * Longer breather between batches of operations
   */
  async takeBreather(): Promise<void> {
    const breatherMs = Math.floor(Math.random() * 5000) + 3000; // 3-8 seconds
    console.log(`  💤 Taking a ${(breatherMs / 1000).toFixed(1)}s breather...`);
    await this.page.waitForTimeout(breatherMs);
  }

  /**
   * Simulate human-like mouse movement to element
   */
  async moveToElement(selector: string): Promise<void> {
    const element = await this.page.$(selector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

    // Current mouse position (approximate center of viewport)
    const startX = 960;
    const startY = 540;

    // Target position with small random offset
    const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
    const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

    // Move in small increments (human-like curve)
    const steps = Math.floor(Math.random() * 10) + 10;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const x = startX + (targetX - startX) * eased;
      const y = startY + (targetY - startY) * eased;
      await this.page.mouse.move(x, y);
      await this.page.waitForTimeout(Math.random() * 20 + 5);
    }
  }

  /**
   * Human-like scroll behavior
   */
  async humanScroll(direction: 'down' | 'up' = 'down'): Promise<void> {
    const scrollAmount = Math.floor(Math.random() * 300) + 200;
    const scrollDirection = direction === 'down' ? scrollAmount : -scrollAmount;

    await this.page.evaluate((amount) => {
      window.scrollBy({
        top: amount,
        behavior: 'smooth',
      });
    }, scrollDirection);

    await this.randomDelay(300, 800);
  }

  /**
   * Scroll to make element visible with natural behavior
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = await this.page.$(selector);
    if (!element) return;

    await element.scrollIntoViewIfNeeded();
    await this.randomDelay(200, 500);
  }

  /**
   * Human-like click with pre-movement
   */
  async humanClick(selector: string): Promise<void> {
    await this.moveToElement(selector);
    await this.randomDelay(100, 300);
    await this.page.click(selector);
    await this.randomDelay(500, 1500);
  }

  /**
   * Simulate reading the page (random scroll + delays)
   */
  async simulateReading(durationMs: number = 3000): Promise<void> {
    const endTime = Date.now() + durationMs;
    
    while (Date.now() < endTime) {
      // Random small scroll
      if (Math.random() > 0.5) {
        await this.humanScroll(Math.random() > 0.3 ? 'down' : 'up');
      }
      await this.randomDelay(500, 1500);
    }
  }
}
```

---

## Step 6: Cloudflare Handler

### src/scraper/cloudflare-handler.ts

```typescript
import { Page } from 'patchright';
import { HumanSimulator } from './human-simulator.js';

export class CloudflareHandler {
  private page: Page;
  private humanSim: HumanSimulator;

  constructor(page: Page) {
    this.page = page;
    this.humanSim = new HumanSimulator(page);
  }

  /**
   * Detect if Cloudflare challenge is present
   */
  async isCloudflareChallenge(): Promise<boolean> {
    const indicators = [
      'text="Checking your browser"',
      'text="Just a moment"',
      'text="Verify you are human"',
      '#challenge-running',
      '#challenge-stage',
      'iframe[src*="challenges.cloudflare.com"]',
    ];

    for (const indicator of indicators) {
      const element = await this.page.$(indicator);
      if (element) return true;
    }
    return false;
  }

  /**
   * Wait for Cloudflare challenge to complete (auto or manual)
   */
  async waitForChallengeCompletion(timeoutMs: number = 120000): Promise<boolean> {
    console.log('⏳ Cloudflare challenge detected, waiting for resolution...');
    console.log('   (If Turnstile appears, please solve it manually)');

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      // Check if challenge is gone
      const stillChallenging = await this.isCloudflareChallenge();
      if (!stillChallenging) {
        // Verify we're on actual content
        const hasContent = await this.page.$('.page-title, .table, [class*="card"]');
        if (hasContent) {
          console.log('✓ Cloudflare challenge passed');
          return true;
        }
      }

      // Look for Turnstile checkbox and try to click it
      const turnstileFrame = await this.page.$('iframe[src*="challenges.cloudflare.com"]');
      if (turnstileFrame) {
        try {
          const frame = await turnstileFrame.contentFrame();
          if (frame) {
            const checkbox = await frame.$('input[type="checkbox"], .cb-c');
            if (checkbox) {
              await this.humanSim.randomDelay(500, 1000);
              await checkbox.click();
            }
          }
        } catch (e) {
          // Iframe interaction can fail, that's okay
        }
      }

      await this.page.waitForTimeout(2000);
    }

    console.log('✗ Cloudflare challenge timeout');
    return false;
  }

  /**
   * Navigate with Cloudflare handling
   */
  async navigateWithProtection(url: string): Promise<boolean> {
    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Check for Cloudflare challenge
      if (await this.isCloudflareChallenge()) {
        const passed = await this.waitForChallengeCompletion();
        if (!passed) return false;
      }

      // Wait for actual page content
      await this.page.waitForSelector('body', { timeout: 10000 });
      await this.humanSim.randomDelay(1000, 2000);

      return true;
    } catch (error) {
      console.error(`Navigation error: ${error}`);
      return false;
    }
  }
}
```

---

## Step 7: Checkpoint Manager

### src/scraper/checkpoint-manager.ts

```typescript
import fs from 'fs';
import { ScraperCheckpoint, CardData } from '../types/index.js';

const CHECKPOINT_FILE = '.cardmarket-checkpoint.json';

export class CheckpointManager {
  private workerId: number;
  private checkpointFile: string;

  constructor(workerId: number = 0) {
    this.workerId = workerId;
    this.checkpointFile = workerId === 0 
      ? CHECKPOINT_FILE 
      : `.cardmarket-checkpoint-${workerId}.json`;
  }

  load(): ScraperCheckpoint | null {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const data = JSON.parse(fs.readFileSync(this.checkpointFile, 'utf-8'));
        console.log(`✓ Loaded checkpoint: ${data.lastProcessedIndex + 1} cards processed`);
        return data;
      }
    } catch (e) {
      console.log('⚠ Could not load checkpoint, starting fresh');
    }
    return null;
  }

  save(checkpoint: ScraperCheckpoint): void {
    checkpoint.timestamp = new Date().toISOString();
    fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
  }

  clear(): void {
    if (fs.existsSync(this.checkpointFile)) {
      fs.unlinkSync(this.checkpointFile);
      console.log('✓ Checkpoint cleared');
    }
  }

  createInitial(): ScraperCheckpoint {
    return {
      lastProcessedIndex: -1,
      extractedCards: [],
      timestamp: new Date().toISOString(),
      completed: false,
    };
  }
}
```

---

## Step 8: Main Scraper Implementation

### src/scraper/cardmarket-top-cards.ts

```typescript
import 'dotenv/config';
import { Page } from 'patchright';
import { BrowserManager } from './browser-manager.js';
import { HumanSimulator } from './human-simulator.js';
import { CloudflareHandler } from './cloudflare-handler.js';
import { CheckpointManager } from './checkpoint-manager.js';
import { CardData, ScraperCheckpoint } from '../types/index.js';

const TOP_CARDS_URL = 'https://www.cardmarket.com/en/Magic/Data/Weekly-Top-Cards';
const CARDS_TO_SCRAPE = 99;
const BATCH_SIZE = 8; // Take breather every N cards

class CardmarketScraper {
  private browserManager: BrowserManager;
  private checkpointManager: CheckpointManager;
  private page!: Page;
  private humanSim!: HumanSimulator;
  private cfHandler!: CloudflareHandler;
  private checkpoint!: ScraperCheckpoint;

  constructor() {
    this.browserManager = new BrowserManager();
    this.checkpointManager = new CheckpointManager(
      parseInt(process.env.WORKER_ID || '0')
    );
  }

  async init(): Promise<void> {
    const { page } = await this.browserManager.launch();
    this.page = page;
    this.humanSim = new HumanSimulator(page);
    this.cfHandler = new CloudflareHandler(page);
    
    // Load or create checkpoint
    this.checkpoint = this.checkpointManager.load() || this.checkpointManager.createInitial();
  }

  /**
   * Step 1: Navigate to the top cards page
   */
  async navigateToTopCards(): Promise<boolean> {
    console.log('\n📍 Navigating to Weekly Top Cards...');
    
    const success = await this.cfHandler.navigateWithProtection(TOP_CARDS_URL);
    if (!success) {
      console.error('✗ Failed to navigate to top cards page');
      return false;
    }

    // Wait for the table to load
    try {
      await this.page.waitForSelector('table tbody tr', { timeout: 30000 });
      console.log('✓ Top cards table loaded');
      return true;
    } catch (e) {
      console.error('✗ Table not found on page');
      return false;
    }
  }

  /**
   * Step 2: Extract card links from the table
   */
  async extractCardLinks(): Promise<{ name: string; url: string; rank: number }[]> {
    console.log('\n📋 Extracting card links from table...');

    // Scroll through the table to ensure all rows are loaded
    await this.humanSim.simulateReading(2000);

    const cards = await this.page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const results: { name: string; url: string; rank: number }[] = [];

      rows.forEach((row, index) => {
        // Find the product link - typically in the first or second column
        const link = row.querySelector('a[href*="/Products/Singles/"]') as HTMLAnchorElement;
        if (link) {
          results.push({
            rank: index + 1,
            name: link.textContent?.trim() || '',
            url: link.href,
          });
        }
      });

      return results;
    });

    console.log(`✓ Found ${cards.length} card links`);
    return cards.slice(0, CARDS_TO_SCRAPE);
  }

  /**
   * Step 3: Navigate to a card's detail page and extract price data
   */
  async scrapeCardDetails(cardUrl: string, cardName: string): Promise<Partial<CardData>> {
    const success = await this.cfHandler.navigateWithProtection(cardUrl);
    if (!success) {
      console.log(`  ⚠ Failed to load: ${cardName}`);
      return {};
    }

    // Simulate reading the page
    await this.humanSim.simulateReading(1500);

    // Extract price information
    const priceData = await this.page.evaluate(() => {
      const result: Record<string, any> = {};

      // Price From (lowest available price)
      // Look for patterns like "From €X.XX" or price in info box
      const priceFromSelectors = [
        '.info-list-container dt:contains("From") + dd',
        '[class*="price-from"]',
        '.col-offer .price-container .price',
        'dt:has-text("From") + dd',
      ];

      // Price Trend
      const priceTrendSelectors = [
        '.info-list-container dt:contains("Price Trend") + dd',
        '[class*="price-trend"]',
        'dt:has-text("Price Trend") + dd',
      ];

      // Available Items count
      const availableSelectors = [
        '.info-list-container dt:contains("Available") + dd',
        '[class*="available-items"]',
        'dt:has-text("Available") + dd',
      ];

      // Helper to extract price as cents
      const extractPrice = (text: string | null): number | undefined => {
        if (!text) return undefined;
        // Handle € and $ formats: "€1.23" or "$1.23" or "1,23 €"
        const match = text.match(/[\d.,]+/);
        if (match) {
          // Convert to cents (handle both . and , as decimal separators)
          const normalized = match[0].replace(',', '.');
          return Math.round(parseFloat(normalized) * 100);
        }
        return undefined;
      };

      // Try each selector pattern
      const trySelectors = (selectors: string[]): string | null => {
        for (const sel of selectors) {
          try {
            // Handle :contains and :has-text pseudo-selectors manually
            if (sel.includes(':contains(') || sel.includes(':has-text(')) {
              const match = sel.match(/dt:(?:contains|has-text)\("([^"]+)"\)/);
              if (match) {
                const searchText = match[1];
                const dts = document.querySelectorAll('dt');
                for (const dt of dts) {
                  if (dt.textContent?.includes(searchText)) {
                    const dd = dt.nextElementSibling;
                    if (dd?.tagName === 'DD') {
                      return dd.textContent;
                    }
                  }
                }
              }
            } else {
              const el = document.querySelector(sel);
              if (el) return el.textContent;
            }
          } catch (e) {
            // Selector failed, try next
          }
        }
        return null;
      };

      // Alternative: Parse the info list directly
      const infoItems = document.querySelectorAll('.info-list-container dl dt, .info-list dt');
      infoItems.forEach((dt) => {
        const label = dt.textContent?.trim().toLowerCase();
        const dd = dt.nextElementSibling;
        const value = dd?.textContent?.trim();

        if (label?.includes('from')) {
          result.priceFrom = extractPrice(value || null);
        }
        if (label?.includes('trend')) {
          result.priceTrend = extractPrice(value || null);
        }
        if (label?.includes('available')) {
          const match = value?.match(/\d+/);
          if (match) result.availableItems = parseInt(match[0]);
        }
      });

      // Get image URL
      const img = document.querySelector('.product-image img, [class*="card-image"] img') as HTMLImageElement;
      if (img) {
        result.imageUrl = img.src;
      }

      // Get set name
      const setLink = document.querySelector('a[href*="/Products/Singles/"][href*="/"]');
      if (setLink) {
        // Extract set name from breadcrumb or nearby element
        const breadcrumb = document.querySelector('.breadcrumb, nav[aria-label="breadcrumb"]');
        if (breadcrumb) {
          const setItem = breadcrumb.querySelector('a[href*="/Singles/"]');
          if (setItem) result.setName = setItem.textContent?.trim();
        }
      }

      return result;
    });

    return priceData;
  }

  /**
   * Main scraping loop with checkpoint support
   */
  async scrape(): Promise<CardData[]> {
    await this.init();

    try {
      // Navigate to top cards page
      const navSuccess = await this.navigateToTopCards();
      if (!navSuccess) {
        throw new Error('Failed to load top cards page');
      }

      // Extract all card links first
      const cardLinks = await this.extractCardLinks();
      if (cardLinks.length === 0) {
        throw new Error('No cards found on page');
      }

      // Resume from checkpoint if applicable
      const startIndex = this.checkpoint.lastProcessedIndex + 1;
      console.log(`\n🚀 Starting from card ${startIndex + 1} of ${cardLinks.length}`);

      // Process each card
      for (let i = startIndex; i < cardLinks.length; i++) {
        const card = cardLinks[i];
        console.log(`\n[${i + 1}/${cardLinks.length}] Scraping: ${card.name}`);

        // Navigate and extract details
        const details = await this.scrapeCardDetails(card.url, card.name);

        // Build card data
        const cardData: CardData = {
          rank: card.rank,
          name: card.name,
          productUrl: card.url,
          setName: details.setName || '',
          imageUrl: details.imageUrl,
          priceFrom: details.priceFrom,
          priceTrend: details.priceTrend,
          availableItems: details.availableItems,
        };

        // Update checkpoint
        this.checkpoint.extractedCards.push(cardData);
        this.checkpoint.lastProcessedIndex = i;
        this.checkpointManager.save(this.checkpoint);

        console.log(`  ✓ Price: €${((cardData.priceFrom || 0) / 100).toFixed(2)}`);

        // Take a breather every BATCH_SIZE cards
        if ((i + 1) % BATCH_SIZE === 0 && i < cardLinks.length - 1) {
          await this.humanSim.takeBreather();
        } else {
          // Random delay between cards
          await this.humanSim.randomDelay(2000, 5000);
        }
      }

      // Mark as completed
      this.checkpoint.completed = true;
      this.checkpointManager.save(this.checkpoint);

      console.log(`\n✅ Scraping complete! ${this.checkpoint.extractedCards.length} cards processed`);
      return this.checkpoint.extractedCards;

    } catch (error) {
      console.error('\n❌ Scraping failed:', error);
      throw error;
    } finally {
      await this.browserManager.close();
    }
  }
}

// Main execution
async function main() {
  const scraper = new CardmarketScraper();
  
  try {
    const cards = await scraper.scrape();
    
    // Output results as JSON
    console.log('\n📊 Results:');
    console.log(JSON.stringify(cards.slice(0, 5), null, 2));
    console.log(`... and ${cards.length - 5} more cards`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
```

---

## Step 9: Database Persistence (Optional)

### src/db/hosteddb-client.ts

```typescript
import { createClient, Hosted DBClient } from '@hosteddb/hosteddb-js';
import { CardData } from '../types/index.js';

export class Hosted DBDatabase {
  private client: Hosted DBClient;

  constructor() {
    const url = process.env.HOSTED_DB_URL;
    const key = process.env.HOSTED_DB_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Hosted DB credentials in environment');
    }

    this.client = createClient(url, key);
  }

  /**
   * Upsert product and create market snapshot
   */
  async persistCard(card: CardData, market: string = 'Cardmarket'): Promise<void> {
    // Generate product key (normalized name for cross-market matching)
    const productKey = this.normalizeProductKey(card.name, card.setName);

    // Upsert product
    const { data: product, error: productError } = await this.client
      .from('products')
      .upsert({
        product_key: productKey,
        name: card.name,
        set_name: card.setName,
        image_url: card.imageUrl,
      }, {
        onConflict: 'product_key',
      })
      .select('id')
      .single();

    if (productError) {
      console.error('Product upsert error:', productError);
      return;
    }

    // Upsert market product
    const { data: marketProduct, error: mpError } = await this.client
      .from('market_products')
      .upsert({
        product_id: product.id,
        market_name: market,
        market_url: card.productUrl,
      }, {
        onConflict: 'product_id,market_name',
      })
      .select('id')
      .single();

    if (mpError) {
      console.error('Market product upsert error:', mpError);
      return;
    }

    // Insert snapshot
    const { error: snapshotError } = await this.client
      .from('market_snapshots')
      .insert({
        market_product_id: marketProduct.id,
        price_cents: card.priceFrom,
        price_trend_cents: card.priceTrend,
        available_quantity: card.availableItems,
      });

    if (snapshotError) {
      console.error('Snapshot insert error:', snapshotError);
    }
  }

  /**
   * Normalize product key for cross-market matching
   */
  private normalizeProductKey(name: string, setName: string): string {
    const normalized = `${name}__${setName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return normalized;
  }

  /**
   * Run arbitrage computation
   */
  async computeArbitrage(): Promise<void> {
    const { error } = await this.client.rpc('compute_arbitrage_opportunities');
    if (error) {
      console.error('Arbitrage computation error:', error);
    } else {
      console.log('✓ Arbitrage opportunities computed');
    }
  }
}
```

---

## Step 10: Test Proxy Script

### src/scraper/test-proxy.ts

```typescript
import 'dotenv/config';
import { BrowserManager } from './browser-manager.js';

async function testProxy() {
  console.log('🔧 Testing proxy configuration...\n');

  const browserManager = new BrowserManager();
  
  try {
    const { page } = await browserManager.launch();

    // Test 1: Check IP
    console.log('Test 1: Checking IP address...');
    await page.goto('https://httpbin.org/ip');
    const ipText = await page.textContent('body');
    console.log(`  IP: ${ipText}\n`);

    // Test 2: Check headers
    console.log('Test 2: Checking request headers...');
    await page.goto('https://httpbin.org/headers');
    const headersText = await page.textContent('body');
    const headers = JSON.parse(headersText || '{}');
    console.log(`  User-Agent: ${headers.headers?.['User-Agent']}\n`);

    // Test 3: Try Cardmarket
    console.log('Test 3: Testing Cardmarket access...');
    const response = await page.goto('https://www.cardmarket.com/en/Magic', {
      waitUntil: 'domcontentloaded',
    });
    console.log(`  Status: ${response?.status()}`);
    
    // Check for Cloudflare
    const isCloudflare = await page.$('text="Checking your browser"');
    if (isCloudflare) {
      console.log('  ⚠ Cloudflare challenge detected - waiting...');
      await page.waitForTimeout(10000);
    }

    const title = await page.title();
    console.log(`  Page title: ${title}\n`);

    console.log('✅ Proxy test complete!');

  } catch (error) {
    console.error('❌ Proxy test failed:', error);
  } finally {
    await browserManager.close();
  }
}

testProxy();
```

---

## Troubleshooting Guide

### 1. Blocked by Cloudflare

```bash
# Delete saved profile and retry
rm -rf .cardmarket-profiles .cardmarket-checkpoint.json
npm run scrape-top
```

### 2. Rate Limited

- Increase delays in `human-simulator.ts`
- Reduce `BATCH_SIZE` in main scraper
- Use residential proxy (`npm run scrape-top-proxy`)

### 3. Elements Not Found

The DOM structure may have changed. Use browser DevTools to inspect:

```typescript
// Debug mode: pause and inspect
await page.pause();
```

### 4. Session Not Persisting

Check write permissions:
```bash
ls -la .cardmarket-profiles/
```

---

## DOM Structure Reference

Based on typical Cardmarket structure (verify with DevTools):

```html
<!-- Top Cards Table -->
<table class="table">
  <tbody>
    <tr>
      <td>1</td> <!-- Rank -->
      <td>
        <a href="/en/Magic/Products/Singles/SetName/CardName">
          Card Name
        </a>
      </td>
      <td>Set Name</td>
      <!-- ... price columns ... -->
    </tr>
  </tbody>
</table>

<!-- Product Detail Page -->
<div class="info-list-container">
  <dl>
    <dt>From</dt>
    <dd>€1.23</dd>
    <dt>Price Trend</dt>
    <dd>€1.45</dd>
    <dt>Available items</dt>
    <dd>42</dd>
  </dl>
</div>
```

---

## Execution Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Browser launch | 5-10s | Initialize Patchright + load session |
| Navigate to list | 10-30s | Load page + Cloudflare challenge |
| Extract links | 2-5s | Parse table |
| Per card | 12-20s | Navigate + extract + delay |
| **Total (99 cards)** | **35-45 min** | With breathers every 8 cards |

---

## Summary

1. **Install** Patchright and dependencies
2. **Configure** environment variables (proxy recommended)
3. **Run** `npm run scrape-top-proxy`
4. **Monitor** browser window for Cloudflare challenges
5. **Resume** automatically from checkpoint if interrupted

The scraper handles Cloudflare protection, simulates human behavior, and persists progress for reliable scraping of all 99 top cards.

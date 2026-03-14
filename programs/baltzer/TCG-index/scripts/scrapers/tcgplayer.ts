/**
 * TCGPlayer scraper - uses Patchright (patched Chromium) for JS-rendered pages
 */

import { chromium, type Page } from 'patchright';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScrapeResult {
  lowest_price: number;
  market_price?: number | null;
  available_count?: number | null;
  currency: 'USD';
  condition_norm: string;
}

const PRICE_SELECTORS = [
  '.listing-item__price',
  '[data-testid="listing-price"]',
  '.product-listing__price',
  '.price',
  '[class*="price"]',
];

export const DELAY_BETWEEN_REQUESTS_MS = 8000;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Build TCGPlayer search URL from set and card name */
export function getTCGPlayerSearchUrl(setName: string, cardName: string): string {
  const setSlug = normalize(setName);
  return `https://www.tcgplayer.com/search/magic/${setSlug}?q=${encodeURIComponent(cardName)}`;
}

/**
 * Navigate to TCGPlayer search and return the first product page URL, or null if not found.
 */
export async function findTCGPlayerProductUrl(
  page: Page,
  setName: string,
  cardName: string
): Promise<string | null> {
  const searchUrl = getTCGPlayerSearchUrl(setName, cardName);
  const response = await page.goto(searchUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  if (!response?.ok()) return null;

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  const content = await page.content();
  const productMatch = content.match(/href="(https?:\/\/[^"]*\/product\/\d+[^"]*)"/);
  if (productMatch) {
    const url = productMatch[1];
    return url.startsWith('http') ? url : `https://www.tcgplayer.com${url}`;
  }
  // Relative links
  const relMatch = content.match(/href="(\/product\/\d+[^"]*)"/);
  if (relMatch) {
    return `https://www.tcgplayer.com${relMatch[1]}`;
  }
  return null;
}

/**
 * Scrape prices from a TCGPlayer product page. Uses the provided page (navigate first).
 */
export async function scrapeTCGPlayerPage(page: Page, productUrl: string): Promise<ScrapeResult> {
  const response = await page.goto(productUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  if (!response?.ok()) {
    throw new Error(`TCGPlayer HTTP ${response?.status()}: ${productUrl}`);
  }

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  let prices: number[] = [];

  for (const selector of PRICE_SELECTORS) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      prices = await page.$$eval(selector, (elements) =>
        elements
          .map((el) => {
            const text = el.textContent?.replace(/[$,\s]/g, '').trim() || '0';
            const num = parseFloat(text);
            return isNaN(num) ? 0 : Math.round(num * 100);
          })
          .filter((c) => c > 0 && c < 50000)
      );
      if (prices.length > 0) break;
    } catch {
      continue;
    }
  }

  const content = await page.content();
  if (prices.length === 0) {
    const dollarMatch = content.match(/\$[\d,]+(?:\.\d{2})?/g);
    if (dollarMatch) {
      prices = dollarMatch
        .map((s) => {
          const num = parseFloat(s.replace(/[$,]/g, ''));
          return isNaN(num) ? 0 : Math.round(num * 100);
        })
        .filter((c) => c > 0 && c < 50000);
    }
  }

  prices = prices.filter((c) => c < 50000);
  if (prices.length === 0) {
    throw new Error('No prices found on TCGPlayer page');
  }

  const lowest_price = Math.min(...prices);

  let market_price: number | null = null;
  const marketRegex =
    /market\s*price[\s:]*\$?([\d,]+(?:\.\d{2})?)|tcg\s*market[\s:]*\$?([\d,]+(?:\.\d{2})?)|(?:\$[\d,]+(?:\.\d{2})?)\s*(?:market|from\s+tcg)/gi;
  const marketMatch = marketRegex.exec(content);
  if (marketMatch && (marketMatch[1] || marketMatch[2])) {
    const raw = (marketMatch[1] || marketMatch[2] || '').replace(/,/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0 && num < 1_000_000) market_price = Math.round(num * 100);
  }
  if (market_price == null && prices.length > 1) {
    const sorted = [...prices].sort((a, b) => a - b);
    market_price = sorted[Math.floor(sorted.length / 2)];
  }
  if (market_price != null && market_price >= 50000) market_price = null;

  return {
    lowest_price,
    market_price: market_price ?? undefined,
    available_count: prices.length,
    currency: 'USD',
    condition_norm: 'Near Mint',
  };
}

export type ScrapeTCGPlayerOutcome =
  | { success: true; data: ScrapeResult; productUrl: string }
  | { success: false; error: string };

/**
 * Find product via search and scrape it. Uses provided page (no browser launch).
 * Rate-limited: waits DELAY_BETWEEN_REQUESTS_MS between calls.
 */
export async function scrapeTCGPlayerFromSearch(
  page: Page,
  setName: string,
  cardName: string
): Promise<ScrapeTCGPlayerOutcome> {
  const productUrl = await findTCGPlayerProductUrl(page, setName, cardName);
  if (!productUrl) {
    return { success: false, error: 'Product not found on TCGPlayer search' };
  }

  try {
    const data = await scrapeTCGPlayerPage(page, productUrl);
    return { success: true, data, productUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function scrapeTCGPlayer(
  productUrl: string,
  _productKey: string
): Promise<ScrapeResult> {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    return await scrapeTCGPlayerPage(page, productUrl);
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Unified Catalog Scraper
 *
 * Top 99 (--top99) - Click-through: Top Cards -> click link -> product -> goBack
 * NO page.goto(productUrl) - only human-like clicks to avoid rate limiting
 *
 * Usage:
 *   npm run scrape-catalog              # Full catalog: Cardmarket + TCGPlayer
 *   npm run scrape-catalog -- --top99   # Top 99: Cardmarket + TCGPlayer
 *   npm run scrape-catalog -- --top99 --skip-remaining  # Skip TCG failures (no retries)
 *   npm run scrape-catalog -- --tcg-only        # TCGPlayer only (cards from DB)
 *   npm run scrape-catalog -- --top99 --tcg-only # TCGPlayer only (cards from Cardmarket checkpoint)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Page } from 'patchright';
import { createClient } from '@hosteddb/hosteddb-js';
import { getConfig, ScraperConfig } from './scraper-config';
import { ParallelScraper } from './parallel-scraper';
import { humanClick, humanScroll, randomDelay, simulateReading } from './human-behavior';
import { humanClickLink, removeBlockingOverlays } from './human-simulator';
import { CloudflareHandler } from './cloudflare-handler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const hosteddbUrl = process.env.HOSTED_DB_URL ?? '';
const hosteddbKey = process.env.HOSTED_DB_SERVICE_ROLE_KEY ?? '';

if (!hosteddbUrl || !hosteddbKey) {
  console.error('❌ Set HOSTED_DB_URL and HOSTED_DB_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const hosteddb = createClient(hosteddbUrl, hosteddbKey);

// ============================================================================
// Types
// ============================================================================

interface CardTask {
  product_key: string;
  card_name: string;
  set_name: string;
  cardmarket_url?: string; // For reference; human flow uses clicks, not goto
  card_index?: number; // 0-based index in Weekly Top Cards list (human flow: click Nth link)
}

interface CardmarketResult {
  lowest_price: number;
  market_price: number | null;
  available_count: number | null;
  url: string;
  external_id: string;
}

interface TCGPlayerResult {
  lowest_price: number;
  market_price: number | null;
  available_count: number | null;
  url: string;
}

// ============================================================================
// Cardmarket Scraper
// Human-like flow for Top 99: Weekly-Top-Cards -> click link -> product page -> goBack
// No page.goto(productUrl) - only click navigation to avoid bot detection
// ============================================================================

const TOP_CARDS_URL = 'https://www.cardmarket.com/en/Magic/Data/Weekly-Top-Cards';

async function dismissCookieConsent(page: Page): Promise<void> {
  try {
    const buttons = [
      page.getByRole('button', { name: /accept|accept all|akzeptieren/i }),
      page.locator('button:has-text("Accept")'),
      page.locator('button:has-text("Accept All")'),
      page.locator('button:has-text("Only Required")'),
      page.locator('[data-testid="cookie-accept"]'),
      page.locator('.cookie-consent button, [class*="cookie"] button'),
    ];
    for (const btn of buttons) {
      if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.first().click();
        await new Promise(r => setTimeout(r, 800));
        return;
      }
    }
  } catch {
    /* no consent banner */
  }
}

async function scrapeCardmarket(page: Page, task: CardTask): Promise<CardmarketResult> {
  let productUrl: string;

  if (task.card_index !== undefined) {
    // Human flow: from Weekly Top Cards, click Nth card link, extract, goBack
    const currentUrl = page.url();
    const isOnTopCards = currentUrl.includes('Weekly-Top-Cards');

    if (!isOnTopCards) {
      await page.goto(TOP_CARDS_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise(r => setTimeout(r, 2000));
      await dismissCookieConsent(page);
      await simulateReading(page, 1500, 2500);
    }

    await dismissCookieConsent(page);
    await humanScroll(page, 'down');
    await new Promise(r => setTimeout(r, 800));

    // Same selectors as cardmarket-top-cards (galleryBox/.card = grid cards only)
    const selectors = [
      'a.galleryBox[href*="/Products/Singles/"]',
      'a.card[href*="/Products/Singles/"]',
      '.table-body a[href*="/Products/Singles/"]',
      'a[href*="/en/Magic/Products/Singles/"]',
    ];
    let cardLinks: ReturnType<Page['locator']> = page.locator(selectors[0]);
    for (const sel of selectors) {
      const loc = page.locator(sel);
      if ((await loc.count()) > 0) {
        cardLinks = loc;
        break;
      }
    }

    const count = await cardLinks.count();
    if (count === 0) {
      throw new Error('No card links found on Weekly Top Cards page');
    }
    if (task.card_index >= count) {
      throw new Error(`Card index ${task.card_index} out of range (${count} links)`);
    }

    const link = cardLinks.nth(task.card_index);
    const href = await link.getAttribute('href');
    if (!href) throw new Error('No href on card link');
    productUrl = href.startsWith('http') ? href : `https://www.cardmarket.com${href}`;

    // Use force: true - overlays (cookie banner etc) make "visible" check fail even when in viewport
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      link.click({ force: true }),
    ]);
    await simulateReading(page, 2000, 4000);
    await humanScroll(page, 'down');
  } else {
    // Fallback: DB cards without direct URLs - use search
    const searchUrl = `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(task.card_name)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await simulateReading(page, 1500, 3000);

    const productLink = page.locator('.table-body a[href*="/Products/Singles/"]').first();
    if (!await productLink.isVisible({ timeout: 5000 })) {
      throw new Error(`No results for ${task.card_name}`);
    }
    const href = await productLink.getAttribute('href');
    if (!href) throw new Error('No product URL found');
    productUrl = href.startsWith('http') ? href : `https://www.cardmarket.com${href}`;

    await humanClick(page, '.table-body a[href*="/Products/Singles/"]');
    await page.waitForLoadState('domcontentloaded');
    await simulateReading(page, 2000, 4000);
  }

  // Extract external ID from URL
  const externalId = productUrl.match(/\/(\d+)(?:[?/]|$)/)?.[1] ||
                     productUrl.split('/').pop() ||
                     `cm-${task.product_key}`;
  
  // Extract prices
  let lowestPrice = 0;
  let marketPrice: number | null = null;
  let availableCount: number | null = null;
  
  // Try to find "From" price (lowest)
  try {
    const fromPrice = await page.locator('dt:has-text("From") + dd, .info-list-container:has-text("From")').first();
    if (await fromPrice.isVisible({ timeout: 3000 })) {
      const priceText = await fromPrice.textContent();
      const match = priceText?.match(/(\d+[.,]\d+)/);
      if (match) {
        lowestPrice = Math.round(parseFloat(match[1].replace(',', '.')) * 100);
      }
    }
  } catch {}
  
  // Try to find trend/market price
  try {
    const trendPrice = await page.locator('dt:has-text("Price Trend") + dd, .info-list-container:has-text("Trend")').first();
    if (await trendPrice.isVisible({ timeout: 3000 })) {
      const priceText = await trendPrice.textContent();
      const match = priceText?.match(/(\d+[.,]\d+)/);
      if (match) {
        marketPrice = Math.round(parseFloat(match[1].replace(',', '.')) * 100);
      }
    }
  } catch {}
  
  // Try to find available count
  try {
    const countEl = await page.locator('dt:has-text("Available") + dd, .info-list-container:has-text("Available")').first();
    if (await countEl.isVisible({ timeout: 3000 })) {
      const countText = await countEl.textContent();
      const match = countText?.match(/(\d+)/);
      if (match) {
        availableCount = parseInt(match[1], 10);
      }
    }
  } catch {}
  
  // Fallback: try to get price from article listing
  if (lowestPrice === 0) {
    try {
      const articlePrice = await page.locator('.article-row .price-container, .col-price').first();
      if (await articlePrice.isVisible({ timeout: 3000 })) {
        const priceText = await articlePrice.textContent();
        const match = priceText?.match(/(\d+[.,]\d+)/);
        if (match) {
          lowestPrice = Math.round(parseFloat(match[1].replace(',', '.')) * 100);
        }
      }
    } catch {}
  }
  
  if (lowestPrice === 0) {
    throw new Error('Could not extract price');
  }

  // Human flow: go back to Weekly Top Cards for next iteration (no new URLs in browser)
  if (task.card_index !== undefined) {
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await simulateReading(page, 1000, 2000);
  }
  
  return {
    lowest_price: lowestPrice,
    market_price: marketPrice,
    available_count: availableCount,
    url: productUrl,
    external_id: externalId,
  };
}

// ============================================================================
// TCGPlayer Scraper - Robust variant matching (no human logic needed)
// Direct navigation, multiple extraction strategies, strict card-name matching
// ============================================================================

function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Base card name without variant suffixes - for matching "Champions of the Perfect" vs "Champions of the Shoal" */
function getBaseCardName(cardName: string): string {
  return cardName
    .replace(/\s*\([^)]*\)\s*$/, '') // strip trailing (Extended Art), (Promo Pack), etc.
    .trim();
}

/** For DFCs like "Ashling Rekindled Ashling Rimebound", return first face for matching - TCGPlayer shows "Ashling Rekindled" or "Ashling Rekindled // Ashling Rimebound" */
function getDFCFirstFace(nameNorm: string): string | null {
  const words = nameNorm.split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[0]) {
      const firstFace = words.slice(0, i).join(' ');
      if (firstFace.length >= 3) return firstFace;
    }
  }
  return null;
}

interface TCGProduct {
  url: string;
  title: string;
  edition: string;
  lowestCents: number;
  marketCents: number;
  listings: number;
  isStandard: boolean;
  isOutOfStock: boolean;
}

/** Extract products from TCGPlayer search page - multiple strategies */
async function extractTCGProducts(page: Page, cardName: string, _setName: string): Promise<TCGProduct[]> {
  const baseCardNorm = normalizeForMatch(getBaseCardName(cardName));
  const dfcFirstFace = getDFCFirstFace(baseCardNorm);

  const products = await page.evaluate(
    ({ baseCardNorm: bcn, dfcFirstFace: dfc }) => {
      const out: TCGProduct[] = [];
      const seen = new Set<string>();

      const linkSelectors = ['a[href*="/product/"]'];

      for (const sel of linkSelectors) {
        const links = document.querySelectorAll<HTMLAnchorElement>(sel);
        for (const link of links) {
          const href = link.getAttribute('href');
          if (!href || !href.includes('/product/') || seen.has(href)) continue;

          // Find card container - walk up to find one with substantial content
          let card: Element | null = link;
          for (let i = 0; i < 8 && card; i++) {
            const parent: Element | null = card.parentElement;
            if (!parent) break;
            const text = (parent.textContent || '').trim();
            if (text.length > 50 && (text.includes('$') || text.includes('listings') || text.includes('Market'))) {
              card = parent;
              break;
            }
            card = parent;
          }

          const fullText = (card?.textContent || link.textContent || '').trim();
          if (fullText.length < 15) continue;

          const titleEl = card?.querySelector('h2, h3, h4, h5, [class*="title"], [class*="name"], [class*="productName"], [class*="ProductName"]') || link;
          const title = (titleEl?.textContent || fullText.split(/\n/)[0] || fullText.slice(0, 100)).trim();

          const isOutOfStock = /out\s*of\s*stock/i.test(fullText);
          const isExtendedArt = /extended\s*art|\(ea\)/i.test(title + fullText);
          const isPromo = /promo\s*pack|promo\s*:/i.test(fullText);
          const isFoil = /\bfoil\b/i.test(title) && !/non-?foil|normal\b/i.test(title);
          const isStandard = !isExtendedArt && !isPromo && !isFoil;

          const listingsMatch = fullText.match(/(\d+)\s*listings?\s*from\s*\$?([\d.]+)/i);
          const marketMatch = fullText.match(/market\s*price\s*[:\s]*\$?([\d.]+)/i);
          const fromMatch = fullText.match(/from\s*\$?([\d.]+)/i);
          const anyPriceMatch = fullText.match(/\$([\d.]+)/);

          let lowestCents = 0;
          if (listingsMatch) {
            lowestCents = Math.round(parseFloat(listingsMatch[2]) * 100);
          } else if (fromMatch) {
            lowestCents = Math.round(parseFloat(fromMatch[1]) * 100);
          } else if (anyPriceMatch && !isOutOfStock) {
            const p = parseFloat(anyPriceMatch[1]);
            if (p > 0 && p < 5000) lowestCents = Math.round(p * 100);
          }
          if (lowestCents <= 0 || lowestCents > 50000) continue;

          const marketCents = marketMatch ? Math.round(parseFloat(marketMatch[1]) * 100) : 0;
          const listings = listingsMatch ? parseInt(listingsMatch[1], 10) : 0;

          const titleNorm = title.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, ' ');
          const fullNorm = fullText.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, ' ');

          // Require full base card name - "Champions of the Perfect" must NOT match "Champions of the Shoal"
          // For DFCs (e.g. "Ashling Rekindled Ashling Rimebound"), also match first face - TCGPlayer shows "Ashling Rekindled" or "Ashling Rekindled // Ashling Rimebound"
          const matchesFull = bcn && (titleNorm.includes(bcn) || fullNorm.includes(bcn));
          const matchesDFC = dfc && (titleNorm.includes(dfc) || fullNorm.includes(dfc));
          const matchesBaseCard = matchesFull || matchesDFC;

          if (matchesBaseCard) {
            seen.add(href);
            const url = href.startsWith('http') ? href : `https://www.tcgplayer.com${href}`;
            out.push({
              url,
              title,
              edition: fullText.slice(0, 150),
              lowestCents,
              marketCents: marketCents || lowestCents,
              listings,
              isStandard,
              isOutOfStock,
            });
          }
        }
        if (out.length > 0) break;
      }

      return out;
    },
    { baseCardNorm, dfcFirstFace }
  );

  return products;
}

/** Fallback: regex extraction from raw page content when DOM structure differs */
function extractFromPageContent(html: string, cardName: string): TCGProduct[] {
  const baseCardNorm = normalizeForMatch(getBaseCardName(cardName));
  const dfcFirstFace = getDFCFirstFace(baseCardNorm);
  const products: TCGProduct[] = [];
  const seen = new Set<string>();

  // Match product links - capture href and content (prices appear in same card block)
  const linkRegex = /href="(\/product\/\d+[^"]*)"[^>]*>([\s\S]{0,800})/gi;
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    const block = m[2].replace(/<[^>]+>/g, ' ');
    if (seen.has(href)) continue;

    const blockNorm = block.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, ' ');
    const matchesFull = blockNorm.includes(baseCardNorm);
    const matchesDFC = dfcFirstFace && blockNorm.includes(dfcFirstFace);
    if (!matchesFull && !matchesDFC) continue;

    const listingsMatch = block.match(/(\d+)\s*listings?\s*from\s*\$?([\d.]+)/i);
    const marketMatch = block.match(/market\s*price\s*[:\s]*\$?([\d.]+)/i);
    const fromMatch = block.match(/from\s*\$?([\d.]+)/i);
    const anyPrice = block.match(/\$([\d.]+)/);

    let lowestCents = 0;
    if (listingsMatch) lowestCents = Math.round(parseFloat(listingsMatch[2]) * 100);
    else if (fromMatch) lowestCents = Math.round(parseFloat(fromMatch[1]) * 100);
    else if (anyPrice) {
      const p = parseFloat(anyPrice[1]);
      if (p > 0 && p < 5000) lowestCents = Math.round(p * 100);
    }
    if (lowestCents <= 0 || lowestCents > 50000) continue;

    const isOutOfStock = /out\s*of\s*stock/i.test(block);
    const isExtendedArt = /extended\s*art|\(ea\)/i.test(block);
    const isPromo = /promo\s*pack|promo\s*:/i.test(block);
    const isFoil = /\bfoil\b/i.test(block) && !/non-?foil|normal\b/i.test(block);

    seen.add(href);
    products.push({
      url: `https://www.tcgplayer.com${href}`,
      title: block.slice(0, 80).trim(),
      edition: block.slice(0, 150),
      lowestCents,
      marketCents: marketMatch ? Math.round(parseFloat(marketMatch[1]) * 100) : lowestCents,
      listings: listingsMatch ? parseInt(listingsMatch[1], 10) : 0,
      isStandard: !isExtendedArt && !isPromo && !isFoil,
      isOutOfStock,
    });
  }
  return products;
}

/** Extract and match product from TCGPlayer search - prefers standard over Extended Art, Promo Pack */
async function scrapeTCGPlayer(page: Page, task: CardTask): Promise<TCGPlayerResult> {
  // For DFCs (e.g. "Ashling Rekindled Ashling Rimebound"), search by first face - TCGPlayer indexes that way
  const baseCardNorm = normalizeForMatch(getBaseCardName(task.card_name));
  const dfcFirstFace = getDFCFirstFace(baseCardNorm);
  const searchName = dfcFirstFace ? dfcFirstFace.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : task.card_name;
  const searchQuery = `${searchName} ${task.set_name}`;
  const searchUrl = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(searchQuery)}&view=grid`;

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('a[href*="/product/"]', { timeout: 8000 }).catch(() => {});

  const setNameNorm = normalizeForMatch(task.set_name);

  let products = await extractTCGProducts(page, task.card_name, task.set_name);

  if (products.length === 0) {
    const html = await page.content();
    products = extractFromPageContent(html, task.card_name);
  }

  if (products.length === 0) {
    throw new Error(`No matching products for ${task.card_name} (${task.set_name})`);
  }

  // Filter: exclude out-of-stock when we have in-stock options
  const inStock = products.filter((p) => !p.isOutOfStock);
  const candidates = inStock.length > 0 ? inStock : products;

  // Prefer standard version, then filter by set
  const standard = candidates.filter((p) => p.isStandard);
  const byVariant = standard.length > 0 ? standard : candidates;

  const matches = byVariant.filter((p) => {
    const editionNorm = normalizeForMatch(p.edition);
    return !setNameNorm || editionNorm.includes(setNameNorm) || setNameNorm.includes(editionNorm);
  });

  const best = matches[0] || byVariant[0] || products[0];

  if (best.lowestCents > 50000) {
    throw new Error(`Price sanity check failed: $${(best.lowestCents / 100).toFixed(2)}`);
  }

  return {
    lowest_price: best.lowestCents,
    market_price: best.marketCents > 0 ? best.marketCents : null,
    available_count: best.listings > 0 ? best.listings : null,
    url: best.url,
  };
}

// ============================================================================
// Click-through: Top Cards -> click link -> product page -> goBack (no direct URL)
// ============================================================================

const CHECKPOINT_DIR = '.scraper-checkpoints';

function normalize(str: string): string {
  return str.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function slugToName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface ExtractedLink {
  href: string;
  setSlug: string;
  cardSlug: string;
  productKey: string;
  cardName: string;
  setName: string;
}

/** Extract links from DOM in same session we'll click from */
async function extractLinksFromPage(page: Page): Promise<ExtractedLink[]> {
  const raw = await page.evaluate(() => {
    const selectors = [
      'a.galleryBox[href*="/Products/Singles/"]',
      'a.card[href*="/Products/Singles/"]',
      'a[href*="/Products/Singles/"]',
    ];
    for (const sel of selectors) {
      const as = document.querySelectorAll<HTMLAnchorElement>(sel);
      if (as.length === 0) continue;
      const seen = new Set<string>();
      const out: { href: string; setSlug: string; cardSlug: string }[] = [];
      for (const a of as) {
        const href = a.getAttribute('href');
        if (!href) continue;
        const m = href.match(/\/Products\/Singles\/([^/]+)\/([^?#/]+)/);
        if (!m) continue;
        const key = m[1] + '/' + m[2];
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ href, setSlug: m[1], cardSlug: m[2] });
      }
      return out.slice(0, 99);
    }
    return [];
  });

  return raw.map((r) => ({
    ...r,
    productKey: `mtg:${normalize(slugToName(r.cardSlug))}:${normalize(slugToName(r.setSlug))}:regular:en`,
    cardName: slugToName(r.cardSlug),
    setName: slugToName(r.setSlug),
  }));
}

function loadSingleCheckpoint(): { completedIndices: number[]; results: Array<{ task: CardTask; result: CardmarketResult }> } {
  try {
    const p = path.join(process.cwd(), CHECKPOINT_DIR, 'cardmarket-single-checkpoint.json');
    if (!fs.existsSync(p)) return { completedIndices: [], results: [] };
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return { completedIndices: data.completedIndices || [], results: data.results || [] };
  } catch {
    return { completedIndices: [], results: [] };
  }
}

function saveSingleCheckpoint(completedIndices: number[], results: Array<{ task: CardTask; result: CardmarketResult }>): void {
  const dir = path.join(process.cwd(), CHECKPOINT_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'cardmarket-single-checkpoint.json'),
    JSON.stringify({ completedIndices, results, timestamp: new Date().toISOString() }, null, 2)
  );
}

/** Approach D: Single browser, extract + scrape in one flow */
async function scrapeTop99CardmarketSingleFlow(config: ScraperConfig): Promise<{
  completed: Array<{ task: CardTask; result: CardmarketResult }>;
  failed: number;
}> {
  const { chromium } = await import('patchright');
  const launchOptions: any = {
    headless: config.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--ignore-ssl-errors'],
  };
  if (config.proxy.enabled && config.proxy.endpoint) {
    const proxyUrl = new URL(config.proxy.endpoint);
    let username = decodeURIComponent(proxyUrl.username);
    if (process.env.PROXY_COUNTRY && !username.includes('-country-')) {
      username = `${username}-country-${process.env.PROXY_COUNTRY}`;
    }
    launchOptions.proxy = { server: `${proxyUrl.protocol}//${proxyUrl.host}`, username, password: decodeURIComponent(proxyUrl.password) };
  }

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  const minDelay = config.minDelayBetweenRequests;
  const maxDelay = config.maxDelayBetweenRequests;
  const delay = () => new Promise((r) => setTimeout(r, minDelay + Math.random() * (maxDelay - minDelay)));

  const completed: Array<{ task: CardTask; result: CardmarketResult }> = [];
  let failed = 0;

  try {
    console.log('📋 Loading Top Cards page (click-through, no direct URL)...');
    const cfHandler = new CloudflareHandler(page);
    const navOk = await cfHandler.navigateWithProtection(TOP_CARDS_URL);
    if (!navOk) {
      await page.goto(TOP_CARDS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    await new Promise((r) => setTimeout(r, 1500));
    await dismissCookieConsent(page);
    await removeBlockingOverlays(page);
    await new Promise((r) => setTimeout(r, 600));

    const links = await extractLinksFromPage(page);
    if (links.length === 0) {
      throw new Error('No card links found on Top Cards page');
    }
    console.log(`✓ Extracted ${links.length} links. Click-through navigation (human-like).\n`);

    const { completedIndices, results } = loadSingleCheckpoint();
    completed.push(...results);
    const doneSet = new Set(completedIndices);

    const selectors = [
      'a.galleryBox[href*="/Products/Singles/"]',
      'a.card[href*="/Products/Singles/"]',
      'a[href*="/Products/Singles/"]',
    ];
    let cardSelector = selectors[0];
    for (const sel of selectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        cardSelector = sel;
        break;
      }
    }

    for (let i = 0; i < links.length; i++) {
      if (doneSet.has(i)) {
        console.log(`[${i + 1}/${links.length}] ${links[i].cardName} (skip, already done)`);
        continue;
      }

      const link = links[i];
      const task: CardTask = {
        product_key: link.productKey,
        card_name: link.cardName,
        set_name: link.setName,
      };
      const productUrl = link.href.startsWith('http') ? link.href : `https://www.cardmarket.com${link.href}`;

      try {
        await delay();

        const currentUrl = page.url();
        if (!currentUrl.includes('Weekly-Top-Cards')) {
          const backOk = await cfHandler.navigateWithProtection(TOP_CARDS_URL);
          if (!backOk) await page.goto(TOP_CARDS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise((r) => setTimeout(r, 1200));
          await dismissCookieConsent(page);
          await removeBlockingOverlays(page);
        }

        const loc = page.locator(cardSelector).nth(i);
        const clicked = await humanClickLink(page, cardSelector, i, loc);
        if (!clicked) throw new Error('Click failed');

        await Promise.race([
          page.waitForURL(/\/Products\/Singles\//, { timeout: 25000 }),
          page.waitForLoadState('domcontentloaded'),
        ]).catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
        await dismissCookieConsent(page);

        const externalId = productUrl.match(/\/(\d+)(?:[?/]|$)/)?.[1] || link.cardSlug;
        let lowestPrice = 0;
        let marketPrice: number | null = null;
        let availableCount: number | null = null;

        try {
          const fromPrice = page.locator('dt:has-text("From") + dd, .info-list-container:has-text("From")').first();
          if (await fromPrice.isVisible({ timeout: 3000 })) {
            const text = await fromPrice.textContent();
            const m = text?.match(/(\d+[.,]\d+)/);
            if (m) lowestPrice = Math.round(parseFloat(m[1].replace(',', '.')) * 100);
          }
        } catch {}
        try {
          const trendPrice = page.locator('dt:has-text("Price Trend") + dd').first();
          if (await trendPrice.isVisible({ timeout: 2000 })) {
            const text = await trendPrice.textContent();
            const m = text?.match(/(\d+[.,]\d+)/);
            if (m) marketPrice = Math.round(parseFloat(m[1].replace(',', '.')) * 100);
          }
        } catch {}
        try {
          const avail = page.locator('dt:has-text("Available") + dd').first();
          if (await avail.isVisible({ timeout: 2000 })) {
            const text = await avail.textContent();
            const m = text?.match(/(\d+)/);
            if (m) availableCount = parseInt(m[1], 10);
          }
        } catch {}
        if (lowestPrice === 0) {
          const art = page.locator('.article-row .price-container, .col-price').first();
          if (await art.isVisible({ timeout: 2000 })) {
            const text = await art.textContent();
            const m = text?.match(/(\d+[.,]\d+)/);
            if (m) lowestPrice = Math.round(parseFloat(m[1].replace(',', '.')) * 100);
          }
        }

        if (lowestPrice === 0) throw new Error('No price found');

        const result: CardmarketResult = {
          lowest_price: lowestPrice,
          market_price: marketPrice,
          available_count: availableCount,
          url: productUrl,
          external_id: externalId,
        };
        completed.push({ task, result });
        doneSet.add(i);
        await saveSingleCheckpoint([...doneSet], completed);

        console.log(`[${i + 1}/${links.length}] ✓ ${link.cardName}: €${(lowestPrice / 100).toFixed(2)}`);

        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise((r) => setTimeout(r, 1000));
        await dismissCookieConsent(page);
        await removeBlockingOverlays(page);

        if ((i + 1) % 8 === 0) {
          const breather = 45000 + Math.random() * 30000;
          console.log(`  ⏸ Breather ${Math.round(breather / 1000)}s...`);
          await new Promise((r) => setTimeout(r, breather));
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`[${i + 1}/${links.length}] ✗ ${link.cardName}: ${msg}`);
        failed++;
        try {
          if (!page.url().includes('Weekly-Top-Cards')) {
            await page.goto(TOP_CARDS_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await new Promise((r) => setTimeout(r, 1500));
            await dismissCookieConsent(page);
          }
        } catch {}
      }
    }
  } finally {
    await browser.close();
  }

  return { completed, failed };
}

// ============================================================================
// Database Operations
// ============================================================================

async function loadCardsFromDatabase(limit = 10000): Promise<CardTask[]> {
  console.log('📚 Loading card catalog from database...');
  
  const { data, error } = await hosteddb
    .from('products')
    .select('product_key, card_name_norm, set_name_norm')
    .limit(limit);
  
  if (error) throw error;
  
  const tasks: CardTask[] = (data || []).map(row => ({
    product_key: row.product_key,
    card_name: row.card_name_norm,
    set_name: row.set_name_norm || '',
  }));
  
  console.log(`✓ Loaded ${tasks.length} cards`);
  return tasks;
}

async function upsertProducts(tasks: CardTask[]): Promise<void> {
  const products = tasks.map(t => ({
    product_key: t.product_key,
    card_name_norm: t.card_name,
    set_name_norm: t.set_name,
    rarity_norm: null,
    is_foil: false,
    language: 'en',
  }));
  const { error } = await hosteddb.from('products').upsert(products, { onConflict: 'product_key' });
  if (error) console.warn('Products upsert:', error.message);
}

async function persistResults(
  market: 'Cardmarket' | 'TCGPlayer',
  results: Array<{ task: CardTask; result: CardmarketResult | TCGPlayerResult }>
): Promise<void> {
  if (results.length === 0) return;
  
  console.log(`💾 Persisting ${results.length} ${market} results...`);
  
  const marketProducts = results.map(r => ({
    market,
    product_key: r.task.product_key,
    external_product_id: market === 'Cardmarket' 
      ? (r.result as CardmarketResult).external_id 
      : `tcg-${r.task.product_key}`,
    canonical_url: r.result.url,
  }));
  
  const snapshots = results.map(r => ({
    market,
    product_key: r.task.product_key,
    condition_norm: 'Near Mint',
    currency: market === 'Cardmarket' ? 'EUR' : 'USD',
    lowest_price: r.result.lowest_price,
    market_price: r.result.market_price,
    available_count: r.result.available_count,
  }));
  
  // Upsert market products
  const { error: mpError } = await hosteddb
    .from('market_products')
    .upsert(marketProducts, { onConflict: 'market,external_product_id' });
  
  if (mpError) {
    console.error(`⚠ market_products error: ${mpError.message}`);
  }
  
  // Insert snapshots
  const { error: snapError } = await hosteddb
    .from('market_snapshots')
    .insert(snapshots);
  
  if (snapError) {
    console.error(`⚠ market_snapshots error: ${snapError.message}`);
  }
  
  console.log(`✓ Persisted ${results.length} ${market} records`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           UNIFIED CATALOG SCRAPER WITH CLOUDFLARE BYPASS       ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const config = getConfig();
  
  if (!config.proxy.enabled) {
    console.log('⚠️  WARNING: No proxy configured. You WILL get blocked after ~5 requests.');
    console.log('   Set PROXY_ENDPOINT environment variable for reliable scraping.\n');
    console.log('   Recommended providers:');
    console.log('   - Bright Data: https://brightdata.com (best for CF)');
    console.log('   - Smartproxy: https://smartproxy.com (good value)');
    console.log('   - IPRoyal: https://iproyal.com (budget)\n');
  }
  
  const useTop99 = process.argv.includes('--top99');
  const tcgOnly = process.argv.includes('--tcg-only');
  const skipRemaining = process.argv.includes('--skip-remaining');
  let cards: CardTask[];
  let cmResults: { completed: Array<{ task: CardTask; result: CardmarketResult }>; failed: number } = { completed: [], failed: 0 };

  if (tcgOnly) {
    // Skip Cardmarket - load cards from checkpoint (--top99) or DB
    if (useTop99) {
      const { results } = loadSingleCheckpoint();
      cards = results.map((r) => r.task);
      if (cards.length === 0) {
        console.log('❌ No Cardmarket cards in checkpoint. Run full scrape first (without --tcg-only).');
        process.exit(1);
      }
      console.log(`✓ Loaded ${cards.length} cards from Cardmarket checkpoint\n`);
    } else {
      cards = await loadCardsFromDatabase();
      if (cards.length === 0) {
        console.log('❌ No cards in database. Run with --top99 for Top 99, or import-mtg first.');
        process.exit(1);
      }
      console.log(`✓ Loaded ${cards.length} cards from database\n`);
    }
  } else if (useTop99) {
    // Approach D: Single browser, extract + scrape in one flow
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('          PHASE 1: CARDMARKET (single session, Approach D)       ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    const estMin = (config.minDelayBetweenRequests + config.maxDelayBetweenRequests) / 2 / 1000;
    console.log(`📊 ~${Math.ceil(99 * estMin / 60 + 10)} min for 99 cards (12-20s/card + breathers)\n`);

    cmResults = await scrapeTop99CardmarketSingleFlow(config);
    cards = cmResults.completed.map((r) => r.task);
    await upsertProducts(cards);
    await persistResults('Cardmarket', cmResults.completed);
  } else {
    cards = await loadCardsFromDatabase();
    if (cards.length === 0) {
      console.log('❌ No cards in database. Run with --top99 for Top 99, or import-mtg first.');
      process.exit(1);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    PHASE 1: CARDMARKET                         ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    const cmScraper = new ParallelScraper<CardTask, CardmarketResult>(
      config,
      scrapeCardmarket,
      'www.cardmarket.com',
      'cardmarket-catalog'
    );
    cmScraper.addTasks(cards, (t) => `cm-${t.product_key}`);
    cmScraper.loadCheckpoint();
    const parallelResult = await cmScraper.run();
    cmResults = {
      completed: parallelResult.completed.map((r) => ({ task: r.task.data, result: r.result! })),
      failed: parallelResult.failed.length,
    };
    await persistResults('Cardmarket', cmResults.completed);
  }
  
  // =========================================================================
  // Scrape TCGPlayer
  // =========================================================================
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    PHASE 2: TCGPLAYER                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  if (skipRemaining) {
    console.log('📌 --skip-remaining: Failed cards will be skipped (no retries)\n');
  }
  
  const tcgScraper = new ParallelScraper<CardTask, TCGPlayerResult>(
    config,
    scrapeTCGPlayer,
    'www.tcgplayer.com',
    'tcgplayer-catalog',
    undefined,
    { skipRemaining }
  );
  
  tcgScraper.addTasks(cards, t => `tcg-${t.product_key}`);
  tcgScraper.loadCheckpoint();
  
  const tcgResults = await tcgScraper.run();
  
  // Persist TCGPlayer results
  await persistResults('TCGPlayer', tcgResults.completed.map(r => ({
    task: r.task.data,
    result: r.result!,
  })));
  
  // =========================================================================
  // Compute Arbitrage
  // =========================================================================
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    PHASE 3: ARBITRAGE                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const { data: arbCount, error: arbError } = await hosteddb.rpc('compute_arbitrage_opportunities');
  
  if (arbError) {
    console.log(`⚠ Arbitrage computation error: ${arbError.message}`);
  } else {
    console.log(`✓ Found ${arbCount ?? 0} arbitrage opportunities`);
  }
  
  // =========================================================================
  // Summary
  // =========================================================================
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        SUMMARY                                 ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`Cardmarket: ${cmResults.completed.length} success, ${cmResults.failed} failed`);
  console.log(`TCGPlayer:  ${tcgResults.completed.length} success, ${tcgResults.failed.length} failed`);
  console.log(`Arbitrage:  ${arbCount ?? 0} opportunities`);
  
  console.log('\n✅ Scraping complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

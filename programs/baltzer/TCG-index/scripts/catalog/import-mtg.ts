/**
 * MTG Catalog Import - Populates products and market_products from Scryfall bulk data
 *
 * Usage:
 *   npx tsx scripts/catalog/import-mtg.ts
 *
 * What it does:
 *   1. Downloads Scryfall bulk card data (~200MB JSON)
 *   2. Filters to English, paper, unique cards
 *   3. Generates product_key, names, Cardmarket URLs
 *   4. Inserts into Hosted DB in batches
 *
 * Note: TCGPlayer URLs are harder to predict; we generate a best-guess URL.
 *       Some may need manual correction or a separate lookup.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@hosteddb/hosteddb-js';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const hosteddbUrl = process.env.HOSTED_DB_URL ?? '';
const hosteddbKey = process.env.HOSTED_DB_SERVICE_ROLE_KEY ?? '';

if (!hosteddbUrl || !hosteddbKey) {
  console.error('Set HOSTED_DB_URL and HOSTED_DB_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const hosteddb = createClient(hosteddbUrl, hosteddbKey);

const SCRYFALL_BULK_URL = 'https://api.scryfall.com/bulk-data';
const CACHE_DIR = path.join(process.cwd(), '.cache');
const BATCH_SIZE = 500;

// Normalize string for URLs and product keys
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate Cardmarket URL
function cardmarketUrl(setName: string, cardName: string): string {
  const set = normalize(setName).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
  const card = normalize(cardName).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
  return `https://www.cardmarket.com/en/Magic/Products/Singles/${set}/${card}`;
}

// Generate TCGPlayer URL (best guess - may not always work)
function tcgplayerUrl(setName: string, cardName: string): string {
  const set = normalize(setName);
  const card = normalize(cardName);
  return `https://www.tcgplayer.com/search/magic/${set}?q=${encodeURIComponent(cardName)}`;
}

interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  lang: string;
  games: string[];
  layout: string;
  finishes: string[];
  digital: boolean;
}

async function downloadBulkData(): Promise<ScryfallCard[]> {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const cacheFile = path.join(CACHE_DIR, 'scryfall-default-cards.json');
  const cacheAge = 24 * 60 * 60 * 1000; // 24 hours

  // Use cache if fresh
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (Date.now() - stat.mtimeMs < cacheAge) {
      console.log('Using cached Scryfall data...');
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      return data;
    }
  }

  console.log('Fetching Scryfall bulk data info...');
  const bulkRes = await fetch(SCRYFALL_BULK_URL);
  const bulkData = await bulkRes.json();

  const defaultCards = bulkData.data.find((d: any) => d.type === 'default_cards');
  if (!defaultCards) {
    throw new Error('Could not find default_cards in Scryfall bulk data');
  }

  console.log(`Downloading ${defaultCards.name} (~${Math.round(defaultCards.size / 1024 / 1024)}MB)...`);
  const cardsRes = await fetch(defaultCards.download_uri);
  const cards: ScryfallCard[] = await cardsRes.json();

  fs.writeFileSync(cacheFile, JSON.stringify(cards));
  console.log(`Cached ${cards.length} cards to ${cacheFile}`);

  return cards;
}

function filterCards(cards: ScryfallCard[]): ScryfallCard[] {
  return cards.filter(card => {
    // English only
    if (card.lang !== 'en') return false;
    // Paper cards only
    if (card.digital) return false;
    if (!card.games.includes('paper')) return false;
    // Skip tokens, art cards, etc.
    if (['token', 'double_faced_token', 'art_series', 'emblem'].includes(card.layout)) return false;
    return true;
  });
}

function deduplicateCards(cards: ScryfallCard[]): ScryfallCard[] {
  // Keep one version per card name + set (ignore collector number variants)
  const seen = new Map<string, ScryfallCard>();
  for (const card of cards) {
    const key = `${card.name}::${card.set}`;
    if (!seen.has(key)) {
      seen.set(key, card);
    }
  }
  return Array.from(seen.values());
}

interface ProductRow {
  product_key: string;
  card_name_norm: string;
  set_name_norm: string;
  rarity_norm: string;
  is_foil: boolean;
  language: string;
}

interface MarketProductRow {
  market: string;
  product_key: string;
  external_product_id: string;
  canonical_url: string;
}

function cardToRows(card: ScryfallCard): { product: ProductRow; marketProducts: MarketProductRow[] } {
  const productKey = `mtg:${normalize(card.name)}:${normalize(card.set_name)}:regular:en`;

  const product: ProductRow = {
    product_key: productKey,
    card_name_norm: card.name,
    set_name_norm: card.set_name,
    rarity_norm: card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1),
    is_foil: false,
    language: 'en',
  };

  const marketProducts: MarketProductRow[] = [
    {
      market: 'Cardmarket',
      product_key: productKey,
      external_product_id: `cm-${card.id}`,
      canonical_url: cardmarketUrl(card.set_name, card.name),
    },
    {
      market: 'TCGPlayer',
      product_key: productKey,
      external_product_id: `tcg-${card.id}`,
      canonical_url: tcgplayerUrl(card.set_name, card.name),
    },
  ];

  return { product, marketProducts };
}

async function insertBatch<T extends Record<string, any>>(
  table: string,
  rows: T[],
  conflictColumn: string
): Promise<number> {
  const { error, count } = await hosteddb
    .from(table)
    .upsert(rows, { onConflict: conflictColumn, ignoreDuplicates: true, count: 'exact' });

  if (error) {
    console.error(`Error inserting into ${table}:`, error.message);
    return 0;
  }
  return count ?? rows.length;
}

async function main() {
  console.log('=== MTG Catalog Import ===\n');

  // Download
  const allCards = await downloadBulkData();
  console.log(`Total cards from Scryfall: ${allCards.length}`);

  // Filter
  const filtered = filterCards(allCards);
  console.log(`After filtering (English, paper): ${filtered.length}`);

  // Deduplicate
  const unique = deduplicateCards(filtered);
  console.log(`After deduplication: ${unique.length}\n`);

  // Convert to rows
  const products: ProductRow[] = [];
  const marketProducts: MarketProductRow[] = [];

  for (const card of unique) {
    const { product, marketProducts: mps } = cardToRows(card);
    products.push(product);
    marketProducts.push(...mps);
  }

  console.log(`Products to insert: ${products.length}`);
  console.log(`Market products to insert: ${marketProducts.length}\n`);

  // Insert products in batches
  console.log('Inserting products...');
  let insertedProducts = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const count = await insertBatch('products', batch, 'product_key');
    insertedProducts += count;
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, products.length)} / ${products.length}`);
  }
  console.log(`\n  Inserted/updated: ${insertedProducts}\n`);

  // Insert market_products in batches
  console.log('Inserting market_products...');
  let insertedMarketProducts = 0;
  for (let i = 0; i < marketProducts.length; i += BATCH_SIZE) {
    const batch = marketProducts.slice(i, i + BATCH_SIZE);
    const count = await insertBatch('market_products', batch, 'market,external_product_id');
    insertedMarketProducts += count;
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, marketProducts.length)} / ${marketProducts.length}`);
  }
  console.log(`\n  Inserted/updated: ${insertedMarketProducts}\n`);

  console.log('=== Done ===');
  console.log(`Products: ${insertedProducts}`);
  console.log(`Market products: ${insertedMarketProducts}`);
  console.log('\nNote: TCGPlayer URLs are search links. Some Cardmarket URLs may need adjustment.');
  console.log('Run a Hot Tier scrape to test a sample of products.');
}

main().catch(console.error);

import type { Market, ConditionNorm } from '@/types/database';

/**
 * Normalize condition codes from different markets to a standard format
 */
export function normalizeCondition(market: Market, rawCondition: string): ConditionNorm {
  const condition = rawCondition.trim().toUpperCase();
  
  if (market === 'Cardmarket') {
    const cardmarketMap: Record<string, ConditionNorm> = {
      'MT': 'Mint',
      'M': 'Mint',
      'MINT': 'Mint',
      'NM': 'Near Mint',
      'NEAR MINT': 'Near Mint',
      'EX': 'Excellent',
      'EXCELLENT': 'Excellent',
      'GD': 'Good',
      'GOOD': 'Good',
      'LP': 'Lightly Played',
      'LIGHTLY PLAYED': 'Lightly Played',
      'PL': 'Played',
      'PLAYED': 'Played',
      'PO': 'Poor',
      'POOR': 'Poor',
    };
    return cardmarketMap[condition] || 'Near Mint';
  }
  
  if (market === 'TCGPlayer') {
    const tcgplayerMap: Record<string, ConditionNorm> = {
      'NEAR MINT': 'Near Mint',
      'NM': 'Near Mint',
      'LIGHTLY PLAYED': 'Lightly Played',
      'LP': 'Lightly Played',
      'MODERATELY PLAYED': 'Played',
      'MP': 'Played',
      'HEAVILY PLAYED': 'Poor',
      'HP': 'Poor',
      'DAMAGED': 'Poor',
      'D': 'Poor',
    };
    return tcgplayerMap[condition] || 'Near Mint';
  }
  
  return 'Near Mint';
}

/**
 * Normalize text for consistent matching across markets
 * - lowercase
 * - trim
 * - normalize unicode (NFKD)
 * - remove punctuation: ()[]:;,'"
 * - collapse whitespace to single spaces
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[()[\]:;,'"]/g, '')    // Remove punctuation
    .replace(/\s+/g, ' ')            // Collapse whitespace
    .trim();
}

/**
 * Generate a stable product key for cross-market matching
 * Format: {game}:{card_name_norm}:{set_name_norm}:{is_foil}:{language}
 */
export function generateProductKey(
  game: string,
  cardName: string,
  setName: string,
  isFoil: boolean = false,
  language: string = 'en'
): string {
  const parts = [
    normalizeText(game),
    normalizeText(cardName),
    normalizeText(setName),
    isFoil ? 'foil' : 'regular',
    language.toLowerCase(),
  ];
  return parts.join(':');
}

/**
 * Parse price from Cardmarket format (30.975,14 €)
 * Returns price in cents (integer)
 */
export function parseCardmarketPrice(priceStr: string): number {
  // Remove currency symbol and whitespace
  let cleaned = priceStr.replace(/[€$£\s]/g, '').trim();
  
  // Cardmarket uses dot for thousands, comma for decimals
  // e.g., "30.975,14" -> "30975.14"
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  
  // Convert to cents
  return Math.round(value * 100);
}

/**
 * Parse price from TCGPlayer format ($45.99)
 * Returns price in cents (integer)
 */
export function parseTCGPlayerPrice(priceStr: string): number {
  // Remove currency symbol and whitespace
  const cleaned = priceStr.replace(/[$€£,\s]/g, '').trim();
  
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  
  // Convert to cents
  return Math.round(value * 100);
}

/**
 * Convert cents to display price
 */
export function centsToPrice(cents: number): number {
  return cents / 100;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: 'USD' | 'EUR' = 'USD'): string {
  const value = cents / 100;
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate arbitrage metrics
 */
export function calculateArbitrage(
  buyPriceCents: number,
  sellPriceCents: number
): { netProfit: number; profitMargin: number } {
  const netProfit = sellPriceCents - buyPriceCents;
  const profitMargin = buyPriceCents > 0 ? ((netProfit / buyPriceCents) * 100) : 0;
  
  return {
    netProfit,
    profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Create a hash of raw response data for cache invalidation
 */
export async function createRawHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Set name overrides for cross-market matching
const SET_NAME_OVERRIDES: Record<string, string> = {
  // Add known mismatches here as discovered
  // 'cardmarket_set_name': 'normalized_name',
  // 'tcgplayer_set_name': 'normalized_name',
};

/**
 * Normalize set name with override support
 */
export function normalizeSetName(setName: string): string {
  const normalized = normalizeText(setName);
  return SET_NAME_OVERRIDES[normalized] || normalized;
}

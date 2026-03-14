import { hosteddb } from '@/integrations/hosteddb/client';
import type { PriceTrend, PriceTrendWithProduct } from '@/types/trends';
import type { Market } from '@/types/database';

/**
 * Fetch top gainers (price increases) for a specific market or all markets
 */
export async function fetchTopGainers(options?: {
  market?: Market;
  limit?: number;
  minPreviousPrice?: number;
}): Promise<PriceTrendWithProduct[]> {
  const { market, limit = 20, minPreviousPrice = 100 } = options || {};

  const { data, error } = await hosteddb.rpc('get_top_gainers', {
    p_market: market ?? null,
    p_limit: limit,
    p_min_previous_price: minPreviousPrice,
  });

  if (error) {
    console.error('Error fetching top gainers:', error);
    throw error;
  }

  // Enrich with product details
  return enrichTrendsWithProducts(data || []);
}

/**
 * Fetch top decliners (price decreases) for a specific market or all markets
 */
export async function fetchTopDecliners(options?: {
  market?: Market;
  limit?: number;
  minPreviousPrice?: number;
}): Promise<PriceTrendWithProduct[]> {
  const { market, limit = 20, minPreviousPrice = 100 } = options || {};

  const { data, error } = await hosteddb.rpc('get_top_decliners', {
    p_market: market ?? null,
    p_limit: limit,
    p_min_previous_price: minPreviousPrice,
  });

  if (error) {
    console.error('Error fetching top decliners:', error);
    throw error;
  }

  // Enrich with product details
  return enrichTrendsWithProducts(data || []);
}

/**
 * Fetch all trends from the price_trends view with product info
 */
export async function fetchPriceTrends(options?: {
  market?: Market;
  limit?: number;
}): Promise<PriceTrendWithProduct[]> {
  const { market, limit = 100 } = options || {};

  let query = hosteddb
    .from('price_trends')
    .select('*')
    .not('previous_price', 'is', null)
    .gt('previous_price', 100);

  if (market) {
    query = query.eq('market', market);
  }

  query = query.order('price_change_pct', { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching price trends:', error);
    throw error;
  }

  return enrichTrendsWithProducts(data || []);
}

/**
 * Enrich trend data with product names from the products table
 */
async function enrichTrendsWithProducts(trends: PriceTrend[]): Promise<PriceTrendWithProduct[]> {
  if (trends.length === 0) return [];

  const productKeys = [...new Set(trends.map((t) => t.product_key))];

  const { data: products, error } = await hosteddb
    .from('products')
    .select('product_key, card_name_norm, set_name_norm, rarity_norm, image_url')
    .in('product_key', productKeys);

  if (error) {
    console.error('Error fetching products for trends:', error);
    // Return trends without enrichment
    return trends.map((t) => ({
      ...t,
      card_name: extractCardNameFromKey(t.product_key),
      set_name: extractSetNameFromKey(t.product_key),
    }));
  }

  const productMap = new Map(products?.map((p) => [p.product_key, p]) || []);

  return trends.map((t) => {
    const product = productMap.get(t.product_key);
    return {
      ...t,
      card_name: product?.card_name_norm || extractCardNameFromKey(t.product_key),
      set_name: product?.set_name_norm || extractSetNameFromKey(t.product_key),
      rarity: product?.rarity_norm ?? undefined,
      image_url: product?.image_url ?? undefined,
    };
  });
}

/**
 * Extract card name from product_key if product not found
 * Format: {game}:{card_name}:{set_name}:{foil}:{lang}
 */
function extractCardNameFromKey(key: string): string {
  const parts = key.split(':');
  if (parts.length >= 2) {
    return parts[1]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return 'Unknown Card';
}

function extractSetNameFromKey(key: string): string {
  const parts = key.split(':');
  if (parts.length >= 3) {
    return parts[2]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return 'Unknown Set';
}

/**
 * Get trend stats for dashboard
 */
export async function getTrendStats(): Promise<{
  totalWithTrends: number;
  avgGainerPct: number;
  avgDeclinerPct: number;
  biggestGainPct: number;
  biggestDropPct: number;
}> {
  const { data, error } = await hosteddb
    .from('price_trends')
    .select('price_change_pct')
    .not('previous_price', 'is', null);

  if (error || !data?.length) {
    return {
      totalWithTrends: 0,
      avgGainerPct: 0,
      avgDeclinerPct: 0,
      biggestGainPct: 0,
      biggestDropPct: 0,
    };
  }

  const gainers = data.filter((d) => d.price_change_pct > 0);
  const decliners = data.filter((d) => d.price_change_pct < 0);

  return {
    totalWithTrends: data.length,
    avgGainerPct:
      gainers.length > 0
        ? Math.round((gainers.reduce((sum, g) => sum + g.price_change_pct, 0) / gainers.length) * 10) / 10
        : 0,
    avgDeclinerPct:
      decliners.length > 0
        ? Math.round((decliners.reduce((sum, d) => sum + d.price_change_pct, 0) / decliners.length) * 10) / 10
        : 0,
    biggestGainPct: gainers.length > 0 ? Math.max(...gainers.map((g) => g.price_change_pct)) : 0,
    biggestDropPct: decliners.length > 0 ? Math.min(...decliners.map((d) => d.price_change_pct)) : 0,
  };
}

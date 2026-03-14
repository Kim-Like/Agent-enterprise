import { hosteddb } from '@/integrations/hosteddb/client';
import type { 
  Product, 
  MarketProduct, 
  MarketSnapshot, 
  ArbitrageOpportunityDB,
  FetchJob,
  Market,
  ConditionNorm 
} from '@/types/database';
import { calculateArbitrage, centsToPrice } from '@/lib/normalization';
import type { ArbitrageOpportunity } from '@/types/arbitrage';

/**
 * Fetch arbitrage opportunities from the database
 * Joins with products table to get card details
 */
export async function fetchArbitrageOpportunities(options?: {
  minMargin?: number;
  minProfit?: number;
  limit?: number;
  offset?: number;
}): Promise<ArbitrageOpportunity[]> {
  const { minMargin = 8, minProfit = 0, limit = 100, offset = 0 } = options || {};
  
  const { data, error } = await hosteddb
    .from('arbitrage_opportunities')
    .select(`
      *,
      products (
        card_name_norm,
        set_name_norm,
        rarity_norm,
        image_url
      )
    `)
    .gte('profit_margin', minMargin)
    .gte('net_profit', minProfit)
    .order('profit_margin', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching arbitrage opportunities:', error);
    throw error;
  }
  
  // Transform to UI format
  return (data || []).map((row: any) => ({
    id: row.id,
    cardName: row.products?.card_name_norm || 'Unknown',
    set: row.products?.set_name_norm || 'Unknown',
    rarity: row.products?.rarity_norm || 'Unknown',
    condition: row.condition_norm,
    buyPrice: centsToPrice(row.buy_price),
    buyMarket: row.buy_market,
    sellPrice: centsToPrice(row.sell_price),
    sellMarket: row.sell_market,
    profitMargin: row.profit_margin,
    netProfit: centsToPrice(row.net_profit),
    imageUrl: row.products?.image_url,
    lastUpdated: new Date(row.last_updated),
  }));
}

/**
 * Compute arbitrage opportunities from market snapshots
 * This should be run after new snapshots are fetched
 */
export async function computeArbitrageFromSnapshots(): Promise<number> {
  // Get latest snapshots for each product/condition combo from each market
  const { data: snapshots, error } = await hosteddb
    .from('market_snapshots')
    .select('*')
    .order('fetched_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching snapshots:', error);
    throw error;
  }
  
  // Group by product_key + condition_norm
  const grouped = new Map<string, { tcg?: MarketSnapshot; cm?: MarketSnapshot }>();
  
  for (const snapshot of snapshots || []) {
    const key = `${snapshot.product_key}:${snapshot.condition_norm}`;
    const existing = grouped.get(key) || {};
    
    if (snapshot.market === 'TCGPlayer' && !existing.tcg) {
      existing.tcg = snapshot;
    } else if (snapshot.market === 'Cardmarket' && !existing.cm) {
      existing.cm = snapshot;
    }
    
    grouped.set(key, existing);
  }
  
  // Calculate arbitrage for pairs
  const opportunities: Omit<ArbitrageOpportunityDB, 'id'>[] = [];
  
  for (const [key, { tcg, cm }] of grouped) {
    if (!tcg || !cm) continue;
    
    // TODO: Add currency conversion when needed (EUR/USD)
    // For now, assume same currency or manual conversion applied
    
    const [productKey, conditionNorm] = key.split(':');
    
    // Determine buy/sell direction
    let buyMarket: Market, sellMarket: Market, buyPrice: number, sellPrice: number;
    
    if (tcg.lowest_price < cm.lowest_price) {
      buyMarket = 'TCGPlayer';
      sellMarket = 'Cardmarket';
      buyPrice = tcg.lowest_price;
      sellPrice = cm.lowest_price;
    } else {
      buyMarket = 'Cardmarket';
      sellMarket = 'TCGPlayer';
      buyPrice = cm.lowest_price;
      sellPrice = tcg.lowest_price;
    }
    
    const { netProfit, profitMargin } = calculateArbitrage(buyPrice, sellPrice);
    
    // Only include if profitable
    if (profitMargin >= 8 && netProfit > 0) {
      opportunities.push({
        product_key: productKey,
        condition_norm: conditionNorm as ConditionNorm,
        buy_price: buyPrice,
        buy_market: buyMarket,
        sell_price: sellPrice,
        sell_market: sellMarket,
        profit_margin: profitMargin,
        net_profit: netProfit,
        last_updated: new Date().toISOString(),
      });
    }
  }
  
  if (opportunities.length === 0) {
    return 0;
  }
  
  // Upsert opportunities
  const { error: upsertError } = await hosteddb
    .from('arbitrage_opportunities')
    .upsert(opportunities, {
      onConflict: 'product_key,condition_norm',
    });
  
  if (upsertError) {
    console.error('Error upserting opportunities:', upsertError);
    throw upsertError;
  }
  
  return opportunities.length;
}

/**
 * Get stats for the dashboard
 */
export async function getArbitrageStats(): Promise<{
  totalOpportunities: number;
  avgMargin: number;
  bestDeal: number;
  totalPotential: number;
}> {
  const { data, error } = await hosteddb
    .from('arbitrage_opportunities')
    .select('profit_margin, net_profit');
  
  if (error || !data?.length) {
    return {
      totalOpportunities: 0,
      avgMargin: 0,
      bestDeal: 0,
      totalPotential: 0,
    };
  }
  
  const totalOpportunities = data.length;
  const avgMargin = data.reduce((sum, r) => sum + r.profit_margin, 0) / data.length;
  const bestDeal = Math.max(...data.map(r => r.net_profit));
  const totalPotential = data.reduce((sum, r) => sum + r.net_profit, 0);
  
  return {
    totalOpportunities,
    avgMargin: Math.round(avgMargin * 10) / 10,
    bestDeal: centsToPrice(bestDeal),
    totalPotential: centsToPrice(totalPotential),
  };
}

/**
 * Insert or update a product
 */
export async function upsertProduct(product: Omit<Product, 'created_at'>): Promise<void> {
  const { error } = await hosteddb
    .from('products')
    .upsert(product, { onConflict: 'product_key' });
  
  if (error) {
    console.error('Error upserting product:', error);
    throw error;
  }
}

/**
 * Insert a market snapshot
 */
export async function insertMarketSnapshot(snapshot: Omit<MarketSnapshot, 'id'>): Promise<void> {
  const { error } = await hosteddb
    .from('market_snapshots')
    .insert(snapshot);
  
  if (error) {
    console.error('Error inserting snapshot:', error);
    throw error;
  }
}

/**
 * Create a fetch job
 */
export async function createFetchJob(job: Omit<FetchJob, 'id' | 'created_at' | 'updated_at' | 'retry_count' | 'status'>): Promise<void> {
  const { error } = await hosteddb
    .from('fetch_jobs')
    .insert({
      ...job,
      status: 'pending',
      retry_count: 0,
    });
  
  if (error) {
    console.error('Error creating fetch job:', error);
    throw error;
  }
}

/**
 * Get pending fetch jobs
 */
export async function getPendingJobs(market: Market, limit: number = 10): Promise<FetchJob[]> {
  const { data, error } = await hosteddb
    .from('fetch_jobs')
    .select('*')
    .eq('market', market)
    .eq('status', 'pending')
    .lte('not_before', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
  
  return data || [];
}

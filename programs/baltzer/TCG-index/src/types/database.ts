// Database types matching the schema from the spec

export type Market = 'TCGPlayer' | 'Cardmarket';

export type ConditionNorm = 
  | 'Mint'
  | 'Near Mint'
  | 'Excellent'
  | 'Good'
  | 'Lightly Played'
  | 'Played'
  | 'Poor';

export interface Product {
  product_key: string;
  card_name_norm: string;
  set_name_norm: string;
  rarity_norm: string;
  is_foil: boolean;
  language: string;
  image_url?: string;
  created_at: string;
}

export interface MarketProduct {
  id: string;
  market: Market;
  product_key: string;
  external_product_id: string;
  canonical_url: string;
  last_seen_at: string;
}

export interface MarketSnapshot {
  id: string;
  market: Market;
  product_key: string;
  condition_norm: ConditionNorm;
  currency: 'USD' | 'EUR';
  lowest_price: number; // in cents
  market_price?: number; // in cents
  available_count?: number;
  fetched_at: string;
  raw_hash: string;
  parser_version: string;
}

export interface ArbitrageOpportunityDB {
  id: string;
  product_key: string;
  condition_norm: ConditionNorm;
  buy_price: number; // in cents
  buy_market: Market;
  sell_price: number; // in cents
  sell_market: Market;
  profit_margin: number;
  net_profit: number; // in cents
  last_updated: string;
}

export interface FetchJob {
  id: string;
  market: Market;
  url: string;
  job_type: 'product_page' | 'offers_page' | 'category_page';
  priority: number;
  not_before: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export type ScrapeJobMode = 'hot' | 'warm' | 'cold' | 'custom';

export type ScrapeJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type ScrapeJobItemStatus = 'queued' | 'running' | 'success' | 'failed' | 'skipped';

export interface ScrapeJob {
  id: string;
  created_at: string;
  status: ScrapeJobStatus;
  mode: ScrapeJobMode;
  markets: string[];
  progress_total: number;
  progress_done: number;
  last_log: string | null;
  error: string | null;
  finished_at: string | null;
}

export interface ScrapeJobItem {
  id: string;
  job_id: string;
  market: Market;
  product_key: string;
  url: string;
  status: ScrapeJobItemStatus;
  attempts: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

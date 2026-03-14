import type { Market } from './database';

export interface PriceTrend {
  product_key: string;
  market: Market;
  condition_norm: string;
  currency: 'USD' | 'EUR';
  current_price: number; // cents
  previous_price: number; // cents
  price_change: number; // cents (can be negative)
  price_change_pct: number; // percentage
  current_fetched_at: string;
  previous_fetched_at: string;
}

export interface PriceTrendWithProduct extends PriceTrend {
  card_name: string;
  set_name: string;
  rarity?: string;
  image_url?: string;
}

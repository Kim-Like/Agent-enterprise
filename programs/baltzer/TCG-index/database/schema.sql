-- Arbitrage Pipeline Schema for Hosted DB
-- Run this in your Hosted DB SQL Editor: https://yfxmbzgkuejiazkudtsf.hosteddb.co

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products table - unified product identity
CREATE TABLE IF NOT EXISTS products (
  product_key TEXT PRIMARY KEY,
  card_name_norm TEXT NOT NULL,
  set_name_norm TEXT NOT NULL,
  rarity_norm TEXT,
  is_foil BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'en',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_products_card_name ON products(card_name_norm);
CREATE INDEX IF NOT EXISTS idx_products_set_name ON products(set_name_norm);

-- 2. Market products - mapping between your products and marketplace IDs
CREATE TABLE IF NOT EXISTS market_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market TEXT NOT NULL CHECK (market IN ('TCGPlayer', 'Cardmarket')),
  product_key TEXT NOT NULL REFERENCES products(product_key) ON DELETE CASCADE,
  external_product_id TEXT NOT NULL,
  canonical_url TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(market, external_product_id)
);

CREATE INDEX IF NOT EXISTS idx_market_products_key ON market_products(product_key);

-- 3. Market snapshots - price history time series
CREATE TABLE IF NOT EXISTS market_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market TEXT NOT NULL CHECK (market IN ('TCGPlayer', 'Cardmarket')),
  product_key TEXT NOT NULL REFERENCES products(product_key) ON DELETE CASCADE,
  condition_norm TEXT NOT NULL CHECK (condition_norm IN (
    'Mint', 'Near Mint', 'Excellent', 'Good', 'Lightly Played', 'Played', 'Poor'
  )),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR')),
  lowest_price INTEGER NOT NULL, -- in cents
  market_price INTEGER, -- in cents
  available_count INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  raw_hash TEXT,
  parser_version TEXT DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_snapshots_product ON market_snapshots(product_key);
CREATE INDEX IF NOT EXISTS idx_snapshots_market ON market_snapshots(market);
CREATE INDEX IF NOT EXISTS idx_snapshots_fetched ON market_snapshots(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_lookup ON market_snapshots(product_key, condition_norm, market);

-- 4. Arbitrage opportunities - computed from snapshots
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_key TEXT NOT NULL REFERENCES products(product_key) ON DELETE CASCADE,
  condition_norm TEXT NOT NULL CHECK (condition_norm IN (
    'Mint', 'Near Mint', 'Excellent', 'Good', 'Lightly Played', 'Played', 'Poor'
  )),
  buy_price INTEGER NOT NULL, -- in cents
  buy_market TEXT NOT NULL CHECK (buy_market IN ('TCGPlayer', 'Cardmarket')),
  sell_price INTEGER NOT NULL, -- in cents
  sell_market TEXT NOT NULL CHECK (sell_market IN ('TCGPlayer', 'Cardmarket')),
  profit_margin NUMERIC(5,1) NOT NULL,
  net_profit INTEGER NOT NULL, -- in cents
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_key, condition_norm)
);

CREATE INDEX IF NOT EXISTS idx_arb_margin ON arbitrage_opportunities(profit_margin DESC);
CREATE INDEX IF NOT EXISTS idx_arb_profit ON arbitrage_opportunities(net_profit DESC);

-- 5. Fetch jobs - job queue for the scraper
CREATE TABLE IF NOT EXISTS fetch_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market TEXT NOT NULL CHECK (market IN ('TCGPlayer', 'Cardmarket')),
  url TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('product_page', 'offers_page', 'category_page')),
  priority INTEGER DEFAULT 0,
  not_before TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON fetch_jobs(status, not_before);
CREATE INDEX IF NOT EXISTS idx_jobs_market ON fetch_jobs(market);

-- 6. Row Level Security (enable for production)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_jobs ENABLE ROW LEVEL SECURITY;

-- Public read access for products and opportunities (adjust as needed)
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access for opportunities" ON arbitrage_opportunities FOR SELECT USING (true);
CREATE POLICY "Public read access for snapshots" ON market_snapshots FOR SELECT USING (true);

-- For now, allow all operations (tighten in production)
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for market_products" ON market_products FOR ALL USING (true);
CREATE POLICY "Allow all for market_snapshots" ON market_snapshots FOR ALL USING (true);
CREATE POLICY "Allow all for arbitrage_opportunities" ON arbitrage_opportunities FOR ALL USING (true);
CREATE POLICY "Allow all for fetch_jobs" ON fetch_jobs FOR ALL USING (true);

-- 7. Function to update arbitrage opportunities
CREATE OR REPLACE FUNCTION compute_arbitrage_opportunities()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Clear existing opportunities
  DELETE FROM arbitrage_opportunities;
  
  -- Compute new opportunities from latest snapshots
  WITH latest_snapshots AS (
    SELECT DISTINCT ON (market, product_key, condition_norm)
      market,
      product_key,
      condition_norm,
      lowest_price,
      currency,
      fetched_at
    FROM market_snapshots
    ORDER BY market, product_key, condition_norm, fetched_at DESC
  ),
  paired AS (
    SELECT 
      tcg.product_key,
      tcg.condition_norm,
      tcg.lowest_price AS tcg_price,
      cm.lowest_price AS cm_price,
      CASE WHEN tcg.lowest_price < cm.lowest_price THEN 'TCGPlayer' ELSE 'Cardmarket' END AS buy_market,
      CASE WHEN tcg.lowest_price < cm.lowest_price THEN 'Cardmarket' ELSE 'TCGPlayer' END AS sell_market,
      LEAST(tcg.lowest_price, cm.lowest_price) AS buy_price,
      GREATEST(tcg.lowest_price, cm.lowest_price) AS sell_price
    FROM latest_snapshots tcg
    JOIN latest_snapshots cm ON tcg.product_key = cm.product_key 
      AND tcg.condition_norm = cm.condition_norm
    WHERE tcg.market = 'TCGPlayer' AND cm.market = 'Cardmarket'
  )
  INSERT INTO arbitrage_opportunities (
    product_key, condition_norm, buy_price, buy_market, 
    sell_price, sell_market, profit_margin, net_profit, last_updated
  )
  SELECT 
    product_key,
    condition_norm,
    buy_price,
    buy_market,
    sell_price,
    sell_market,
    ROUND(((sell_price - buy_price)::NUMERIC / buy_price) * 100, 1) AS profit_margin,
    sell_price - buy_price AS net_profit,
    NOW()
  FROM paired
  WHERE sell_price > buy_price 
    AND ((sell_price - buy_price)::NUMERIC / buy_price) * 100 >= 8;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Example usage: SELECT compute_arbitrage_opportunities();

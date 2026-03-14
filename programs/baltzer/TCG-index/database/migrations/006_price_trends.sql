-- Migration: Add price trend tracking for growth/decline analysis
-- This enables "Top Gainers" and "Top Losers" views like stock trading apps

-- Create a view that computes price changes between the two most recent snapshots
-- for each product/market/condition combo
CREATE OR REPLACE VIEW price_trends AS
WITH ranked_snapshots AS (
  SELECT 
    id,
    market,
    product_key,
    condition_norm,
    currency,
    lowest_price,
    market_price,
    fetched_at,
    ROW_NUMBER() OVER (
      PARTITION BY market, product_key, condition_norm 
      ORDER BY fetched_at DESC
    ) AS rn
  FROM market_snapshots
),
current_snapshot AS (
  SELECT * FROM ranked_snapshots WHERE rn = 1
),
previous_snapshot AS (
  SELECT * FROM ranked_snapshots WHERE rn = 2
)
SELECT 
  c.id AS snapshot_id,
  c.market,
  c.product_key,
  c.condition_norm,
  c.currency,
  c.lowest_price AS current_price,
  p.lowest_price AS previous_price,
  c.market_price AS current_market_price,
  p.market_price AS previous_market_price,
  c.fetched_at AS current_fetched_at,
  p.fetched_at AS previous_fetched_at,
  -- Price change in cents
  COALESCE(c.lowest_price - p.lowest_price, 0) AS price_change,
  -- Percentage change (avoid division by zero)
  CASE 
    WHEN p.lowest_price > 0 THEN 
      ROUND(((c.lowest_price - p.lowest_price)::NUMERIC / p.lowest_price) * 100, 2)
    ELSE 0
  END AS price_change_pct,
  -- Time between snapshots
  EXTRACT(EPOCH FROM (c.fetched_at - p.fetched_at)) / 3600 AS hours_between_snapshots
FROM current_snapshot c
LEFT JOIN previous_snapshot p 
  ON c.market = p.market 
  AND c.product_key = p.product_key 
  AND c.condition_norm = p.condition_norm;

-- Index for faster trend queries
CREATE INDEX IF NOT EXISTS idx_snapshots_trend_lookup 
  ON market_snapshots(market, product_key, condition_norm, fetched_at DESC);

-- Function to get top gainers for a specific market
CREATE OR REPLACE FUNCTION get_top_gainers(
  p_market TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_min_previous_price INTEGER DEFAULT 100  -- Min 1.00 to filter noise
)
RETURNS TABLE (
  product_key TEXT,
  market TEXT,
  condition_norm TEXT,
  currency TEXT,
  current_price INTEGER,
  previous_price INTEGER,
  price_change INTEGER,
  price_change_pct NUMERIC,
  current_fetched_at TIMESTAMPTZ,
  previous_fetched_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.product_key,
    pt.market,
    pt.condition_norm,
    pt.currency,
    pt.current_price,
    pt.previous_price,
    pt.price_change,
    pt.price_change_pct,
    pt.current_fetched_at,
    pt.previous_fetched_at
  FROM price_trends pt
  WHERE pt.previous_price IS NOT NULL
    AND pt.previous_price >= p_min_previous_price
    AND pt.price_change_pct > 0
    AND (p_market IS NULL OR pt.market = p_market)
  ORDER BY pt.price_change_pct DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get top decliners for a specific market
CREATE OR REPLACE FUNCTION get_top_decliners(
  p_market TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_min_previous_price INTEGER DEFAULT 100  -- Min 1.00 to filter noise
)
RETURNS TABLE (
  product_key TEXT,
  market TEXT,
  condition_norm TEXT,
  currency TEXT,
  current_price INTEGER,
  previous_price INTEGER,
  price_change INTEGER,
  price_change_pct NUMERIC,
  current_fetched_at TIMESTAMPTZ,
  previous_fetched_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.product_key,
    pt.market,
    pt.condition_norm,
    pt.currency,
    pt.current_price,
    pt.previous_price,
    pt.price_change,
    pt.price_change_pct,
    pt.current_fetched_at,
    pt.previous_fetched_at
  FROM price_trends pt
  WHERE pt.previous_price IS NOT NULL
    AND pt.previous_price >= p_min_previous_price
    AND pt.price_change_pct < 0
    AND (p_market IS NULL OR pt.market = p_market)
  ORDER BY pt.price_change_pct ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the view and functions
GRANT SELECT ON price_trends TO anon, authenticated;

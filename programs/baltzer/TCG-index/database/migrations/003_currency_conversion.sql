-- Migration: Currency conversion for arbitrage (EUR → USD)
-- Run in Hosted DB SQL Editor
-- Converts Cardmarket EUR prices to USD before comparing with TCGPlayer

-- Config table for exchange rate (update periodically)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO config (key, value, updated_at) VALUES ('eur_to_usd', to_jsonb(1.08::numeric), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Updated compute function: convert all to USD cents before comparing
CREATE OR REPLACE FUNCTION compute_arbitrage_opportunities()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
  v_eur_to_usd NUMERIC;
BEGIN
  -- Get EUR→USD rate (default 1.08)
  SELECT COALESCE((value #>> '{}')::NUMERIC, 1.08) INTO v_eur_to_usd
  FROM config WHERE key = 'eur_to_usd' LIMIT 1;
  v_eur_to_usd := GREATEST(COALESCE(v_eur_to_usd, 1.08), 0.01);
  v_eur_to_usd := COALESCE(v_eur_to_usd, 1.08);

  DELETE FROM arbitrage_opportunities WHERE true;

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
  -- Convert all prices to USD cents for comparison
  converted AS (
    SELECT
      market,
      product_key,
      condition_norm,
      CASE
        WHEN currency = 'EUR' THEN ROUND(lowest_price * v_eur_to_usd)::INTEGER
        ELSE lowest_price
      END AS lowest_price_usd_cents
    FROM latest_snapshots
  ),
  paired AS (
    SELECT
      tcg.product_key,
      tcg.condition_norm,
      tcg.lowest_price_usd_cents AS tcg_price,
      cm.lowest_price_usd_cents AS cm_price,
      CASE WHEN tcg.lowest_price_usd_cents < cm.lowest_price_usd_cents THEN 'TCGPlayer' ELSE 'Cardmarket' END AS buy_market,
      CASE WHEN tcg.lowest_price_usd_cents < cm.lowest_price_usd_cents THEN 'Cardmarket' ELSE 'TCGPlayer' END AS sell_market,
      LEAST(tcg.lowest_price_usd_cents, cm.lowest_price_usd_cents) AS buy_price,
      GREATEST(tcg.lowest_price_usd_cents, cm.lowest_price_usd_cents) AS sell_price
    FROM converted tcg
    JOIN converted cm ON tcg.product_key = cm.product_key
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
    ROUND(((sell_price - buy_price)::NUMERIC / NULLIF(buy_price, 0)) * 100, 1) AS profit_margin,
    sell_price - buy_price AS net_profit,
    NOW()
  FROM paired
  WHERE sell_price > buy_price
    AND ((sell_price - buy_price)::NUMERIC / NULLIF(buy_price, 0)) * 100 >= 8;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

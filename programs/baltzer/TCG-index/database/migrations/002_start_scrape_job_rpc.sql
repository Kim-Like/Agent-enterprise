-- Migration: Add start_scrape_job RPC
-- Run in Hosted DB SQL Editor
-- Creates a scrape job and enqueues items based on mode (hot/warm/cold)

CREATE OR REPLACE FUNCTION start_scrape_job(
  p_mode TEXT,
  p_markets JSONB DEFAULT '["TCGPlayer", "Cardmarket"]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
  v_product_keys TEXT[];
  v_total INTEGER := 0;
  r RECORD;
  m TEXT;
BEGIN
  -- Resolve product keys based on mode
  IF p_mode = 'hot' THEN
    -- Small verification scrape: 10 products from catalog (market_products)
    -- Fallback to arbitrage/snapshots only if catalog is empty
    SELECT COALESCE(ARRAY_AGG(product_key), '{}') INTO v_product_keys
    FROM (
      SELECT product_key FROM market_products
      WHERE canonical_url IS NOT NULL AND canonical_url != ''
      GROUP BY product_key
      LIMIT 10
    ) hot_catalog;
    IF array_length(v_product_keys, 1) IS NULL OR array_length(v_product_keys, 1) = 0 THEN
      SELECT COALESCE(ARRAY_AGG(product_key), '{}') INTO v_product_keys
      FROM (
        SELECT product_key FROM arbitrage_opportunities ORDER BY profit_margin DESC LIMIT 10
      ) hot_arb;
    END IF;
    IF array_length(v_product_keys, 1) IS NULL OR array_length(v_product_keys, 1) = 0 THEN
      SELECT COALESCE(ARRAY_AGG(product_key), '{}') INTO v_product_keys
      FROM (
        SELECT DISTINCT ON (product_key) product_key
        FROM market_snapshots
        ORDER BY product_key, fetched_at DESC
        LIMIT 10
      ) hot_snap;
    END IF;
  ELSIF p_mode = 'warm' THEN
    -- Medium priority: products with market_products, limit 50
    SELECT ARRAY_AGG(DISTINCT product_key) INTO v_product_keys
    FROM (
      SELECT product_key FROM market_products
      WHERE canonical_url IS NOT NULL AND canonical_url != ''
      LIMIT 50
    ) sub;
  ELSIF p_mode = 'cold' THEN
    -- All products with URLs
    SELECT ARRAY_AGG(DISTINCT product_key) INTO v_product_keys
    FROM market_products
    WHERE canonical_url IS NOT NULL AND canonical_url != '';
  ELSE
    RAISE EXCEPTION 'Invalid mode: %. Use hot, warm, or cold.', p_mode;
  END IF;

  v_product_keys := COALESCE(v_product_keys, '{}');

  -- Create job
  INSERT INTO scrape_jobs (status, mode, markets, progress_total, progress_done, last_log)
  VALUES (
    'queued',
    p_mode,
    p_markets,
    0,
    0,
    format('Created job: %s mode, %s products selected', p_mode, COALESCE(array_length(v_product_keys, 1), 0))
  )
  RETURNING id INTO v_job_id;

  -- Insert scrape_job_items: one per (market, product) where we have a URL
  FOR m IN SELECT jsonb_array_elements_text(p_markets)
  LOOP
    FOR r IN
      SELECT mp.product_key, mp.canonical_url AS url
      FROM market_products mp
      WHERE mp.market = m
        AND mp.canonical_url IS NOT NULL
        AND mp.canonical_url != ''
        AND mp.product_key = ANY(v_product_keys)
    LOOP
      INSERT INTO scrape_job_items (job_id, market, product_key, url, status)
      VALUES (v_job_id, m, r.product_key, r.url, 'queued');
      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  -- Update progress_total
  UPDATE scrape_jobs SET progress_total = v_total WHERE id = v_job_id;

  RETURN v_job_id;
END;
$$;

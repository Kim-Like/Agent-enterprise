-- Fix: numeric field overflow in arbitrage profit_margin
-- profit_margin NUMERIC(5,1) overflows when buy_price is tiny (e.g. 1 cent) and sell_price is high
-- Example: buy=1¢, sell=200¢ → margin = 19900% → overflows NUMERIC(5,1)

ALTER TABLE arbitrage_opportunities
  ALTER COLUMN profit_margin TYPE NUMERIC(12,2);

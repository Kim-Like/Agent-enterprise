-- Migration: Remove legacy sample data from database
-- Run in Hosted DB SQL Editor after deploying schema and catalog import
--
-- Removes legacy sample products so catalog imports (e.g. MTG) are the
-- single source of truth. Run this once if your database has sample data.

-- Legacy sample product keys to remove
-- Delete in correct order due to FK constraints: snapshots → arbitrage → market_products → products

DELETE FROM market_snapshots
WHERE product_key IN (
  'mtg:black lotus:alpha:regular:en',
  'pokemon:charizard:base set 1st ed:regular:en',
  'yugioh:blue-eyes white dragon:legend of blue eyes:regular:en',
  'onepiece:monkey d luffy:romance dawn:regular:en',
  'lorcana:elsa spirit of winter:the first chapter:regular:en'
);

DELETE FROM arbitrage_opportunities
WHERE product_key IN (
  'mtg:black lotus:alpha:regular:en',
  'pokemon:charizard:base set 1st ed:regular:en',
  'yugioh:blue-eyes white dragon:legend of blue eyes:regular:en',
  'onepiece:monkey d luffy:romance dawn:regular:en',
  'lorcana:elsa spirit of winter:the first chapter:regular:en'
);

DELETE FROM market_products
WHERE product_key IN (
  'mtg:black lotus:alpha:regular:en',
  'pokemon:charizard:base set 1st ed:regular:en',
  'yugioh:blue-eyes white dragon:legend of blue eyes:regular:en',
  'onepiece:monkey d luffy:romance dawn:regular:en',
  'lorcana:elsa spirit of winter:the first chapter:regular:en'
);

DELETE FROM products
WHERE product_key IN (
  'mtg:black lotus:alpha:regular:en',
  'pokemon:charizard:base set 1st ed:regular:en',
  'yugioh:blue-eyes white dragon:legend of blue eyes:regular:en',
  'onepiece:monkey d luffy:romance dawn:regular:en',
  'lorcana:elsa spirit of winter:the first chapter:regular:en'
);

-- Recompute arbitrage opportunities from remaining data
SELECT compute_arbitrage_opportunities();

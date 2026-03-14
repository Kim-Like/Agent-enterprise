-- Migration: Add scrape_jobs and scrape_job_items tables
-- Run this in Hosted DB SQL Editor: https://hosteddb.com/dashboard/project/YOUR_PROJECT/sql
-- 
-- Purpose: Support manual "Run Scrape" flow with progress tracking per run_scraping_instructions.md

-- 1. scrape_jobs - tracks each scraping run
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'completed', 'failed', 'cancelled'
  )),
  mode TEXT NOT NULL CHECK (mode IN ('hot', 'warm', 'cold', 'custom')),
  markets JSONB DEFAULT '["Cardmarket", "TCGPlayer"]'::jsonb,
  progress_total INTEGER NOT NULL DEFAULT 0,
  progress_done INTEGER NOT NULL DEFAULT 0,
  last_log TEXT,
  error TEXT,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- 2. scrape_job_items - one row per (job, market, product) to scrape
CREATE TABLE IF NOT EXISTS scrape_job_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  market TEXT NOT NULL CHECK (market IN ('TCGPlayer', 'Cardmarket')),
  product_key TEXT NOT NULL REFERENCES products(product_key) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'success', 'failed', 'skipped'
  )),
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  UNIQUE(job_id, market, product_key)
);

CREATE INDEX IF NOT EXISTS idx_scrape_job_items_job ON scrape_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_scrape_job_items_status ON scrape_job_items(job_id, status);

-- 3. Row Level Security
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_job_items ENABLE ROW LEVEL SECURITY;

-- Public read (for progress modal)
CREATE POLICY "Public read scrape_jobs" ON scrape_jobs FOR SELECT USING (true);
CREATE POLICY "Public read scrape_job_items" ON scrape_job_items FOR SELECT USING (true);

-- Allow insert/update for API and worker (adjust for your auth in production)
CREATE POLICY "Allow all scrape_jobs" ON scrape_jobs FOR ALL USING (true);
CREATE POLICY "Allow all scrape_job_items" ON scrape_job_items FOR ALL USING (true);

-- 4. Optional: Comment for documentation
COMMENT ON TABLE scrape_jobs IS 'Manual scrape runs triggered via UI. Worker picks queued jobs and processes items.';
COMMENT ON TABLE scrape_job_items IS 'Individual scrape tasks per (job, market, product). Worker processes sequentially with rate limiting.';

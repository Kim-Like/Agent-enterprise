import { hosteddb } from '@/integrations/hosteddb/client';
import type { FetchJob, Market, ScrapeJob, ScrapeJobItem } from '@/types/database';

export interface ScrapingStats {
  totalProducts: number;
  totalSnapshots: number;
  lastSnapshotAt: Date | null;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
  marketBreakdown: {
    tcgPlayer: { snapshots: number; lastFetch: Date | null };
    cardmarket: { snapshots: number; lastFetch: Date | null };
  };
}

/**
 * Get scraping/data freshness statistics
 */
export async function getScrapingStats(): Promise<ScrapingStats> {
  const [productsRes, snapshotsRes, jobsRes, tcgSnapshotsRes, cmSnapshotsRes] = await Promise.all([
    hosteddb.from('products').select('product_key', { count: 'exact', head: true }),
    hosteddb.from('market_snapshots').select('fetched_at').order('fetched_at', { ascending: false }).limit(1),
    hosteddb.from('fetch_jobs').select('status'),
    hosteddb.from('market_snapshots').select('fetched_at').eq('market', 'TCGPlayer').order('fetched_at', { ascending: false }).limit(1),
    hosteddb.from('market_snapshots').select('fetched_at').eq('market', 'Cardmarket').order('fetched_at', { ascending: false }).limit(1),
  ]);

  // Get counts for snapshots
  const { count: snapshotCount } = await hosteddb
    .from('market_snapshots')
    .select('id', { count: 'exact', head: true });

  const { count: tcgCount } = await hosteddb
    .from('market_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('market', 'TCGPlayer');

  const { count: cmCount } = await hosteddb
    .from('market_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('market', 'Cardmarket');

  const jobs = jobsRes.data || [];
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;

  return {
    totalProducts: productsRes.count || 0,
    totalSnapshots: snapshotCount || 0,
    lastSnapshotAt: snapshotsRes.data?.[0]?.fetched_at 
      ? new Date(snapshotsRes.data[0].fetched_at) 
      : null,
    pendingJobs,
    completedJobs,
    failedJobs,
    marketBreakdown: {
      tcgPlayer: {
        snapshots: tcgCount || 0,
        lastFetch: tcgSnapshotsRes.data?.[0]?.fetched_at 
          ? new Date(tcgSnapshotsRes.data[0].fetched_at) 
          : null,
      },
      cardmarket: {
        snapshots: cmCount || 0,
        lastFetch: cmSnapshotsRes.data?.[0]?.fetched_at 
          ? new Date(cmSnapshotsRes.data[0].fetched_at) 
          : null,
      },
    },
  };
}

/**
 * Get recent fetch jobs for monitoring
 */
export async function getRecentFetchJobs(limit: number = 20): Promise<FetchJob[]> {
  const { data, error } = await hosteddb
    .from('fetch_jobs')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Trigger a manual scrape (placeholder - requires edge function)
 */
export async function triggerManualScrape(market: Market): Promise<void> {
  // This would call an edge function to initiate scraping
  console.log(`Manual scrape triggered for ${market}`);
  // TODO: Implement edge function call
  throw new Error('Manual scraping not yet implemented. See documentation for setup.');
}

// --- Scrape job API (Run Scrape flow) ---

export type ScrapeMode = 'hot' | 'warm' | 'cold';

/**
 * Start a scrape job. Enqueues work; does not run the scraper.
 * Run the worker script to process: npm run scrape-worker
 * Worker runs scrape-top-proxy logic: Top 99 from Cardmarket + TCGPlayer.
 */
export async function startScrapeJob(mode: ScrapeMode): Promise<{ jobId: string }> {
  const { data, error } = await hosteddb.rpc('start_scrape_job', {
    p_mode: mode,
    p_markets: ['TCGPlayer', 'Cardmarket'],
  });

  if (error) {
    console.error('Error starting scrape job:', error);
    throw error;
  }

  return { jobId: data as string };
}

export interface ScrapeJobStatusResponse {
  job: ScrapeJob;
  recentFailures: ScrapeJobItem[];
}

/**
 * Get the currently active scrape job (queued or running)
 */
export async function getActiveScrapeJob(): Promise<ScrapeJob | null> {
  const { data, error } = await hosteddb
    .from('scrape_jobs')
    .select('*')
    .in('status', ['queued', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    markets: Array.isArray(data.markets) ? data.markets : [],
  } as ScrapeJob;
}

/**
 * Cancel a running or queued scrape job.
 * Worker checks this between items and will stop processing.
 */
export async function cancelScrapeJob(jobId: string): Promise<void> {
  const { error } = await hosteddb
    .from('scrape_jobs')
    .update({
      status: 'cancelled',
      last_log: 'Cancelled by user',
      finished_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', ['queued', 'running']);

  if (error) {
    console.error('Error cancelling scrape job:', error);
    throw error;
  }
}

/**
 * Get scrape job status for progress modal
 */
export async function getScrapeJobStatus(jobId: string): Promise<ScrapeJobStatusResponse | null> {
  const { data: job, error: jobError } = await hosteddb
    .from('scrape_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return null;
  }

  const { data: failures } = await hosteddb
    .from('scrape_job_items')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'failed')
    .order('finished_at', { ascending: false })
    .limit(5);

  return {
    job: {
      ...job,
      markets: Array.isArray(job.markets) ? job.markets : [],
    } as ScrapeJob,
    recentFailures: (failures || []) as ScrapeJobItem[],
  };
}

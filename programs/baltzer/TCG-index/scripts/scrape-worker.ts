/**
 * Scrape Worker - processes queued scrape jobs
 *
 * Uses the same logic as scrape-top-proxy: unified-scraper with click-through
 * flow for Cardmarket + TCGPlayer. Requires PROXY_ENDPOINT for reliable runs.
 *
 * Run: npm run scrape-worker
 * Loads HOSTED_DB_URL, HOSTED_DB_SERVICE_ROLE_KEY, PROXY_ENDPOINT from .env
 * DRY_RUN=1 - Mark job complete without scraping (for testing the flow)
 */

import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';

// Load .env from project root (cwd when run via npm run)
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { createClient, Hosted DBClient } from '@hosteddb/hosteddb-js';

const POLL_INTERVAL_MS = 10000;
const CANCELLATION_CHECK_MS = 30000; // Check if job cancelled every 30s

const hosteddbUrl = (process.env.HOSTED_DB_URL ?? 'https://yfxmbzgkuejiazkudtsf.hosteddb.co').trim();
const hosteddbKey = (process.env.HOSTED_DB_SERVICE_ROLE_KEY ?? process.env.HOSTED_DB_PUBLISHABLE_KEY ?? '').trim();
const dryRun = process.env.DRY_RUN === '1';

if (!hosteddbKey) {
  console.error('Set HOSTED_DB_SERVICE_ROLE_KEY or HOSTED_DB_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const hosteddb: Hosted DBClient = createClient(hosteddbUrl, hosteddbKey);

// Uses scrape-top-proxy-skip (--skip-remaining) so TCG failures don't block completion

async function updateJobLog(jobId: string, log: string) {
  await hosteddb
    .from('scrape_jobs')
    .update({ last_log: log })
    .eq('id', jobId);
}

async function isJobCancelled(jobId: string): Promise<boolean> {
  const { data } = await hosteddb
    .from('scrape_jobs')
    .select('status')
    .eq('id', jobId)
    .single();
  return data?.status === 'cancelled';
}

async function processJob(jobId: string) {
  const { data: job } = await hosteddb
    .from('scrape_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job || job.status !== 'queued') return;

  await hosteddb.from('scrape_jobs').update({ status: 'running' }).eq('id', jobId);
  await updateJobLog(jobId, 'Running Top 99 scrape (Cardmarket + TCGPlayer)...');

  // Mark existing items as skipped - we run full Top 99, not per-item
  await hosteddb
    .from('scrape_job_items')
    .update({
      status: 'skipped',
      error: 'Replaced by full Top 99 scrape',
      finished_at: new Date().toISOString(),
    })
    .eq('job_id', jobId)
    .in('status', ['queued', 'running']);

  await hosteddb
    .from('scrape_jobs')
    .update({ progress_total: 99, progress_done: 0 })
    .eq('id', jobId);

  if (dryRun) {
    await updateJobLog(jobId, 'DRY_RUN: Skipped actual scrape');
    await hosteddb.rpc('compute_arbitrage_opportunities');
    await hosteddb
      .from('scrape_jobs')
      .update({
        status: 'completed',
        progress_done: 99,
        finished_at: new Date().toISOString(),
        last_log: 'Job completed (dry run)',
      })
      .eq('id', jobId);
    console.log(`Job ${jobId} completed (dry run).`);
    return;
  }

  return new Promise<void>((resolve) => {
    const env = {
      ...process.env,
      CONSERVATIVE: '1',
    };

    const child = spawn('npm', ['run', 'scrape-top-proxy-skip'], {
      env,
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true, // Same as terminal - uses shell to run npm script
    });

    let cancellationCheckInterval: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (cancellationCheckInterval) {
        clearInterval(cancellationCheckInterval);
      }
    };

    child.stdout?.on('data', (data: Buffer) => {
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
    });

    cancellationCheckInterval = setInterval(async () => {
      if (await isJobCancelled(jobId)) {
        child.kill('SIGTERM');
        cleanup();
      }
    }, CANCELLATION_CHECK_MS);

    child.on('close', async (code, signal) => {
      cleanup();

      if (await isJobCancelled(jobId)) {
        await updateJobLog(jobId, 'Cancelled by user');
        await hosteddb
          .from('scrape_jobs')
          .update({
            status: 'cancelled',
            finished_at: new Date().toISOString(),
          })
          .eq('id', jobId);
        console.log(`Job ${jobId} cancelled.`);
      } else if (code === 0) {
        await updateJobLog(jobId, 'Computing arbitrage opportunities...');
        await hosteddb.rpc('compute_arbitrage_opportunities');
        await hosteddb
          .from('scrape_jobs')
          .update({
            status: 'completed',
            progress_done: 99,
            finished_at: new Date().toISOString(),
            last_log: 'Job completed',
          })
          .eq('id', jobId);
        console.log(`Job ${jobId} completed.`);
      } else {
        const errMsg = signal ? `Killed (${signal})` : `Exit code ${code}`;
        await hosteddb
          .from('scrape_jobs')
          .update({
            status: 'failed',
            error: errMsg,
            finished_at: new Date().toISOString(),
            last_log: `Scrape failed: ${errMsg}`,
          })
          .eq('id', jobId);
        console.error(`Job ${jobId} failed: ${errMsg}`);
      }
      resolve();
    });

    child.on('error', async (err) => {
      cleanup();
      await hosteddb
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error: err.message,
          finished_at: new Date().toISOString(),
          last_log: `Scrape error: ${err.message}`,
        })
        .eq('id', jobId);
      console.error(`Job ${jobId} error:`, err);
      resolve();
    });
  });
}

async function poll() {
  const { data: jobs } = await hosteddb
    .from('scrape_jobs')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1);

  if (jobs?.length) {
    console.log(`Processing job ${jobs[0].id}`);
    await processJob(jobs[0].id);
  }
}

async function main() {
  console.log('Scrape worker started.');
  console.log('Uses scrape-top-proxy logic: Top 99 (Cardmarket + TCGPlayer) with click-through flow.');
  if (dryRun) console.log('DRY_RUN=1: Jobs will complete without scraping.');
  if (!process.env.PROXY_ENDPOINT) {
    console.warn('⚠ PROXY_ENDPOINT not set. Cardmarket will likely block after ~5 requests.');
  }
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s.\n`);

  for (;;) {
    try {
      await poll();
    } catch (e) {
      console.error('Poll error:', e);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main();

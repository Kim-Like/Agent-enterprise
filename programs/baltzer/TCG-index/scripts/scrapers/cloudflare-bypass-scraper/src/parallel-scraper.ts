/**
 * Parallel Scraper with Work Queue
 * 
 * Distributes scraping across multiple workers with:
 * - Automatic retry with exponential backoff
 * - Progress tracking and resumption
 * - Rate limiting per worker
 */

import { Page } from 'patchright';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserManager, isCloudflareBlocked, waitForChallengeResolve } from './browser-manager';
import { ScraperConfig } from './scraper-config';
import { randomDelay, simulateReading, humanScroll, warmUpSession, warmUpToUrl } from './human-behavior';

const CHECKPOINT_DIR = '.scraper-checkpoints';

export interface ScrapeTask<T = any> {
  id: string;
  data: T;
  retries: number;
  lastError?: string;
}

export interface ScrapeResult<T = any, R = any> {
  task: ScrapeTask<T>;
  success: boolean;
  result?: R;
  error?: string;
}

export interface WorkerStats {
  workerId: string;
  completed: number;
  failed: number;
  cloudflareBlocks: number;
}

type ScrapeFn<T, R> = (page: Page, taskData: T) => Promise<R>;

export class ParallelScraper<T = any, R = any> {
  private config: ScraperConfig;
  private browserManager: BrowserManager;
  private tasks: ScrapeTask<T>[] = [];
  private completed: ScrapeResult<T, R>[] = [];
  private failed: ScrapeResult<T, R>[] = [];
  private inProgress: Set<string> = new Set();
  private workerStats: Map<string, WorkerStats> = new Map();
  private checkpointFile: string;
  private scrapeFn: ScrapeFn<T, R>;
  private domain: string;
  private warmupUrl?: string;
  private isRunning = false;
  private skipRemaining = false; // When true: no retries, skip on first failure

  constructor(
    config: ScraperConfig,
    scrapeFn: ScrapeFn<T, R>,
    domain: string,
    checkpointName: string = 'default',
    warmupUrl?: string,
    options?: { skipRemaining?: boolean }
  ) {
    this.config = config;
    this.browserManager = new BrowserManager(config);
    this.scrapeFn = scrapeFn;
    this.domain = domain;
    this.warmupUrl = warmupUrl;
    this.skipRemaining = options?.skipRemaining ?? false;

    if (!fs.existsSync(CHECKPOINT_DIR)) {
      fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
    }
    this.checkpointFile = path.join(CHECKPOINT_DIR, `${checkpointName}-checkpoint.json`);
  }

  /**
   * Add tasks to the queue
   */
  addTasks(tasks: T[], idFn: (t: T) => string): void {
    for (const task of tasks) {
      this.tasks.push({
        id: idFn(task),
        data: task,
        retries: 0,
      });
    }
  }

  /**
   * Load checkpoint and filter already-completed tasks
   */
  loadCheckpoint(): { loaded: boolean; completedCount: number } {
    if (!fs.existsSync(this.checkpointFile)) {
      return { loaded: false, completedCount: 0 };
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.checkpointFile, 'utf-8'));
      const completedIds = new Set(data.completedIds || []);
      
      // Filter out already completed tasks
      const originalCount = this.tasks.length;
      this.tasks = this.tasks.filter(t => !completedIds.has(t.id));
      
      // Restore completed results
      this.completed = data.completed || [];
      
      const skipped = originalCount - this.tasks.length;
      console.log(`✓ Checkpoint loaded: ${skipped} tasks already complete, ${this.tasks.length} remaining`);
      
      return { loaded: true, completedCount: skipped };
    } catch (e) {
      console.log('⚠ Could not load checkpoint, starting fresh');
      return { loaded: false, completedCount: 0 };
    }
  }

  /**
   * Save checkpoint
   */
  private saveCheckpoint(): void {
    const completedIds = this.completed.map(r => r.task.id);
    fs.writeFileSync(this.checkpointFile, JSON.stringify({
      completedIds,
      completed: this.completed,
      timestamp: new Date().toISOString(),
    }, null, 2));
  }

  /**
   * Clear checkpoint (start fresh)
   */
  clearCheckpoint(): void {
    if (fs.existsSync(this.checkpointFile)) {
      fs.unlinkSync(this.checkpointFile);
      console.log('✓ Checkpoint cleared');
    }
  }

  /**
   * Get next task from queue
   */
  private getNextTask(): ScrapeTask<T> | null {
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      if (!this.inProgress.has(task.id)) {
        return task;
      }
    }
    return null;
  }

  /**
   * Remove task from queue
   */
  private removeTask(taskId: string): void {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
    }
    this.inProgress.delete(taskId);
  }

  /**
   * Re-queue task for retry
   */
  private requeueTask(task: ScrapeTask<T>): void {
    task.retries++;
    this.inProgress.delete(task.id);
    // Move to end of queue
    const idx = this.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      this.tasks.push(task);
    }
  }

  /**
   * Worker loop
   */
  private async runWorker(workerId: string): Promise<void> {
    const stats: WorkerStats = {
      workerId,
      completed: 0,
      failed: 0,
      cloudflareBlocks: 0,
    };
    this.workerStats.set(workerId, stats);

    let page = await this.browserManager.getPage(workerId);
    let needsWarmup = true;

    while (this.isRunning) {
      const task = this.getNextTask();
      if (!task) {
        // No more tasks
        break;
      }

      this.inProgress.add(task.id);

      // Warm up session on first request or after Cloudflare block
      if (needsWarmup) {
        try {
          if (this.warmupUrl) {
            await warmUpToUrl(page, this.warmupUrl);
          } else {
            await warmUpSession(page, this.domain);
          }
          needsWarmup = false;
        } catch (e) {
          console.log(`⚠ Worker ${workerId}: Warmup failed, will retry`);
        }
      }

      try {
        // Random delay before request
        await randomDelay(this.config.minDelayBetweenRequests, this.config.maxDelayBetweenRequests);

        // Execute scrape function
        const result = await this.scrapeFn(page, task.data);

        // Check for Cloudflare blocks (challenge or rate limit)
        const blockStatus = await isCloudflareBlocked(page);

        if (blockStatus.blocked) {
          stats.cloudflareBlocks++;

          if (blockStatus.type === 'ratelimit') {
            // Rate limited (Error 1015) - long cooldown + new IP
            console.log(`🚫 Worker ${workerId}: Rate limited! Rotating browser for new IP...`);
            await this.browserManager.forceRotateWorker(workerId);
            needsWarmup = true;

            const rateLimitDelay = 180000 + Math.random() * 120000; // 3-5 minutes
            console.log(`  ⏳ Cooldown ${Math.round(rateLimitDelay / 1000)}s before retry...`);
            await new Promise(r => setTimeout(r, rateLimitDelay));

            page = await this.browserManager.getPage(workerId);
            throw new Error('Rate limited - retrying with new IP');
          } else {
            // Regular Cloudflare challenge - wait for it to resolve
            console.log(`⚠ Worker ${workerId}: Cloudflare challenge detected, waiting...`);

            const resolved = await waitForChallengeResolve(page, 60000);
            if (!resolved) {
              throw new Error('Cloudflare challenge timeout');
            }

            // Re-execute after challenge resolved
            const retryResult = await this.scrapeFn(page, task.data);

            this.completed.push({ task, success: true, result: retryResult });
            this.removeTask(task.id);
            stats.completed++;
            const rr = retryResult as { lowest_price?: number };
            const cardName = (task.data as { card_name?: string })?.card_name ?? task.id;
            const price = rr?.lowest_price != null ? `$${(rr.lowest_price / 100).toFixed(2)}` : '—';
            console.log(`✓ ${workerId}: ${cardName}: ${price}`);
          }
        } else {
          this.completed.push({ task, success: true, result });
          this.removeTask(task.id);
          stats.completed++;
          // Log success with price for visibility (TCGPlayer: lowest_price in cents)
          const r = result as { lowest_price?: number; task?: { data?: { card_name?: string } } };
          const cardName = (task.data as { card_name?: string })?.card_name ?? task.id;
          const price = r?.lowest_price != null ? `$${(r.lowest_price / 100).toFixed(2)}` : '—';
          console.log(`✓ ${workerId}: ${cardName}: ${price}`);
        }

        // Increment request count for rotation tracking
        this.browserManager.incrementRequestCount(workerId);

        // Maybe get a fresh page (with new fingerprint if rotating)
        page = await this.browserManager.getPage(workerId);

        // Proactive breather every 5 successes to avoid rate limits
        if (stats.completed > 0 && stats.completed % 5 === 0) {
          const breatherMs = 90000 + Math.random() * 60000; // 1.5-2.5 min
          console.log(`  ⏸ Breather: ${Math.round(breatherMs / 1000)}s pause after ${stats.completed} cards`);
          await new Promise(r => setTimeout(r, breatherMs));
        }

        // Simulate human behavior occasionally
        if (this.config.simulateHumanBehavior && Math.random() > 0.7) {
          await simulateReading(page, 500, 1500);
          if (Math.random() > 0.5) {
            await humanScroll(page);
          }
        }

      } catch (error: any) {
        const errorMsg = error.message || String(error);
        task.lastError = errorMsg;

        // Check if it's a rate limit or Cloudflare block
        const isRateLimit = errorMsg.includes('1015') || errorMsg.includes('Rate limit') || errorMsg.includes('rate limited');
        const isCloudflare = errorMsg.includes('Cloudflare') || errorMsg.includes('403') || errorMsg.includes('challenge');

        if (isRateLimit) {
          stats.cloudflareBlocks++;
          console.log(`🚫 Worker ${workerId}: Rate limit in error. Cooldown 3-5 min + new IP...`);
          await this.browserManager.forceRotateWorker(workerId);
          needsWarmup = true;

          const rateLimitDelay = 180000 + Math.random() * 120000; // 3-5 minutes
          await new Promise(r => setTimeout(r, rateLimitDelay));
          page = await this.browserManager.getPage(workerId);
        } else if (isCloudflare) {
          stats.cloudflareBlocks++;
          needsWarmup = true;
          // Get fresh page with new fingerprint and IP
          await this.browserManager.forceRotateWorker(workerId);
          page = await this.browserManager.getPage(workerId);
        }

        const effectiveMaxRetries = this.skipRemaining ? 0 : this.config.maxRetries;
        if (task.retries < effectiveMaxRetries) {
          console.log(`⚠ Worker ${workerId}: Task ${task.id} failed (attempt ${task.retries + 1}/${effectiveMaxRetries}): ${errorMsg}`);
          this.requeueTask(task);
          await randomDelay(this.config.retryDelayMs, this.config.retryDelayMs * 2);
        } else {
          console.log(`✗ Worker ${workerId}: Task ${task.id} skipped: ${errorMsg}`);
          this.failed.push({ task, success: false, error: errorMsg });
          this.removeTask(task.id);
          stats.failed++;
        }
      }

      // Save checkpoint after every success (conservative: don't lose progress)
      this.saveCheckpoint();
    }
  }

  /**
   * Run all workers
   */
  async run(): Promise<{ completed: ScrapeResult<T, R>[]; failed: ScrapeResult<T, R>[] }> {
    console.log(`\n🚀 Starting parallel scraper with ${this.config.parallelWorkers} workers`);
    console.log(`📋 ${this.tasks.length} tasks in queue\n`);

    this.isRunning = true;
    await this.browserManager.launch();

    const startTime = Date.now();
    const workers: Promise<void>[] = [];

    for (let i = 0; i < this.config.parallelWorkers; i++) {
      workers.push(this.runWorker(`worker-${i}`));
    }

    // Progress logging
    const progressInterval = setInterval(() => {
      const total = this.completed.length + this.failed.length + this.tasks.length;
      const done = this.completed.length + this.failed.length;
      const pct = ((done / total) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const rate = (done / (Date.now() - startTime) * 1000 * 60).toFixed(1);
      
      console.log(`📊 Progress: ${done}/${total} (${pct}%) | ${elapsed} min elapsed | ${rate} tasks/min`);
    }, 30000);

    await Promise.all(workers);
    clearInterval(progressInterval);

    this.isRunning = false;
    this.saveCheckpoint();
    await this.browserManager.close();

    // Final stats
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✅ Scraping complete in ${elapsed} minutes`);
    console.log(`   Completed: ${this.completed.length}`);
    console.log(`   Failed: ${this.failed.length}`);
    
    for (const [workerId, stats] of this.workerStats) {
      console.log(`   ${workerId}: ${stats.completed} done, ${stats.failed} failed, ${stats.cloudflareBlocks} CF blocks`);
    }

    return { completed: this.completed, failed: this.failed };
  }

  /**
   * Stop all workers gracefully
   */
  stop(): void {
    this.isRunning = false;
  }
}

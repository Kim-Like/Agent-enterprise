/**
 * Human Behavior Simulation
 * 
 * Makes browser interactions look more natural to avoid detection.
 */

import { Page } from 'patchright';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Simulate natural mouse movement with bezier curves
 */
export async function humanMouseMove(page: Page, toX: number, toY: number): Promise<void> {
  const steps = randomBetween(20, 40);
  
  // Get current position or start from random edge
  const viewport = page.viewportSize() || { width: 1920, height: 1080 };
  const startX = randomBetween(0, viewport.width);
  const startY = randomBetween(0, viewport.height);
  
  // Control points for bezier curve (creates natural arc)
  const cp1x = startX + (toX - startX) * randomFloat(0.2, 0.4) + randomBetween(-50, 50);
  const cp1y = startY + (toY - startY) * randomFloat(0.2, 0.4) + randomBetween(-50, 50);
  const cp2x = startX + (toX - startX) * randomFloat(0.6, 0.8) + randomBetween(-30, 30);
  const cp2y = startY + (toY - startY) * randomFloat(0.6, 0.8) + randomBetween(-30, 30);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    // Cubic bezier formula
    const x = Math.pow(1-t, 3) * startX 
            + 3 * Math.pow(1-t, 2) * t * cp1x 
            + 3 * (1-t) * Math.pow(t, 2) * cp2x 
            + Math.pow(t, 3) * toX;
    
    const y = Math.pow(1-t, 3) * startY 
            + 3 * Math.pow(1-t, 2) * t * cp1y 
            + 3 * (1-t) * Math.pow(t, 2) * cp2y 
            + Math.pow(t, 3) * toY;
    
    await page.mouse.move(x, y);
    
    // Variable delay between moves (faster in middle, slower at start/end)
    const speedFactor = 1 - Math.abs(0.5 - t) * 2; // 0 at edges, 1 in middle
    const delay = randomBetween(5, 15) * (1 + speedFactor);
    await sleep(delay);
  }
}

/**
 * Simulate natural scrolling
 */
export async function humanScroll(page: Page, direction: 'down' | 'up' = 'down'): Promise<void> {
  const scrolls = randomBetween(2, 5);
  
  for (let i = 0; i < scrolls; i++) {
    const delta = randomBetween(100, 400) * (direction === 'down' ? 1 : -1);
    
    await page.mouse.wheel(0, delta);
    await sleep(randomBetween(100, 300));
  }
}

/**
 * Simulate reading time based on content length
 */
export async function simulateReading(page: Page, minMs: number = 1000, maxMs: number = 3000): Promise<void> {
  // Occasionally scroll while "reading"
  if (Math.random() > 0.6) {
    await humanScroll(page, 'down');
  }
  
  await sleep(randomBetween(minMs, maxMs));
}

/**
 * Human-like click on element (by selector)
 */
export async function humanClick(page: Page, selector: string): Promise<void> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Element has no bounding box: ${selector}`);
  }
  await humanClickBox(page, box);
}

/**
 * Human-like click on element located by Locator (e.g. .nth(index))
 */
export async function humanClickLocator(page: Page, locator: { boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null> }): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Element has no bounding box');
  }
  await humanClickBox(page, box);
}

async function humanClickBox(page: Page, box: { x: number; y: number; width: number; height: number }): Promise<void> {
  const targetX = box.x + box.width * randomFloat(0.3, 0.7);
  const targetY = box.y + box.height * randomFloat(0.3, 0.7);
  await humanMouseMove(page, targetX, targetY);
  await sleep(randomBetween(50, 150));
  await page.mouse.click(
    targetX + randomBetween(-2, 2),
    targetY + randomBetween(-2, 2)
  );
}

/**
 * Human-like typing
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await humanClick(page, selector);
  await sleep(randomBetween(200, 400));
  
  for (const char of text) {
    await page.keyboard.type(char, { delay: randomBetween(50, 150) });
    
    // Occasional longer pause (like thinking)
    if (Math.random() > 0.9) {
      await sleep(randomBetween(200, 500));
    }
  }
}

/**
 * Random delay between requests
 */
export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = randomBetween(minMs, maxMs);
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Pre-request warm-up (makes the session look more natural)
 */
export async function warmUpSession(page: Page, targetDomain: string): Promise<void> {
  console.log(`  Warming up session for ${targetDomain}...`);
  await page.goto(`https://${targetDomain}`, { waitUntil: 'domcontentloaded' });
  await simulateReading(page, 2000, 4000);
  await humanScroll(page, 'down');
  await simulateReading(page, 1000, 2000);
  if (Math.random() > 0.5) {
    await humanScroll(page, 'up');
    await simulateReading(page, 500, 1500);
  }
  console.log(`  ✓ Session warmed up`);
}

/**
 * Warm up by navigating to a specific URL (e.g. Weekly Top Cards for human flow)
 */
export async function warmUpToUrl(page: Page, url: string): Promise<void> {
  console.log(`  Warming up at ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  // Dismiss cookie consent so card links are clickable (no overlay)
  try {
    const btn = page.getByRole('button', { name: /accept|akzeptieren/i }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch { /* no banner */ }
  await simulateReading(page, 2000, 4000);
  await humanScroll(page, 'down');
  await simulateReading(page, 1000, 2000);
  console.log(`  ✓ Session warmed up`);
}

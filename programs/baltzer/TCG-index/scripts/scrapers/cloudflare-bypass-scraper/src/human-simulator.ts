/**
 * Human Simulator - Click-through strategies for Cardmarket
 *
 * Multiple strategies to navigate via clicks (avoid direct URL = rate limits).
 * Strategy order: evaluate click -> mouse coords click -> locator force click
 */

import { Page, Locator } from 'patchright';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Move mouse in steps to target (human-like) */
async function moveToCoords(page: Page, targetX: number, targetY: number): Promise<void> {
  const viewport = page.viewportSize() || { width: 1920, height: 1080 };
  const startX = viewport.width / 2;
  const startY = viewport.height / 2;
  const steps = randomBetween(15, 25);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = 1 - Math.pow(1 - t, 2);
    const x = startX + (targetX - startX) * eased;
    const y = startY + (targetY - startY) * eased;
    await page.mouse.move(x, y);
    await sleep(randomBetween(3, 12));
  }
}

/**
 * Strategy 1: Click via page.evaluate - bypasses Playwright visibility checks.
 * Uses element.click() to trigger navigation (native DOM behavior).
 */
export async function clickViaEvaluate(page: Page, selector: string, index: number): Promise<boolean> {
  return page.evaluate(
    ({ sel, idx }) => {
      const els = document.querySelectorAll<HTMLAnchorElement>(sel);
      const el = els[idx];
      if (!el || el.tagName !== 'A') return false;
      el.click();
      return true;
    },
    { sel: selector, idx: index }
  );
}

/**
 * Strategy 2: Get element center and use page.mouse.click - simulates real user click.
 */
export async function clickViaMouseCoords(page: Page, selector: string, index: number): Promise<boolean> {
  const coords = await page.evaluate(
    ({ sel, idx }) => {
      const els = document.querySelectorAll<HTMLAnchorElement>(sel);
      const el = els[idx];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 10,
        y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 10,
      };
    },
    { sel: selector, idx: index }
  );
  if (!coords) return false;
  await moveToCoords(page, coords.x, coords.y);
  await sleep(randomBetween(80, 200));
  await page.mouse.click(coords.x, coords.y);
  return true;
}

/**
 * Strategy 3: Playwright locator click with force (ignores visibility).
 */
export async function clickViaLocatorForce(locator: Locator): Promise<void> {
  await locator.click({ force: true, timeout: 5000 });
}

/**
 * Remove/hide overlays (cookie consent) that block clicks.
 */
export async function removeBlockingOverlays(page: Page): Promise<void> {
  await page.evaluate(() => {
    const selectors = [
      '[id*="cookie"]',
      '.cookie-consent',
      '[class*="cookie-banner"]',
      '[aria-label*="cookie" i]',
      '.gdpr-banner',
      '[class*="consent"]',
    ];
    selectors.forEach((sel) => {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      } catch {}
    });
  });
}

/**
 * Human-like click with fallback strategies.
 * Tries: evaluate -> mouse coords -> locator force.
 */
export async function humanClickLink(
  page: Page,
  selector: string,
  index: number,
  locator?: Locator
): Promise<boolean> {
  await removeBlockingOverlays(page);
  await sleep(300);

  if (await clickViaEvaluate(page, selector, index)) return true;
  await sleep(200);
  if (await clickViaMouseCoords(page, selector, index)) return true;
  if (locator) {
    try {
      await clickViaLocatorForce(locator);
      return true;
    } catch {}
  }
  return false;
}

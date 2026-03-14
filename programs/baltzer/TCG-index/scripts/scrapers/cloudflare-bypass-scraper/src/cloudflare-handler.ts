/**
 * Cloudflare Handler
 *
 * Detects and handles Cloudflare challenges during navigation.
 * Used for initial page load; click-through flow avoids direct URL navigation.
 */

import { Page } from 'patchright';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class CloudflareHandler {
  constructor(private page: Page) {}

  async isCloudflareChallenge(): Promise<boolean> {
    const content = await this.page.content();
    const indicators = [
      'Checking your browser',
      'Just a moment',
      'Verify you are human',
      'challenges.cloudflare.com',
      'cf-turnstile',
      'Attention Required',
    ];
    return indicators.some((s) => content.includes(s));
  }

  async waitForChallengeCompletion(timeoutMs = 90000): Promise<boolean> {
    console.log('⏳ Cloudflare challenge detected, waiting for resolution...');
    console.log('   (If Turnstile appears, solve it manually in the browser)');

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const stillChallenging = await this.isCloudflareChallenge();
      if (!stillChallenging) {
        const hasContent = await this.page.$('.page-title, .table, a.galleryBox, [class*="card"]');
        if (hasContent) {
          console.log('✓ Cloudflare challenge passed');
          return true;
        }
      }

      const turnstileFrame = await this.page.$('iframe[src*="challenges.cloudflare.com"]');
      if (turnstileFrame) {
        try {
          const frame = await turnstileFrame.contentFrame();
          if (frame) {
            const checkbox = await frame.$('input[type="checkbox"], .cb-c');
            if (checkbox) {
              await sleep(500 + Math.random() * 500);
              await checkbox.click();
            }
          }
        } catch {
          /* iframe interaction can fail */
        }
      }

      await sleep(2000);
    }

    console.log('✗ Cloudflare challenge timeout');
    return false;
  }

  async navigateWithProtection(url: string): Promise<boolean> {
    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      if (await this.isCloudflareChallenge()) {
        const passed = await this.waitForChallengeCompletion();
        if (!passed) return false;
      }

      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await sleep(1000 + Math.random() * 1000);
      return true;
    } catch (err) {
      console.error(`Navigation error: ${err}`);
      return false;
    }
  }
}

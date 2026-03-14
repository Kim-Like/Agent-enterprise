/**
 * Browser Manager
 * 
 * Handles browser instances with:
 * - Residential proxy rotation
 * - Fingerprint randomization
 * - Session persistence
 * - Cloudflare challenge detection
 */

import { chromium, Browser, BrowserContext, Page } from 'patchright';
import { ScraperConfig } from './scraper-config';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_DIR = '.scraper-sessions';
const FINGERPRINTS_FILE = path.join(STORAGE_DIR, 'fingerprints.json');

// Common screen resolutions weighted by popularity
const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080, weight: 40 },
  { width: 1366, height: 768, weight: 20 },
  { width: 1536, height: 864, weight: 15 },
  { width: 1440, height: 900, weight: 10 },
  { width: 1280, height: 720, weight: 8 },
  { width: 2560, height: 1440, weight: 5 },
  { width: 1680, height: 1050, weight: 2 },
];

// Common user agents (Chrome on Windows/Mac)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Los_Angeles',
  'America/Denver',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
];

const LOCALES = ['en-US', 'en-GB', 'de-DE', 'fr-FR'];

interface Fingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  timezone: string;
  locale: string;
  colorScheme: 'light' | 'dark';
  deviceScaleFactor: number;
}

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Inject session ID into Bright Data proxy URL for IP rotation
 * Transforms: http://user:pass@host:port
 * Into: http://user-session-XXXXX:pass@host:port
 *
 * Bright Data session format:
 * - session-{id} = sticky session (same IP for that session ID)
 * - Different session IDs = different IPs
 */
function injectSessionId(proxyEndpoint: string, sessionId: string): string {
  try {
    const url = new URL(proxyEndpoint);
    const username = decodeURIComponent(url.username);

    let newUsername: string;

    // Check if session already exists in username
    if (username.includes('-session-')) {
      // Replace existing session
      newUsername = username.replace(/-session-[^-]+$/, `-session-${sessionId}`);
    } else {
      // Add session to username (Bright Data format)
      newUsername = `${username}-session-${sessionId}`;
    }

    url.username = encodeURIComponent(newUsername);
    return url.toString();
  } catch (e) {
    console.error('Failed to inject session ID:', e);
    return proxyEndpoint;
  }
}

export function generateFingerprint(): Fingerprint {
  const resolution = weightedRandom(SCREEN_RESOLUTIONS);
  return {
    userAgent: randomFrom(USER_AGENTS),
    viewport: { width: resolution.width, height: resolution.height },
    timezone: randomFrom(TIMEZONES),
    locale: randomFrom(LOCALES),
    colorScheme: Math.random() > 0.3 ? 'light' : 'dark',
    deviceScaleFactor: Math.random() > 0.7 ? 2 : 1,
  };
}

export class BrowserManager {
  private config: ScraperConfig;
  private browsers: Map<string, Browser> = new Map(); // Separate browser per worker for IP isolation
  private contexts: Map<string, BrowserContext> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private sessionCounter = 0;

  constructor(config: ScraperConfig) {
    this.config = config;
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Generate unique session ID for proxy rotation
   */
  private generateSessionId(): string {
    this.sessionCounter++;
    return `${Date.now()}-${this.sessionCounter}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Get proxy config. Bright Data: use basic username (no -session-) for IP rotation.
   * Each new browser connection gets a random IP from the pool.
   */
  private getProxyConfig(workerId: string): { server: string; username: string; password: string } | null {
    if (!this.config.proxy.enabled || !this.config.proxy.endpoint) {
      return null;
    }

    let endpoint = this.config.proxy.endpoint;

    // Optional: add -country-de for EU/German IPs (Cardmarket)
    if (process.env.PROXY_COUNTRY && !endpoint.includes('-country-')) {
      const url = new URL(endpoint);
      const user = decodeURIComponent(url.username);
      url.username = encodeURIComponent(`${user}-country-${process.env.PROXY_COUNTRY}`);
      endpoint = url.toString();
    }

    // Do NOT inject -session- : Bright Data rotates IP per connection when username has no session
    if (this.config.proxy.enableSessionRotation) {
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      endpoint = injectSessionId(endpoint, sessionId);
    }

    const proxyUrl = new URL(endpoint);
    const username = decodeURIComponent(proxyUrl.username);

    return {
      server: `${proxyUrl.protocol}//${proxyUrl.host}`,
      username,
      password: decodeURIComponent(proxyUrl.password),
    };
  }

  async launch(): Promise<void> {
    console.log('✓ Browser manager initialized');
    if (this.config.proxy.enabled) {
      console.log(`  Proxy: ${this.config.proxy.endpoint.replace(/:[^:@]+@/, ':***@')}`);
      console.log(`  IP rotation: basic username (no -session-) per Bright Data guidelines`);
    }
  }

  /**
   * Launch a dedicated browser for a worker (enables different proxy sessions)
   */
  async launchWorkerBrowser(workerId: string): Promise<Browser> {
    const launchOptions: any = {
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
      ],
    };

    // Add proxy with session rotation
    const proxyConfig = this.getProxyConfig(workerId);
    if (proxyConfig) {
      launchOptions.proxy = proxyConfig;
    }

    const browser = await chromium.launch(launchOptions);
    this.browsers.set(workerId, browser);
    return browser;
  }

  async createContext(workerId: string): Promise<BrowserContext> {
    // Get or create worker-specific browser
    let browser = this.browsers.get(workerId);
    if (!browser) {
      browser = await this.launchWorkerBrowser(workerId);
    }

    const fingerprint = this.config.rotateFingerprint
      ? generateFingerprint()
      : {
          userAgent: USER_AGENTS[0],
          viewport: { width: 1920, height: 1080 },
          timezone: 'America/New_York',
          locale: 'en-US',
          colorScheme: 'light' as const,
          deviceScaleFactor: 1,
        };

    const storageFile = path.join(STORAGE_DIR, `worker-${workerId}-storage.json`);
    
    const contextOptions: any = {
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      locale: fingerprint.locale,
      timezoneId: fingerprint.timezone,
      colorScheme: fingerprint.colorScheme,
      deviceScaleFactor: fingerprint.deviceScaleFactor,
      permissions: ['geolocation'],
      geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
      ignoreHTTPSErrors: true,
    };

    // Restore session if exists
    if (fs.existsSync(storageFile)) {
      try {
        const storageState = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
        contextOptions.storageState = storageState;
        console.log(`✓ Worker ${workerId}: Restored session`);
      } catch (e) {
        console.log(`⚠ Worker ${workerId}: Could not restore session`);
      }
    }

    const context = await browser.newContext(contextOptions);
    
    // Block trackers and unnecessary resources
    if (this.config.blockTrackers) {
      await context.route('**/*', (route) => {
        const url = route.request().url();
        const resourceType = route.request().resourceType();
        
        // Block tracking/analytics
        const blockedDomains = [
          'google-analytics.com',
          'googletagmanager.com',
          'facebook.net',
          'doubleclick.net',
          'hotjar.com',
          'mixpanel.com',
          'segment.io',
          'amplitude.com',
        ];
        
        if (blockedDomains.some(domain => url.includes(domain))) {
          return route.abort();
        }
        
        // Block heavy resources we don't need
        if (['media', 'font'].includes(resourceType)) {
          return route.abort();
        }
        
        return route.continue();
      });
    }

    // Add stealth scripts
    await context.addInitScript(() => {
      // Override webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Add chrome object
      (window as any).chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {},
      };
      
      // Randomize canvas fingerprint slightly
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      (HTMLCanvasElement.prototype as any).getContext = function(type: string, ...args: any[]) {
        const context = originalGetContext.apply(this, [type, ...args] as any);
        if (context && type === '2d') {
          const ctx = context as CanvasRenderingContext2D;
          const originalGetImageData = ctx.getImageData;
          (ctx as any).getImageData = function(sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings) {
            const imageData = originalGetImageData.call(ctx, sx, sy, sw, sh, settings);
            // Add tiny noise to a few pixels
            for (let i = 0; i < 10; i++) {
              const idx = Math.floor(Math.random() * imageData.data.length);
              imageData.data[idx] = (imageData.data[idx] + Math.floor(Math.random() * 3) - 1) % 256;
            }
            return imageData;
          };
        }
        return context;
      };
    });

    this.contexts.set(workerId, context);
    this.requestCounts.set(workerId, 0);
    
    return context;
  }

  async getPage(workerId: string): Promise<Page> {
    let context = this.contexts.get(workerId);

    // Check if we need to rotate (new fingerprint + new IP via proxy session)
    const requestCount = this.requestCounts.get(workerId) || 0;
    const rotateEvery = this.config.proxy.rotateEveryRequests;

    if (rotateEvery > 0 && requestCount > 0 && requestCount % rotateEvery === 0) {
      console.log(`↻ Worker ${workerId}: Rotating browser + fingerprint after ${requestCount} requests`);

      // Save current session before rotating
      if (context) {
        await this.saveSession(workerId, context);
        await context.close();
        this.contexts.delete(workerId);
      }

      // Close and restart browser to get new proxy session (new IP)
      const browser = this.browsers.get(workerId);
      if (browser) {
        await browser.close();
        this.browsers.delete(workerId);
      }

      // Create new browser + context with fresh fingerprint and new proxy session
      context = await this.createContext(workerId);
    }

    if (!context) {
      context = await this.createContext(workerId);
    }

    const pages = context.pages();
    if (pages.length > 0) {
      return pages[0];
    }

    return await context.newPage();
  }

  incrementRequestCount(workerId: string): void {
    const current = this.requestCounts.get(workerId) || 0;
    this.requestCounts.set(workerId, current + 1);
  }

  async saveSession(workerId: string, context?: BrowserContext): Promise<void> {
    const ctx = context || this.contexts.get(workerId);
    if (!ctx) return;

    const storageFile = path.join(STORAGE_DIR, `worker-${workerId}-storage.json`);
    try {
      const storage = await ctx.storageState();
      fs.writeFileSync(storageFile, JSON.stringify(storage, null, 2));
    } catch (e) {
      // Ignore save errors
    }
  }

  async saveAllSessions(): Promise<void> {
    for (const [workerId, context] of this.contexts) {
      await this.saveSession(workerId, context);
    }
  }

  async close(): Promise<void> {
    await this.saveAllSessions();

    for (const context of this.contexts.values()) {
      try {
        await context.close();
      } catch {
        // Ignore close errors
      }
    }
    this.contexts.clear();

    for (const browser of this.browsers.values()) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
    this.browsers.clear();
  }

  /**
   * Force rotate a worker's browser to get a new IP (use after rate limit)
   */
  async forceRotateWorker(workerId: string): Promise<void> {
    console.log(`⚡ Worker ${workerId}: Force rotating browser for new IP`);

    const context = this.contexts.get(workerId);
    if (context) {
      await this.saveSession(workerId, context);
      try {
        await context.close();
      } catch {}
      this.contexts.delete(workerId);
    }

    const browser = this.browsers.get(workerId);
    if (browser) {
      try {
        await browser.close();
      } catch {}
      this.browsers.delete(workerId);
    }

    // Reset request count
    this.requestCounts.set(workerId, 0);
  }
}

/**
 * Detect if we hit a Cloudflare challenge
 */
export async function isCloudflareChallenge(page: Page): Promise<boolean> {
  try {
    const content = await page.content();
    const indicators = [
      'checking your browser',
      'just a moment',
      'enable javascript',
      'ray id',
      'cloudflare',
      'challenge-running',
      'cf-browser-verification',
      'turnstile',
    ];
    const lowerContent = content.toLowerCase();
    return indicators.some(ind => lowerContent.includes(ind));
  } catch {
    return false;
  }
}

/**
 * Detect if we hit a Cloudflare rate limit (Error 1015)
 */
export async function isRateLimited(page: Page): Promise<boolean> {
  try {
    const content = await page.content();
    const lowerContent = content.toLowerCase();
    const indicators = [
      'error 1015',
      'rate limited',
      'you are being rate limited',
      'too many requests',
      '429',
      'access denied',
      'temporarily blocked',
    ];
    return indicators.some(ind => lowerContent.includes(ind));
  } catch {
    return false;
  }
}

/**
 * Check for any Cloudflare block (challenge or rate limit)
 */
export async function isCloudflareBlocked(page: Page): Promise<{ blocked: boolean; type: 'challenge' | 'ratelimit' | null }> {
  if (await isRateLimited(page)) {
    return { blocked: true, type: 'ratelimit' };
  }
  if (await isCloudflareChallenge(page)) {
    return { blocked: true, type: 'challenge' };
  }
  return { blocked: false, type: null };
}

/**
 * Wait for Cloudflare challenge to resolve
 */
export async function waitForChallengeResolve(page: Page, timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (!(await isCloudflareChallenge(page))) {
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  return false;
}

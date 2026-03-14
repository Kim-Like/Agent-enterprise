/**
 * Scraper Configuration
 * 
 * For residential proxies, recommended providers (in order of reliability):
 * 1. Bright Data (brightdata.com) - Best for Cloudflare, ~$15/GB
 * 2. Oxylabs (oxylabs.io) - Enterprise grade, ~$12/GB  
 * 3. Smartproxy (smartproxy.com) - Good value, ~$8/GB
 * 4. IPRoyal (iproyal.com) - Budget option, ~$5/GB
 * 
 * Free trial options:
 * - Bright Data: 7-day free trial
 * - Smartproxy: 3-day free trial
 * - IPRoyal: Pay-as-you-go, no minimum
 */

export interface ProxyConfig {
  enabled: boolean;
  // Residential proxy endpoint (format: http://user:pass@host:port)
  // Most providers give you a single endpoint that auto-rotates IPs
  endpoint: string;
  // Rotate IP every N requests (0 = every request)
  rotateEveryRequests: number;
  // DO NOT use -session- in username. Bright Data: without session = new IP per connection.
  // Session = sticky IP (same for that session). Set false to follow Bright Data guidelines.
  enableSessionRotation: boolean;
}

export interface ScraperConfig {
  // Proxy settings
  proxy: ProxyConfig;
  
  // Concurrency
  parallelWorkers: number;
  
  // Timing (milliseconds)
  minDelayBetweenRequests: number;
  maxDelayBetweenRequests: number;
  pageLoadTimeout: number;
  
  // Retry logic
  maxRetries: number;
  retryDelayMs: number;
  
  // Anti-detection
  rotateFingerprint: boolean;
  simulateHumanBehavior: boolean;
  blockTrackers: boolean;
  
  // Browser
  headless: boolean;
}

// Parse WORKERS env (e.g. WORKERS=3 for 3 parallel IPs)
function parseWorkers(): number | null {
  const w = process.env.WORKERS;
  if (!w) return null;
  const n = parseInt(w, 10);
  return n >= 1 && n <= 10 ? n : null;
}

// Ultra-conservative config - 1 worker by default, override with WORKERS=3
export const CONSERVATIVE_CONFIG: ScraperConfig = {
  proxy: {
    enabled: true,
    endpoint: process.env.PROXY_ENDPOINT || '',
    rotateEveryRequests: 1, // New IP every request per worker
    enableSessionRotation: false,
  },
  parallelWorkers: parseWorkers() ?? 1, // WORKERS=3 for 3 parallel IPs
  minDelayBetweenRequests: 12000,  // 12-20 sec between requests
  maxDelayBetweenRequests: 20000,
  pageLoadTimeout: 45000,
  maxRetries: 5,
  retryDelayMs: 120000,
  rotateFingerprint: true,
  simulateHumanBehavior: true,
  blockTrackers: true,
  headless: process.env.HEADLESS === 'true',
};

// Production config - moderate settings
export const PRODUCTION_CONFIG: ScraperConfig = {
  proxy: {
    enabled: true,
    endpoint: process.env.PROXY_ENDPOINT || '',
    rotateEveryRequests: 2,
    enableSessionRotation: false,
  },
  parallelWorkers: 2,
  minDelayBetweenRequests: 8000,
  maxDelayBetweenRequests: 15000,
  pageLoadTimeout: 30000,
  maxRetries: 3,
  retryDelayMs: 30000,
  rotateFingerprint: true,
  simulateHumanBehavior: true,
  blockTrackers: true,
  headless: process.env.HEADLESS === 'true',
};

// Development config - no proxy, slower, visible browser
export const DEV_CONFIG: ScraperConfig = {
  proxy: {
    enabled: false,
    endpoint: '',
    rotateEveryRequests: 0,
    enableSessionRotation: false,
  },
  parallelWorkers: 1,
  minDelayBetweenRequests: 15000, // Very slow to avoid blocks without proxy
  maxDelayBetweenRequests: 25000,
  pageLoadTimeout: 60000,
  maxRetries: 2,
  retryDelayMs: 60000, // Wait 1 minute before retry
  rotateFingerprint: true,
  simulateHumanBehavior: true,
  blockTrackers: true,
  headless: false,
};

export function getConfig(): ScraperConfig {
  if (!process.env.PROXY_ENDPOINT) {
    console.log('⚠ No proxy configured - using dev settings');
    return DEV_CONFIG;
  }
  // Use ultra-conservative for Top 99 / rate-limited runs
  if (process.env.CONSERVATIVE === '1' || process.env.RATE_LIMIT_MODE === '1') {
    const workers = CONSERVATIVE_CONFIG.parallelWorkers;
    console.log(`✓ Proxy + CONSERVATIVE (${workers} worker(s), 12-20s delays)`);
    return CONSERVATIVE_CONFIG;
  }
  console.log('✓ Proxy configured - using production settings');
  return PRODUCTION_CONFIG;
}

/**
 * Proxy Test Script
 * 
 * Verifies your proxy is working and can bypass Cloudflare.
 * 
 * Usage:
 *   PROXY_ENDPOINT=http://user:pass@proxy.example.com:port npm run test-proxy
 */

import { chromium } from 'patchright';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const PROXY_ENDPOINT = process.env.PROXY_ENDPOINT;

async function testProxy(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    PROXY & CLOUDFLARE TEST                     ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!PROXY_ENDPOINT) {
    console.log('❌ No PROXY_ENDPOINT set. Add to .env file:');
    console.log('   PROXY_ENDPOINT=http://user:pass@proxy.example.com:port\n');
    console.log('   Recommended providers:');
    console.log('   • Bright Data: https://brightdata.com (~$15/GB, best for CF)');
    console.log('   • Smartproxy: https://smartproxy.com (~$8/GB)');
    console.log('   • IPRoyal: https://iproyal.com (~$5/GB, budget)\n');
    process.exit(1);
  }

  console.log('✓ Proxy endpoint configured');
  console.log(`  ${PROXY_ENDPOINT.replace(/:([^:@]+)@/, ':***@')}\n`);

  // Parse proxy URL for Playwright format
  const proxyUrl = new URL(PROXY_ENDPOINT);
  
  const browser = await chromium.launch({
    headless: false, // Visible so you can see what's happening
    proxy: {
      server: `${proxyUrl.protocol}//${proxyUrl.host}`,
      username: decodeURIComponent(proxyUrl.username),
      password: decodeURIComponent(proxyUrl.password),
    },
    args: [
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--no-sandbox',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true, // Required for Bright Data immediate access mode
  });

  const page = await context.newPage();

  // Test 1: Check IP
  console.log('Test 1: Checking IP address...');
  try {
    await page.goto('https://httpbin.org/ip', { timeout: 30000 });
    const ipText = await page.textContent('body');
    const ip = JSON.parse(ipText || '{}').origin;
    console.log(`  ✓ Your proxy IP: ${ip}\n`);
  } catch (e: any) {
    console.log(`  ❌ IP check failed: ${e.message}\n`);
  }

  // Test 2: Cardmarket
  console.log('Test 2: Testing Cardmarket (Cloudflare protected)...');
  try {
    await page.goto('https://www.cardmarket.com/en/Magic', { timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    const content = await page.content();
    const isBlocked = content.toLowerCase().includes('checking your browser') ||
                      content.toLowerCase().includes('cloudflare');

    if (isBlocked) {
      console.log('  ⚠ Cloudflare challenge detected. Waiting for resolution...');
      await new Promise(r => setTimeout(r, 10000));
      
      const newContent = await page.content();
      if (newContent.toLowerCase().includes('cardmarket')) {
        console.log('  ✓ Cloudflare challenge resolved!\n');
      } else {
        console.log('  ❌ Still blocked after waiting\n');
      }
    } else if (content.includes('Cardmarket') || content.includes('Magic')) {
      console.log('  ✓ Cardmarket loaded successfully!\n');
    } else {
      console.log('  ⚠ Unexpected response\n');
    }
  } catch (e: any) {
    console.log(`  ❌ Cardmarket test failed: ${e.message}\n`);
  }

  // Test 3: TCGPlayer
  console.log('Test 3: Testing TCGPlayer...');
  try {
    await page.goto('https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=black+lotus', { timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    const hasResults = await page.locator('.search-result, .product-card').count() > 0;
    if (hasResults) {
      console.log('  ✓ TCGPlayer loaded successfully!\n');
    } else {
      const content = await page.content();
      if (content.includes('TCGplayer') || content.includes('search')) {
        console.log('  ✓ TCGPlayer loaded (no results visible yet)\n');
      } else {
        console.log('  ⚠ TCGPlayer may be blocking\n');
      }
    }
  } catch (e: any) {
    console.log(`  ❌ TCGPlayer test failed: ${e.message}\n`);
  }

  // Test 4: IP rotation (Bright Data: no -session- = new IP per connection)
  console.log('Test 4: Testing IP rotation (3 separate connections)...');
  await browser.close(); // Close the first browser

  const ips = new Set<string>();

  for (let i = 0; i < 3; i++) {
    // Bright Data: use basic username (no -session-) for new IP per connection
    const username = decodeURIComponent(proxyUrl.username);

    try {
      const testBrowser = await chromium.launch({
        headless: true,
        proxy: {
          server: `${proxyUrl.protocol}//${proxyUrl.host}`,
          username,
          password: decodeURIComponent(proxyUrl.password),
        },
        args: ['--ignore-certificate-errors', '--ignore-ssl-errors', '--no-sandbox'],
      });

      const testPage = await testBrowser.newPage();
      await testPage.goto('https://httpbin.org/ip', { timeout: 30000 });
      const ipText = await testPage.textContent('body');
      const ip = JSON.parse(ipText || '{}').origin;
      ips.add(ip);
      console.log(`    → IP: ${ip}`);

      await testBrowser.close();
    } catch (e: any) {
      console.log(`    → Failed: ${e.message}`);
    }

    // Small delay between browser launches
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n  → ${ips.size} unique IPs from 3 browsers`);
  if (ips.size >= 2) {
    console.log('  ✓ IP rotation working (basic username, no -session-)\n');
  } else {
    console.log('  ⚠ IPs are NOT rotating. Check your Bright Data zone settings.\n');
    console.log('  Possible fixes:');
    console.log('  1. In Bright Data dashboard, ensure zone type is "Rotating Residential"');
    console.log('  2. Try removing "-zone-cardmarket" suffix if it\'s a sticky zone');
    console.log('  3. Contact Bright Data support about session rotation\n');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                        TEST COMPLETE                           ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (ips.size >= 2) {
    console.log('✅ Proxy is working with IP rotation. Ready to scrape!');
    console.log('   Run: npm run scrape-top-proxy\n');
  } else if (ips.size === 1) {
    console.log('⚠️  Proxy works but IPs are NOT rotating between sessions.');
    console.log('');
    console.log('   This WILL cause rate limiting (Error 1015). Fix options:');
    console.log('');
    console.log('   1. Check Bright Data zone type:');
    console.log('      - Must be "Residential Rotating" not "Residential Static"');
    console.log('      - Zone name "cardmarket" might be configured as sticky');
    console.log('');
    console.log('   2. Try creating a new zone:');
    console.log('      - Go to Bright Data dashboard → Zones → Add Zone');
    console.log('      - Select "Residential" → "Rotating"');
    console.log('      - Update PROXY_ENDPOINT with new zone credentials');
    console.log('');
    console.log('   3. Bright Data: use basic username (no -session-) for rotation\n');
  } else {
    console.log('❌ Proxy test failed. Check your credentials and try again.\n');
  }
}

testProxy().catch(console.error);

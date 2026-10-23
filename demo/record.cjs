/**
 * Records the demo walkthrough used in the submission video.
 * Output: demo/raw/*.webm  (+ screenshots in demo/shots/)
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://task12.34-21-153-205.nip.io/';
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync('demo/raw', { recursive: true });
  fs.mkdirSync('demo/shots', { recursive: true });

  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: 'demo/raw', size: { width: 1280, height: 800 } },
  });

  const page = await context.newPage();
  await page.goto(BASE + '?demo=' + Date.now(), { waitUntil: 'networkidle' });
  await wait(1800);

  await page.screenshot({ path: 'demo/shots/01-desktop.png', fullPage: false });

  // --- A1 search -------------------------------------------------------
  await page.click('#search-box');
  await page.type('#search-box', 'kinabalu', { delay: 90 });
  await wait(1400);
  await page.screenshot({ path: 'demo/shots/02-search.png' });

  // --- A2 category (combined with search) ------------------------------
  await page.fill('#search-box', '');
  await page.selectOption('#category', 'forest');
  await wait(1400);

  // --- A2 + A1 together ------------------------------------------------
  await page.type('#search-box', 'mount', { delay: 90 });
  await wait(1400);
  await page.screenshot({ path: 'demo/shots/03-combined-filter.png' });

  await page.fill('#search-box', '');
  await page.selectOption('#category', 'all');
  await wait(900);

  // --- A10 header search -----------------------------------------------
  await page.click('#main-search');
  await page.type('#main-search', 'belum', { delay: 90 });
  await wait(1600);
  await page.screenshot({ path: 'demo/shots/04-header-search.png' });
  await page.fill('#main-search', '');
  await wait(700);

  // --- A3 sticky contact ------------------------------------------------
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
  await wait(1200);
  await page.screenshot({ path: 'demo/shots/05-sticky-contact.png' });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(800);

  // --- Booking ----------------------------------------------------------
  await page.click('#booking-form');
  await page.evaluate(() => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await wait(1200);

  await page.fill('#booking-name', 'Anton Kristiono');
  await page.fill('#booking-email', 'anton@example.com');
  await page.fill('#booking-date', '2026-11-15');
  await wait(600);

  // A11 — live total
  await page.check('input[name="plan"][value="monthly"]');
  await wait(1600);
  await page.screenshot({ path: 'demo/shots/06-monthly-total.png' });
  await page.check('input[name="plan"][value="daily"]');
  await wait(1200);

  // A6 + A9
  await page.check('input[name="digital_nomad"][value="yes"]');
  await page.check('input[name="host_terms"]');
  await wait(900);
  await page.screenshot({ path: 'demo/shots/07-form-filled.png' });

  // A12 — submit
  await page.click('#booking-form button[type="submit"]');
  await page.waitForSelector('#trails-confirmation', { timeout: 20000 });
  await wait(1800);
  await page.screenshot({ path: 'demo/shots/08-confirmation.png' });

  // --- Footer -----------------------------------------------------------
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await wait(1400);
  await page.screenshot({ path: 'demo/shots/09-footer.png' });

  // --- A7 mobile 390px ---------------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await wait(1600);
  await page.screenshot({ path: 'demo/shots/10-mobile-390-top.png' });

  await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'smooth' }));
  await wait(1500);
  await page.screenshot({ path: 'demo/shots/11-mobile-390-promo.png' });

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await wait(1800);
  await page.screenshot({ path: 'demo/shots/12-mobile-390-bottom.png' });
  await wait(1200);

  await context.close();
  await browser.close();
  console.log('recorded');
})().catch(e => { console.error(e); process.exit(1); });

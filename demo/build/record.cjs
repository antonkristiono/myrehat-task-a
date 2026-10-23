/**
 * Records the demo with the on-screen cursor visible, paced to the
 * voice-over durations in demo/build/durations.json.
 *
 * Output: demo/build/raw/*.webm, demo/build/marks.json, demo/shots/*.png
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://task12.34-21-153-205.nip.io/';
const plan = JSON.parse(fs.readFileSync('demo/build/durations.json', 'utf8'));
const wait = ms => new Promise(r => setTimeout(r, ms));

const CURSOR_JS = `
(() => {
  const mount = () => {
    if (document.getElementById('__cursor')) return;
    const dot = document.createElement('div');
    dot.id = '__cursor';
    dot.style.cssText = 'position:fixed;z-index:2147483647;width:20px;height:20px;border-radius:50%;' +
      'background:rgba(12,107,79,.28);border:3px solid #0c6b4f;pointer-events:none;left:-60px;top:-60px;' +
      'transform:translate(-50%,-50%);transition:width .1s,height .1s;box-shadow:0 0 0 4px rgba(12,107,79,.12);';
    document.body.appendChild(dot);
    addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { dot.style.width = '30px'; dot.style.height = '30px'; }, true);
    addEventListener('mouseup', () => { dot.style.width = '20px'; dot.style.height = '20px'; }, true);
  };
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
})();
`;

(async () => {
  fs.mkdirSync('demo/build/raw', { recursive: true });
  fs.mkdirSync('demo/shots', { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: 'demo/build/raw', size: { width: 1280, height: 800 } },
  });
  await context.addInitScript(CURSOR_JS);
  const page = await context.newPage();

  const t0 = Date.now();
  const now = () => (Date.now() - t0) / 1000;
  const marks = [];

  async function begin(i) {
    marks.push({ i, t: Math.round(now() * 100) / 100, caption: plan[i].caption });
  }

  /** Wait until segment i has had its full voice-over time on screen. */
  async function finish(i, tail = 0.45) {
    const target = marks[marks.length - 1].t + plan[i].duration + tail;
    const left = target - now();
    if (left > 0) await wait(left * 1000);
  }

  async function clickAt(selector) {
    const box = await page.locator(selector).first().boundingBox();
    if (!box) throw new Error('no box for ' + selector);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
    await wait(220);
    await page.mouse.down();
    await wait(90);
    await page.mouse.up();
  }

  async function scrollTo(y, ms = 700) {
    await page.evaluate(v => window.scrollTo({ top: v, behavior: 'smooth' }), y);
    await wait(ms);
  }

  await page.goto(BASE + '?demo=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
  await wait(900);
  await page.mouse.move(400, 600, { steps: 10 });

  // ---------------- 0. intro / overview --------------------------------
  await begin(0);
  await page.screenshot({ path: 'demo/shots/01-desktop.png' });
  await scrollTo(340, 2600);
  await scrollTo(0, 2400);
  await finish(0);

  // ---------------- 1. A1 search ---------------------------------------
  await begin(1);
  await clickAt('#search-box');
  await page.type('#search-box', 'kinabalu', { delay: 110 });
  await wait(1200);
  await page.screenshot({ path: 'demo/shots/02-search.png' });
  await wait(900);
  await page.fill('#search-box', '');
  await wait(900);
  await finish(1);

  // ---------------- 2. A2 category + search ----------------------------
  await begin(2);
  await clickAt('#category');
  await page.selectOption('#category', 'forest');
  await wait(1400);
  await page.screenshot({ path: 'demo/shots/03-category.png' });
  await clickAt('#search-box');
  await page.type('#search-box', 'mount', { delay: 110 });
  await wait(1600);
  await page.screenshot({ path: 'demo/shots/04-combined-filter.png' });
  await wait(1200);
  await page.fill('#search-box', '');
  await page.selectOption('#category', 'all');
  await wait(700);
  await finish(2);

  // ---------------- 3. A10 header search -------------------------------
  await begin(3);
  await clickAt('#main-search');
  await page.type('#main-search', 'belum', { delay: 120 });
  await wait(1500);
  await page.screenshot({ path: 'demo/shots/05-header-search.png' });
  await wait(600);
  await page.fill('#main-search', '');
  await wait(500);
  await finish(3);

  // ---------------- 4. A6 + A9 required fields -------------------------
  await begin(4);
  await scrollTo(980, 900);
  await clickAt('input[name="digital_nomad"][value="yes"]');
  await wait(700);
  await clickAt('input[name="host_terms"]');
  await wait(700);
  await finish(4);

  // ---------------- 5. A11 pricing -------------------------------------
  await begin(5);
  await page.fill('#booking-name', 'Anton Kristiono');
  await page.fill('#booking-email', 'anton@example.com');
  await page.fill('#booking-date', '2026-11-15');
  await wait(500);
  await clickAt('input[name="plan"][value="monthly"]');
  await wait(2200);
  await page.screenshot({ path: 'demo/shots/06-monthly-total.png' });
  await wait(1500);
  await clickAt('input[name="plan"][value="daily"]');
  await wait(1400);
  await page.screenshot({ path: 'demo/shots/07-form-filled.png' });
  await finish(5);

  // ---------------- 6. A12 confirmation --------------------------------
  await begin(6);
  await clickAt('#booking-form button[type="submit"]');
  await page.waitForSelector('#trails-confirmation', { timeout: 20000 });
  await wait(1200);
  await page.evaluate(() => document.querySelector('#trails-confirmation').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await wait(1600);
  await page.screenshot({ path: 'demo/shots/08-confirmation.png' });
  await wait(2500);
  await finish(6);

  // ---------------- 7. A7 mobile 390px ---------------------------------
  await begin(7);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await wait(1400);
  await page.screenshot({ path: 'demo/shots/09-mobile-390-top.png' });
  await scrollTo(420, 1600);
  await page.screenshot({ path: 'demo/shots/10-mobile-390-promo.png' });
  await scrollTo(1150, 1600);
  await page.screenshot({ path: 'demo/shots/11-mobile-390-cards.png' });
  await scrollTo(0, 1500);
  await finish(7);

  // ---------------- 8. outro -------------------------------------------
  await begin(8);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await wait(2200);
  await page.screenshot({ path: 'demo/shots/12-mobile-390-bottom.png' });
  await wait(1200);
  await finish(8, 1.2);

  await context.close();
  await browser.close();

  fs.writeFileSync(
    'demo/build/marks.json',
    JSON.stringify({ introCard: 3.0, outroCard: 4.5, marks }, null, 2)
  );
  console.log('marks:', marks.map(m => m.i + '@' + m.t).join(' '));
  console.log('recording duration ~' + now().toFixed(1) + 's');
})().catch(e => {
  console.error(e);
  process.exit(1);
});

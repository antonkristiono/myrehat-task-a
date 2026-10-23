/**
 * Functional verification for the MyRehat trails page (A1–A12).
 * Run: NODE_PATH=.../node_modules node demo/test.cjs
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://task12.34-21-153-205.nip.io/';
let pass = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log('PASS  ' + name);
  } else {
    failures.push(name + (detail ? ' — ' + detail : ''));
    console.log('FAIL  ' + name + (detail ? ' — ' + detail : ''));
  }
}

function visibleCount(page) {
  return page.$$eval('.trail-card', cards =>
    cards.filter(c => c.style.display !== 'none' && !c.hidden).length
  );
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

  await page.goto(BASE + '?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });

  // ---- A5 title --------------------------------------------------------
  const h1 = (await page.textContent('h1')).trim();
  check('A5 h1 is exactly "Tropic Hiking Trails"', h1 === 'Tropic Hiking Trails', h1);

  // ---- A1 listing search ----------------------------------------------
  check('A1 no console errors on load', consoleErrors.length === 0, consoleErrors.join(' | '));

  await page.fill('#search-box', 'kinabalu');
  await page.waitForTimeout(150);
  check('A1 search "kinabalu" filters to 1 card', (await visibleCount(page)) === 1, String(await visibleCount(page)));

  // ---- A2 category dropdown -------------------------------------------
  await page.fill('#search-box', '');
  await page.selectOption('#category', 'forest');
  await page.waitForTimeout(150);
  check('A2 category "forest" filters to 2 cards', (await visibleCount(page)) === 2, String(await visibleCount(page)));

  // ---- A2 + A1 combined ------------------------------------------------
  await page.fill('#search-box', 'mount');
  await page.waitForTimeout(150);
  const combined = await visibleCount(page);
  check('A2 search + category combine (mount + forest = 0)', combined === 0, String(combined));
  check('A1 "No trails found" appears when empty', await page.isVisible('#trails-no-results'));

  // ---- A10 header search ----------------------------------------------
  await page.fill('#search-box', '');
  await page.selectOption('#category', 'all');
  await page.fill('#main-search', 'belum');
  await page.waitForTimeout(150);
  check('A10 header search filters the same listing', (await visibleCount(page)) === 1, String(await visibleCount(page)));
  await page.fill('#main-search', '');
  await page.waitForTimeout(150);

  // ---- A3 sticky contact ----------------------------------------------
  const wa = await page.$('.myrehat-quick-contact .quick-contact-wa');
  const line = await page.$('.myrehat-quick-contact .quick-contact-line');
  const waOk = wa && (await wa.getAttribute('href')).includes('wa.me');
  const lineOk = line && (await line.getAttribute('href')).includes('line.me');
  check('A3 WhatsApp + LINE buttons exist', Boolean(waOk && lineOk));
  const sticky = await page.evaluate(() => {
    const el = document.querySelector('.myrehat-quick-contact');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { position: cs.position, weight: getComputedStyle(el.querySelector('a')).fontWeight, top: r.top };
  });
  check('A3 buttons are sticky/fixed and bold', sticky && sticky.position === 'fixed' && Number(sticky.weight) >= 700, JSON.stringify(sticky));

  // ---- A4 footer links -------------------------------------------------
  const footerLinks = await page.$$eval('.trails-footer-nav a', as => as.map(a => a.textContent.trim()));
  check(
    'A4 footer nav is exactly FAQ / Contact Us / PDPA / Privacy Policy',
    JSON.stringify(footerLinks) === JSON.stringify(['FAQ', 'Contact Us', 'PDPA', 'Privacy Policy']),
    footerLinks.join(', ')
  );

  // ---- A8 socials ------------------------------------------------------
  const socials = await page.$$eval('.trails-footer-social a', as => as.map(a => a.getAttribute('aria-label')));
  check(
    'A8 Facebook/LinkedIn/Instagram/TikTok/YouTube present',
    ['Facebook', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube'].every(s => socials.includes(s)),
    socials.join(', ')
  );

  // ---- A11 pricing -----------------------------------------------------
  const totalDaily = (await page.textContent('#trails-total')).trim();
  check('A11 daily total = RM 350', totalDaily.includes('RM 350'), totalDaily);

  await page.check('input[name="plan"][value="monthly"]');
  await page.waitForTimeout(120);
  const totalMonthly = (await page.textContent('#trails-total')).trim();
  check('A11 monthly total = RM 8,400', totalMonthly.includes('RM 8,400'), totalMonthly);

  await page.check('input[name="plan"][value="daily"]');
  await page.waitForTimeout(120);
  check('A11 total returns to RM 350', (await page.textContent('#trails-total')).includes('RM 350'));

  // ---- A6 / A9 required fields -----------------------------------------
  const nomadCount = await page.$$eval('input[name="digital_nomad"]', els => els.length);
  const nomadRequired = await page.$eval('input[name="digital_nomad"]', el => el.required);
  check('A6 Digital Nomad Yes/No exists and is required', nomadCount === 2 && nomadRequired);

  const terms = await page.$('input[name="host_terms"]');
  const termsRequired = terms && (await terms.getAttribute('required')) !== null;
  check('A9 "I agree to the Host Terms" exists and is required', Boolean(termsRequired));

  // ---- A12 booking confirmation ---------------------------------------
  await page.fill('#booking-name', 'Anton Kristiono');
  await page.fill('#booking-email', 'anton@example.com');
  await page.fill('#booking-date', '2026-11-15');
  await page.check('input[name="digital_nomad"][value="yes"]');
  await page.check('input[name="host_terms"]');
  await page.click('#booking-form button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#trails-confirmation', { timeout: 15000 });
  const confirmation = (await page.textContent('#trails-confirmation')).replace(/\s+/g, ' ').trim();
  check('A12 confirmation shown after booking', /Booking received/i.test(confirmation), confirmation.slice(0, 90));
  check('A12 confirmation echoes the booking details', /Anton Kristiono/.test(confirmation) && /2026-11-15/.test(confirmation), confirmation.slice(0, 120));

  // ---- A7 mobile 390px -------------------------------------------------
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await mobile.newPage();
  await mp.goto(BASE + '?mobile=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
  await mp.waitForTimeout(600);

  const overflow = await mp.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  check('A7 no horizontal scroll at 390px', overflow.scroll <= overflow.client + 1, JSON.stringify(overflow));
  check('A7 promo section is visible at 390px', await mp.isVisible('.trails-promo'));
  check('A7 booking form is visible at 390px', await mp.isVisible('#booking-form'));

  await browser.close();

  console.log('\n' + pass + ' passed, ' + failures.length + ' failed');
  if (failures.length) {
    console.log('FAILURES:\n- ' + failures.join('\n- '));
    process.exit(1);
  }
})().catch(err => {
  console.error('RUNNER ERROR', err);
  process.exit(1);
});

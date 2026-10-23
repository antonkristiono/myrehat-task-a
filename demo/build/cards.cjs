/**
 * Renders the intro / outro cards (1280x800 PNG) used by make-video.sh.
 */
const { chromium } = require('playwright');
const fs = require('fs');

const page_html = (title, subtitle, lines) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: 1280px; height: 800px; overflow: hidden;
    font-family: "Noto Sans", system-ui, sans-serif;
    background: linear-gradient(135deg, #0c6b4f 0%, #083f31 100%);
    color: #fff; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
  }
  .kicker { font-size: 20px; letter-spacing: .18em; text-transform: uppercase; color: #9fd8c2; margin-bottom: 22px; }
  h1 { font-size: 68px; margin: 0 0 18px; line-height: 1.1; font-weight: 700; }
  .sub { font-size: 26px; color: #d9efe6; margin: 0 0 42px; }
  .lines { font-size: 21px; line-height: 1.9; color: #bfe6d6; }
  .lines strong { color: #fff; font-weight: 700; }
  .rule { width: 96px; height: 4px; background: #2fbf8a; border-radius: 2px; margin: 0 0 34px; }
</style></head>
<body>
  <div class="kicker">MyRehat · Junior SE · Task A</div>
  <h1>${title}</h1>
  <div class="rule"></div>
  <p class="sub">${subtitle}</p>
  <div class="lines">${lines}</div>
</body></html>`;

(async () => {
  fs.mkdirSync('demo/build/cards', { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const cards = [
    [
      'demo/build/cards/intro.png',
      page_html(
        'Tropic Hiking Trails',
        'Demo perbaikan 12 bug front-end + 3 bug PHP',
        'task12.34-21-153-205.nip.io · WordPress + Elementor'
      ),
    ],
    [
      'demo/build/cards/outro.png',
      page_html(
        'Terima kasih',
        'Repo: <strong>github.com/antonkristiono/myrehat-task-a</strong>',
        '21/21 tes otomatis lolos · desktop 1280px &amp; mobile 390px'
      ),
    ],
  ];

  for (const [file, html] of cards) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: file });
    console.log('wrote', file);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

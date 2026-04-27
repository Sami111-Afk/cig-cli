const { chromium } = require('playwright');

// cloudnestra URL passed directly from Python
const playerUrl = process.argv[2];
if (!playerUrl) {
  process.stderr.write('Usage: node extract.js <cloudnestra_url>\n');
  process.exit(1);
}

const SKIP_HOSTS = [
  'google', 'gstatic', 'cloudflare', 'jquery', 'ajax.googleapis',
  'histats', 'font-awesome', 'cdnjs', 'analytics', 'unpkg.com',
  'stoperinbent', 'jiggerskohlcasinet',
];

function isVideoUrl(url) {
  return /\.(m3u8|mp4)(\?|$)/i.test(url);
}

function isSkippable(url) {
  return SKIP_HOSTS.some(h => url.includes(h));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    extraHTTPHeaders: { 'Referer': 'https://vsembed.ru/' },
  });

  const page = await context.newPage();
  let found = null;

  page.on('request', request => {
    const url = request.url();
    if (isVideoUrl(url) && !isSkippable(url)) {
      process.stderr.write(`VIDEO REQ: ${url}\n`);
      found = url;
    }
  });

  try {
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // wait for play button and click it
    try {
      const btn = await page.waitForSelector('#pl_but, .play-btn, [id*="play"]', { timeout: 8000 });
      await btn.click();
      process.stderr.write('clicked play button\n');
    } catch (e) {
      process.stderr.write(`play button: ${e.message.split('\n')[0]}\n`);
    }

    // wait up to 20s for a video URL
    const deadline = Date.now() + 20000;
    while (!found && Date.now() < deadline) {
      await page.waitForTimeout(500);
    }
  } catch (e) {
    process.stderr.write(`page error: ${e.message.split('\n')[0]}\n`);
  }

  await browser.close();

  if (found) {
    process.stdout.write(found + '\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
})();

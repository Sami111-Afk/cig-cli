const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const playerUrl = process.argv[2];
if (!playerUrl) {
  process.stderr.write('Usage: node extract.js <url>\n');
  process.exit(1);
}

const SKIP_HOSTS = [
  'google', 'gstatic', 'cloudflare', 'jquery', 'ajax.googleapis',
  'histats', 'font-awesome', 'cdnjs', 'analytics', 'unpkg.com',
  'stoperinbent', 'jiggerskohlcasinet', 'yandex', 'clarity.ms',
];

function isVideoUrl(url) {
  return /\.(m3u8|mp4)(\?|$)/i.test(url);
}

function isSkippable(url) {
  return SKIP_HOSTS.some(h => url.includes(h));
}

// convert playwright cookies to Netscape cookie file format for mpv
function cookiesToNetscape(cookies) {
  const lines = ['# Netscape HTTP Cookie File'];
  for (const c of cookies) {
    const httpOnly = c.httpOnly ? '#HttpOnly_' : '';
    const domain = c.domain.startsWith('.') ? c.domain : c.domain;
    const flag = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const secure = c.secure ? 'TRUE' : 'FALSE';
    const expires = c.expires > 0 ? Math.floor(c.expires) : 0;
    lines.push(`${httpOnly}${domain}\t${flag}\t${c.path}\t${secure}\t${expires}\t${c.name}\t${c.value}`);
  }
  return lines.join('\n');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  let found = null;

  page.on('request', request => {
    if (found) return;
    const url = request.url();
    if (isVideoUrl(url) && !isSkippable(url)) {
      process.stderr.write(`VIDEO REQ: ${url}\n`);
      found = url;
    }
  });

  try {
    await page.goto(playerUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (_) {}

  try {
    const btn = await page.waitForSelector('#pl_but, .play-btn, [id*="play"]', { timeout: 4000 });
    await btn.click();
    process.stderr.write('clicked play button\n');
  } catch (_) {}

  const deadline = Date.now() + 20000;
  while (!found && Date.now() < deadline) {
    await page.waitForTimeout(400);
  }

  // save cookies to temp file for mpv
  let cookieFile = null;
  if (found) {
    try {
      const cookies = await context.cookies();
      const netscape = cookiesToNetscape(cookies);
      cookieFile = path.join(os.tmpdir(), `cig_cookies_${Date.now()}.txt`);
      fs.writeFileSync(cookieFile, netscape);
    } catch (_) {}
  }

  await browser.close();

  if (found) {
    // output: URL\nCOOKIE_FILE (or just URL if no cookies)
    process.stdout.write(found + '\n');
    if (cookieFile) process.stdout.write(cookieFile + '\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
})();

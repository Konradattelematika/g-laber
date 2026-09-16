// Scrollt zu einem Selektor und macht einen Viewport-Screenshot –
// damit ScrollTrigger-Animationen gefeuert haben, bevor geknipst wird.
// Aufruf: node scripts/scroll-shot.mjs <url> <breite> <selector> <out.png> [--wait <ms>]
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';

const [url, width, selector, out, ...rest] = process.argv.slice(2);
if (!url || !width || !selector || !out) {
  console.error('Usage: node scripts/scroll-shot.mjs <url> <width> <selector> <out.png> [--wait <ms>]');
  process.exit(1);
}
const waitIdx = rest.indexOf('--wait');
const extraWait = waitIdx >= 0 ? Number(rest[waitIdx + 1]) : 1600;

const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({
  viewport: { width: Number(width), height: Math.round(Number(width) * (width < 500 ? 2.16 : 0.625)) },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40 });
}, selector);
await page.waitForTimeout(extraWait);
await page.screenshot({ path: out });
await browser.close();
console.log(`OK ${out}`);

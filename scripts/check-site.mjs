// Abnahme-Check der gebauten Seite gegen die laufende Preview:
// Overflow, Konsolenfehler, fehlgeschlagene Requests, Überschriften-Struktur,
// interne Links/Anker, mobile Navigation, Player-Details.
// Aufruf: source scripts/env.sh && node scripts/check-site.mjs  (Preview auf :4322)
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';

const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`,
  args: ['--no-sandbox', '--disable-gpu'],
});

for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [], failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + r.failure()?.errorText));
  await page.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    offenders: [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 2)
      .slice(0, 6)
      .map((el) => el.className && typeof el.className === 'string' ? el.className : el.tagName),
  }));
  console.log(`\n== ${w}x${h} ==`);
  console.log('scrollWidth', overflow.doc, 'innerWidth', overflow.win, overflow.doc > overflow.win ? 'OVERFLOW' : 'ok');
  if (overflow.offenders.length) console.log('  right-overflow:', overflow.offenders);
  if (errors.length) console.log('  console errors:', errors);
  if (failed.length) console.log('  failed requests:', failed.filter(u => !u.includes('anchor.fm')));
  await page.close();
}

// Struktur- und Linkcheck auf Desktop
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => ({
  headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => h.tagName + ' ' + h.innerText.replace(/\s+/g, ' ').slice(0, 44)),
  imgsWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
  links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  players: document.querySelectorAll('[data-player]').length,
  anchors: [...document.querySelectorAll('[id]')].map((e) => e.id),
}));
console.log('\n== Struktur ==');
console.log('Überschriften:', info.headings.join(' | '));
console.log('img ohne alt:', info.imgsWithoutAlt, '| Player:', info.players);
const internal = [...new Set(info.links.filter((h) => h.startsWith('/')))];
for (const href of internal) {
  const r = await page.request.get('http://localhost:4322' + href);
  console.log('  ', r.status(), href);
}
const hashes = [...new Set(info.links.filter((h) => h.startsWith('#') || h.startsWith('/#')))].map((h) => h.replace(/^\/?#/, ''));
console.log('  Anker fehlend:', hashes.filter((id) => !info.anchors.includes(id)));
console.log('  externe Links:', [...new Set(info.links.filter((h) => h.startsWith('http') || h.startsWith('mailto')))].join(' '));

// Mobile Navigation
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
await m.click('[data-nav-toggle]');
await m.waitForTimeout(400);
console.log('\n== Mobile-Nav ==');
console.log('aria-expanded:', await m.getAttribute('[data-nav-toggle]', 'aria-expanded'));
console.log('Overlay sichtbar:', await m.isVisible('[data-nav-overlay]'));
await m.screenshot({ path: '/tmp/m-nav.png' });
await m.keyboard.press('Escape');
await m.waitForTimeout(300);
console.log('nach Escape sichtbar:', await m.isVisible('[data-nav-overlay]'));
console.log('body overflow:', await m.evaluate(() => document.body.style.overflow || '(leer)'));

// Player-Detailaufnahme
await page.evaluate(() => document.querySelector('.archive .row')?.scrollIntoView());
await page.waitForTimeout(600);
const pl = await page.$('.archive .row .player');
await pl.screenshot({ path: '/tmp/player-dark.png' });
const pl2 = await page.$('.latest .player');
await page.evaluate(() => document.querySelector('.latest .player')?.scrollIntoView());
await page.waitForTimeout(400);
await pl2.screenshot({ path: '/tmp/player-paper.png' });

await browser.close();

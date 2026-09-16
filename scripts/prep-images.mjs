#!/usr/bin/env node
/**
 * Erzeugt alle Web-Assets aus den Quelldateien in scripts/:
 *
 *   public/fonts/bebas-neue-*.woff2        Display-Schrift (aus @fontsource)
 *   public/img/cover-{480,768,1080}.webp   Cover (quadratisch, Hero-Poster)
 *   public/img/hosts-wide-{960,1440,1920}.webp  Breiter Foto-Ausschnitt des Covers
 *                                          (Typo weggeschnitten) für Bildbänder
 *   public/img/roger.webp / jana.webp      Host-Portraits (4:5)
 *   public/img/brush-{stroke,slab,patch}.svg  Pinsel-Masken (make-brushes.mjs)
 *   public/og.jpg                          1200×630 Open-Graph-Karte
 *   public/favicon.svg                     Wortmarken-„G“ im neuen Branding
 *   public/apple-touch-icon.png            180×180
 *
 * Quelle für alles Cover-basierte: scripts/cover-source.png (2000×2000).
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadBebas, typeset } from './lib/bebas.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'scripts/cover-source.png');
const out = (p) => join(root, p);
mkdirSync(out('public/fonts'), { recursive: true });
mkdirSync(out('public/img'), { recursive: true });

/* ---------- Markenfarben (exakt aus dem Cover gesampelt) ---------- */
const PINK = '#f875c4';
const ORANGE = '#ff751f';
const BLACK = '#0b0b0c';
const GRAY = '#c9c4be';

/* ---------- 1) Display-Schrift self-hosten ----------
   Bebas Neue kommt aus @fontsource, wird aber unter einem stabilen Pfad
   ausgeliefert: so kann global.css das @font-face selbst definieren und
   Layout.astro die Datei gezielt preloaden (kein FOUT im Hero). */
for (const sub of ['latin', 'latin-ext']) {
  copyFileSync(
    join(root, `node_modules/@fontsource/bebas-neue/files/bebas-neue-${sub}-400-normal.woff2`),
    out(`public/fonts/bebas-neue-${sub}-400.woff2`)
  );
}

/* ---------- 2) Pinsel-Assets ---------- */
execFileSync(process.execPath, [join(root, 'scripts/make-brushes.mjs')], { stdio: 'inherit' });

/* ---------- 3) Cover-Varianten ---------- */
for (const w of [480, 640, 768, 1080]) {
  await sharp(SRC).resize(w, w).webp({ quality: 84 }).toFile(out(`public/img/cover-${w}.webp`));
}

/* ---------- 4) Breiter Fotostreifen ----------
   y 560–1520 des Covers: beide Hosts plus Pink-/Orange-Pinsel, aber ohne die
   eingebrannte Typo — damit die Website ihre eigene Typografie darüberlegen kann. */
const BAND = { left: 0, top: 560, width: 2000, height: 960 };
for (const w of [960, 1440, 1920]) {
  await sharp(SRC)
    .extract(BAND)
    .resize(w, Math.round((w * BAND.height) / BAND.width))
    .webp({ quality: 80 })
    .toFile(out(`public/img/hosts-wide-${w}.webp`));
}

/* ---------- 5) Host-Portraits ---------- */
await sharp(join(root, 'scripts/roger-source.jpg'))
  .resize(800, 1000, { fit: 'cover', position: 'centre' })
  .webp({ quality: 82 }).toFile(out('public/img/roger.webp'));
await sharp(join(root, 'scripts/jana-source.jpg'))
  .resize(800, 1000, { fit: 'cover', position: 'centre' })
  .webp({ quality: 82 }).toFile(out('public/img/jana.webp'));

/* ---------- 6) Typografie-Helfer ---------- */
const font = await loadBebas();

/** Setzt eine Zeile so groß wie möglich, aber höchstens `max` breit. */
const fit = (text, max, size, tracking = 0) => {
  let t = typeset(font, text, { size, tracking });
  if (t.width > max) t = typeset(font, text, { size: (size * max) / t.width, tracking });
  return t;
};

/** Offset-Look des Covers: orange nach oben-links, pink nach unten-rechts, weiß obenauf. */
const offsetLine = (t, x, y, top = '#ffffff', dist = 1) =>
  t.group(x - 6 * dist, y - 6 * dist, `fill="${ORANGE}"`) +
  t.group(x + 8 * dist, y + 8 * dist, `fill="${PINK}"`) +
  t.group(x, y, `fill="${top}"`);

/** Pfade aus einem erzeugten Brush-SVG, eingefärbt und platziert. */
const brush = (file, { x, y, w, h, fill, rotate = 0, opacity = 1 }) => {
  const svg = readFileSync(out(`public/img/${file}`), 'utf8');
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const paths = [...svg.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join('');
  return `<g fill="${fill}" opacity="${opacity}" transform="translate(${x} ${y}) rotate(${rotate}) scale(${w / +vb[1]} ${h / +vb[2]})">${paths}</g>`;
};

/* ---------- 7) Open-Graph-Karte ----------
   Links das Wortbild im Cover-Offset-Look, rechts das Cover selbst. */
{
  const W = 1200, H = 630, PANEL = 566, PAD = 52;
  const inner = PANEL - PAD * 2;

  const word = fit('G-LABER', inner, 186);
  const l1 = fit('DER PODCAST MIT', inner, 48, 1);
  const l2 = fit('JANA JANSEN', inner, 62);
  const l3a = typeset(font, 'UND ', { size: 62 });
  const l3b = fit('ROGER G', inner - l3a.width, 62);
  const url = fit('G-LABER.COM', inner, 30, 6);

  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      brush('brush-slab.svg', { x: -40, y: 470, w: 700, h: 150, fill: ORANGE, rotate: -3, opacity: 0.9 }) +
      brush('brush-stroke.svg', { x: PAD - 14, y: 236, w: 420, h: 46, fill: PINK, rotate: -1.5 }) +
      offsetLine(word, PAD, PAD + word.capHeight + 10) +
      l1.group(PAD, 286, 'fill="#ffffff"') +
      l2.group(PAD, 366, `fill="${ORANGE}"`) +
      l3a.group(PAD, 444, 'fill="#ffffff"') +
      l3b.group(PAD + l3a.width, 444, `fill="${PINK}"`) +
      url.group(PAD, 578, `fill="${BLACK}"`) +
    `</svg>`
  );

  const cover = await sharp(SRC).resize(H, H).toBuffer();
  await sharp({ create: { width: W, height: H, channels: 3, background: BLACK } })
    .composite([
      { input: cover, left: PANEL, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88 })
    .toFile(out('public/og.jpg'));
}

/* ---------- 8) Favicon + Touch-Icon ---------- */
{
  const S = 64;
  const g = fit('G', 30, 48);
  const x = (S - g.width) / 2;
  const y = (S + g.capHeight) / 2;
  // Offsets bewusst klein: bei 16 px darf der Versatz die Form nicht zumatschen.
  const mark = (dx = 0) =>
    g.group(x - 2 + dx, y - 2, `fill="${ORANGE}"`) +
    g.group(x + 2.5 + dx, y + 2.5, `fill="${PINK}"`) +
    g.group(x + dx, y, 'fill="#ffffff"');

  const favicon =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">` +
      `<rect width="${S}" height="${S}" rx="13" fill="${BLACK}"/>` + mark() +
    `</svg>\n`;
  writeFileSync(out('public/favicon.svg'), favicon);

  // Touch-Icon ohne eigene Rundung — iOS maskiert selbst.
  const touch =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">` +
      `<rect width="${S}" height="${S}" fill="${BLACK}"/>` + mark() +
    `</svg>`;
  await sharp(Buffer.from(touch), { density: 900 }).resize(180, 180).png().toFile(out('public/apple-touch-icon.png'));
}

console.log('Bilder erzeugt → public/ (Cover, Fotostreifen, Portraits, Brushes, OG, Icons)');

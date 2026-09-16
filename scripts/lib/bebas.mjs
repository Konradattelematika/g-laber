/**
 * Bebas Neue als Vektor-Pfade verfügbar machen.
 *
 * Für Favicon und OG-Bild brauchen wir die Display-Schrift als reine
 * SVG-Pfade — sharp/librsvg kennt keine @font-face-Webfonts, und ein
 * Icon soll unabhängig von installierten Systemschriften gleich aussehen.
 * Quelle ist dieselbe woff2, die auch die Website ausliefert (@fontsource).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decompress } from 'wawoff2';
import * as fontkit from 'fontkit';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

let cached;
export async function loadBebas() {
  if (cached) return cached;
  const woff2 = readFileSync(join(root, 'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2'));
  cached = fontkit.create(Buffer.from(await decompress(woff2)));
  return cached;
}

/**
 * Setzt `text` und liefert die Glyphen als SVG-Gruppe.
 * @returns {{ width: number, capHeight: number, group: (x:number,y:number,attrs?:string)=>string }}
 *          `group(x, y)` platziert den Text mit Baseline auf y, linksbündig ab x.
 */
export function typeset(font, text, { size, tracking = 0 }) {
  const run = font.layout(text);
  const scale = size / font.unitsPerEm;
  const parts = [];
  let pen = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    const pos = run.positions[i];
    const d = glyph.path.toSVG();
    if (d) parts.push(`<path d="${d}" transform="translate(${pen + (pos.xOffset || 0)} ${pos.yOffset || 0})"/>`);
    pen += pos.xAdvance + tracking / scale;
  }
  const inner = parts.join('');
  return {
    width: pen * scale,
    capHeight: font.capHeight * scale,
    // scale(s, -s): Font-Koordinaten laufen nach oben, SVG nach unten.
    group: (x, y, attrs = '') =>
      `<g ${attrs} transform="translate(${x} ${y}) scale(${scale} ${-scale})">${inner}</g>`,
  };
}

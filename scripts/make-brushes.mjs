#!/usr/bin/env node
/**
 * Erzeugt die Brush-/Paint-Assets des G-Laber-Brandings als SVG-Masken
 * (schwarze Form auf transparent → in CSS via mask-image beliebig eingefärbt).
 *
 * Optik vom Cover abgeleitet: schneller, trockener Pinselstrich — kein solider
 * Balken, sondern ein Bündel längslaufender Borstenspuren mit Lücken,
 * ausgefransten Enden und wegfliegenden Spritzern. Deterministisch (fester
 * Seed), damit `npm run prep-images` reproduzierbar bleibt.
 *
 * Ausgabe: public/img/brush-stroke.svg · brush-slab.svg · brush-patch.svg
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/img');
mkdirSync(outDir, { recursive: true });

/** Mulberry32 — kleiner, deterministischer PRNG */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Ganzzahlige Koordinaten: bei viewBox 1000×400 ist das weit unter einem
// Bildschirmpixel und spart rund ein Viertel der Dateigröße.
const n = (v) => Math.round(v);

/**
 * Eine Borstenspur: langgezogenes Band zwischen x0 und x1, das an beiden Enden
 * ausläuft und der gemeinsamen Wellenlinie des Strichs folgt.
 */
function ribbon(r, { x0, x1, y, h, wave, phase, steps = 18 }) {
  const top = [], bot = [];
  const len = x1 - x0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Hülle: vorn schnell angesetzt (stumpfe Ansatzkante), hinten lang
    // auslaufend — so wirkt der Strich gerichtet statt symmetrisch-spitz.
    const rise = Math.pow(Math.min(1, t / 0.05), 0.5);
    const fall = Math.pow(Math.min(1, (1 - t) / 0.55), 0.6);
    const env = rise * (0.5 + 0.5 * fall);
    const hh = (h * env) / 2 + 0.25;
    const cx = x0 + len * t;
    const drift = Math.sin((cx / 1000) * wave + phase) * 6;
    top.push([n(cx), n(y + drift - hh)]);
    bot.push([n(cx), n(y + drift + hh)]);
  }
  const d = [`M${top[0][0]} ${top[0][1]}`];
  for (const p of top.slice(1)) d.push(`L${p[0]} ${p[1]}`);
  for (const p of bot.reverse()) d.push(`L${p[0]} ${p[1]}`);
  d.push('Z');
  return d.join('');
}

/**
 * Ein kompletter Strich: dicht gestapelte Borstenspuren unterschiedlicher
 * Länge/Dicke. Spuren, die früh enden, erzeugen die ausgefransten Kanten;
 * gelegentliche Lücken erzeugen die trockenen Stellen.
 */
function stroke(r, { x, y, len, thick, rows = 26, wave = 5.5, ragged = 0.42, gaps = 0.3 }) {
  const paths = [];
  const phase = r() * 6.28;
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    // Position quer zum Strich, mit leichter Unregelmäßigkeit
    const off = (t - 0.5) * thick + (r() - 0.5) * (thick / rows) * 1.4;
    // Randspuren dünner als die Mitte → weiche, aber nicht glatte Kante
    const core = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2.2);
    const h = (thick / rows) * (1.35 + r() * 1.5) * (0.35 + 0.65 * core);
    // Ragged: jede Spur startet/endet woanders
    const x0 = x + len * r() * 0.1 * (r() < 0.4 ? 1 : 0.2);
    const x1 = x + len * (1 - ragged * Math.pow(r(), 1.6));
    if (x1 - x0 < len * 0.12) continue;
    if (r() < gaps) {
      // trockene Stelle: Spur in zwei Segmente brechen
      const cut = x0 + (x1 - x0) * (0.3 + r() * 0.4);
      const gap = (x1 - x0) * (0.04 + r() * 0.12);
      paths.push(ribbon(r, { x0, x1: cut, y: y + off, h, wave, phase }));
      if (x1 - (cut + gap) > len * 0.06)
        paths.push(ribbon(r, { x0: cut + gap, x1, y: y + off, h, wave, phase }));
    } else {
      paths.push(ribbon(r, { x0, x1, y: y + off, h, wave, phase }));
    }
  }
  return paths;
}

/** Spritzer, die hinter dem Strich wegfliegen (eigene <path>-Elemente) */
function specks(r, { x, y, len, thick }, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = 0.55 + Math.pow(r(), 0.6) * 0.5;
    const cx = x + len * t;
    const cy = y + (r() - 0.5) * thick * 1.35;
    const rx = thick * (0.008 + Math.pow(r(), 2) * 0.05);
    const ry = rx * (0.45 + r() * 0.9);
    out.push(`M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 1 ${n(rx * 2)} 0a${n(rx)} ${n(ry)} 0 1 1 ${n(-rx * 2)} 0Z`);
  }
  return out;
}

const svg = (w, h, paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">` +
  paths.map((d) => `<path fill="#000" d="${d}"/>`).join('') +
  '</svg>\n';

// --- 1) Langer, schlanker Strich: Unterstreichung, Divider, Label-Fläche -----
{
  const r = rng(20260916);
  const o = { x: 8, y: 60, len: 984, thick: 84 };
  writeFileSync(
    join(outDir, 'brush-stroke.svg'),
    svg(1000, 120, [...stroke(r, { ...o, rows: 24, ragged: 0.3, gaps: 0.28 }), ...specks(r, o, 14)])
  );
}

// --- 2) Chunky Slab: große Farbflächen (Hero, Section-Übergänge) ------------
{
  const r = rng(77001);
  const paths = [];
  for (let i = 0; i < 2; i++) {
    const o = { x: 4 + i * 18, y: 150 + i * 96, len: 990 - i * 40, thick: 210 };
    paths.push(...stroke(r, { ...o, rows: 34, wave: 3.4, ragged: 0.22, gaps: 0.34 }));
    paths.push(...specks(r, o, 16));
  }
  writeFileSync(join(outDir, 'brush-slab.svg'), svg(1000, 400, paths));
}

// --- 3) Patch: rauer Kasten hinter Zahlen, Badges, Hover-Flächen ------------
{
  const r = rng(4242);
  const paths = [];
  for (let i = 0; i < 3; i++) {
    const o = { x: 6, y: 52 + i * 78, len: 988, thick: 96 };
    paths.push(...stroke(r, { ...o, rows: 16, wave: 2.6, ragged: 0.12, gaps: 0.2 }));
  }
  writeFileSync(join(outDir, 'brush-patch.svg'), svg(1000, 260, paths));
}

console.log('Brushes erzeugt → public/img/brush-{stroke,slab,patch}.svg');

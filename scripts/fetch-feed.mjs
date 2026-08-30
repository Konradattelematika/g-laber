#!/usr/bin/env node
/**
 * Holt den G-Laber-RSS-Feed (Riverside-Hosting) und schreibt
 * src/data/episodes.json. Wird manuell bzw. vor dem Build ausgeführt,
 * damit der Astro-Build selbst ohne Netz auskommt.
 *
 *   node scripts/fetch-feed.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Aktueller Feed: Spotify for Creators (Anchor). Der frühere Riverside-Feed
// (api.riverside.com/hosting/cJlDQPNZ.rss) wurde nach dem Hosting-Wechsel nicht
// mehr befüllt und blieb bei Folge 5 stehen — nicht wieder darauf zurückgehen.
const FEED_URL = 'https://anchor.fm/s/1160ba830/podcast/rss';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/data/episodes.json');

const res = await fetch(FEED_URL);
if (!res.ok) throw new Error(`Feed-Abruf fehlgeschlagen: HTTP ${res.status}`);
const xml = await res.text();

const unescape = (s) =>
  s
    .replaceAll('<![CDATA[', '')
    .replaceAll(']]>', '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? unescape(m[1]) : '';
};

const stripHtml = (html) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const slugify = (s) =>
  s
    .toLowerCase()
    .replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const durationToSeconds = (d) => {
  const parts = d.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, block]) => {
  const title = tag(block, 'title');
  const enclosure = block.match(/<enclosure[^>]*url="([^"]+)"/);
  const duration = tag(block, 'itunes:duration');
  const descriptionHtml = tag(block, 'description');
  return {
    title,
    slug: slugify(title),
    pubDate: tag(block, 'pubDate'),
    duration,
    durationSeconds: durationToSeconds(duration),
    description: stripHtml(descriptionHtml),
    audioUrl: enclosure ? unescape(enclosure[1]) : '',
    episodeType: (tag(block, 'itunes:episodeType') || 'full').toLowerCase(),
    episodeNumber: Number(tag(block, 'itunes:episode')) || null,
  };
});

// Folgen-Nummern: nur echte Folgen (episodeType "full") werden durchnummeriert.
// Trailer/Bonus (z. B. kurze Clips) bekommen KEINE Nummer (episodeNumber = null)
// und werden auf der Seite als "Bonus" ausgewiesen.
// Der Feed taggt nur die neuesten Folgen mit itunes:episode; ältere nicht. Wir
// nummerieren die Full-Folgen daher chronologisch (älteste = 1) und übernehmen
// eine explizite itunes:episode-Nummer nur, wenn sie zur Reihenfolge passt.
const fullChrono = items
  .filter((ep) => ep.episodeType === 'full')
  .sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
fullChrono.forEach((ep, i) => {
  ep.episodeNumber = i + 1;
});
items.forEach((ep) => {
  if (ep.episodeType !== 'full') ep.episodeNumber = null;
});

const channelTitle = tag(xml.split('<item>')[0], 'title');
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), channelTitle, episodes: items }, null, 2));
console.log(`${items.length} Episoden → ${OUT}`);

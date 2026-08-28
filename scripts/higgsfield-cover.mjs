#!/usr/bin/env node
/**
 * G-Laber-Cover über die Higgsfield-API generieren.
 * Prompts in scripts/cover-prompts.json, Ausgabe → scripts/generated/.
 *
 *   HIGGSFIELD_API_KEY=… HIGGSFIELD_API_SECRET=… node scripts/higgsfield-cover.mjs
 *   ... node scripts/higgsfield-cover.mjs cover-harbor   # nur ein Motiv
 *
 * Ohne Keys bricht das Script sauber ab (kein Raten). API-Doku:
 * https://docs.higgsfield.ai/docs/how-to/introduction.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://platform.higgsfield.ai';
const KEY = process.env.HIGGSFIELD_API_KEY;
const SECRET = process.env.HIGGSFIELD_API_SECRET;

if (!KEY || !SECRET) {
  console.error('❌ HIGGSFIELD_API_KEY und HIGGSFIELD_API_SECRET als Env setzen.');
  process.exit(1);
}

const auth = `Key ${KEY}:${SECRET}`;
const outDir = path.join(__dirname, 'generated');
fs.mkdirSync(outDir, { recursive: true });
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'cover-prompts.json'), 'utf8'));
const only = process.argv[2];
const jobs = config.images.filter((i) => !only || i.name === only);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submit(job) {
  const res = await fetch(`${BASE}/${job.model_id || config.model_id}`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      prompt: job.prompt,
      aspect_ratio: job.aspect_ratio || '1:1',
      resolution: job.resolution || '1080p',
    }),
  });
  if (!res.ok) throw new Error(`Submit ${res.status}: ${await res.text()}`);
  return res.json();
}

async function poll(url) {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(url, { headers: { Authorization: auth } });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const d = await res.json();
    if (d.status === 'completed') return d;
    if (['failed', 'nsfw'].includes(d.status)) throw new Error(`Status "${d.status}"`);
    process.stdout.write(`   …${d.status} (${i * 5}s)\r`);
    await sleep(5000);
  }
  throw new Error('Timeout.');
}

for (const job of jobs) {
  console.log(`\n🎨 ${job.name} …`);
  try {
    const q = await submit(job);
    const done = await poll(q.status_url || `${BASE}/requests/${q.request_id}/status`);
    let idx = 0;
    for (const img of done.images || []) {
      const suffix = (done.images.length > 1 ? `-${++idx}` : '');
      const dest = path.join(outDir, `${job.name}${suffix}.jpg`);
      const r = await fetch(img.url);
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      console.log(`   ✅ ${path.relative(process.cwd(), dest)}`);
    }
  } catch (e) {
    console.error(`   ❌ ${job.name}: ${e.message}`);
  }
}
console.log('\nFertig → scripts/generated/. Danach optional per sharp in public/img/ optimieren.');

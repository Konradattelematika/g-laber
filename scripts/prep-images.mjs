#!/usr/bin/env node
/**
 * Erzeugt alle Web-Bilder:
 *   - public/img/cover-{480,768,1080}.webp  (Hero/Cards, aus scripts/cover-source.png)
 *   - public/img/roger.webp / jana.webp     (Host-Portraits, aus scripts/{roger,jana}-source.jpg)
 *   - public/og.jpg                          (1200×630 Open-Graph)
 *   - public/apple-touch-icon.png            (180×180)
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'scripts/cover-source.png');
const PETROL = '#01516a';

for (const w of [480, 768, 1080]) {
  await sharp(SRC).resize(w, w).webp({ quality: 82 }).toFile(join(root, `public/img/cover-${w}.webp`));
}

// Host-Portraits aus den echten Fotos: 4:5-Hochformat (800×1000), mittig gecovert.
await sharp(join(root, 'scripts/roger-source.jpg'))
  .resize(800, 1000, { fit: 'cover', position: 'centre' })
  .webp({ quality: 82 }).toFile(join(root, 'public/img/roger.webp'));
await sharp(join(root, 'scripts/jana-source.jpg'))
  .resize(800, 1000, { fit: 'cover', position: 'centre' })
  .webp({ quality: 82 }).toFile(join(root, 'public/img/jana.webp'));

// OG-Bild: Cover mittig auf Petrol-Fläche.
const cover = await sharp(SRC).resize(560, 560).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: PETROL } })
  .composite([{ input: cover, left: 320, top: 35 }])
  .jpeg({ quality: 85 })
  .toFile(join(root, 'public/og.jpg'));

await sharp(SRC).resize(180, 180).png().toFile(join(root, 'public/apple-touch-icon.png'));
console.log('Bilder erzeugt → public/');

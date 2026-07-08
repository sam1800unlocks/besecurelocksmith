#!/usr/bin/env node
/**
 * Generate WebP (+ AVIF for larger photos) siblings for every raster under
 * public/img, WITHOUT touching the originals (they stay as fallbacks).
 *   foo.png -> foo.webp  (+ foo.avif if the source is a sizeable photo)
 *
 * Run:  node scripts/gen-webp.mjs
 * Idempotent: skips a sibling that's already newer than its source.
 */
import sharp from 'sharp';
import { readdir, stat, utimes } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'public/img';
const RASTER = new Set(['.png', '.jpg', '.jpeg']);
const AVIF_MIN_BYTES = 100 * 1024; // also emit AVIF for sources over ~100 KB
const Q = { webp: 80, avif: 55 };

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) yield* walk(p);
    else yield { p, size: s.size, mtime: s.mtimeMs };
  }
}

let srcTotal = 0, webpTotal = 0, avifTotal = 0, made = 0, skipped = 0;

for await (const { p, size, mtime } of walk(ROOT)) {
  const ext = extname(p).toLowerCase();
  if (!RASTER.has(ext)) continue;
  srcTotal += size;
  const base = p.slice(0, -ext.length);
  const targets = [['.webp', Q.webp, 'webp']];
  if (size >= AVIF_MIN_BYTES) targets.push(['.avif', Q.avif, 'avif']);

  for (const [outExt, quality, fmt] of targets) {
    const out = base + outExt;
    if (existsSync(out) && (await stat(out)).mtimeMs >= mtime) { skipped++; continue; }
    const img = sharp(p);
    const info = await (fmt === 'webp' ? img.webp({ quality }) : img.avif({ quality })).toFile(out);
    if (fmt === 'webp') webpTotal += info.size; else avifTotal += info.size;
    made++;
  }
}

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`generated ${made} files, skipped ${skipped}`);
console.log(`originals:        ${kb(srcTotal)}`);
console.log(`webp (all):       ${kb(webpTotal)}  (${Math.round((1 - webpTotal / srcTotal) * 100)}% vs originals)`);
console.log(`avif (photos>100KB): ${kb(avifTotal)}`);

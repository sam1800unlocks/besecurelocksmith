#!/usr/bin/env node
/**
 * Optimize raster images under public/img IN PLACE.
 * - Resizes down to a sensible max width per folder (never upscales).
 * - Re-encodes preserving the original format + filename (so all string
 *   references in components / content collections keep working).
 * - Skips SVGs and anything already at/under its cap that wouldn't shrink.
 *
 * Run:  npm run optimize:images
 * Safe to run once per image; see docs/superpowers/IMAGES.md for the workflow.
 */
import sharp from 'sharp';
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';

const ROOT = 'public/img';

// Max rendered width (CSS px) × ~2 for retina, by folder prefix under public/img.
const CAPS = [
  ['services/cards', 800],       // homepage cards (~400px)
  ['services/commercial', 1100], // in-article figures (≤440 float / ~600 mobile)
  ['businesses', 240],           // logo tiles (~160px)
  ['credentials', 260],          // credential logos
  ['clients', 300],              // client logo wall
  ['press', 380],                // press logos
  ['pm', 140],                   // PM feature icons (~40px)
  ['social', 0],                 // svgs only — skip
];
const DEFAULT_CAP = 900;

const Q = { webp: 78, jpeg: 80 }; // quality

function capFor(rel) {
  for (const [prefix, cap] of CAPS) if (rel.startsWith(prefix + '/')) return cap;
  return DEFAULT_CAP;
}

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let before = 0, after = 0, changed = 0, skipped = 0;
for await (const path of walk(ROOT)) {
  const ext = extname(path).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) { skipped++; continue; }
  const rel = relative(ROOT, path);
  const cap = capFor(rel);
  if (cap === 0) { skipped++; continue; }

  const input = await readFile(path);
  before += input.length;
  const img = sharp(input, { failOn: 'none' });
  const meta = await img.metadata();

  let pipe = sharp(input, { failOn: 'none' }).rotate(); // respect EXIF orientation
  if (meta.width && meta.width > cap) pipe = pipe.resize({ width: cap, withoutEnlargement: true });
  if (ext === '.webp') pipe = pipe.webp({ quality: Q.webp });
  else if (ext === '.png') pipe = pipe.png({ compressionLevel: 9, palette: true });
  else pipe = pipe.jpeg({ quality: Q.jpeg, mozjpeg: true });

  const out = await pipe.toBuffer();
  // Only overwrite if we actually saved bytes.
  if (out.length < input.length) {
    await writeFile(path, out);
    after += out.length;
    changed++;
    console.log(`  ${rel}: ${(input.length/1024).toFixed(0)}KB -> ${(out.length/1024).toFixed(0)}KB`);
  } else {
    after += input.length;
  }
}

console.log(`\nOptimized ${changed} image(s) (${skipped} skipped).`);
console.log(`Total raster: ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB  (saved ${((1-after/before)*100).toFixed(0)}%)`);

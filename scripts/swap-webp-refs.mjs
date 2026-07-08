#!/usr/bin/env node
/**
 * Swap raster image references to .webp in content/data JSON, but only where a
 * .webp sibling actually exists in public/. Skips refs already ending in .webp.
 *   "/img/foo.png"  -> "/img/foo.webp"
 *
 * Run:  node scripts/swap-webp-refs.mjs
 */
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIRS = ['src/content', 'src/data'];
// match /img/…(.png|.jpg|.jpeg) NOT already followed by .webp; end at a quote,
// paren, whitespace, query, or backslash so we don't eat trailing markup.
const RE = /(\/img\/[^"'\\)\s?]+?)\.(png|jpe?g)(?=["'\\)\s?]|\\)/g;

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) yield* walk(p);
    else if (extname(p) === '.json') yield p;
  }
}

let files = 0, swaps = 0, missing = new Set();
for (const dir of DIRS) {
  if (!existsSync(dir)) continue;
  for await (const file of walk(dir)) {
    const orig = await readFile(file, 'utf8');
    let changed = 0;
    const out = orig.replace(RE, (m, base) => {
      const webpFsPath = 'public' + base + '.webp';
      if (!existsSync(webpFsPath)) { missing.add(base); return m; } // no sibling → leave as-is
      changed++;
      return base + '.webp';
    });
    if (changed) { await writeFile(file, out); files++; swaps += changed; }
  }
}
console.log(`swapped ${swaps} refs across ${files} files`);
if (missing.size) console.log(`left ${missing.size} refs unchanged (no .webp sibling):`, [...missing].slice(0, 10));

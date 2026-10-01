#!/usr/bin/env node
/**
 * Import one post from the "Blog Planner" tab of the Be Secure Client Project
 * Planner sheet into src/content/blog/<slug>.json, with its featured image.
 *
 *   node scripts/import-blog-post.mjs <row.json> <doc.html> [--category "..."] [--force]
 *
 * row.json — the planner row:
 *   { "date": "2026-08-03",            // "Scheduled for" (ISO)
 *     "title": "...",                  // Title
 *     "url": "https://besecurelocksmith.com/blog/<slug>/",   // Live URL
 *     "seoTitle": "...",               // SEO Title
 *     "description": "...",            // Description
 *     "photo": "https://..." }         // Blog Post Featured Image (column L)
 * doc.html — the linked Google Doc's text (the ```html block Michelle writes;
 *   markdown backslash-escapes from a Drive export are tolerated).
 *
 * Applies the standing import rules: sheet metadata wins over the doc's
 * comments, the doc's leading <h2> is dropped (the page renders the title as
 * the H1), absolute besecurelocksmith.com links become relative, and bold is
 * never wrapped around a link. Accuracy review (claims the client doesn't
 * offer) is NOT automated — read the output before shipping.
 *
 * Photo column accepts any public image URL: a job photo from the client's
 * feed (be-secure-receptionist.fly.dev/p/…), a Google Drive file shared as
 * "anyone with the link", or a Dropbox share link.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};
const category = flag('--category');
const force = args.includes('--force') && args.splice(args.indexOf('--force'), 1);
const [rowPath, docPath] = args;
if (!rowPath || !docPath) {
  console.error('usage: import-blog-post.mjs <row.json> <doc.html> [--category "..."] [--force]');
  process.exit(1);
}

const row = JSON.parse(readFileSync(rowPath, 'utf8'));
for (const k of ['date', 'title', 'url', 'seoTitle', 'description', 'photo']) {
  if (!row[k]) throw new Error(`row.json is missing "${k}"`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) throw new Error(`date must be YYYY-MM-DD, got ${row.date}`);

const slug = new URL(row.url).pathname.replace(/^\/blog\//, '').replace(/\/$/, '');
if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`unexpected slug "${slug}" from ${row.url}`);
const outJson = `src/content/blog/${slug}.json`;
if (existsSync(outJson) && !force) throw new Error(`${outJson} exists — pass --force to overwrite`);

// ---------- body ----------
let html = readFileSync(docPath, 'utf8')
  .replace(/\\([\\`*_{}[\]()#+\-.!<>"'|~=])/g, '$1') // undo markdown escapes
  .replace(/^[\s\S]*?```html/, '')                   // inside the ```html fence
  .replace(/```[\s\S]*$/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<\/?(article|section|main|div)\b[^>]*>/g, '')
  .replace(/https?:\/\/(www\.)?besecurelocksmith\.com(?=\/)/g, '')
  .replace(/<(strong|b)>\s*(<a\b[^>]*>[\s\S]*?<\/a>)\s*<\/\1>/g, '$2')
  .trim();

// Split into top-level blocks (p, headings, lists, figures, tables, blockquotes).
const blocks = [];
const re = /<(p|h[1-6]|ul|ol|figure|table|blockquote)\b[^>]*>[\s\S]*?<\/\1>/g;
for (const m of html.matchAll(re)) blocks.push(m[0].replace(/\s*\n\s*/g, ' ').replace(/>\s+</g, '><').trim());
const leftover = html.replace(re, '').replace(/\s+/g, '');
if (leftover) console.warn(`WARNING: content outside block tags was dropped: ${leftover.slice(0, 120)}…`);
if (/^<h[12]\b/.test(blocks[0] ?? '')) blocks.shift(); // title is the page's H1
if (blocks.length < 3) throw new Error(`only ${blocks.length} blocks parsed — check the doc`);

// ---------- photo ----------
function photoUrl(u) {
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([\w-]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (/dropbox\.com/.test(u)) return u.replace(/([?&])dl=0/, '$1dl=1').replace(/(\?|&)raw=0/, '$1raw=1') + (/[?&](dl|raw)=1/.test(u) ? '' : (u.includes('?') ? '&dl=1' : '?dl=1'));
  return u;
}
const res = await fetch(photoUrl(row.photo), { redirect: 'follow' });
if (!res.ok) throw new Error(`photo download failed: HTTP ${res.status} for ${row.photo}`);
const type = res.headers.get('content-type') || '';
if (!type.startsWith('image/')) {
  throw new Error(`photo link returned ${type || 'no content-type'}, not an image — for Google Drive, share the file as "Anyone with the link"`);
}
const src = Buffer.from(await res.arrayBuffer());
const base = `public/img/blog/${slug}`;
// Rotate per EXIF, crop to a 16:10 landscape (the post hero renders at natural
// aspect and cards crop to landscape — a portrait phone photo made a ~1000px
// tall hero), keep the most detailed region (sharp's "attention" strategy finds
// the lock, not the door panel), and strip metadata (sharp drops it by default).
const img = sharp(src).rotate().resize({ width: 1200, height: 750, fit: 'cover', position: sharp.strategy.attention });
await img.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${base}.jpg`);
await img.clone().webp({ quality: 80 }).toFile(`${base}.webp`);
await img.clone().avif({ quality: 55 }).toFile(`${base}.avif`);

// ---------- metadata ----------
const inferCategory = (t) =>
  /\bsafes?\b/i.test(t) ? 'Safe Locksmith'
  : /\b(car|vehicle|ignition|key fob|transponder|auto)/i.test(t) ? 'Automotive Locksmith'
  : /\b(business|commercial|office|property manager|landlord|tenant|exit door|ic core|master key)/i.test(t) ? 'Commercial Locksmith'
  : 'Residential Locksmith';

const post = {
  title: row.title,
  slug,
  excerpt: row.description,
  image: `/img/blog/${slug}.webp`,
  category: category ?? inferCategory(row.title),
  date: row.date,
  url: `https://besecurelocksmith.com/blog/${slug}/`,
  author: 'Netta Kaiden',
  heroImage: `/img/blog/${slug}.webp`,
  metaTitle: row.seoTitle,
  metaDescription: row.description,
  body: blocks,
};
writeFileSync(outJson, JSON.stringify(post, null, 2) + '\n');

const meta = await sharp(`${base}.jpg`).metadata();
console.log(`wrote ${outJson}`);
console.log(`  ${blocks.length} body blocks, category "${post.category}", date ${post.date}`);
console.log(`  image ${meta.width}x${meta.height} -> ${base}.{jpg,webp,avif}`);
const links = [...blocks.join('').matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log(`  links: ${links.join(', ') || '(none)'}`);
if (!links.includes('/contact-us/')) console.log('  NOTE: no /contact-us/ link — add one to the closing paragraph');

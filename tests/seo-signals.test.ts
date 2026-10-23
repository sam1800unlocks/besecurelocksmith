import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { relatedPosts } from '../src/lib/related';

const dist = (p: string) => {
  const f = resolve(__dirname, '..', 'dist', p);
  if (!existsSync(f)) throw new Error(`dist/${p} missing — run \`npm run build\` first`);
  return readFileSync(f, 'utf8');
};
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const ORG = 'https://besecurelocksmith.com/#organization';

test('related posts form a ring: every post is picked by another post', () => {
  const posts = [
    ...['a', 'b', 'c', 'd', 'e'].map((s, i) => ({ slug: s, category: 'X', date: `2026-01-0${i + 1}`, body: ['x'] })),
    { slug: 'solo', category: 'Y', date: '2026-02-01', body: ['x'] },
  ];
  const picked = new Set(posts.flatMap((p) => relatedPosts(p, posts, 3).map((r) => r.slug)));
  expect(picked.size).toBe(posts.length);
  for (const p of posts) {
    const r = relatedPosts(p, posts, 3);
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.slug)).not.toContain(p.slug);
  }
});

test('every built blog post is linked from at least one other indexable post', () => {
  const dir = resolve(__dirname, '../dist/blog');
  const slugs = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !['page', 'category'].includes(e.name)).map((e) => e.name);
  const linked = new Set<string>();
  for (const s of slugs) {
    for (const m of dist(`blog/${s}/index.html`).matchAll(/href="\/blog\/([^"/]+)\/"/g)) if (m[1] !== s) linked.add(m[1]);
  }
  expect(slugs.filter((s) => !linked.has(s))).toEqual([]);
});

test('service, product, blog and job schema point at the one Organization @id', () => {
  const nodes = [
    ...jsonLd(dist('services/lock-rekeying/index.html')),
    ...jsonLd(dist('services/automotive-locksmith/index.html')),
    ...jsonLd(dist('products/deadbolts/index.html')),
    ...jsonLd(dist('blog/smart-locks-vs-traditional-deadbolts/index.html')),
    ...jsonLd(dist('employment/index.html')),
  ];
  const refs = nodes.flatMap((n) => [n.provider, n.publisher, n.hiringOrganization]).filter(Boolean);
  expect(refs.length).toBeGreaterThanOrEqual(5);
  for (const r of refs) expect(r['@id']).toBe(ORG);
});

test('YouTube link and schema sameAs use the same channel', () => {
  const home = dist('index.html');
  expect(home).toContain('href="https://www.youtube.com/@BeSecureLocksmith"');
  expect(home).not.toContain('UCwpODmKG5TrCVIJTzEB6FXA');
});

test('product guide titles fit in 60 characters and carry no city suffix', () => {
  for (const s of ['deadbolts', 'high-security-locks', 'master-key-ic', 'smart-locks']) {
    const t = dist(`products/${s}/index.html`).match(/<title>(.*?)<\/title>/)![1].replace(/&amp;/g, '&');
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t).not.toContain('Gainesville');
  }
});

test('service pages link to their guides and articles', () => {
  const html = dist('services/lock-rekeying/index.html');
  expect(html).toContain('Further Reading');
  expect(html).toContain('href="/products/high-security-locks/"');
  expect(html).toMatch(/href="\/blog\/[^"]*rekey[^"]*\/"/);
});

test('sitemap entries carry lastmod', () => {
  const xml = dist('sitemap-0.xml');
  expect(xml).toMatch(/<loc>https:\/\/besecurelocksmith\.com\/services\/lock-rekeying\/<\/loc><lastmod>\d{4}-\d{2}-\d{2}T/);
});

test('images get a cache header', () => {
  expect(dist('_headers')).toMatch(/\/img\/\*\s+Cache-Control: public, max-age=2592000/);
});

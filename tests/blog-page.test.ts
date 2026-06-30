import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../dist/blog/index.html');

test('Blog index builds with hero, cards, and SEO', () => {
  if (!existsSync(p)) throw new Error('dist blog page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Blog Gainesville, FL - Tips &amp; Lock Guides</title>');
  expect(html).toContain('Be Secure Locksmith Blog');               // H1
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"Blog"');
  // One card per post (each card has a "Read article" affordance)
  const postCount = readdirSync(resolve(__dirname, '../src/content/blog')).filter((f) => f.endsWith('.json')).length;
  expect((html.match(/Read article/g) || []).length).toBe(postCount);
  // Posts with a built page link internally
  expect(html).toContain('href="/blog/transponder-key-vs-remote-head-key-vs-smart-key-in-dunnellon-fl-what-your-car-actually-uses/"');
  expect(html).toContain('Commercial Locksmith');                   // a category badge
});

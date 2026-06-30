import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (rel: string) => {
  const f = resolve(__dirname, '..', rel);
  if (!existsSync(f)) throw new Error(`${rel} missing — run \`npm run build\` first`);
  return readFileSync(f, 'utf8');
};
const PAGE_SIZE = 9;

test('Blog index (page 1) is indexed, shows a page of cards, chips, and a pager', () => {
  const html = read('dist/blog/index.html');
  expect(html).toContain('<title>Locksmith Blog Gainesville, FL - Tips &amp; Lock Guides</title>');
  expect(html).toContain('Be Secure Locksmith Blog');               // H1
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"Blog"');
  expect(html).not.toContain('name="robots" content="noindex');     // page 1 IS indexed
  expect((html.match(/Read article/g) || []).length).toBe(PAGE_SIZE); // one page of cards
  expect(html).toContain('Page 1 of');                              // pager
  expect(html).toContain('>All<');                                  // category chips
  expect(html).toContain('href="/blog/category/automotive-locksmith/"');
  // newest post (transponder) is on page 1 and links internally
  expect(html).toContain('href="/blog/transponder-key-vs-remote-head-key-vs-smart-key-in-dunnellon-fl-what-your-car-actually-uses/"');
});

test('Paginated pages exist and are noindex', () => {
  const html = read('dist/blog/page/2/index.html');
  expect(html).toContain('name="robots" content="noindex, follow"');
  expect((html.match(/Read article/g) || []).length).toBe(PAGE_SIZE);
  expect(html).toContain('Page 2 of');
  expect(html).toContain('href="/blog/"');                          // Previous → page 1
});

test('Category pages exist, are noindex, and list only that category', () => {
  const html = read('dist/blog/category/automotive-locksmith/index.html');
  expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('Automotive Locksmith');                   // H1 / breadcrumb
  expect((html.match(/Read article/g) || []).length).toBe(13);      // all 13 automotive posts, no pagination
});

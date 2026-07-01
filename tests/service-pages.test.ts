import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SLUGS = [
  'car-key-programming', 'car-key-replacement', 'emergency-lockouts', 'ignition-repair',
  'interchangeable-core-locks', 'key-duplication', 'lock-rekeying', 'lock-repair',
  'mailbox-lock-installation', 'master-key-systems', 'new-lock-installation',
  'property-management', 'safe-locksmith', 'smart-lock-installation',
];
const dist = resolve(__dirname, '..', 'dist');

test.each(SLUGS)('service page /services/%s/ renders with content and intact images', (slug) => {
  const p = join(dist, 'services', slug, 'index.html');
  if (!existsSync(p)) throw new Error(`dist page missing for ${slug} — run \`npm run build\` first`);
  const html = readFileSync(p, 'utf8');

  // hero, breadcrumb, body, structured data
  expect(html).toMatch(/<h1[^>]*>\s*\S/);
  expect(html).toContain('article-body');
  expect(html).toContain('How It Works');
  expect(html).toContain('"@type":"Service"');
  expect(html).toContain('"@type":"BreadcrumbList"');

  // no extraction artifacts in the body
  const body = html.slice(html.indexOf('article-body'), html.indexOf('</article>'));
  expect(body).not.toMatch(/<a[^>]*href="https:\/\/besecurelocksmith/);
  expect(body).not.toMatch(/&#8217;|---img|data:image\/gif/);

  // every body image points at a file that exists on disk
  for (const m of body.matchAll(/src="(\/img\/services\/[^"]+)"/g)) {
    expect(existsSync(resolve(__dirname, '..', 'public' + m[1]))).toBe(true);
  }
});

test('pages with live FAQs render the FAQ section', () => {
  for (const slug of ['car-key-replacement', 'mailbox-lock-installation']) {
    const html = readFileSync(join(dist, 'services', slug, 'index.html'), 'utf8');
    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('"@type":"FAQPage"');
  }
});

test('pages with relevant price-list items render a pricing section', () => {
  for (const slug of ['car-key-programming', 'emergency-lockouts', 'lock-rekeying', 'new-lock-installation', 'smart-lock-installation']) {
    const html = readFileSync(join(dist, 'services', slug, 'index.html'), 'utf8');
    expect(html).toContain('Pricing');
    expect(html).toMatch(/\$\d+ and up/);
    expect(html).toContain('See full price list');
  }
});

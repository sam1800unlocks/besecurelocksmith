/**
 * Homepage assembly test — BUILD approach.
 *
 * The container API cannot render this page because the data-driven sections
 * (ServicesGrid, Reviews, Faq) call getCollection() at render time, which is
 * not supported in the vitest + AstroContainer environment (yields
 * "module is not defined" from astro:content-imports).
 *
 * Instead we verify against the built dist/index.html produced by `npm run build`.
 * Run `npm run build` before executing this test suite.
 */
import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const distPath = resolve(__dirname, '../dist/index.html');
const dist = resolve(__dirname, '..', 'dist');
const read = (p: string) => { const f = join(dist, p); if (!existsSync(f)) throw new Error(`dist ${p} missing — run \`npm run build\``); return readFileSync(f, 'utf8'); };

test('homepage composes all sections and never leaks a non-resolved number', () => {
  if (!existsSync(distPath)) {
    throw new Error('dist/index.html missing — run `npm run build` before this test');
  }
  const distHtml = readFileSync(distPath, 'utf-8');
  for (const marker of [
    'Top Local Locksmith in Gainesville',
    'As featured in',
    'Why Choose Be Secure',
    'Trusted Locksmith Services',
    'Commercial Property Management Solutions',
    'Check Out Our Google Reviews',
    'Trust Our Credentials',
    'Be Secure Locksmith FAQs',
    'Ocala, FL 34471',
    'Powered by The Locksmith Agency',
    'action="/api/contact"',
    'Contact Be Secure Locksmith',
  ]) {
    expect(distHtml, `missing marker: "${marker}"`).toContain(marker);
  }
  // Homepage emits a Locksmith org node (combined 2544-review rating) — not the old generic LocalBusiness
  expect(distHtml, 'missing Locksmith org JSON-LD').toContain('"@type":"Locksmith"');
  expect(distHtml, 'missing FAQPage JSON-LD').toContain('"@type":"FAQPage"');
});

test('homepage shows the two-office band before the service-area list', () => {
  const h = read('index.html');
  expect(h).toContain('Visit Our Gainesville &amp; Ocala Offices');
  expect(h).toContain('View Gainesville details');
  expect(h).toContain('View Ocala details');
  // band appears before the ServiceAreas city list (which links Belleview)
  expect(h.indexOf('Visit Our Gainesville')).toBeLessThan(h.indexOf('/service-areas/locksmith-belleview-fl/'));
});

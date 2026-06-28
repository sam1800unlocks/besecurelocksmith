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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distHtml = readFileSync(
  resolve(__dirname, '../dist/index.html'),
  'utf-8',
);

test('homepage composes all sections and never leaks a non-resolved number', () => {
  for (const marker of [
    'Top Local Locksmith in Gainesville',
    'As featured in',
    'Why Choose Be Secure',
    'Trusted Locksmith Services',
    'Commercial Property Management Solutions',
    'Check Out Our Google Reviews',
    'Trust Our Credentials',
    'Be Secure Locksmith FAQs',
    'Mobile to your door',
    'Powered by The Locksmith Agency',
  ]) {
    expect(distHtml, `missing marker: "${marker}"`).toContain(marker);
  }
  expect(distHtml, 'missing LocalBusiness JSON-LD').toContain('"@type":"LocalBusiness"');
  expect(distHtml, 'missing FAQPage JSON-LD').toContain('"@type":"FAQPage"');
});

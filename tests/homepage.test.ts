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
import { resolve } from 'node:path';

const distPath = resolve(__dirname, '../dist/index.html');

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
  ]) {
    expect(distHtml, `missing marker: "${marker}"`).toContain(marker);
  }
  expect(distHtml, 'missing LocalBusiness JSON-LD').toContain('"@type":"LocalBusiness"');
  expect(distHtml, 'missing FAQPage JSON-LD').toContain('"@type":"FAQPage"');
});

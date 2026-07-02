import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../dist/price-list/index.html');

test('Price list page builds with grouped prices, content, and SEO', () => {
  if (!existsSync(p)) throw new Error('dist price-list page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Prices Gainesville, FL - Upfront, No Surprises</title>');
  expect(html).toContain('Be Secure Locksmith Service Prices');     // H1
  // 4 category headings
  for (const g of ['Lockouts', 'Car Keys', 'Locks &amp; Installation', 'Rekeying']) {
    expect(html).toContain(g);
  }
  // exact prices (verbatim)
  for (const price of ['$65 and up', '$120 and up', '$150 and up', '$199 and up', '$80 and up', '$33 and up']) {
    expect(html).toContain(price);
  }
  expect(html).toContain('Auto Key Programming');
  expect(html).toContain('include both parts and labor');           // good-to-know note
  expect(html).toContain('"@type":"BreadcrumbList"');
  // Price-list page carries no business schema (only BreadcrumbList)
  expect(html).not.toContain('"@type":"LocalBusiness"');
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(0);
});

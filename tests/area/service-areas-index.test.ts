import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../../dist/service-areas/index.html');

test('Service-areas index builds with all city links, regions, nearby chips, SEO', () => {
  if (!existsSync(p)) throw new Error('dist service-areas index missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Service Areas - Gainesville &amp; Ocala, FL Pros</title>');
  expect(html).toContain('Our Locksmith Service Areas');            // H1
  // regional group headings
  expect(html).toContain('Gainesville Area');
  expect(html).toContain('Ocala Area');
  // links to all 13 city pages (sampling across both regions + the 3 location pages)
  for (const slug of [
    'locksmith-alachua-fl', 'locksmith-hampton-fl', 'locksmith-newberry-fl',
    'locksmith-gainesville-fl', 'locksmith-lake-city-fl', 'locksmith-ocala-fl',
    'locksmith-belleview-fl', 'locksmith-marion-oaks-ocala-fl', 'locksmith-silver-springs-shores-ocala-fl',
  ]) {
    expect(html).toContain(`href="/service-areas/${slug}/"`);
  }
  // nearby (unlinked) towns
  expect(html).toContain('Archer, FL');
  expect(html).toContain('Dunnellon, FL');
  expect(html).toContain('Summerfield, FL');
  // structured data + dedup
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"ItemList"');
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1);
});

import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const p = resolve(__dirname, '../../dist/service-areas/locksmith-hampton-fl/index.html');

test('Hampton page builds with the unified stack + live links', () => {
  if (!existsSync(p)) throw new Error('dist Hampton page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Hampton, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Hampton, FL');                  // AreaHero H1
  expect(html).toContain('href="/services/emergency-lockouts/"');      // live inline link, relativized
  expect(html).not.toMatch(/href="https:\/\/besecurelocksmith\.com\/services\//); // no absolute service links
  expect(html).toContain('Our Hampton Service Area');                  // AreaMap
  expect(html).toContain('/blog/');                                    // RelatedBlogs
  expect(html).toContain('"@type":"FAQPage"');                         // localized FAQ
  expect(html).not.toContain('Nearby areas we serve');                 // AreaNearby removed
  // Non-office area pages carry no business schema (only the two office pages do)
  expect(html).not.toContain('"@type":"LocalBusiness"');
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(0);
});

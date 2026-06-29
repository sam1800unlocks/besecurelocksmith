import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../../dist/service-areas/locksmith-alachua-fl/index.html');

test('Alachua page builds with the unified stack + SEO', () => {
  if (!existsSync(p)) throw new Error('dist page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Alachua, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Alachua, FL');                  // AreaHero H1
  expect(html).toContain('Your Local, Mobile Locksmith in Alachua, FL'); // LocalIntro
  expect(html).toContain('Trusted Locksmith Services');                // ServicesGrid
  expect(html).toContain('Our Alachua Service Area');                  // AreaMap
  expect(html).toContain('/blog/');                                    // RelatedBlogs
  expect(html).toContain('href="tel:+13527065295"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('"@type":"FAQPage"');                         // localized FAQ
  expect(html).toContain('online-booking.workiz.com');                 // Book Now
  expect(html).not.toContain('Nearby areas we serve');                 // AreaNearby removed
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1); // deduped
});

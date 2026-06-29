import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../../dist/service-areas/locksmith-alachua-fl/index.html');

test('Alachua service-area page builds with correct content + SEO', () => {
  if (!existsSync(p)) throw new Error('dist page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Alachua, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Alachua, FL');                 // cleaned H1
  expect(html).toContain('Your Local, Mobile Locksmith in Alachua, FL');
  expect(html).not.toContain('Alucha');                                // typo fixed
  expect(html).toContain('href="tel:3527065295"');                    // resolved phone
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('online-booking.workiz.com');                // Book Now
});

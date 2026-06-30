import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../dist/contact-us/index.html');

test('Contact page builds with the expected content + SEO', () => {
  if (!existsSync(p)) throw new Error('dist contact page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Contact Our Gainesville, FL Locksmith - Get Service</title>');
  expect(html).toContain('>Contact Us<');                                  // H1 / breadcrumb
  expect(html).toContain('Contact us today to get a free quote');         // hero subhead
  expect(html).toContain('Call Us');                                      // ContactMethods
  expect(html).toContain('Book Online');
  expect(html).toContain('action="/api/contact"');                        // contact form
  expect(html).toContain('901 NW 8th Ave');                               // Gainesville office (ServiceAreas)
  expect(html).toContain('217 SE 1st Ave');                               // Ocala office (ServiceAreas)
  expect(html).toContain('Booked an appointment?');                       // what's-next band
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1);  // deduped
});

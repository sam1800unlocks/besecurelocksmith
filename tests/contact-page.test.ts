import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dist = resolve(__dirname, '..', 'dist');
const read = (p: string) => { const f = join(dist, p); if (!existsSync(f)) throw new Error(`dist ${p} missing — run \`npm run build\``); return readFileSync(f, 'utf8'); };

const p = join(dist, 'contact-us/index.html');

test('Contact page builds with the expected content + SEO', () => {
  if (!existsSync(p)) throw new Error('dist contact page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('Contact Our Gainesville');
  expect(html).toContain('>Contact Us<');                                  // H1 / breadcrumb
  expect(html).toContain('Contact us today to get a free quote');         // hero subhead
  expect(html).toContain('Call Us');                                      // ContactMethods
  expect(html).toContain('Book Online');
  expect(html).toContain('action="/api/contact"');                        // contact form
  expect(html).toContain('901 NW 8th Ave');                               // Gainesville office (OfficesBand)
  expect(html).toContain('217 SE 1st Ave');                               // Ocala office (OfficesBand)
  expect(html).toContain('Booked an appointment?');                       // what's-next band
  expect(html).toContain('"@type":"BreadcrumbList"');
  // Contact page carries no business schema (only BreadcrumbList)
  expect(html).not.toContain('"@type":"LocalBusiness"');
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(0);
});

test('contact page: dual-city title, office cards, no full service-area list', () => {
  const h = read('contact-us/index.html');
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  expect(title).toContain('Gainesville');
  expect(title).toContain('Ocala');
  // OfficesBand rendered
  expect(h).toContain('View Gainesville details');
  expect(h).toContain('View Ocala details');
  // the full multi-city ServiceAreas SECTION is gone. The footer still lists every city,
  // so a city link appears exactly ONCE (footer only) once the section is removed —
  // with the section it appeared twice. Belleview is a stable footer/list city.
  expect((h.match(/\/service-areas\/locksmith-belleview-fl\//g) || []).length).toBe(1);
  // the new single "See all service areas" link is present
  expect(h).toContain('See all service areas');
});

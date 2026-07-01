import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => {
  const f = resolve(__dirname, '..', p);
  if (!existsSync(f)) throw new Error(`dist file missing (${p}) — run \`npm run build\` first`);
  return readFileSync(f, 'utf8');
};

test('Residential page renders alphabetized lock-type chips, pricing, and FAQs', () => {
  const html = read('dist/services/residential-locksmith/index.html');
  expect(html).toContain('Residential Lock Types We Service');
  for (const t of ['Deadbolts (single cylinder)', 'Deadbolts (double cylinder)', 'Handlesets', 'Multipoint locks', 'Door viewers / peepholes', 'Smart / electronic keypad locks']) {
    expect(html).toContain(t);
  }
  // alphabetized: Cabinet chip appears before Deadbolts before Knobs
  expect(html.indexOf('Cabinet / furniture locks')).toBeLessThan(html.indexOf('Deadbolts (double cylinder)'));
  expect(html.indexOf('Deadbolts (single cylinder)')).toBeLessThan(html.indexOf('Knobs'));
  // pricing pulled from the price list
  expect(html).toContain('Residential Locksmith Pricing');
  expect(html).toContain('$33 and up'); // Lock Rekey
  expect(html).toContain('$199 and up'); // Keypad Lock + Installation
  // authored FAQs render
  expect(html).toContain('Frequently Asked Questions');
  expect(html).toContain('Can you rekey my home locks instead of replacing them?');
  expect(html).toContain('application/ld+json');
});

test('Automotive page renders alphabetized lock-type chips, pricing, and live FAQs', () => {
  const html = read('dist/services/automotive-locksmith/index.html');
  expect(html).toContain('Automotive Lock Types We Service');
  for (const t of ['Door locks', 'Ignition lock / cylinder', 'Toolbox lock (truck bed)', 'Spare-tire lock', 'Wheel / lug-nut locks']) {
    expect(html).toContain(t);
  }
  // alphabetized: Center console before Door locks before Ignition
  expect(html.indexOf('Center console lock')).toBeLessThan(html.indexOf('Door locks'));
  expect(html.indexOf('Door locks')).toBeLessThan(html.indexOf('Ignition lock / cylinder'));
  // pricing pulled from the price list
  expect(html).toContain('Automotive Locksmith Pricing');
  expect(html).toContain('$120 and up'); // Auto Key Programming
  expect(html).toContain('$150 and up'); // Auto Key Replacement
  // live FAQs migrated
  expect(html).toContain('Frequently Asked Questions');
  expect(html).toContain('What types of vehicles do your automotive locksmiths service?');
});

test('Footer links the new residential & automotive service pages', () => {
  const html = read('dist/index.html');
  expect(html).toContain('href="/services/residential-locksmith/"');
  expect(html).toContain('href="/services/automotive-locksmith/"');
  // footer no longer points the Services column at the generic /services/ landing
  expect(html).not.toMatch(/<a href="\/services\/"[^>]*>\s*Residential\s*</);
});

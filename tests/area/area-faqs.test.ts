import { test, expect } from 'vitest';
import { buildAreaFaqs } from '../../src/lib/area-faqs';
import { site } from '../../src/config/site';

test('interpolates city/county/zips/office', () => {
  const faqs = buildAreaFaqs({ city: 'Hampton', county: 'Bradford County', zips: ['32044'] });
  expect(faqs.length).toBeGreaterThanOrEqual(3);
  const all = JSON.stringify(faqs);
  expect(all).toContain('Hampton');
  expect(all).toContain('Bradford County');
  expect(all).toContain('32044');
  expect(all).not.toContain('undefined');
});

test('reads the license number from site config', () => {
  const faqs = buildAreaFaqs({ city: 'Hampton' });
  expect(JSON.stringify(faqs)).toContain(site.license);
});

test('omits ZIPs gracefully when none', () => {
  const faqs = buildAreaFaqs({ city: 'X', county: 'Y County' });
  expect(JSON.stringify(faqs)).not.toContain('undefined');
});

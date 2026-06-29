import { test, expect } from 'vitest';
import { buildAreaFaqs } from '../../src/lib/area-faqs';

test('interpolates city/county/zips/response/office', () => {
  const faqs = buildAreaFaqs({ city: 'Hampton', county: 'Bradford County', zips: ['32044'], responseTime: '~30 min' }, 'Gainesville');
  expect(faqs.length).toBeGreaterThanOrEqual(3);
  const all = JSON.stringify(faqs);
  expect(all).toContain('Hampton');
  expect(all).toContain('Bradford County');
  expect(all).toContain('32044');
  expect(all).toContain('Gainesville');
  expect(all).not.toContain('undefined');
});

test('omits ZIPs gracefully when none', () => {
  const faqs = buildAreaFaqs({ city: 'X', county: 'Y County', responseTime: '~30 min' }, 'Gainesville');
  expect(JSON.stringify(faqs)).not.toContain('undefined');
});

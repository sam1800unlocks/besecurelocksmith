import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

test('Alachua service-area entry has the required fields', () => {
  const d = JSON.parse(readFileSync(new URL('../../src/content/service-areas/locksmith-alachua-fl.json', import.meta.url), 'utf8'));
  expect(d.slug).toBe('locksmith-alachua-fl');
  expect(d.city).toBe('Alachua');
  expect(d.title).toBe('Locksmith Alachua, FL - Home, Car & Business Lockouts');
  expect(d.location).toBe('main');
  expect(Array.isArray(d.intro) && d.intro.length).toBeGreaterThan(0);
});

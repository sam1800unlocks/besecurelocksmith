import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../../src/content/service-areas/locksmith-hampton-fl.json', import.meta.url), 'utf8'));

test('Hampton is rich with live body, relativized links, and facts', () => {
  expect(d.variant).toBe('rich');
  expect(d.title).toBe('Locksmith Hampton, FL - Home, Car & Business Lockouts');
  expect(d.county).toBe('Bradford County');
  expect(d.zips).toContain('32044');
  const body = d.intro.join('');
  expect(body).toContain('href="/services/emergency-lockouts/"');  // inline link preserved
  expect(body).not.toContain('besecurelocksmith.com');             // relativized
  expect(d.intro.length).toBeGreaterThan(5);
});

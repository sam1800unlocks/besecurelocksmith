import { test, expect } from 'vitest';
import { resolveLocation, resolvePhone, type Location } from '../src/lib/locations';

test('main location carries the general number', () => {
  const loc = resolveLocation('main');
  expect(loc.phone).toBe('352-706-5295');
  expect(loc.nap.zip).toBe('32601');
});

test('unknown or missing slug falls back to main', () => {
  expect(resolveLocation('nope').slug).toBe('main');
  expect(resolveLocation().slug).toBe('main');
});

test('resolvePhone uses the location number then the default', () => {
  const fixture: Location = { slug: 'x', phone: '111-222-3333', city: 'X', nap: { street:'', city:'', state:'FL', zip:'' }, hours: '' };
  expect(resolvePhone(fixture)).toBe('111-222-3333');
});

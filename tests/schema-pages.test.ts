import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dist = resolve(__dirname, '..', 'dist');
const read = (p: string) => { const f = join(dist, p); if (!existsSync(f)) throw new Error(`dist ${p} missing — run \`npm run build\``); return readFileSync(f, 'utf8'); };

test('homepage emits the full org Locksmith node', () => {
  const h = read('index.html');
  expect(h).toContain('"@id":"https://besecurelocksmith.com/#organization"');
  expect(h).toContain('"reviewCount":"2544"');
  expect(h).toContain('"email":"info@besecurelocksmith.com"');
  expect(h).toContain('"@type":"OfferCatalog"');
});

test('a generic page emits NO Organization/LocalBusiness schema', () => {
  const h = read('price-list/index.html');
  expect(h).not.toContain('"@type":"LocalBusiness"');
  expect(h).not.toContain('#organization');
  expect(h).not.toContain('aggregateRating');
});

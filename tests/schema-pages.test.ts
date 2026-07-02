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

test('Gainesville office page: location node + lean org, correct address & rating', () => {
  const h = read('service-areas/locksmith-gainesville-fl/index.html');
  expect(h).toContain('"@id":"https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness"');
  expect(h).toContain('"streetAddress":"901 NW 8th Ave c17"');
  expect(h).toContain('"reviewCount":"1330"');
  expect(h).toContain('cid=1525264823828817691');
  expect(h).toContain('"parentOrganization"');
  expect(h).toContain('#organization');       // lean org node present
  expect(h).not.toContain('"reviewCount":"2544"'); // no combined rating here
  expect(h).not.toContain('"@type":"OfferCatalog"'); // no catalog on lean org
});

test('Ocala office page uses the Ocala address + rating', () => {
  const h = read('service-areas/locksmith-ocala-fl/index.html');
  expect(h).toContain('"streetAddress":"217 SE 1st Ave Suite 200-50"');
  expect(h).toContain('"reviewCount":"1214"');
  expect(h).toContain('cid=4138983982412980004');
  expect(h).not.toContain('"streetAddress":"901 NW 8th Ave c17"'); // NOT Gainesville schema address
});

test('a non-office area page has no business schema', () => {
  const h = read('service-areas/locksmith-alachua-fl/index.html');
  expect(h).not.toContain('#localbusiness');
  expect(h).not.toContain('#organization');
  expect(h).not.toContain('"@type":"LocalBusiness"');
});

test('contact page shows both offices and no business schema', () => {
  const h = read('contact-us/index.html');
  expect(h).toContain('Gainesville, FL 32601');
  expect(h).toContain('Ocala, FL 34471');
  expect(h).not.toContain('"@type":"LocalBusiness"');
  expect(h).not.toContain('#organization');
});

test('rating display uses the combined 2,544', () => {
  const h = read('index.html');
  expect(h).toContain('2,544');            // formatted via toLocaleString
  expect(h).not.toContain('2,551');
});

test('About title covers both cities', () => {
  const h = read('about/index.html');
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  expect(title).toContain('Gainesville');
  expect(title).toContain('Ocala');
});

import { test, expect } from 'vitest';
import { offices } from '../src/config/offices';
import { schemaData } from '../src/config/schema-data';
import { organizationNode, locationNode, officeBySlug } from '../src/lib/schema';

test('offices carry the per-store schema data', () => {
  expect(offices.gainesville.reviewCount).toBe('1330');
  expect(offices.ocala.reviewCount).toBe('1214');
  expect(offices.gainesville.cid).toBe('1525264823828817691');
  expect(offices.ocala.geo).toEqual({ lat: 29.1844122, lng: -82.1355775 });
  expect(offices.gainesville.sameAs[0]).toContain('kgmid=/g/1ptx2pkfg');
});

test('org schema data is present and consistent', () => {
  expect(schemaData.combinedRating.reviewCount).toBe('2544');
  expect(Number(offices.gainesville.reviewCount) + Number(offices.ocala.reviewCount)).toBe(2544);
  expect(schemaData.email).toBe('info@besecurelocksmith.com');
  expect(schemaData.foundingDate).toBe('2012-04-15');
  expect(schemaData.founder.name).toBe('Netta Kaiden');
  expect(schemaData.catalog.length).toBeGreaterThan(10);
  expect(schemaData.areaServed.length).toBe(10);
});

test('full org node (homepage) has combined rating + catalog + subOrganization', () => {
  const n = organizationNode({ homepage: true });
  expect(n['@type']).toBe('Locksmith');
  expect(n['@id']).toBe('https://besecurelocksmith.com/#organization');
  expect(n.aggregateRating.reviewCount).toBe('2544');
  expect(n.email).toBe('info@besecurelocksmith.com');
  expect(Array.isArray(n.hasOfferCatalog.itemListElement)).toBe(true);
  expect(n.subOrganization.map((s: any) => s['@id'])).toEqual([
    'https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness',
    'https://besecurelocksmith.com/service-areas/locksmith-ocala-fl/#localbusiness',
  ]);
  expect(n.founder[0].name).toBe('Netta Kaiden');
});

test('lean org node omits combined rating + catalog', () => {
  const n = organizationNode({ homepage: false });
  expect(n['@id']).toBe('https://besecurelocksmith.com/#organization');
  expect(n.aggregateRating).toBeUndefined();
  expect(n.hasOfferCatalog).toBeUndefined();
  expect(n.founder[0].name).toBe('Netta Kaiden');
});

test('location node is per-store and lean', () => {
  const g = locationNode('gainesville');
  expect(g['@id']).toBe('https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness');
  expect(g.name).toBe('Be Secure Locksmith — Gainesville');
  expect(g.telephone).toBe('1-352-290-7035');
  expect(g.address.streetAddress).toBe('901 NW 8th Ave c17');
  expect(g.aggregateRating.reviewCount).toBe('1330');
  expect(g.hasMap).toBe('https://www.google.com/maps/place/?cid=1525264823828817691');
  expect(g.parentOrganization['@id']).toBe('https://besecurelocksmith.com/#organization');
  expect(g.hasOfferCatalog).toBeUndefined();
  const o = locationNode('ocala');
  expect(o.aggregateRating.reviewCount).toBe('1214');
  expect(o.geo.latitude).toBe(29.1844122);
});

test('officeBySlug resolves the two office pages', () => {
  expect(officeBySlug('locksmith-gainesville-fl')?.key).toBe('gainesville');
  expect(officeBySlug('locksmith-ocala-fl')?.key).toBe('ocala');
  expect(officeBySlug('locksmith-alachua-fl')).toBeUndefined();
});

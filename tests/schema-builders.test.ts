import { test, expect } from 'vitest';
import { offices } from '../src/config/offices';
import { schemaData } from '../src/config/schema-data';
import { site } from '../src/config/site';
import { organizationNode, organizationRef, cityServiceNode, locationNode, officeBySlug, serviceAreaServed, serviceGeoLabel } from '../src/lib/schema';

test('offices carry the per-store schema data', () => {
  expect(offices.gainesville.reviewCount).toBe('1371');
  expect(offices.ocala.reviewCount).toBe('1246');
  expect(offices.gainesville.cid).toBe('1525264823828817691');
  expect(offices.ocala.geo).toEqual({ lat: 29.1844122, lng: -82.1355775 });
  expect(offices.gainesville.sameAs[0]).toContain('kgmid=/g/1ptx2pkfg');
});

test('org schema data is present and consistent', () => {
  expect(schemaData.email).toBe('info@besecurelocksmith.com');
  expect(schemaData.foundingDate).toBe('2012-04-15');
  expect(schemaData.founder.name).toBe('Netta Kaiden');
  expect(schemaData.areaServed.length).toBe(10);
});

test('brand node is an Organization with no office-level properties', () => {
  const n: any = organizationNode();
  expect(n['@type']).toBe('Organization');
  expect(n['@id']).toBe('https://besecurelocksmith.com/#organization');
  expect(n.telephone).toBe('1-352-706-5295');
  expect(n.email).toBe('info@besecurelocksmith.com');
  expect(n.founder[0].name).toBe('Netta Kaiden');
  for (const k of ['address', 'geo', 'hasMap', 'openingHoursSpecification', 'aggregateRating', 'hasOfferCatalog', 'priceRange', 'currenciesAccepted', 'paymentAccepted']) {
    expect(n[k], k).toBeUndefined();
  }
});

test('LocalBusiness-only payment properties sit on each branch', () => {
  for (const key of ['gainesville', 'ocala'] as const) {
    const b = locationNode(key);
    expect(b.priceRange).toBe('$$');
    expect(b.currenciesAccepted).toBe('USD');
    expect(b.paymentAccepted).toBe('Cash, Visa, Mastercard, PayPal');
  }
});

test('brand node references each branch by @id only', () => {
  expect(organizationNode().subOrganization).toEqual([
    { '@id': 'https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness' },
    { '@id': 'https://besecurelocksmith.com/service-areas/locksmith-ocala-fl/#localbusiness' },
  ]);
});

test('brand sameAs carries no single-office profile', () => {
  const urls = organizationNode().sameAs.join(' ');
  expect(urls).not.toContain('kgmid');
  expect(urls).not.toContain('google.com/maps');
  expect(urls).not.toContain('yelp.com');
  expect(urls).toContain('facebook.com/BeSecureLocksmith');
});

test('brand areaServed is the union of both office territories', () => {
  const a: any = organizationNode().areaServed;
  expect(a['@type']).toBe('AdministrativeArea');
  expect(a.containsPlace).toHaveLength(schemaData.areaServed.length);
});

test('organizationRef is a bare @id with no inline type', () => {
  expect(organizationRef()).toEqual({ '@id': 'https://besecurelocksmith.com/#organization' });
});

test('non-office city gets one Service node scoped to that city', () => {
  const n: any = cityServiceNode({ city: 'Alachua', slug: 'locksmith-alachua-fl', description: 'Alachua locksmith.' });
  expect(n['@type']).toBe('Service');
  expect(n.name).toBe('Locksmith Service in Alachua, FL');
  expect(n.serviceType).toBe('Locksmith');
  expect(n.description).toBe('Alachua locksmith.');
  expect(n.url).toBe('https://besecurelocksmith.com/service-areas/locksmith-alachua-fl/');
  expect(n.areaServed).toBe('Alachua, Florida');
  expect(n.provider).toEqual({ '@id': 'https://besecurelocksmith.com/#organization' });
});

test('each branch carries image, its own territory and only its own profiles', () => {
  const g: any = locationNode('gainesville');
  const o: any = locationNode('ocala');
  expect(g.image['@type']).toBe('ImageObject');
  expect(g.image.width).toBeGreaterThan(0);
  const places = (n: any) => n.areaServed.containsPlace.map((p: any) => p.name);
  expect(places(g)).toContain('Alachua County');
  expect(places(g)).not.toContain('Ocala');
  expect(places(o)).toContain('Marion County');
  expect(places(o)).not.toContain('Gainesville');
  expect(g.sameAs.join(' ')).not.toContain('facebook.com');
  expect(o.sameAs.join(' ')).not.toContain('linkedin.com');
});

test('location node is per-store and lean', () => {
  const g = locationNode('gainesville');
  expect(g['@id']).toBe('https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness');
  expect(g.name).toBe('Be Secure Locksmith — Gainesville');
  expect(g.telephone).toBe('1-352-290-7035');
  expect(g.address.streetAddress).toBe('901 NW 8th Ave c17');
  expect(g.aggregateRating.reviewCount).toBe('1371');
  expect(g.aggregateRating.ratingValue).toBe('4.9');
  expect(g.hasMap).toBe('https://www.google.com/maps/place/?cid=1525264823828817691');
  expect(g.parentOrganization['@id']).toBe('https://besecurelocksmith.com/#organization');
  expect(g.hasOfferCatalog).toBeUndefined();
  const o = locationNode('ocala');
  expect(o.aggregateRating.reviewCount).toBe('1246');
  expect(o.address.streetAddress).toBe('217 SE 1st Ave Ste 200-50');
  expect(o.geo.latitude).toBe(29.1844122);
});

test('shared service pages claim both offices, never Gainesville alone', () => {
  const names = serviceAreaServed('main').map((a) => a.name);
  expect(names).toContain('Gainesville');
  expect(names).toContain('Ocala');
  expect(names).toContain('Alachua County');
  expect(names).toContain('Marion County');
  expect(serviceGeoLabel('main')).toBe('Gainesville & Ocala, FL');
  // An undefined location must not silently fall back to one city.
  expect(serviceGeoLabel(undefined)).toBe('Gainesville & Ocala, FL');
});

test('office-scoped service pages claim only their own city', () => {
  expect(serviceAreaServed('ocala').map((a) => a.name)).toEqual(['Ocala']);
  expect(serviceAreaServed('gainesville').map((a) => a.name)).toEqual(['Gainesville']);
  expect(serviceGeoLabel('ocala')).toBe('Ocala, FL');
  expect(serviceGeoLabel('gainesville')).toBe('Gainesville, FL');
});

test('non-office locations fall back to the full service area', () => {
  // 'lake-city' has a tracking number but no office — it must not narrow to one city.
  expect(serviceAreaServed('lake-city').length).toBe(schemaData.areaServed.length);
});

test('officeBySlug resolves the two office pages', () => {
  expect(officeBySlug('locksmith-gainesville-fl')?.key).toBe('gainesville');
  expect(officeBySlug('locksmith-ocala-fl')?.key).toBe('ocala');
  expect(officeBySlug('locksmith-alachua-fl')).toBeUndefined();
});

test('office LocalBusiness nodes carry no accessibility amenities', () => {
  for (const key of ['gainesville', 'ocala'] as const) {
    expect((locationNode(key) as any).amenityFeature).toBeUndefined();
  }
});

test('the site-wide review count is the sum of the two Google profiles', () => {
  expect(Number(site.ratingCount)).toBe(Number(offices.gainesville.reviewCount) + Number(offices.ocala.reviewCount));
  expect(site.ratingValue).toBe('4.9');
});

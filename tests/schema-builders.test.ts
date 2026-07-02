import { test, expect } from 'vitest';
import { offices } from '../src/config/offices';
import { schemaData } from '../src/config/schema-data';

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

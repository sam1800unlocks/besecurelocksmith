import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dist = resolve(__dirname, '..', 'dist');
const read = (p: string) => { const f = join(dist, p); if (!existsSync(f)) throw new Error(`dist ${p} missing — run \`npm run build\``); return readFileSync(f, 'utf8'); };

test('nav exposes Locations + About dropdowns and the 4-column Services menu', () => {
  const h = read('index.html');
  // Locations dropdown links both offices + hub
  expect(h).toContain('/service-areas/locksmith-gainesville-fl/');
  expect(h).toContain('/service-areas/locksmith-ocala-fl/');
  expect(h).toContain('/locations/');
  expect(h).toContain('View all locations');
  // About dropdown links
  expect(h).toContain('/testimonials/');
  expect(h).toContain('/employment/');
  // Services menu: Residential heading + its three items; Property Management present (moved to Commercial)
  expect(h).toContain('/services/residential-locksmith/');
  expect(h).toContain('/services/lock-rekeying/');
  expect(h).toContain('/services/lock-repair/');
  expect(h).toContain('/services/new-lock-installation/');
  expect(h).toContain('/services/property-management/');
});

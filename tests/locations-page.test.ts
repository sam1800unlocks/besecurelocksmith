import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dist = resolve(__dirname, '..', 'dist');
const read = (p: string) => { const f = join(dist, p); if (!existsSync(f)) throw new Error(`dist ${p} missing — run \`npm run build\``); return readFileSync(f, 'utf8'); };

test('/locations/ hub shows both offices, maps, detail links, and breadcrumb only', () => {
  const h = read('locations/index.html');
  // both offices present (address + hours + tracking phones)
  expect(h).toContain('901 NW 8th Ave. C17');
  expect(h).toContain('217 SE 1st Ave. Suite 200-50');
  expect(h).toContain('Mon–Fri 8 am–5 pm');
  // CID map embeds for both offices (Astro renders the & literally in the attribute — verified in the schema work)
  expect(h).toContain('maps/place/?cid=1525264823828817691&output=embed');
  expect(h).toContain('maps/place/?cid=4138983982412980004&output=embed');
  // links into the two office pages + service areas
  expect(h).toContain('/service-areas/locksmith-gainesville-fl/');
  expect(h).toContain('/service-areas/locksmith-ocala-fl/');
  expect(h).toContain('/service-areas/');
  // schema: breadcrumb only, no business schema
  expect(h).toContain('"@type":"BreadcrumbList"');
  expect(h).not.toContain('"@type":"LocalBusiness"');
  expect(h).not.toContain('#organization');
  expect(h).not.toContain('#localbusiness');
});

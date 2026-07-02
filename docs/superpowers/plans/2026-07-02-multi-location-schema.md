# Multi-Location Local SEO + Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the live site's proven multi-location JSON-LD (a parent `Locksmith` org + two per-store location nodes) into the Astro codebase so Gainesville and Ocala each rank as first-class local entities, and fix the current bug where every page emits a single Gainesville `LocalBusiness`.

**Architecture:** A typed data layer (`offices.ts` per-store + `schema-data.ts` org-level + `service-catalog.json`) feeds pure builder functions in `src/lib/schema.ts` that produce the JSON-LD nodes. `BaseLayout` gains a `schema` prop controlling placement: the homepage emits the full org node; the two office location pages emit a lean org node + that store's location node; all other pages emit no business schema.

**Tech Stack:** Astro 4 (static), TypeScript, Vitest (unit + dist-HTML assertions). Source of truth for all schema data: `docs/superpowers/specs/2026-07-02-live-schema-reference.json` (captured from live 2026-07-02) and the design spec `docs/superpowers/specs/2026-07-02-multi-location-local-seo-schema-design.md`.

## Global Constraints

- **Entity type:** `@type: "Locksmith"` for org + location nodes. All `@id` absolute URLs.
- **Org `@id`:** `https://besecurelocksmith.com/#organization`. **Location `@id`s:** `https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness` and `…/locksmith-ocala-fl/#localbusiness`.
- **Ratings (static, hardcoded):** `ratingValue: "4.9"` everywhere. `reviewCount` — Gainesville **1330**, Ocala **1214**, combined **2544**. Decimal point in ratingValue; counts are strings.
- **Placement:** full org node = homepage only; lean org node = the two office pages only; **no** Organization/LocalBusiness schema on any other page.
- **Phones:** location nodes use the tracking lines — Gainesville `1-352-290-7035`, Ocala `1-352-325-7953`; org `contactPoint` uses `1-352-706-5295`. Format `1-###-###-####` (match live).
- **Email:** `info@besecurelocksmith.com` on the org node (`email` + `contactPoint.email`).
- **Geo/CID:** Gainesville `geo 29.65886,-82.3345`, CID `1525264823828817691`. Ocala `geo 29.1844122,-82.1355775`, CID `4138983982412980004`. `hasMap` = `https://www.google.com/maps/place/?cid=<CID>`.
- **Rules:** `openingHoursSpecification` object (never string), Mon–Fri 08:00–17:00 (no weekend, no 24/7). City `sameAs` = Wikipedia only. No `maps.app.goo.gl`. No `keywords`/`geocircle`/self-promo `award`.
- **Founder/foundingDate/catalog/areaServed/memberOf** live only on the org node. Location nodes are lean (NAP/geo/CID/rating/sameAs/hours/parentOrganization).
- Existing `BreadcrumbList`, `FAQPage`, `Service`, `Blog`/`BlogPosting`, `JobPosting`, `ItemList` schema on their pages is unaffected — do not remove those.

## File Structure

- `src/config/offices.ts` — **modify.** Per-store data (address parts, tracking phone, email, geo, cid, kgmid, ratingValue, reviewCount, slug, per-office `sameAs`, hours). One source for both the location schema and the office pages.
- `src/config/schema-data.ts` — **create.** Org-level constants: identity, founder (+credential+knowsAbout), memberOf, areaServed, org `sameAs`, combined rating, email, priceRange/payment, description, foundingDate/legalName, and `import` of the offer catalog.
- `src/data/service-catalog.json` — **create.** The org `hasOfferCatalog` items (name/description/additionalType/minPrice), extracted from the live reference.
- `src/lib/schema.ts` — **create.** Pure builders: `organizationNode(opts)`, `locationNode(key)`, `officeBySlug(slug)`.
- `src/layouts/BaseLayout.astro` — **modify.** Replace the `localBusiness` default `LocalBusiness` with a `schema` prop (`'org-home' | 'org-lean' | 'none'`, default `'none'`).
- `src/pages/index.astro` — **modify.** `schema="org-home"`.
- `src/pages/service-areas/[slug]/index.astro` — **modify.** Office-page branch: lean org + location node, office NAP, CID map, unique copy, optimized title/meta.
- `src/pages/contact-us/index.astro` — **modify.** Remove its `LocalBusiness`; show both office NAPs.
- `src/config/site.ts` — **modify.** `ratingCount: '2544'`.
- `src/pages/about/index.astro` + service pages — **modify.** Targeted title/meta (add Ocala, brand suffix).
- Tests: `tests/schema-builders.test.ts` (unit), `tests/schema-pages.test.ts` (dist HTML).

---

### Task 1: Per-store + org schema data

**Files:**
- Modify: `src/config/offices.ts`
- Create: `src/config/schema-data.ts`
- Create: `src/data/service-catalog.json`
- Test: `tests/schema-builders.test.ts` (created here, first assertions)

**Interfaces:**
- Produces: `offices` (extended `Office` records, keys `gainesville`/`ocala`), and `schemaData` (org-level object). Exact shapes below.

- [ ] **Step 1: Extract the offer catalog from the live reference into a JSON file**

Run:
```bash
cd "/Users/Sam/projects/Be Secure"
python3 -c "
import json
ref=json.load(open('docs/superpowers/specs/2026-07-02-live-schema-reference.json'))
cat=ref['org_node_homepage']['hasOfferCatalog']['itemListElement']
items=[{'name':o['itemOffered']['name'],'description':o['itemOffered']['description'],'additionalType':o['itemOffered'].get('additionalType'),'minPrice':(o.get('priceSpecification') or {}).get('minPrice')} for o in cat]
json.dump(items, open('src/data/service-catalog.json','w'), indent=2); open('src/data/service-catalog.json','a').write('\n')
print('wrote', len(items), 'services')
"
```
Expected: `wrote 26 services` (or the exact count present in the reference).

- [ ] **Step 2: Replace `src/config/offices.ts` with the extended records**

```ts
export type OfficeKey = 'gainesville' | 'ocala';

export interface Office {
  key: OfficeKey;
  label: string;              // "Gainesville"
  schemaName: string;         // "Be Secure Locksmith — Gainesville"
  slug: string;               // service-area page slug used as the location page
  street: string;             // "901 NW 8th Ave. C17"
  cityStateZip: string;       // "Gainesville, FL 32601"
  city: string; state: string; zip: string;
  streetSchema: string;       // exact live casing, e.g. "901 NW 8th Ave c17"
  phone: string;              // main display line
  trackingPhone: string;      // "1-352-290-7035" (schema/CTA on the location page)
  email: string;
  geo: { lat: number; lng: number };
  cid: string;
  kgmid: string;              // "/g/1ptx2pkfg"
  ratingValue: string;        // "4.9"
  reviewCount: string;        // "1330"
  sameAs: string[];           // that office's GBP + directory profiles
}

export const offices: Record<OfficeKey, Office> = {
  gainesville: {
    key: 'gainesville', label: 'Gainesville',
    schemaName: 'Be Secure Locksmith — Gainesville',
    slug: 'locksmith-gainesville-fl',
    street: '901 NW 8th Ave. C17', cityStateZip: 'Gainesville, FL 32601',
    city: 'Gainesville', state: 'FL', zip: '32601',
    streetSchema: '901 NW 8th Ave c17',
    phone: '352-706-5295', trackingPhone: '1-352-290-7035',
    email: 'info@besecurelocksmith.com',
    geo: { lat: 29.65886, lng: -82.3345 },
    cid: '1525264823828817691', kgmid: '/g/1ptx2pkfg',
    ratingValue: '4.9', reviewCount: '1330',
    sameAs: [
      'https://www.google.com/search?kgmid=/g/1ptx2pkfg',
      'https://www.yelp.com/biz/be-secure-locksmith-gainesville-2',
      'https://www.facebook.com/BeSecureLocksmith',
      'https://linkedin.com/company/be-secure-locksmith',
      'https://www.bbb.org/us/fl/gainesville/profile/locksmith/be-secure-locksmith-llc-0403-235965422/',
      'https://1800unlocks.com/locksmith/florida/gainesville/be-secure-locksmith-gainesville/',
      'https://fairtradelocksmiths.com/locksmith/local/be-secure-locksmith-gainesville',
      'https://members.gainesvillechamber.com/list/member/be-secure-locksmith-gainesville-30726',
    ],
  },
  ocala: {
    key: 'ocala', label: 'Ocala',
    schemaName: 'Be Secure Locksmith — Ocala',
    slug: 'locksmith-ocala-fl',
    street: '217 SE 1st Ave. Suite 200-50', cityStateZip: 'Ocala, FL 34471',
    city: 'Ocala', state: 'FL', zip: '34471',
    streetSchema: '217 SE 1st Ave Suite 200-50',
    phone: '352-325-7953', trackingPhone: '1-352-325-7953',
    email: 'info@besecurelocksmith.com',
    geo: { lat: 29.1844122, lng: -82.1355775 },
    cid: '4138983982412980004', kgmid: '/g/1yfprvxjj',
    ratingValue: '4.9', reviewCount: '1214',
    sameAs: [
      'https://www.google.com/search?kgmid=/g/1yfprvxjj',
      'https://www.yelp.com/biz/be-secure-locksmith-ocala',
      'https://www.facebook.com/BeSecureLocksmith',
      'https://linkedin.com/company/be-secure-locksmith',
      'https://1800unlocks.com/locksmith/florida/ocala/be-secure-locksmith-ocala/',
      'https://fairtradelocksmiths.com/locksmith/local/be-secure-locksmith-ocala',
    ],
  },
} as const;
```

> **Note:** the previous `offices.ts` exposed `mapQuery` and `gbp`. Grep for their usages (`grep -rn "\.mapQuery\|\.gbp" src`) and update callers: replace `office.gbp` with `office.sameAs[0]`, and `office.mapQuery` with the CID map URL `https://www.google.com/maps/place/?cid=${office.cid}` where a map link is needed. Adjust in the same commit.

- [ ] **Step 3: Create `src/config/schema-data.ts`**

```ts
import catalog from '../data/service-catalog.json';

const BASE = 'https://besecurelocksmith.com';

export const schemaData = {
  base: BASE,
  orgId: `${BASE}/#organization`,
  legalName: 'Be Secure Locksmith LLC',
  name: 'Be Secure Locksmith',
  foundingDate: '2012-04-15',
  url: BASE,
  email: 'info@besecurelocksmith.com',
  telephone: '1-352-706-5295',
  logo: `${BASE}/img/besecure-logo-100h.png`,
  image: `${BASE}/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg`,
  description:
    'Be Secure Locksmith is a premier mobile locksmith service provider in North Central Florida, serving Gainesville, Ocala, and surrounding regions. Established in 2012, our fully insured technicians specialize in emergency automotive lockouts, high-security key fob programming, residential rekeying, and comprehensive commercial lock installation and master key systems.',
  priceRange: '$$',
  paymentAccepted: 'Cash, Visa, Mastercard, PayPal',
  currenciesAccepted: 'USD',
  combinedRating: { ratingValue: '4.9', reviewCount: '2544' },
  founder: {
    name: 'Netta Kaiden',
    jobTitle: 'Owner & Master Locksmith',
    credentialId: 'AR125393',
    knowsAbout: [
      'https://en.wikipedia.org/wiki/Locksmithing',
      'https://en.wikipedia.org/wiki/Automotive_security',
      'https://en.wikipedia.org/wiki/Transponder_car_key',
      'https://en.wikipedia.org/wiki/Master_key',
      'https://en.wikipedia.org/wiki/Interchangeable_core',
      'https://en.wikipedia.org/wiki/High-security_lock',
      'https://en.wikipedia.org/wiki/Deadbolt',
      'https://en.wikipedia.org/wiki/Crash_bar',
    ],
  },
  memberOf: [
    { name: 'Greater Gainesville Chamber of Commerce', sameAs: 'https://members.gainesvillechamber.com/list/member/be-secure-locksmith-gainesville-30726' },
    { name: 'Associated Locksmiths of America', sameAs: 'https://en.wikipedia.org/wiki/Associated_Locksmiths_of_America' },
  ],
  areaServed: [
    { type: 'AdministrativeArea', name: 'Alachua County', sameAs: 'https://en.wikipedia.org/wiki/Alachua_County,_Florida' },
    { type: 'AdministrativeArea', name: 'Marion County', sameAs: 'https://en.wikipedia.org/wiki/Marion_County,_Florida' },
    { type: 'AdministrativeArea', name: 'Citrus County', sameAs: 'https://en.wikipedia.org/wiki/Citrus_County,_Florida' },
    { type: 'City', name: 'Gainesville', sameAs: 'https://en.wikipedia.org/wiki/Gainesville,_Florida' },
    { type: 'City', name: 'Ocala', sameAs: 'https://en.wikipedia.org/wiki/Ocala,_Florida' },
    { type: 'City', name: 'The Villages', sameAs: 'https://en.wikipedia.org/wiki/The_Villages,_Florida' },
    { type: 'City', name: 'Lake City', sameAs: 'https://en.wikipedia.org/wiki/Lake_City,_Florida' },
    { type: 'City', name: 'High Springs', sameAs: 'https://en.wikipedia.org/wiki/High_Springs,_Florida' },
    { type: 'City', name: 'Newberry', sameAs: 'https://en.wikipedia.org/wiki/Newberry,_Florida' },
    { type: 'City', name: 'Williston', sameAs: 'https://en.wikipedia.org/wiki/Williston,_Florida' },
  ],
  sameAs: [
    'https://www.google.com/search?kgmid=/g/1ptx2pkfg',
    'https://www.yelp.com/biz/be-secure-locksmith-gainesville-2',
    'https://www.facebook.com/BeSecureLocksmith',
    'https://linkedin.com/company/be-secure-locksmith',
    'https://twitter.com/belocksmith',
    'https://www.youtube.com/@BeSecureLocksmith',
    'https://www.bbb.org/us/fl/gainesville/profile/locksmith/be-secure-locksmith-llc-0403-235965422/',
    'https://1800unlocks.com/locksmith/florida/gainesville/be-secure-locksmith-gainesville/',
    'https://fairtradelocksmiths.com/locksmith/local/be-secure-locksmith-gainesville',
    'https://members.gainesvillechamber.com/list/member/be-secure-locksmith-gainesville-30726',
  ],
  hours: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' },
  catalog: catalog as Array<{ name: string; description: string; additionalType: string | null; minPrice: string | null }>,
} as const;
```

- [ ] **Step 4: Write the first failing test** — `tests/schema-builders.test.ts`

```ts
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
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/schema-builders.test.ts`
Expected: PASS (config + catalog present). If `service-catalog.json` import errors, ensure `resolveJsonModule` is on in `tsconfig.json` (Astro's default `astro/tsconfigs/strict` enables it).

- [ ] **Step 6: Commit**

```bash
git add src/config/offices.ts src/config/schema-data.ts src/data/service-catalog.json tests/schema-builders.test.ts
git commit -m "feat(schema): per-store + org schema data layer"
```

---

### Task 2: Schema node builders

**Files:**
- Create: `src/lib/schema.ts`
- Test: `tests/schema-builders.test.ts` (extend)

**Interfaces:**
- Consumes: `offices`, `schemaData` (Task 1).
- Produces: `organizationNode({ homepage }: { homepage: boolean }): object`, `locationNode(key: OfficeKey): object`, `officeBySlug(slug: string): Office | undefined`.

- [ ] **Step 1: Write failing tests** — append to `tests/schema-builders.test.ts`

```ts
import { organizationNode, locationNode, officeBySlug } from '../src/lib/schema';

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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/schema-builders.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/schema'`.

- [ ] **Step 3: Implement `src/lib/schema.ts`**

```ts
import { offices, type Office, type OfficeKey } from '../config/offices';
import { schemaData as S } from '../config/schema-data';

const hoursSpec = () => [{
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: [...S.hours.days],
  opens: S.hours.opens,
  closes: S.hours.closes,
}];

export function officeBySlug(slug: string): Office | undefined {
  return Object.values(offices).find((o) => o.slug === slug);
}

export function organizationNode({ homepage }: { homepage: boolean }) {
  const node: any = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': S.orgId,
    name: S.name,
    legalName: S.legalName,
    foundingDate: S.foundingDate,
    url: S.url,
    logo: { '@type': 'ImageObject', url: S.logo },
    image: S.image,
    description: S.description,
    email: S.email,
    founder: [{
      '@type': 'Person',
      name: S.founder.name,
      jobTitle: S.founder.jobTitle,
      hasCredential: [{
        '@type': 'EducationalOccupationalCredential',
        name: 'ALOA Security Professionals Association Member',
        credentialCategory: 'Professional Membership',
        identifier: S.founder.credentialId,
        recognizedBy: { '@type': 'Organization', name: 'Associated Locksmiths of America', sameAs: 'https://en.wikipedia.org/wiki/Associated_Locksmiths_of_America' },
      }],
      knowsAbout: [...S.founder.knowsAbout],
    }],
    address: {
      '@type': 'PostalAddress',
      streetAddress: offices.gainesville.streetSchema,
      addressLocality: 'Gainesville', addressRegion: 'FL', postalCode: '32601', addressCountry: 'US',
    },
    contactPoint: { '@type': 'ContactPoint', telephone: S.telephone, email: S.email, contactType: 'customer service', availableLanguage: 'English' },
    openingHoursSpecification: hoursSpec(),
    priceRange: S.priceRange,
    currenciesAccepted: S.currenciesAccepted,
    paymentAccepted: S.paymentAccepted,
    areaServed: S.areaServed.map((a) => ({ '@type': a.type, name: a.name, sameAs: a.sameAs })),
    sameAs: [...S.sameAs],
    memberOf: S.memberOf.map((m) => ({ '@type': 'Organization', name: m.name, sameAs: m.sameAs })),
    subOrganization: [
      { '@type': 'Locksmith', '@id': `${S.base}/service-areas/${offices.gainesville.slug}/#localbusiness` },
      { '@type': 'Locksmith', '@id': `${S.base}/service-areas/${offices.ocala.slug}/#localbusiness` },
    ],
  };
  if (homepage) {
    node.aggregateRating = { '@type': 'AggregateRating', ratingValue: S.combinedRating.ratingValue, reviewCount: S.combinedRating.reviewCount, bestRating: '5', worstRating: '1' };
    node.hasOfferCatalog = {
      '@type': 'OfferCatalog', name: 'Locksmith Services',
      itemListElement: S.catalog.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.description, ...(s.additionalType ? { additionalType: s.additionalType } : {}) },
        ...(s.minPrice ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: s.minPrice, priceCurrency: 'USD', description: 'Starting price — final price depends on vehicle, lock type, and job complexity' } } : {}),
      })),
    };
  }
  return node;
}

export function locationNode(key: OfficeKey) {
  const o = offices[key];
  return {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': `${S.base}/service-areas/${o.slug}/#localbusiness`,
    name: o.schemaName,
    url: `${S.base}/service-areas/${o.slug}/`,
    telephone: o.trackingPhone,
    email: o.email,
    address: { '@type': 'PostalAddress', streetAddress: o.streetSchema, addressLocality: o.city, addressRegion: o.state, postalCode: o.zip, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: o.geo.lat, longitude: o.geo.lng },
    hasMap: `https://www.google.com/maps/place/?cid=${o.cid}`,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: o.ratingValue, reviewCount: o.reviewCount, bestRating: '5', worstRating: '1' },
    openingHoursSpecification: hoursSpec(),
    priceRange: S.priceRange,
    sameAs: [...o.sameAs],
    parentOrganization: { '@id': S.orgId },
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/schema-builders.test.ts`
Expected: PASS (all builder tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts tests/schema-builders.test.ts
git commit -m "feat(schema): org + location node builders"
```

---

### Task 3: BaseLayout schema placement

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/schema-pages.test.ts` (create)

**Interfaces:**
- Consumes: `organizationNode`, `locationNode` (Task 2).
- Produces: `BaseLayout` prop `schema?: 'org-home' | 'org-lean' | 'none'` (default `'none'`). Removes the old `localBusiness` prop + default `LocalBusiness` JSON-LD.

- [ ] **Step 1: Modify `BaseLayout.astro` frontmatter** — replace the `localBusiness` handling.

Remove from the destructured props: `localBusiness = true`. Add `schema = 'none'`. Delete the `const jsonLd = {...LocalBusiness...}` block (lines ~22–27). Add:

```ts
import { organizationNode } from '../lib/schema';
const orgSchema = schema === 'org-home' ? organizationNode({ homepage: true })
  : schema === 'org-lean' ? organizationNode({ homepage: false })
  : null;
```

- [ ] **Step 2: Modify the `<head>`** — replace the old emission line.

Replace `{localBusiness && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}` with:

```astro
{orgSchema && <script type="application/ld+json" set:html={JSON.stringify(orgSchema)} />}
```

- [ ] **Step 3: Fix callers that passed `localBusiness={false}`**

Run: `grep -rn "localBusiness" src`
For each hit (e.g. `contact-us`, `service-areas/[slug]`), remove the `localBusiness={false}` prop (the new default `schema="none"` already emits nothing). Do NOT delete those pages' own JSON-LD blocks yet (handled in their tasks).

- [ ] **Step 4: Write the failing test** — `tests/schema-pages.test.ts`

```ts
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
```

- [ ] **Step 5: Update homepage to request the org node** — in `src/pages/index.astro`, add `schema="org-home"` to the `<BaseLayout …>` opening tag.

- [ ] **Step 6: Build + run**

Run: `npm run build && npx vitest run tests/schema-pages.test.ts`
Expected: PASS. (The generic-page test confirms the old site-wide `LocalBusiness` is gone.)

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro src/pages/contact-us/index.astro src/pages/service-areas/'[slug]'/index.astro tests/schema-pages.test.ts
git commit -m "feat(schema): BaseLayout schema-placement prop; org node on homepage only"
```

---

### Task 4: Office location pages (schema + NAP + CID map + copy + title)

**Files:**
- Modify: `src/pages/service-areas/[slug]/index.astro`
- Test: `tests/schema-pages.test.ts` (extend)

**Interfaces:**
- Consumes: `organizationNode`, `locationNode`, `officeBySlug` (Task 2); the `area` prop already in the page.

- [ ] **Step 1: Add office detection + schema to the `[slug]` frontmatter**

```ts
import { officeBySlug, organizationNode, locationNode } from '../../../lib/schema';
const office = officeBySlug(area.slug);        // Office | undefined
const leanOrg = office ? organizationNode({ homepage: false }) : null;
const locNode = office ? locationNode(office.key) : null;
```
Set `<BaseLayout … schema={office ? 'org-lean' : 'none'}>` (the lean org node is emitted by BaseLayout; the location node is emitted below).

- [ ] **Step 2: Emit the location node** — in the page's `<Fragment slot="head">`, alongside the existing breadcrumb JSON-LD, add:

```astro
{locNode && <script type="application/ld+json" set:html={JSON.stringify(locNode)} />}
```

- [ ] **Step 3: Show the office NAP + CID map on office pages** — near the top of the page body, before `<AreaMap>`, add an office block that renders only when `office` is set:

```astro
{office && (
  <section class="border-b border-border" style="background:#f4f4f4;">
    <Container>
      <div class="max-w-[1180px] mx-auto py-8 flex flex-wrap items-center gap-x-10 gap-y-3">
        <div>
          <p class="m-0 text-[12px] font-bold uppercase tracking-[1px] text-muted">Our {office.label} Office</p>
          <p class="m-0 mt-1 text-[15px] font-semibold text-ink">{office.street}<br />{office.cityStateZip}</p>
        </div>
        <a href={`https://www.google.com/maps/place/?cid=${office.cid}`} target="_blank" rel="noopener noreferrer" class="text-[14px] font-semibold text-primary hover:text-primary-hover">View on Google Maps &rarr;</a>
        <a href={`tel:${office.trackingPhone.replace(/[^0-9+]/g,'')}`} class="inline-flex items-center rounded-pill bg-call hover:bg-call-hover text-white font-bold text-[14px] px-[18px] py-[9px]">{office.phone}</a>
      </div>
    </Container>
  </section>
)}
```
> If `Container` isn't already imported in this file, add `import Container from '../../../components/primitives/Container.astro';`.

- [ ] **Step 4: Point the embedded map at the office CID on office pages**

In `src/components/sections/AreaMap.astro` frontmatter, accept an optional `cid` and prefer it for both the embed and the link:

```ts
const { area, cid } = Astro.props;
const mapQuery = `${area.city}, FL`;
const embedSrc = cid
  ? `https://www.google.com/maps?cid=${cid}&output=embed`
  : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=11&ie=UTF8&iwloc=&output=embed`;
const mapsLink = cid
  ? `https://www.google.com/maps/place/?cid=${cid}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
```
Then use `embedSrc` for the `<iframe src=…>` and `mapsLink` for the "View on Google Maps" `<a href=…>` (replace the existing inline expressions). In the `[slug]` page pass `<AreaMap area={area} cid={office?.cid} />`.

- [ ] **Step 5: Optimize the office-page title/meta** — the area content collection drives `area.title`/`area.description`. For the two office slugs only, override in the page:

```ts
const pageTitle = office ? `Locksmith in ${office.label}, FL | Be Secure Locksmith` : area.title;
const pageDesc = office
  ? `Be Secure Locksmith's ${office.label}, FL office — mobile locksmith for car, home & business. Lockouts, rekeys, car keys & installs. Call ${office.phone}.`
  : area.description;
```
Use `pageTitle`/`pageDesc` in the `<BaseLayout title=… description=…>`.

- [ ] **Step 6: Write failing tests** — append to `tests/schema-pages.test.ts`

```ts
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
  expect(h).not.toContain('901 NW 8th Ave'); // NOT Gainesville
});

test('a non-office area page has no business schema', () => {
  const h = read('service-areas/locksmith-alachua-fl/index.html');
  expect(h).not.toContain('#localbusiness');
  expect(h).not.toContain('#organization');
  expect(h).not.toContain('"@type":"LocalBusiness"');
});
```

- [ ] **Step 7: Build + run**

Run: `npm run build && npx vitest run tests/schema-pages.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/service-areas/'[slug]'/index.astro src/components/sections/AreaMap.astro tests/schema-pages.test.ts
git commit -m "feat(schema): office location pages with per-store node, NAP, CID map & title"
```

---

### Task 5: Contact page — both NAPs, no business schema

**Files:**
- Modify: `src/pages/contact-us/index.astro`
- Test: `tests/schema-pages.test.ts` (extend)

- [ ] **Step 1: Remove the contact page's `LocalBusiness` JSON-LD** — delete the `const localBusinessJsonLd = {...}` block and its `<script type="application/ld+json" …>` emission. Keep the `BreadcrumbList` if present. Ensure `<BaseLayout>` has no `localBusiness`/`schema` prop (defaults to `none`).

- [ ] **Step 2: Render both office NAPs in the contact content** — where the single address currently renders, map over both offices:

```astro
---
import { offices } from '../../config/offices';
---
<div class="grid gap-6 sm:grid-cols-2">
  {Object.values(offices).map((o) => (
    <div class="rounded-[16px] border border-border bg-white p-5">
      <p class="m-0 text-[13px] font-bold uppercase tracking-[0.6px] text-primary">{o.label} Office</p>
      <p class="m-0 mt-2 text-[15px] text-ink font-semibold">{o.street}<br />{o.cityStateZip}</p>
      <a href={`tel:${o.trackingPhone.replace(/[^0-9+]/g,'')}`} class="mt-2 inline-block text-[15px] font-semibold text-primary">{o.phone}</a>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Write the failing test** — append to `tests/schema-pages.test.ts`

```ts
test('contact page shows both offices and no business schema', () => {
  const h = read('contact-us/index.html');
  expect(h).toContain('Gainesville, FL 32601');
  expect(h).toContain('Ocala, FL 34471');
  expect(h).not.toContain('"@type":"LocalBusiness"');
  expect(h).not.toContain('#organization');
});
```

- [ ] **Step 4: Build + run**

Run: `npm run build && npx vitest run tests/schema-pages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/contact-us/index.astro tests/schema-pages.test.ts
git commit -m "feat(seo): contact page shows both office NAPs, drops single-location schema"
```

---

### Task 6: Rating display + targeted titles/metas

**Files:**
- Modify: `src/config/site.ts`
- Modify: `src/pages/about/index.astro`
- Test: `tests/schema-pages.test.ts` (extend)

- [ ] **Step 1: Update the combined display count** — in `src/config/site.ts` change `ratingCount: '2551'` → `ratingCount: '2544'`. (This flows to `Reviews`, `TrustStrip`, `testimonials` badges via `site.ratingCount`.)

- [ ] **Step 2: Add Ocala to the About title/meta** — in `src/pages/about/index.astro`, change the title from `About Our Gainesville, FL Locksmith Team - Local Pros` to `About Our Gainesville & Ocala, FL Locksmith Team | Be Secure Locksmith` and ensure the meta description names both cities.

> **Scope note (intentional):** per the "targeted titles/metas" decision, the ~17 service-page titles and ~75 blog titles are **left as-is** — they're already localized and carry ranking equity, and the dual-city signal is now carried by the homepage, About, and the two office location pages. The homepage title already includes both cities. Do not mass-rewrite service/blog titles or force the brand suffix onto pages this plan doesn't otherwise touch.

- [ ] **Step 3: Write the failing test** — append to `tests/schema-pages.test.ts`

```ts
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
```

- [ ] **Step 4: Build + run**

Run: `npm run build && npx vitest run tests/schema-pages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/site.ts src/pages/about/index.astro tests/schema-pages.test.ts
git commit -m "feat(seo): combined review count 2544; Ocala in About title/meta"
```

---

### Task 7: Full-suite verification + manual validation

**Files:** none (verification only).

- [ ] **Step 1: Full build + test suite**

Run: `npm run build && npm test`
Expected: all tests pass (existing + new `schema-builders` + `schema-pages`). If a pre-existing test asserted the old sitewide `LocalBusiness` or `2551`, update it to the new expectation in this step and re-run.

- [ ] **Step 2: Grep for stragglers**

Run:
```bash
grep -rn "2551\|localBusiness\|mapQuery\|\.gbp\b" src
```
Expected: no functional references (only comments/spec are fine). Fix any missed caller.

- [ ] **Step 3: Manual structured-data validation (record results)**

Serve the build (`npm run preview`) and paste each URL into **https://search.google.com/test/rich-results** (or validator.schema.org):
- `/` → one `Locksmith` org node with combined 4.9/2544, `hasOfferCatalog`, `subOrganization` (2), `FAQPage`. Zero errors.
- `/service-areas/locksmith-gainesville-fl/` → location node (4.9/1330, Gainesville address, CID map) + lean org node + Breadcrumb. Zero errors.
- `/service-areas/locksmith-ocala-fl/` → location node (4.9/1214, Ocala address). Zero errors.
- `/service-areas/locksmith-alachua-fl/`, `/contact-us/`, `/price-list/` → no business schema.
Expected: zero errors; correct entity per page; **no** Gainesville address on the Ocala page.

- [ ] **Step 4: Commit any fixes from Steps 1–2**

```bash
git add -A
git commit -m "test(schema): reconcile existing tests with multi-location schema"
```

- [ ] **Step 5: Post-deploy reminder (document, do not execute)**

After this ships to `besecurelocksmith.com` (remember the pre-launch `robots.txt Disallow: /` must be removed first), run GSC URL Inspection + reindex for the homepage and the two office pages; re-check in 1–2 weeks. Review counts are static — the paused live-reviews project will later auto-refresh `offices.*.reviewCount` and `schemaData.combinedRating`.

---

## Notes for the implementer

- **Data source of truth:** `docs/superpowers/specs/2026-07-02-live-schema-reference.json` (exact live values) and the design spec in the same folder. Do not invent values — everything needed is in Task 1's code or that reference.
- **Do not touch** the pre-launch `robots.txt` (it intentionally blocks crawling right now), image optimization, or the `/services/` 404 — separate efforts.
- The site auto-deploys from `main` on push; keep the tree green (`npm test`) before any push.

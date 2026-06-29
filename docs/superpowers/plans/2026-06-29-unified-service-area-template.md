# Unified Service-Area Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the two service-area page variants (`lean`/`rich`) into one modular template — wider live-content body, global service blocks, a new RelatedBlogs module, a reworked map+NAP block, and localized FAQs with schema on every city page.

**Architecture:** One dynamic route (`src/pages/service-areas/[slug]/index.astro`) renders every city from the `service-areas` content collection with a single fixed module stack. Sections are independent components. Adding a city stays one JSON data file. A new `RelatedBlogs` component links out to live blog posts (per-area data). `AreaStats` and `AreaNearby` are deleted.

**Tech Stack:** Astro 4 (static, `trailingSlash:'always'`, `build.format:'directory'`), Tailwind v4 (`@theme` tokens), Vitest (`experimental_AstroContainer`), Playwright e2e.

## Global Constraints

- Preserve every existing URL exactly — `trailingSlash:'always'` + `build.format:'directory'`. Route path stays `/service-areas/<slug>/`.
- Content collection export key MUST be `'service-areas'` (hyphen, matches the directory name) or `getCollection` returns empty.
- Curly apostrophes (U+2019) in any JSON content must be written via Python `json.dump(..., ensure_ascii=False)` and verified (`’` present), never typed.
- Phone links use `telHref`/`smsHref` → E.164 with country code (e.g. `tel:+13527065295`). Do not hand-write `tel:` strings.
- Button colors: phone/Call buttons use `variant="call"` (red `#bb2527`); Book Now uses `variant="booking"` (blue `#3761aa`); secondary links stay `variant="dark"` (black).
- Area body content width is `max-w-[1180px]` — the same as the service page (`commercial-locksmith`).
- The map uses a free Google Maps **iframe embed** (no API key, no billing). No drawn radius circle.
- `RelatedBlogs` links are absolute live URLs (`https://besecurelocksmith.com/blog/...`), `target="_blank" rel="noopener noreferrer"`, for now.
- Internal links inside extracted body content are **relativized** (strip `https://besecurelocksmith.com` → relative path), matching the existing Hampton convention.
- Each area page emits exactly one `LocalBusiness` JSON-LD (BaseLayout `localBusiness={false}` on this route), plus `BreadcrumbList` and `FAQPage`.

**Curated related-blog posts (same set for both cities, this iteration):**

```json
[
  { "title": "How Do I Choose a Good Locksmith Company?", "url": "https://besecurelocksmith.com/blog/how-do-i-choose-a-good-locksmith-company/" },
  { "title": "Lock Rekey vs. Lock Replacement: A Cost & Security Breakdown", "url": "https://besecurelocksmith.com/blog/lock-rekey-vs-lock-replacement-in-high-springs-fl-a-cost-and-security-breakdown-for-florida-properties/" },
  { "title": "Smart Lock Installation Mistakes Homeowners Make", "url": "https://besecurelocksmith.com/blog/smart-lock-installation-in-gainesville-fl-mistakes-homeowners-make-and-how-to-avoid-a-lockout/" }
]
```

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `src/components/sections/RelatedBlogs.astro` | NEW. Renders related-blog cards; nothing when empty. | 1 |
| `tests/area/relatedblogs.test.ts` | NEW. Unit test for RelatedBlogs. | 1 |
| `src/components/sections/AreaMap.astro` | Reworked: "Our {city} Service Area" heading, z=11 embed, NAP with business name + response note. | 2 |
| `tests/area/areamap.test.ts` | Updated for new heading + business name. | 2 |
| `tests/area/page-hampton.test.ts` | One-line heading update (Task 2), full rewrite (Task 5). | 2, 5 |
| `src/components/sections/LocalIntro.astro` | Body container widened 820→1180px. | 3 |
| `tests/area/localintro.test.ts` | Asserts the 1180px width. | 3 |
| `src/lib/area-faqs.ts` | License read from `site.license`, not hardcoded. | 4 |
| `tests/area/area-faqs.test.ts` | Asserts license comes from config. | 4 |
| `src/content/config.ts` | `service-areas` schema: drop `variant`+`neighborhoods`, add `relatedBlogs`. | 5 |
| `src/content/service-areas/locksmith-alachua-fl.json` | Drop variant; add relatedBlogs (Task 5); re-pulled intro (Task 6). | 5, 6 |
| `src/content/service-areas/locksmith-hampton-fl.json` | Drop variant+neighborhoods; add relatedBlogs (Task 5); verified intro (Task 6). | 5, 6 |
| `src/pages/service-areas/[slug]/index.astro` | Unified single-stack route. | 5 |
| `tests/area/collection.test.ts` | relatedBlogs shape + no variant (Task 5); body inline link (Task 6). | 5, 6 |
| `tests/area/schema-variant.test.ts` | Repurposed: no-variant + facts. | 5 |
| `tests/area/hampton-data.test.ts` | Drop variant assertion; keep links/facts. | 5 |
| `tests/area/page.test.ts` | Alachua unified-stack assertions. | 5, 6 |
| `src/components/sections/AreaStats.astro` + `AreaNearby.astro` | DELETED. | 7 |
| `tests/area/areastats.test.ts` + `areanearby.test.ts` | DELETED. | 7 |

---

### Task 1: RelatedBlogs component

**Files:**
- Create: `src/components/sections/RelatedBlogs.astro`
- Test: `tests/area/relatedblogs.test.ts`

**Interfaces:**
- Produces: `RelatedBlogs` Astro component. Props: `{ posts?: { title: string; url: string }[]; city?: string; heading?: string }`. Renders an empty string when `posts` is empty.

- [ ] **Step 1: Write the failing test**

Create `tests/area/relatedblogs.test.ts`:

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RelatedBlogs from '../../src/components/sections/RelatedBlogs.astro';

test('renders post cards that link out, with a heading', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [
    { title: 'How Do I Choose a Good Locksmith Company?', url: 'https://besecurelocksmith.com/blog/how-do-i-choose-a-good-locksmith-company/' },
  ] } });
  expect(html).toContain('How Do I Choose a Good Locksmith Company?');
  expect(html).toContain('href="https://besecurelocksmith.com/blog/how-do-i-choose-a-good-locksmith-company/"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('Read article');
});

test('renders nothing when there are no posts', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [] } });
  expect(html.trim()).toBe('');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/area/relatedblogs.test.ts`
Expected: FAIL — cannot resolve `RelatedBlogs.astro`.

- [ ] **Step 3: Write the component**

Create `src/components/sections/RelatedBlogs.astro`:

```astro
---
import Container from '../primitives/Container.astro';
interface Post { title: string; url: string; }
interface Props { posts?: Post[]; city?: string; heading?: string; }
const { posts = [], heading } = Astro.props as Props;
const title = heading ?? 'Locksmith Tips & Guides';
---
{posts.length > 0 && (
  <section>
    <Container>
      <div class="max-w-[1180px] mx-auto py-10">
        <h2 class="m-0 mb-6 text-ink font-medium tracking-[-0.4px]" style="font-size:clamp(22px,3vw,28px);">{title}</h2>
        <div class="grid gap-6" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
          {posts.map((p) => (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              class="group rounded-[24px] border border-border bg-white p-6 flex flex-col gap-3 transition-colors hover:border-primary"
            >
              <h3 class="m-0 text-[18px] font-bold leading-[1.3] tracking-[-0.2px] text-ink">{p.title}</h3>
              <span class="mt-auto inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary">Read article &rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </Container>
  </section>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/area/relatedblogs.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/RelatedBlogs.astro tests/area/relatedblogs.test.ts
git commit -m "feat(area): add RelatedBlogs module"
```

---

### Task 2: Rework AreaMap (service-area framing + NAP)

**Files:**
- Modify: `src/components/sections/AreaMap.astro`
- Test: `tests/area/areamap.test.ts`
- Modify: `tests/area/page-hampton.test.ts:14` (heading string only — page still renders via the old route until Task 5)

**Interfaces:**
- Consumes: `offices` (`src/config/offices.ts`), `telHref`/`site` (`src/config/site.ts`).
- Produces: `AreaMap` with props `{ area: { city: string; office?: 'gainesville'|'ocala'; responseTime?: string } }`. Heading text is `Our {city} Service Area`.

- [ ] **Step 1: Update the unit test (write the new expectations first)**

Replace the body of `tests/area/areamap.test.ts` with:

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaMap from '../../src/components/sections/AreaMap.astro';

test('frames the city service area with map + business NAP', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaMap, { props: { area: { city: 'Hampton', office: 'gainesville', responseTime: '~30 min' } } });
  expect(html).toContain('Our Hampton Service Area');        // reframed heading
  expect(html).toContain('Be Secure Locksmith');             // business Name (NAP)
  expect(html).toContain('Hampton%2C%20FL');                 // map query encodes "Hampton, FL"
  expect(html).toContain('901 NW 8th Ave');                  // serving office Address (NAP)
  expect(html).toContain('href="tel:+13527065295"');         // office Phone (NAP)
  expect(html).toContain('kgmid=/g/1ptx2pkfg');              // office GBP link
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/area/areamap.test.ts`
Expected: FAIL — `Our Hampton Service Area` / `Be Secure Locksmith` not found.

- [ ] **Step 3: Rework the component**

Replace `src/components/sections/AreaMap.astro` with:

```astro
---
import Container from '../primitives/Container.astro';
import Button from '../primitives/Button.astro';
import { offices } from '../../config/offices';
import { telHref, site } from '../../config/site';
const { area } = Astro.props;
const office = offices[area.office ?? 'gainesville'];
const mapQuery = `${area.city}, FL`;
const rt = (area.responseTime ?? '~30 min').replace('~', '');
---
<section>
  <Container>
    <div class="max-w-[1180px] mx-auto py-10">
      <h2 class="m-0 mb-6 text-ink font-medium tracking-[-0.4px]" style="font-size:clamp(22px,3vw,28px);">Our {area.city} Service Area</h2>
      <div class="grid gap-6 items-stretch" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));">
        <div class="relative rounded-[24px] overflow-hidden border border-border" style="min-height:300px;">
          <iframe title={`Service area map for ${area.city}, FL`} loading="lazy" class="w-full h-full border-0 block" style="min-height:300px;"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=11&ie=UTF8&iwloc=&output=embed`}></iframe>
          <a href={office.gbp} target="_blank" rel="noopener noreferrer" aria-label={`View our ${office.label} office on Google`} class="absolute inset-0 z-10 flex items-end justify-end p-3">
            <span class="inline-flex items-center rounded-pill bg-white/95 px-3 py-[7px] text-[12.5px] font-semibold text-ink shadow-[0_2px_12px_rgba(10,19,23,0.20)]">View on Google &rarr;</span>
          </a>
        </div>
        <div class="rounded-[24px] border border-border bg-surface flex flex-col justify-center" style="padding:clamp(24px,3vw,36px);">
          <p class="m-0 mb-1 text-[12px] font-bold uppercase tracking-[1px] text-muted">Serving {area.city} &amp; surrounding areas</p>
          <h3 class="m-0 mb-2 text-ink font-bold text-[20px]">{site.name}</h3>
          <p class="m-0 mb-2 text-[16px] leading-[1.5] text-secondary">Typically on-site in {rt} across {area.city}, served from our {office.label} office.</p>
          <p class="m-0 mb-5 text-[15px] leading-[1.5] text-muted">{office.street}<br />{office.cityStateZip}</p>
          <Button href={telHref(office.phone)} variant="call" class="self-start">{office.phone}</Button>
        </div>
      </div>
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Keep the Hampton page test green (heading rename)**

In `tests/area/page-hampton.test.ts`, change line 14 from:

```ts
  expect(html).toContain('Locksmith Coverage in Hampton, FL');        // AreaMap
```
to:
```ts
  expect(html).toContain('Our Hampton Service Area');                 // AreaMap
```

- [ ] **Step 5: Run unit + build + Hampton page test**

Run: `npx vitest run tests/area/areamap.test.ts && npm run build && npx vitest run tests/area/page-hampton.test.ts`
Expected: areamap PASS; build succeeds; page-hampton PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/AreaMap.astro tests/area/areamap.test.ts tests/area/page-hampton.test.ts
git commit -m "feat(area): rework AreaMap as service-area + NAP block"
```

---

### Task 3: Widen the area body to the service-page width

**Files:**
- Modify: `src/components/sections/LocalIntro.astro:7`
- Test: `tests/area/localintro.test.ts`

**Interfaces:**
- Produces: `LocalIntro` unchanged props `{ city: string; intro: string[] }`; body container is `max-w-[1180px]`.

- [ ] **Step 1: Update the test**

Append to `tests/area/localintro.test.ts` inside the existing test (after the existing assertions, before the closing `});`):

```ts
  expect(html).toContain('max-w-[1180px]');                    // body matches service-page width
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/area/localintro.test.ts`
Expected: FAIL — `max-w-[1180px]` not found (still 820px).

- [ ] **Step 3: Widen the container**

In `src/components/sections/LocalIntro.astro`, change line 7 from:

```astro
    <div class="area-intro max-w-[820px] mx-auto py-14 md:py-16">
```
to:
```astro
    <div class="area-intro max-w-[1180px] mx-auto py-14 md:py-16">
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/area/localintro.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/LocalIntro.astro tests/area/localintro.test.ts
git commit -m "feat(area): widen area body to 1180px (match service page)"
```

---

### Task 4: Localized FAQ license from config

**Files:**
- Modify: `src/lib/area-faqs.ts`
- Test: `tests/area/area-faqs.test.ts`

**Interfaces:**
- Consumes: `site` from `src/config/site.ts` (`site.license === 'HCLO18005'`).
- Produces: `buildAreaFaqs` signature unchanged; FAQ #4 answer reads `(#${site.license})`.

- [ ] **Step 1: Update the test**

Replace `tests/area/area-faqs.test.ts` with:

```ts
import { test, expect } from 'vitest';
import { buildAreaFaqs } from '../../src/lib/area-faqs';
import { site } from '../../src/config/site';

test('interpolates city/county/zips/response/office', () => {
  const faqs = buildAreaFaqs({ city: 'Hampton', county: 'Bradford County', zips: ['32044'], responseTime: '~30 min' }, 'Gainesville');
  expect(faqs.length).toBeGreaterThanOrEqual(3);
  const all = JSON.stringify(faqs);
  expect(all).toContain('Hampton');
  expect(all).toContain('Bradford County');
  expect(all).toContain('32044');
  expect(all).toContain('Gainesville');
  expect(all).not.toContain('undefined');
});

test('reads the license number from site config', () => {
  const faqs = buildAreaFaqs({ city: 'Hampton', responseTime: '~30 min' }, 'Gainesville');
  expect(JSON.stringify(faqs)).toContain(site.license);
});

test('omits ZIPs gracefully when none', () => {
  const faqs = buildAreaFaqs({ city: 'X', county: 'Y County', responseTime: '~30 min' }, 'Gainesville');
  expect(JSON.stringify(faqs)).not.toContain('undefined');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/area/area-faqs.test.ts`
Expected: PASS on the literal-`HCLO18005` tests already (the string matches by coincidence). To make the intent fail-first, this is acceptable: proceed to wire the import so the value is sourced from config. (If it already passes, the implementation step still removes the hardcoded duplication required by the spec.)

- [ ] **Step 3: Source the license from config**

In `src/lib/area-faqs.ts`, add the import at the top:

```ts
import { site } from '../config/site';
```

Change FAQ #4's answer (the `order: 4` entry) from:

```ts
      answer: `Yes. All of our technicians are fully licensed (#HCLO18005) and insured for your protection.` },
```
to:
```ts
      answer: `Yes. All of our technicians are fully licensed (#${site.license}) and insured for your protection.` },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/area/area-faqs.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/area-faqs.ts tests/area/area-faqs.test.ts
git commit -m "refactor(area): read FAQ license from site config"
```

---

### Task 5: Unify the route + collection schema + data fields

**Files:**
- Modify: `src/content/config.ts:36-54` (the `serviceAreas` collection)
- Modify: `src/content/service-areas/locksmith-alachua-fl.json`
- Modify: `src/content/service-areas/locksmith-hampton-fl.json`
- Modify: `src/pages/service-areas/[slug]/index.astro`
- Modify: `tests/area/collection.test.ts`, `tests/area/schema-variant.test.ts`, `tests/area/hampton-data.test.ts`, `tests/area/page.test.ts`, `tests/area/page-hampton.test.ts`

**Interfaces:**
- Consumes: `RelatedBlogs` (Task 1), reworked `AreaMap` (Task 2), `buildAreaFaqs` (Task 4), `Faq`, `ServicesGrid`, `LocalIntro`, `AreaHero`, `TrustStrip`, `CtaCard`.
- Produces: `service-areas` schema with `relatedBlogs: { title: string; url: string }[]` and no `variant`/`neighborhoods`. Route renders the fixed stack: AreaHero → TrustStrip → LocalIntro → ServicesGrid → RelatedBlogs → AreaMap → Faq → CtaCard.

- [ ] **Step 1: Update the collection schema**

In `src/content/config.ts`, replace the `serviceAreas` definition (lines 36–54) with:

```ts
const serviceAreas = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    city: z.string(),
    title: z.string(),
    description: z.string(),
    heroSubhead: z.string(),
    intro: z.array(z.string()),
    location: z.string().default('main'),
    order: z.number(),
    county: z.string().optional(),
    zips: z.array(z.string()).default([]),
    office: z.enum(['gainesville', 'ocala']).default('gainesville'),
    responseTime: z.string().default('~30 min'),
    relatedBlogs: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
  }),
});
```

(The `export const collections = { ..., 'service-areas': serviceAreas }` line is unchanged — keep the hyphen key.)

- [ ] **Step 2: Add relatedBlogs + drop variant/neighborhoods in both data files**

Edit `src/content/service-areas/locksmith-alachua-fl.json`: remove the `"variant": "lean",` line, and add (after the `"office"` field) the `relatedBlogs` array from Global Constraints. Final keys: slug, city, title, description, heroSubhead, intro, location, order, county, zips, office, relatedBlogs.

Edit `src/content/service-areas/locksmith-hampton-fl.json`: remove the `"variant": "rich",` line and the `"neighborhoods": [...]` array, and add the same `relatedBlogs` array. Use Python to keep the curly apostrophes in `intro` intact:

```bash
python3 - <<'PY'
import json
posts = [
  {"title":"How Do I Choose a Good Locksmith Company?","url":"https://besecurelocksmith.com/blog/how-do-i-choose-a-good-locksmith-company/"},
  {"title":"Lock Rekey vs. Lock Replacement: A Cost & Security Breakdown","url":"https://besecurelocksmith.com/blog/lock-rekey-vs-lock-replacement-in-high-springs-fl-a-cost-and-security-breakdown-for-florida-properties/"},
  {"title":"Smart Lock Installation Mistakes Homeowners Make","url":"https://besecurelocksmith.com/blog/smart-lock-installation-in-gainesville-fl-mistakes-homeowners-make-and-how-to-avoid-a-lockout/"},
]
for f in ["src/content/service-areas/locksmith-alachua-fl.json","src/content/service-areas/locksmith-hampton-fl.json"]:
    d = json.load(open(f, encoding="utf-8"))
    d.pop("variant", None); d.pop("neighborhoods", None)
    d["relatedBlogs"] = posts
    json.dump(d, open(f,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f, "ok; keys:", list(d.keys()))
PY
```

Verify curly apostrophes survived:

```bash
python3 -c "import json;print('’' in json.load(open('src/content/service-areas/locksmith-hampton-fl.json'))['intro'][1])"
```
Expected: `True` (or `True` for whichever block contains an apostrophe).

- [ ] **Step 3: Rewrite the route**

Replace `src/pages/service-areas/[slug]/index.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import PromoBar from '../../../components/sections/PromoBar.astro';
import NavBar from '../../../components/sections/NavBar.astro';
import AreaHero from '../../../components/sections/AreaHero.astro';
import TrustStrip from '../../../components/sections/TrustStrip.astro';
import LocalIntro from '../../../components/sections/LocalIntro.astro';
import ServicesGrid from '../../../components/sections/ServicesGrid.astro';
import RelatedBlogs from '../../../components/sections/RelatedBlogs.astro';
import AreaMap from '../../../components/sections/AreaMap.astro';
import Faq from '../../../components/sections/Faq.astro';
import CtaCard from '../../../components/sections/CtaCard.astro';
import Footer from '../../../components/sections/Footer.astro';
import StickyCallBar from '../../../components/sections/StickyCallBar.astro';
import Container from '../../../components/primitives/Container.astro';
import { resolveLocation, resolvePhone } from '../../../lib/locations';
import { site } from '../../../config/site';
import { offices } from '../../../config/offices';
import { buildAreaFaqs } from '../../../lib/area-faqs';

export async function getStaticPaths() {
  const areas = await getCollection('service-areas');
  return areas.map((a) => ({ params: { slug: a.data.slug }, props: { area: a.data } }));
}

const { area } = Astro.props;
const loc = resolveLocation(area.location);
const phone = resolvePhone(loc);
const office = offices[area.office ?? 'gainesville'];
const areaFaqs = buildAreaFaqs(area, office.label);
const pageUrl = `https://besecurelocksmith.com/service-areas/${area.slug}/`;
const ctaBody = `Locked out or need new locks in ${area.city}? Be Secure Locksmith is your trusted local, mobile locksmith. <a href="/contact-us/">Contact us today</a> or call now — fast, licensed, and insured service.`;

const localBusinessJsonLd = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness', name: site.name, telephone: phone,
  areaServed: { '@type': 'City', name: `${area.city}, FL` }, url: pageUrl,
  address: { '@type': 'PostalAddress', streetAddress: loc.nap.street, addressLocality: loc.nap.city, addressRegion: loc.nap.state, postalCode: loc.nap.zip },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: site.ratingValue, reviewCount: site.ratingCount },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://besecurelocksmith.com/' },
    { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://besecurelocksmith.com/service-areas/' },
    { '@type': 'ListItem', position: 3, name: area.city, item: pageUrl },
  ],
};
---
<BaseLayout title={area.title} description={area.description} location={area.location} localBusiness={false}>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(localBusinessJsonLd)} />
    <script type="application/ld+json" set:html={JSON.stringify(breadcrumbJsonLd)} />
  </Fragment>

  <PromoBar location={area.location} />
  <NavBar location={area.location} />
  <main>
    <AreaHero city={area.city} heroSubhead={area.heroSubhead} location={area.location} />
    <TrustStrip />
    <LocalIntro city={area.city} intro={area.intro} />
    <ServicesGrid />
    <RelatedBlogs posts={area.relatedBlogs} city={area.city} />
    <AreaMap area={area} />
    <Faq faqs={areaFaqs} />
    <section>
      <Container>
        <div class="max-w-[1180px] mx-auto pb-16 md:pb-20">
          <CtaCard location={area.location} heading={`Contact Be Secure Locksmith in ${area.city}, FL`} body={ctaBody} />
        </div>
      </Container>
    </section>
  </main>
  <Footer location={area.location} />
  <StickyCallBar location={area.location} />
</BaseLayout>
```

- [ ] **Step 4: Update the data/schema tests**

Replace `tests/area/collection.test.ts` with:

```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

test('Alachua service-area entry has the required fields', () => {
  const d = JSON.parse(readFileSync(new URL('../../src/content/service-areas/locksmith-alachua-fl.json', import.meta.url), 'utf8'));
  expect(d.slug).toBe('locksmith-alachua-fl');
  expect(d.city).toBe('Alachua');
  expect(d.title).toBe('Locksmith Alachua, FL - Home, Car & Business Lockouts');
  expect(d.location).toBe('main');
  expect(Array.isArray(d.intro) && d.intro.length).toBeGreaterThan(0);
  expect(d.variant).toBeUndefined();                    // single template
  expect(Array.isArray(d.relatedBlogs)).toBe(true);
  expect(d.relatedBlogs.length).toBeGreaterThan(0);
  expect(d.relatedBlogs[0].url).toContain('/blog/');
});
```

Replace `tests/area/schema-variant.test.ts` with:

```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (f: string) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));

test('Alachua carries county + zips and no variant (single template)', () => {
  const d = read('../../src/content/service-areas/locksmith-alachua-fl.json');
  expect(d.variant).toBeUndefined();
  expect(d.county).toBe('Alachua County');
  expect(d.zips).toContain('32615');
});
```

In `tests/area/hampton-data.test.ts`, change line 6 from:

```ts
  expect(d.variant).toBe('rich');
```
to:
```ts
  expect(d.variant).toBeUndefined();
```

- [ ] **Step 5: Rewrite the two page integration tests**

Replace `tests/area/page.test.ts` with:

```ts
import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../../dist/service-areas/locksmith-alachua-fl/index.html');

test('Alachua page builds with the unified stack + SEO', () => {
  if (!existsSync(p)) throw new Error('dist page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Alachua, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Alachua, FL');                  // AreaHero H1
  expect(html).toContain('Your Local, Mobile Locksmith in Alachua, FL'); // LocalIntro
  expect(html).toContain('Trusted Locksmith Services');                // ServicesGrid
  expect(html).toContain('Our Alachua Service Area');                  // AreaMap
  expect(html).toContain('/blog/');                                    // RelatedBlogs
  expect(html).toContain('href="tel:+13527065295"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('"@type":"FAQPage"');                         // localized FAQ
  expect(html).toContain('online-booking.workiz.com');                 // Book Now
  expect(html).not.toContain('Nearby areas we serve');                 // AreaNearby removed
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1); // deduped
});
```

Replace `tests/area/page-hampton.test.ts` with:

```ts
import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const p = resolve(__dirname, '../../dist/service-areas/locksmith-hampton-fl/index.html');

test('Hampton page builds with the unified stack + live links', () => {
  if (!existsSync(p)) throw new Error('dist Hampton page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Hampton, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Hampton, FL');                  // AreaHero H1
  expect(html).toContain('href="/services/emergency-lockouts/"');      // live inline link, relativized
  expect(html).not.toMatch(/href="https:\/\/besecurelocksmith\.com\/services\//); // no absolute service links
  expect(html).toContain('Our Hampton Service Area');                  // AreaMap
  expect(html).toContain('/blog/');                                    // RelatedBlogs
  expect(html).toContain('"@type":"FAQPage"');                         // localized FAQ
  expect(html).not.toContain('Nearby areas we serve');                 // AreaNearby removed
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1); // deduped
});
```

- [ ] **Step 6: Build, then run the full suite**

Run: `npm run build && npm test`
Expected: build succeeds (2 service-area pages); all tests PASS. (`areastats.test.ts` and `areanearby.test.ts` still pass here — their components still exist; they are deleted in Task 7.)

- [ ] **Step 7: Commit**

```bash
git add src/content/config.ts src/content/service-areas/locksmith-alachua-fl.json src/content/service-areas/locksmith-hampton-fl.json "src/pages/service-areas/[slug]/index.astro" tests/area/collection.test.ts tests/area/schema-variant.test.ts tests/area/hampton-data.test.ts tests/area/page.test.ts tests/area/page-hampton.test.ts
git commit -m "feat(area): unify service-area template into one modular stack"
```

---

### Task 6: Re-pull exact live body content (Alachua + Hampton)

**Files:**
- Modify: `src/content/service-areas/locksmith-alachua-fl.json` (`intro`)
- Modify: `src/content/service-areas/locksmith-hampton-fl.json` (`intro` — verify/refresh)
- Modify: `tests/area/collection.test.ts` (assert an inline service link), `tests/area/page.test.ts` (assert Alachua inline link)

**Interfaces:**
- Consumes: live pages `https://besecurelocksmith.com/service-areas/locksmith-alachua-fl/` and `.../locksmith-hampton-fl/`.
- Produces: `intro` arrays of HTML block strings (`<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>` with nested `<a>`), internal links relativized to relative paths, curly apostrophes preserved.

- [ ] **Step 1: Crawl both live pages**

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
mkdir -p /tmp/area-pull
curl -s -A "$UA" "https://besecurelocksmith.com/service-areas/locksmith-alachua-fl/" -o /tmp/area-pull/alachua.html
curl -s -A "$UA" "https://besecurelocksmith.com/service-areas/locksmith-hampton-fl/" -o /tmp/area-pull/hampton.html
wc -c /tmp/area-pull/*.html
```
Expected: each file > 100 KB (the live CDN serves curl with a browser UA; a plain fetch 403s).

- [ ] **Step 2: Extract the city narrative body blocks**

Write `/tmp/area-pull/extract.py`. It locates the main city-narrative content (the run of block elements starting at the first intro paragraph and the local "Locksmith Services in {City}" section), keeps `p/h2/h3/ul/ol` blocks with their inline `<a>` anchors, **excludes** global furniture (site header/nav menus, the "Get a Free Quote" Gravity Form, footer, the all-services mega-menu link list), relativizes internal links (`https://besecurelocksmith.com/x/` → `/x/`), and writes the `intro` array back. Anchor text and `href` are preserved verbatim; only the domain is stripped from internal links.

```python
import json, re, sys

def relativize(s):
    return s.replace('https://besecurelocksmith.com', '').replace('http://besecurelocksmith.com', '')

def extract(html, city):
    # Narrow to the city narrative: from the first intro paragraph to the end of the
    # local services section. Adjust the start anchor per page if the lead sentence differs.
    start = html.find('For reliable')
    if start < 0:
        start = html.find('locksmith services in ' + city)
    region = html[start: start + 9000]
    blocks = []
    for m in re.finditer(r'<(p|h2|h3|ul|ol)\b[^>]*>(.*?)</\1>', region, re.S):
        tag, inner = m.group(1), m.group(2)
        # drop blocks that are clearly furniture (form labels, menu lists of >6 service links)
        link_count = len(re.findall(r'<a\b', inner))
        text = re.sub(r'<[^>]+>', '', inner).strip()
        if not text:
            continue
        if 'indicates required fields' in text or link_count > 6:
            continue
        block = f'<{tag}>{inner.strip()}</{tag}>'
        block = relativize(block)
        # collapse whitespace runs inside the block
        block = re.sub(r'\s+', ' ', block).replace('> <', '><')
        blocks.append(block)
    return blocks

for f, city in [('alachua', 'Alachua'), ('hampton', 'Hampton')]:
    html = open(f'/tmp/area-pull/{f}.html', encoding='utf-8').read()
    blocks = extract(html, city)
    path = f'src/content/service-areas/locksmith-{f}-fl.json'
    d = json.load(open(path, encoding='utf-8'))
    if blocks:
        d['intro'] = blocks
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    body = ''.join(d['intro'])
    print(f, 'blocks:', len(d['intro']),
          '| has emergency link:', 'href="/services/emergency-lockouts/"' in body,
          '| has curly apos:', '’' in body,
          '| no domain:', 'besecurelocksmith.com' not in body)
```

Run: `python3 /tmp/area-pull/extract.py`

Expected output shows, for each city: `blocks:` ≥ 3, `has emergency link: True` (Alachua's "emergency locksmith service" link and Hampton's), `has curly apos: True`, `no domain: True`.

> If `has emergency link` is False for a city, the start anchor missed the narrative — adjust the `start` locator (e.g. search for the city's first heading) and re-run. Do not hand-type the body; keep the extraction script as the source of truth.

- [ ] **Step 3: Add inline-link assertions to the data + page tests**

In `tests/area/collection.test.ts`, add inside the Alachua test (before the closing `});`):

```ts
  expect(d.intro.join('')).toContain('href="/services/');     // inline service link preserved, relativized
  expect(d.intro.join('')).not.toContain('besecurelocksmith.com'); // relativized
```

In `tests/area/page.test.ts`, add inside the test (before the closing `});`):

```ts
  expect(html).toContain('href="/services/emergency-lockouts/"'); // Alachua live inline link
```

- [ ] **Step 4: Build and run the suite**

Run: `npm run build && npm test`
Expected: build succeeds; all tests PASS, including the new inline-link assertions on Alachua and the existing ones on Hampton.

- [ ] **Step 5: Commit**

```bash
git add src/content/service-areas/locksmith-alachua-fl.json src/content/service-areas/locksmith-hampton-fl.json tests/area/collection.test.ts tests/area/page.test.ts
git commit -m "content(area): re-pull exact live body with hyperlinks (Alachua, Hampton)"
```

---

### Task 7: Delete the dead AreaStats + AreaNearby modules

**Files:**
- Delete: `src/components/sections/AreaStats.astro`, `src/components/sections/AreaNearby.astro`
- Delete: `tests/area/areastats.test.ts`, `tests/area/areanearby.test.ts`

**Interfaces:**
- Consumes: nothing (the unified route from Task 5 no longer imports these).

- [ ] **Step 1: Confirm nothing imports them**

Run: `grep -rn "AreaStats\|AreaNearby" src`
Expected: no matches (the route was rewritten in Task 5).

- [ ] **Step 2: Delete the components and their tests**

```bash
git rm src/components/sections/AreaStats.astro src/components/sections/AreaNearby.astro tests/area/areastats.test.ts tests/area/areanearby.test.ts
```

- [ ] **Step 3: Build and run the full suite + e2e**

Run: `npm run build && npm test && npm run test:e2e`
Expected: build succeeds; all unit tests PASS (no areastats/areanearby files); 3 e2e tests PASS.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(area): delete unused AreaStats and AreaNearby modules"
```

---

## Self-Review

**Spec coverage:**
- Trash Hampton rich template / one template → Tasks 5, 7. ✓
- Body width = service page (1180px) → Task 3. ✓
- Exact live content incl. hyperlinks → Task 6. ✓
- Service blocks global/modular → route uses shared `ServicesGrid` (no fork); asserted in Task 5 page tests. ✓
- Related blogs below service blocks → Tasks 1, 5 (rendered right after `ServicesGrid`). ✓
- Embedded map + NAP → Task 2. ✓
- Localized FAQs with schema → Tasks 4, 5 (`Faq` always rendered, emits FAQPage). ✓
- Drop AreaStats/AreaNearby/Reviews from area pages → Tasks 5 (route) + 7 (delete). ✓
- Both cities kept → Tasks 5, 6. ✓
- License from config → Task 4. ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code. The extraction script in Task 6 is complete with a documented fallback for the start-anchor edge case (not a placeholder — a verification branch).

**Type consistency:** `RelatedBlogs` props `{ posts, city, heading }` defined in Task 1, consumed in Task 5 with `posts={area.relatedBlogs}`. `relatedBlogs` schema `{ title, url }[]` (Task 5) matches the component's `Post` type (Task 1) and the curated data. `AreaMap` props `{ area }` consistent between Task 2 and the route. `buildAreaFaqs(area, office.label)` signature unchanged.

## Out of Scope

- Blog migration (76 posts); other service pages / cities; a drawn map radius circle.

# Service-Area Page Template (+ Alachua) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a data-driven service-area page template (lean local landing page) and seed the first city, Alachua FL, at `/service-areas/locksmith-alachua-fl/`.

**Architecture:** A `serviceAreas` content collection (one data file per city) feeds a dynamic Astro route `src/pages/service-areas/[slug]/index.astro` via `getStaticPaths()`. The page composes a place-themed `AreaHero`, a shared `TrustStrip`, a `LocalIntro`, the existing `ServicesGrid`, and a shared `CtaCard`, inside `BaseLayout` with per-city SEO + JSON-LD. `TrustStrip` and `CtaCard` are extracted from the existing commercial service page so both page types share one source.

**Tech Stack:** Astro 4 (static), Tailwind v4, Astro content collections (zod), Vitest.

## Global Constraints

- **URL preservation:** the page lives at exactly `/service-areas/locksmith-alachua-fl/` (trailing slash; `trailingSlash:'always'` + `build.format:'directory'` already set).
- **Exact live SEO:** `<title>` = `Locksmith Alachua, FL - Home, Car & Business Lockouts`; meta description = `Our mobile locksmiths cover Alachua, FL for home, car, and business lockouts, rekeys, and lock installs. Licensed, local, and fast. Get help today.`
- **Clean the live artifacts:** H1 → `Locksmith in Alachua, FL` (the live garbled "Certified Locksmith Services in  Locksmith in Alachua, FL" is wrong); fix the "Alucha" typo → "Alachua".
- **Resolved phone everywhere:** all CTAs + JSON-LD telephone use `resolvePhone(resolveLocation(area.location))`. Alachua's `location` is `main` → `352-706-5295`. No hardcoded phone literal in markup.
- **Book Now** → the Workiz URL, centralized as `site.bookingUrl`, opened in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Data-driven:** adding a city = one data file; no template/code edits.
- **No lead form, no blog strip** on these pages (per spec decisions). Services grid replaces the blog strip.
- **Design tokens** only (text-ink, text-secondary, text-muted, bg-surface, bg-primary, border-border, text-amber, rounded-pill, etc.); arbitrary values where no token exists.
- **Booking URL value:** `https://online-booking.workiz.com/?ac=744610670459142e62f3f47913956e45311c10147d3f5224d2489d7eab57c2a7`

---

## File Structure

```
src/config/site.ts                                   # + bookingUrl
src/content/config.ts                                # + serviceAreas collection schema
src/content/service-areas/locksmith-alachua-fl.json  # Alachua data (seed)
src/components/sections/TrustStrip.astro             # extracted from commercial page
src/components/sections/CtaCard.astro                # extracted from commercial page
src/components/sections/AreaHero.astro               # new place-themed hero
src/components/sections/LocalIntro.astro             # new local intro body
src/pages/service-areas/[slug]/index.astro           # dynamic route + assembly
src/pages/services/commercial-locksmith/index.astro  # refactor to use TrustStrip + CtaCard + site.bookingUrl
tests/area/*.test.ts
```

---

## Task 1: `bookingUrl` in config

**Files:**
- Modify: `src/config/site.ts`
- Test: `tests/area/site-booking.test.ts`

**Interfaces:**
- Produces: `site.bookingUrl: string` (the Workiz URL).

- [ ] **Step 1: Write failing test `tests/area/site-booking.test.ts`**

```ts
import { test, expect } from 'vitest';
import { site } from '../../src/config/site';

test('site.bookingUrl is the Workiz booking URL', () => {
  expect(site.bookingUrl).toBe('https://online-booking.workiz.com/?ac=744610670459142e62f3f47913956e45311c10147d3f5224d2489d7eab57c2a7');
});
```

- [ ] **Step 2: Run — FAIL** (`npm test -- tests/area/site-booking.test.ts`).

- [ ] **Step 3: Add `bookingUrl` to the `site` object in `src/config/site.ts`** (place it near `defaultPhone`):

```ts
  bookingUrl: 'https://online-booking.workiz.com/?ac=744610670459142e62f3f47913956e45311c10147d3f5224d2489d7eab57c2a7',
```

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(config): add site.bookingUrl (Workiz)"`

---

## Task 2: Extract `TrustStrip` component (+ refactor commercial page)

**Files:**
- Create: `src/components/sections/TrustStrip.astro`, `tests/area/truststrip.test.ts`
- Modify: `src/pages/services/commercial-locksmith/index.astro` (replace the inline trust strip with `<TrustStrip />`; remove the now-unused `trustItems`/`reviewCount` consts)

**Interfaces:**
- Consumes: `site` (license, insurance, sinceYear, ratingValue, ratingCount).
- Produces: `TrustStrip.astro` — no props; renders the confirmed-facts strip with a bottom border.

- [ ] **Step 1: Write failing test `tests/area/truststrip.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TrustStrip from '../../src/components/sections/TrustStrip.astro';

test('TrustStrip renders the confirmed trust facts', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(TrustStrip, { props: {} });
  expect(html).toContain('HCLO18005');
  expect(html).toContain('BKS56465112');
  expect(html).toContain('Since 2012');
  expect(html).toContain('Family-operated');
  expect(html).toContain('Free security assessment');
  expect(html).toContain('30-min typical response');
  expect(html).toContain('from 2,551 Google reviews');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Create `src/components/sections/TrustStrip.astro`** (move the strip + its data out of the commercial page verbatim):

```astro
---
import Container from '../primitives/Container.astro';
import { site } from '../../config/site';

const trustItems = [
  `Licensed #${site.license}`,
  `Insured #${site.insurance}`,
  `Since ${site.sinceYear}`,
  'Family-operated',
  'Free security assessment',
  '~30-min typical response',
];
const reviewCount = Number(site.ratingCount).toLocaleString('en-US');
---
<section class="border-b border-border bg-white">
  <Container>
    <div class="max-w-[1180px] mx-auto py-[14px] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13.5px] font-medium text-secondary">
      {trustItems.map((item) => (
        <Fragment>
          <span>{item}</span>
          <span class="text-border-2" aria-hidden="true">&bull;</span>
        </Fragment>
      ))}
      <span class="inline-flex items-center gap-1.5">
        <span class="text-amber text-[15px] leading-none">&#9733;</span>
        <span class="font-bold text-ink">{site.ratingValue}</span>
        <span>from {reviewCount} Google reviews</span>
      </span>
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Refactor the commercial page** — in `src/pages/services/commercial-locksmith/index.astro`: add `import TrustStrip from '../../../components/sections/TrustStrip.astro';`; replace the entire inline `<!-- TRUST STRIP -->` `<section>…</section>` block with `<TrustStrip />`; delete the now-unused `trustItems` and `reviewCount` consts from its frontmatter. (Leave `site`/`reviewCount` usages elsewhere intact — `reviewCount` is only used by the strip; remove it.)

- [ ] **Step 5: Run — PASS** (`npm test -- tests/area/truststrip.test.ts`), then `npm run build` and confirm `dist/services/commercial-locksmith/index.html` still contains `HCLO18005` and `from 2,551 Google reviews` (refactor is behavior-preserving).

- [ ] **Step 6: Commit** `git add -A && git commit -m "refactor(sections): extract shared TrustStrip; use it in commercial page"`

---

## Task 3: Extract `CtaCard` component (+ refactor commercial page)

**Files:**
- Create: `src/components/sections/CtaCard.astro`, `tests/area/ctacard.test.ts`
- Modify: `src/pages/services/commercial-locksmith/index.astro` (replace the inline CTA card with `<CtaCard ...>`; use `site.bookingUrl` for the hero Book Now too; drop the local `bookingUrl` const)

**Interfaces:**
- Consumes: `resolveLocation`/`resolvePhone`, `telHref`, `site` (bookingUrl), `Button`.
- Produces: `CtaCard.astro` — props `{ location?: string; heading: string; body: string }` (`body` is HTML). Renders the white card + blue accent + Call (resolved phone) + Book Now (site.bookingUrl, new tab).

- [ ] **Step 1: Write failing test `tests/area/ctacard.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CtaCard from '../../src/components/sections/CtaCard.astro';

test('CtaCard renders heading, resolved Call, and Book Now to Workiz', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(CtaCard, { props: { location: 'main', heading: 'Contact Be Secure in Alachua', body: 'Body <a href="/contact-us/">text</a>.' } });
  expect(html).toContain('Contact Be Secure in Alachua');
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('online-booking.workiz.com');
  expect(html).toContain('Book Now');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Create `src/components/sections/CtaCard.astro`**:

```astro
---
import Button from '../primitives/Button.astro';
import { resolveLocation, resolvePhone } from '../../lib/locations';
import { telHref, site } from '../../config/site';
const { location = 'main', heading, body } = Astro.props;
const phone = resolvePhone(resolveLocation(location));
---
<div class="rounded-[24px] border border-border bg-white p-8 md:p-10" style="box-shadow:0 12px 34px rgba(10,19,23,0.10);">
  <div class="mb-4 h-1 w-12 rounded-full bg-primary"></div>
  <h3 class="m-0 mb-3 text-ink font-bold text-[24px] leading-[1.25] tracking-[-0.3px]">{heading}</h3>
  <p class="m-0 mb-6 text-[16px] leading-[1.6] text-secondary max-w-[680px]" set:html={body}></p>
  <div class="flex flex-wrap gap-3">
    <Button href={telHref(phone)} variant="primary">Call {phone}</Button>
    <Button href={site.bookingUrl} variant="dark" target="_blank" rel="noopener noreferrer">Book Now</Button>
  </div>
</div>
```

(Note: the commercial page's card had a `clear-both` to clear floated figures. Apply that at the usage site, not in the component — see Step 4.)

- [ ] **Step 4: Refactor the commercial page**:
  - Add `import CtaCard from '../../../components/sections/CtaCard.astro';`
  - Replace the inline `<!-- CONTACT CTA CARD -->` `<div>…</div>` block with: `<div class="clear-both mt-14"><CtaCard location={location} heading="Contact Be Secure for Gainesville Commercial Locksmith Services" body={contactHtml} /></div>` (the wrapper keeps the float-clear + top margin; `contactHtml` const stays).
  - Replace the local `const bookingUrl = '…'` usage in the hero Book Now anchor with `site.bookingUrl`, and delete the local `bookingUrl` const. (`site` is already imported in that page.)

- [ ] **Step 5: Run — PASS** (`npm test -- tests/area/ctacard.test.ts`), then `npm run build` and confirm `dist/services/commercial-locksmith/index.html` still contains `Contact Be Secure for Gainesville Commercial Locksmith Services`, `href="tel:3527065295"`, and `online-booking.workiz.com`.

- [ ] **Step 6: Commit** `git add -A && git commit -m "refactor(sections): extract shared CtaCard; centralize bookingUrl in commercial page"`

---

## Task 4: `serviceAreas` content collection + Alachua data

**Files:**
- Modify: `src/content/config.ts`
- Create: `src/content/service-areas/locksmith-alachua-fl.json`, `tests/area/collection.test.ts`

**Interfaces:**
- Produces a `serviceAreas` collection (`type: 'data'`) with schema `{ slug, city, title, description, heroSubhead, intro: string[], location, order }`.

- [ ] **Step 1: Add the collection to `src/content/config.ts`**:

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
  }),
});
```

And add `serviceAreas` to the exported `collections` object.

- [ ] **Step 2: Create `src/content/service-areas/locksmith-alachua-fl.json`** (intro copy pulled verbatim from the live page, "Alucha"→"Alachua" corrected; write with the real apostrophes — the source uses curly ’):

```json
{
  "slug": "locksmith-alachua-fl",
  "city": "Alachua",
  "title": "Locksmith Alachua, FL - Home, Car & Business Lockouts",
  "description": "Our mobile locksmiths cover Alachua, FL for home, car, and business lockouts, rekeys, and lock installs. Licensed, local, and fast. Get help today.",
  "heroSubhead": "Fast, licensed mobile locksmith service for homes, cars, and businesses across Alachua, FL.",
  "intro": [
    "For reliable, efficient locksmith services in Alachua, FL, contact Be Secure Locksmith. Our locksmiths are the highest rated in Alachua County, offering the fastest response time in the region. Whether you need locksmith services for your home, car, or business, our Alachua locksmiths are here to help.",
    "At Be Secure Locksmith, we offer emergency locksmith service, so there’s no need to fret if you’re locked out of your car. Our Alachua locksmiths never use outdated technology such as slim jims to open locked vehicles, as these tools can damage the window insulation or side airbag, causing it to fail to deploy in an accident.",
    "Our customers’ safety is our top priority, which is why all work performed by our technicians is guaranteed. Our goal is to provide unmatched locksmith services to customers throughout Alachua. To schedule commercial, residential, or automotive locksmith services in Alachua, contact Be Secure Locksmith today."
  ],
  "location": "main",
  "order": 1
}
```

Use a small python script with `json.dump(..., ensure_ascii=False)` if needed to guarantee the curly apostrophes (’) are bytes-correct; verify with `python3 -c "import json;print('’' in open('src/content/service-areas/locksmith-alachua-fl.json',encoding='utf-8').read())"` → True.

- [ ] **Step 3: Write the test `tests/area/collection.test.ts`** (getCollection isn't available in vitest — assert via fs, matching the existing `tests/content.test.ts` pattern):

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
});
```

- [ ] **Step 4: Run — PASS** (`npm test -- tests/area/collection.test.ts`), then `npm run build` to confirm the collection schema compiles.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(content): serviceAreas collection + Alachua data"`

---

## Task 5: `AreaHero` component

**Files:**
- Create: `src/components/sections/AreaHero.astro`, `tests/area/areahero.test.ts`

**Interfaces:**
- Consumes: `resolveLocation`/`resolvePhone`, `telHref`, `site` (bookingUrl), `Container`, `Button`.
- Props: `{ city: string; heroSubhead: string; location?: string }`.

- [ ] **Step 1: Write failing test `tests/area/areahero.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaHero from '../../src/components/sections/AreaHero.astro';

test('AreaHero renders city H1, breadcrumb, resolved Call, Book Now', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaHero, { props: { city: 'Alachua', heroSubhead: 'Fast local locksmith.', location: 'main' } });
  expect(html).toContain('Locksmith in Alachua, FL');
  expect(html).toContain('href="/service-areas/"');           // breadcrumb
  expect(html).toContain('Service Area');                       // eyebrow/badge
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('online-booking.workiz.com');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Create `src/components/sections/AreaHero.astro`**:

```astro
---
import Container from '../primitives/Container.astro';
import Button from '../primitives/Button.astro';
import { resolveLocation, resolvePhone } from '../../lib/locations';
import { telHref, site } from '../../config/site';
const { city, heroSubhead, location = 'main' } = Astro.props;
const phone = resolvePhone(resolveLocation(location));
const pinSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7fb4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
---
<section class="relative overflow-hidden text-white" style="background:linear-gradient(160deg,#0e4a8f 0%,#0b2f5e 42%,#0a1830 100%);">
  <div class="absolute inset-0 opacity-[0.09]" style="background-image:radial-gradient(circle at 1px 1px,#ffffff 1px,transparent 0);background-size:22px 22px;"></div>
  <div class="absolute -top-28 -right-20 w-[540px] h-[540px] rounded-full pointer-events-none" style="background:radial-gradient(circle,rgba(56,150,255,0.55),transparent 70%);"></div>
  <Container>
    <div class="relative max-w-[1180px] mx-auto py-14 md:py-20">
      <nav aria-label="Breadcrumb" class="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-white/70">
        <a href="/" class="hover:text-white">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/service-areas/" class="hover:text-white">Service Areas</a>
        <span aria-hidden="true">/</span>
        <span class="text-white">{city}</span>
      </nav>
      <span class="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[1px] text-link-dark mb-5">
        <span set:html={pinSvg}></span>Service Area
      </span>
      <h1 class="m-0 mb-4 font-medium text-white max-w-[760px]" style="font-size:clamp(32px,5.2vw,56px);line-height:1.08;letter-spacing:-1.2px;">
        Locksmith in {city}, FL
      </h1>
      <p class="m-0 mb-7 text-[18px] leading-[1.4] text-white/80 max-w-[640px]">{heroSubhead}</p>
      <div class="flex flex-wrap gap-3">
        <Button href={telHref(phone)} variant="primary">Call {phone}</Button>
        <a href={site.bookingUrl} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-[15px] font-bold px-[30px] py-[15px] rounded-[100px] border border-white/40 text-white transition-colors hover:bg-white/10">Book Now</a>
      </div>
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(sections): add place-themed AreaHero"`

---

## Task 6: `LocalIntro` component

**Files:**
- Create: `src/components/sections/LocalIntro.astro`, `tests/area/localintro.test.ts`

**Interfaces:**
- Consumes: `Container`.
- Props: `{ city: string; intro: string[] }`.

- [ ] **Step 1: Write failing test `tests/area/localintro.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LocalIntro from '../../src/components/sections/LocalIntro.astro';

test('LocalIntro renders the city heading and intro paragraphs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(LocalIntro, { props: { city: 'Alachua', intro: ['First para about Alachua.', 'Second para.'] } });
  expect(html).toContain('Your Local, Mobile Locksmith in Alachua, FL');
  expect(html).toContain('First para about Alachua.');
  expect(html).toContain('Second para.');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Create `src/components/sections/LocalIntro.astro`**:

```astro
---
import Container from '../primitives/Container.astro';
const { city, intro } = Astro.props;
---
<section>
  <Container>
    <div class="max-w-[820px] mx-auto py-14 md:py-16">
      <h2 class="m-0 text-ink font-medium tracking-[-0.6px]" style="font-size:clamp(26px,3.4vw,34px);line-height:1.2;">
        Your Local, Mobile Locksmith in {city}, FL
      </h2>
      <div class="mt-3 mb-6 h-1 w-12 rounded-full bg-primary"></div>
      {intro.map((p) => (
        <p class="m-0 mb-4 text-[16px] leading-[1.65] text-secondary">{p}</p>
      ))}
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Run — PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(sections): add LocalIntro"`

---

## Task 7: Dynamic route + page assembly + verification

**Files:**
- Create: `src/pages/service-areas/[slug]/index.astro`
- Test: `tests/area/page.test.ts`

**Interfaces:**
- Consumes: `getCollection('serviceAreas')`, `BaseLayout`, `PromoBar`, `NavBar`, `AreaHero`, `TrustStrip`, `LocalIntro`, `ServicesGrid`, `CtaCard`, `Footer`, `StickyCallBar`, `resolveLocation`/`resolvePhone`, `site`.

- [ ] **Step 1: Create `src/pages/service-areas/[slug]/index.astro`**:

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
import CtaCard from '../../../components/sections/CtaCard.astro';
import Footer from '../../../components/sections/Footer.astro';
import StickyCallBar from '../../../components/sections/StickyCallBar.astro';
import Container from '../../../components/primitives/Container.astro';
import { resolveLocation, resolvePhone } from '../../../lib/locations';
import { site } from '../../../config/site';

export async function getStaticPaths() {
  const areas = await getCollection('serviceAreas');
  return areas.map((a) => ({ params: { slug: a.data.slug }, props: { area: a.data } }));
}

const { area } = Astro.props;
const loc = resolveLocation(area.location);
const phone = resolvePhone(loc);
const pageUrl = `https://besecurelocksmith.com/service-areas/${area.slug}/`;

const localBusinessJsonLd = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness',
  name: site.name, telephone: phone, areaServed: { '@type': 'City', name: `${area.city}, FL` }, url: pageUrl,
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
const ctaBody = `Locked out or need new locks in ${area.city}? Be Secure Locksmith is your trusted local, mobile locksmith. <a href="/contact-us/">Contact us today</a> or call now — fast, licensed, and insured service.`;
---
<BaseLayout title={area.title} description={area.description} location={area.location}>
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

<style is:global>
  .article-body :is(p, li) a { color: #0064e0; text-decoration: underline; text-underline-offset: 2px; }
</style>
```

(The CtaCard body link uses default link styling; if it renders unstyled that's acceptable — it sits on a white card. The `<style>` block is harmless; remove if lint flags it as unused.)

- [ ] **Step 2: Build to generate the route** — `npm run build`. Expected: `dist/service-areas/locksmith-alachua-fl/index.html` exists.

- [ ] **Step 3: Write verification test `tests/area/page.test.ts`** (build-output assertion, like `tests/homepage.test.ts`):

```ts
import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../../dist/service-areas/locksmith-alachua-fl/index.html');

test('Alachua service-area page builds with correct content + SEO', () => {
  if (!existsSync(p)) throw new Error('dist page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Alachua, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Alachua, FL');                 // cleaned H1
  expect(html).toContain('Your Local, Mobile Locksmith in Alachua, FL');
  expect(html).not.toContain('Alucha');                                // typo fixed
  expect(html).toContain('href="tel:3527065295"');                    // resolved phone
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('online-booking.workiz.com');                // Book Now
});
```

- [ ] **Step 4: Run — PASS** (`npm test -- tests/area/page.test.ts`).

- [ ] **Step 5: Full verification** — `npm test` (entire suite green, incl. homepage/commercial/contact), `npm run build` (success; both `dist/index.html` and the Alachua page present), `npm run test:e2e` (3 e2e still pass). Confirm the route is reachable.

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(service-areas): dynamic [slug] route + Alachua page"`

---

## Self-Review

**1. Spec coverage:** Data-driven template (collection + `[slug]` route) → T4/T7. Alachua seeded with exact title/meta + cleaned H1/typo + real intro → T4/T7. Place-themed hero → T5. Trust strip → T2. Local intro → T6. Services grid → reused in T7. CTA card → T3/T7. Shared TrustStrip/CtaCard extracted + commercial refactored (no visual change) → T2/T3. `site.bookingUrl` centralized → T1/T3. Resolved phone everywhere → T5/T3/T7. LocalBusiness + BreadcrumbList JSON-LD + canonical (BaseLayout) → T7. Adding a city = one data file → T4/T7 (getStaticPaths). All spec sections mapped.

**2. Placeholder scan:** No TBD/TODO; every step has real code, real Alachua copy, exact title/meta. The one prose note (T7 `<style>` removal-if-unused) is guidance, not a placeholder — concrete.

**3. Type consistency:** `area.{slug,city,title,description,heroSubhead,intro,location,order}` defined in T4 schema and consumed identically in T5/T6/T7. `CtaCard` props `{location, heading, body}` consistent (T3↔T7). `AreaHero` props `{city, heroSubhead, location}` consistent (T5↔T7). `LocalIntro` props `{city, intro}` consistent (T6↔T7). `TrustStrip` propless (T2↔T7). `site.bookingUrl` (T1) used in T3/T5. `resolveLocation`/`resolvePhone`/`telHref` used with existing signatures.

# Hyperlocal Service-Area Variant (+ Hampton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rich, hyperlocal `variant` to the service-area template and build it on Hampton, FL — comparable side-by-side with the lean Alachua page.

**Architecture:** A per-city `variant` (`lean`|`rich`) flag in the `serviceAreas` collection drives which layout the shared `[slug]` route renders. The rich layout adds AreaStats, AreaMap (coverage map + nearest office), AreaNearby (neighborhoods + nearby-area cross-links), reused Reviews, and a city-interpolated Faq. `LocalIntro` renders HTML blocks so live body content keeps its inline links. The two physical offices are centralized into config.

**Tech Stack:** Astro 4 (static), Tailwind v4, Astro content collections (zod), Vitest.

## Global Constraints

- **Both variants coexist:** Alachua = `lean` (unchanged layout), Hampton = `rich`. Route branches on `area.variant`.
- **URL preservation:** Hampton at exactly `/service-areas/locksmith-hampton-fl/` (trailing slash, directory build).
- **Exact live SEO (Hampton):** title `Locksmith Hampton, FL - Home, Car & Business Lockouts`; description `Need fast lock help in Hampton, FL? Our licensed mobile team covers home, car, and business lockouts, rekeys, and installs with local response. Get help.`
- **Body fidelity + links:** Hampton body pulled verbatim from the live page; inline links preserved and **relativized** (`https://besecurelocksmith.com` → ``). Curly apostrophes (U+2019) preserved.
- **Auto-derived facts:** county, ZIPs, nearest office + response time, nearby-area cross-links (from the collection), city-interpolated FAQ. `neighborhoods` optional. Reviews reuse the general 5.
- **Resolved phone:** city CTAs via the locations model (Hampton = `main` → 352-706-5295); the office panel shows the serving office's own phone. Book Now → `site.bookingUrl`.
- **No regression** to Alachua (lean) or any existing page.
- **Office data (verbatim):** gainesville → 901 NW 8th Ave. C17, Gainesville, FL 32601 · 352-706-5295 · kgmid `/g/1ptx2pkfg`; ocala → 217 SE 1st Ave. Suite 200-50, Ocala, FL 34471 · 352-325-7953 · kgmid `/g/1yfprvxjj`.

---

## File Structure

```
src/config/offices.ts                                  # NEW — centralized offices (gainesville, ocala)
src/components/sections/ServiceAreas.astro             # refactor to use offices (behavior-preserving)
src/content/config.ts                                  # extend serviceAreas schema
src/content/service-areas/locksmith-alachua-fl.json    # + variant:'lean'; intro → HTML <p> blocks
src/content/service-areas/locksmith-hampton-fl.json    # NEW — variant:'rich', live body w/ links
src/components/sections/LocalIntro.astro               # render intro entries as HTML blocks
src/lib/area-faqs.ts                                   # NEW — buildAreaFaqs(area, officeCity)
src/components/sections/AreaStats.astro                # NEW
src/components/sections/AreaMap.astro                  # NEW
src/components/sections/AreaNearby.astro               # NEW
src/layouts/BaseLayout.astro                           # + localBusiness prop (suppress default)
src/pages/service-areas/[slug]/index.astro             # branch on variant; assemble rich; inject JSON-LD
tests/area/*.test.ts
```

---

## Task 1: Centralize offices config (+ refactor ServiceAreas)

**Files:**
- Create: `src/config/offices.ts`, `tests/area/offices.test.ts`
- Modify: `src/components/sections/ServiceAreas.astro` (use `offices` instead of the inline `locations` array)

**Interfaces:**
- Produces: `offices` — `Record<'gainesville'|'ocala', { key, label, street, cityStateZip, phone, mapQuery, gbp }>`, plus `type OfficeKey`.

- [ ] **Step 1: Write failing test `tests/area/offices.test.ts`**

```ts
import { test, expect } from 'vitest';
import { offices } from '../../src/config/offices';

test('offices has gainesville and ocala with phone + GBP', () => {
  expect(offices.gainesville.phone).toBe('352-706-5295');
  expect(offices.gainesville.gbp).toContain('kgmid=/g/1ptx2pkfg');
  expect(offices.ocala.cityStateZip).toBe('Ocala, FL 34471');
  expect(offices.ocala.gbp).toContain('kgmid=/g/1yfprvxjj');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Create `src/config/offices.ts`**

```ts
export type OfficeKey = 'gainesville' | 'ocala';
export const offices = {
  gainesville: {
    key: 'gainesville', label: 'Gainesville',
    street: '901 NW 8th Ave. C17', cityStateZip: 'Gainesville, FL 32601',
    phone: '352-706-5295',
    mapQuery: '901 NW 8th Ave C17 Gainesville FL 32601',
    gbp: 'https://www.google.com/search?kgmid=/g/1ptx2pkfg',
  },
  ocala: {
    key: 'ocala', label: 'Ocala',
    street: '217 SE 1st Ave. Suite 200-50', cityStateZip: 'Ocala, FL 34471',
    phone: '352-325-7953',
    mapQuery: '217 SE 1st Ave Suite 200 Ocala FL 34471',
    gbp: 'https://www.google.com/search?kgmid=/g/1yfprvxjj',
  },
} as const;
```

- [ ] **Step 4: Refactor `ServiceAreas.astro`** — replace its inline `locations` array with `import { offices } from '../../config/offices'` and `import { site } from '../../config/site'`, building the rendered list as `Object.values(offices).map((o) => ({ ...o, hours: site.hours }))`. Keep all existing markup/classes (the map iframe, address, hours, Call button, the kgmid overlay link) — only the data source changes. Behavior must be identical.

- [ ] **Step 5: Run — PASS** (`npm test -- tests/area/offices.test.ts`), then `npm run build` and confirm `dist/index.html` still contains `901 NW 8th Ave`, `217 SE 1st Ave`, `Ocala, FL 34471`, and both kgmid URLs.

- [ ] **Step 6: Commit** `git add -A && git commit -m "refactor(config): centralize offices; ServiceAreas uses it"`

---

## Task 2: Extend serviceAreas schema (+ Alachua variant)

**Files:**
- Modify: `src/content/config.ts`, `src/content/service-areas/locksmith-alachua-fl.json`
- Test: `tests/area/schema-variant.test.ts`

**Interfaces:**
- Produces schema fields: `variant: z.enum(['lean','rich']).default('lean')`, `county: z.string().optional()`, `zips: z.array(z.string()).default([])`, `office: z.enum(['gainesville','ocala']).default('gainesville')`, `responseTime: z.string().default('~30 min')`, `neighborhoods: z.array(z.string()).default([])`.

- [ ] **Step 1: Extend the `serviceAreas` schema in `src/content/config.ts`** — add the six fields above to its `z.object({...})` (alongside the existing slug/city/title/description/heroSubhead/intro/location/order).

- [ ] **Step 2: Update `src/content/service-areas/locksmith-alachua-fl.json`** — add `"variant": "lean"`, `"county": "Alachua County"`, `"zips": ["32615", "32616"]`, `"office": "gainesville"`. Leave its existing `intro` as-is for now (Task 3 converts intro to HTML blocks). Preserve curly apostrophes (edit via python `json.load`/`json.dump(..., ensure_ascii=False)` to be safe).

- [ ] **Step 3: Write test `tests/area/schema-variant.test.ts`**

```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (f: string) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));

test('Alachua is variant lean with county + zips', () => {
  const d = read('../../src/content/service-areas/locksmith-alachua-fl.json');
  expect(d.variant).toBe('lean');
  expect(d.county).toBe('Alachua County');
  expect(d.zips).toContain('32615');
});
```

- [ ] **Step 4: Run — PASS** (`npm test -- tests/area/schema-variant.test.ts`), then `npm run build` (schema compiles).

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(content): extend serviceAreas schema (variant + hyperlocal facts); Alachua=lean"`

---

## Task 3: LocalIntro renders HTML blocks (+ Alachua intro → HTML)

**Files:**
- Modify: `src/components/sections/LocalIntro.astro`, `src/content/service-areas/locksmith-alachua-fl.json`
- Test: `tests/area/localintro.test.ts` (replace existing)

**Interfaces:**
- `LocalIntro` props `{ city: string; intro: string[] }` — each `intro` entry is a full HTML block (`<p>…</p>`, `<h3>…</h3>`, or `<ul>…</ul>`), rendered via `set:html` (so inline `<a>` links work). Keeps the auto H2 "Your Local, Mobile Locksmith in {city}, FL".

- [ ] **Step 1: Rewrite `tests/area/localintro.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LocalIntro from '../../src/components/sections/LocalIntro.astro';

test('renders the city heading and HTML intro blocks incl. inline links', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(LocalIntro, { props: { city: 'Hampton', intro: [
    '<p>We serve <a href="/services/lock-rekeying/">rekeying</a> in Hampton.</p>',
    '<ul><li>Lockouts</li></ul>',
  ] } });
  expect(html).toContain('Your Local, Mobile Locksmith in Hampton, FL');
  expect(html).toContain('href="/services/lock-rekeying/"');   // real anchor, not escaped
  expect(html).toContain('<li>Lockouts</li>');
});
```

- [ ] **Step 2: Run — FAIL** (current LocalIntro escapes HTML / wraps in `<p>{p}>`).

- [ ] **Step 3: Rewrite `src/components/sections/LocalIntro.astro`**

```astro
---
import Container from '../primitives/Container.astro';
const { city, intro } = Astro.props;
---
<section>
  <Container>
    <div class="area-intro max-w-[820px] mx-auto py-14 md:py-16">
      <h2 class="m-0 text-ink font-medium tracking-[-0.6px]" style="font-size:clamp(26px,3.4vw,34px);line-height:1.2;">
        Your Local, Mobile Locksmith in {city}, FL
      </h2>
      <div class="mt-3 mb-6 h-1 w-12 rounded-full bg-primary"></div>
      {intro.map((block) => <Fragment set:html={block} />)}
    </div>
  </Container>
</section>

<style is:global>
  .area-intro p { margin: 0 0 1rem; font-size: 16px; line-height: 1.65; color: var(--color-secondary); }
  .area-intro h3 { margin: 1.75rem 0 0.5rem; font-size: 20px; font-weight: 700; color: var(--color-ink); }
  .area-intro ul { margin: 0 0 1rem; padding-left: 1.25rem; list-style: disc; }
  .area-intro li { margin-bottom: 0.4rem; font-size: 16px; line-height: 1.6; color: var(--color-secondary); }
  .area-intro a { color: #0064e0; text-decoration: underline; text-underline-offset: 2px; }
  .area-intro a:hover { color: #0457cb; }
</style>
```

- [ ] **Step 4: Convert Alachua's intro to HTML `<p>` blocks** — in `locksmith-alachua-fl.json`, wrap each of the 3 existing intro strings in `<p>…</p>` (content unchanged, curly apostrophes preserved). Use python (`json.load` → wrap each → `json.dump(..., ensure_ascii=False)`) and verify `’` still present.

- [ ] **Step 5: Run — PASS** (`npm test -- tests/area/localintro.test.ts`), then `npm run build` and confirm `dist/service-areas/locksmith-alachua-fl/index.html` still renders the 3 Alachua paragraphs (e.g. contains "highest rated in Alachua County").

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(sections): LocalIntro renders HTML blocks (inline links); Alachua intro→HTML"`

---

## Task 4: Hampton data file (variant: rich)

**Files:**
- Create: `src/content/service-areas/locksmith-hampton-fl.json`, `tests/area/hampton-data.test.ts`

**Interfaces:** a `serviceAreas` entry with `variant: 'rich'`, the live Hampton body (HTML blocks w/ relativized links) in `intro`, and the auto facts.

- [ ] **Step 1: Build the JSON from the crawled live page.** Run this python script (it extracts the body blocks in order, relativizes links, and writes the file):

```python
python3 - <<'PY'
import re, html, json
s = open('.superpowers/crawl/area-hampton.html', encoding='utf-8', errors='ignore').read()
start = s.find('Expert Locksmith Services in Hampton'); end = s.find('Be Secure Locksmith Blog')
seg = s[start:end]
rel = lambda x: x.replace('https://besecurelocksmith.com', '')
intro = []
for tag, inner in re.findall(r'<(p|ul|h3)\b[^>]*>(.*?)</\1>', seg, re.S):
    if tag == 'ul':
        items = re.findall(r'<li[^>]*>(.*?)</li>', inner, re.S)
        lis = [re.sub(r'\s+', ' ', html.unescape(rel(re.sub(r'<(?!/?a\b)[^>]+>', '', it)))).strip() for it in items]
        lis = [x for x in lis if x]
        if lis: intro.append('<ul>' + ''.join(f'<li>{x}</li>' for x in lis) + '</ul>')
    else:
        t = re.sub(r'\s+', ' ', html.unescape(rel(re.sub(r'<(?!/?a\b)[^>]+>', '', inner)))).strip()
        if len(re.sub('<[^>]+>', '', t)) > 25:
            intro.append(f'<{tag}>{t}</{tag}>' if tag == 'p' else f'<h3>{t}</h3>')
data = {
  "slug": "locksmith-hampton-fl", "city": "Hampton", "variant": "rich",
  "title": "Locksmith Hampton, FL - Home, Car & Business Lockouts",
  "description": "Need fast lock help in Hampton, FL? Our licensed mobile team covers home, car, and business lockouts, rekeys, and installs with local response. Get help.",
  "heroSubhead": "Licensed mobile locksmith for homes, cars, and businesses across Hampton, FL.",
  "intro": intro,
  "county": "Bradford County", "zips": ["32044"], "office": "gainesville",
  "responseTime": "~30 min", "neighborhoods": [], "location": "main", "order": 2,
}
json.dump(data, open('src/content/service-areas/locksmith-hampton-fl.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
open('src/content/service-areas/locksmith-hampton-fl.json','a').write('\n')
print('blocks:', len(intro)); print('curly:', '’' in json.dumps(data, ensure_ascii=False))
PY
```

Expected: ~15 blocks, `curly: True`. Manually sanity-check the file: links are relative (`/services/...`), no `besecurelocksmith.com` host remains in `intro`, the lead paragraph + the Residential/Automotive/Commercial/Emergency H3 sections + their `<ul>` lists are present.

- [ ] **Step 2: Write test `tests/area/hampton-data.test.ts`**

```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../../src/content/service-areas/locksmith-hampton-fl.json', import.meta.url), 'utf8'));

test('Hampton is rich with live body, relativized links, and facts', () => {
  expect(d.variant).toBe('rich');
  expect(d.title).toBe('Locksmith Hampton, FL - Home, Car & Business Lockouts');
  expect(d.county).toBe('Bradford County');
  expect(d.zips).toContain('32044');
  const body = d.intro.join('');
  expect(body).toContain('href="/services/emergency-lockouts/"');  // inline link preserved
  expect(body).not.toContain('besecurelocksmith.com');             // relativized
  expect(d.intro.length).toBeGreaterThan(5);
});
```

- [ ] **Step 3: Run — PASS** (`npm test -- tests/area/hampton-data.test.ts`); `npm run build` (collection compiles).

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(content): Hampton service-area data (rich, live body w/ links)"`

---

## Task 5: `buildAreaFaqs` helper

**Files:**
- Create: `src/lib/area-faqs.ts`, `tests/area/area-faqs.test.ts`

**Interfaces:**
- Produces: `buildAreaFaqs(area: { city: string; county?: string; zips?: string[]; responseTime?: string }, officeCity: string): { question: string; answer: string; order: number }[]`. NOTE: the shared `Faq` component's `FaqItem` requires an `order: number` field (it sorts by it), so every returned object MUST include `order`.

- [ ] **Step 1: Write failing test `tests/area/area-faqs.test.ts`**

```ts
import { test, expect } from 'vitest';
import { buildAreaFaqs } from '../../src/lib/area-faqs';

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

test('omits ZIPs gracefully when none', () => {
  const faqs = buildAreaFaqs({ city: 'X', county: 'Y County', responseTime: '~30 min' }, 'Gainesville');
  expect(JSON.stringify(faqs)).not.toContain('undefined');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/area-faqs.ts`**

```ts
export function buildAreaFaqs(
  area: { city: string; county?: string; zips?: string[]; responseTime?: string },
  officeCity: string,
): { question: string; answer: string; order: number }[] {
  const rt = area.responseTime ?? '~30 min';
  const zipPart = area.zips && area.zips.length ? `, including ZIP codes ${area.zips.join(', ')}` : '';
  const countyPart = area.county ? ` and the surrounding ${area.county} area` : ' and surrounding areas';
  return [
    { order: 1, question: `How fast can a locksmith reach ${area.city}, FL?`,
      answer: `Our mobile locksmiths typically reach ${area.city} in about ${rt.replace('~', '')} from our ${officeCity} office, and we offer fast emergency response when you’re locked out.` },
    { order: 2, question: `Do you serve all of ${area.city}?`,
      answer: `Yes — we cover ${area.city}${countyPart}${zipPart}. As a mobile locksmith, we come to you.` },
    { order: 3, question: `What locksmith services do you offer in ${area.city}?`,
      answer: `Residential, commercial, and automotive locksmith service in ${area.city} — lockouts, rekeying, new lock installation, car key replacement, smart locks, and more.` },
    { order: 4, question: `Are your ${area.city} locksmiths licensed and insured?`,
      answer: `Yes. All of our technicians are fully licensed (#HCLO18005) and insured for your protection.` },
  ];
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(lib): buildAreaFaqs city-interpolated FAQ generator"`

---

## Task 6: `AreaStats` component

**Files:**
- Create: `src/components/sections/AreaStats.astro`, `tests/area/areastats.test.ts`

**Interfaces:** props `{ area }` (the area data). Consumes `site` (sinceYear, ratingValue, ratingCount).

- [ ] **Step 1: Write failing test `tests/area/areastats.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaStats from '../../src/components/sections/AreaStats.astro';

test('renders county, zips, response, rating', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaStats, { props: { area: { city: 'Hampton', county: 'Bradford County', zips: ['32044'], responseTime: '~30 min' } } });
  expect(html).toContain('Bradford County');
  expect(html).toContain('32044');
  expect(html).toContain('~30 min');
  expect(html).toContain('4.9');
});

test('hides the county card when county is absent', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaStats, { props: { area: { city: 'X', zips: [], responseTime: '~30 min' } } });
  expect(html).not.toContain('County');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/components/sections/AreaStats.astro`**

```astro
---
import Container from '../primitives/Container.astro';
import { site } from '../../config/site';
const { area } = Astro.props;
const stats = [
  area.county ? { label: 'County', value: area.county } : null,
  area.zips && area.zips.length ? { label: 'ZIP codes served', value: area.zips.join(', ') } : null,
  { label: 'Typical response', value: area.responseTime ?? '~30 min' },
  { label: 'Serving since', value: site.sinceYear },
  { label: 'Google rating', value: `★ ${site.ratingValue} (${Number(site.ratingCount).toLocaleString('en-US')})` },
].filter(Boolean);
---
<section>
  <Container>
    <div class="max-w-[1180px] mx-auto py-6">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div class="rounded-[16px] border border-border bg-surface p-4 text-center">
            <div class="text-[12px] font-bold uppercase tracking-[0.6px] text-muted">{s.label}</div>
            <div class="mt-1 text-[15px] font-bold text-ink">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(sections): AreaStats at-a-glance cards"`

---

## Task 7: `AreaMap` component

**Files:**
- Create: `src/components/sections/AreaMap.astro`, `tests/area/areamap.test.ts`

**Interfaces:** props `{ area }`. Consumes `offices` (Task 1), `telHref`.

- [ ] **Step 1: Write failing test `tests/area/areamap.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaMap from '../../src/components/sections/AreaMap.astro';

test('maps the city, shows serving office + Call + GBP link', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaMap, { props: { area: { city: 'Hampton', office: 'gainesville', responseTime: '~30 min' } } });
  expect(html).toContain('Hampton%2C%20FL');                 // map query encodes "Hampton, FL"
  expect(html).toContain('901 NW 8th Ave');                  // serving office address
  expect(html).toContain('href="tel:3527065295"');           // office Call
  expect(html).toContain('kgmid=/g/1ptx2pkfg');              // office GBP
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/components/sections/AreaMap.astro`**

```astro
---
import Container from '../primitives/Container.astro';
import Button from '../primitives/Button.astro';
import { offices } from '../../config/offices';
import { telHref } from '../../config/site';
const { area } = Astro.props;
const office = offices[area.office ?? 'gainesville'];
const mapQuery = `${area.city}, FL`;
const rt = (area.responseTime ?? '~30 min').replace('~', '');
---
<section>
  <Container>
    <div class="max-w-[1180px] mx-auto py-10">
      <h2 class="m-0 mb-6 text-ink font-medium tracking-[-0.4px]" style="font-size:clamp(22px,3vw,28px);">Locksmith Coverage in {area.city}, FL</h2>
      <div class="grid gap-6 items-stretch" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));">
        <div class="relative rounded-[24px] overflow-hidden border border-border" style="min-height:300px;">
          <iframe title={`Locksmith coverage map for ${area.city}, FL`} loading="lazy" class="w-full h-full border-0 block" style="min-height:300px;"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}></iframe>
          <a href={office.gbp} target="_blank" rel="noopener noreferrer" aria-label={`View our ${office.label} office on Google`} class="absolute inset-0 z-10 flex items-end justify-end p-3">
            <span class="inline-flex items-center rounded-pill bg-white/95 px-3 py-[7px] text-[12.5px] font-semibold text-ink shadow-[0_2px_12px_rgba(10,19,23,0.20)]">View on Google &rarr;</span>
          </a>
        </div>
        <div class="rounded-[24px] border border-border bg-surface flex flex-col justify-center" style="padding:clamp(24px,3vw,36px);">
          <h3 class="m-0 mb-2 text-ink font-bold text-[20px]">Served from our {office.label} office</h3>
          <p class="m-0 mb-2 text-[16px] leading-[1.5] text-secondary">Typically on-site in {rt} across {area.city}.</p>
          <p class="m-0 mb-5 text-[15px] leading-[1.5] text-muted">{office.street}<br />{office.cityStateZip}</p>
          <Button href={telHref(office.phone)} variant="primary" class="self-start">Call {office.phone}</Button>
        </div>
      </div>
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(sections): AreaMap coverage map + nearest office"`

---

## Task 8: `AreaNearby` component

**Files:**
- Create: `src/components/sections/AreaNearby.astro`, `tests/area/areanearby.test.ts`

**Interfaces:** props `{ area, nearby }` where `nearby: { city: string; slug: string }[]`. Renders neighborhood chips (if `area.neighborhoods` non-empty) + nearby-area cross-link chips. Renders nothing if both empty.

- [ ] **Step 1: Write failing test `tests/area/areanearby.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaNearby from '../../src/components/sections/AreaNearby.astro';

test('renders neighborhoods + nearby cross-links', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaNearby, { props: {
    area: { city: 'Hampton', neighborhoods: ['Downtown Hampton'] },
    nearby: [{ city: 'Alachua', slug: 'locksmith-alachua-fl' }],
  } });
  expect(html).toContain('Downtown Hampton');
  expect(html).toContain('href="/service-areas/locksmith-alachua-fl/"');
  expect(html).toContain('Alachua');
});

test('renders nothing when both lists are empty', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaNearby, { props: { area: { city: 'Hampton', neighborhoods: [] }, nearby: [] } });
  expect(html.trim()).toBe('');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/components/sections/AreaNearby.astro`**

```astro
---
import Container from '../primitives/Container.astro';
const { area, nearby = [] } = Astro.props;
const hoods = area.neighborhoods ?? [];
const show = hoods.length > 0 || nearby.length > 0;
---
{show && (
  <section>
    <Container>
      <div class="max-w-[1180px] mx-auto py-10">
        {hoods.length > 0 && (
          <div class="mb-8">
            <h2 class="m-0 mb-4 text-ink font-medium tracking-[-0.4px]" style="font-size:clamp(22px,3vw,28px);">Neighborhoods we serve in {area.city}</h2>
            <div class="flex flex-wrap gap-2">
              {hoods.map((n) => (
                <span class="inline-flex items-center rounded-pill border border-border bg-surface px-[14px] py-[6px] text-[13px] font-medium text-ink">{n}</span>
              ))}
            </div>
          </div>
        )}
        {nearby.length > 0 && (
          <div>
            <h2 class="m-0 mb-4 text-ink font-medium tracking-[-0.4px]" style="font-size:clamp(22px,3vw,28px);">Nearby areas we serve</h2>
            <div class="flex flex-wrap gap-2">
              {nearby.map((a) => (
                <a href={`/service-areas/${a.slug}/`} class="inline-flex items-center rounded-pill border border-border bg-surface px-[14px] py-[6px] text-[13px] font-medium text-ink transition-colors hover:border-primary hover:text-primary">{a.city}, FL</a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  </section>
)}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(sections): AreaNearby neighborhoods + nearby cross-links"`

---

## Task 9: Route branching + assembly + LocalBusiness dedupe + verification

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (add `localBusiness` prop), `src/pages/service-areas/[slug]/index.astro`
- Test: `tests/area/page.test.ts` (extend), `tests/area/page-hampton.test.ts` (new)

**Interfaces:**
- `BaseLayout` gains prop `localBusiness: boolean = true` — when false, it does NOT emit its default LocalBusiness JSON-LD (the page supplies its own).

- [ ] **Step 1: BaseLayout opt-out** — in `src/layouts/BaseLayout.astro`, destructure `localBusiness = true` from props and wrap the existing default LocalBusiness `<script type="application/ld+json">` so it only renders `{localBusiness && (<script … />)}`. All existing pages omit the prop → default true → unchanged.

- [ ] **Step 2: Rewrite `src/pages/service-areas/[slug]/index.astro`** to branch on variant and dedupe JSON-LD:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import PromoBar from '../../../components/sections/PromoBar.astro';
import NavBar from '../../../components/sections/NavBar.astro';
import AreaHero from '../../../components/sections/AreaHero.astro';
import TrustStrip from '../../../components/sections/TrustStrip.astro';
import LocalIntro from '../../../components/sections/LocalIntro.astro';
import AreaStats from '../../../components/sections/AreaStats.astro';
import ServicesGrid from '../../../components/sections/ServicesGrid.astro';
import AreaMap from '../../../components/sections/AreaMap.astro';
import AreaNearby from '../../../components/sections/AreaNearby.astro';
import Reviews from '../../../components/sections/Reviews.astro';
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
  return areas.map((a) => ({ params: { slug: a.data.slug }, props: { area: a.data, all: areas.map((x) => x.data) } }));
}

const { area, all } = Astro.props;
const loc = resolveLocation(area.location);
const phone = resolvePhone(loc);
const isRich = area.variant === 'rich';
const office = offices[area.office ?? 'gainesville'];
const nearby = all.filter((a) => a.slug !== area.slug).slice(0, 8).map((a) => ({ city: a.city, slug: a.slug }));
const areaFaqs = isRich ? buildAreaFaqs(area, office.label) : [];
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
    {isRich && <AreaStats area={area} />}
    <ServicesGrid />
    {isRich && <AreaMap area={area} />}
    {isRich && <AreaNearby area={area} nearby={nearby} />}
    {isRich && <Reviews />}
    {isRich && <Faq faqs={areaFaqs} />}
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

(Note: `Reviews` and `Faq` accept injected data — `Reviews` defaults to the reviews collection when no prop is passed; `Faq` renders the passed `areaFaqs` and emits FAQPage JSON-LD. Confirm `Faq`'s prop name is `faqs` by reading the component; adjust if different.)

- [ ] **Step 3: Build** — `npm run build`. Expected: both `dist/service-areas/locksmith-hampton-fl/index.html` and `dist/service-areas/locksmith-alachua-fl/index.html` exist.

- [ ] **Step 4: Write `tests/area/page-hampton.test.ts`** (build-output assertions for the rich page)

```ts
import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const p = resolve(__dirname, '../../dist/service-areas/locksmith-hampton-fl/index.html');

test('Hampton renders the rich layout with live links + hyperlocal sections', () => {
  if (!existsSync(p)) throw new Error('dist Hampton page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Locksmith Hampton, FL - Home, Car &amp; Business Lockouts</title>');
  expect(html).toContain('Locksmith in Hampton, FL');                  // AreaHero H1
  expect(html).toContain('href="/services/emergency-lockouts/"');      // live inline link, relativized
  expect(html).not.toMatch(/href="https:\/\/besecurelocksmith\.com\/services\//); // no absolute service links
  expect(html).toContain('Bradford County');                          // AreaStats
  expect(html).toContain('Locksmith Coverage in Hampton, FL');        // AreaMap
  expect(html).toContain('Nearby areas we serve');                    // AreaNearby (Alachua exists → non-empty)
  expect(html).toContain('"@type":"FAQPage"');                        // Area FAQ
  expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1); // deduped
});
```

- [ ] **Step 5: Extend `tests/area/page.test.ts`** (Alachua stays lean) — add: `expect(html).not.toContain('Locksmith Coverage in Alachua, FL')` and `expect(html).not.toContain('Bradford County')` and `expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1)`.

- [ ] **Step 6: Full verification** — `npm test` (entire suite green), `npm run build`, `npm run test:e2e` (3 e2e pass). Confirm both pages render correctly and the homepage still has both office addresses (offices refactor).

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(service-areas): rich variant route + Hampton; dedupe LocalBusiness JSON-LD"`

---

## Self-Review

**1. Spec coverage:** variant flag + route branching → T2/T9; lean unchanged (Alachua) + rich (Hampton) → T9; Hampton live body w/ relativized links → T4 + LocalIntro HTML → T3; AreaStats → T6; AreaMap (coverage map + nearest office, kgmid) → T7; AreaNearby (neighborhoods + nearby cross-links) → T8; Reviews reuse → T9; city-interpolated Faq + FAQPage → T5/T9; centralized offices + ServiceAreas refactor → T1; resolved phone + bookingUrl → T7/T9 (via AreaHero/CtaCard from prior work); LocalBusiness dedupe via BaseLayout opt-out → T9; auto facts + optional neighborhoods → T2/T6/T8; SEO exact title/meta + canonical + JSON-LD → T4/T9. All spec sections mapped.

**2. Placeholder scan:** No TBD/TODO. Hampton body is pulled by a concrete deterministic script from the committed crawl file (not invented). Component code is complete.

**3. Type consistency:** `offices[key]` shape (label/street/cityStateZip/phone/mapQuery/gbp) consistent T1↔T7↔T9. `area` fields (variant/county/zips/office/responseTime/neighborhoods/intro) defined T2 and consumed identically in T6/T7/T8/T9. `buildAreaFaqs(area, officeCity)` signature consistent T5↔T9. `AreaNearby` `nearby:{city,slug}[]` consistent T8↔T9. `LocalIntro` `intro:string[]` (HTML blocks) consistent T3↔T4↔T9. BaseLayout `localBusiness` prop consistent T9 (default true elsewhere). `Faq` prop is `faqs` (verify in T9 against the component built earlier).

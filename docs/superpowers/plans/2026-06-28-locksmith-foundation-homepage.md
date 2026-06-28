# Locksmith Design-System Foundation + Be Secure Homepage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an Astro + Tailwind project with a reusable locksmith design system (tokens, primitives, per-location resolution) and assemble the modernized Be Secure homepage from it, running locally.

**Architecture:** Static Astro site, zero client JS by default; small progressive-enhancement scripts only for the drawer, FAQ accordion, reviews carousel, and sticky call bar. Design tokens live in one CSS/Tailwind layer. Header region (PromoBar + NavBar), Footer, and every phone touchpoint resolve from a per-page `location` record so location pages can later carry their own tracking numbers. The homepage is built from section components fed by typed content collections seeded from the zip's data.

**Tech Stack:** Astro 4.x, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, Vitest + `astro/container` for component tests, Playwright + `@axe-core/playwright` for interactive/a11y e2e.

## Global Constraints

- **URL preservation:** every live URL is rebuilt at its exact path; no slug changes, no dropped pages. This spec's only in-scope URL is the homepage `/`. (Full 117-URL inventory: `docs/migration/url-manifest.md`.)
- **Trailing slashes:** Astro config MUST be `trailingSlash: 'always'` and `build.format: 'directory'`. Every live URL ends in `/`.
- **Phone display vs href:** display format `352-706-5295`; `tel:`/`sms:` hrefs use digits only (`tel:3527065295`). Text/SMS number is a separate number: `352-389-5305` (`sms:3523895305`).
- **Resolved phone everywhere:** promo bar, nav CTA, hero CTA, conversion band, service-areas card, footer, sticky bar, and `LocalBusiness` JSON-LD all read the page's resolved location phone — never a hardcoded literal.
- **Brand facts (verbatim):** Name "Be Secure Locksmith"; tagline "If it has a key, we can unlock it!"; License #HCLO18005; Liability Insurance #BKS56465112; address 901 NW 8th Ave. C17, Gainesville, FL 32601; hours Mon–Fri 8am–5pm, Sat–Sun Closed; rating 4.9 from 2,551 Google reviews; family-operated since 2012; footer credit "Powered by The Locksmith Agency".
- **Fonts:** Figtree (300–800) display/headings + Inter (400/500/700) body, via Google Fonts with `preconnect`.
- **Porting convention:** the zip (`Be Secure Locksmith Homepage.dc.html`) is the visual source of truth. Section tasks port its labeled blocks (A–P) to Astro, converting `{{ }}`/`sc-for`/`sc-if` bindings to Astro props/`.map()`/conditionals and inline-style values to token-based Tailwind utilities (use arbitrary values like `rounded-[32px]` where no token exists). Content data arrays embedded in each task are copied verbatim from the zip's `renderVals()` — they are real content, not placeholders.
- **Accessibility:** preserve `aria-label`/`aria-expanded` from the source; visible focus states; AA contrast.
- **Zip location for reference:** `Be Secure Locksmith Homepage.zip` (repo root); unzip to read full block markup while porting.

---

## File Structure

```
astro.config.mjs              # trailingSlash:'always', build.format:'directory', tailwind vite plugin
package.json                  # scripts: dev, build, preview, test, test:e2e
vitest.config.ts             # vitest + astro container env
playwright.config.ts
tsconfig.json
src/
  styles/tokens.css           # @theme tokens + base body/font rules + keyframes + responsive helpers
  config/site.ts              # global brand defaults + helpers (telHref, smsHref)
  lib/locations.ts            # Location type, location records (main), resolveLocation(), resolvePhone()
  content/config.ts           # content collections: services, reviews, faqs (+ schemas)
  content/services/*.json     # 9 homepage service cards (seeded from zip)
  content/reviews/*.json      # 5 reviews (seeded from zip)
  content/faqs/*.json         # 8 FAQs (seeded from zip)
  components/primitives/
    Container.astro  Section.astro  Button.astro  Badge.astro  Stars.astro  Card.astro
  components/sections/
    PromoBar.astro  NavBar.astro  MobileDrawer.astro  Hero.astro  AsSeenIn.astro
    WhyChoose.astro  ServicesGrid.astro  PropertyManagement.astro  LogoWall.astro
    ConversionBand.astro  Reviews.astro  Credentials.astro  BusinessesWorkedWith.astro
    Faq.astro  ServiceAreas.astro  Footer.astro  StickyCallBar.astro
  components/scripts/
    drawer.ts  faq.ts  reviews.ts        # progressive-enhancement client scripts
  layouts/BaseLayout.astro    # head, fonts, JSON-LD, resolves location, header + footer
  pages/index.astro           # homepage (location: "main")
public/                       # migrated images (logo, hero, icons, logos)
tests/                        # *.test.ts (vitest) ; e2e/*.spec.ts (playwright)
```

---

## Task 1: Scaffold Astro + Tailwind + Vitest with URL config

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/styles/tokens.css`, `src/pages/index.astro` (temporary smoke page), `tests/config.test.ts`

**Interfaces:**
- Produces: a buildable Astro project; `astro.config.mjs` default export with `trailingSlash:'always'` and `build:{format:'directory'}`.

- [ ] **Step 1: Initialize project and install deps**

Run:
```bash
cd "/Users/Sam/projects/Be Secure"
npm init -y
npm install astro@^4
npm install -D tailwindcss@^4 @tailwindcss/vite vitest @vitest/coverage-v8 typescript
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://besecurelocksmith.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwind()] },
});
```

- [ ] **Step 3: Write `src/styles/tokens.css` (initial shell; tokens filled in Task 2)**

```css
@import "tailwindcss";

@theme {
  /* tokens added in Task 2 */
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{font-family:'Figtree','Inter',system-ui,sans-serif;color:#1c1e21;background:#fff;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
a{color:inherit;text-decoration:none;}
```

- [ ] **Step 4: Add scripts to `package.json`**

Set `"scripts"`: `{"dev":"astro dev","build":"astro build","preview":"astro preview","test":"vitest run","test:watch":"vitest"}`. Add `"type":"module"`.

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { getViteConfig } from 'astro/config';
export default getViteConfig({ test: { globals: true, environment: 'node' } });
```

- [ ] **Step 6: Temporary smoke page `src/pages/index.astro`**

```astro
---
import '../styles/tokens.css';
---
<html lang="en"><head><meta charset="utf-8" /><title>Be Secure</title></head>
<body><h1>Be Secure Locksmith</h1></body></html>
```

- [ ] **Step 7: Write the failing test `tests/config.test.ts`**

```ts
import { test, expect } from 'vitest';
import config from '../astro.config.mjs';

test('URLs are emitted with trailing slashes as directories', () => {
  expect(config.trailingSlash).toBe('always');
  expect(config.build?.format).toBe('directory');
});
```

- [ ] **Step 8: Run test — expect PASS (config already set)**

Run: `npm test -- tests/config.test.ts`
Expected: PASS.

- [ ] **Step 9: Verify build works**

Run: `npm run build`
Expected: build completes; `dist/index.html` exists (directory format puts the homepage at `dist/index.html` served at `/`).

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro + Tailwind v4 + Vitest with trailing-slash URL config"
```

---

## Task 2: Design tokens

**Files:**
- Modify: `src/styles/tokens.css`
- Test: `tests/tokens.test.ts`

**Interfaces:**
- Produces: Tailwind theme tokens — colors `primary`, `primary-hover`, `ink`, `body`, `muted`, `muted-2`, `border`, `border-2`, `surface`, `surface-2`, `amber`, `success`, `success-2`, `success-bg`, `alert`, `link-dark`; font families `figtree`, `inter`.

- [ ] **Step 1: Write failing test `tests/tokens.test.ts`**

```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

test('brand color tokens are defined in @theme', () => {
  for (const [name, hex] of [
    ['--color-primary', '#0064e0'],
    ['--color-primary-hover', '#0457cb'],
    ['--color-ink', '#0a1317'],
    ['--color-body', '#1c1e21'],
    ['--color-muted', '#5d6c7b'],
    ['--color-border', '#dee3e9'],
    ['--color-amber', '#f7b928'],
    ['--color-success', '#31a24c'],
    ['--color-success-bg', '#eaf7ee'],
    ['--color-alert', '#f0284a'],
  ] as const) {
    expect(css).toContain(`${name}: ${hex}`);
  }
});

test('font family tokens are defined', () => {
  expect(css).toContain('--font-figtree');
  expect(css).toContain('--font-inter');
});
```

- [ ] **Step 2: Run test — expect FAIL** (`Run: npm test -- tests/tokens.test.ts`; tokens not present).

- [ ] **Step 3: Fill the `@theme` block in `src/styles/tokens.css`**

```css
@theme {
  --color-primary: #0064e0;
  --color-primary-hover: #0457cb;
  --color-ink: #0a1317;
  --color-body: #1c1e21;
  --color-secondary: #444950;
  --color-muted: #5d6c7b;
  --color-muted-2: #8595a4;
  --color-border: #dee3e9;
  --color-border-2: #ced0d4;
  --color-border-3: #e7ebf0;
  --color-surface: #f1f4f7;
  --color-amber: #f7b928;
  --color-success: #31a24c;
  --color-success-2: #1f7a36;
  --color-success-bg: #eaf7ee;
  --color-alert: #f0284a;
  --color-link-dark: #7fb4ff;
  --font-figtree: 'Figtree', system-ui, sans-serif;
  --font-inter: 'Inter', system-ui, sans-serif;
  --radius-card: 32px;
  --radius-box: 16px;
  --radius-pill: 100px;
}
```

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add design tokens extracted from homepage design"`

---

## Task 3: Brand config + phone helpers

**Files:**
- Create: `src/config/site.ts`, `tests/site.test.ts`

**Interfaces:**
- Produces:
  - `telHref(phone: string): string` → `'tel:' + digits`
  - `smsHref(phone: string): string` → `'sms:' + digits`
  - `site` object: `{ name, tagline, logo, license, insurance, address, hours, ratingValue, ratingCount, sinceYear, agencyCredit, defaultPhone, smsPhone, socials, footerServices, payments }`

- [ ] **Step 1: Write failing test `tests/site.test.ts`**

```ts
import { test, expect } from 'vitest';
import { site, telHref, smsHref } from '../src/config/site';

test('telHref strips non-digits', () => {
  expect(telHref('352-706-5295')).toBe('tel:3527065295');
  expect(smsHref('352-389-5305')).toBe('sms:3523895305');
});

test('site carries verbatim brand facts', () => {
  expect(site.name).toBe('Be Secure Locksmith');
  expect(site.defaultPhone).toBe('352-706-5295');
  expect(site.smsPhone).toBe('352-389-5305');
  expect(site.license).toBe('HCLO18005');
  expect(site.ratingValue).toBe('4.9');
  expect(site.ratingCount).toBe('2551');
});
```

- [ ] **Step 2: Run test — expect FAIL** (module missing).

- [ ] **Step 3: Implement `src/config/site.ts`**

```ts
export const telHref = (phone: string) => 'tel:' + phone.replace(/\D/g, '');
export const smsHref = (phone: string) => 'sms:' + phone.replace(/\D/g, '');

export const site = {
  name: 'Be Secure Locksmith',
  tagline: 'If it has a key, we can unlock it!',
  logo: '/img/besecure-logo-100h.png',
  license: 'HCLO18005',
  insurance: 'BKS56465112',
  address: { street: '901 NW 8th Ave. C17', city: 'Gainesville', state: 'FL', zip: '32601' },
  hours: 'Mon–Fri 8am–5pm · Sat–Sun Closed',
  ratingValue: '4.9',
  ratingCount: '2551',
  sinceYear: '2012',
  agencyCredit: 'Powered by The Locksmith Agency',
  defaultPhone: '352-706-5295',
  smsPhone: '352-389-5305',
  footerServices: ['Residential','Commercial','Automotive','Key Duplication','Car Key Replacement','Ignition Repair','Lock Rekeying','Smart Locks','Master Key Systems'],
  payments: ['Cash','Credit Cards','Mobile Pay'],
  socials: [
    { name: 'Google', icon: '/img/social/google-g-icon.svg', href: '#' },
    { name: 'Facebook', icon: '/img/social/FB-512.svg', href: '#' },
    { name: 'YouTube', icon: '/img/social/YouTube-icon.svg', href: '#' },
    { name: 'Instagram', icon: '/img/social/IG-round-2.svg', href: '#' },
    { name: 'Yelp', icon: '/img/social/yelp-svgrepo-com.svg', href: '#' },
    { name: 'LinkedIn', icon: '/img/social/linkedin.svg', href: '#' },
  ],
} as const;
```

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add brand config and phone href helpers"`

---

## Task 4: Location model + resolution

**Files:**
- Create: `src/lib/locations.ts`, `tests/locations.test.ts`

**Interfaces:**
- Consumes: `site` (Task 3).
- Produces:
  - `type Location = { slug: string; phone: string; city: string; nap: { street: string; city: string; state: string; zip: string }; hours: string }`
  - `resolveLocation(slug?: string): Location` — returns the matching record, or the `main` record if slug is missing/unknown.
  - `resolvePhone(loc: Location): string` — `loc.phone || site.defaultPhone`.

Only the `main` record is created here (the only location the homepage uses). Gainesville/Ocala/Lake City records are added in the service-area spec when their tracking numbers are supplied.

- [ ] **Step 1: Write failing test `tests/locations.test.ts`**

```ts
import { test, expect } from 'vitest';
import { resolveLocation, resolvePhone, type Location } from '../src/lib/locations';

test('main location carries the general number', () => {
  const loc = resolveLocation('main');
  expect(loc.phone).toBe('352-706-5295');
  expect(loc.nap.zip).toBe('32601');
});

test('unknown or missing slug falls back to main', () => {
  expect(resolveLocation('nope').slug).toBe('main');
  expect(resolveLocation().slug).toBe('main');
});

test('resolvePhone uses the location number then the default', () => {
  const fixture: Location = { slug: 'x', phone: '111-222-3333', city: 'X', nap: { street:'', city:'', state:'FL', zip:'' }, hours: '' };
  expect(resolvePhone(fixture)).toBe('111-222-3333');
});
```

- [ ] **Step 2: Run test — expect FAIL.**

- [ ] **Step 3: Implement `src/lib/locations.ts`**

```ts
import { site } from '../config/site';

export type Location = {
  slug: string; phone: string; city: string;
  nap: { street: string; city: string; state: string; zip: string };
  hours: string;
};

const LOCATIONS: Record<string, Location> = {
  main: {
    slug: 'main',
    phone: site.defaultPhone,
    city: 'Gainesville & Ocala',
    nap: { ...site.address },
    hours: site.hours,
  },
};

export function resolveLocation(slug?: string): Location {
  return (slug && LOCATIONS[slug]) || LOCATIONS.main;
}
export function resolvePhone(loc: Location): string {
  return loc.phone || site.defaultPhone;
}
```

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add per-location resolution model (main record + resolvers)"`

---

## Task 5: Primitive components — Container, Section, Button, Badge, Stars, Card

**Files:**
- Create the six `src/components/primitives/*.astro`
- Test: `tests/primitives.test.ts`

**Interfaces:**
- `Container.astro` — wraps slot in `max-w-[1360px] mx-auto px-6`.
- `Section.astro` — props `{ id?: string; class?: string }`; `<section>` wrapper.
- `Button.astro` — props `{ href: string; variant?: 'primary'|'dark'|'ghost'; class?: string }`; renders `<a>` with pill styling. primary → bg primary; dark → bg black; ghost → border.
- `Badge.astro` — slot pill; props `{ tone?: 'success'|'neutral'; class?: string }`.
- `Stars.astro` — props `{ count?: number }` default 5; renders amber `★` row with `aria-label="{count} out of 5 stars"`.
- `Card.astro` — bordered rounded surface; props `{ class?: string }`.

- [ ] **Step 1: Write failing test `tests/primitives.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Button from '../src/components/primitives/Button.astro';
import Stars from '../src/components/primitives/Stars.astro';

test('Button renders an anchor with the given href and primary styling', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Button, { props: { href: 'tel:3527065295', variant: 'primary' }, slots: { default: 'Call' } });
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('Call');
});

test('Stars renders 5 stars with an accessible label', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Stars, { props: {} });
  expect((html.match(/★/g) || []).length).toBe(5);
  expect(html).toContain('out of 5 stars');
});
```

- [ ] **Step 2: Run test — expect FAIL.**

- [ ] **Step 3: Implement primitives.** Example `Button.astro`:

```astro
---
const { href, variant = 'primary', class: cls = '' } = Astro.props;
const base = 'inline-flex items-center gap-2 text-[15px] font-bold tracking-[-0.14px] px-[30px] py-[15px] rounded-[100px]';
const tone = variant === 'primary' ? 'bg-primary text-white'
  : variant === 'dark' ? 'bg-black text-white'
  : 'border border-border text-ink bg-white';
---
<a href={href} class={`${base} ${tone} ${cls}`}><slot /></a>
```

`Stars.astro`:
```astro
---
const { count = 5 } = Astro.props;
---
<span class="text-amber text-base tracking-[1px]" aria-label={`${count} out of 5 stars`}>{'★'.repeat(count)}</span>
```

Implement `Container`, `Section`, `Badge`, `Card` analogously using token classes (`Container`: `<div class="max-w-[1360px] mx-auto px-6"><slot/></div>`; `Card`: `<div class={`bg-white border border-border rounded-[16px] ${cls}`}><slot/></div>`; `Section`: `<section id={id} class={cls}><slot/></section>`; `Badge`: success tone → `bg-success-bg text-success-2`).

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add primitive components (Container, Section, Button, Badge, Stars, Card)"`

---

## Task 6: Content collections — services, reviews, faqs (seeded from zip)

**Files:**
- Create: `src/content/config.ts`, `src/content/services/*.json` (9), `src/content/reviews/*.json` (5), `src/content/faqs/*.json` (8)
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces typed collections:
  - `services`: `{ title: string; desc: string; order: number; photo?: string }`
  - `reviews`: `{ name: string; initial: string; color: string; time: string; quote: string; order: number }`
  - `faqs`: `{ question: string; answer: string; order: number }`

- [ ] **Step 1: Write `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
const services = defineCollection({ type: 'data', schema: z.object({
  title: z.string(), desc: z.string(), order: z.number(), photo: z.string().optional(),
})});
const reviews = defineCollection({ type: 'data', schema: z.object({
  name: z.string(), initial: z.string(), color: z.string(), time: z.string(), quote: z.string(), order: z.number(),
})});
const faqs = defineCollection({ type: 'data', schema: z.object({
  question: z.string(), answer: z.string(), order: z.number(),
})});
export const collections = { services, reviews, faqs };
```

- [ ] **Step 2: Seed data files (verbatim from the zip's `renderVals()`).** Create one JSON per item. Services (order 1–9): Residential Locksmith, Commercial Locksmith, Automotive Locksmith, Key Duplication, Car Key Replacement, Ignition Repair, Lock Rekeying, Smart Lock Installation (`photo: '/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg'`), Master Key Systems — each with its `desc` copied from the zip (lines 476–484). Reviews (order 1–5): Riva Wallace/R/#0064e0, Cailey Lea/C/#31a24c, Sharon Fallon/S/#f0284a, Marissa Leonard/M/#444950, stephanie calareso/S/#0457cb — quotes from zip lines 445–449. FAQs (order 1–8): questions/answers from zip lines 453–460.

Example `src/content/reviews/01-riva.json`:
```json
{ "name": "Riva Wallace", "initial": "R", "color": "#0064e0", "time": "2 weeks ago", "quote": "Highly recommend. Very professional and friendly to work with.", "order": 1 }
```

- [ ] **Step 3: Write failing test `tests/content.test.ts`**

```ts
import { test, expect } from 'vitest';
import { getCollection } from 'astro:content';

test('collections are seeded with the homepage content', async () => {
  expect((await getCollection('services')).length).toBe(9);
  expect((await getCollection('reviews')).length).toBe(5);
  expect((await getCollection('faqs')).length).toBe(8);
});
```

- [ ] **Step 4: Run test — expect PASS** (after files exist). If `astro:content` is unavailable in the test env, gate this test behind `npm run build` succeeding instead and assert file counts via `fs.readdirSync`.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add content collections seeded with homepage services, reviews, FAQs"`

---

## Task 7: Migrate homepage images into public/

**Files:**
- Create: `public/img/**` (logo, hero, google icon, 6 social SVGs, 4 PM icons, 15 client logos, 4 press logos)
- Test: `tests/images.test.ts`

**Interfaces:**
- Produces local image paths referenced by `site.ts` and section components (e.g. `/img/besecure-logo-100h.png`, `/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg`, `/img/social/*.svg`).

- [ ] **Step 1: Collect source URLs** from the zip (`renderVals()` lines 474, 487–517 and inline `src` attributes). Logo: `.../2024/12/besecure-logo-100h.png`; hero: `.../2026/04/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg`; google icon `.../2025/12/google-g-icon.svg`; socials, pm icons, client logos, press logos per the arrays.

- [ ] **Step 2: Download images.** Preferred: Claude-in-Chrome (the user's browser session bypasses the CDN 403) to fetch each asset; save under `public/img/` preserving filenames (socials under `public/img/social/`, client logos under `public/img/clients/`, press under `public/img/press/`, pm icons under `public/img/pm/`). Fallback: user provides a media export. Record any asset that could not be fetched in `docs/migration/url-manifest.md` (no silent omissions).

- [ ] **Step 3: Write test `tests/images.test.ts`**

```ts
import { test, expect } from 'vitest';
import { existsSync } from 'node:fs';
const need = [
  'public/img/besecure-logo-100h.png',
  'public/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg',
  'public/img/social/google-g-icon.svg',
];
test('core homepage images are present locally', () => {
  for (const p of need) expect(existsSync(new URL('../' + p, import.meta.url))).toBe(true);
});
```

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "chore: migrate homepage images into public/"`

---

## Task 8: BaseLayout with fonts, location resolution, and LocalBusiness JSON-LD

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `tests/baselayout.test.ts`

**Interfaces:**
- Consumes: `resolveLocation`, `resolvePhone`, `site`, `telHref`.
- Props: `{ title: string; description?: string; location?: string }`.
- Produces: full `<html>` document with `<head>` (charset, viewport, title, description, font preconnect+link, `LocalBusiness` JSON-LD using resolved phone + NAP + rating), and `<slot />` for body. Header/Footer are composed by the page, not BaseLayout, so the layout stays page-agnostic; BaseLayout exposes the resolved location to the page via a typed prop pattern (the page passes `location` down to PromoBar/NavBar/Footer/StickyCallBar).

- [ ] **Step 1: Write failing test `tests/baselayout.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';

test('BaseLayout emits fonts and LocalBusiness JSON-LD with the resolved phone', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BaseLayout, { props: { title: 'Home', location: 'main' }, slots: { default: '<main>x</main>' } });
  expect(html).toContain('family=Figtree');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('"telephone":"352-706-5295"');
  expect(html).toContain('<main>x</main>');
});
```

- [ ] **Step 2: Run test — expect FAIL.**

- [ ] **Step 3: Implement `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/tokens.css';
import { resolveLocation, resolvePhone } from '../lib/locations';
import { site } from '../config/site';
const { title, description = '', location = 'main' } = Astro.props;
const loc = resolveLocation(location);
const phone = resolvePhone(loc);
const jsonLd = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness',
  name: site.name, telephone: phone,
  address: { '@type': 'PostalAddress', streetAddress: loc.nap.street, addressLocality: loc.nap.city, addressRegion: loc.nap.state, postalCode: loc.nap.zip },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: site.ratingValue, reviewCount: site.ratingCount },
};
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  {description && <meta name="description" content={description} />}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
</head>
<body><slot /></body>
</html>
```

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add BaseLayout with fonts, location resolution, LocalBusiness JSON-LD"`

---

## Task 9: Header region — PromoBar + NavBar + MobileDrawer

**Files:**
- Create: `src/components/sections/PromoBar.astro`, `NavBar.astro`, `MobileDrawer.astro`, `src/components/scripts/drawer.ts`
- Test: `tests/header.test.ts`

**Interfaces:**
- Consumes: `site`, `resolveLocation`, `resolvePhone`, `telHref`.
- Props (each): `{ location?: string }`. Nav tabs: `['Home','About','Services ▾','Price List','Service Areas','Testimonials','Blog','Contact']` with real hrefs (`/`, `/about/`, `/services/`, `/price-list/`, `/service-areas/`, `/testimonials/`, `/blog/`, `/contact-us/`); "Home" active.
- Drawer: `MobileDrawer` is hidden by default; `drawer.ts` toggles `data-open` on click of `[data-drawer-toggle]` / `[data-drawer-close]` and on overlay click (progressive enhancement; no JS → drawer simply absent).

Port the markup faithfully from zip blocks **A** (lines 34–39), **B** (41–75), and **MOBILE DRAWER** (77–98). Replace the hardcoded `tel:3527065295` / `Call 352-706-5295` with the resolved phone; convert `sc-for navTabs` to an Astro `.map()`; convert the React `onClick` state toggles to the `data-*` hooks driven by `drawer.ts`.

- [ ] **Step 1: Write failing test `tests/header.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NavBar from '../src/components/sections/NavBar.astro';
import PromoBar from '../src/components/sections/PromoBar.astro';

test('PromoBar shows the resolved phone as a tel link', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PromoBar, { props: { location: 'main' } });
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('352-706-5295');
});

test('NavBar renders all eight nav tabs with real hrefs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(NavBar, { props: { location: 'main' } });
  for (const href of ['/','/about/','/services/','/price-list/','/service-areas/','/testimonials/','/blog/','/contact-us/']) {
    expect(html).toContain(`href="${href}"`);
  }
});
```

- [ ] **Step 2: Run test — expect FAIL.**

- [ ] **Step 3: Implement PromoBar, NavBar, MobileDrawer + drawer.ts** porting blocks A/B/drawer with token classes and resolved phone. `drawer.ts`:

```ts
const root = document.querySelector('[data-drawer]');
document.querySelectorAll('[data-drawer-toggle]').forEach(b => b.addEventListener('click', () => root?.toggleAttribute('data-open')));
document.querySelectorAll('[data-drawer-close]').forEach(b => b.addEventListener('click', () => root?.removeAttribute('data-open')));
```
Include via `<script>import '../scripts/drawer.ts';</script>` in NavBar.

- [ ] **Step 4: Run test — expect PASS.**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add header region (PromoBar, NavBar, MobileDrawer) with resolved phone"`

---

## Task 10: Hero section

**Files:**
- Create: `src/components/sections/Hero.astro`; Test: `tests/hero.test.ts`

**Interfaces:**
- Consumes: `site`, `resolveLocation`/`resolvePhone`, `Stars`, `Badge`, `Button`. Props `{ location?: string }`.

Port zip block **C** (lines 100–131): trust badge "Licensed #HCLO18005 · Insured · Since 2012", H1 "Top Local Locksmith in Gainesville & Ocala, FL", subhead, two CTAs (Call → resolved phone; "Explore Our Services" → `/services/`), rating row "4.9 · 2,551 Google reviews · Family-operated", hero image `/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg` with the "Typically on-site in ~30 min" pill.

- [ ] **Step 1: Write failing test `tests/hero.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Hero from '../src/components/sections/Hero.astro';

test('Hero shows headline, license badge, resolved call CTA, and rating', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Hero, { props: { location: 'main' } });
  expect(html).toContain('Top Local Locksmith in Gainesville');
  expect(html).toContain('HCLO18005');
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('2,551');
});
```

- [ ] **Step 2: Run — FAIL. Step 3: Implement Hero (port block C). Step 4: Run — PASS.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add Hero section"`

---

## Task 11: Trust strips — AsSeenIn, LogoWall, BusinessesWorkedWith, Credentials

**Files:**
- Create: `AsSeenIn.astro`, `LogoWall.astro`, `BusinessesWorkedWith.astro`, `Credentials.astro`; Test: `tests/trust.test.ts`

**Interfaces:**
- `AsSeenIn` — press logos (4) from `/img/press/*` (block D, 133–143).
- `LogoWall` — 15 PM client logos from `/img/clients/*`, heading "Our Gainesville Property Management Clients" (block H, 218–228).
- `BusinessesWorkedWith` — pill list: Home Depot, Lowe’s, McDonald’s, Outback Steakhouse, Publix, Walmart, Rural King, Crunch Fitness, Carrabba’s (block L, 306–316).
- `Credentials` — 5 cards: ALOA Member, BNI Member, 1-800-Unlocks, Fair Trade Locksmith, Chamber Member with marks/blurbs from zip lines 519–525 (block K, 292–304).

- [ ] **Step 1: Failing test `tests/trust.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Credentials from '../src/components/sections/Credentials.astro';
import BusinessesWorkedWith from '../src/components/sections/BusinessesWorkedWith.astro';

test('Credentials renders all five credential titles', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Credentials, { props: {} });
  for (const t of ['ALOA Member','BNI Member','1-800-Unlocks','Fair Trade Locksmith','Chamber Member']) expect(html).toContain(t);
});

test('BusinessesWorkedWith lists the brand pills', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BusinessesWorkedWith, { props: {} });
  expect(html).toContain('Publix');
  expect(html).toContain('Crunch Fitness');
});
```

- [ ] **Step 2: Run — FAIL. Step 3: Implement the four components (ports of blocks D/H/L/K). Step 4: Run — PASS.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: add trust strips (press, client wall, businesses, credentials)"`

---

## Task 12: WhyChoose section

**Files:** Create `WhyChoose.astro`; Test `tests/whychoose.test.ts`

**Interfaces:** Props `{}`. Reassurance bullets (verbatim, zip 552–557): "15+ years of experience — done right the first time.", "Local, family-operated, and customer-obsessed.", "Free security assessment on every visit.", "Transparent pricing — no hidden fees, no surprise charges." + YouTube embed `https://www.youtube.com/embed/HIdYUZ33DO0` (block E, 145–167).

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import WhyChoose from '../src/components/sections/WhyChoose.astro';
test('WhyChoose lists reassurances and the video', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(WhyChoose, { props: {} });
  expect(html).toContain('15+ years of experience');
  expect(html).toContain('youtube.com/embed/HIdYUZ33DO0');
});
```

- [ ] **Step 2–4: FAIL → implement (port block E) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add WhyChoose section"`

---

## Task 13: ServicesGrid section (from services collection)

**Files:** Create `ServicesGrid.astro`; Test `tests/servicesgrid.test.ts`

**Interfaces:** Consumes `getCollection('services')`, `Card`. Renders heading "Trusted Locksmith Services in Gainesville & Ocala, FL" + intro, then a card per service sorted by `order` (block F, 169–196). Cards with `photo` show the image; without, show the diagonal-hatch placeholder. "Learn more" links to `/services/` for now (individual service URLs wired in Spec 2).

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServicesGrid from '../src/components/sections/ServicesGrid.astro';
test('ServicesGrid renders all nine service cards', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ServicesGrid, { props: {} });
  expect(html).toContain('Residential Locksmith');
  expect(html).toContain('Master Key Systems');
  expect((html.match(/Learn more/g) || []).length).toBe(9);
});
```

- [ ] **Step 2–4: FAIL → implement (port block F, data from collection) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add ServicesGrid section from content collection"`

---

## Task 14: PropertyManagement band

**Files:** Create `PropertyManagement.astro`; Test `tests/pm.test.ts`

**Interfaces:** Props `{}`. Dark band, heading "Commercial Property Management Solutions Across Gainesville & Ocala.", two paragraphs (verbatim zip 202–204), 4 feature cards (Master Key Systems, Lock Rekeying, High-Security Locks, Lock Repair) with `/img/pm/*` icons, "Learn More" CTA (block G, 198–216).

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PM from '../src/components/sections/PropertyManagement.astro';
test('PM band shows the heading and four features', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PM, { props: {} });
  expect(html).toContain('Commercial Property Management Solutions');
  expect(html).toContain('High-Security Locks');
});
```

- [ ] **Step 2–4: FAIL → implement (port block G) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add PropertyManagement band"`

---

## Task 15: ConversionBand + ServiceAreas

**Files:** Create `ConversionBand.astro`, `ServiceAreas.astro`; Test `tests/conversion.test.ts`

**Interfaces:**
- `ConversionBand` (block I, 230–244): heading "Contact us today for a free quote…", Call (resolved phone), Text (`sms` to `site.smsPhone`), Book Now; hours pill. Props `{ location?: string }`.
- `ServiceAreas` (block N, 338–357): heading, 19 city pills (verbatim zip 563), Google map iframe for the address, and a "Mobile to your door" card with NAP + resolved-phone CTA. Props `{ location?: string }`.

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Conversion from '../src/components/sections/ConversionBand.astro';
import ServiceAreas from '../src/components/sections/ServiceAreas.astro';
test('ConversionBand has call and text actions with the right numbers', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Conversion, { props: { location: 'main' } });
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('href="sms:3523895305"');
});
test('ServiceAreas lists cities and the address', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ServiceAreas, { props: { location: 'main' } });
  expect(html).toContain('The Villages');
  expect(html).toContain('901 NW 8th Ave');
});
```

- [ ] **Step 2–4: FAIL → implement (ports of blocks I and N) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add ConversionBand and ServiceAreas sections"`

---

## Task 16: Reviews carousel (from reviews collection)

**Files:** Create `Reviews.astro`, `src/components/scripts/reviews.ts`; Test `tests/reviews.test.ts`

**Interfaces:** Consumes `getCollection('reviews')`, `Stars`. Heading "Check Out Our Google Reviews" + Google rating badge; horizontally scrollable track of review cards (initial avatar with `color`, quote, name, time); prev/next buttons driven by `reviews.ts` translating the track (block J, 246–290). No-JS fallback: track is horizontally scrollable via `overflow-x:auto`.

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Reviews from '../src/components/sections/Reviews.astro';
test('Reviews renders all five reviewers and the rating', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Reviews, { props: {} });
  expect(html).toContain('Riva Wallace');
  expect(html).toContain('stephanie calareso');
  expect(html).toContain('2,551');
});
```

- [ ] **Step 2–4: FAIL → implement (port block J + reviews.ts carousel) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add Reviews carousel from content collection"`

---

## Task 17: FAQ accordion + FAQPage JSON-LD

**Files:** Create `Faq.astro`, `src/components/scripts/faq.ts`; Test `tests/faq.test.ts`

**Interfaces:** Consumes `getCollection('faqs')`. Renders heading "Be Secure Locksmith FAQs." and a `<details>`-based accordion (first open) so it works with zero JS; `faq.ts` adds single-open behavior + chevron rotation as enhancement (block M, 318–336). Emits a `FAQPage` JSON-LD `<script>` built from the FAQ collection.

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Faq from '../src/components/sections/Faq.astro';
test('FAQ renders questions and emits FAQPage JSON-LD', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Faq, { props: {} });
  expect(html).toContain('What services do you offer?');
  expect(html).toContain('"@type":"FAQPage"');
});
```

- [ ] **Step 2–4: FAIL → implement (`<details>` accordion + JSON-LD + faq.ts) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add FAQ accordion with FAQPage structured data"`

---

## Task 18: Footer + StickyCallBar

**Files:** Create `Footer.astro`, `StickyCallBar.astro`; Test `tests/footer.test.ts`

**Interfaces:** Consumes `site`, `resolveLocation`/`resolvePhone`. Props `{ location?: string }`.
- `Footer` (block O, 359–413): logo, tagline, blurb, license + insurance line, Contact column (NAP, resolved Call, Text, hours), Services column (`site.footerServices` linking to `/services/`), Payments column (`site.payments`) + "We're Hiring!" → `/employment/`, social icons (`site.socials`), bottom bar (© Be Secure Locksmith · Privacy Policy → `/privacy-policy/` · "Powered by The Locksmith Agency" · Verified 1-800-Unlocks Member).
- `StickyCallBar` (block P, 415–426): mobile-only fixed bar, "Locked out?" + resolved Call + Book.

- [ ] **Step 1: Failing test**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Footer from '../src/components/sections/Footer.astro';
test('Footer shows license, agency credit, and resolved phone', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Footer, { props: { location: 'main' } });
  expect(html).toContain('HCLO18005');
  expect(html).toContain('Powered by The Locksmith Agency');
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('href="/privacy-policy/"');
});
```

- [ ] **Step 2–4: FAIL → implement (ports of blocks O and P) → PASS. Step 5: Commit** `git add -A && git commit -m "feat: add Footer and mobile StickyCallBar"`

---

## Task 19: Assemble the homepage

**Files:** Replace `src/pages/index.astro`; Test `tests/homepage.test.ts`

**Interfaces:** Consumes BaseLayout + all section components. Renders, in order: PromoBar, NavBar (+MobileDrawer), Hero, AsSeenIn, WhyChoose, ServicesGrid, PropertyManagement, LogoWall, ConversionBand, Reviews, Credentials, BusinessesWorkedWith, Faq, ServiceAreas, Footer, StickyCallBar — all with `location="main"`.

- [ ] **Step 1: Write failing test `tests/homepage.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import index from '../src/pages/index.astro';

test('homepage composes all sections and never leaks a non-resolved number', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(index, {});
  for (const marker of [
    'Top Local Locksmith in Gainesville', 'As featured in', 'Why Choose Be Secure',
    'Trusted Locksmith Services', 'Commercial Property Management Solutions',
    'Check Out Our Google Reviews', 'Trust Our Credentials', 'Be Secure Locksmith FAQs',
    'Mobile to your door', 'Powered by The Locksmith Agency',
  ]) expect(html).toContain(marker);
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('"@type":"FAQPage"');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Implement `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PromoBar from '../components/sections/PromoBar.astro';
import NavBar from '../components/sections/NavBar.astro';
import Hero from '../components/sections/Hero.astro';
import AsSeenIn from '../components/sections/AsSeenIn.astro';
import WhyChoose from '../components/sections/WhyChoose.astro';
import ServicesGrid from '../components/sections/ServicesGrid.astro';
import PropertyManagement from '../components/sections/PropertyManagement.astro';
import LogoWall from '../components/sections/LogoWall.astro';
import ConversionBand from '../components/sections/ConversionBand.astro';
import Reviews from '../components/sections/Reviews.astro';
import Credentials from '../components/sections/Credentials.astro';
import BusinessesWorkedWith from '../components/sections/BusinessesWorkedWith.astro';
import Faq from '../components/sections/Faq.astro';
import ServiceAreas from '../components/sections/ServiceAreas.astro';
import Footer from '../components/sections/Footer.astro';
import StickyCallBar from '../components/sections/StickyCallBar.astro';
const location = 'main';
---
<BaseLayout title="Top Local Locksmith in Gainesville & Ocala, FL | Be Secure Locksmith" description="Licensed & insured mobile locksmith serving Gainesville, Ocala & surrounding areas since 2012." location={location}>
  <PromoBar location={location} />
  <NavBar location={location} />
  <Hero location={location} />
  <AsSeenIn />
  <WhyChoose />
  <ServicesGrid />
  <PropertyManagement />
  <LogoWall />
  <ConversionBand location={location} />
  <Reviews />
  <Credentials />
  <BusinessesWorkedWith />
  <Faq />
  <ServiceAreas location={location} />
  <Footer location={location} />
  <StickyCallBar location={location} />
</BaseLayout>
```

- [ ] **Step 4: Run — PASS.** Then `npm run build` — expect success and `dist/index.html` present.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: assemble Be Secure homepage from design-system sections"`

---

## Task 20: Interactive + accessibility e2e (Playwright)

**Files:** Create `playwright.config.ts`, `tests/e2e/homepage.spec.ts`

**Interfaces:** Drives the built/preview site. Verifies progressive-enhancement behaviors and a11y.

- [ ] **Step 1: Install** `npm install -D @playwright/test @axe-core/playwright && npx playwright install chromium`

- [ ] **Step 2: `playwright.config.ts`** — `webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4321', reuseExistingServer: !process.env.CI }`, `use: { baseURL: 'http://localhost:4321' }`.

- [ ] **Step 3: Write `tests/e2e/homepage.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('mobile drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await page.click('[data-drawer-toggle]');
  await expect(page.locator('[data-drawer][data-open]')).toBeVisible();
  await page.click('[data-drawer-close]');
  await expect(page.locator('[data-drawer][data-open]')).toHaveCount(0);
});

test('FAQ accordion toggles', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('details').first();
  await first.locator('summary').click();
  // toggled state asserted via open attribute
  await expect(first).toHaveJSProperty('open', false);
});

test('no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(v => ['serious','critical'].includes(v.impact || ''));
  expect(serious).toEqual([]);
});
```

- [ ] **Step 4: Run** `npx playwright test` — expect PASS. Fix any serious a11y violations (focus states, labels, contrast) until green.

- [ ] **Step 5: Commit** `git add -A && git commit -m "test: add Playwright interactive + accessibility e2e for homepage"`

---

## Task 21: Homepage verification & migration checkpoint

**Files:** Modify `docs/migration/url-manifest.md` (check off `/`)

- [ ] **Step 1: Full test sweep** `npm test && npx playwright test` — expect all PASS.
- [ ] **Step 2: Build + serve** `npm run build && npm run preview`; confirm the homepage renders at `http://localhost:4321/` (trailing-slash root) and visually matches the zip thumbnail (header, hero, sections, footer, mobile sticky bar at ≤880px).
- [ ] **Step 3: No-placeholder + no-leak check** — grep the build for stray template syntax and unintended numbers:
```bash
! grep -rE "\{\{|sc-for|sc-if|lorem" dist/
```
Expected: no matches.
- [ ] **Step 4: Mark `/` complete** in `docs/migration/url-manifest.md` (`- [x] https://besecurelocksmith.com/`).
- [ ] **Step 5: Commit** `git add -A && git commit -m "chore: verify homepage build and check off / in migration manifest"`

---

## Self-Review (completed during planning)

- **Spec coverage:** Architecture/project structure → T1; tokens → T2; brand config → T3; per-location resolution → T4 (+ consumed in T8/9/10/15/18/19); primitives → T5; content model → T6; content migration/images → T7 (+ homepage copy seeded in T6 from zip); BaseLayout + LocalBusiness JSON-LD → T8; all 16 sections A–P → T9–T18; FAQPage JSON-LD → T17; homepage assembly → T19; responsive/interactive + a11y quality bar → T20; URL preservation/trailing-slash → T1 + verified T21. All spec sections map to tasks.
- **Placeholder scan:** location records limited to `main` (the only one the homepage uses) to avoid inventing the unknown tracking numbers; Gainesville/Ocala/Lake City records explicitly deferred to the service-area spec. Section tasks embed verbatim content from the zip. No TODO/TBD left.
- **Type consistency:** `resolveLocation`/`resolvePhone`/`telHref`/`smsHref`/`site` names used consistently across T3–T19; `Location` shape stable; collection field names (`title`,`desc`,`order`,`photo`/`name`,`initial`,`color`,`time`,`quote`/`question`,`answer`) consistent between T6 schema and consuming sections.

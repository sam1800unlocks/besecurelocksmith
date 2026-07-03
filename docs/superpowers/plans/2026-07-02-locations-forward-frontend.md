# Locations-Forward Front-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the two staffed offices (Gainesville + Ocala) obvious to human visitors and better internally-linked, via a restructured nav (About▾ / Services▾ 4-col / Locations▾), a shared `OfficeCard`/`OfficesBand`, a new `/locations/` hub, a homepage offices band, and a contact-page cleanup — with no new business schema and no URL changes.

**Architecture:** Two new presentational components (`OfficeCard` = one office, `OfficesBand` = heading + both offices) driven by the existing `offices` config. Nav becomes data-driven across three dropdown types keyed off `tab.dropdown` (`'services' | 'about' | 'locations'`), rendered by `NavBar` (desktop) and `MobileDrawer` (mobile). A new `/locations/` page and a homepage band consume `OfficesBand`; the contact page swaps its inline office cards for `OfficesBand` and drops a redundant list.

**Tech Stack:** Astro 4 (static), TypeScript, Tailwind v4, Vitest (dist-HTML assertions). Source of truth: the design spec `docs/superpowers/specs/2026-07-02-locations-forward-frontend-design.md`.

## Global Constraints

- **URLs unchanged:** the two office pages stay at `/service-areas/locksmith-gainesville-fl/` and `/service-areas/locksmith-ocala-fl/`. New surfaces link to them.
- **No new business schema.** The `/locations/` hub carries `BreadcrumbList` only. The homepage org node and the two office-page location nodes are unchanged. No page other than homepage + the two office pages carries `LocalBusiness`/`#organization`.
- **Nav = 8 tabs:** Home · About▾ · Services▾ · Price List · Service Areas · Locations▾ · Blog · Contact.
- **About▾** → About Us (`/about/`) · Testimonials (`/testimonials/`) · Careers (`/employment/`). Testimonials is no longer a top-level tab.
- **Services▾** 4 columns — Automotive (`/services/automotive-locksmith/`): Car Key Programming, Car Key Replacement, Ignition Repair · **Residential** (`/services/residential-locksmith/`): Lock Rekeying, Lock Repair, New Lock Installation · Commercial (`/services/commercial-locksmith/`): Interchangeable Core Locks, Master Key Systems, Property Management · Lock Services (no page): Emergency Lockout, Key Duplication, Mailbox Lock Installation, Safe Locksmith, Smart Lock Installation.
- **Locations▾** → Gainesville Office (`/service-areas/locksmith-gainesville-fl/`) · Ocala Office (`/service-areas/locksmith-ocala-fl/`) · View all locations (`/locations/`).
- **Map/directions form** (matches the schema work): embed `https://www.google.com/maps/place/?cid=${cid}&output=embed`; directions `https://www.google.com/maps/place/?cid=${cid}`.
- **Phones:** office cards use the tracking line via `telHref(office.trackingPhone)`; display `office.phone`.
- Follow existing component/style patterns (`Section`/`Container`/`Button` primitives, Tailwind tokens, the a11y-safe `hidden group-hover:block group-focus-within:block` dropdown reveal). Match the existing hero pattern (see `contact-us`/`about`) for the hub hero.

## File Structure

- `src/components/sections/OfficeCard.astro` — **create.** One office: map, NAP, hours, call button, directions, "View {city} details".
- `src/components/sections/OfficesBand.astro` — **create.** `Section` with a heading + grid of both `OfficeCard`s (from `offices`).
- `src/config/offices.ts` — **modify.** Add `hoursDisplay` to `Office` + both records.
- `src/pages/locations/index.astro` — **create.** Hub page (hero + `OfficesBand` + service-areas link + breadcrumb).
- `src/config/site.ts` — **modify.** New `nav` shape, `aboutMenu`, `locationsMenu`, 4-column `serviceMenu`.
- `src/components/sections/NavBar.astro` — **modify.** Render three dropdown types.
- `src/components/sections/MobileDrawer.astro` — **modify.** Mirror the three dropdown types.
- `src/pages/index.astro` — **modify.** Insert `<OfficesBand>` after `<Reviews>`, before `<ServiceAreas>`.
- `src/pages/contact-us/index.astro` — **modify.** Dual-city title; swap inline offices for `<OfficesBand>`; remove `<ServiceAreas>` list → single link.
- Tests: `tests/locations-page.test.ts`, `tests/nav.test.ts`, extend `tests/homepage.test.ts` & `tests/contact-page.test.ts`.

---

### Task 1: OfficeCard + OfficesBand + Locations hub

**Files:**
- Modify: `src/config/offices.ts`
- Create: `src/components/sections/OfficeCard.astro`, `src/components/sections/OfficesBand.astro`, `src/pages/locations/index.astro`
- Test: `tests/locations-page.test.ts`

**Interfaces:**
- Produces: `OfficeCard` (prop `office: Office`), `OfficesBand` (props `heading: string`, `subheading?: string`, `class?: string`), `offices.*.hoursDisplay: string`, and the `/locations/` route.

- [ ] **Step 1: Add `hoursDisplay` to offices** — in `src/config/offices.ts`, add to the `Office` interface `hoursDisplay: string;` and to BOTH records `hoursDisplay: 'Mon–Fri 8 am–5 pm',` (same hours both offices).

- [ ] **Step 2: Create `src/components/sections/OfficeCard.astro`**

```astro
---
import type { Office } from '../../config/offices';
import { telHref } from '../../config/site';
interface Props { office: Office; }
const { office } = Astro.props;
const cidMap = `https://www.google.com/maps/place/?cid=${office.cid}`;
---
<div class="rounded-[20px] border border-border bg-white overflow-hidden flex flex-col">
  <div class="relative aspect-[16/10] bg-surface">
    <iframe title={`Map to Be Secure Locksmith ${office.label} office`} loading="lazy" class="w-full h-full border-0 block" src={`${cidMap}&output=embed`}></iframe>
  </div>
  <div class="p-6 flex flex-col gap-3 flex-1">
    <p class="m-0 text-[13px] font-bold uppercase tracking-[0.8px] text-primary">{office.label} Office</p>
    <p class="m-0 text-[15px] leading-[1.5] text-ink font-semibold">{office.street}<br />{office.cityStateZip}</p>
    <p class="m-0 text-[14px] text-muted">{office.hoursDisplay}</p>
    <div class="mt-auto flex flex-wrap items-center gap-3 pt-2">
      <a href={telHref(office.trackingPhone)} class="inline-flex items-center rounded-pill bg-call hover:bg-call-hover text-white font-bold text-[14px] px-[18px] py-[10px]">{office.phone}</a>
      <a href={cidMap} target="_blank" rel="noopener noreferrer" class="text-[14px] font-semibold text-primary hover:text-primary-hover">Get Directions &rarr;</a>
    </div>
    <a href={`/service-areas/${office.slug}/`} class="text-[14px] font-semibold text-ink hover:text-primary">View {office.label} details &rarr;</a>
  </div>
</div>
```

- [ ] **Step 3: Create `src/components/sections/OfficesBand.astro`**

```astro
---
import Section from '../primitives/Section.astro';
import Container from '../primitives/Container.astro';
import OfficeCard from './OfficeCard.astro';
import { offices } from '../../config/offices';
interface Props { heading: string; subheading?: string; class?: string; }
const { heading, subheading, class: cls = '' } = Astro.props;
---
<Section class={cls}>
  <Container>
    <div class="max-w-[1180px] mx-auto py-12 md:py-16">
      <h2 class="m-0 text-ink font-medium tracking-[-0.6px]" style="font-size:clamp(24px,3.2vw,32px);line-height:1.2;">{heading}</h2>
      {subheading && <p class="m-0 mt-3 text-[16px] leading-[1.55] text-secondary max-w-[640px]">{subheading}</p>}
      <div class="mt-8 grid gap-6 md:grid-cols-2">
        {Object.values(offices).map((o) => <OfficeCard office={o} />)}
      </div>
    </div>
  </Container>
</Section>
```

- [ ] **Step 4: Create `src/pages/locations/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PromoBar from '../../components/sections/PromoBar.astro';
import NavBar from '../../components/sections/NavBar.astro';
import TrustStrip from '../../components/sections/TrustStrip.astro';
import OfficesBand from '../../components/sections/OfficesBand.astro';
import Footer from '../../components/sections/Footer.astro';
import StickyCallBar from '../../components/sections/StickyCallBar.astro';
import Section from '../../components/primitives/Section.astro';
import Container from '../../components/primitives/Container.astro';
import Button from '../../components/primitives/Button.astro';
import { site, telHref } from '../../config/site';
import { resolveLocation, resolvePhone } from '../../lib/locations';

const location = 'main';
const phone = resolvePhone(resolveLocation(location));
const title = 'Our Locksmith Offices in Gainesville & Ocala, FL | Be Secure Locksmith';
const description = 'Be Secure Locksmith has two staffed, licensed mobile locksmith offices — Gainesville and Ocala, FL. See each office’s address, hours, phone, and directions.';
const pageUrl = 'https://besecurelocksmith.com/locations/';
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://besecurelocksmith.com/' },
    { '@type': 'ListItem', position: 2, name: 'Locations', item: pageUrl },
  ],
};
---
<BaseLayout title={title} description={description} location={location}>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(breadcrumbJsonLd)} />
  </Fragment>
  <PromoBar location={location} />
  <NavBar location={location} />
  <main>
    <section class="relative overflow-hidden text-white" style="background:linear-gradient(160deg,#0e4a8f 0%,#0b2f5e 42%,#0a1830 100%);">
      <div class="absolute inset-0 opacity-[0.09]" style="background-image:radial-gradient(circle at 1px 1px,#ffffff 1px,transparent 0);background-size:22px 22px;"></div>
      <div class="absolute -top-28 -right-20 w-[540px] h-[540px] rounded-full pointer-events-none" style="background:radial-gradient(circle,rgba(56,150,255,0.60),transparent 70%);"></div>
      <Container>
        <div class="relative max-w-[1180px] mx-auto py-14 md:py-20">
          <nav aria-label="Breadcrumb" class="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-white/70">
            <a href="/" class="hover:text-white">Home</a><span aria-hidden="true">/</span><span class="text-white">Locations</span>
          </nav>
          <h1 class="m-0 mb-4 font-medium text-white max-w-[820px]" style="font-size:clamp(32px,5.2vw,56px);line-height:1.08;letter-spacing:-1.2px;">Our Locksmith Offices in Gainesville &amp; Ocala, FL</h1>
          <p class="m-0 mb-7 text-[18px] leading-[1.4] text-white/80 max-w-[680px]">Two staffed, licensed, and insured mobile locksmith offices serving North Central Florida since 2012.</p>
          <div class="flex flex-wrap gap-3">
            <Button href={telHref(phone)} variant="call">{phone}</Button>
            <Button href={site.bookingUrl} variant="booking" target="_blank" rel="noopener noreferrer">Book Now</Button>
          </div>
        </div>
      </Container>
    </section>
    <TrustStrip />
    <OfficesBand heading="Two Staffed Offices, One Trusted Team" subheading="Each office runs its own local mobile team for car, home, and business locksmith service. Call the office nearest you or get directions below." />
    <Section class="bg-surface">
      <Container>
        <div class="max-w-[1180px] mx-auto py-12 text-center">
          <p class="m-0 text-[17px] leading-[1.6] text-secondary">Beyond our two offices, we serve 13+ cities across North Central Florida. <a href="/service-areas/" class="text-primary font-semibold underline">See all service areas &rarr;</a></p>
        </div>
      </Container>
    </Section>
  </main>
  <Footer location={location} />
  <StickyCallBar location={location} />
</BaseLayout>
```

- [ ] **Step 5: Write the failing test** — `tests/locations-page.test.ts`

```ts
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
```
> **Note on the map assertions:** the schema work verified that Astro renders the `&` in this iframe `src` **literally** in the built HTML (dist shows `cid=…&output=embed`), so assert the literal `&`. The `output=embed` marker is unique to the iframe, so it distinguishes the embed from the "Get Directions" link (which has no `output=embed`). If a future Astro version changes the encoding, inspect `dist/locations/index.html` and match it.

- [ ] **Step 6: Build + run**

Run: `npm run build && npx vitest run tests/locations-page.test.ts`
Expected: PASS. (If the map-encoding assertion fails, adjust it to the observed encoding per the note, then re-run.)

- [ ] **Step 7: Commit**

```bash
git add src/config/offices.ts src/components/sections/OfficeCard.astro src/components/sections/OfficesBand.astro src/pages/locations/index.astro tests/locations-page.test.ts
git commit -m "feat(locations): OfficeCard + OfficesBand + /locations/ hub"
```

---

### Task 2: Navigation restructure (config + NavBar + MobileDrawer)

**Files:**
- Modify: `src/config/site.ts`, `src/components/sections/NavBar.astro`, `src/components/sections/MobileDrawer.astro`
- Test: `tests/nav.test.ts`

**Interfaces:**
- Consumes: the `/locations/` route (Task 1) and the office-page URLs.
- Produces: `nav` (entries may carry `dropdown: 'services' | 'about' | 'locations'`), `aboutMenu`, `locationsMenu`, updated `serviceMenu`.

- [ ] **Step 1: Replace the nav data in `src/config/site.ts`** — replace the existing `nav` and `serviceMenu` exports and add `aboutMenu`/`locationsMenu`:

```ts
export const nav = [
  { label: 'Home',          href: '/',              active: true },
  { label: 'About',         href: '/about/',        dropdown: 'about' },
  { label: 'Services',      href: '/#services',     dropdown: 'services' },
  { label: 'Price List',    href: '/price-list/' },
  { label: 'Service Areas', href: '/service-areas/' },
  { label: 'Locations',     href: '/locations/',    dropdown: 'locations' },
  { label: 'Blog',          href: '/blog/' },
  { label: 'Contact',       href: '/contact-us/' },
] as const;

type NavMenuItem = { label: string; href: string; sub?: string; cta?: boolean };

export const aboutMenu: NavMenuItem[] = [
  { label: 'About Us',     href: '/about/' },
  { label: 'Testimonials', href: '/testimonials/' },
  { label: 'Careers',      href: '/employment/' },
];

export const locationsMenu: NavMenuItem[] = [
  { label: 'Gainesville Office', href: '/service-areas/locksmith-gainesville-fl/', sub: '901 NW 8th Ave. C17' },
  { label: 'Ocala Office',       href: '/service-areas/locksmith-ocala-fl/',       sub: '217 SE 1st Ave. Suite 200-50' },
  { label: 'View all locations', href: '/locations/', cta: true },
];

export const serviceMenu = [
  { label: 'Automotive', href: '/services/automotive-locksmith/', items: [
    { label: 'Car Key Programming',  href: '/services/car-key-programming/' },
    { label: 'Car Key Replacement',  href: '/services/car-key-replacement/' },
    { label: 'Ignition Repair',      href: '/services/ignition-repair/' },
  ] },
  { label: 'Residential', href: '/services/residential-locksmith/', items: [
    { label: 'Lock Rekeying',        href: '/services/lock-rekeying/' },
    { label: 'Lock Repair',          href: '/services/lock-repair/' },
    { label: 'New Lock Installation',href: '/services/new-lock-installation/' },
  ] },
  { label: 'Commercial', href: '/services/commercial-locksmith/', items: [
    { label: 'Interchangeable Core Locks', href: '/services/interchangeable-core-locks/' },
    { label: 'Master Key Systems',         href: '/services/master-key-systems/' },
    { label: 'Property Management',        href: '/services/property-management/' },
  ] },
  { label: 'Lock Services', href: '', items: [
    { label: 'Emergency Lockout Service',  href: '/services/emergency-lockouts/' },
    { label: 'Key Duplication',            href: '/services/key-duplication/' },
    { label: 'Mailbox Lock Installation',  href: '/services/mailbox-lock-installation/' },
    { label: 'Safe Locksmith',             href: '/services/safe-locksmith/' },
    { label: 'Smart Lock Installation',    href: '/services/smart-lock-installation/' },
  ] },
] as const;
```

- [ ] **Step 2: Update `NavBar.astro` imports + desktop dropdown rendering** — change the import on line 3 to also pull the new menus:

```ts
import { telHref, site, nav as navTabs, serviceMenu, aboutMenu, locationsMenu } from '../../config/site';
```

Replace the desktop tab-map block (the `{navTabs.map((tab) => ( tab.dropdown ? (...service mega-menu...) : (...link...) ))}` in the `hidden xl:flex … justify-center` div) with:

```astro
{navTabs.map((tab) => (
  tab.dropdown ? (
    <div class="relative group">
      <button type="button" aria-haspopup="true" class="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-2 rounded-md tracking-[-0.14px] whitespace-nowrap transition-colors text-ink hover:text-primary group-hover:text-primary cursor-default bg-transparent border-0">
        {tab.label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:rotate-180" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="hidden group-hover:block group-focus-within:block absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50">
        {tab.dropdown === 'services' ? (
          <div class="w-[620px] max-w-[92vw] bg-white border border-border rounded-2xl p-6 grid grid-cols-2 gap-x-8 gap-y-5" style="box-shadow:0 18px 50px rgba(10,19,23,0.16);">
            {serviceMenu.map((grp) => (
              <div>
                {grp.href ? (
                  <a href={grp.href} class="block mb-2.5 text-[12px] font-bold uppercase tracking-[0.6px] text-primary hover:underline">{grp.label}</a>
                ) : (
                  <span class="block mb-2.5 text-[12px] font-bold uppercase tracking-[0.6px] text-muted-2">{grp.label}</span>
                )}
                <ul class="flex flex-col gap-1.5 m-0 p-0 list-none">
                  {grp.items.map((it) => (<li><a href={it.href} class="text-[14px] leading-[1.4] text-ink hover:text-primary transition-colors">{it.label}</a></li>))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div class="w-[290px] bg-white border border-border rounded-2xl p-3" style="box-shadow:0 18px 50px rgba(10,19,23,0.16);">
            {(tab.dropdown === 'about' ? aboutMenu : locationsMenu).map((it) => (
              it.cta ? (
                <a href={it.href} class="block mt-1 px-3 py-2.5 text-[13px] font-bold uppercase tracking-[0.6px] text-primary border-t border-border hover:underline">{it.label} &rarr;</a>
              ) : (
                <a href={it.href} class="block px-3 py-2.5 rounded-lg hover:bg-surface">
                  <span class="block text-[14px] font-semibold text-ink">{it.label}</span>
                  {it.sub && <span class="block text-[12px] text-muted">{it.sub}</span>}
                </a>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  ) : (
    <a href={tab.href} class={`text-sm font-semibold px-2.5 py-2 rounded-md tracking-[-0.14px] whitespace-nowrap transition-colors ${tab.active ? 'text-primary' : 'text-ink hover:text-primary'}`}>{tab.label}</a>
  )
))}
```

- [ ] **Step 3: Update `MobileDrawer.astro` imports + dropdown rendering** — change line 3 import to add the menus:

```ts
import { telHref, site, nav as navTabs, serviceMenu, aboutMenu, locationsMenu } from '../../config/site';
```

Replace the `<details>` branch body (the `{serviceMenu.map(...)}` inside `<div class="flex flex-col gap-3 pl-4 pb-2 pt-1">`) so it renders by type:

```astro
<div class="flex flex-col gap-3 pl-4 pb-2 pt-1">
  {tab.dropdown === 'services' ? (
    serviceMenu.map((grp) => (
      <div>
        {grp.href ? (
          <a href={grp.href} data-drawer-close class="block px-2 py-1 text-[12px] font-bold uppercase tracking-[0.6px] text-primary">{grp.label}</a>
        ) : (
          <span class="block px-2 py-1 text-[12px] font-bold uppercase tracking-[0.6px] text-muted-2">{grp.label}</span>
        )}
        {grp.items.map((it) => (<a href={it.href} data-drawer-close class="block px-2 py-[7px] text-[14px] text-ink rounded-md hover:bg-surface">{it.label}</a>))}
      </div>
    ))
  ) : (
    (tab.dropdown === 'about' ? aboutMenu : locationsMenu).map((it) => (
      <a href={it.href} data-drawer-close class="block px-2 py-[7px] text-[14px] text-ink rounded-md hover:bg-surface">{it.label}</a>
    ))
  )}
</div>
```

> The `<summary>` line already renders `{tab.label}` — leave it. The outer `{navTabs.map((tab) => ( tab.dropdown ? (<details>…) : (<a>…) ))}` structure is unchanged; only the inner panel body above changes.

- [ ] **Step 4: Write the failing test** — `tests/nav.test.ts`

```ts
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
```
> This runs against the homepage build, which renders `NavBar` + `MobileDrawer`. (`/employment/` and `/testimonials/` now appear only inside the About dropdown, confirming Testimonials is no longer a standalone tab.)

- [ ] **Step 5: Build + run**

Run: `npm run build && npx vitest run tests/nav.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/config/site.ts src/components/sections/NavBar.astro src/components/sections/MobileDrawer.astro tests/nav.test.ts
git commit -m "feat(nav): Locations + About dropdowns, 4-column Services menu with Residential heading"
```

---

### Task 3: Homepage "Visit Our Offices" band

**Files:**
- Modify: `src/pages/index.astro`
- Test: `tests/homepage.test.ts` (extend)

**Interfaces:**
- Consumes: `OfficesBand` (Task 1).

- [ ] **Step 1: Add the import + band** — in `src/pages/index.astro`, add to the imports:

```ts
import OfficesBand from '../components/sections/OfficesBand.astro';
```
Then insert the band between `<Reviews />` and `<ServiceAreas location={location} />`:

```astro
  <Reviews />
  <OfficesBand heading="Visit Our Gainesville & Ocala Offices" subheading="Two staffed, licensed mobile locksmith offices serving North Central Florida since 2012." />
```
(Leave the rest of the section order unchanged: `<Credentials />`, `<BusinessesWorkedWith />`, `<Faq />`, `<ServiceAreas />`, etc.)

- [ ] **Step 2: Write the failing test** — append to `tests/homepage.test.ts`

```ts
test('homepage shows the two-office band before the service-area list', () => {
  const h = read('index.html');
  expect(h).toContain('Visit Our Gainesville &amp; Ocala Offices');
  expect(h).toContain('View Gainesville details');
  expect(h).toContain('View Ocala details');
  // band appears before the ServiceAreas city list (which links Belleview)
  expect(h.indexOf('Visit Our Gainesville')).toBeLessThan(h.indexOf('/service-areas/locksmith-belleview-fl/'));
});
```
> If `tests/homepage.test.ts` doesn't already define a `read`/`dist` helper, copy the 3-line helper from the top of `tests/nav.test.ts`.

- [ ] **Step 3: Build + run**

Run: `npm run build && npx vitest run tests/homepage.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro tests/homepage.test.ts
git commit -m "feat(home): add Visit Our Offices band above the service-area list"
```

---

### Task 4: Contact page cleanup

**Files:**
- Modify: `src/pages/contact-us/index.astro`
- Test: `tests/contact-page.test.ts` (extend)

**Interfaces:**
- Consumes: `OfficesBand` (Task 1).

- [ ] **Step 1: Dual-city title** — in `src/pages/contact-us/index.astro`, change `const title` (line ~22) to:

```ts
const title = 'Contact Our Gainesville & Ocala, FL Locksmith';
```

- [ ] **Step 2: Swap the inline "Our Offices" section for `OfficesBand`** — add the import:

```ts
import OfficesBand from '../../components/sections/OfficesBand.astro';
```
Replace the entire inline `<!-- Our Offices --> <Section …> … </Section>` block (the one that maps `Object.values(offices)` into plain cards, ~lines 71–87) with:

```astro
    <OfficesBand heading="Our Offices" />
```
Remove the now-unused `offices` import if nothing else on the page uses it (grep the file for `offices`); leave `resolveLocation`/`resolvePhone`/`site`/`telHref` imports (still used by the hero CTA).

- [ ] **Step 3: Remove the redundant ServiceAreas list → single link** — replace the `<ServiceAreas location={location} />` line (~line 90) with a one-line link block, and remove the `ServiceAreas` import (line 8):

```astro
    <Section class="bg-surface">
      <Container>
        <div class="max-w-[760px] mx-auto py-10 text-center">
          <p class="m-0 text-[16px] leading-[1.6] text-secondary">We also serve 13+ nearby cities across North Central Florida. <a href="/service-areas/" class="text-primary font-semibold underline">See all service areas &rarr;</a></p>
        </div>
      </Container>
    </Section>
```

- [ ] **Step 4: Write the failing test** — append to `tests/contact-page.test.ts`

```ts
test('contact page: dual-city title, office cards, no full service-area list', () => {
  const h = read('contact-us/index.html');
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  expect(title).toContain('Gainesville');
  expect(title).toContain('Ocala');
  // OfficesBand rendered
  expect(h).toContain('View Gainesville details');
  expect(h).toContain('View Ocala details');
  // the full multi-city ServiceAreas SECTION is gone. The footer still lists every city,
  // so a city link appears exactly ONCE (footer only) once the section is removed —
  // with the section it appeared twice. Belleview is a stable footer/list city.
  expect((h.match(/\/service-areas\/locksmith-belleview-fl\//g) || []).length).toBe(1);
  // the new single "See all service areas" link is present
  expect(h).toContain('See all service areas');
});
```
> If `tests/contact-page.test.ts` lacks the `read`/`dist` helper, copy the 3-line helper from `tests/nav.test.ts`.

- [ ] **Step 5: Build + run**

Run: `npm run build && npx vitest run tests/contact-page.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/contact-us/index.astro tests/contact-page.test.ts
git commit -m "feat(contact): dual-city title, OfficesBand, drop redundant service-area list"
```

---

### Task 5: Full-suite verification + reconcile

**Files:** test files only, as needed.

- [ ] **Step 1: Full build + suite**

Run: `npm run build && npm test`
Expected: all green. Pre-existing tests may assert the OLD nav (e.g. a test expecting `Testimonials` as a top-level tab, a fixed tab count, or `serviceMenu` having 3 groups / Property Management under "Lock Services"). For each failure, update the assertion to the NEW structure from the Global Constraints (do not weaken the test — assert the new truth). Report the count.

- [ ] **Step 2: Grep for stragglers**

Run: `grep -rniE "testimonials" src/config/site.ts; grep -rn "serviceMenu\|aboutMenu\|locationsMenu" src`
Expected: `serviceMenu`/`aboutMenu`/`locationsMenu` referenced only by `NavBar.astro` and `MobileDrawer.astro`; no dangling references. Fix any missed consumer.

- [ ] **Step 3: Manual spot-check (record, don't skip)**

`npm run preview` and verify in a browser: the desktop **Locations** and **About** dropdowns open and link correctly; the **Services** menu shows 4 columns with **Residential** as a heading; `/locations/` renders both office maps; the mobile drawer expands all three groups. Note results in the report.

- [ ] **Step 4: Commit any reconciliation fixes**

```bash
git add -A -- tests
git commit -m "test(nav): reconcile pre-existing tests with the locations-forward nav"
```

---

## Notes for the implementer

- **Do not** touch the office-page URLs, the schema-placement rule, the pre-launch `robots.txt`, or the `.claude/settings.json` file.
- The two office pages already carry their own NAP block + `Locksmith in {City}, FL` title (from the schema work) — this plan only *links into* them, it does not reframe them.
- Keep the tree green (`npm test`) before finishing; the site auto-deploys on push, so nothing ships until the user pushes.

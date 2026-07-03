# Locations-Forward Front-End (Nav · Services Menu · Locations Hub · Homepage · Contact) — Design

**Date:** 2026-07-02
**Status:** Approved design → ready for implementation plan

## Context

The multi-location **schema** is now strong (parent `Locksmith` org on the homepage + two per-store location nodes on the Gainesville/Ocala office pages). But the **human-facing front-end** under-communicates the two staffed offices: the top nav has no "Locations" entry (office pages are reachable only via footer/Service-Areas links labeled as *service areas*), the homepage never spotlights the two offices, and the contact page shows a thin office-card pair immediately followed by a redundant full service-area list.

This design makes the two offices unmistakable to visitors and improves internal linking into the office pages — without changing their URLs (`/service-areas/locksmith-{city}-fl/`) or the established schema-placement rule. It also restructures the Services mega-menu so Residential is a first-class heading alongside Automotive and Commercial.

## Goals

- A visitor immediately understands Be Secure has **two staffed offices** (Gainesville + Ocala) and can navigate to each.
- Stronger internal linking into the two office pages (nav + homepage + new hub all link in) to reinforce their local-search authority.
- A cleaner Services mega-menu with Residential as its own heading.
- No regressions to existing URLs, the schema-placement rule, or existing tests.

## Decisions (locked)

- **Nav tabs (8, unchanged count):** Home · **About▾** · **Services▾** · Price List · Service Areas · **Locations▾** · Blog · Contact. (Testimonials moves under About; Locations takes the vacated slot; Service Areas stays as its own tab — *Service Areas* = cities served, *Locations* = staffed offices.)
- **About▾** → About Us (`/about/`) · Testimonials (`/testimonials/`) · Careers (`/employment/`).
- **Services▾** (4 columns):
  - **Automotive** (→ `/services/automotive-locksmith/`): Car Key Programming · Car Key Replacement · Ignition Repair
  - **Residential** (→ `/services/residential-locksmith/`): Lock Rekeying · Lock Repair · New Lock Installation
  - **Commercial** (→ `/services/commercial-locksmith/`): Interchangeable Core Locks · Master Key Systems · Property Management
  - **Lock Services** (label, no page): Emergency Lockout · Key Duplication · Mailbox Lock Installation · Safe Locksmith · Smart Lock Installation
- **Locations▾** → Gainesville Office (`/service-areas/locksmith-gainesville-fl/`) · Ocala Office (`/service-areas/locksmith-ocala-fl/`) · **View all locations →** (`/locations/` hub).
- **`OfficeCard`** shared component used on the hub, homepage, and contact page (DRY, driven by `offices` config).
- **`/locations/` hub** = new page; **BreadcrumbList schema only** (no business/`ItemList` schema — the office pages own location schema; the rule "business schema only on homepage + the 2 office pages" is preserved).
- **Homepage** gains a "Visit Our Offices" band (two `OfficeCard`s) after Reviews, above the existing `ServiceAreas` city list (which stays). No homepage schema change.
- **Contact page:** dual-city title; upgrade the plain office cards to `OfficeCard`; remove the redundant full `ServiceAreas` list, replacing it with a one-line link to `/service-areas/`.
- **Out of scope:** reframing the office pages' hero/copy from "Service Area" to "Office" (they already carry the NAP block + `Locksmith in {City}, FL` title); URL changes; the paused live-reviews project; the pre-launch `robots.txt` block.

## Architecture

### 1. Shared `OfficeCard` component (new)

`src/components/sections/OfficeCard.astro` (or a primitive). **Props:** `office: Office` (or an `OfficeKey`), plus an optional `variant`/`compact` flag for density. Renders, from the `offices` config:

- **{City} Office** label
- an embedded **CID map** iframe (`https://www.google.com/maps/place/?cid=${office.cid}&output=embed` — the form fixed in the schema work)
- **street** + **city/state/zip**
- **hours** (Mon–Fri 8 am–5 pm)
- **office phone** (the tracking line) as a red call button
- **Get Directions** link (`https://www.google.com/maps/place/?cid=${office.cid}`)
- **View {City} details →** link (→ `/service-areas/${office.slug}/`)

One component, identical presentation everywhere. Requires a per-office **hours** display string — add `hoursDisplay: 'Mon–Fri 8 am–5 pm'` to each office in `src/config/offices.ts` (single source; allows future per-office divergence). All other fields already exist on `Office`.

### 2. Navigation (data + rendering)

**Config (`src/config/site.ts`):**
- Restructure the `nav` array to the 8 tabs above. `About` and `Locations` become `dropdown: true` entries; `Services` stays `dropdown: true`.
- Add `aboutMenu` (3 links) and `locationsMenu` (2 offices + hub link) data structures alongside the existing `serviceMenu`.
- Update `serviceMenu` to the 4-column structure above (add the **Residential** group; move Property Management into **Commercial**; remove the standalone "Residential" item from the shared group).

**Rendering (`src/components/sections/NavBar.astro`):**
- Generalize the existing mega-menu pattern so a `dropdown` tab renders its associated panel: `serviceMenu` (4-col grid), `aboutMenu` (simple link list), `locationsMenu` (office links + "View all locations"). Keep the current hover/focus reveal (`hidden group-hover:block group-focus-within:block` — the a11y-safe pattern) and server-rendered links.
- `Locations` panel: two office links (each "**{City} Office** — {street}") + a "View all locations →" row to `/locations/`.

**Mobile (`src/components/sections/MobileDrawer.astro`):** mirror the three expandable groups (About, Services, Locations) with the same links.

### 3. Locations hub — `/locations/` (new page)

`src/pages/locations/index.astro`, using `BaseLayout` (default `schema="none"`):
- Hero: “Our Locksmith Offices in Gainesville & Ocala, FL” + short intro (two staffed, licensed mobile offices since 2012).
- Two `OfficeCard`s side-by-side (stack on mobile).
- A closing line: “Serving 13+ cities across North Central Florida → **Service Areas**” (link to `/service-areas/`).
- **Schema:** `BreadcrumbList` only (Home › Locations). No business/`ItemList` node.
- Nav "Locations" tab reflects active state on this page.

### 4. Homepage — "Visit Our Offices" band

Insert a new band in `src/pages/index.astro` **after `<Reviews />`, before `<ServiceAreas />`**: a section heading (“Visit Our Gainesville & Ocala Offices”) + the two `OfficeCard`s. Keep `ServiceAreas` (the 13-city list — different job). No schema change (the homepage org node already covers both offices).

### 5. Contact page cleanup (`src/pages/contact-us/index.astro`)

- Title → “Contact Our Gainesville & Ocala, FL Locksmith” (dual-city; keep it ≤ ~60 chars).
- Replace the inline plain “Our Offices” card pair (lines ~71–87) with the two `OfficeCard`s.
- Remove the `<ServiceAreas />` block (the redundant full list); replace with a one-line “We also serve 13+ nearby cities → **Service Areas**” link. Keep `ContactMethods`, `ContactForm`, and the “What’s next” section.

## Schema stance (humans **and** schema)

- **No new business schema** and no change to the placement rule. The two office pages remain the only location-schema carriers; the homepage keeps the full org node.
- The SEO benefit of this phase is **internal linking**: the nav Locations dropdown, the homepage offices band, and the `/locations/` hub all link into the two office pages, concentrating internal authority on them. The hub adds a crawlable, human-readable "two offices" page with a breadcrumb.

## Testing (dist-HTML assertions + component)

- **Nav:** rendered nav contains a **Locations** dropdown linking both office slugs + `/locations/`; an **About** dropdown linking `/about/`, `/testimonials/`, `/employment/`; the Services menu contains a **Residential** heading (→ residential page) with Lock Rekeying/Lock Repair/New Lock Installation, and Property Management under Commercial. Testimonials no longer a top-level tab.
- **`/locations/`:** page builds; contains both office NAPs, both CID map embeds, both "View {City} details" links, the Service Areas link, and a `BreadcrumbList` (and **no** `LocalBusiness`/`#organization`).
- **Homepage:** the offices band renders both office links and appears before the ServiceAreas list; homepage org node unchanged (still `reviewCount 2544`).
- **Contact:** dual-city `<title>`; both `OfficeCard`s present; the full ServiceAreas list is gone (single link remains); no business schema.
- **`OfficeCard`:** given an office, renders its street, city/state/zip, tracking phone, CID directions link, and `/service-areas/{slug}/` link.

## Files

- **Create:** `src/components/sections/OfficeCard.astro`, `src/pages/locations/index.astro`, tests.
- **Modify:** `src/config/site.ts` (nav/aboutMenu/locationsMenu/serviceMenu), `src/config/offices.ts` (add `hoursDisplay`), `src/components/sections/NavBar.astro`, `src/components/sections/MobileDrawer.astro`, `src/pages/index.astro` (offices band), `src/pages/contact-us/index.astro` (title, OfficeCard, drop ServiceAreas list).

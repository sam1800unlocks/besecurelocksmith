# Multi-Location Local SEO + Pro Schema — Design

**Date:** 2026-07-02
**Status:** Approved design → ready for implementation plan

## Context

Be Secure Locksmith operates **two co-equal, staffed offices** — Gainesville (`901 NW 8th Ave. C17, Gainesville, FL 32601`, GBP `kgmid=/g/1ptx2pkfg`) and Ocala (`217 SE 1st Ave. Suite 200-50, Ocala, FL 34471`, GBP `kgmid=/g/1yfprvxjj`) — plus ~11 surrounding service-area cities.

The rebuilt Astro site currently tells a **single-location story**: `BaseLayout` emits one `LocalBusiness` JSON-LD using the **Gainesville** NAP on nearly every page (default `location='main'`), including the **Ocala** service-area page — so Ocala-focused pages carry the wrong address in structured data, and Google sees one Gainesville entity site-wide. Titles/metas skew Gainesville-only, and neither office has a true "location page." This under-represents Ocala and the second GBP.

This design makes **each office a first-class local entity** in structure, address placement, schema, and titles, to maximize local-search visibility for both cities and their service areas. It applies the house `locksmith-schema-builder` skill (adapted from WordPress/Divi to the Astro codebase).

## Goal

Each office ranks in its own city; the correct office NAP appears in the right place on every page; per-office `Locksmith` schema is tied to the correct GBP; titles/metas give Gainesville and Ocala balanced weight.

## Decisions (locked)

- **Location model:** two co-equal staffed offices → parent **Organization** + two **`Locksmith`** location nodes.
- **Information architecture:** *upgrade the existing* `/service-areas/locksmith-gainesville-fl/` and `/service-areas/locksmith-ocala-fl/` into full office "location pages" (keep URLs, no new competing `/locations/` pages). The other 11 service-area pages remain, each **assigned to its nearest office**.
- **aggregateRating:** **combined** rating on the homepage org node only; **individual** per-store rating on each location node/page. Counts (static, hardcoded now): **Gainesville 1,330 · Ocala 1,214 · combined 2,544** (updates the stale 2,551). `ratingValue` 4.9 throughout. Update the visible badges (`Reviews`, `TrustStrip`, `testimonials`) to the combined **2,544**.
- **Org node placement:** the **full org node** (combined rating + `hasOfferCatalog` + `subOrganization` + `areaServed` + founder/memberOf) appears on the **homepage only**. A **lean org-identity node** (same `@id`, `@type`, name, url, logo, sameAs, founder — **no** combined rating, **no** catalog) appears on the **two location pages** so each location node's `parentOrganization` resolves on-page. **No** Organization/LocalBusiness schema on any other page (about, contact, services, blog, the 11 area pages).
- **Email:** add `info@besecurelocksmith.com` to the org node (`email` + `contactPoint.email`). (Live omits it; client wants it.)
- **Titles/metas:** *targeted* fixes only (not a full rewrite) — optimize the two office pages, add Ocala where pages are Gainesville-only, standardize the brand suffix. Blog + already-good service titles untouched.

## Architecture

### 1. Schema (JSON-LD) — multi-location entity graph

Replace the single site-wide `LocalBusiness` with:

- **Organization node** — `@id = https://besecurelocksmith.com/#organization`
  - `name`, `url`, `logo` (ImageObject), `image`, `description`, `sameAs` (both GBP `kgmid`/CID, all socials + directories: Facebook, Instagram, Yelp, LinkedIn, YouTube, 1800unlocks, Fair Trade, Chamber, ALOA, BNI), `contactPoint`.
  - `legalName`, `foundingDate`, `founder`, `hasCredential`, `memberOf`, `areaServed` (counties + cities w/ Wikipedia), and the full **`hasOfferCatalog` (34 services)** live **only** here (org-level) — matching live.
  - **Placement:** the **full** org node (combined `aggregateRating` 4.9 / **2544**, `hasOfferCatalog`, `areaServed`, `subOrganization` → both location `@id`s, founder, memberOf) is emitted on the **homepage only**. A **lean** org-identity node (same `@id`/`@type`/name/url/logo/sameAs/founder — no combined rating, no catalog) is emitted on the **two location pages** to anchor `parentOrganization`. Remove today's default site-wide `LocalBusiness` from `BaseLayout` (via the `localBusiness` prop) so **no other page** carries org/business schema.
  - Add `email:"info@besecurelocksmith.com"` and `contactPoint.email` to the org node.

- **Two `Locksmith` location nodes (lean)** — `@id = …/service-areas/locksmith-{gainesville,ocala}-fl/#localbusiness`
  - Each `parentOrganization: { "@id": ".../#organization" }`.
  - Fields (matching live — leaner than the org): `@type:"Locksmith"`, `@id`, `name` ("Be Secure Locksmith — {City}"), `url`, `telephone` (tracking line), `address` (that office), `geo`, `hasMap` (CID), `aggregateRating` (that store's count), `openingHoursSpecification`, `sameAs` (that office's GBP + local directory profiles), `parentOrganization`. (No per-location `hasOfferCatalog`/`areaServed` — those stay on the org.)
  - Emitted on the respective **office location page** (the upgraded service-area page).

- **Service-area pages (11 non-office cities):** **remove** the current mismatched Gainesville `LocalBusiness` (that's the bug) — the live site emits **no** business schema on these pages. Match live parity: keep only the existing `BreadcrumbList` + `LocalBusiness`-free page. *Optional enhancement (decide in planning, additive vs. live):* a light **`Service`** node — `provider:{"@id":".../#organization"}`, `areaServed:{City, Wikipedia sameAs}` — to reinforce each city; only if it validates cleanly and doesn't reintroduce a physical address. The two *office* cities keep their full `Locksmith` node per above.

- **Service pages:** keep `Service` schema; set `provider` → `#organization`; `areaServed` = both cities/region.

- **Global rules (from the skill):** `@type:"Locksmith"`; all `@id` absolute; `ratingValue` decimal; dashed phones; `openingHoursSpecification` object (never string); Wikipedia-only city `sameAs`; no `maps.app.goo.gl` (use CID/`kgmid`); no `keywords`/`geocircle`/self-promo `award`; no unconfirmed 24/7.

**Key files:** `src/layouts/BaseLayout.astro` (org node + `localBusiness`/`organization` prop), a new `src/lib/schema.ts` (builders for `organizationNode`, `locationNode(office)`, `serviceNode`), `src/config/offices.ts` (extend with `geo`, `cid`, `hours`, `areaServed` cities, `rating`, `reviewCount`, `email`), the two office pages, the service-area `[slug]` page, and `ServicePage.astro` / the 3 bespoke service pages.

### 2. Office location pages (upgrade existing area pages)

`/service-areas/locksmith-gainesville-fl/` and `…-ocala-fl/`:
- Render **that office's** real address + phone (NAP) prominently.
- Embed **that office's** Google map via its **CID** (not the current generic `mapQuery`).
- Unique, office-specific copy (distinct from the generic service-area intro).
- Emit the per-office `Locksmith` node (§1).
- Optimized title/meta (city + primary keyword + brand).

### 3. Address placement (visible content — separate from schema)

- **Homepage / global pages:** no single "the business address" implied; both offices in the footer (already ✓) and via the two location pages. No org street address rendered as canonical.
- **Contact page:** show **both** office NAP blocks in visible content (currently one). No business-schema node (per placement rule).
- **Office location pages:** that office's NAP prominent, in content **and** its location-node schema.
- **11 area pages:** nearest office's NAP may appear in visible content; **no** business schema.

### 4. Titles/metas (targeted)

- Two office pages: `Locksmith in {City}, FL | Be Secure Locksmith`-style, primary-keyword-forward.
- Add **Ocala** to homepage, About, and service-page titles/metas that are currently Gainesville-only (balanced dual-city, natural phrasing).
- Standardize the ` | Be Secure Locksmith` suffix where missing; keep lengths within ~60 chars (title) / ~155 (meta).
- Leave the ~75 blog + already-localized service titles unchanged.

## Source data — harvested from the live site (no intake form needed)

**The live WordPress site already implements this exact multi-location schema** (built with the house schema skill). This project is a **port** of that proven, ranking markup into the Astro codebase — not a new build. All required values were pulled from the live homepage + the two live location pages (audited 2026-07-02). Source of truth:

- **Org (homepage `/#organization`):** `@type:"Locksmith"`, `legalName:"Be Secure Locksmith LLC"`, `foundingDate:"2012-04-15"`, `priceRange:"$$"`, `paymentAccepted:"Cash, Visa, Mastercard, PayPal"`, `currenciesAccepted:"USD"`, combined `aggregateRating` 4.9 / 2544, `founder` (Netta Kaiden, Owner & Master Locksmith; `hasCredential` ALOA `AR125393`; `knowsAbout` = Wikipedia URLs), `contactPoint` tel `1-352-706-5295`, `areaServed` (Alachua/Marion/Citrus counties + Gainesville, Ocala, The Villages, Lake City, High Springs, Newberry, Williston — Wikipedia `sameAs`), `sameAs` (Gainesville `kgmid`, Yelp, Facebook, LinkedIn, Twitter, YouTube, BBB, 1800unlocks, Fair Trade, Chamber), `memberOf` (Chamber, ALOA), `hasOfferCatalog` (34 `Offer`→`Service` items, each `name` + `description` + `additionalType` Wikipedia + `priceSpecification.minPrice`), `subOrganization` → the two location `@id`s.
- **Gainesville location** (`…/service-areas/locksmith-gainesville-fl/#localbusiness`): name "Be Secure Locksmith — Gainesville", tel `1-352-290-7035` (tracking line), address `901 NW 8th Ave c17, Gainesville FL 32601`, `geo 29.65886,-82.3345`, `hasMap` CID `1525264823828817691`, `aggregateRating` 4.9 / **1330**, `sameAs` (Gainesville `kgmid` + Gainesville Yelp/1800unlocks/Fair Trade/Chamber + FB/LinkedIn/BBB), hours Mon–Fri 08:00–17:00, `parentOrganization → #organization`.
- **Ocala location** (`…/service-areas/locksmith-ocala-fl/#localbusiness`): name "Be Secure Locksmith — Ocala", tel `1-352-325-7953`, address `217 SE 1st Ave Suite 200-50, Ocala FL 34471`, `geo 29.1844122,-82.1355775`, `hasMap` CID `4138983982412980004`, `aggregateRating` 4.9 / **1214**, `sameAs` (Ocala `kgmid` + Ocala Yelp/1800unlocks/Fair Trade + FB/LinkedIn), hours Mon–Fri 08:00–17:00, `parentOrganization → #organization`.

**Notes / reconciliations:**
- Combined = sum of locations: **1330 + 1214 = 2544** (homepage). Our current hardcoded `2551` is stale → replace with per-location `1330`/`1214` + combined `2544`.
- Phones: **location nodes use the tracking numbers** (Gainesville `352-290-7035`, Ocala `352-325-7953`); the org `contactPoint` uses the main `352-706-5295`. Store these in `offices.ts` (extend with `trackingPhone`, `geo`, `cid`, `reviewCount`, `email?`).
- Phone format on live uses the `1-###-###-####` form (not the skill's plain dashed form) — match live for parity.
- Live schema **omits `email` and org-level `geo`/`hasMap`** (geo/CID live only on the location nodes). Follow live for geo/hasMap; **add `email:"info@besecurelocksmith.com"`** to the org node per client.
- Counts updated per client (static for now): **Gainesville 1,330 · Ocala 1,214 · combined 2,544** (live audit showed 1313/1212/2525).
- Review counts drift; this port hardcodes the audited values. The paused live-reviews project will later auto-refresh them (see Out of scope).

## Out of scope (separate/paused efforts)

- Live-review + schema auto-update pipeline (previously scoped/paused) — will later feed the per-location and combined `aggregateRating` so they self-update. This design hardcodes fresh values now.
- Image optimization (`<Image>`), the `/services/` hub 404, and the pre-launch `robots.txt Disallow: /` (remove at launch) — tracked separately.

## Verification

- **Google Rich Results Test** + **Schema.org validator** on the homepage, both office pages, a service page, and an Ocala service-area page → zero errors; correct entity per page.
- Confirm each office page's schema `address`/`geo`/`hasMap` matches **that** office (and NOT Gainesville on the Ocala page).
- Confirm homepage emits Organization + both location nodes + combined rating; each location page emits exactly one location node with its own rating.
- Titles/metas: automated test asserting Ocala appears on homepage/About and the office-page titles follow the pattern; no page missing a `<title>`/description.
- Extend the existing Vitest suite (dist-HTML assertions) for the above; run `npm run build` + `npm test`.
- After deploy: GSC URL Inspection + reindex for the two office pages; re-check in 1–2 weeks.

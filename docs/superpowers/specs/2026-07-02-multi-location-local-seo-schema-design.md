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
- **aggregateRating:** **combined** rating at the Organization level on the homepage (the overall figure the badge shows), and **individual** per-store rating + review count on each location node / location page.
- **Titles/metas:** *targeted* fixes only (not a full rewrite) — optimize the two office pages, add Ocala where pages are Gainesville-only, standardize the brand suffix. Blog + already-good service titles untouched.

## Architecture

### 1. Schema (JSON-LD) — multi-location entity graph

Replace the single site-wide `LocalBusiness` with:

- **Organization node** — `@id = https://besecurelocksmith.com/#organization`
  - `name`, `url`, `logo` (ImageObject), `image`, `description`, `sameAs` (both GBP `kgmid`/CID, all socials + directories: Facebook, Instagram, Yelp, LinkedIn, YouTube, 1800unlocks, Fair Trade, Chamber, ALOA, BNI), `contactPoint`.
  - `legalName`, `foundingDate` live **only** here (org-level).
  - Emitted **site-wide** via `BaseLayout` in place of today's default `LocalBusiness` (i.e., default `localBusiness` becomes the Organization).
  - **Homepage** additionally emits a **combined `aggregateRating`** on the Organization node (weighted avg rating + summed review count across both GBPs) and references both location nodes (`subOrganization` / `location` array or by `@id`).

- **Two `Locksmith` location nodes** — `@id = …/#gainesville` and `…/#ocala`
  - Each `parentOrganization: { "@id": ".../#organization" }`.
  - Fields per skill required-list: `@type:"Locksmith"`, `@id`, `name`, `url` (its location page), `telephone` (dashed), `email`, `priceRange:"$$"`, `paymentAccepted`, `currenciesAccepted:"USD"`, `hasMap` (CID), `logo`, `image`, `description`, `address` (that office), `geo` (verified lat/long), `contactPoint`, `sameAs` (that office's GBP), `aggregateRating` (that office's GBP numbers), `openingHoursSpecification` (grouped days, no false 24/7), `areaServed` (`AdministrativeArea` → `containsPlace` cities w/ **Wikipedia** `sameAs`), `hasOfferCatalog` (each service `name` + `description`).
  - Emitted on the respective **office location page**.

- **Service-area pages (11 non-office cities):** do **not** emit a `LocalBusiness` with a physical address (the office is in a different city — that's the current bug). Instead emit a **`Service`** node: `serviceType` = "Locksmith", `provider: { "@id": ".../#organization" }`, `areaServed: { "@type":"City", name, sameAs: <Wikipedia> }`, and reference the **nearest office** location node by `@id`. Keep the existing `BreadcrumbList`. (The two *office* cities keep their full `Locksmith` node per above.)

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

### 3. Address placement

- **Homepage / global pages:** Organization identity (no single street address presented as "the" business location); both offices surfaced in the footer (already ✓) and reachable via the two location pages.
- **Contact page:** show **both** office NAP blocks (currently one).
- **Each service-area / location page:** its nearest office's NAP in visible content and schema.

### 4. Titles/metas (targeted)

- Two office pages: `Locksmith in {City}, FL | Be Secure Locksmith`-style, primary-keyword-forward.
- Add **Ocala** to homepage, About, and service-page titles/metas that are currently Gainesville-only (balanced dual-city, natural phrasing).
- Standardize the ` | Be Secure Locksmith` suffix where missing; keep lengths within ~60 chars (title) / ~155 (meta).
- Leave the ~75 blog + already-localized service titles unchanged.

## Data intake (prerequisite — blocks the schema build)

Gathered up front via the skill's batched intake form. Required before writing the JSON-LD:

- **Per office:** verified `geo` (lat/long from Google Maps), **CID URL** (`…/maps/place/?cid=…` — we only have `kgmid`), exact **hours per day** (must match GBP), **email**, current **review count + star rating** (fresh from that GBP).
- **Combined** review count + rating for the homepage org node (or compute from the two).
- **Org:** `foundingDate` (YYYY-MM-DD, matches GBP), `legalName`, payment methods, logo URL, real photo URL for `image`.
- **Founder:** name, job title, 3–6 real `knowsAbout` specialties (see `references/knowsabout-taxonomy.md`).
- **Per office:** the service-area cities/counties it serves, with **Wikipedia** article URLs.
- **All `sameAs`** profile URLs (socials + directories) confirmed live.
- Confirm what the current `2551` count represents (single GBP vs combined) so per-location numbers are correct.

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

# Spec — Service-Area Page Template (+ Alachua, FL)

**Date:** 2026-06-29
**Status:** Approved design, ready for implementation planning
**Project:** Be Secure Locksmith (WordPress → Astro replatform)

## Summary

Build a **data-driven service-area page template** — a lean, conversion-focused local landing page — and seed it with the first city, **Alachua, FL** (`/service-areas/locksmith-alachua-fl/`). Each city is one data file feeding a dynamic Astro route, so the remaining 12 service-area pages follow by adding data. The design matches the live page's lean structure but cleaner and in our design system, with a place-themed hero distinct from the long-form service-page template.

## Goals

- A reusable, data-driven service-area template generating `/service-areas/locksmith-<city>-fl/` pages.
- Alachua built and live locally, matching the live page's content (cleaned up) and exact title/meta.
- Distinct from the service-page template (a place-themed local landing page, not a long-form article).
- Per-city phone via the locations model (Alachua → general number; Gainesville/Ocala/Lake City wire their tracking numbers when built).

## Non-goals (this spec)

- The other 12 service-area pages (template proven on Alachua; others are follow-on data files).
- The blog strip from the live page (blog isn't built; replaced by a services grid).
- A lead-capture form on the page (decision: Call/Book CTAs only; the contact form lives on the homepage).
- The `/service-areas/` index page (separate task).

## Decisions (from brainstorming)

- **Template richness:** match the live page, cleaner — a lean local landing page (not the rich multi-section variant, not the long service-page template).
- **Hero form:** none — Call + Book Now CTAs only.
- **Blog strip:** replaced with a "Our Locksmith Services" grid (the live blog/posts don't exist yet).
- **Data-driven:** content collection + dynamic route; Alachua seeded now.

## Live page facts (Alachua)

- URL: `https://besecurelocksmith.com/service-areas/locksmith-alachua-fl/`
- Title: `Locksmith Alachua, FL - Home, Car & Business Lockouts`
- Meta description: `Our mobile locksmiths cover Alachua, FL for home, car, and business lockouts, rekeys, and lock installs. Licensed, local, and fast. Get help today.`
- Live structure: hero (garbled H1 "Certified Locksmith Services in  Locksmith in Alachua, FL" + a quote form), one body section ("We're Your Local, Mobile Locksmith in Alucha, FL" — note the "Alucha" typo), a blog strip, footer.
- We clean the garbled H1 → "Locksmith in Alachua, FL" and fix the "Alucha" → "Alachua" typo. The body intro copy is pulled from the live page (verbatim, typo-corrected) at implementation time.

## Architecture

```
src/content/config.ts                       # add `serviceAreas` collection schema
src/content/service-areas/locksmith-alachua-fl.json   # Alachua data (seed)
src/pages/service-areas/[slug]/index.astro  # dynamic route via getStaticPaths()
src/components/sections/AreaHero.astro       # place-themed hero (new)
src/components/sections/LocalIntro.astro     # short local intro body (new, data-driven)
```

Reuses (unchanged): `BaseLayout` (title/description/canonical/robots/OG + LocalBusiness JSON-LD + head slot), `PromoBar`, `NavBar`, `Footer`, `StickyCallBar`, `ServicesGrid`, `Container`/`Section`/`Button`, the trust strip markup, and the white-accent CTA-card pattern (both currently inline in the commercial page — see "Shared bits" below).

### Content collection — `serviceAreas`

`type: 'data'`, schema:
- `slug: string` — the URL segment, e.g. `locksmith-alachua-fl` → `/service-areas/locksmith-alachua-fl/`.
- `city: string` — e.g. `Alachua`.
- `title: string` — exact `<title>`.
- `description: string` — meta description.
- `heroSubhead: string` — one-line hero subhead.
- `intro: string[]` — the local intro paragraph(s), verbatim-from-live + cleaned.
- `location: string` — locations-model slug for phone resolution (`main` for Alachua).
- `order: number`.

### Dynamic route

`src/pages/service-areas/[slug]/index.astro`:
- `getStaticPaths()` reads `getCollection('serviceAreas')` → returns `{ params: { slug }, props: { area } }` per city. With `trailingSlash: 'always'` + `build.format: 'directory'`, each builds to `/service-areas/<slug>/index.html`.
- Renders: BaseLayout (per-city `title`, `description`, `location`, canonical auto, `ogType: 'website'`) → PromoBar + NavBar → AreaHero → trust strip → LocalIntro → ServicesGrid → CTA card → Footer + StickyCallBar.
- Injects per-city `LocalBusiness` + `BreadcrumbList` JSON-LD via BaseLayout's head slot (Breadcrumb: Home / Service Areas (`/service-areas/`) / {city}).
- Phone resolved via `resolveLocation(area.location)` / `resolvePhone(...)`; every CTA + JSON-LD telephone uses it.

### New components

- **`AreaHero.astro`** — props `{ city, heroSubhead, phone, bookingUrl }`. Place-themed: breadcrumb, a "Service Area" + city pin badge/eyebrow, H1 `Locksmith in {city}, FL`, subhead, Call (resolved phone) + Book Now (Workiz, new tab) buttons. Brand-blue gradient family as the service-page hero but with a location/pin motif so it reads as a place page.
- **`LocalIntro.astro`** — props `{ city, intro }`. A heading like `Your Local, Mobile Locksmith in {city}, FL` + the `intro` paragraphs, in a readable column.

### Shared bits

The trust strip and the white/blue-accent CTA card currently live inline in `src/pages/services/commercial-locksmith/index.astro`. To avoid divergence, extract each into a small reusable component used by both the service page and the service-area template:
- `src/components/sections/TrustStrip.astro` — props `{ location }`; the confirmed-facts strip.
- `src/components/sections/CtaCard.astro` — props `{ location, heading, body? }`; the white card + blue accent + Call/Book buttons.
Refactor the commercial page to use these (no visual change) so both page types share one source.

## Booking / phone

- Book Now → the Workiz URL already used site-wide. Centralize it: add `site.bookingUrl` to `src/config/site.ts` and use it in `AreaHero`/`CtaCard` (and update the existing inline usages opportunistically). Phone via the locations model.

## SEO

- Exact live title + meta description per city.
- Canonical = the page URL (same-origin), via BaseLayout.
- `LocalBusiness` (resolved phone + NAP) and `BreadcrumbList` JSON-LD.
- Robots default (indexable).

## Testing

- `serviceareas-content.test.ts` — the `serviceAreas` collection has the Alachua entry with required fields (count ≥ 1; Alachua title/slug/location correct).
- `areahero.test.ts` — AreaHero renders H1 "Locksmith in Alachua, FL", breadcrumb, resolved Call link (`tel:3527065295`), Book Now → Workiz.
- `localintro.test.ts` — LocalIntro renders the heading with the city and the intro paragraph text.
- `truststrip.test.ts` / `ctacard.test.ts` — extracted components render the confirmed facts / Call+Book; commercial page still passes its existing tests after refactor.
- Route verification via build: after `npm run build`, `dist/service-areas/locksmith-alachua-fl/index.html` exists and contains "Locksmith in Alachua, FL", `tel:3527065295`, `"@type":"BreadcrumbList"`, and the exact `<title>`.
- Existing suite (homepage, commercial, contact) stays green; e2e unaffected.

## Success criteria

1. `/service-areas/locksmith-alachua-fl/` builds and renders: place-themed hero, trust strip, local intro, services grid, CTA, footer.
2. Exact live title + meta; canonical + LocalBusiness + BreadcrumbList JSON-LD present.
3. Garbled H1 and "Alucha" typo cleaned; intro copy otherwise faithful to live.
4. All CTAs + JSON-LD phone use the resolved location phone (Alachua = 352-706-5295).
5. Adding a new city = one data file (no template/code edits); the route generates its page.
6. TrustStrip + CtaCard are shared components; the commercial service page is refactored to use them with no visual change.
7. Full vitest suite + build green; e2e unaffected.

## Open items / future

- The remaining 12 service-area pages (data files; content pulled per live page). Gainesville/Ocala/Lake City set `location` to their own records (with tracking numbers) when those are added.
- The `/service-areas/` index page.
- Re-enable a blog strip on these pages once the blog is built.

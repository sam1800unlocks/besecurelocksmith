# Unified Service-Area Template — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending writing-plans)

## Goal

Collapse the two service-area page variants (`lean` Alachua / `rich` Hampton) into **one** data-driven service-area template, with a modular section stack. Keep the existing single service page template (`commercial-locksmith`) unchanged. Add a reusable `RelatedBlogs` module, rework the map to emphasize the service area + NAP, widen the body to match the service page, and pull exact live body content (including hyperlinks) for both cities.

## Architecture

- One dynamic route, `src/pages/service-areas/[slug]/index.astro`, renders every city from the `service-areas` content collection via `getStaticPaths`. No `variant` branching — every city gets the same module stack.
- Sections are independent, single-responsibility components composed by the route. Adding a city remains **one JSON data file**.
- `ServicesGrid` (the "service blocks" section) stays the single global component shared with the homepage — not forked.
- `RelatedBlogs` is a new global, reusable component fed by per-area data; usable on any page later.

## Module stack (top → bottom)

1. `PromoBar` + `NavBar` — global header (per-location phone routing preserved)
2. `AreaHero` — city H1, breadcrumb, red Call button + blue Book Now button
3. `TrustStrip`
4. **Area body** (`LocalIntro`, widened) — exact live content with hyperlinks
5. `ServicesGrid` — global service-blocks module
6. `RelatedBlogs` — new module, directly below the service blocks
7. `AreaMap` (reworked) — zoomed Google Maps embed + full NAP
8. `Faq` — localized, city-tailored, with FAQPage schema
9. `CtaCard`
10. `Footer` + `StickyCallBar`

**Removed from area pages:** `AreaStats` (at-a-glance band), `AreaNearby` (nearby-areas grid), and `Reviews`. The `AreaStats.astro` and `AreaNearby.astro` components and their tests are deleted. `Reviews.astro` stays in the repo (the homepage still uses it); it is simply not rendered on area pages.

## Area body width + typography

- `LocalIntro` body container widens from `max-w-[820px]` to `max-w-[1180px]` to match the service page (`commercial-locksmith`) article body.
- Typography aligns with the service page article body (same heading/paragraph/list/link styling). Hyperlinks from the live content are preserved and styled (underlined, brand blue).

## Data model — `service-areas` collection (`src/content/config.ts`)

Remove:
- `variant` (no longer branching)
- `neighborhoods` (only fed the removed `AreaNearby`)

Keep:
- `slug`, `city`, `title`, `description`, `heroSubhead`, `intro` (HTML blocks), `location`, `order`
- `office` (`gainesville` | `ocala`), `responseTime` — feed `AreaMap` + localized FAQs
- `county`, `zips` — feed localized FAQs

Add:
- `relatedBlogs: z.array(z.object({ title: z.string(), url: z.string() })).default([])`

## RelatedBlogs component (`src/components/sections/RelatedBlogs.astro`)

- **Props:** `{ posts: { title: string; url: string }[]; city?: string; heading?: string }`
- **Behavior:** renders nothing when `posts` is empty. Otherwise a responsive card grid; each card shows the post title and a "Read article →" affordance, linking to the post `url`.
- **Links:** absolute live URLs (`https://besecurelocksmith.com/...`) for now, `target="_blank" rel="noopener noreferrer"`. Post-cutover these can become relative internal paths with no template change.
- **Content:** 3 real live blog posts curated per city, stored in each city's `relatedBlogs` data (titles + URLs pulled from the live blog / post sitemap).
- **Heading:** defaults to something like "Locksmith tips & guides" when not provided.

## AreaMap rework (`src/components/sections/AreaMap.astro`)

- Heading reframed to the service area, e.g. "Our {city} Service Area".
- Google Maps **iframe embed** (no API key, no cost) centered on `{city}, FL`, zoomed out (≈ z=11) so coverage reads as an area rather than a pin. Keep the "View on Google" GBP overlay link.
- Alongside the map, a **NAP** block: business **N**ame, office **A**ddress (`{office.street}` / `{office.cityStateZip}`), **P**hone as a red Call button, plus a "Serving {city} and surrounding areas — typically on-site in {responseTime}" note.
- A true drawn radius circle is intentionally out of scope (would require a Maps API key + billing); the zoomed embed + copy conveys the service area.

## Localized FAQs + schema

- `buildAreaFaqs(area, officeCity)` continues to generate 3–5 city-interpolated FAQs (including the response-time / emergency question). Rendered on every area page via `Faq`, which already emits `FAQPage` JSON-LD.
- Fix: `buildAreaFaqs` reads the license from `site.license` instead of the hardcoded `#HCLO18005`.

## SEO / structured data

Each area page emits exactly: `LocalBusiness` + `BreadcrumbList` (route head) + `FAQPage` (Faq component). `BaseLayout`'s `localBusiness` opt-out stays `false` on this route to avoid a duplicate LocalBusiness.

## Content extraction

Re-crawl the live Alachua and Hampton pages with `curl` + a browser User-Agent (the CDN 403s plain server fetches). Extract body content blocks (`p`, `h2`, `h3`, `ul`, `ol`, including nested `<a>` anchors) into each city's `intro` array, preserving hyperlinks verbatim. Curly apostrophes (U+2019) must be written via `json.dump(..., ensure_ascii=False)` and verified.

## Testing

- Update `collection.test.ts` / schema tests: drop `variant` assertions; assert `relatedBlogs` shape.
- Replace `schema-variant.test.ts` and `hampton-data.test.ts` variant assertions with single-template assertions.
- Delete `areastats.test.ts` and `areanearby.test.ts`.
- Add a `RelatedBlogs` render test: renders cards for posts, renders nothing when empty.
- Update `areamap.test.ts` for the NAP block + reframed heading.
- `page.test.ts` / `page-hampton.test.ts`: assert the unified stack (body @1180px present, ServicesGrid, RelatedBlogs, AreaMap NAP, FAQ schema), and that the dropped modules are absent.
- `area-faqs.test.ts`: assert license comes from `site.license`.

## Out of scope

- Migrating the blog (76 posts) — `RelatedBlogs` links out to live posts for now.
- A drawn map radius circle (needs Maps API key + billing).
- Building the other service pages / remaining cities (tracked separately).

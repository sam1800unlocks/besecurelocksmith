# Spec — Hyperlocal Service-Area Variant (+ Hampton, FL)

**Date:** 2026-06-29
**Status:** Approved design, ready for implementation planning
**Project:** Be Secure Locksmith (WordPress → Astro replatform)

## Summary

Add a **rich, hyperlocal `variant`** to the existing data-driven service-area template and build it on **Hampton, FL** (`/service-areas/locksmith-hampton-fl/`), so it can be compared side-by-side with the existing lean **Alachua** page. A per-city `variant` flag (`lean` | `rich`) drives which layout the shared `[slug]` route renders. Hampton's body content is migrated verbatim from the live page **with its inline service-page hyperlinks** preserved. New sections (stats, coverage map + nearest office, neighborhoods/nearby cross-links, local reviews, area FAQ) are auto-derived from light per-city facts; specific local details stay optional.

## Goals

- A `rich` service-area layout that's a proper hyperlocal local-landing page, distinct from the lean one.
- Both layouts live simultaneously for comparison (Alachua = lean, Hampton = rich) via a `variant` flag.
- Hampton's live body content reproduced faithfully, **including inline hyperlinks** (relativized to same-origin).
- Hyperlocal facts auto-derived (county, ZIPs, nearest office, response time, nearby-area cross-links, city-interpolated FAQ); hand-curated specifics (neighborhoods) optional.
- No regression to the lean Alachua page or any existing page.

## Non-goals (this spec)

- Converting the other cities to `rich` (decided after the Alachua-vs-Hampton comparison).
- Hand-written neighborhoods/landmarks (optional field, left empty unless provided).
- City-specific reviews (reuse the general 5, framed neutrally).
- The `/service-areas/` index page.

## Decisions (from brainstorming)

- Build the rich version on **Hampton** (keep Alachua lean) for comparison → a `variant` flag, not a fork.
- Include **all four** hyperlocal element groups: coverage map + nearest office; neighborhoods & nearby areas; local "at a glance" stats; local reviews + area FAQ.
- **Auto-derive facts + optional local fields:** verifiable facts auto-filled (county, ZIPs, nearest office + response time, nearby-area cross-links from the collection) + city-interpolated FAQ; `neighborhoods` optional; reviews reuse the general 5.
- Pull Hampton's live body **with hyperlinks** (relativized).

## Architecture

```
src/config/site.ts OR src/config/offices.ts   # centralize the two physical offices (shared source)
src/content/config.ts                          # extend serviceAreas schema (variant, county, zips, office, responseTime, neighborhoods)
src/content/service-areas/locksmith-hampton-fl.json   # Hampton data (variant: 'rich', live body w/ links)
src/content/service-areas/locksmith-alachua-fl.json   # add variant: 'lean'
src/lib/area-faqs.ts                           # buildAreaFaqs(area) -> city-interpolated FAQ[]
src/components/sections/AreaStats.astro        # new — "at a glance" stat cards
src/components/sections/AreaMap.astro          # new — coverage map + nearest office panel
src/components/sections/AreaNearby.astro       # new — neighborhood chips + nearby-area cross-links
src/components/sections/LocalIntro.astro       # modify — render intro as HTML (set:html) for inline links
src/pages/service-areas/[slug]/index.astro     # branch on area.variant (lean vs rich)
src/components/sections/ServiceAreas.astro     # refactor to use the centralized offices config
```

Reuses unchanged: `BaseLayout`, `PromoBar`, `NavBar`, `AreaHero`, `TrustStrip`, `CtaCard`, `ServicesGrid`, `Reviews` (accepts injected reviews), `Faq` (accepts injected faqs), `Footer`, `StickyCallBar`, `Container`/`Section`/`Button`, `resolveLocation`/`resolvePhone`, `site`.

### Collection schema additions (`serviceAreas`)

Add to the existing schema (all optional except `variant` which defaults):
- `variant: z.enum(['lean','rich']).default('lean')`
- `county: z.string().optional()`
- `zips: z.array(z.string()).default([])`
- `office: z.enum(['gainesville','ocala']).default('gainesville')` — which branch serves the city (for the map + nearest-office panel)
- `responseTime: z.string().default('~30 min')`
- `neighborhoods: z.array(z.string()).default([])` — optional hand-curated local areas/landmarks
- `intro` becomes HTML-capable: still `z.array(z.string())`, but each string MAY contain inline `<a>` links (rendered via `set:html`).

### Centralized offices

Extract the two physical offices (currently inline in `ServiceAreas.astro`) into a shared config (`src/config/offices.ts`, or an `offices` export on `site`). Shape per office: `{ key, label, street, cityStateZip, phone, mapQuery, gbp }` (gbp = the kgmid Google Business Profile URL). Values:
- `gainesville`: 901 NW 8th Ave. C17, Gainesville, FL 32601 · 352-706-5295 · gbp `https://www.google.com/search?kgmid=/g/1ptx2pkfg`
- `ocala`: 217 SE 1st Ave. Suite 200-50, Ocala, FL 34471 · 352-325-7953 · gbp `https://www.google.com/search?kgmid=/g/1yfprvxjj`
Refactor `ServiceAreas.astro` to consume this (behavior-preserving) and have `AreaMap` use `offices[area.office]`.

### Route branching (`[slug]/index.astro`)

`getStaticPaths()` unchanged (maps the whole collection). In the page body, branch on `area.variant`:
- `lean`: AreaHero → TrustStrip → LocalIntro → ServicesGrid → CtaCard (current layout).
- `rich`: AreaHero → TrustStrip → LocalIntro → **AreaStats** → ServicesGrid → **AreaMap** → **AreaNearby** → **Reviews** (framed "What customers say") → **Faq** (city FAQs) → CtaCard.
JSON-LD: both variants keep LocalBusiness + BreadcrumbList; the rich variant additionally gets FAQPage from the Faq component (it already emits it). (Note: address the duplicate-LocalBusiness item from the prior spec's follow-up while here — see Open items.)

### New components

- **`AreaStats.astro`** — props `{ area }`. A responsive row of stat cards built from auto-derived facts: County (`area.county`), ZIPs served (`area.zips` joined), typical response (`area.responseTime`), "Since 2012", "★4.9 / 2,551 reviews". Cards hide individually if their datum is empty.
- **`AreaMap.astro`** — props `{ area }`. A Google map centered on the city (`mapQuery = "{city}, FL"`) + a panel: "Served from our {office.label} office — typically on-site in {responseTime}", office address, a Call button (office phone via `telHref`), and the map links to the office's `gbp` (kgmid) in a new tab — same click-through + "View on Google" affordance as the homepage `ServiceAreas`.
- **`AreaNearby.astro`** — props `{ area, nearby }`. Renders `area.neighborhoods` as chips (only if non-empty) under a "Neighborhoods we serve in {city}" heading, and a "Nearby areas we serve" set of chips linking to other service-area pages (`nearby` = other `serviceAreas` entries, computed in the route, excluding self). The whole section hides if both lists are empty.

### `buildAreaFaqs(area)` (`src/lib/area-faqs.ts`)

Pure function → `{ question, answer }[]` interpolating `area.city`, `area.county`, `area.zips`, `area.responseTime`, and the serving office city. Fixed, factual set, e.g.:
- "How fast can you reach {city}, FL?" → "Our mobile locksmiths typically reach {city} in about {responseTime} from our {officeCity} office."
- "Do you serve all of {city}?" → "Yes — we cover {city} and the surrounding {county} area" + (if zips) ", including ZIP codes {zips}.".
- "What locksmith services do you offer in {city}?" → "Residential, commercial, and automotive locksmith service — lockouts, rekeying, new lock installation, key replacement, and more."
- "Are your locksmiths licensed and insured?" → standard (license #HCLO18005).
The `Faq` component renders these and emits FAQPage JSON-LD.

### LocalIntro change

Render each `intro` entry with `set:html` (instead of `{p}`) so inline `<a>` links render. Add a scoped/global rule so prose links inside the intro are styled (primary, underlined) — matching the service-page convention. Alachua's plain-text intro is unaffected.

## Hampton data (seed, `variant: 'rich'`)

- `title`: `Locksmith Hampton, FL - Home, Car & Business Lockouts` (exact, live)
- `description`: `Need fast lock help in Hampton, FL? Our licensed mobile team covers home, car, and business lockouts, rekeys, and installs with local response. Get help.` (exact, live)
- `intro`: the live Hampton body — the "Expert Locksmith Services in Hampton, FL" paragraphs (and the emergency-lockout list), **verbatim**, with inline links to service pages preserved and **relativized** (`https://besecurelocksmith.com` → ``). Pulled at implementation from `.superpowers/crawl/area-hampton.html`.
- `heroSubhead`: clean one-liner (e.g., "Licensed mobile locksmith for homes, cars, and businesses across Hampton, FL.")
- auto facts: `county: "Bradford County"`, `zips: ["32044"]`, `office: "gainesville"`, `responseTime: "~30 min"`, `location: "main"`, `variant: "rich"`, `order: 2`. `neighborhoods: []` (optional, empty).

(Alachua entry: add `variant: "lean"` and, optionally, `county`/`zips`/`office` for completeness — but it renders lean regardless.)

## SEO

- Exact per-city title + meta; canonical via BaseLayout.
- LocalBusiness + BreadcrumbList JSON-LD on both variants; FAQPage on rich (via Faq).
- Body links relativized so they resolve same-origin.

## Testing

- `area-faqs.test.ts` — `buildAreaFaqs` interpolates city/county/zips/responseTime; returns the fixed set; no `undefined` leaks when optional facts are empty.
- `areastats.test.ts` — renders county/zips/response/rating; hides a card when its datum is empty.
- `areamap.test.ts` — renders the city map query, the serving office address + Call (office phone), and the gbp/kgmid link.
- `areanearby.test.ts` — renders neighborhood chips when provided; renders nearby cross-link chips; hides entirely when both empty.
- `localintro.test.ts` (update) — an intro entry containing an `<a>` renders a real anchor (not escaped text).
- `offices.test.ts` — the centralized offices export has gainesville + ocala with phone + gbp; `ServiceAreas.astro` still renders both office addresses after refactor (build grep).
- Route via build: `dist/service-areas/locksmith-hampton-fl/index.html` exists and contains the exact title, "Locksmith in Hampton, FL" (hero H1), a relativized service link (e.g. `href="/services/emergency-lockouts/"` with NO `besecurelocksmith.com` host), the stats (Bradford County, 32044), the city map query, "@type":"FAQPage", BreadcrumbList; and `dist/service-areas/locksmith-alachua-fl/index.html` still renders the lean layout (no AreaStats/AreaMap markers).
- Existing suite (homepage, commercial, contact, Alachua) stays green; e2e unaffected.

## Success criteria

1. `/service-areas/locksmith-hampton-fl/` builds with the rich layout (hero, trust, intro w/ working inline links, stats, services, coverage map + nearest office, neighborhoods/nearby, reviews, area FAQ, CTA).
2. `/service-areas/locksmith-alachua-fl/` is unchanged (lean) — they're directly comparable.
3. Hampton body + inline service links are faithful to live and resolve same-origin.
4. Stats/map/FAQ are auto-derived from the data; `neighborhoods` empty → that block hidden; nearby cross-links derive from the collection.
5. All phones resolved (Hampton = main/352-706-5295; office panel shows the serving office's number); Book Now → site.bookingUrl.
6. Adding a city + choosing its variant = data only (no route/code edits).
7. Offices centralized; `ServiceAreas.astro` refactored with no visual change.
8. Full vitest suite + build green; e2e unaffected.

## Open items / future

- After comparison, pick lean vs rich as the default and converge the other cities.
- Dedupe the two `LocalBusiness` JSON-LD (BaseLayout default + route injection) via a BaseLayout opt-out prop — fold in while editing the route here.
- Other 11 service-area cities (data files); Gainesville/Ocala/Lake City wire their tracking-number location records.
- Optional: hand-curated `neighborhoods` per city; city-specific reviews.

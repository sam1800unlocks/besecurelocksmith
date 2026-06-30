# Service-Areas Index (`/service-areas/`) — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending build)

## Goal

Build the `/service-areas/` hub page: a regional intro, a grid of all 13 city pages grouped by region, a list of additional nearby towns we serve (no dedicated page), and the office maps.

## Route

`src/pages/service-areas/index.astro` → `/service-areas/`. Coexists with the existing `[slug]/index.astro`. Global header/footer, `location='main'`.

## Section stack

1. **Hero** — gradient hero: breadcrumb (Home / Service Areas), H1 **"Our Locksmith Service Areas"**, subhead from the live description, red Call + blue Book.
2. **TrustStrip.**
3. **Intro** — H2 "Professional Mobile Locksmith Service For the Gainesville, FL Region" + the live paragraphs (verbatim): the "We serve Gainesville, Ocala, and the surrounding areas, including …" sentence and "Note: If you don't see your location below, please call to inquire about service."
4. **City grid (13 pages, linked), grouped by region** — data-driven from the `service-areas` collection, split by each city's `office`:
   - **Gainesville Area:** Alachua, Gainesville, Hampton, High Springs, Lake City, Newberry, Williston.
   - **Ocala Area:** Belleview, Marion Oaks, Ocala, Silver Springs, Silver Springs Shores, The Villages.
   Each card: pin icon + "Locksmith in {City}, FL →" linking to `/service-areas/{slug}/`. Adding a city auto-appears.
5. **Also serving nearby (no dedicated page)** — curated chips, grouped by region (from the Google Business Profile service areas):
   - **Gainesville Area:** La Crosse, Waldo, Archer, Starke, Bronson, Brooker, Trenton, Micanopy, Hawthorne, Fort White, Jonesville.
   - **Ocala Area:** Leesburg, Wildwood, Dunnellon, Inverness, Fort McCoy, Summerfield, Beverly Hills.
   Plain non-linked chips with a short "Don't see your town? Call — we likely cover it." note.
6. **Office maps** — reuse `ServiceAreas` (both offices, embedded maps + NAP).
7. **CTA** (Call/Book) → Footer + StickyCallBar.

## Data

- City grid: `getCollection('service-areas')`, sorted by city, partitioned by `office`.
- Nearby towns: a `nearbyAreas = { gainesville: string[]; ocala: string[] }` const in the page.

## SEO / structured data

- **Title** (verbatim live): `Locksmith Service Areas - Gainesville & Ocala, FL Pros`
- **Description** (verbatim live): `See where our mobile locksmiths work across Gainesville, Ocala, and North Central FL. Home, car, and business lock service near you. Find your area today.`
- JSON-LD: `BreadcrumbList` (Home → Service Areas) + an `ItemList` of the 13 city pages. `BaseLayout` default emits the single `LocalBusiness`.

## Testing

- **Build test:** `/service-areas/index.html` has the verbatim `<title>`, H1 "Our Locksmith Service Areas", the regional group headings, links to all 13 city pages (e.g., Alachua + Ocala + Lake City), the nearby chips (e.g., "Archer", "Dunnellon"), the office-maps section, `BreadcrumbList` + `ItemList`, and one `LocalBusiness`.

## Out of scope

- Pages for the nearby towns (listed only).

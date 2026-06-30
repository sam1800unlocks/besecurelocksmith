# Remaining Service-Area Pages — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending build)

## Goal

Build the remaining service-area pages on the existing unified template, pulling exact live content (body, images, captions, hyperlinks) per city. Skip the 3 tracking-number cities until their numbers are supplied.

## Scope

**Build now (8):** Belleview, High Springs, Marion Oaks (Ocala), Newberry, Silver Springs, Silver Springs Shores (Ocala), The Villages, Williston.

**Skip for now (3 — need their own tracking phone numbers):** Gainesville, Ocala, Lake City. When supplied, add `location` records and set each page's `location`; everything else is ready.

(Alachua + Hampton already done = 13 total in the sitemap.)

## Per-city curated facts

| City | slug | county | office | zips |
|------|------|--------|--------|------|
| Belleview | locksmith-belleview-fl | Marion County | ocala | 34420, 34421 |
| High Springs | locksmith-high-springs-fl | Alachua County | gainesville | 32643 |
| Marion Oaks | locksmith-marion-oaks-ocala-fl | Marion County | ocala | 34473 |
| Newberry | locksmith-newberry-fl | Alachua County | gainesville | 32669 |
| Silver Springs | locksmith-silver-springs-fl | Marion County | ocala | 34488, 34489 |
| Silver Springs Shores | locksmith-silver-springs-shores-ocala-fl | Marion County | ocala | 34472 |
| The Villages | locksmith-the-villages-fl | Sumter County | ocala | 32159, 32162, 32163 |
| Williston | locksmith-williston-fl | Levy County | gainesville | 32696 |

`responseTime` = `~30 min`; `location` = `main` (general number); `order` continues 3..10.

## Content extraction (per city)

Crawl each live page (curl + browser UA). Extract:
- **title / description** — verbatim from live meta.
- **heroSubhead** — `Fast, licensed mobile locksmith service for homes, cars, and businesses across {City}, FL.`
- **intro** — the live body blocks (`p/h2/h3/ul/ol` + `<figure class="area-figure alignright">` images with `<figcaption>` captions), inline `<a>` links **relativized** (`https://besecurelocksmith.com/x/` → `/x/`), curly punctuation preserved (`json.dump(..., ensure_ascii=False)`). Exclude site furniture. Body/featured images downloaded + optimized into `public/img/service-areas/<city>/`.

## relatedBlogs (city-relevant)

From the 76 migrated blog posts (`src/content/blog/*.json`), pick up to 3 whose slug/title contains the city name; fall back to 3 general posts. Each entry `{ title, url: '/blog/<slug>/', image }` (internal links + local images, since posts now have internal pages). Also update Alachua + Hampton `relatedBlogs` to internal `/blog/<slug>/` for consistency (their posts are now internal).

## Footer

Add **Marion Oaks** and **Silver Springs Shores** to `serviceAreas` in `src/config/site.ts` (footer city chips) so all 13 are linked. Keep the 3 skipped cities' chips as they are (they already link to pages that don't exist yet — acceptable, or omit; see note). NOTE: Gainesville/Ocala chips already exist in the footer but their pages aren't built yet — they'll 404 until built. Flag, don't change wording.

## Testing

- **Collection:** each new city JSON validates (required fields, `office` enum, non-empty `intro`, `relatedBlogs` internal `/blog/` urls).
- **Build:** a sampling of new pages (e.g., Newberry, The Villages) build with the verbatim `<title>`, AreaHero H1 `Locksmith in {City}, FL`, the unified stack (ServicesGrid, RelatedBlogs, AreaMap "Our {City} Service Area", FAQPage), one `LocalBusiness`, and a relativized inline service link in the body.
- **Footer:** renders Marion Oaks + Silver Springs Shores chips.

## Out of scope

- Gainesville, Ocala, Lake City pages (await tracking numbers).
- A `/service-areas/` index page (separate follow-up).

# Spec 1 — Locksmith Design-System Foundation + Be Secure Homepage

**Date:** 2026-06-28
**Status:** Approved design, ready for implementation planning
**Owner:** The Locksmith Agency (sam@thelocksmithagency.com)

## Summary

Replatform **Be Secure Locksmith** (`besecurelocksmith.com`) from WordPress to **Astro + Tailwind**, running locally, modernized to match the new homepage design provided in `Be Secure Locksmith Homepage.zip`. Underneath the site, build a **reusable locksmith design system** (tokens + primitive components + section components) so future locksmith client sites are fast to spin up.

This is the first of several specs. **This spec covers only the design-system foundation and the homepage**, proven end-to-end as a vertical slice. Service pages, service-area pages, about/contact, and the blog are follow-on specs that reuse this foundation.

## Goals

- A working, locally-running, modernized Be Secure homepage.
- A reusable token + component foundation that future locksmith sites re-skin by editing configuration, not markup.
- Per-location header/footer/phone resolution baked into the architecture from day one (not retrofitted).
- Pull existing WordPress content/components forward and improve them, rather than inventing new content.

## Non-goals (this spec)

- Service pages, service-area landing pages, about/contact pages, blog — deferred to follow-on specs.
- A headless CMS or client self-service editing — content lives in the repo for now.
- Multi-client theming proven across more than one brand — the system is *designed* for reuse, but only Be Secure is built here.

## Source material

- `Be Secure Locksmith Homepage.zip` — the new homepage design. Contains:
  - `Be Secure Locksmith Homepage.dc.html` — a React-runtime template with data bindings (`{{ }}`, `sc-for`). 16 labeled sections **A–P**: Promo Banner, Top Nav, Hero, As Seen In, Why Choose, Services Grid, Property Management Band, PM Client Logo Wall, Conversion Band, Reviews, Credentials, Businesses Worked With, FAQ, Service Areas, Footer, Sticky Call Bar (mobile).
  - `support.js` — the `dc-runtime` renderer (reference only; **not** carried into the Astro build).
  - `.thumbnail` — a WebP render of the intended homepage design.
- The new design is the modernization north star. Existing WP components are pulled forward and improved to match this cleaner aesthetic — not a pixel-for-pixel copy of either source.

## Decisions (from brainstorming)

- **End goal:** reusable system to spin up locksmith client sites fast; Be Secure is the pilot.
- **Tech:** Astro + Tailwind, static output, zero client JS by default.
- **Design direction:** modernize and clean up; reuse existing components where good, improve the rest.
- **Content model:** migrate existing WP content into the repo (typed config + content collections); run locally.
- **Build approach:** Design-system-first vertical slice (Approach A) — foundation, then homepage.
- **Header/footer/phone:** per-location, same structure, data-driven (see Architecture).

## Architecture

Fresh Astro project. Static marketing pages — zero JS by default. Small client scripts only where genuinely interactive: mobile drawer nav, FAQ accordion, sticky call bar.

```
src/
  styles/tokens.css         # CSS variables: color, type, spacing, radius, shadow
  config/site.ts            # global brand defaults: name, logo, socials, defaultPhone, license, social URLs
  content/
    locations/              # per-location records (typed) — see Location model
    services/               # service entries (typed) — used by Services Grid now, service pages later
    reviews/                # review entries (typed)
    faqs/                   # FAQ entries (typed)
  components/
    primitives/             # Button, Badge, Card, Stars, Container, Section, Icon
    sections/               # PromoBar, NavBar, Hero, AsSeenIn, WhyChoose, ServicesGrid,
                            #   PropertyManagement, LogoWall, ConversionBand, Reviews,
                            #   Credentials, BusinessesWorkedWith, Faq, ServiceAreas, Footer, StickyCallBar
  layouts/
    BaseLayout.astro        # <head>, fonts, schema.org JSON-LD, resolves location, renders header region (PromoBar + NavBar) + Footer
  pages/
    index.astro             # homepage, declares location: "main", assembled from section components
public/                     # migrated images, logo, favicons
```

### Per-location resolution (core architectural requirement)

The client has unique headers/footers and **location-specific phone numbers** per page. Modeled as one structure, data-driven. The phone-routed "locations" correspond to three real service-area URLs on the live site:
`/service-areas/locksmith-gainesville-fl/`, `/service-areas/locksmith-ocala-fl/`, `/service-areas/locksmith-lake-city-fl/`.

- **Location model** (`content/locations/*`), typed via a content-collection schema:
  - `slug` — one of `main`, `gainesville`, `ocala`, `lake-city`
  - `phone` — the location's own tracking number (display + `tel:`). Gainesville, Ocala, and Lake City each have a distinct number; `main` uses the general site number `352-706-5295`
  - `city`, optional `region`
  - `nap` — name, address, hours
  - `serviceAreaLinks` — the area links shown in that location's header/footer
- **Page → location mapping:** each page declares `location` in frontmatter (homepage and all non-location pages use `"main"`, which carries the general number `352-706-5295`). Only the Gainesville, Ocala, and Lake City service-area pages override with their own tracking numbers; the other 10 service-area pages use `main`.
- **Scope note:** in *this* spec only the resolution mechanism + the four location records (data) are built and exercised by the homepage (`main`). The service-area landing *pages* that consume `gainesville`/`ocala`/`lake-city` are a follow-on spec.
- **`BaseLayout`** takes a `location` prop, loads the matching record, and feeds the header region (`PromoBar` + `NavBar`) and `Footer` with that record's data. ("Header" throughout this spec = the `PromoBar` + `NavBar` pair.)
- **Phone resolution:** `location.phone ?? site.defaultPhone`. Every phone touchpoint — promo bar, nav CTA, hero CTA, sticky call bar, footer, and `LocalBusiness` JSON-LD — reads the **resolved** phone, so a location page never leaks the main number.
- The header region and Footer are **the same components everywhere**; only their data changes per location.

## URL preservation & complete inventory (project-wide, non-negotiable)

This is a replatform, not a redesign of the information architecture. **Every existing URL must be rebuilt at its exact path, and no page or post may be missed.** Changing slugs or dropping pages would forfeit existing SEO rankings and create 404s.

- **Authoritative inventory:** captured from the live Rank Math sitemaps into `docs/migration/url-manifest.md` — a 117-URL checklist (the source sitemaps are committed alongside it). The `/locations` sitemap is **excluded** per client instruction; those are covered by the data-driven location/phone model instead.
- **Inventory breakdown:** 40 pages + 77 posts.
  - 8 standalone pages: `/`, `/about/`, `/contact-us/`, `/employment/`, `/price-list/`, `/privacy-policy/`, `/schedule-an-appointment/`, `/testimonials/`
  - `/services/` index + 17 service pages
  - `/service-areas/` index + 13 service-area pages (3 phone-routed: Gainesville, Ocala, Lake City)
  - `/blog/` index + 76 blog posts
- **Trailing slashes:** every live URL ends in `/`. Astro must be configured `trailingSlash: 'always'` with `build.format: 'directory'` so output paths match exactly. This is set in the foundation (this spec) so every later page inherits it.
- **Completeness is verified, not assumed:** a follow-on validation step diffs built routes against `url-manifest.md`; the migration is not "done" until every entry is checked off. Any intentional drop or change is recorded explicitly (no silent omissions).
- **This spec's slice of the inventory:** only the homepage (`/`). The remaining 116 URLs are built in follow-on specs but are documented here so the foundation (routing config, trailing-slash policy, location model, shared sections) is built to serve all of them.

## Design tokens (extracted from the zip)

Exposed as CSS variables in `tokens.css` and mapped into the Tailwind theme, so a future client re-skins by editing one token layer.

- **Color**
  - Primary `#0064e0`, primary-hover `#0457cb`
  - Ink `#0a1317`, body text `#1c1e21`, secondary text `#444950`
  - Muted `#5d6c7b`, `#8595a4`
  - Borders `#dee3e9`, `#ced0d4`, `#e7ebf0`
  - Surfaces `#ffffff`, `#f1f4f7`, `#f7b928` (amber, review stars)
  - Success `#31a24c` / `#1f7a36`, success-bg `#eaf7ee`
  - Alert `#f0284a`; link-on-dark `#7fb4ff`
- **Type:** Figtree (display/headings, weights 300–800) + Inter (body fallback), loaded via Google Fonts `preconnect`. Type scale derived from the homepage.
- **Spacing / radius / shadow:** derived from the zip's inline styles — pill-shaped buttons, 64px nav height, rounded cards, soft shadows. Captured as tokens, not magic numbers.

## Component layers

- **Primitives** (cross-client design-system core; dumb and reusable): `Button` (primary / ghost / pill), `Badge`, `Card`, `Stars`, `Container`, `Section`, `Icon`.
- **Sections** (homepage compositions): each labeled section A–P becomes one `.astro` component fed by props/content. Modernized from the zip; improved with the better of the existing WP equivalents where applicable.

## Content migration

- **Primary path:** crawl `besecurelocksmith.com` via Claude-in-Chrome (the user's browser session bypasses the CDN's 403 that blocks server-side fetches). Extract homepage copy, services, reviews, credentials, service areas, and image URLs.
- **Images:** download into `public/`, render through Astro's `<Image>` for optimization.
- **Fallback** (if the browser extension stays unavailable): a WordPress export (WXR XML + media zip) provided by the user.
- Content lands in typed content collections and `config/site.ts`, not hardcoded in markup.

## Quality bar

- **Performance:** zero-JS-default, optimized images, semantic HTML. Lighthouse-minded.
- **SEO/structured data:** `LocalBusiness` JSON-LD (per resolved location) and `FAQPage` JSON-LD on the homepage.
- **Responsive:** parity with the zip's `880px` mobile breakpoint — drawer nav + sticky call bar appear on mobile.
- **Accessibility:** real focus states, aria labels on icon links, checked color contrast, keyboard-operable accordion and drawer.

## Success criteria

1. `npm run dev` serves a modernized Be Secure homepage locally that visually reflects the zip design.
2. All homepage content is real, migrated content — no lorem ipsum.
3. Design tokens live in one editable layer; no hardcoded hex values in section components.
4. Header, footer, and every phone touchpoint resolve from the page's `location` record; changing `location` swaps phone + NAP + area links with no markup changes.
5. Primitives and sections are separate, documented, and reusable by a future client build.
6. Page passes basic accessibility (focus, labels, contrast) and includes `LocalBusiness` + `FAQPage` JSON-LD.

## Follow-on specs (decomposition of the remaining 116 URLs)

Each reuses this foundation (tokens, primitives, shared sections, routing config, location/phone model):

- **Spec 2 — Service pages:** `/services/` index + 17 service pages.
- **Spec 3 — Service-area pages:** `/service-areas/` index + 13 area pages, consuming the location/phone model (Gainesville/Ocala/Lake City tracking numbers).
- **Spec 4 — Blog:** `/blog/` index + 76 posts migrated to MDX content collections.
- **Spec 5 — Standalone pages:** about, contact-us, price-list, employment, privacy-policy, schedule-an-appointment, testimonials.
- **Spec 6 — Cutover & SEO parity:** route-vs-manifest completeness check, redirects (if any), sitemap.xml + robots.txt generation, structured-data audit, before/after Lighthouse.
- Later: proving the design system re-skins for a second locksmith brand.

## Open items

- Three location tracking phone numbers (Gainesville, Ocala, Lake City) — needed at build time, not for planning.
- Live-site content/image crawl mechanism: Claude-in-Chrome (extension not yet connected) or a WordPress export fallback.

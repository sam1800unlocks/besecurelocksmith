# About Page (`/about/`) — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending build)

## Goal

Rebuild the `/about/` page on the design system, pulling the live content: mission, the team (Joe + 11), credentials, and reviews.

## Route

`src/pages/about/index.astro` → `/about/`. Global header/footer, `location='main'`.

## Section stack

1. **Hero** — gradient: breadcrumb (Home / About), H1 **"About Be Secure Locksmith"**, subhead from the live description, red Call + blue Book.
2. **TrustStrip.**
3. **Our Mission** — the verbatim live mission copy ("Since 2012… locally owned and managed…") in a readable column, alongside a card for **Joe — General Manager** (photo + name + role).
4. **Meet the Team** — H2 "Meet the Be Secure Locksmith Team" + a responsive grid of the **11 members**, each a card with photo, name, role. Data-driven from a `team` array; photos pulled from live + optimized into `public/img/team/`. Roles: Britney — Commercial Relationship Manager; Emily — Customer Service Rep; Courtney — Dispatcher; Laura — Accounts Receivable; Remington/Ethan/Elijah/John/Bill/Dillon/Kobi — Technician.
5. **Credentials** — reuse the existing `Credentials` component (ALOA / BNI / 1-800-Unlocks / Fair Trade / Chamber).
6. **Reviews** — reuse the existing `Reviews` component.
7. **CTA** (Call/Book) → Footer + StickyCallBar.

## Data

- `team`: array of `{ name, role, photo }` (inline in the page). Joe rendered in the Mission section; the other 11 in the grid.
- Team photos downloaded to `public/img/team/<name>.<ext>` and optimized (new `['team', 600]` cap in `scripts/optimize-images.mjs`).

## SEO / structured data

- **Title** (verbatim live): `About Our Gainesville, FL Locksmith Team - Local Pros`
- **Description** (verbatim live): `Meet the team behind Gainesville's most-reviewed locksmith. Licensed, mobile, and rated 4.9 stars by 1,300+ local clients. See why neighbors trust us today.`
- JSON-LD: `BreadcrumbList` (Home → About) + an `AboutPage`. `BaseLayout` default emits the single `LocalBusiness`.

## Testing

- **Build test:** `/about/index.html` has the verbatim `<title>`, H1 "About Be Secure Locksmith", "Our Mission", "Meet the Be Secure Locksmith Team", a sampling of team names + roles (Joe/General Manager, Britney/Commercial Relationship Manager, a Technician), the credentials (ALOA), a reviews marker, `BreadcrumbList`, and one `LocalBusiness`.

## Out of scope

- Individual team-member bio pages.

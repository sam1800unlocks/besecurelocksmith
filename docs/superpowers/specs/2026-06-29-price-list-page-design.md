# Price List Page (`/price-list/`) — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending build)

## Goal

Rebuild the `/price-list/` page on the design system — exact live prices, reorganized into category cards, with added "what's included" content and on-brand design flare.

## Route

`src/pages/price-list/index.astro` → `/price-list/`. Global header/footer, `location='main'`.

## Section stack

1. **Hero** — gradient hero: breadcrumb (Home / Price List), H1 **"Be Secure Locksmith Service Prices"**, subhead "Upfront, transparent pricing — parts and labor included, no surprises.", red **Call** + blue **Book Now**.
2. **TrustStrip.**
3. **Intro** — H2 "How Much Do Our Locksmith Services Cost?" + the verbatim live lead: "These are general estimates for some of our most popular services. The prices listed are estimates and may vary based on several factors. Specialty jobs and high-security locks may incur higher costs than the average prices listed in this chart."
4. **Price category cards** — the 15 live prices grouped into 4 cards, each with an icon, a heading, and rows of *service name · description · `$price and up`* (price as a bold chip):
   - **Lockouts** ($65 each): Auto Lockout, Residential Lockout, Commercial Lockout, Scooter Seat Lockout, Storage/Padlock/U-Lock Lockout, Semi-Truck Lockout.
   - **Car Keys**: Broken Key Extraction $85, Auto Key Programming $120, Auto Key Replacement — all keys lost $150.
   - **Locks & Installation**: Install Customer-Provided Lock $65, Keypad Lock + Installation $199, Mailbox Lock Replacement $85, Deadbolt or Doorknob + Installation $80.
   - **Rekeying**: Lock Rekey $33, Lock Rekey — no keys $50.
   (Labels/descriptions/prices verbatim from live; fix the obvious "that that" typo → "that".)
5. **"What's included / good to know" band** (added content) — the live "Please note" items as check-points: parts & labor included, trip charge not included, standard business hours Mon–Sat 8am–5pm, plus "free on-site assessment" and "upfront quote before any work." On a tinted band (echoing the commercial page's notes).
6. **CTA** — "Get a personalized quote" with Call (red) + Book (blue); a line: "To get a personalized quote for your service, contact us today so we can discuss the details and schedule a service appointment."
7. **Footer + StickyCallBar.**

## Data

A typed `priceGroups` array in the page frontmatter: `{ label, icon, items: { service, desc, price }[] }[]`. Prices verbatim. (Inline, like the commercial page's `pricing` array.)

## SEO

- **Title** (verbatim live): `Locksmith Prices Gainesville, FL - Upfront, No Surprises`
- **Description** (verbatim live): `See upfront locksmith pricing for Gainesville and Ocala, FL. Clear rates for lockouts, rekeys, car keys, and installs with no surprises. View price ranges.`
- `BreadcrumbList` JSON-LD (Home → Price List); `BaseLayout` default emits the single `LocalBusiness`.

## Testing

- **Build test:** `/price-list/index.html` has the verbatim `<title>`, H1 "Be Secure Locksmith Service Prices", the 4 category headings, a sampling of exact prices ($65, $120, $150, $199, $33, $80), key service labels, the "parts and labor" note, and `BreadcrumbList` JSON-LD.

## Out of scope

- A bookable/cart pricing system; per-location price variation (prices are general estimates, as the live page states).

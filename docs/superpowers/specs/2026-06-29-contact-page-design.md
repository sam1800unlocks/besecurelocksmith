# Contact Page (`/contact-us/`) — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending writing-plans)

## Goal

Build the `/contact-us/` page, preserving the existing URL, assembled mostly from existing components plus one small new section (quick-contact cards). Faithful to the live page's content, modernized to the design system.

## Route

- `src/pages/contact-us/index.astro` → `/contact-us/` (`trailingSlash:'always'`, `build.format:'directory'`).
- `location = 'main'` → general phone `352-706-5295`, SMS `352-389-5305`.

## Section stack (top → bottom)

1. **PromoBar + NavBar** — global header (main location).
2. **Hero** — gradient hero matching the service/commercial pages (inline in the page, same gradient + dotted overlay + radial glow). Breadcrumb (Home / Contact Us), H1 **"Contact Us"**, subhead **"Contact us today to get a free quote or book a mobile service appointment."**, and red **Call** (`variant="call"`) + blue **Book Now** (`variant="booking"`, `site.bookingUrl`) buttons.
3. **ContactMethods** *(new component)* — three cards: **Call** (`telHref(site.defaultPhone)` → `352-706-5295`), **Text** (`smsHref(site.smsPhone)` → `352-389-5305`), **Book Online** (`site.bookingUrl`, new tab). Each card: icon, label, value/prompt, whole card is the link. Responsive 3-up grid (stacks on mobile).
4. **TrustStrip** — reused (licensed/insured/4.9★).
5. **ContactForm** — reused as-is (`/api/contact` → SES + Twilio + sheet pipeline; Turnstile + honeypot). This is the page's "Email Us."
6. **ServiceAreas** — reused; renders **both** offices (Gainesville + Ocala) with embedded maps, full NAP, hours, and red Call buttons.
7. **"What's next" band** *(small)* — heading "Booked an appointment? What's next?" + the live copy: "Our team of professional dispatchers and technicians will be with you every step of the way. Our mission is to provide an unmatched level of efficiency for each service that we provide, to all of our customers." Plain centered band (reuse `Section`/`Container`).
8. **Footer + StickyCallBar** — global (footer already carries payments / follow us / hiring / services).

## New component — `ContactMethods.astro`

- **Props:** `location?: string` (default `'main'`).
- Resolves phone via `resolveLocation`/`resolvePhone`; SMS from `site.smsPhone`; booking from `site.bookingUrl`.
- Renders 3 anchor cards in a responsive grid (`repeat(auto-fit,minmax(240px,1fr))`), each: a circular brand-tinted icon, a bold label (Call Us / Text Us / Book Online), the value (number) or prompt, styled consistent with the card system (rounded-[24px], border, hover:border-primary). Phone/SMS use `telHref`/`smsHref` (E.164); Book opens in a new tab (`rel="noopener noreferrer"`).
- Reusable on other pages later.

## SEO / structured data

- **Title** (verbatim live): `Contact Our Gainesville, FL Locksmith - Get Service`
- **Description** (verbatim live): `Need a locksmith in Gainesville or Ocala, FL? Reach our licensed mobile team for home, car, and business lock service. Local, fast, and friendly. Get help now.`
- `BaseLayout localBusiness={false}` + page emits one `LocalBusiness` (main NAP) and a `BreadcrumbList` (Home → Contact Us), matching the area-page pattern.

## Reuse vs. new

- **Reused:** `PromoBar`, `NavBar`, `TrustStrip`, `ContactForm`, `ServiceAreas`, `Footer`, `StickyCallBar`, `Section`, `Container`, `Button`, `site`/`offices` config, `telHref`/`smsHref`.
- **New:** `ContactMethods.astro` (quick-contact cards) and the page route (with inline hero + "what's next" band).

## Testing

- **ContactMethods unit test:** renders 3 cards; Call → `tel:+13527065295`, Text → `sms:+13523895305`, Book → `site.bookingUrl` with `target="_blank"`.
- **Page build test:** `/contact-us/index.html` builds; contains H1 "Contact Us", the subhead, the contact form (`action="/api/contact"`), both offices (Gainesville + Ocala), exactly one `LocalBusiness` + a `BreadcrumbList`, and the verbatim `<title>`.

## Out of scope

- A public mailto (the live page has none — email goes through the form).
- Extracting a shared `PageHero` (the hero is inlined here, consistent with the commercial page; extraction is a future DRY follow-up if more standalone pages need it).
- Per-location contact routing (this is a general page → main phone).

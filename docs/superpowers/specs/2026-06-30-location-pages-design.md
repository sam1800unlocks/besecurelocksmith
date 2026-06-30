# Location Pages (Gainesville / Ocala / Lake City) — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending build)

## Goal

Build the 3 location pages on the unified service-area template, but with **location-specific header/footer data** — their own tracking phone number and social links (pulled from the live site) — and their **live FAQs**.

## Tracking phones + socials (pulled from live)

| Location key | City | tracking phone | Yelp (city-specific) | live FAQs |
|---|---|---|---|---|
| `gainesville` | Gainesville | 352-290-7035 | be-secure-locksmith-gainesville-2 | 6 (pull verbatim) |
| `ocala` | Ocala | 352-325-7953 | be-secure-locksmith-ocala | 6 (pull verbatim) |
| `lake-city` | Lake City | 386-251-6901 | (shares Gainesville Yelp) | none → generated |

Shared across all: SMS 352-389-5305; Facebook, Instagram, YouTube. Only **Yelp** differs (Ocala).

## Location records (`src/lib/locations.ts`)

Add `socials?: typeof site.socials` to the `Location` type. Add 3 records:
- `gainesville`: phone 352-290-7035; nap = Gainesville office (901 NW 8th Ave. C17, Gainesville, FL 32601); socials = global (Yelp already gainesville-2).
- `ocala`: phone 352-325-7953; nap = Ocala office (217 SE 1st Ave. Suite 200-50, Ocala, FL 34471); socials = global with **Yelp → be-secure-locksmith-ocala**.
- `lake-city`: phone 386-251-6901; nap = **Gainesville office** (no Lake City office); socials = global.

`resolvePhone` already returns the location's phone.

## Location-aware header/footer

- `PromoBar`, `NavBar`, `StickyCallBar` already resolve the phone from `location` → tracking number shows when the page passes its location. (No phone change needed.)
- **`NavBar`**: header social icons use `loc.socials ?? site.socials`.
- **`Footer`**: take a `location` prop; footer social icons use `loc.socials ?? site.socials`. (Office-address list stays — those are the physical offices.)

This keeps the global pages on `main` (general number + global socials) and gives the 3 location pages their own phone + socials via the same components — "separate from global" through location data, not forked components.

## Live FAQs

Add optional `faqs: z.array(z.object({ question, answer })).optional()` to the `serviceAreas` collection. In the `[slug]` route: if `area.faqs` is present, render those (mapped with `order`) via `Faq variant="rich"`; otherwise `buildAreaFaqs(...)` as today. FAQPage schema emitted either way. Pull Gainesville + Ocala FAQ Q/A **verbatim** from live (relativize any links); Lake City uses the generated city FAQs.

## The 3 pages (data files)

Built on the unified template with curated facts and `location` set to their key:

| City | slug | county | office | zips | location |
|---|---|---|---|---|---|
| Gainesville | locksmith-gainesville-fl | Alachua County | gainesville | 32601, 32603, 32605, 32607, 32608, 32609 | gainesville |
| Ocala | locksmith-ocala-fl | Marion County | ocala | 34470, 34471, 34474, 34475, 34476, 34480 | ocala |
| Lake City | locksmith-lake-city-fl | Columbia County | gainesville | 32024, 32025, 32055 | lake-city |

Pull live body (Gainesville has captioned figures → download images + captions like Hampton; Ocala/Lake City as they are), verbatim title/description, city-relevant related blogs. Order 11–13.

## Footer chips

Gainesville / Ocala / Lake City chips already exist in the footer — their pages now exist (no more 404).

## Testing

- **Locations:** `resolvePhone(resolveLocation('gainesville'))` → `352-290-7035`; Ocala → `352-325-7953`; Lake City → `386-251-6901`. `resolveLocation('ocala').socials` Yelp href contains `be-secure-locksmith-ocala`.
- **NavBar/Footer:** rendered with `location="ocala"` show the tracking number (`tel:+13523257953`) and the Ocala Yelp link.
- **Pages build:** the 3 pages build with their tracking number in the header, FAQPage schema, one LocalBusiness; Gainesville FAQ contains a pulled question (e.g., "What areas does your Gainesville locksmith service cover?").

## Out of scope

- Changing the global pages' phone/socials.

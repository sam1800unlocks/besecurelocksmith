# Homepage Trust & CTA Polish (GSAP + Top Bar + Remove Bottom Bar) — Design

**Date:** 2026-07-04
**Status:** Approved design → ready for implementation plan

## Context

The homepage already has restrained GSAP motion (a staggered hero reveal on load + a fade-up per content block on scroll, in `src/components/scripts/home-anim.ts`, gated behind `prefers-reduced-motion`). This project adds a curated set of *tasteful* motion to reinforce trust and pull the eye toward the primary CTA, brightens the top promo bar's accent, and removes the mobile bottom CTA bar (which reads as spammy and is redundant with the sticky header's tap-to-call).

Guiding principle: motion should read as **credible, not busy**. Effects fire **once** (no looping "attention" loops), stay subtle, and fully respect reduced-motion.

## Decisions (locked)

- **GSAP additions (homepage only):** count-up trust stats · trust-logo stagger reveals · hero CTA emphasis (one-time shine + single pulse) · review star-draw + card slide. All gated behind the existing `prefers-reduced-motion` check.
- **Top bar (`PromoBar`):** keep the dark `bg-ink` bar; brighten the accent — the "Call {phone}" link becomes a **bright on-brand blue** and the `•` separators lift a shade. (Amber/gold is a trivial alternative swap if preferred later.)
- **Bottom bar (`StickyCallBar`):** **remove site-wide** and delete the component. The sticky header's tap-to-call button exists on every page, so no CTA is lost.
- **No content/copy changes**; no new dependencies (GSAP + ScrollTrigger already installed).

## Architecture

### 1. GSAP — additions to `src/components/scripts/home-anim.ts`

All new effects are driven by small `data-*` marker attributes added to existing components, so the animation logic stays centralized in `home-anim.ts` and the markup stays declarative. Everything runs inside the existing `if (!reduce)` guard.

- **Count-up stats.** Mark the numeric spans with `data-countup="<target>"` (+ `data-countup-decimals="1"` for the rating). On `ScrollTrigger` enter (`start: 'top 90%', once: true`), tween an object `{v:0} → {v:target}` (~1.0s, `power2.out`) and write the formatted value on update: rating `4.9` (1 decimal), review count `2,544` (thousands comma via `toLocaleString`). Targets: the **TrustStrip** rating + review count, and the **Reviews** badge rating + review count. (TrustStrip sits near the top, so its count-up effectively fires on load — intended.)
- **Trust-logo stagger reveals.** Mark the **AsSeenIn** press-logo row and the **Credentials** badge row with `data-stagger`. Animate their direct children `gsap.from(children, { opacity:0, y:16, stagger:0.08, duration:0.5, scrollTrigger:{ trigger, start:'top 85%', once:true } })`. These rows are excluded from the generic whole-block fade so the stagger is the visible effect (the block wrapper itself no longer fades as one unit — or the inner row animates after the block; the plan will pick the cleaner of the two so effects don't double up).
- **Hero CTA emphasis.** Mark the hero **Call** button with `data-cta-shine`. ~0.8s after load (after the hero reveal settles), sweep a gradient sheen across it once (a GSAP-driven overlay/`::after` translated from off-left to off-right, ~0.7s) and apply a single gentle pulse (`scale 1 → 1.03 → 1`, ~0.5s). Fires **once**, never loops.
- **Star-draw + card slide.** In **Reviews**: mark the star rows with `data-star-draw` (reveal via a left-to-right clip/width from 0→100%, ~0.6s) and the review-card track with `data-cards` (children stagger-slide in, `x:24`→0 + fade, `stagger:0.08`), both on `ScrollTrigger` enter.

Marker attributes are added to: `TrustStrip.astro`, `Reviews.astro`, `AsSeenIn.astro`, `Credentials.astro`, `Hero.astro`. No visual change when JS is off or reduced-motion is on (numbers render at their final value; rows/cards/stars render normally).

### 2. Top bar — brighter accent (`src/components/sections/PromoBar.astro`)

Keep `bg-ink` and the layout. Change the "Call {phone}" link from `text-link-dark` to a **bright blue accent** (a high-contrast-on-dark token, e.g. a bright sky/brand blue — exact token chosen in the plan from `tokens.css`, adding one if none fits). Optionally lift the `•` separators from their current muted color a shade for legibility. Applies to both the desktop and mobile `<p>` variants. No structural change.

### 3. Remove the bottom bar (`StickyCallBar`) — site-wide

- Delete `src/components/sections/StickyCallBar.astro`.
- Remove every `<StickyCallBar … />` usage and its `import` from all page templates that include it (homepage, about, contact, locations, service-areas `[slug]`, price-list, testimonials, employment, privacy-policy, and any others — found by grep).
- Remove the fixed-bar bottom **spacer** div along with it (it lived inside the same component, so deleting the component removes it).
- `home-anim.ts` already skips `position: fixed/sticky` elements, so its scroll-reveal logic is unaffected by the removal.

## Testing & guardrails

Animations are client-side and not unit-testable here, so coverage is **structural + manual**:

- **Structural (dist-HTML / Vitest):**
  - `StickyCallBar` is gone: no page in `dist/` contains its distinctive markup (e.g., the `Locked out?` sticky-bar string / the `fixed … bottom-0` call-bar), and the component file no longer exists.
  - Count-up/stagger markers are present in the built homepage (`data-countup`, `data-stagger`, `data-cta-shine`, `data-star-draw`, `data-cards`), and the numbers still render their final values as text (so no-JS users see `4.9` / `2,544`).
  - `PromoBar` uses the new accent class, not `text-link-dark`.
- **Manual pass (record):** homepage with motion on (count-up runs, logos stagger, CTA sheen fires once, stars/cards animate) and with `prefers-reduced-motion: reduce` (everything static, final values shown); mobile view confirms the bottom bar is gone and the header call button remains.

## Files

- **Modify:** `src/components/scripts/home-anim.ts`; `src/components/sections/TrustStrip.astro`, `Reviews.astro`, `AsSeenIn.astro`, `Credentials.astro`, `Hero.astro`, `PromoBar.astro`.
- **Delete:** `src/components/sections/StickyCallBar.astro`.
- **Modify (remove `StickyCallBar` usage + import):** every page under `src/pages/**` that includes it.
- **Tests:** a new/extended dist-HTML test for the structural assertions above.

## Out of scope

The other proposed effects not selected are deferred: desktop scroll-in mini-CTA chip, hero keyword highlight, hero image parallax. No changes to copy, schema, routes, or the pre-launch `robots.txt`.

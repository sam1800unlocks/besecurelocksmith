# RelatedBlogs Featured Images + FAQ Richer Cards — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending writing-plans)

## Goal

Two design enhancements to the service-area template:
1. **RelatedBlogs** cards show each post's featured image (pulled from the live post, stored locally), with a branded placeholder fallback.
2. The shared **Faq** component gains a `rich` visual variant (accent bar, numbered Q badge, hover lift, smoother open/close), applied **only** to service-area pages — the homepage FAQ is unchanged.

## Part A — RelatedBlogs featured images

### Data model
Add an optional `image` to each `relatedBlogs` item in `src/content/config.ts`:

```ts
relatedBlogs: z.array(z.object({
  title: z.string(),
  url: z.string(),
  image: z.string().optional(),
})).default([]),
```

### Content
For each of the 3 curated live posts, crawl the post page (curl + browser User-Agent — the CDN 403s plain fetches), read its `og:image` (`<meta property="og:image" content="...">`), download that image, optimize it into `public/img/blog/`, and set `image` to the local path (e.g. `/img/blog/<slug>.jpg`). Both cities use the same 3 posts, so the same image paths apply to both data files. If a post has no resolvable `og:image`, omit `image` (the component renders the placeholder).

Optimizer: add a `['blog', N]` cap entry to `scripts/optimize-images.mjs` (blog cards render ≤ ~380px wide in a 3-up grid; cap 760 for retina).

### Component (`RelatedBlogs.astro`)
Each card becomes:
- **Top:** a fixed-aspect image area (`aspect-[16/10]`, `overflow-hidden`, rounded top corners). When `image` is set: `<img src={image} alt={title} loading="lazy" class="w-full h-full object-cover">` with a gentle hover zoom (`group-hover:scale-[1.03] transition-transform`). When `image` is absent: a **branded placeholder** — the diagonal-stripe tint used by `ServicesGrid`'s no-photo fallback (`repeating-linear-gradient(135deg,#f1f4f7,#f1f4f7 11px,#e7ebf0 11px,#e7ebf0 22px)`), optionally with a small centered label.
- **Body:** title (`h3`) + "Read article →".
- Hover: card border → `primary` (kept from current), plus the image zoom.
- Links stay absolute live URLs, `target="_blank" rel="noopener noreferrer"`. The component still renders nothing when `posts` is empty.

## Part B — FAQ richer cards (area pages only)

### Variant prop
Add `variant?: 'plain' | 'rich'` to `Faq.astro`, default `'plain'`. `'plain'` renders exactly today's markup/classes (homepage unaffected). The service-area route passes `variant="rich"`:

```astro
<Faq faqs={areaFaqs} variant="rich" />
```

`Faq` continues to emit `FAQPage` JSON-LD in both variants (unchanged).

### Rich card styling
When `variant === 'rich'`, each `<details>` card gains:
- A brand-blue **left accent bar** (e.g. `border-l-4 border-primary`).
- A **numbered Q badge** before each question — a small rounded brand-tinted badge showing the 1-based index (`1`, `2`, …). Built from the map index; no data change.
- **Larger rounded cards** and a **hover lift** (`hover:shadow-[...] hover:-translate-y-px transition`).
- **Smoother open/close:** the answer animates in via a CSS keyframe (fade + slight slide) on `[open]`; the chevron rotation stays as-is.
- First item stays open by default (`open` on index 0), as today.

The rich styles are scoped so they only apply in the rich variant (e.g. a wrapper class `faq--rich` gating the CSS), leaving the plain variant byte-identical to today.

## Testing

- **RelatedBlogs:** renders an `<img src=...>` when a post has `image`; renders the stripe placeholder (no `<img>`) when it doesn't; still renders nothing when `posts` is empty; links remain `target="_blank"`.
- **Faq:** `variant="rich"` output contains the rich markers (accent/badge — e.g. a `faq--rich` class and a Q-badge element) and still emits `"@type":"FAQPage"`; default/`plain` output is unchanged from today (existing FAQ tests still pass) and the homepage page test is unaffected.
- **Build:** both area pages build; blog images present in `dist/img/blog/`; homepage FAQ markup unchanged.

## Out of scope

- One-open-at-a-time accordion behavior, a contact CTA panel, and a two-column FAQ layout (considered, not chosen).
- Changing the homepage FAQ.
- Migrating the blog or making `relatedBlogs` links internal (still absolute live URLs until cutover).

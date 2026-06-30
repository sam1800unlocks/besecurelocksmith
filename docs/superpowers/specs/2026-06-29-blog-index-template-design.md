# Blog Index Template (`/blog/`) — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending build)

## Goal

Build the `/blog/` listing page template — a data-driven, on-brand grid of post cards mirroring the live blog index — preserving the URL. Individual blog-post pages and the full 76-post migration are an explicit follow-up.

## Route

`src/pages/blog/index.astro` → `/blog/` (`trailingSlash:'always'`, `build.format:'directory'`). Global PromoBar/NavBar/Footer/StickyCallBar, `location='main'`.

## Section stack

1. **Hero** — gradient hero (consistent with the other templates): breadcrumb (Home / Blog), H1 **"Be Secure Locksmith Blog"**, and the live intro line: "Locksmith tips for Gainesville and Ocala, FL homeowners and businesses — lockouts, rekeys, smart locks, and car keys from a local team." No CTA buttons (clean editorial header).
2. **TrustStrip** — directly below the hero (consistent across every page).
3. **Post grid** — responsive 3-up grid (`repeat(auto-fit,minmax(280px,1fr))`, max-w-[1180px]) of `BlogCard`s, newest first.
4. **Footer + StickyCallBar**.

## Data — new `blog` content collection

`src/content/config.ts` adds:

```ts
const blog = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    image: z.string(),         // local /img/blog/<slug>.<ext>
    category: z.string(),      // one of: Automotive, Commercial, Residential, Ocala, Safe
    date: z.string(),          // ISO YYYY-MM-DD (for sorting + display)
    url: z.string(),           // live post URL (absolute) for now
  }),
});
// export key 'blog'
```

Seed with the **9 posts from live page 1** (real title, excerpt, category, date, featured image). Featured images downloaded + optimized into `public/img/blog/` (reuse the existing `blog` optimizer cap). Posts sort by `date` descending in the route.

## New component — `BlogCard.astro`

- **Props:** `post: { title, excerpt, image, category, date, url }`.
- Renders an anchor card: featured image on top (`aspect-[16/10]`, `object-cover`, rounded top, hover zoom), a small **category badge** (brand-tinted pill), the **title** (h3), a 1–2 line **excerpt** (clamped), and a footer row with the formatted **date** + "Read article →".
- Links to `post.url`, `target="_blank" rel="noopener noreferrer"` (live URLs for now; swap to internal `/blog/<slug>/` when post pages exist).
- Card styling consistent with the system (rounded-[24px], border, `hover:border-primary`).

## SEO / structured data

- **Title** (verbatim live): `Locksmith Blog Gainesville, FL - Tips & Lock Guides`
- **Description** (verbatim live): `Locksmith tips for Gainesville and Ocala, FL homeowners and businesses. Learn about lockouts, rekeys, smart locks, and car keys from a local team. Read more.`
- JSON-LD: `BreadcrumbList` (Home → Blog) + a `Blog` object listing the posts (`blogPost` entries with headline + url). `BaseLayout` default emits the single `LocalBusiness`.

## Decisions (confirmed)

- Card links → **live post URLs** for now.
- Categories → **badges only**; no interactive filtering or `/blog/category/…` pages yet.
- **No pagination** (9-post starter set); added during the full migration.

## Testing

- **blog collection test:** the 9 seeded posts each have title/slug/excerpt/image/category/date/url; images are local `/img/blog/...` paths.
- **BlogCard unit test:** renders the image, category badge, title, excerpt, formatted date, and a `target="_blank"` link to the post url.
- **/blog/ build test:** builds `dist/blog/index.html`; contains the verbatim `<title>`, H1 "Be Secure Locksmith Blog", 9 post cards (9 distinct `/blog/...` links), category badges, `BreadcrumbList` + `Blog` JSON-LD.

## Out of scope (follow-up)

- The blog-post page template and migrating all 76 posts (then swap card links to internal `/blog/<slug>/` and add pagination + category pages).

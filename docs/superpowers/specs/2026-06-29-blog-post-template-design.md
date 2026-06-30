# Blog Post Template (`/blog/<slug>/`) — Design Spec

**Date:** 2026-06-29
**Status:** Approved (pending build)

## Goal

Build the individual blog-post page template, demonstrated with one real post pulled verbatim from the live site. Other posts keep linking to live until migrated.

## Sample post

`transponder-key-vs-remote-head-key-vs-smart-key-in-dunnellon-fl-what-your-car-actually-uses` — "Transponder Key vs. Remote Head Key vs. Smart Key in Dunnellon, FL: What Your Car Actually Uses" (Automotive Locksmith, author **Netta Kaiden** — company owner, the authoritative voice).

## Route

`src/pages/blog/[slug]/index.astro` via `getStaticPaths` over the `blog` collection, building a page **only for posts that have body content** (`body` non-empty). Path `/blog/<slug>/` (`trailingSlash:'always'`).

## Schema additions (`blog` collection)

```ts
// added, all optional so cards-only posts still validate
body: z.array(z.string()).optional(),          // HTML blocks (p/h2/h3/ul/ol/figure), links relativized
author: z.string().optional(),
heroImage: z.string().optional(),              // full-size featured image (local) for the post header
metaTitle: z.string().optional(),              // post's own <title> (verbatim live)
metaDescription: z.string().optional(),        // post's own meta description (verbatim live)
```

## Layout (single column)

1. **PromoBar + NavBar** (global).
2. **Post header** (centered or left, max-w-[760px]): breadcrumb (Home / Blog / title), **category badge**, H1 = post title, a meta row — **"By {author} · {date} · {readTime} min read"** (read time computed from body word count ÷ ~200). Then the **featured image** (`heroImage`, rounded, full width of the content column).
3. **Article body** at **max-w-[760px]**, using the article prose styles (headings, paragraphs, lists, links, and `<figure>` images with captions). Live internal links relativized; external links untouched. Body images downloaded + optimized into `public/img/blog/`.
4. **End CTA** band — Call (red) + Book (blue), e.g. "Need a key made or a lockout solved in Dunnellon, FL? Call our local team."
5. **Related posts** — up to 3 other posts in the same category (fallback: most recent), rendered with `BlogCard` (newest first, current post excluded).
6. **← Back to all posts** link → **Footer + StickyCallBar**.

## BlogCard link behavior

`BlogCard` links **internally** (`/blog/<slug>/`, same tab) when the post has body content; otherwise it links to the live `url` (`target="_blank"`, as today). So the sample post's card now points to the internal page; the other 8 stay live.

## SEO / structured data

- **Title:** `metaTitle` (verbatim live: "Transponder vs Remote Head vs Smart Key in Dunnellon FL | Be Secure Locksmith").
- **Description:** `metaDescription` (verbatim live).
- JSON-LD: `BlogPosting` (headline, datePublished, author {Person, name}, image, mainEntityOfPage) + `BreadcrumbList` (Home → Blog → title). `BaseLayout` default emits the single `LocalBusiness`.

## Content extraction

Crawl the live post (curl + browser UA). Extract the article body blocks (`p`, `h3`, `ul`, `ol`, and `<figure>` images with captions) preserving inline `<a>` links; relativize internal links (`https://besecurelocksmith.com/x/` → `/x/`); exclude site furniture (header/nav/footer/sidebar widgets, the author box, related/CTA boilerplate). Download the full featured image + any body images into `public/img/blog/`. Preserve curly apostrophes via `json.dump(..., ensure_ascii=False)`.

## Testing

- **Schema/data:** the sample post entry has `body` (non-empty), `author`, `heroImage`, `metaTitle`, `metaDescription`; body contains a relativized internal link and no `besecurelocksmith.com`.
- **getStaticPaths:** builds a page for the sample slug; does NOT build pages for body-less posts.
- **BlogCard:** internal link (no `target=_blank`) when `body` present; external (`target=_blank`) when absent.
- **Post page build test:** `dist/blog/<slug>/index.html` has the verbatim `<title>`, H1 = post title, "By Netta Kaiden", the category badge, a body section heading ("What Is a Transponder Key?"), `BlogPosting` + `BreadcrumbList` JSON-LD, related-post cards, and a back-to-blog link.

## Out of scope (follow-up)

- Migrating the remaining 75 posts (repeat the extraction per post), pagination, and category landing pages.

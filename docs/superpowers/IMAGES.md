# Image optimization

Keep page weight low without breaking the string-path references used by
components and content collections.

## TL;DR

- **New images added to `public/img/`** → run `npm run optimize:images` before committing.
- **New components/templates** → prefer Astro `astro:assets` `<Image>` (imports from `src/assets/`) for automatic, responsive optimization.

## Why two paths?

Astro only optimizes images it can *import* (from `src/`), not files served
from `public/`. Much of this site references images by string path
(`/img/...`) — in components and in content-collection `photo` fields — so
those files live in `public/` and are **not** auto-processed by the build.
We optimize them with a script instead.

## 1. `public/` images — `npm run optimize:images`

`scripts/optimize-images.mjs` (uses `sharp`, which Astro already bundles)
walks `public/img/**` and, **in place**, preserving each file's format and
name (so no references break):

- resizes down to a per-folder max width (never upscales — see caps below),
- re-encodes (webp q78 / jpeg q80 / png palette),
- only overwrites when it actually saves bytes.

Run it after adding/replacing any `public/img` raster. It's safe to run once
per image; re-running already-optimized files is a no-op unless they'd shrink
further (a tiny additional re-encode loss is possible, so don't run it in a
loop). Initial pass: **1692KB → 864KB (−49%)**.

Width caps (rendered px × ~2 for retina), edit in the script if layouts change:

| Folder | Max width | Rendered at |
|---|---|---|
| `services/cards` | 800 | ~400px cards |
| `services/commercial` | 1100 | ≤440px float / ~600px mobile |
| `businesses` | 240 | ~160px logo tiles |
| `credentials` | 260 | credential logos |
| `clients` | 300 | client logo wall |
| `press` | 380 | press logos |
| `pm` | 140 | ~40px feature icons |
| everything else | 900 | default |

## 2. New components — `astro:assets`

For images authored into new templates, import from `src/assets/` and use
`<Image>` / `<Picture>` so the build emits resized, modern-format,
`srcset`-responsive output automatically:

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/services/commercial/hero.webp';
---
<Image src={hero} alt="..." widths={[440, 640, 880]} sizes="(min-width:768px) 440px, 100vw" />
```

Use this for hero/figure images you control directly. Keep collection-driven
images (service cards, logos) in `public/img` + the script, since their paths
are data.

## Follow-ups

- `public/img/google-g-icon.svg` (and the `social/` copy) are ~43KB each —
  large for an icon SVG. Minify (e.g. SVGO) and de-duplicate the two copies.
- Consider AVIF for the largest photos if browser support targets allow.

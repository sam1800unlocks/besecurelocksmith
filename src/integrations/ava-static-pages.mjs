// Standalone pages in public/ skip BaseLayout, so they can't take the widget's
// build-time versioned src. They ship the plain /widget.js (which always works),
// and this swaps in the versioned, immutable file once the build is done.
// Same lookup as BaseLayout, so every page loads the same file.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { avaWidgetSrc, AVA_FALLBACK_SRC } from '../lib/ava-widget.ts';

export const AVA_STATIC_PAGES = ['sliding-door-repair/index.html'];

export default function avaStaticPages() {
  return {
    name: 'ava-static-pages',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const src = await avaWidgetSrc();
        for (const page of AVA_STATIC_PAGES) {
          const file = fileURLToPath(new URL(page, dir));
          const html = readFileSync(file, 'utf8');
          if (!html.includes(`src="${AVA_FALLBACK_SRC}"`)) throw new Error(`${page}: Ava widget tag not found`);
          writeFileSync(file, html.replace(`src="${AVA_FALLBACK_SRC}"`, `src="${src}"`));
        }
        logger.info(`set Ava widget src on ${AVA_STATIC_PAGES.length} static page(s): ${src}`);
      },
    },
  };
}

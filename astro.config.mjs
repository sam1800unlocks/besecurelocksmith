import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { FontaineTransform } from 'fontaine';
import imageDimensions from './src/integrations/image-dimensions.mjs';
import avaStaticPages from './src/integrations/ava-static-pages.mjs';
import { lastmodFor } from './src/integrations/lastmod.mjs';

// Pages that are noindex (see per-page robots meta) — keep them out of the sitemap.
const EXCLUDE = ['/privacy-policy/', '/thank-you/', '/blog/category/', '/blog/page/'];

// Indexable pages served straight from public/, which the sitemap integration
// can't see. (The noindex ads landing pages in public/ stay out.)
const STATIC_PAGES = ['/sliding-door-repair/'];

export default defineConfig({
  site: 'https://besecurelocksmith.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      customPages: STATIC_PAGES.map((p) => `https://besecurelocksmith.com${p}`),
      filter: (page) => !EXCLUDE.some((p) => new URL(page).pathname.startsWith(p)),
      serialize(item) {
        const lastmod = lastmodFor(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    imageDimensions(),
    avaStaticPages(),
  ],
  vite: {
    plugins: [
      tailwind(),
      // Generate metric-matched fallback fonts so text doesn't reflow when the
      // web font swaps in (kills font-swap CLS).
      FontaineTransform.vite({
        fallbacks: ['system-ui', 'Arial'],
        resolvePath: (id) => new URL(`node_modules/@fontsource-variable/figtree/${id.replace(/^\.?\//, '')}`, import.meta.url),
      }),
    ],
  },
});

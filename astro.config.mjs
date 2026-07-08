import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { FontaineTransform } from 'fontaine';

// Pages that are noindex (see per-page robots meta) — keep them out of the sitemap.
const EXCLUDE = ['/privacy-policy/', '/thank-you/', '/blog/category/', '/blog/page/'];

export default defineConfig({
  site: 'https://besecurelocksmith.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      filter: (page) => !EXCLUDE.some((p) => new URL(page).pathname.startsWith(p)),
    }),
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

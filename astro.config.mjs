import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages that are noindex (see per-page robots meta) — keep them out of the sitemap.
const EXCLUDE = ['/privacy-policy/', '/thank-you/', '/blog/category/', '/blog/page/'];

export default defineConfig({
  site: 'https://besecurelocksmith.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !EXCLUDE.some((p) => new URL(page).pathname.startsWith(p)),
    }),
  ],
  vite: { plugins: [tailwind()] },
});

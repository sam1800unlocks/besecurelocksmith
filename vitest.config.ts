import { getViteConfig } from 'astro/config';
export default getViteConfig({
  test: {
    globals: true,
    environment: 'node',
    // contact-worker/ has its own vitest project (it needs the `cloudflare:test`
    // pool), and its node_modules ship .test.js files of their own — neither can
    // run in this suite, so keep both out of collection.
    exclude: ['tests/e2e/**', '**/node_modules/**', 'contact-worker/**'],
  },
});

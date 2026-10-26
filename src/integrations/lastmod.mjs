// <lastmod> for the sitemap: the last git commit that touched a page's own
// content files. Only a page's content counts (not shared layout/components),
// so a template change doesn't mark all 140 pages as modified at once.
// A page we can't map to a source, or a build without git, gets no <lastmod>
// rather than a guessed one.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const at = (p) => (existsSync(root + p) ? [p] : []);

// Service JSON file names don't always match their URL slug
// (service-automotive.json serves /services/automotive-locksmith/).
const serviceData = Object.fromEntries(
  readdirSync(root + 'src/data')
    .filter((f) => /^service-.*\.json$/.test(f) && f !== 'service-catalog.json')
    .map((f) => [JSON.parse(readFileSync(root + 'src/data/' + f, 'utf8')).slug, 'src/data/' + f]),
);

const pageFiles = (path) => [...at(`src/pages${path}index.astro`), ...at(`src/pages${path.replace(/\/$/, '')}.astro`)];

export function sourcesFor(pathname) {
  const seg = pathname.split('/').filter(Boolean);
  if (seg[0] === 'blog' && seg.length === 2) return at(`src/content/blog/${seg[1]}.json`);
  if (seg[0] === 'service-areas' && seg.length === 2) return at(`src/content/service-areas/${seg[1]}.json`);
  if (seg[0] === 'products' && seg.length === 2) return at('src/data/products.ts');
  if (seg[0] === 'services' && seg.length === 2) return [...pageFiles(pathname), ...(serviceData[seg[1]] ? [serviceData[seg[1]]] : [])];
  if (seg[0] === 'about') return [...pageFiles(pathname), ...at('src/data/about.json')];
  return pageFiles(pathname);
}

const cache = new Map();
export function lastmodFor(pathname) {
  const files = sourcesFor(pathname);
  if (!files.length) return undefined;
  const key = files.join('\0');
  if (!cache.has(key)) {
    let iso;
    try {
      iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], { cwd: root, encoding: 'utf8' }).trim() || undefined;
    } catch { iso = undefined; }
    cache.set(key, iso);
  }
  return cache.get(key);
}

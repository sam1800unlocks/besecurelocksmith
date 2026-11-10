// Agency schema standard: one <script type="application/ld+json"> per page, holding
// a single @graph. Pages build their nodes separately (the brand in BaseLayout,
// Service / FAQ / breadcrumb in each page), so this merges them after the build
// instead of threading a nodes prop through every page. BlogPosting dateModified
// is added here too: it comes from git, which only resolves in the build process.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lastmodFor } from './lastmod.mjs';

const BLOCK = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

export function mergeJsonLd(html, modifiedFor = () => undefined) {
  const matches = [...html.matchAll(BLOCK)];
  if (matches.length === 0) return html;

  const graph = matches.flatMap((m) => {
    const parsed = JSON.parse(m[1]);
    const nodes = parsed['@graph'] ?? (Array.isArray(parsed) ? parsed : [parsed]);
    return nodes.map(({ '@context': _context, ...node }) => {
      const dateModified = node['@type'] === 'BlogPosting' ? modifiedFor() : undefined;
      return dateModified ? { ...node, dateModified } : node;
    });
  });
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/<\/script/gi, '<\\/script');
  const merged = `<script type="application/ld+json">${json}</script>`;

  let seen = false;
  return html.replace(BLOCK, () => {
    if (seen) return '';
    seen = true;
    return merged;
  });
}

const htmlFiles = async (dir) =>
  (await readdir(dir, { withFileTypes: true, recursive: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath ?? e.path, e.name));

export default function mergeJsonLdIntegration() {
  return {
    name: 'merge-jsonld',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let merged = 0;
        const root = fileURLToPath(dir);
        for (const file of await htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const pathname = `/${file.slice(root.length).replace(/index\.html$/, '')}`;
          const out = mergeJsonLd(html, () => lastmodFor(pathname));
          if (out !== html) {
            await writeFile(file, out);
            merged += 1;
          }
        }
        logger.info(`merged JSON-LD into one @graph on ${merged} pages`);
      },
    },
  };
}

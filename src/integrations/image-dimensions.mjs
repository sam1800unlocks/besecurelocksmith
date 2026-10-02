// Lighthouse flags every <img> without both width and height ("Image elements do
// not have explicit width and height"), because the browser can't reserve space
// for it before it loads. Hand-writing sizes across components, imported blog
// HTML and JSON content is a losing game, so after the build this reads each
// local image's intrinsic size and fills in whichever attribute is missing.
//
// Safe for layout: Tailwind's preflight sets `img { height: auto }`, so CSS
// sizing (h-16 w-auto, w-full, …) still wins. The attributes only give the
// browser the aspect ratio. If one attribute is already set, the other is
// derived from the image's ratio so the pair stays consistent.
//
// Remote images (YouTube thumbnails, the BBB seal) can't be read here and must
// carry their sizes in the source.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const htmlFiles = async (dir) =>
  (await readdir(dir, { withFileTypes: true, recursive: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath ?? e.path, e.name));

export default function imageDimensions() {
  return {
    name: 'image-dimensions',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const sizes = new Map();
        const sizeOf = async (src) => {
          if (!sizes.has(src)) {
            sizes.set(src, sharp(join(root, decodeURIComponent(src)))
              .metadata()
              .then((m) => (m.width && m.height ? [m.width, m.height] : null))
              .catch(() => null));
          }
          return sizes.get(src);
        };

        let fixed = 0;
        const unknown = new Set();
        for (const file of await htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const tags = [...new Set(html.match(/<img\b[^>]*>/g) ?? [])];
          let out = html;
          for (const tag of tags) {
            const w = tag.match(/\swidth="(\d+)"/);
            const h = tag.match(/\sheight="(\d+)"/);
            if (w && h) continue;
            const src = tag.match(/\ssrc="(\/[^"?#]+)/)?.[1];
            if (!src || src.startsWith('//')) { unknown.add(tag.match(/\ssrc="([^"]*)"/)?.[1] ?? tag); continue; }
            const size = await sizeOf(src);
            if (!size) { unknown.add(src); continue; }
            const [iw, ih] = size;
            const width = w ? +w[1] : h ? Math.round((+h[1] * iw) / ih) : iw;
            const height = h ? +h[1] : Math.round((width * ih) / iw);
            const attrs = (w ? '' : ` width="${width}"`) + (h ? '' : ` height="${height}"`);
            out = out.split(tag).join(tag.replace(/^<img\b/, `<img${attrs}`));
            fixed++;
          }
          if (out !== html) await writeFile(file, out);
        }
        logger.info(`added dimensions to ${fixed} <img> tags`);
        if (unknown.size) logger.warn(`no dimensions for: ${[...unknown].join(', ')}`);
      },
    },
  };
}

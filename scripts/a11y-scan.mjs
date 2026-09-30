// Runs axe-core against every built page at desktop and mobile widths and
// writes a grouped report. Usage: npm run build && npm run preview (in another
// shell), then `node scripts/a11y-scan.mjs [baseUrl] [outFile]`.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const OUT = process.argv[3] ?? 'a11y-report.json';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const VIEWPORTS = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844 } };

function htmlPages(dir, root = dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return htmlPages(p, root);
    if (!name.endsWith('.html')) return [];
    const rel = '/' + relative(root, p).replace(/index\.html$/, '').replace(/\.html$/, '');
    return [rel];
  });
}

const paths = htmlPages('dist').sort();
const browser = await chromium.launch();
const byRule = {};
const incomplete = {};

async function scan(path, vpName) {
  const context = await browser.newContext({ viewport: VIEWPORTS[vpName] });
  const page = await context.newPage();
  try {
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    for (const [bucket, list] of [[byRule, r.violations], [incomplete, r.incomplete]]) {
      for (const v of list) {
        const e = (bucket[v.id] ??= { impact: v.impact, help: v.help, tags: v.tags, nodes: {} });
        for (const n of v.nodes) {
          const key = n.target.join(' ');
          const node = (e.nodes[key] ??= { html: n.html.slice(0, 300), summary: n.failureSummary, pages: new Set() });
          node.pages.add(`${path} [${vpName}]`);
        }
      }
    }
  } catch (err) {
    console.error('FAILED', path, vpName, err.message);
  } finally {
    await context.close();
  }
}

const jobs = paths.flatMap((p) => Object.keys(VIEWPORTS).map((vp) => [p, vp]));
const CONCURRENCY = 6;
for (let i = 0; i < jobs.length; i += CONCURRENCY) {
  await Promise.all(jobs.slice(i, i + CONCURRENCY).map(([p, vp]) => scan(p, vp)));
  process.stdout.write(`\r${Math.min(i + CONCURRENCY, jobs.length)}/${jobs.length}`);
}
await browser.close();

const serialise = (bucket) =>
  Object.fromEntries(
    Object.entries(bucket).map(([id, e]) => [
      id,
      { ...e, nodes: Object.entries(e.nodes).map(([t, n]) => ({ target: t, ...n, pageCount: n.pages.size, pages: [...n.pages].slice(0, 5) })) },
    ]),
  );
writeFileSync(OUT, JSON.stringify({ pages: paths.length, violations: serialise(byRule), incomplete: serialise(incomplete) }, null, 2));

console.log(`\n\nScanned ${paths.length} pages x ${Object.keys(VIEWPORTS).length} viewports\n`);
for (const [label, bucket] of [['VIOLATIONS', byRule], ['NEEDS REVIEW', incomplete]]) {
  console.log(`== ${label} ==`);
  for (const [id, e] of Object.entries(bucket)) {
    const pages = new Set(Object.values(e.nodes).flatMap((n) => [...n.pages]));
    console.log(`${e.impact ?? '-'}\t${id}\t${Object.keys(e.nodes).length} distinct elements, ${pages.size} page-views\t${e.help}`);
  }
}

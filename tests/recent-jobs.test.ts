import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RecentJobs from '../src/components/sections/RecentJobs.astro';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = 'https://be-secure-receptionist.fly.dev/jobs-widget.js';

test('renders the client widget mount point and its script, unaltered', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RecentJobs, { props: {} });
  expect(html).toContain('<div id="bsl-recent-jobs"');
  expect(html).toContain(`src="${SRC}"`);
  expect(html).toContain('async');
});

test('the mount div and the script stay together, in that order', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RecentJobs, { props: {} });
  const div = html.indexOf('id="bsl-recent-jobs"');
  const script = html.indexOf(SRC);
  expect(div).toBeGreaterThan(-1);
  expect(script).toBeGreaterThan(div);
});

// We add no markup of our own inside the mount: the widget owns that subtree.
test('leaves the mount point empty for the widget to fill', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RecentJobs, { props: {} });
  expect(html).toMatch(/<div id="bsl-recent-jobs"[^>]*>\s*<\/div>/);
});

// --- build output -----------------------------------------------------------
// Astro extracts scoped styles into a CSS bundle, so the collapse rule and the
// actual page placement can only be checked against dist.

test('the widget ships on the homepage, after the reviews section', () => {
  const html = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8');
  expect(html).toContain('<div id="bsl-recent-jobs"');
  expect(html).toContain(SRC);
  expect(html).toContain('async');
  // placed below Reviews, as the client asked. Match the element, not the bare
  // id — the id also appears earlier, in the inlined stylesheet.
  expect(html.indexOf('id="reviews"')).toBeLessThan(html.indexOf('<div id="bsl-recent-jobs"'));
});

test('the collapse rule is in the shipped CSS', () => {
  const html = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8');
  // Astro scopes the selector, e.g. #bsl-recent-jobs[data-astro-cid-xxx]:empty
  expect(html).toMatch(/#bsl-recent-jobs\[[^\]]+\]:empty\s*\{[^}]*min-height:\s*0/);
});

// Homepage only for now — the widget must not leak onto the area pages.
test('the widget is not on the service-area pages', () => {
  for (const slug of ['locksmith-gainesville-fl', 'locksmith-ocala-fl', 'locksmith-alachua-fl']) {
    const html = readFileSync(resolve(__dirname, `../dist/service-areas/${slug}/index.html`), 'utf8');
    expect(html).not.toContain('bsl-recent-jobs');
    expect(html).not.toContain('be-secure-receptionist.fly.dev');
  }
});

// The widget renders its own card and emits no structured data; the site keeps
// sole ownership of schema, so no second business node can appear.
test('the widget adds no JSON-LD and no phone of its own', () => {
  const html = readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8');
  expect(html).not.toContain('jobs-schema.json');
  expect(html).not.toContain('414-5351');
});

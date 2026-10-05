import { test, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

// The "Talk to Ava" voice widget is the client's own script, served from the
// receptionist server that runs their phone system. It mounts a floating button
// in a shadow root, streams mic audio to their server and shows a transcript;
// the consent line and the privacy link live inside the script, so updates to
// either happen on their side, not here.
const TAG = '<script is:inline defer src={avaSrc}></script>';
// Either the versioned, immutable file named by widget-version.json, or the
// plain /widget.js fallback if that lookup failed during the build.
const SRC = /be-secure-receptionist\.fly\.dev\/widget(\.[0-9a-f]+)?\.js/g;

const dist = resolve(__dirname, '../dist');
const page = (p: string) => readFileSync(resolve(dist, p), 'utf8');

const pages = (dir = dist): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '_astro' ? [] : pages(full);
    return entry.endsWith('.html') ? [full] : [];
  });

test('every page built from BaseLayout carries the widget exactly once', () => {
  const landing = ['new-home/index.html', 'commercial/index.html'].map((p) => resolve(dist, p));
  const all = pages().filter((f) => !landing.includes(f));
  expect(all.length).toBeGreaterThan(20);
  for (const file of all) {
    const html = readFileSync(file, 'utf8');
    expect(html.match(SRC)?.length ?? 0, `${file} should load the widget once`).toBe(1);
  }
});

// Astro would otherwise bundle the tag into its own JS; `is:inline` keeps it a
// plain script tag pointing at the client's server, which is the whole point —
// they update the widget without us redeploying.
test('the widget loads from the client server, deferred, not bundled', () => {
  const html = page('index.html');
  expect(html).toMatch(/<script defer src="https:\/\/be-secure-receptionist\.fly\.dev\/widget(\.[0-9a-f]+)?\.js"><\/script>/);
  // The build notes stay in the repo; they are not worth shipping on 153 pages.
  expect(html).not.toContain('receptionist server that runs their phone system');
});

// The ads landing pages have one job: the quote form. A second floating button
// competes with it, so Ava is deliberately absent there.
test('the ads landing pages stay free of the widget', () => {
  expect(page('new-home/index.html')).not.toMatch(SRC);
  expect(page('commercial/index.html')).not.toMatch(SRC);
});

// The widget asks for a name and phone number and saves the transcript, so the
// privacy policy has to say so. Sits with SMS, the other contact-channel section.
test('the privacy policy discloses the voice chat', () => {
  const html = page('privacy-policy/index.html');
  expect(html).toContain('Voice chat');
  expect(html).toMatch(/microphone audio is sent to our server, transcribed, and saved/);
  expect(html).toContain('Talk to Ava');
  expect(html.indexOf('SMS communications')).toBeLessThan(html.indexOf('Voice chat'));
});

// The versioned file is immutable for a year, which is what clears Lighthouse's
// cache audit; the plain name is only a fallback for a failed lookup.
test('the built site uses the versioned widget file when the lookup succeeds', async () => {
  const r = await fetch('https://be-secure-receptionist.fly.dev/widget-version.json').catch(() => null);
  if (!r?.ok) return; // client server unreachable; the fallback is correct then
  const { url } = await r.json();
  expect(page('index.html')).toContain(`<script defer src="${url}"></script>`);
});

test('the layout holds the tag verbatim', () => {
  expect(readFileSync(resolve(__dirname, '../src/layouts/BaseLayout.astro'), 'utf8')).toContain(TAG);
});

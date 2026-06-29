import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RelatedBlogs from '../../src/components/sections/RelatedBlogs.astro';

test('renders post cards that link out, with a heading', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [
    { title: 'How Do I Choose a Good Locksmith Company?', url: 'https://besecurelocksmith.com/blog/how-do-i-choose-a-good-locksmith-company/' },
  ] } });
  expect(html).toContain('How Do I Choose a Good Locksmith Company?');
  expect(html).toContain('href="https://besecurelocksmith.com/blog/how-do-i-choose-a-good-locksmith-company/"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('Read article');
});

test('renders the featured image when a post has one', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [
    { title: 'Smart Lock Mistakes', url: 'https://besecurelocksmith.com/blog/smart/', image: '/img/blog/smart-lock-installation-mistakes.webp' },
  ] } });
  expect(html).toContain('src="/img/blog/smart-lock-installation-mistakes.webp"');
  expect(html).toContain('alt="Smart Lock Mistakes"');
});

test('falls back to a branded placeholder when a post has no image', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [
    { title: 'No Image Post', url: 'https://besecurelocksmith.com/blog/none/' },
  ] } });
  expect(html).not.toContain('<img');
  expect(html).toContain('repeating-linear-gradient');   // stripe placeholder
});

test('renders nothing when there are no posts', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [] } });
  expect(html.trim()).toBe('');
});

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

test('renders nothing when there are no posts', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(RelatedBlogs, { props: { posts: [] } });
  expect(html.trim()).toBe('');
});

import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BlogCard from '../src/components/sections/BlogCard.astro';

const post = {
  title: 'Why Ocala, FL Businesses Are Switching to IC Core Lock Systems',
  excerpt: 'Interchangeable core locks let businesses rekey in seconds.',
  image: '/img/blog/why-ocala-fl-businesses-are-switching-to.jpg',
  category: 'Commercial Locksmith',
  date: '2026-06-04',
  url: 'https://besecurelocksmith.com/blog/why-ocala-fl-businesses-are-switching-to-ic-core-lock-systems/',
};

test('BlogCard renders image, category badge, title, excerpt, date, and an external link', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BlogCard, { props: { post } });
  expect(html).toContain(`src="${post.image}"`);
  expect(html).toContain('Commercial Locksmith');          // category badge
  expect(html).toContain(post.title);
  expect(html).toContain(post.excerpt);
  expect(html).toContain('Jun 4, 2026');                   // formatted date
  expect(html).toContain(`href="${post.url}"`);
  expect(html).toContain('target="_blank"');
  expect(html).toContain('Read article');
});

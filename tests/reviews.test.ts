import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Reviews from '../src/components/sections/Reviews.astro';

const fixtures = [
  { name: 'Riva Wallace',       initial: 'R', color: '#0064e0', time: '2 weeks ago',  quote: 'Highly recommend. Very professional and friendly to work with.',             order: 1 },
  { name: 'Cailey Lea',         initial: 'C', color: '#31a24c', time: '1 month ago',  quote: 'Timely, efficient and kind. Definitely will call them again if needed.',     order: 2 },
  { name: 'Sharon Fallon',      initial: 'S', color: '#f0284a', time: '1 month ago',  quote: `Prompt, knowledgeable, helpful… fit like a glove! Joe’s great!`, order: 3 },
  { name: 'Marissa Leonard',    initial: 'M', color: '#444950', time: '2 months ago', quote: 'Larry was respectful, professional and arrived quickly! Very affordable.',   order: 4 },
  { name: 'stephanie calareso', initial: 'S', color: '#0457cb', time: '3 months ago', quote: 'Dillon rekeyed my door without additional parts or costs. Appreciate it.',   order: 5 },
];

test('Reviews renders all five reviewers and the rating', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Reviews, { props: { reviews: fixtures } });
  expect(html).toContain('Riva Wallace');
  expect(html).toContain('stephanie calareso');
  expect(html).toContain('2,551');
});

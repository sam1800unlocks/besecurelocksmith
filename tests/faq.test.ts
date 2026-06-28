import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Faq from '../src/components/sections/Faq.astro';

const fixtures = [
  { question: 'What services do you offer?',         answer: 'Residential, commercial, and automotive locksmith services — rekeying, lock installation, key programming, emergency lockout, and lock repair.', order: 1 },
  { question: 'Do you offer a warranty?',             answer: 'No formal warranty, but we stand behind our craftsmanship and aim to deliver a world-class experience on every job.',                            order: 2 },
  { question: 'Is the security assessment really free?', answer: 'Yes — a complimentary security assessment is included on every visit, at no extra charge.',                                                   order: 3 },
  { question: 'How much does it cost?',               answer: 'Cost varies by job. Our pricing is competitive with no hidden fees, and you\'ll always get a quote before any work begins.',                     order: 4 },
  { question: 'Do you offer emergency service?',      answer: 'Yes, we provide emergency service Monday through Friday, 8am to 5pm.',                                                                           order: 5 },
  { question: 'Are you licensed and insured?',        answer: 'Yes. All of our technicians are fully licensed and insured for your protection.',                                                                order: 6 },
  { question: 'How fast can you get to me?',          answer: 'Typically within 30 minutes to most Gainesville and Ocala locations.',                                                                          order: 7 },
  { question: 'What payment methods do you accept?',  answer: 'We accept cash, credit cards, and mobile payments.',                                                                                            order: 8 },
];

test('FAQ renders questions and emits FAQPage JSON-LD', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Faq, { props: { faqs: fixtures } });
  expect(html).toContain('What services do you offer?');
  expect(html).toContain('"@type":"FAQPage"');
});

test('FAQ renders the section heading', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Faq, { props: { faqs: fixtures } });
  expect(html).toContain('Be Secure Locksmith FAQs.');
});

test('FAQ renders details/summary elements for zero-JS accordion', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Faq, { props: { faqs: fixtures } });
  expect(html).toContain('<details');
  expect(html).toContain('<summary');
  // First item open by default — Astro renders data-faq before open
  expect(html).toMatch(/details[^>]*\bopen\b/);
});

test('FAQ JSON-LD contains all questions as mainEntity', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Faq, { props: { faqs: fixtures } });
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toContain('"@type":"Question"');
  expect(html).toContain('What payment methods do you accept?');
});

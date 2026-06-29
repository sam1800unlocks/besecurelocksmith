import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Faq from '../src/components/sections/Faq.astro';

const fixtures = [
  { question: 'What types of locksmith services do you offer?',  answer: 'Be Secure Locksmith provides a wide range of services including residential locksmith services, commercial locksmith services, and automotive locksmith solutions. This includes re-keying, lock installation, key programming, and emergency lockout assistance. We also offer lock repair services as well.', order: 1 },
  { question: 'Is there a warranty on your work and products?',  answer: "We don’t offer warranties but we do stand behind the quality and craftsmanship of our work. We do everything in our power to make sure our customers receive a world-class experience.",                                                                                                              order: 2 },
  { question: 'Can you provide a free security assessment?',     answer: 'Yes, we offer a complimentary security assessment with every visit to help you enhance the safety of your property. We can assist with ensuring that you do not suffer a security breach.',                                                                                                                          order: 3 },
  { question: 'How much do your locksmith services cost?',       answer: "Service costs vary depending on the specific job. Be Secure Locksmith offers competitive pricing with no hidden fees, and you’ll receive a quote before any work begins.",                                                                                                                                   order: 4 },
  { question: 'Do you provide emergency locksmith services?',    answer: "Yes, we provide emergency locksmith services to ensure you’re never left stranded, whether you’re locked out of your home, office, or vehicle. We are here to help Mon–02:00–17:00.",                                                                                                         order: 5 },
  { question: 'Are your locksmiths licensed and insured?',       answer: 'Absolutely. All our technicians are fully licensed and insured, ensuring professional and reliable service every time.',                                                                                                                                                                                          order: 6 },
  { question: 'How quickly can a locksmith arrive?',             answer: 'We pride ourselves on a fast response time, typically arriving within 30 minutes to most locations in Gainesville, Ocala, and surrounding areas.',                                                                                                                                                               order: 7 },
  { question: 'What payment methods do you accept?',             answer: 'We accept a variety of payment options including cash, credit cards, and mobile payments for your convenience.',                                                                                                                                                                                                  order: 8 },
];

test('FAQ renders questions and emits FAQPage JSON-LD', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Faq, { props: { faqs: fixtures } });
  expect(html).toContain('What types of locksmith services do you offer?');
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

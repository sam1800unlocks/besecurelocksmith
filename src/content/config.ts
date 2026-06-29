import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    desc: z.string(),
    order: z.number(),
    photo: z.string().optional(),
    href: z.string().optional(),
    focal: z.string().optional(),
  }),
});

const reviews = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    initial: z.string(),
    color: z.string(),
    time: z.string(),
    quote: z.string(),
    order: z.number(),
  }),
});

const faqs = defineCollection({
  type: 'data',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number(),
  }),
});

const serviceAreas = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    city: z.string(),
    title: z.string(),
    description: z.string(),
    heroSubhead: z.string(),
    intro: z.array(z.string()),
    location: z.string().default('main'),
    order: z.number(),
    county: z.string().optional(),
    zips: z.array(z.string()).default([]),
    office: z.enum(['gainesville', 'ocala']).default('gainesville'),
    responseTime: z.string().default('~30 min'),
    relatedBlogs: z.array(z.object({ title: z.string(), url: z.string(), image: z.string().optional() })).default([]),
  }),
});

export const collections = { services, reviews, faqs, 'service-areas': serviceAreas };

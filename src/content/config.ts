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

const blog = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    image: z.string(),
    category: z.string(),
    date: z.string(),   // ISO YYYY-MM-DD
    url: z.string(),
    // Present only for posts that have an internal page built from migrated content:
    body: z.array(z.string()).optional(),   // HTML blocks
    author: z.string().optional(),
    heroImage: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
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
    // Optional per-city FAQs (pulled from live); when absent, FAQs are generated.
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    // Optional list of local neighborhoods served (rendered as chips).
    neighborhoods: z.array(z.string()).default([]),
  }),
});

export const collections = { services, reviews, faqs, blog, 'service-areas': serviceAreas };

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

export const collections = { services, reviews, faqs };

import { getCollection } from 'astro:content';

export const PAGE_SIZE = 9;

export const catSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function allPosts() {
  return (await getCollection('blog'))
    .map((e) => e.data)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export interface Category { name: string; slug: string; count: number; }

export function categoriesOf(posts: { category: string }[]): Category[] {
  const m = new Map<string, number>();
  for (const p of posts) m.set(p.category, (m.get(p.category) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, slug: catSlug(name), count }));
}

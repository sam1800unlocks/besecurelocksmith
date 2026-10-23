// Internal-link selection for blog posts and service pages.

interface PostLike { slug: string; category: string; date: string; body?: string[] }

const hasPage = (p: PostLike) => Array.isArray(p.body) && p.body.length > 0;
const newestFirst = <T extends PostLike>(a: T, b: T) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug < b.slug ? -1 : 1);

/**
 * "Related posts" for a post: the posts right after it, newest-first and
 * wrapping around — `n - 1` from its own category, then the next post in the
 * whole blog. So every post is picked by the post before it in its category,
 * and a post alone in its category by the post before it in the blog. No post
 * is left linked only from the noindexed pagination pages, which is what
 * picking the newest posts per category did to the older half of the blog.
 */
export function relatedPosts<T extends PostLike>(post: T, all: T[], n = 3): T[] {
  const pool = all.filter(hasPage);
  const ring = (list: T[]) => {
    const sorted = [...list].sort(newestFirst);
    const i = sorted.findIndex((p) => p.slug === post.slug);
    return Array.from({ length: sorted.length - 1 }, (_, k) => sorted[(i + 1 + k) % sorted.length]);
  };
  const sameCategory = ring(pool.filter((p) => p.category === post.category || p.slug === post.slug));
  const picked = sameCategory.slice(0, n - 1);
  for (const p of [...ring(pool), ...sameCategory]) {
    if (picked.length >= n) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}

/**
 * Posts whose slug contains one of the keywords. Keywords are listed most
 * specific first, and a post ranks by the first keyword it matches, then
 * newest first.
 */
export function postsForService<T extends PostLike>(all: T[], keywords: readonly string[], n = 4): T[] {
  const rank = (p: T) => keywords.findIndex((k) => p.slug.includes(k));
  return all
    .filter((p) => hasPage(p) && rank(p) >= 0)
    .sort((a, b) => rank(a) - rank(b) || newestFirst(a, b))
    .slice(0, n);
}

/**
 * Slug keywords that pick a service page's "Further reading" posts. Matching
 * on the slug keeps it automatic as new posts are imported; check the built
 * page when adding a keyword, since a loose one pulls in off-topic posts.
 */
export const serviceReadingKeywords: Record<string, readonly string[]> = {
  'automotive-locksmith': ['car-', 'key-fob', 'ignition', 'transponder', 'automotive'],
  'car-key-programming': ['key-fob', 'transponder'],
  'car-key-replacement': ['spare-car-key', 'transponder', 'without-the-original', 'key-fob'],
  'emergency-lockouts': ['emergency-home-lockouts', 'emergency-locksmith', 'office-lockouts', 'building-lockout'],
  'ignition-repair': ['ignition'],
  'interchangeable-core-locks': ['interchangeable-core', 'ic-core'],
  'key-duplication': ['duplicat', 'spare-car-key', 'without-the-original'],
  'lock-rekeying': ['when-should-you-rekey', 'lock-rekey-vs', 'rekeying-your-locks', 'rekey-your-locks', 'rental-property-rekeying', 'rekeying-at-scale'],
  'lock-repair': ['repair-vs-replacement', 'lock-problems', 'key-wont-turn', 'not-latching', 'lock-maintenance'],
  'mailbox-lock-installation': ['mailbox', 'mailroom'],
  'master-key-systems': ['master-key', 'key-control'],
  'new-lock-installation': ['new-lock-installation', 'common-lock-replacements', 'decorative-door-hardware', 'lock-replacement-planning'],
  'property-management': ['tenant-turnover', 'key-control', 'new-home-key-audit', 'mailroom'],
  'residential-locksmith': ['front-door', 'window-lock', 'moving-to', 'buying-a-home', 'door-jamb', 'home-more-secure'],
  'safe-locksmith': ['safe-combo', 'home-safe', 'safe-location', 'safe-owner', 'safe-locksmith'],
  'smart-lock-installation': ['smart-lock'],
  'commercial-locksmith': ['commercial', 'businesses', 'exit-door', 'office-lockout', 'security-audits'],
};

/**
 * Product guides a service page links to besides the ones that name it as
 * their service (`service.href` in src/data/products.ts).
 */
export const serviceExtraGuides: Record<string, readonly string[]> = {
  'residential-locksmith': ['deadbolts', 'smart-locks', 'keypad-locks', 'lever-sets'],
  'commercial-locksmith': ['master-key-ic'],
  'interchangeable-core-locks': ['master-key-ic'],
  'property-management': ['master-key-ic', 'keypad-locks', 'padlocks-mailbox-locks'],
  'lock-repair': ['deadbolts', 'lever-sets', 'mortise-locks', 'door-closers'],
  'lock-rekeying': ['master-key-ic'],
  'key-duplication': ['high-security-locks'],
  'new-lock-installation': ['smart-locks', 'high-security-locks'],
};

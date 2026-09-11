import type { CollectionEntry } from 'astro:content';

/**
 * Purely cosmetic: assigns each post a library-catalog-style call number
 * (e.g. "24-003") based on its publish year and chronological order.
 * Not used for routing or backlinks — just the little stamp in the
 * corner of each index card.
 */
export function callNumbers(posts: CollectionEntry<'blog'>[]): Map<string, string> {
  const sorted = [...posts].sort(
    (a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf()
  );
  const countByYear = new Map<string, number>();
  const result = new Map<string, string>();

  for (const post of sorted) {
    const year = String(post.data.pubDate.getFullYear()).slice(-2);
    const next = (countByYear.get(year) ?? 0) + 1;
    countByYear.set(year, next);
    result.set(post.id, `${year}-${String(next).padStart(3, '0')}`);
  }

  return result;
}

import { getCollection, type CollectionEntry } from 'astro:content';

export type BacklinkEntry = {
  slug: string;
  title: string;
};

/**
 * Backlinks work by convention, not magic: link to another post the normal
 * Markdown way, using its site-relative URL:
 *
 *   See my [earlier note on tide pools](/blog/tide-pools/).
 *
 * At build time we scan every post's raw Markdown body for links that point
 * at `/blog/<slug>` (with or without a trailing slash, with or without the
 * configured `base` path prefix) and build a reverse index: for every post,
 * which OTHER posts link to it. That reverse index is what gets rendered as
 * "Referenced by" on each post page.
 */

let cache: Map<string, BacklinkEntry[]> | null = null;

function stripBase(path: string, base: string): string {
  if (base && base !== '/' && path.startsWith(base)) {
    return path.slice(base.length);
  }
  return path;
}

function extractLinkedSlugs(body: string, base: string): Set<string> {
  const slugs = new Set<string>();
  // Matches Markdown links: [text](/blog/some-slug) or (/base/blog/some-slug/)
  const linkPattern = /\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(body)) !== null) {
    const rawHref = match[1].trim().split(/\s+/)[0]; // drop optional "title"
    const href = stripBase(rawHref, base);
    const blogMatch = href.match(/^\/blog\/([^/?#]+)\/?$/);
    if (blogMatch) {
      slugs.add(blogMatch[1]);
    }
  }
  return slugs;
}

async function buildIndex(base: string): Promise<Map<string, BacklinkEntry[]>> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const bySlug = new Map<string, CollectionEntry<'blog'>>();
  for (const post of posts) bySlug.set(post.id, post);

  const index = new Map<string, BacklinkEntry[]>();

  for (const post of posts) {
    const linkedSlugs = extractLinkedSlugs(post.body ?? '', base);
    for (const targetSlug of linkedSlugs) {
      if (targetSlug === post.id) continue; // ignore self-links
      if (!bySlug.has(targetSlug)) continue; // ignore links to posts that don't exist
      const existing = index.get(targetSlug) ?? [];
      if (!existing.some((e) => e.slug === post.id)) {
        existing.push({ slug: post.id, title: post.data.title });
      }
      index.set(targetSlug, existing);
    }
  }

  return index;
}

/** Returns the posts that link TO the given slug. Result is memoized per build. */
export async function getBacklinksFor(slug: string, base = '/'): Promise<BacklinkEntry[]> {
  if (!cache) {
    cache = await buildIndex(base);
  }
  return cache.get(slug) ?? [];
}

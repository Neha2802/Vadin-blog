import { visit } from 'unist-util-visit';

/**
 * Posts are written with plain, portable root-relative links, e.g.
 *   [tide pools](/blog/tide-pools/)
 * That's what makes the backlinks scanner simple. But when the site is
 * deployed under a GitHub Pages subpath (base: '/repo-name'), those links
 * need the base prepended at render time or they'll 404 for readers.
 *
 * This only rewrites hrefs that start with a single "/" (root-relative) and
 * aren't already prefixed with base — external links, anchors, mailto:,
 * etc. are left untouched.
 *
 * The `base` argument is passed from `astro.config.mjs` as
 * `import.meta.env.BASE_URL` (Astro's *resolved* base, which honors the
 * `--base` CLI flag). When you run `npm run dev:local` / `build:local` /
 * `preview:local`, Astro passes `--base /`, so `BASE_URL` becomes `/`,
 * `normalizedBase` becomes `''`, and this plugin becomes a no-op — leaving
 * your links at the domain root for clean local testing. In production
 * (where base is e.g. `/my-blog/`), links get rewritten to
 * `/my-blog/blog/...` as expected.
 */
export function rehypeBaseUrl(base) {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  return function transformer(tree) {
    if (!normalizedBase) return;

    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || !node.properties || typeof node.properties.href !== 'string') {
        return;
      }
      const href = node.properties.href;
      const isRootRelative = href.startsWith('/') && !href.startsWith('//');
      const alreadyPrefixed = href === normalizedBase || href.startsWith(`${normalizedBase}/`);
      if (isRootRelative && !alreadyPrefixed) {
        node.properties.href = normalizedBase + href;
      }
    });
  };
}

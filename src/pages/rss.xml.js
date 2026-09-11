import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteBase } from '../utils/base';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  // @astrojs/rss resolves relative `link`s against `site` only — it doesn't
  // know about `base`, so we prepend it ourselves.
  const base = siteBase(import.meta.env.BASE_URL);
  return rss({
    title: "Vadin's Blog",
    description: 'A small, hand-linked blog.',
    // `site` doubles as the feed's channel <link>, so fold `base` into it
    // here (item links below are resolved against this too, but since they
    // start with "/" they replace the path rather than concatenate — see
    // WHATWG URL resolution — so this doesn't double up the base).
    site: new URL(base, context.site).toString(),
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `${base}blog/${post.id}/`,
      })),
  });
}

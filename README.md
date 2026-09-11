# Vadin's Blog — an Astro blog with automatic backlinks

A small static blog, built with [Astro](https://astro.build), where posts that link to each
other automatically show up as "Referenced by" on both ends — no wiki syntax, no database, no
plugin to configure. It is deployed to **GitHub Pages** by a GitHub Actions workflow on every
push to `main`.

See [`README_SHIR.md`](./README_SHIR.md) for build, deploy, and content-authoring notes.

## How the backlinks work

Write posts with ordinary Markdown links, using a post's site-relative URL:

```md
See my earlier note on [tide pools](/blog/tide-pools/).
```

At build time, `src/utils/backlinks.ts` reads every post's raw Markdown source, finds links
that point at `/blog/<slug>`, and builds a reverse index. Each post page
(`src/pages/blog/[...slug].astro`) looks itself up in that index and renders a "Referenced by"
list at the bottom. There's nothing to keep in sync by hand — rename or delete a post and its
backlinks disappear on the next build; add a new link and it appears.

Seven example posts in `src/content/blog/` demonstrate this — read `tide-pools.md` and then look
at how `keeping-a-field-notebook.md`, `the-slow-eye.md`, `moth-nights.md`, and
`a-year-of-phenology.md` all link back to it.

## Automatic frontmatter for new posts

Every post has to declare `title`, `description`, `pubDate`, and `tags` in its YAML frontmatter
because that's what the content collection's schema validates. If you drop a fresh `.md` file
into `src/content/blog/` without any frontmatter, the prebuild script
(`scripts/auto-frontmatter.mjs`) fills in the missing fields before Astro sees the file:

- `title` — derived from the first `# Heading` in the body, falling back to a title-cased
  version of the filename (`a-year-of-phenology.md` → `"A Year Of Phenology"`).
- `description` — first paragraph of the body, collapsed to one line and truncated at a word
  boundary (with an ellipsis) at 160 chars.
- `pubDate` — the file's mtime, formatted `YYYY-MM-DD`.
- `tags` — empty array.

Only missing/empty fields are filled in — anything you've already written by hand is preserved
verbatim. The script writes the synthesized values back to the file so the next build is a
no-op for that post.

Files starting with `_` are intentionally skipped (the loader glob excludes them), so
`src/content/blog/_draft.md` is safe as a true scratch file.

The script runs as `prebuild` (and `predev` / `prebuild:local` / `predev:local`), wired in
`package.json`, so you don't have to remember to invoke it. Run it on its own any time with:

```bash
npm run frontmatter
```

## Project structure

```
src/
  content/blog/*.md          — your posts (frontmatter: title, description, pubDate, tags, draft)
  content.config.ts          — the blog collection's schema
  pages/
    index.astro               — homepage, recent posts
    blog/index.astro          — full post index
    blog/[...slug].astro      — individual post template (renders backlinks)
    tags/[tag].astro          — posts filtered by tag
    about.astro
    404.astro
    rss.xml.js                — RSS feed
  components/                 — Header, Footer, PostCard, BackLinks
  layouts/BaseLayout.astro
  utils/
    backlinks.ts               — the backlink scanner/index
    callNumbers.ts              — cosmetic "call number" stamp on post cards
    rehype-base-url.mjs         — rewrites in-content links for the GitHub Pages subpath
scripts/
  auto-frontmatter.mjs         — prebuild script that fills in missing post frontmatter
.github/workflows/
  deploy.yml                   — GitHub Actions: build + deploy to Pages on push to main
astro.config.mjs                — site/base config + markdown processor
```

## License

Do whatever you'd like with this template.

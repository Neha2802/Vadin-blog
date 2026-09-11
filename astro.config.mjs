// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { rehypeBaseUrl } from './src/utils/rehype-base-url.mjs';

// ---------------------------------------------------------------------------
// GitHub Pages configuration
// ---------------------------------------------------------------------------
// This repo is published to GitHub Pages from a `gh-pages`-style deploy by a
// GitHub Actions workflow (see `.github/workflows/deploy.yml`), not by pushing
// from your machine. The `site` + `base` values below are read at build time
// and folded into every URL Astro emits (RSS, sitemap, canonical, asset
// rewriting), so they MUST match the URL readers actually visit.
//
//   site:  https://<org-or-user>.github.io   ← what every absolute URL starts with
//   base:  /<repo-name>                      ← the project-page subpath
//
// Result: site + base + path → https://<org-or-user>.github.io/<repo-name>/<path>
//
// Replace YOUR_GITHUB_USERNAME and YOUR_REPO_NAME in both places below.
// ---------------------------------------------------------------------------
const SITE_OWNER = 'Neha2802';
const REPO_NAME = 'Vadin-blog';

const base = `/${REPO_NAME}`;

export default defineConfig({
  site: `https://${SITE_OWNER}.github.io`,
  base,
  markdown: {
    // Posts link to each other with plain root-relative URLs like
    // /blog/some-slug/ (this is also what the backlinks scanner reads).
    // This plugin rewrites those to include `base` at render time, so
    // the links work once deployed under a GitHub Pages subpath.
    //
    // Note: when running with `npm run dev:local` / `build:local` / `preview:local`,
    // Astro's BASE_URL is '/' so `rehypeBaseUrl('/')` becomes a no-op and links
    // resolve at the domain root — exactly what you want for local testing.
    processor: unified({
      // Pass Astro's *resolved* base (import.meta.env.BASE_URL) — not the
      // local `base` const above — so the `--base /` flag from
      // `npm run dev:local` / `build:local` / `preview:local` actually
      // reaches the rewriter. When BASE_URL is '/', normalizedBase becomes
      // '' and the plugin becomes a no-op, leaving your root-relative links
      // at the domain root for clean local testing.
      rehypePlugins: [[rehypeBaseUrl, import.meta.env.BASE_URL ?? base]],
    }),
  },
});

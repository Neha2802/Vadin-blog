# Vadin's Blog — deployment & changes notes

Personal reference for building, deploying, and updating the blog. The public overview lives
in [`README.md`](./README.md); everything operational is here.

## Writing a new post

Add a Markdown file to `src/content/blog/`, e.g. `src/content/blog/my-post.md`. The filename
(minus `.md`) becomes the URL slug: `my-post.md` → `/blog/my-post/`.

You can drop the file in **with no frontmatter at all** — the prebuild script
(`scripts/auto-frontmatter.mjs`) will fill in `title`, `description`, `pubDate`, and `tags`
from the filename and the body on the next build. Or write the frontmatter by hand if you
want fine-grained control:

```md
---
title: My post title
description: One sentence for the index card and RSS feed.
pubDate: 2026-01-15
tags: [observation]
---

Your content here. Link to another post with `[link text](/blog/other-post-slug/)`
to create a backlink automatically.
```

Set `draft: true` to keep a post out of the published feed while still iterating on it
(it still gets the auto-frontmatter treatment, but won't appear on the site).

## Run it locally

```bash
npm install
npm run dev
```

The `dev` / `build` / `preview` scripts above run the site at the same subpath it will use
in production (e.g. `http://localhost:4321/Vadin-blog/`), so what you see locally matches what
readers will see after deployment.

When you want to iterate quickly without the GitHub Pages subpath getting in the way —
handy while you're still setting things up, or just for a cleaner URL — use the `:local`
variants instead:

```bash
npm run dev:local      # live dev server at http://localhost:4321/
npm run build:local    # production build with base '/'  (writes to dist/)
npm run preview:local  # serve the built dist/ at http://localhost:4321/
```

These pass `astro dev/build/preview --base /`, which overrides the `base` configured in
`astro.config.mjs`. Your in-content root-relative links (e.g. `/blog/tide-pools/`) resolve at
the domain root while you iterate, and the `rehype-base-url` plugin becomes a no-op so it
doesn't prepend anything. **None of these local commands touch GitHub** — they're purely for
testing on your machine. When you're happy with what you see, just push to `main` and the
GitHub Actions workflow deploys it.

## Deploying — GitHub Actions on every push

This repo is deployed by **`.github/workflows/deploy.yml`**, which runs on every push to
`main` (and on manual dispatch from the Actions tab):

1. Checks out the repo
2. Sets up Node 22 (matching `engines.node` in `package.json`)
3. Runs `npm ci`
4. Runs `npm run build` — which itself runs `npm run prebuild` first, so the
   auto-frontmatter script fires before Astro loads the content collection
5. Uploads `./dist/` as a Pages artifact
6. The `deploy-pages` action publishes it to GitHub Pages under the protected
   `github-pages` environment

### One-time setup on GitHub

1. **Create the repo** at <https://github.com/Neha2802/Vadin-blog> (if it doesn't already
   exist). Either initialize it empty and push to it, or fork/import — but don't initialize
   it with a README, since you'll be pushing one.

2. **Enable Pages from GitHub Actions**: in the repo, go to **Settings → Pages**, and under
   "Build and deployment" set **Source: GitHub Actions**. You don't pick a branch — the
   workflow handles publishing.

3. **Push the code**:

   ```bash
   git init
   git add .
   git commit -m "Initial blog setup"
   git branch -M main
   git remote add origin https://github.com/Neha2802/Vadin-blog.git
   git push -u origin main
   ```

4. **Watch the deploy**: go to the **Actions** tab. The first run will:
   - Run the workflow
   - Create the `github-pages` environment (or you may need to do this manually under
     Settings → Environments)
   - Publish to <https://neha2802.github.io/Vadin-blog/>

After that, every push to `main` is a deploy. The Actions tab shows status, and any
deployment failures show up there too.

### Alternative: manual `gh-pages` deploy

If you'd rather not use Actions for some reason (e.g. you're behind a corporate firewall that
blocks `actions/deploy-pages`), the `deploy` script is still wired in `package.json`:

```bash
npm run deploy
```

This builds and pushes the contents of `dist/` to a `gh-pages` branch. You'd then point
Pages at that branch under Settings → Pages → Source: "Deploy from a branch". The Actions
workflow and the manual deploy target different branches, so they don't conflict — pick one.

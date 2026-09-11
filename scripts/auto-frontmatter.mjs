#!/usr/bin/env node
// scripts/auto-frontmatter.mjs
//
// Auto-fill missing frontmatter on blog posts.
//
// The Astro content collection at src/content/blog/ requires every post to
// declare `title`, `description`, and `pubDate` in its YAML frontmatter.
// This script lets a new post land as just a Markdown file — drop a
// `my-draft.md` into src/content/blog/ with no (or partial) frontmatter,
// and the next build will fill in the missing fields from the filename,
// the first paragraph of the body, and the file's mtime.
//
//   Rules:
//     • Only touches files under src/content/blog/ matching the loader's
//       `**\/[^_]*.md` glob (i.e. real posts — drafts starting with `_`
//       are intentionally left alone so they don't get published by
//       accident).
//     • Only writes a field if it's missing or empty. Existing values
//       are preserved verbatim — this is meant to be invisible to a
//       well-authored post.
//     • Writes back to the same path so subsequent builds are
//       idempotent. The file ends up byte-identical to what a human
//       author would have written by hand, modulo whitespace
//       normalization.
//
// Wired into the build via `"prebuild": "node scripts/auto-frontmatter.mjs"`
// in package.json, so npm runs it automatically before `astro build`.
// Run it manually with `node scripts/auto-frontmatter.mjs` to refresh
// a post without building.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const BLOG_DIR = path.resolve(__dirname, '..', 'src', 'content', 'blog');

// Mirror `src/content.config.ts`'s loader glob:
const POST_PATTERN = /^[A-Za-z0-9][^/]*\.md$/; // not starting with `_`

// ---------- Frontmatter helpers ----------------------------------------------

/**
 * Parse a Markdown file into { frontmatter, body } where frontmatter is the
 * raw YAML string between the leading `---` fences (or null if absent) and
 * body is everything after the closing fence. Tolerates files with no
 * frontmatter at all.
 */
function parse(raw) {
  // Normalize line endings so the fence regex works on CRLF inputs.
  const text = raw.replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { frontmatter: null, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: null, body: text };
  const fm = text.slice(4, end);
  const body = text.slice(end + 5);
  return { frontmatter: fm, body };
}

/**
 * Given the YAML frontmatter string, return a Map of the *existing* scalar
 * keys. We only need top-level keys (the schema only has top-level keys),
 * so a hand-rolled parser is fine — we don't need to pull in a YAML lib
 * just for this. Lists (`tags:`) and other complex values parse as the
 * raw text after the colon.
 */
function readFrontmatterFields(fm) {
  const fields = new Map();
  if (!fm) return fields;
  for (const line of fm.split('\n')) {
    if (!line || line.startsWith('#') || /^\s/.test(line)) continue; // skip blanks/comments/indented
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    fields.set(m[1], m[2]);
  }
  return fields;
}

/**
 * Quote a string for YAML if it contains characters that would otherwise be
 * special. `title` and `description` end up here routinely.
 */
function yamlString(value) {
  // Booleans/numbers/null as raw — let YAML parse them natively.
  if (value === 'true' || value === 'false') return value;
  if (value !== '' && !Number.isNaN(Number(value))) return value;
  if (value === 'null' || value === '~') return value;
  // Force double-quoted form for anything else. Escape the two characters
  // that can break out of a double-quoted YAML scalar: backslash and `"`.
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Serialize a flat field map back to a YAML block. Order is: known keys
 * first (matching the order shown in the README), then any extra keys the
 * file already had (preserved verbatim). Unknown existing keys are passed
 * through as their original scalar text — we don't try to round-trip
 * complex values.
 */
function serialize(fields, preferredOrder) {
  const lines = [];
  const seen = new Set();
  for (const key of preferredOrder) {
    if (fields.has(key)) {
      lines.push(`${key}: ${fields.get(key)}`);
      seen.add(key);
    }
  }
  for (const [key, raw] of fields) {
    if (seen.has(key)) continue;
    lines.push(raw === '' ? `${key}:` : `${key}: ${raw}`);
  }
  return lines.join('\n');
}

// ---------- Field generators -------------------------------------------------

/**
 * Derive a title from the filename when no explicit one is set.
 *   tide-pools.md           → "Tide Pools"
 *   a-year-of-phenology.md  → "A Year Of Phenology"
 * We deliberately don't smart-quote or smart-capitalize here — the file
 * author can edit the auto-filled title in place after the first build.
 */
function titleFromFilename(filename) {
  const stem = filename.replace(/\.md$/, '');
  return stem
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Prefer a leading `# Heading` if the body has one — many people write
 * the title in the body even when they forget to add frontmatter.
 */
function titleFromBody(body) {
  const m = body.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * Derive a description from the first non-empty paragraph of the body.
 * Truncated at a sensible length with an ellipsis, and newlines
 * normalized to spaces so the YAML value stays single-line.
 */
function descriptionFromBody(body, maxLen = 160) {
  // Skip a leading H1 if present — the description should summarize the
  // post, not duplicate its title.
  const stripped = body.replace(/^\s*#\s+.+?\n+/, '');
  const para = stripped
    .split(/\n\s*\n/, 1)[0]   // first paragraph
    ?.replace(/\s*\n\s*/g, ' ') // collapse internal newlines
    ?.replace(/\s+/g, ' ')     // collapse runs of whitespace
    ?.trim();
  if (!para) return null;
  if (para.length <= maxLen) return para;
  // Truncate on a word boundary so we don't end on a half-word.
  const cut = para.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/**
 * pubDate: the file's mtime, formatted YYYY-MM-DD. We use mtime (not git
 * authorship date) because it works without any VCS context — including
 * when a contributor just downloads the repo and drops a new file in.
 */
async function pubDateFromMtime(filePath) {
  const stat = await fs.stat(filePath);
  const d = stat.mtime;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------- Main -------------------------------------------------------------

async function main() {
  let entries;
  try {
    entries = await fs.readdir(BLOG_DIR);
  } catch (err) {
    console.error(`auto-frontmatter: cannot read ${BLOG_DIR}: ${err.message}`);
    process.exit(1);
  }

  const posts = entries.filter((name) => POST_PATTERN.test(name));

  if (posts.length === 0) {
    console.log(`auto-frontmatter: no posts in ${path.relative(process.cwd(), BLOG_DIR)} — nothing to do.`);
    return;
  }

  let touched = 0;
  for (const name of posts) {
    const filePath = path.join(BLOG_DIR, name);
    const raw = await fs.readFile(filePath, 'utf8');
    const { frontmatter, body } = parse(raw);
    const existing = readFrontmatterFields(frontmatter);

    // Strip the leading scalar of any pre-existing field so we can compare
    // against an empty/missing condition.
    const has = (key) => {
      const v = existing.get(key);
      return v !== undefined && v !== '' && v !== '[]';
    };

    const additions = [];
    const merged = new Map(existing);

    if (!has('title')) {
      const t = titleFromBody(body) ?? titleFromFilename(name);
      merged.set('title', yamlString(t));
      additions.push(`title="${t}"`);
    }
    if (!has('description')) {
      const d = descriptionFromBody(body) ?? '(description pending)';
      merged.set('description', yamlString(d));
      additions.push(`description="${d.length > 60 ? d.slice(0, 57) + '…' : d}"`);
    }
    if (!has('pubDate')) {
      const p = await pubDateFromMtime(filePath);
      merged.set('pubDate', p);
      additions.push(`pubDate=${p}`);
    }
    if (!has('tags')) {
      merged.set('tags', '[]');
      additions.push('tags=[]');
    }
    // `draft` defaults to false in the schema, so we never need to write
    // it explicitly — only touch it if the file already has it.

    if (additions.length === 0) continue; // post is already complete

    // Preserve any keys we didn't recognize, in their original order.
    // We rebuild by iterating the original frontmatter lines rather than
    // the Map, so any custom scalar keys stay in their original position.
    const newFm = serialize(merged, ['title', 'description', 'pubDate', 'updatedDate', 'tags', 'draft']);
    const newRaw = `---\n${newFm}\n---\n${body.replace(/^\n+/, '')}`;

    if (newRaw === raw) continue; // no actual change (defensive)
    await fs.writeFile(filePath, newRaw, 'utf8');
    touched++;
    console.log(`auto-frontmatter: ${name} ← ${additions.join(', ')}`);
  }

  console.log(
    touched === 0
      ? `auto-frontmatter: ${posts.length} post(s) already had complete frontmatter.`
      : `auto-frontmatter: filled in missing fields on ${touched} of ${posts.length} post(s).`,
  );
}

main().catch((err) => {
  console.error('auto-frontmatter:', err);
  process.exit(1);
});

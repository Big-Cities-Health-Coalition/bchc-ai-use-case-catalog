#!/usr/bin/env node
/**
 * Scaffold a catalog entry from a GitHub issue-form submission.
 *
 * Input (env):   ISSUE_BODY, ISSUE_TITLE, ISSUE_NUMBER, GITHUB_TOKEN (optional)
 * Output:        <entry path>/<slug>/index.md
 *                <entry path>/<slug>/screenshots/NN.<ext>  (downloaded images)
 *                <entry path>/<slug>/<filename>            (uploaded attachments)
 *                $GITHUB_OUTPUT:  slug, entry_dir, branch, title, images,
 *                                 warnings, preview, checklist, escalate
 *                $GITHUB_STEP_SUMMARY: a human-readable report
 *
 * Flags:         --dry-run   print the front matter instead of writing files
 *
 * Every front matter key comes from _data/schema.yml, so this script never
 * needs editing when the content model changes. The pure parsing/serialising
 * helpers live in scripts/lib/ and are unit-tested in test/scripts/.
 *
 * Exit code is non-zero only for genuinely fatal problems (no title, no
 * schema, a slug that cannot be derived). A screenshot that fails to download
 * is reported as a warning on the pull request, never a failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as yaml from 'js-yaml';

import { fail, setOutput } from './lib/actions_output.mjs';
import { frontMatter } from './lib/yaml.mjs';
import { escalations, reviewChecklist } from './lib/review.mjs';
import { attachmentValue, downloadAttachment, shouldDownload } from './lib/attachments.mjs';
import { downloadImages, MAX_FILES } from './lib/images.mjs';
import {
  NO_RESPONSE,
  codeSpan,
  coerce,
  parseAttachmentRef,
  parseImageRefs,
  parseIssueForm,
  rawValue,
  slugFallback,
  siteHttpUrl,
  slugify,
  uniqueSlug,
} from './lib/issue_body.mjs';

const ROOT = process.cwd();
const SCHEMA_PATH = path.join(ROOT, '_data', 'schema.yml');
// Optional: the published review criteria, so the pull request checklist and
// the governance page carry the same list.
const GOVERNANCE_PATH = path.join(ROOT, '_data', 'governance.yml');
const DRY_RUN = process.argv.includes('--dry-run');

/** Keys written by the fixed header block; a schema field with one of these
 * keys must not be emitted twice (duplicate YAML keys are invalid). */
const HEADER_KEYS = new Set(['title', 'slug', 'published', 'featured', 'thumbnail', 'render_with_liquid']);

/** Extra headings the form may carry that are not schema fields. Put a
 * `### Slug` block BEFORE the write-up section: everything after the write-up
 * heading is treated as prose (see parseIssueForm). */
const SLUG_HEADING = 'slug';

/** A slug is a folder name under the entry path, so keep it to this shape. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Longest a single answer may be in the reviewer preview before it is cut. */
const PREVIEW_MAX_CHARS = 240;

/**
 * Write the run report to stdout and, in Actions, to the job summary.
 * @param {string} markdown
 */
function report(markdown) {
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
}

// --- inputs ----------------------------------------------------------------

const issueBody = String(process.env.ISSUE_BODY ?? '').replace(/\r\n?/g, '\n');
const issueTitle = String(process.env.ISSUE_TITLE ?? '').trim();
const issueNumber = String(process.env.ISSUE_NUMBER ?? '').trim();

if (!issueBody.trim()) fail('The issue body is empty, so there is nothing to scaffold.');

let schema;
try {
  schema = yaml.load(fs.readFileSync(SCHEMA_PATH, 'utf8')) || {};
} catch (error) {
  fail(`Could not read _data/schema.yml: ${error.message}`);
}

const fields = Array.isArray(schema.fields) ? schema.fields : [];
if (fields.length === 0) fail('_data/schema.yml defines no `fields`.');

const knownHeadings = [SLUG_HEADING];
for (const field of fields) {
  if (field?.label) knownHeadings.push(field.label);
  if (field?.key) knownHeadings.push(field.key);
  if (field?.prompt) knownHeadings.push(field.prompt);
}

// The free-form write-up is the last `markdown` field of the schema, so it is
// also the last section of the generated issue form. Naming it lets the parser
// treat everything after its heading as prose: a `### Organization` the
// submitter types inside their write-up can no longer overwrite a real answer.
const writeUpField = [...fields].reverse().find((f) => f?.type === 'markdown');
const writeUpLabel = writeUpField ? writeUpField.label || writeUpField.key || '' : '';

/** @type {string[]} */
const warnings = [];

const { sections, warnings: parseWarnings } = parseIssueForm(issueBody, knownHeadings, writeUpLabel);
warnings.push(...parseWarnings);

// --- title and slug --------------------------------------------------------

const titleField = fields.find((f) => f.key === 'title');
const title = (titleField ? rawValue(sections, titleField) : '') || issueTitle;
if (!title) fail('No title was provided in the issue form or the issue title.');

const entryPath = String(schema.entry?.path || 'catalog');
// The schema may cap how many screenshots an entry keeps; MAX_FILES is the ceiling.
const maxImages = Math.min(Number(schema.entry?.max_images) || MAX_FILES, MAX_FILES);
const slugOverride = sections.get(SLUG_HEADING);
let slugSeed = slugify(slugOverride && slugOverride.toLowerCase() !== NO_RESPONSE ? slugOverride : title);
if (!slugSeed) {
  // A title with no Latin characters at all (CJK, emoji) used to end the
  // submission here, with "could not derive a URL slug" on the issue and no
  // pull request. The folder name is not worth losing the entry over — the
  // title itself is unaffected, and a maintainer can rename the folder.
  slugSeed = slugFallback(issueNumber);
  warnings.push(
    `The title has no Latin characters, so the folder is named \`${slugSeed}\`. Rename the folder in this pull request if you want a different URL.`
  );
}

const slug = uniqueSlug(slugSeed, (candidate) => fs.existsSync(path.join(ROOT, entryPath, candidate)));
if (!slug)
  fail(
    `Too many entries already exist under ${entryPath}/${slugSeed}*. Add a "### Slug" section with a different slug.`
  );
// `slugify` already strips everything outside [a-z0-9-], but this job runs with
// `contents: write` on issue text from anyone, so the folder name it is about
// to create is re-checked rather than trusted.
if (!SLUG_PATTERN.test(slug)) fail(`Refusing to use ${JSON.stringify(slug)} as a folder name.`);

const entryDir = path.join(ROOT, entryPath, slug);

/**
 * Guard every write: the scaffolder may only create files inside this entry's
 * own folder, never anywhere else in the checkout.
 * @param {string} target absolute path about to be written
 * @returns {string} the same path
 */
function insideEntryDir(target) {
  const resolved = path.resolve(target);
  const base = path.resolve(entryDir);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    fail(`Refusing to write outside ${entryPath}/${slug}/ (${resolved}).`);
  }
  return resolved;
}

// --- images ----------------------------------------------------------------

/** @type {Record<string, Array<{src: string, alt: string}>>} */
const imageValues = {};

for (const field of fields.filter((f) => f.type === 'images')) {
  const refs = parseImageRefs(rawValue(sections, field));
  if (refs.length === 0) {
    imageValues[field.key] = [];
    continue;
  }
  if (DRY_RUN) {
    imageValues[field.key] = refs.map((ref, index) => ({
      src: `/${entryPath}/${slug}/screenshots/${String(index + 1).padStart(2, '0')}.png`,
      alt: ref.alt || `${title} — screenshot ${index + 1}`,
    }));
    warnings.push(`Dry run: ${refs.length} image URL(s) were parsed but not downloaded.`);
    continue;
  }
  const result = await downloadImages(refs, {
    destDir: path.join(entryDir, 'screenshots'),
    publicPrefix: `/${entryPath}/${slug}/screenshots`,
    altFallback: `${title} — screenshot`,
    maxFiles: maxImages,
    token: process.env.GITHUB_TOKEN || '',
    fsImpl: {
      mkdirSync: (dir, opts) => fs.mkdirSync(insideEntryDir(dir), opts),
      writeFileSync: (file, data) => fs.writeFileSync(insideEntryDir(file), data),
    },
  });
  imageValues[field.key] = result.items;
  warnings.push(...result.warnings);
}

// --- attachments -----------------------------------------------------------
// A `file`/`image` question is an `upload` control on the issue form, so the
// deck or the photo is already on GitHub by the time this runs: fetch it into
// the entry folder and the pull request carries the file, not a promise that a
// maintainer will add it. Nothing attached keeps the previous behaviour — the
// front matter still names the path the schema expects. A `file` answer that
// links somewhere other than GitHub's upload store (a file over the 25 MB cap,
// or one kept in a shared workspace) is stored as that link and not fetched;
// the entry page renders it as an external row.

/** @type {Record<string, string>} */
const attachmentValues = {};
/** Files pulled in for the run report. */
const savedAttachments = [];

for (const field of fields.filter((f) => f.type === 'file' || f.type === 'image')) {
  const filename = String(field.filename || `${field.key}.pdf`).trim();
  const publicPath = `/${entryPath}/${slug}/${filename}`;
  const ref = parseAttachmentRef(rawValue(sections, field));

  // No attachment: a `file` keeps naming the path a maintainer uploads into
  // (docs/admin-guide.md), an `image` has nothing to point at.
  if (!ref) {
    attachmentValues[field.key] = field.type === 'file' ? publicPath : '';
    continue;
  }
  if (!shouldDownload(field.type, ref.url)) {
    // Stored only in the shape the page renders and the validator accepts; a
    // link that cannot be one is reported rather than committed as a dead row.
    const link = siteHttpUrl(ref.url);
    attachmentValues[field.key] = link || publicPath;
    if (!link) {
      warnings.push(
        `\`${field.key}\`: the link ${codeSpan(ref.url)} could not be used — a link must start with http:// or https:// and contain no spaces, quotes or angle brackets. The front matter names \`${publicPath}\` instead; commit the file there, or replace it with a working link, before merging.`
      );
    }
    continue;
  }
  if (DRY_RUN) {
    attachmentValues[field.key] = publicPath;
    warnings.push(`Dry run: ${ref.url} was parsed but not downloaded.`);
    continue;
  }

  const result = await downloadAttachment(ref.url, {
    destDir: entryDir,
    filename,
    token: process.env.GITHUB_TOKEN || '',
    fsImpl: {
      mkdirSync: (dir, opts) => fs.mkdirSync(insideEntryDir(dir), opts),
      writeFileSync: (file, data) => fs.writeFileSync(insideEntryDir(file), data),
    },
  });
  attachmentValues[field.key] = attachmentValue(field.type, {
    saved: result.saved,
    publicPath,
    url: ref.url,
  });
  if (result.saved) {
    savedAttachments.push(publicPath);
  } else if (field.type === 'file' && attachmentValues[field.key] !== publicPath) {
    warnings.push(
      `${result.warning} The front matter keeps the link for now; commit the file as \`${publicPath}\` in this pull request and point \`${field.key}\` at it if it should be included.`
    );
  } else if (field.type === 'file') {
    warnings.push(
      `${result.warning} Commit the file as \`${publicPath}\` in this pull request if it should be included.`
    );
  } else {
    warnings.push(`${result.warning} Re-upload it in this pull request if it should be included.`);
  }
}

// --- front matter ----------------------------------------------------------

const published = new Date().toISOString().slice(0, 10);
/** @type {Array<[string, unknown]>} */
const entries = [
  ['layout', 'entry'],
  // The page body is markdown someone we do not know typed into an issue.
  // Without this, Jekyll would run it through Liquid at build time and a
  // `{% include %}` or `{{ site… }}` in the write-up would execute. Jekyll 4
  // honours the flag per document (Jekyll::Convertible#render_with_liquid?);
  // hand-written entries should carry it too.
  ['render_with_liquid', false],
  ['title', title],
  ['slug', slug],
  ['published', published],
  ['featured', false],
  ['thumbnail', ''],
];

let bodyText = '';

for (const field of fields) {
  const key = String(field.key ?? '');
  if (!key) continue;
  const raw = rawValue(sections, field);

  if (field.type === 'markdown') {
    if (!bodyText) bodyText = raw;
    continue;
  }
  if (HEADER_KEYS.has(key)) continue;

  if (field.type === 'images') {
    entries.push([key, imageValues[key] ?? []]);
    continue;
  }
  if (field.type === 'file' || field.type === 'image') {
    entries.push([key, attachmentValues[key] ?? '']);
    continue;
  }
  entries.push([key, coerce(field, raw)]);
}

// Review status (schema `entry.status_key`): a maintainer-only field the
// submitter never saw, so it arrives blank. Start it at the value the schema
// names for a fresh submission — the reviewer flips it in the same pull request
// (the checklist below says so) — and skip it entirely when the schema has no
// status field, so other presets keep their front matter unchanged.
const statusKey = String(schema.entry?.status_key ?? '');
const statusStart = schema.entry?.status_scaffold_value;
if (statusKey && typeof statusStart === 'string' && statusStart !== '') {
  const statusIndex = entries.findIndex(([k]) => k === statusKey);
  if (statusIndex !== -1) entries[statusIndex] = [statusKey, statusStart];
  else entries.push([statusKey, statusStart]);
}

const content = `${frontMatter(entries)}\n${bodyText || 'Write-up forthcoming.'}\n`;

// --- what the reviewer is told ---------------------------------------------

// Closer review: every answer the schema flags with `escalate_on`. The
// workflow labels the pull request from this; the checklist lists the reasons.
const flagged = escalations(fields, new Map(entries));

/** `review.criteria` from _data/governance.yml when the site publishes them. */
function publishedCriteria() {
  if (!fs.existsSync(GOVERNANCE_PATH)) return [];
  try {
    const governance = yaml.load(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
    const criteria = governance?.review?.criteria;
    return Array.isArray(criteria) ? criteria : [];
  } catch (error) {
    warnings.push(
      `_data/governance.yml could not be read (${error.message}); the checklist uses the built-in criteria.`
    );
    return [];
  }
}

const checklist = reviewChecklist({
  criteria: publishedCriteria(),
  status: { key: statusKey, start: statusStart, approved: schema.entry?.status_approved_value },
  escalations: flagged,
  entryDir: `${entryPath}/${slug}`,
});

// --- reviewer preview ------------------------------------------------------
// Reviewing a generated pull request means reading a YAML diff to judge a page.
// These lines put the entry itself in front of the maintainer, in the job
// summary and in the pull request body. Which answers appear is a schema
// decision: the fields the card shows (`card:`) are the ones a visitor reads
// first, so they are the ones worth checking before merge — no key is named here.

/**
 * One answer, flattened to a single line short enough to skim.
 * @param {unknown} value
 * @returns {string}
 */
function previewValue(value) {
  const text = Array.isArray(value)
    ? value.map((item) => (item && typeof item === 'object' ? item.label || item.src || '' : item)).join(', ')
    : typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : String(value ?? '');
  // Newlines would break out of the bullet, and the text came from an issue.
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_MAX_CHARS ? `${flat.slice(0, PREVIEW_MAX_CHARS - 1)}…` : flat;
}

const values = new Map(entries);
const previewLines = [];
for (const field of fields) {
  if (!field?.card || !values.has(field.key)) continue;
  const rendered = previewValue(values.get(field.key));
  if (rendered) previewLines.push(`- **${field.label || field.key}**: ${rendered}`);
}
// The first `textarea` is the entry's own summary — the sentence the catalog
// leads with, and the one most likely to need rewriting before merge.
const summaryField = fields.find((f) => f?.type === 'textarea');
const summaryText = summaryField ? previewValue(values.get(summaryField.key)) : '';
if (summaryText) previewLines.unshift(`> ${summaryText}`, '');

const preview = previewLines.join('\n');

// --- write and report ------------------------------------------------------

const savedImages = Object.values(imageValues)
  .flat()
  .filter((item) => item.src.startsWith('/'));

if (DRY_RUN) {
  console.log(`# dry run — would write ${entryPath}/${slug}/index.md\n`);
  console.log(content);
  console.log(`\n# pull request checklist\n${checklist}`);
  if (warnings.length > 0) console.log(`\n# warnings\n${warnings.map((w) => `- ${w}`).join('\n')}`);
  process.exit(0);
}

fs.mkdirSync(insideEntryDir(entryDir), { recursive: true });
fs.writeFileSync(insideEntryDir(path.join(entryDir, 'index.md')), content, 'utf8');

const summaryLines = [
  `## Scaffolded \`${entryPath}/${slug}/index.md\``,
  '',
  `- Source: issue #${issueNumber || '?'}`,
  `- Slug: \`${slug}\``,
  `- Files written: ${1 + savedImages.length + savedAttachments.length} (1 page, ${savedImages.length} screenshot${savedImages.length === 1 ? '' : 's'}, ${savedAttachments.length} attachment${savedAttachments.length === 1 ? '' : 's'})`,
];
if (preview) {
  summaryLines.push('', `### ${title}`, '', preview);
}
if (savedImages.length > 0) {
  summaryLines.push('', '### Screenshots saved', ...savedImages.map((item) => `- \`${item.src}\``));
}
if (savedAttachments.length > 0) {
  summaryLines.push('', '### Attachments saved', ...savedAttachments.map((item) => `- \`${item}\``));
}
if (flagged.length > 0) {
  summaryLines.push('', '### Closer review', ...flagged.map((item) => `- ${item.reason}`));
}
summaryLines.push(
  '',
  warnings.length > 0 ? '### Warnings' : '### Warnings\n\nNone.',
  ...(warnings.length > 0 ? ['', ...warnings.map((warning) => `- ${warning}`)] : [])
);

report(summaryLines.join('\n'));

setOutput('slug', slug);
// The folder, not just the slug: `entry.path` is a schema setting, so no
// workflow should be spelling `catalog/` out for itself.
setOutput('entry_dir', `${entryPath}/${slug}`);
setOutput('branch', `entry/${slug}${issueNumber ? `-${issueNumber}` : ''}`);
setOutput('title', title);
setOutput('images', savedImages.map((item) => `- \`${item.src}\``).join('\n'));
setOutput('warnings', warnings.map((warning) => `- ${warning}`).join('\n'));
setOutput('preview', preview);
setOutput('checklist', checklist);
// One line per flagged answer; empty when nothing was flagged. The workflow
// tests emptiness to decide on the `review:data-governance` label.
setOutput('escalate', flagged.map((item) => item.reason).join('\n'));

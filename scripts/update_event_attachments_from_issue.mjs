#!/usr/bin/env node
/**
 * Replace or extend the `attachments:` list on an existing cohort event page.
 *
 * Input (env): ISSUE_BODY
 * Output:      rewrites cohorts/<year>/events/<event_id>/index.md
 *              $GITHUB_OUTPUT: changed, and (when changed) slug, year, branch;
 *              reason, when nothing changed and why; error, when the year or
 *              event id is not a usable path segment.
 *
 * The rest of the front matter is spliced through untouched rather than
 * re-serialized, so hand-written keys, ordering and comments survive.
 *
 * Anyone can open the issue that starts this job. The year and event id come
 * from that issue and are turned into a path, so both are pattern-checked and
 * the resolved folder is re-checked against `cohorts/<year>/events/` before any
 * file is read or written; headings are read first-occurrence-wins
 * (scripts/lib/event_issue.mjs) and outputs use random heredoc delimiters.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as yaml from 'js-yaml';

import { fail, setOutput } from './lib/actions_output.mjs';
import { FIELD, FINAL_LABEL, readEventForm, resolveEventDir } from './lib/event_issue.mjs';
import { SITE_HTTP_URL, codeSpan, slugify } from './lib/issue_body.mjs';
import { pair } from './lib/yaml.mjs';

const ROOT = process.cwd();

const body = String(process.env.ISSUE_BODY ?? '').replace(/\r\n?/g, '\n');

/**
 * Report "nothing changed" and exit cleanly — the workflow comments instead of
 * failing. The reason travels with it: five different situations end up here,
 * and a comment that says only "no changes were made" leaves the submitter with
 * nothing to act on. The workflow quotes `reason` back onto the issue.
 */
function noChange(reason) {
  console.error(reason);
  setOutput('changed', 'false');
  setOutput('reason', reason);
  process.exit(0);
}

if (!body.trim())
  noChange(
    'The issue is empty, so there is nothing to attach. Fill the form in and the automation will try again.'
  );

const { value } = readEventForm(body, FINAL_LABEL.attachments);

const year = value(...FIELD.year);
const requestedId = value(...FIELD.eventId);
const mode = (value(...FIELD.mode) || 'REPLACE').toUpperCase().includes('APPEND') ? 'APPEND' : 'REPLACE';

// An attachment link must be one the event page can print into an `href` as
// is (SITE_HTTP_URL): http(s) only — the page renders anything without `://`
// as a path on this site, and a `javascript:` link is a script — and nothing
// that would break out of the attribute. Submitter text quoted back in the
// comment goes through codeSpan, so an `@name` in it pings nobody.

const newItems = value(...FIELD.attachments)
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const separator = line.includes('|') ? '|' : line.includes(' - ') ? ' - ' : null;
    if (!separator) return null;
    const parts = line.split(separator);
    const title = parts[0].trim();
    const url = parts.slice(1).join(separator).trim();
    return title && url ? { title, url } : null;
  })
  .filter(Boolean);

if (!year || !requestedId) {
  noChange(
    'Both **Cohort Year** and **Event ID** need a value. Put `help` in the Event ID field and the automation will comment with the IDs it knows about.'
  );
}
if (newItems.length === 0) {
  noChange(
    'Nothing could be read from the **Attachments** box. Write one item per line, as `Title | https://link-to-the-file`.'
  );
}
// All or nothing: a list with one bad link is refused whole, so the page never
// ends up with half of what the submitter asked for.
const badLinks = newItems.filter((item) => !SITE_HTTP_URL.test(item.url));
if (badLinks.length > 0) {
  noChange(
    `Every attachment needs a link that starts with http:// or https:// and has no spaces, quotes or angle brackets, so nothing was changed. Fix ${
      badLinks.length === 1 ? 'this line' : 'these lines'
    } and edit the issue: ${badLinks.map((item) => `${codeSpan(item.title)} → ${codeSpan(item.url)}`).join(', ')}.`
  );
}

// The id is a folder name, so it is normalized the same way new_event_from_issue.mjs
// derives one, then re-checked together with the year before a path is built.
const eventId = slugify(requestedId);
const { dir, relative, error } = resolveEventDir(ROOT, year, eventId);
if (error) fail(error);
if (eventId !== requestedId) {
  console.error(`Read the event id ${JSON.stringify(requestedId)} as ${JSON.stringify(eventId)}.`);
}

const absPath = path.join(dir, 'index.md');
const relPath = `${relative}/index.md`;
// A cohort event that only lives in _data/cohorts/<year>.yml gets its page
// generated at build time, so there is no file here to attach anything to.
// The "Add event details" form writes that file; this one only edits it.
// Read-then-catch rather than exists-then-read, so there is no window between
// the check and the use.
let raw;
try {
  raw = fs.readFileSync(absPath, 'utf8');
} catch (readError) {
  if (readError.code !== 'ENOENT') throw readError;
  noChange(
    `There is no event page at \`${relPath}\` yet, so there is nothing to attach materials to. Use the **Add event details** form to create the page for this event first, then come back to this one.`
  );
}

const content = raw.replace(/\r\n/g, '\n');
const match = content.match(/^---\n(.*?)\n---\n?(.*)$/s);
if (!match)
  noChange(
    `\`${relPath}\` is missing its front matter block, so it cannot be edited safely. A maintainer needs to look at that file.`
  );

const [, frontMatter, pageBody] = match;

let existing = [];
try {
  const parsed = yaml.load(frontMatter) || {};
  existing = Array.isArray(parsed.attachments) ? parsed.attachments.filter((a) => a && a.title && a.url) : [];
} catch (error) {
  noChange(
    `The front matter in \`${relPath}\` could not be read, so it was left alone. A maintainer needs to look at that file: ${error.message}`
  );
}

// Drop the existing `attachments:` block; everything else passes through verbatim.
const kept = [];
const lines = frontMatter.split('\n');
for (let i = 0; i < lines.length; i += 1) {
  if (!/^attachments\s*:/.test(lines[i])) {
    kept.push(lines[i]);
    continue;
  }
  while (i + 1 < lines.length && /^(\s+\S|\s*$)/.test(lines[i + 1])) i += 1;
}

let merged = newItems;
if (mode === 'APPEND') {
  const seen = new Set();
  merged = [];
  for (const item of [...existing, ...newItems]) {
    const key = `${item.title.toLowerCase()}|${item.url.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ title: item.title, url: item.url });
  }
}

while (kept.length > 0 && kept[kept.length - 1].trim() === '') kept.pop();

const updated = `---\n${[...kept, pair('attachments', merged)].join('\n')}\n---\n\n${pageBody.replace(/^\n+/, '')}`;

if (updated === content)
  noChange('The event page already lists exactly these attachments, so there was nothing to change.');

fs.writeFileSync(absPath, updated, 'utf8');

setOutput('changed', 'true');
setOutput('slug', `${year}-${eventId}`);
setOutput('year', year);
setOutput('branch', `event-attachments/${year}-${eventId}-${Date.now()}`);

console.log(`Updated attachments for ${relPath} (${mode.toLowerCase()}, ${merged.length} item(s)).`);

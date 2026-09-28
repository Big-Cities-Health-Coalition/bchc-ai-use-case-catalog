#!/usr/bin/env node
/**
 * Print the PDF -> thumbnail pairs that CI should render, one per line, as
 * "<pdf-path>\t<thumb-path>".
 *
 * Candidates come from _data/schema.yml: every `file` field marked
 * `thumbnail: true` contributes catalog/<slug>/<filename> for each entry
 * folder that actually has that file on disk.
 *
 * `--stale` narrows the list to the pairs whose thumbnail is missing or older
 * than its PDF. "Older" is read from git, not from modification times: a
 * checkout stamps every file with the moment it was written, in no particular
 * order, so on CI an mtime rule kept the old thumb.jpg for a replaced deck. A
 * thumbnail is current when the last commit that changed its PDF is the last
 * commit that changed the thumbnail or one of its ancestors, and the PDF has no
 * uncommitted edits. Outside a git work tree the old mtime rule still applies.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as yaml from 'js-yaml';

const ROOT = process.cwd();
const staleOnly = process.argv.includes('--stale');
const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8')) || {};
const entryPath = schema.entry?.path || 'catalog';

const filenames = (Array.isArray(schema.fields) ? schema.fields : [])
  .filter((field) => field.type === 'file' && field.thumbnail && field.filename)
  .map((field) => field.filename);

const entriesDir = path.join(ROOT, entryPath);
if (filenames.length === 0 || !fs.existsSync(entriesDir)) process.exit(0);

/** Run git in ROOT; `null` when it cannot run or exits non-zero. */
function git(...args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

const inGit = staleOnly && git('rev-parse', '--is-inside-work-tree') === 'true';
// A shallow clone reports its boundary commit as the last change to every file,
// so a replaced deck would look as old as its thumbnail. Re-render everything
// rather than trust history that isn't there.
const shallow = inGit && git('rev-parse', '--is-shallow-repository') === 'true';

/** The last commit that changed `file`, or '' when git has never seen it. */
function lastCommit(file) {
  return git('log', '-1', '--format=%H', '--', file) || '';
}

/**
 * Whether `thumb` has to be rendered again from `source`.
 * @param {string} source repo-relative PDF path
 * @param {string} thumb repo-relative thumbnail path
 * @returns {boolean}
 */
function isStale(source, thumb) {
  if (!fs.existsSync(path.join(ROOT, thumb))) return true;
  if (!inGit)
    return fs.statSync(path.join(ROOT, source)).mtimeMs > fs.statSync(path.join(ROOT, thumb)).mtimeMs;
  if (shallow || git('status', '--porcelain', '--', source) !== '') return true;
  const sourceCommit = lastCommit(source);
  const thumbCommit = lastCommit(thumb);
  if (!sourceCommit || !thumbCommit) return true;
  if (sourceCommit === thumbCommit) return false;
  // Exit 0: ancestor. 1: not. Anything else is an error, and re-rendering is
  // the safe answer to a question git could not settle.
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', sourceCommit, thumbCommit], {
    cwd: ROOT,
  });
  return ancestry.status !== 0;
}

for (const dirent of fs
  .readdirSync(entriesDir, { withFileTypes: true })
  .sort((a, b) => a.name.localeCompare(b.name))) {
  if (!dirent.isDirectory()) continue;
  for (const filename of filenames) {
    const source = path.join(entryPath, dirent.name, filename);
    if (!fs.existsSync(path.join(ROOT, source))) continue;
    const thumb = path.join(entryPath, dirent.name, 'thumb.jpg');
    if (staleOnly && !isStale(source, thumb)) continue;
    console.log(`${source}\t${thumb}`);
  }
}

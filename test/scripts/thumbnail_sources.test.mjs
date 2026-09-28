/**
 * Which PDF thumbnails the "Generate entry media" workflow re-renders.
 *
 * Drives the workflow's own "Generate thumbnails" step (read out of
 * .github/workflows/thumbnails.yml) in a throwaway clone, with `pdftoppm`
 * replaced by a stub that records what it was asked to render. A clone is the
 * point: a checkout stamps every file with the time it was written, in no
 * particular order, so a freshness rule that reads mtimes answers at random.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Every temp directory a test makes, removed once the file is done. The clones
// hold a node_modules symlink; removing the tree drops the link, not its target.
const TEMP_DIRS = [];
after(() => {
  for (const dir of TEMP_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  TEMP_DIRS.push(dir);
  return dir;
}

const SCHEMA = `entry:
  path: catalog
fields:
  - key: deck_pdf
    label: "Slide deck"
    type: file
    filename: "deck.pdf"
    thumbnail: true
`;

function git(cwd, ...args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.org',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.org',
    },
  });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

function write(dir, file, content) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

function commitAll(dir, message) {
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '--no-gpg-sign', '-m', message);
}

/**
 * A repository whose history `build(origin)` writes, then a fresh clone of it
 * with the current thumbnail_sources.mjs dropped in. Every file in the clone is
 * then given one mtime, with each thumb.jpg a minute NEWER than its PDF: the
 * order a checkout happens to write them in is not something to rely on.
 * `{ depth }` makes a shallow clone.
 */
function cloneOf(build, { depth } = {}) {
  const base = tempDir('phct-thumbs-');
  const origin = path.join(base, 'origin');
  fs.mkdirSync(origin);
  git(origin, 'init', '-q', '-b', 'main');
  write(origin, '_data/schema.yml', SCHEMA);
  build(origin);

  const work = path.join(base, 'work');
  // --depth is ignored for a plain local path; a file:// URL honours it.
  const source = depth ? ['--depth', String(depth), `file://${origin}`] : [origin];
  git(base, 'clone', '-q', ...source, work);
  write(
    work,
    'scripts/thumbnail_sources.mjs',
    fs.readFileSync(path.join(ROOT, 'scripts', 'thumbnail_sources.mjs'))
  );
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(work, 'node_modules'));

  const now = Date.now() / 1000;
  for (const slug of fs.readdirSync(path.join(work, 'catalog'))) {
    const dir = path.join(work, 'catalog', slug);
    if (fs.existsSync(path.join(dir, 'deck.pdf'))) fs.utimesSync(path.join(dir, 'deck.pdf'), now, now);
    if (fs.existsSync(path.join(dir, 'thumb.jpg')))
      fs.utimesSync(path.join(dir, 'thumb.jpg'), now + 60, now + 60);
  }
  return { base, work };
}

/** Run the workflow step in `cwd`; returns the PDFs pdftoppm was asked to render. */
function generateThumbnails(cwd) {
  const parsed = YAML.parse(
    fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'thumbnails.yml'), 'utf8')
  );
  const step = parsed.jobs.thumbnail.steps.find((s) => s.name === 'Generate thumbnails');
  assert.ok(step?.run, 'thumbnails.yml has no "Generate thumbnails" step');

  const bin = tempDir('phct-thumbs-bin-');
  const log = path.join(bin, 'calls.log');
  // The stub writes "<prefix>.jpg" the way `pdftoppm -singlefile` does, and
  // logs the source PDF (the second-to-last argument).
  fs.writeFileSync(
    path.join(bin, 'pdftoppm'),
    `#!/bin/sh
for last; do :; done
n=$#
i=0
for arg; do i=$((i+1)); [ "$i" -eq $((n-1)) ] && src="$arg"; done
printf '%s\\n' "$src" >> "${log}"
printf 'rendered from %s\\n' "$src" > "$last.jpg"
`
  );
  fs.chmodSync(path.join(bin, 'pdftoppm'), 0o755);

  const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', step.run], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
  });
  assert.equal(result.status, 0, `the step failed:\n${result.stdout}\n${result.stderr}`);
  return fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
}

test('a deck replaced after its thumbnail was committed is rendered again', () => {
  const { work } = cloneOf((origin) => {
    write(origin, 'catalog/alpha/deck.pdf', '%PDF-1.4 first deck');
    write(origin, 'catalog/alpha/thumb.jpg', 'thumb of the first deck');
    commitAll(origin, 'add deck and thumbnail');
    write(origin, 'catalog/alpha/deck.pdf', '%PDF-1.4 replacement deck');
    commitAll(origin, 'replace the deck');
  });

  assert.deepEqual(generateThumbnails(work), ['catalog/alpha/deck.pdf']);
  assert.match(fs.readFileSync(path.join(work, 'catalog/alpha/thumb.jpg'), 'utf8'), /rendered from/);
});

test('a thumbnail committed with or after its deck is left alone', () => {
  const { work } = cloneOf((origin) => {
    write(origin, 'catalog/alpha/deck.pdf', '%PDF-1.4 deck');
    write(origin, 'catalog/alpha/thumb.jpg', 'thumb committed with the deck');
    commitAll(origin, 'add alpha');
    write(origin, 'catalog/beta/deck.pdf', '%PDF-1.4 deck');
    commitAll(origin, 'add beta deck');
    write(origin, 'catalog/beta/thumb.jpg', 'thumb committed by the bot afterwards');
    commitAll(origin, 'chore: update entry thumbnails');
  });

  assert.deepEqual(generateThumbnails(work), []);
});

test('a shallow checkout re-renders every thumbnail rather than trust missing history', () => {
  const { work } = cloneOf(
    (origin) => {
      write(origin, 'catalog/alpha/deck.pdf', '%PDF-1.4 deck');
      write(origin, 'catalog/alpha/thumb.jpg', 'thumb committed with the deck');
      commitAll(origin, 'add alpha');
      write(origin, 'README.md', 'a later commit');
      commitAll(origin, 'unrelated change');
    },
    { depth: 1 }
  );

  assert.deepEqual(generateThumbnails(work), ['catalog/alpha/deck.pdf']);
});

test('a missing thumbnail is rendered, and placeholders and non-PDFs are still skipped', () => {
  const { work } = cloneOf((origin) => {
    write(origin, 'catalog/alpha/deck.pdf', '%PDF-1.4 deck');
    write(origin, 'catalog/empty/deck.pdf', '');
    write(origin, 'catalog/fake/deck.pdf', 'not a pdf at all');
    commitAll(origin, 'add decks');
  });

  assert.deepEqual(generateThumbnails(work), ['catalog/alpha/deck.pdf']);
});

test('a deck edited but not yet committed is rendered again (a local run)', () => {
  const { work } = cloneOf((origin) => {
    write(origin, 'catalog/alpha/deck.pdf', '%PDF-1.4 deck');
    write(origin, 'catalog/alpha/thumb.jpg', 'thumb');
    commitAll(origin, 'add alpha');
  });
  fs.writeFileSync(path.join(work, 'catalog/alpha/deck.pdf'), '%PDF-1.4 edited in the working tree');

  assert.deepEqual(generateThumbnails(work), ['catalog/alpha/deck.pdf']);
});

test('outside a git checkout the modification times decide, as before', () => {
  const dir = tempDir('phct-thumbs-nogit-');
  write(dir, '_data/schema.yml', SCHEMA);
  write(
    dir,
    'scripts/thumbnail_sources.mjs',
    fs.readFileSync(path.join(ROOT, 'scripts', 'thumbnail_sources.mjs'))
  );
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'));
  write(dir, 'catalog/fresh/deck.pdf', '%PDF-1.4 deck');
  write(dir, 'catalog/fresh/thumb.jpg', 'thumb');
  write(dir, 'catalog/stale/deck.pdf', '%PDF-1.4 deck');
  write(dir, 'catalog/stale/thumb.jpg', 'thumb');
  const now = Date.now() / 1000;
  fs.utimesSync(path.join(dir, 'catalog/fresh/deck.pdf'), now - 60, now - 60);
  fs.utimesSync(path.join(dir, 'catalog/fresh/thumb.jpg'), now, now);
  fs.utimesSync(path.join(dir, 'catalog/stale/deck.pdf'), now, now);
  fs.utimesSync(path.join(dir, 'catalog/stale/thumb.jpg'), now - 60, now - 60);
  // A temp directory can sit inside someone's git checkout; pin git to this one.
  process.env.GIT_CEILING_DIRECTORIES = path.dirname(dir);
  try {
    assert.deepEqual(generateThumbnails(dir), ['catalog/stale/deck.pdf']);
  } finally {
    delete process.env.GIT_CEILING_DIRECTORIES;
  }
});

/**
 * End-to-end tests for the event/cohort issue→PR scripts.
 *
 *   npm test     (node --test)
 *
 * Each case runs the real script as a child process with an ISSUE_BODY that a
 * hostile submitter could have typed, a throwaway checkout as its working
 * directory and $GITHUB_OUTPUT pointed at a temp file — the scripts read only
 * env and the filesystem, so nothing here touches the GitHub API or the repo.
 *
 * The properties under test:
 *   * a `..` year or a traversing event id is refused and writes nothing;
 *   * a `### heading` typed inside a free-text answer does not win;
 *   * control characters in a name survive the YAML round trip;
 *   * no answer can forge an extra `$GITHUB_OUTPUT` line.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import * as yaml from 'js-yaml';

const SCRIPTS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts');

/** Minimal checkout: one cohort with one event page, plus an unrelated page a
 * traversal would land on. Returns the temp root. */
function fixtureTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'event-scripts-'));
  const eventDir = path.join(root, 'cohorts', '2026', 'events', 'kickoff');
  fs.mkdirSync(eventDir, { recursive: true });
  fs.writeFileSync(
    path.join(eventDir, 'index.md'),
    [
      '---',
      'layout: event',
      'title: "Cohort kickoff"',
      'cohort: "2026"',
      'event_id: kickoff',
      '---',
      '',
      'Body.',
      '',
    ].join('\n'),
    'utf8'
  );
  fs.mkdirSync(path.join(root, 'about'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'about', 'index.md'),
    '---\nlayout: page\ntitle: About\n---\n\nReal page.\n',
    'utf8'
  );
  fs.mkdirSync(path.join(root, '_data', 'cohorts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '_data', 'cohorts', '2026.yml'),
    'year: 2026\nevents:\n  - id: kickoff\n    name: "Cohort kickoff"\n    date: 2026-09-09\n',
    'utf8'
  );
  return root;
}

/**
 * Run one script against a fixture tree.
 * @returns {{status: number, stdout: string, stderr: string, raw: string, outputs: Map<string, string>}}
 */
function run(script, { body = '', title = '', root }) {
  const outputFile = path.join(root, `outputs-${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(outputFile, '');
  const result = spawnSync(process.execPath, [path.join(SCRIPTS, script)], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ISSUE_BODY: body, ISSUE_TITLE: title, GITHUB_OUTPUT: outputFile },
  });
  const raw = fs.readFileSync(outputFile, 'utf8');
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    raw,
    outputs: parseOutputs(raw),
  };
}

/** Read a $GITHUB_OUTPUT file the way the Actions runner does. */
function parseOutputs(raw) {
  const outputs = new Map();
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const heredoc = /^([A-Za-z0-9_-]+)<<(.+)$/.exec(lines[i]);
    if (heredoc) {
      const [, key, delimiter] = heredoc;
      const buffer = [];
      i += 1;
      while (i < lines.length && lines[i] !== delimiter) {
        buffer.push(lines[i]);
        i += 1;
      }
      outputs.set(key, buffer.join('\n'));
      continue;
    }
    const plain = /^([A-Za-z0-9_-]+)=(.*)$/.exec(lines[i]);
    if (plain) outputs.set(plain[1], plain[2]);
  }
  return outputs;
}

/** Front matter of a generated page, parsed. */
function frontMatterOf(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = /^---\n(.*?)\n---\n/s.exec(text);
  assert.ok(match, `no front matter in ${file}`);
  return yaml.load(match[1]);
}

const section = (heading, value) => `### ${heading}\n\n${value}\n\n`;

// --- new_event_from_issue.mjs ----------------------------------------------

test('new_event: a heading inside the details answer cannot replace the event id', () => {
  const root = fixtureTree();
  const body =
    section('Cohort Year', '2026') +
    section('Event Title', 'Real title') +
    section('Event ID', 'orientation') +
    section('Event Details (Markdown, optional)', 'Notes below.\n\n### Event ID\n\nhijacked');

  const result = run('new_event_from_issue.mjs', { body, root });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.outputs.get('slug'), 'orientation');
  assert.ok(fs.existsSync(path.join(root, 'cohorts', '2026', 'events', 'orientation', 'index.md')));
  assert.ok(!fs.existsSync(path.join(root, 'cohorts', '2026', 'events', 'hijacked')));
});

test('new_event: a traversing year is refused and writes nothing', () => {
  for (const year of ['..', '2026/../..', '../../about']) {
    const root = fixtureTree();
    const before = fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8');
    const body =
      section('Cohort Year', year) + section('Event Title', 'Traversal') + section('Event ID', 'kickoff');

    const result = run('new_event_from_issue.mjs', { body, root });

    assert.equal(result.status, 1, `expected a refusal for ${year}`);
    assert.match(result.outputs.get('error') ?? '', /Refusing|required/);
    assert.equal(fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8'), before);
    assert.deepEqual(fs.readdirSync(path.join(root, 'cohorts', '2026', 'events')), ['kickoff']);
  }
});

test('new_event: a traversing event id stays inside the events folder', () => {
  const root = fixtureTree();
  const before = fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8');
  const body =
    section('Cohort Year', '2026') +
    section('Event Title', 'Traversal') +
    section('Event ID', '../../../about');

  const result = run('new_event_from_issue.mjs', { body, root });

  // The id is slugified before it is used, so it becomes a folder name here
  // rather than a path — and never escapes cohorts/2026/events/.
  assert.equal(fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8'), before);
  assert.deepEqual(fs.readdirSync(path.join(root, 'cohorts', '2026', 'events')).sort(), ['about', 'kickoff']);
  assert.equal(result.outputs.get('slug'), 'about');
});

test('new_event: control characters and quotes in a title survive the YAML round trip', () => {
  const root = fixtureTree();
  // A bell, a Unicode line separator and a lone carriage return: the old
  // hand-rolled escaper wrote all three raw, which either broke the document
  // or silently changed the value when it was read back.
  const title = 'Kickoff "quoted" \\ back\u0007 sep\u2028 cr\r end';
  const body =
    section('Cohort Year', '2026') + section('Event Title', title) + section('Event ID', 'controls');

  const result = run('new_event_from_issue.mjs', { body, root });

  assert.equal(result.status, 0, result.stderr);
  const data = frontMatterOf(path.join(root, 'cohorts', '2026', 'events', 'controls', 'index.md'));
  // The issue body itself is CRLF-normalized before parsing, as GitHub sends it.
  assert.equal(data.title, title.replace(/\r/g, '\n'));
  assert.equal(data.event_id, 'controls');
  assert.equal(String(data.cohort), '2026');
});

// --- update_event_attachments_from_issue.mjs -------------------------------

test('update_event_attachments: a traversing year and id cannot rewrite another page', () => {
  const root = fixtureTree();
  const before = fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8');
  const body =
    section('Cohort Year', '..') +
    section('Event ID', '../about') +
    section('Update Mode', 'REPLACE') +
    section('Attachments', 'Pwned | https://evil.example/x.pdf');

  const result = run('update_event_attachments_from_issue.mjs', { body, root });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.outputs.get('error') ?? '', /Refusing/);
  assert.equal(fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8'), before);
  assert.equal(result.outputs.has('branch'), false);
});

test('update_event_attachments: an event id outside the cohort folder is not followed', () => {
  const root = fixtureTree();
  const before = fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8');
  const body =
    section('Cohort Year', '2026') +
    section('Event ID', '../../../about') +
    section('Attachments', 'Pwned | https://evil.example/x.pdf');

  const result = run('update_event_attachments_from_issue.mjs', { body, root });

  assert.equal(result.outputs.get('changed'), 'false');
  assert.equal(fs.readFileSync(path.join(root, 'about', 'index.md'), 'utf8'), before);
});

test('update_event_attachments: a heading inside the attachments answer cannot retarget the page', () => {
  const root = fixtureTree();
  const body =
    section('Cohort Year', '2026') +
    section('Event ID', 'kickoff') +
    section('Update Mode', 'REPLACE') +
    section('Attachments', 'Agenda | https://example.org/a.pdf\n\n### Event ID\n\nother');

  const result = run('update_event_attachments_from_issue.mjs', { body, root });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.outputs.get('changed'), 'true');
  assert.equal(result.outputs.get('slug'), '2026-kickoff');
  const data = frontMatterOf(path.join(root, 'cohorts', '2026', 'events', 'kickoff', 'index.md'));
  assert.deepEqual(data.attachments, [{ title: 'Agenda', url: 'https://example.org/a.pdf' }]);
});

// Five different situations exit cleanly with `changed=false`. The workflow can
// only tell the submitter which one if the script says so.
test('update_event_attachments: every clean exit says why on the reason output', () => {
  const cases = [
    { body: '', expected: /empty/i },
    { body: section('Cohort Year', '2026'), expected: /Event ID/ },
    {
      body:
        section('Cohort Year', '2026') +
        section('Event ID', 'kickoff') +
        section('Attachments', 'no separator here'),
      expected: /Attachments/,
    },
    {
      body:
        section('Cohort Year', '2026') +
        section('Event ID', 'never-scheduled') +
        section('Attachments', 'Agenda | https://example.org/a.pdf'),
      expected: /Add event details/,
    },
  ];

  for (const { body, expected } of cases) {
    const result = run('update_event_attachments_from_issue.mjs', { body, root: fixtureTree() });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.outputs.get('changed'), 'false');
    assert.match(result.outputs.get('reason') ?? '', expected);
  }
});

test('update_event_attachments: an attachment title with control characters round trips', () => {
  const root = fixtureTree();
  const title = 'Agenda "v2"';
  const body =
    section('Cohort Year', '2026') +
    section('Event ID', 'kickoff') +
    section('Attachments', `${title} | https://example.org/a.pdf`);

  const result = run('update_event_attachments_from_issue.mjs', { body, root });

  assert.equal(result.status, 0, result.stderr);
  const data = frontMatterOf(path.join(root, 'cohorts', '2026', 'events', 'kickoff', 'index.md'));
  assert.deepEqual(data.attachments, [{ title, url: 'https://example.org/a.pdf' }]);
});

test('update_event_attachments: a link that is not http(s) is refused with the line that caused it', () => {
  const root = fixtureTree();
  const page = path.join(root, 'cohorts', '2026', 'events', 'kickoff', 'index.md');
  const before = fs.readFileSync(page, 'utf8');
  for (const bad of [
    'javascript:alert(1)',
    '/assets/files/agenda.pdf',
    'https://example.org/a" onmouseover="x',
  ]) {
    const body =
      section('Cohort Year', '2026') +
      section('Event ID', 'kickoff') +
      section('Attachments', `Agenda | https://example.org/a.pdf\nSlides | ${bad}`);

    const result = run('update_event_attachments_from_issue.mjs', { body, root });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.outputs.get('changed'), 'false', bad);
    const reason = result.outputs.get('reason') ?? '';
    assert.match(reason, /http:\/\/ or https:\/\//, bad);
    assert.ok(reason.includes('Slides'), `the reason names the offending line: ${reason}`);
    assert.equal(fs.readFileSync(page, 'utf8'), before, 'nothing is half-applied');
  }
});

// --- extract_event_fields.mjs ----------------------------------------------

test('extract_event_fields: a multi-line answer cannot forge a second output', () => {
  const root = fixtureTree();
  const body =
    section('Cohort Year', '2026') +
    section('Event ID', 'kickoff\nevent_id=pwned\nbranch=attacker/branch') +
    section('Intro Paragraph', 'Hello\nintro=x\nbranch=attacker/branch');

  const result = run('extract_event_fields.mjs', { body, root });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.outputs.get('cohort_year'), '2026');
  assert.equal(result.outputs.get('event_id'), 'kickoff\nevent_id=pwned\nbranch=attacker/branch');
  // Read back the way the runner does: the forged lines stay inside the
  // heredoc body of `event_id`, so they never become outputs of their own.
  assert.equal(result.outputs.has('branch'), false);
  assert.equal(result.outputs.size, 3);
});

test('extract_event_fields: a heading inside a free-text answer does not win', () => {
  const root = fixtureTree();
  const body =
    section('Cohort Year', '2026') +
    section('Intro Paragraph', 'Real intro.') +
    section('Notable Events', 'Kickoff\n\n### Cohort Year\n\n1999\n\n### Intro Paragraph\n\nForged intro.');

  const result = run('extract_event_fields.mjs', { body, root });

  assert.equal(result.outputs.get('cohort_year'), '2026');
  assert.equal(result.outputs.get('intro'), 'Real intro.');
});

// --- list_events_for_year.mjs ----------------------------------------------

test('list_events_for_year: a fixed delimiter typed into the year cannot close the block', () => {
  const root = fixtureTree();
  const body = section('Cohort Year', '2026\nGHEOF\nbranch=attacker/branch\nGHEOF');

  const result = run('list_events_for_year.mjs', { body, root });

  assert.equal(result.status, 0, result.stderr);
  // Not four digits, so no path is built and the year output is left empty.
  assert.equal(result.outputs.get('year'), '');
  assert.equal(result.outputs.has('branch'), false);
  assert.equal(result.outputs.size, 2);
});

test('list_events_for_year: lists the events of a real cohort year', () => {
  const root = fixtureTree();
  const result = run('list_events_for_year.mjs', { body: section('Cohort Year', '2026'), root });

  assert.equal(result.outputs.get('year'), '2026');
  assert.match(result.outputs.get('events_md') ?? '', /`kickoff`/);
});

// Every event in the data file gets a generated page at build time, but only
// the ones with a file on disk can take attachments. Recommending the rest as
// attachment targets is what made the attachments form fail silently.
test('list_events_for_year: marks which events actually have a page on disk', () => {
  const root = fixtureTree();
  fs.writeFileSync(
    path.join(root, '_data', 'cohorts', '2026.yml'),
    [
      'year: 2026',
      'events:',
      '  - id: kickoff',
      '    name: "Cohort kickoff"',
      '    date: 2026-09-09',
      '  - id: midpoint',
      '    name: "Midpoint check-in"',
      '    date: 2026-06-01',
      '',
    ].join('\n'),
    'utf8'
  );

  const result = run('list_events_for_year.mjs', { body: section('Cohort Year', '2026'), root });
  const lines = (result.outputs.get('events_md') ?? '').split('\n');

  assert.match(
    lines.find((line) => line.includes('`kickoff`')) ?? '',
    /has a details page/,
    'kickoff has an index.md in the fixture'
  );
  assert.match(
    lines.find((line) => line.includes('`midpoint`')) ?? '',
    /no details page yet/,
    'midpoint is only in the data file'
  );
});

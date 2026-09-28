/**
 * The entry scaffolder's review-status default (scripts/new_entry_from_issue.mjs).
 *
 *   npm test     (node --test)
 *
 * Runs the real script in `--dry-run` mode, which prints the front matter it
 * would write and touches nothing. Two schemas: the repository's own, which
 * names a `status_key`, and a throwaway one that does not — the second is the
 * promise that other presets' front matter is unchanged by the feature.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import * as yaml from 'js-yaml';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'new_entry_from_issue.mjs');
const ISSUE_BODY = fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'issue-basic.md'), 'utf8');

/**
 * @param {string} cwd checkout to run in
 * @returns {string} the dry run's stdout
 */
function dryRunOutput(cwd, body = ISSUE_BODY) {
  const result = spawnSync(process.execPath, [SCRIPT, '--dry-run'], {
    cwd,
    env: {
      ...process.env,
      ISSUE_BODY: body,
      ISSUE_TITLE: '[Use case] Service request routing',
      ISSUE_NUMBER: '7',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

/**
 * @param {string} cwd checkout to run in
 * @returns {object} the parsed front matter of the dry run
 */
function dryRun(cwd, body = ISSUE_BODY) {
  const stdout = dryRunOutput(cwd, body);
  const match = stdout.match(/^---\n([\s\S]*?)\n---\n/m);
  assert.ok(match, `no front matter in:\n${stdout}`);
  return yaml.load(match[1]);
}

test('a schema with entry.status_key gets the scaffold value, whatever the issue said', () => {
  const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8'));
  const { status_key: key, status_scaffold_value: start } = schema.entry;
  assert.ok(key && start, 'the repository schema names a status field and a scaffold value');
  const fm = dryRun(ROOT);
  assert.equal(fm[key], start);
});

test('a schema without entry.status_key writes no status at all', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-status-'));
  fs.mkdirSync(path.join(root, '_data'));
  const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8'));
  delete schema.entry.status_key;
  delete schema.entry.deprecated_value;
  delete schema.entry.status_scaffold_value;
  fs.writeFileSync(path.join(root, '_data', 'schema.yml'), yaml.dump(schema), 'utf8');
  try {
    const fm = dryRun(root);
    // The field is still a schema field, so it is emitted as the (blank) answer
    // the issue carried; what must NOT happen is a default being invented.
    assert.notEqual(fm.review_status, 'Under review');
    assert.equal(fm.title, 'Service request routing assistant');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the pull request checklist flags escalate_on answers and carries the governance criteria', () => {
  const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8'));
  const flagged = schema.fields.filter((field) => Array.isArray(field.escalate_on));
  assert.ok(flagged.length >= 2, 'the repository schema flags at least the attestation and data sensitivity');
  const governance = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'governance.yml'), 'utf8'));
  const criteria = governance.review.criteria;
  assert.ok(criteria.length > 0, 'the governance page publishes review criteria');

  const stdout = dryRunOutput(ROOT);
  const checklist = stdout.slice(stdout.indexOf('# pull request checklist'));
  // The fixture leaves the attestation unticked and lists PHI under "Data it touches".
  assert.match(checklist, /^### Closer review$/m);
  const attestation = schema.fields.find(
    (field) => field.type === 'boolean' && Array.isArray(field.escalate_on)
  );
  assert.match(checklist, new RegExp(`^- \\*\\*${attestation.label}\\*\\*: not confirmed$`, 'm'));
  assert.match(checklist, /^- \*\*Data it touches\*\*: Health information \(PHI\)$/m);
  // The same criteria as /governance/, not a second copy kept in the script.
  for (const { name } of criteria) assert.match(checklist, new RegExp(`^- \\[ \\] \\*\\*${name}\\*\\*`, 'm'));
  const { status_key: key, status_scaffold_value: start, status_approved_value: approved } = schema.entry;
  assert.match(
    checklist,
    new RegExp(`\`${key}\` set to \\*\\*${approved}\\*\\* \\(the scaffold wrote \\*${start}\\*\\)`)
  );
});

test('a schema without escalate_on or a governance file gets a quiet checklist with the generic criteria', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-checklist-'));
  fs.mkdirSync(path.join(root, '_data'));
  const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8'));
  for (const field of schema.fields) delete field.escalate_on;
  fs.writeFileSync(path.join(root, '_data', 'schema.yml'), yaml.dump(schema), 'utf8');
  try {
    const stdout = dryRunOutput(root);
    const checklist = stdout.slice(stdout.indexOf('# pull request checklist'));
    assert.doesNotMatch(checklist, /Closer review/);
    assert.match(checklist, /^- \[ \] \*\*Completeness\*\* — /m);
    assert.match(checklist, /^- \[ \] \*\*Category fit\*\* — /m);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a file answer that links elsewhere is stored as that link, and a GitHub upload as the entry path', () => {
  const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8'));
  const field = schema.fields.find((f) => f.type === 'file');
  const upload = '[deck.pdf](https://github.com/user-attachments/files/12345678/deck.pdf)';
  assert.ok(ISSUE_BODY.includes(upload), 'the fixture attaches the deck through the upload control');

  // The upload control's own answer still names the file the pull request commits.
  assert.equal(
    dryRun(ROOT)[field.key],
    `/${schema.entry.path}/service-request-routing-assistant/${field.filename}`
  );

  // A file too big for GitHub, pasted as a link to where it actually lives.
  for (const answer of [
    'https://files.example.org/projects/1/deck.pdf',
    '[deck](https://files.example.org/projects/1/deck.pdf)',
  ]) {
    const fm = dryRun(ROOT, ISSUE_BODY.replace(upload, answer));
    assert.equal(fm[field.key], 'https://files.example.org/projects/1/deck.pdf', answer);
  }
});

test('a file link the page could not render is stored with a lower-case scheme, or not at all', () => {
  const schema = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'schema.yml'), 'utf8'));
  const field = schema.fields.find((f) => f.type === 'file');
  const upload = '[deck.pdf](https://github.com/user-attachments/files/12345678/deck.pdf)';
  const publicPath = `/${schema.entry.path}/service-request-routing-assistant/${field.filename}`;

  // The page's `http_url` filter and the validator want a lower-case scheme.
  const upper = dryRun(ROOT, ISSUE_BODY.replace(upload, 'HTTPS://drive.example.com/deck.pdf'));
  assert.equal(upper[field.key], 'https://drive.example.com/deck.pdf');

  // An apostrophe would break the page's href, so the link is not stored at all:
  // the field keeps naming the path, and the pull request says why.
  const quoted = "https://drive.example.com/it's-the-deck.pdf";
  const body = ISSUE_BODY.replace(upload, quoted);
  assert.equal(dryRun(ROOT, body)[field.key], publicPath);
  const warnings = dryRunOutput(ROOT, body).split('# warnings')[1] ?? '';
  assert.match(warnings, new RegExp(`\\\`${field.key}\\\`.*could not be used`));
  assert.ok(warnings.includes("it's-the-deck.pdf"), warnings);
});

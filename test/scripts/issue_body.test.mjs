import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  codeSpan,
  coerce,
  hostOf,
  isHttpUrl,
  normalizeLabel,
  parseAttachmentRef,
  parseBoolean,
  parseImageRefs,
  parseLinks,
  parseList,
  parseIssueForm,
  parseMultiselect,
  parseSections,
  siteHttpUrl,
  rawValue,
  slugFallback,
  slugify,
  uniqueSlug,
} from '../../scripts/lib/issue_body.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const basic = fs.readFileSync(path.join(FIXTURES, 'issue-basic.md'), 'utf8');
const minimal = fs.readFileSync(path.join(FIXTURES, 'issue-minimal.md'), 'utf8');
const adversarial = fs.readFileSync(path.join(FIXTURES, 'issue-adversarial.md'), 'utf8');

const LABELS = [
  'Title',
  'Summary',
  'Result in one line',
  'Organization',
  'What is being shared',
  'Area of work',
  'Stage',
  'How AI is involved',
  'Types of AI',
  'AI tools & models',
  'Where it runs',
  'Vendor or partner',
  'Skills needed to set it up',
  'Readiness',
  'Source code',
  'Live site or demo',
  'Documentation or write-up',
  'Other resources',
  'Screenshots',
  'Slide deck or one-pager (PDF)',
  'Data it touches',
  'Data sources',
  'Who sees the output',
  'Contact name',
  'Contact email',
  'Full write-up',
];

test('normalizeLabel folds case, whitespace and an (optional) suffix', () => {
  assert.equal(normalizeLabel('  Contact   Email (optional) '), 'contact email');
  assert.equal(normalizeLabel('AI tools & models'), 'ai tools & models');
  assert.equal(normalizeLabel(undefined), '');
});

test('parseSections only breaks on known headings', () => {
  const sections = parseSections(basic, LABELS);
  assert.equal(sections.get('title'), 'Service request routing assistant');
  const writeUp = sections.get('full write-up');
  assert.match(writeUp, /### Deep dive/);
  assert.match(writeUp, /One hour, same quality\./);
  assert.equal(sections.has('deep dive'), false);
});

test('parseSections tolerates CRLF and treats every ### as a break with no known labels', () => {
  const sections = parseSections('### A\r\n\r\nfirst\r\n\r\n### B\r\n\r\nsecond');
  assert.equal(sections.get('a'), 'first');
  assert.equal(sections.get('b'), 'second');
});

test('a heading inside the write-up cannot overwrite a real answer', () => {
  const { sections } = parseIssueForm(adversarial, [...LABELS, 'Slug'], 'Full write-up');

  assert.equal(sections.get('organization'), 'City of Testville');
  assert.equal(sections.get('contact email'), 'real.person@testville.gov');
  assert.equal(sections.get('title'), 'Legitimate entry title');
  // The forged "### Slug" only exists inside the write-up, so no slug section
  // is produced at all — the scaffolder falls back to slugifying the title.
  assert.equal(sections.has('slug'), false);

  const writeUp = sections.get('full write-up');
  assert.match(writeUp, /### Organization/);
  assert.match(writeUp, /Attacker Industries/);
  assert.match(writeUp, /attacker@example\.net/);
  assert.match(writeUp, /Everything after the write-up heading stays in the write-up\./);
});

test('a repeated heading before the write-up is ignored with a warning', () => {
  const { sections, warnings } = parseIssueForm(adversarial, LABELS, 'Full write-up');
  assert.equal(sections.get('organization'), 'City of Testville');
  assert.deepEqual(warnings, ['Duplicate section "organization" ignored.']);
});

test('duplicate headings inside the write-up raise no warning at all', () => {
  const body = [
    '### Title',
    '',
    'Real',
    '',
    '### Full write-up',
    '',
    '### Title',
    '',
    'Forged',
    '',
    '### Title',
    '',
    'Forged again',
  ].join('\n');
  const { sections, warnings } = parseIssueForm(body, ['Title', 'Full write-up'], 'Full write-up');
  assert.equal(sections.get('title'), 'Real');
  assert.deepEqual(warnings, []);
});

test('headings with trailing whitespace and CRLF line endings still match', () => {
  const body = '### Title   \r\n\r\nCRLF entry\r\n\r\n###\tOrganization  \r\n\r\nCity\r\n';
  const { sections } = parseIssueForm(body, ['Title', 'Organization'], 'Full write-up');
  assert.equal(sections.get('title'), 'CRLF entry');
  assert.equal(sections.get('organization'), 'City');
});

test('rawValue matches by label, then key, and blanks _No response_', () => {
  const sections = parseSections(minimal, LABELS);
  assert.equal(rawValue(sections, { key: 'title', label: 'Title' }), '');
  assert.equal(rawValue(sections, { key: 'organization', label: 'Organization' }), 'City of Testville');
  assert.equal(rawValue(sections, { key: 'nope', label: 'Nope' }), '');
});

test('parseMultiselect reads comma lists, ticked checkboxes and ignores unticked ones', () => {
  const sections = parseSections(basic, LABELS);
  const aiTypes = ['Generative text (LLM)', 'Chat assistant', 'Classification & NLP'];
  assert.deepEqual(parseMultiselect(sections.get('types of ai'), aiTypes), [
    'Generative text (LLM)',
    'Classification & NLP',
  ]);
});

test('parseMultiselect reads a `dropdown` with `multiple: true`', () => {
  // GitHub renders a multi-select dropdown as ONE comma-joined line under the
  // heading, with no list markers — a different shape from `checkboxes`, and the
  // one the issue form emits once a multiselect is a dropdown. Two of the
  // shipped schema's options contain a comma themselves, which is why options
  // are matched longest-first instead of splitting on `,`.
  const options = [
    'Finance, procurement & contracts',
    'Communications & outreach',
    'Internal, non-public data',
  ];
  const body = [
    '### Which areas of work does it apply to?',
    '',
    'Finance, procurement & contracts, Communications & outreach',
    '',
    '### What kind of data does it touch?',
    '',
    'Internal, non-public data',
  ].join('\n');
  const sections = parseSections(body, [
    'Which areas of work does it apply to?',
    'What kind of data does it touch?',
  ]);

  assert.deepEqual(parseMultiselect(sections.get('which areas of work does it apply to?'), options), [
    'Finance, procurement & contracts',
    'Communications & outreach',
  ]);
  assert.deepEqual(parseMultiselect(sections.get('what kind of data does it touch?'), options), [
    'Internal, non-public data',
  ]);

  // The same options as checkboxes must still parse, so a schema can move
  // between the two renderings without the scaffolder noticing.
  assert.deepEqual(
    parseMultiselect(
      '- [x] Finance, procurement & contracts\n- [ ] Communications & outreach\n- [x] Internal, non-public data',
      options
    ),
    ['Finance, procurement & contracts', 'Internal, non-public data']
  );
});

test('parseMultiselect drops every unticked checkbox line', () => {
  // A GitHub `checkboxes` control renders EVERY option, ticked or not.
  const options = ['Alpha', 'Beta', 'Gamma'];
  assert.deepEqual(parseMultiselect('- [ ] Alpha\n- [X] Beta\n- [ ] Gamma', options), ['Beta']);
  assert.deepEqual(parseMultiselect('- [ ] Alpha\n- [ ] Beta\n- [ ] Gamma', options), []);
});

test('parseMultiselect keeps options that contain a comma', () => {
  const options = ['Cloud deployment (AWS, Azure, GCP)', 'Internal tool'];
  assert.deepEqual(parseMultiselect('Cloud deployment (AWS, Azure, GCP), Internal tool', options), options);
});

test('parseMultiselect de-duplicates and falls back to a comma split', () => {
  assert.deepEqual(parseMultiselect('Alpha, Beta, Alpha', []), ['Alpha', 'Beta']);
});

test('parseList splits on newlines and commas', () => {
  assert.deepEqual(parseList('Azure OpenAI GPT-4o\nLangChain'), ['Azure OpenAI GPT-4o', 'LangChain']);
  assert.deepEqual(parseList('a, b,  c '), ['a', 'b', 'c']);
  assert.deepEqual(parseList(''), []);
});

test('parseBoolean accepts the shapes GitHub can produce', () => {
  assert.equal(parseBoolean('Yes'), true);
  assert.equal(parseBoolean('true'), true);
  assert.equal(parseBoolean('No'), false);
  assert.equal(parseBoolean(''), false);
});

test('parseLinks understands pipe, dash, markdown and bare URLs', () => {
  const sections = parseSections(basic, LABELS);
  assert.deepEqual(parseLinks(sections.get('other resources')), [
    { label: 'Evaluation report', url: 'https://example.org/eval.pdf' },
    { label: 'example.org', url: 'https://example.org/model-card' },
    { label: 'Model card', url: 'https://example.org/cards/gpt' },
  ]);
  assert.deepEqual(parseLinks('[Report](https://example.org/r)'), [
    { label: 'Report', url: 'https://example.org/r' },
  ]);
  assert.deepEqual(parseLinks('Notes: https://example.org/n'), [
    { label: 'Notes', url: 'https://example.org/n' },
  ]);
});

test('parseLinks drops lines without an http(s) URL', () => {
  assert.deepEqual(parseLinks('Just a note\nftp://example.org/x\n'), []);
});

test('parseImageRefs reads markdown, html, "url | alt" and bare URLs', () => {
  const sections = parseSections(basic, LABELS);
  assert.deepEqual(parseImageRefs(sections.get('screenshots')), [
    { url: 'https://github.com/user-attachments/assets/aaa.png', alt: 'Daily brief' },
    { url: 'https://example.org/shot2.jpg', alt: 'The queue view' },
  ]);
  assert.deepEqual(parseImageRefs('<img src="https://example.org/a.png" alt="A">'), [
    { url: 'https://example.org/a.png', alt: 'A' },
  ]);
  assert.deepEqual(parseImageRefs(''), []);
});

test('parseAttachmentRef reads what GitHub’s upload control leaves in the body', () => {
  const sections = parseSections(basic, LABELS);
  assert.deepEqual(parseAttachmentRef(sections.get('slide deck or one-pager (pdf)')), {
    url: 'https://github.com/user-attachments/files/12345678/deck.pdf',
    name: 'deck.pdf',
  });
  // An image upload renders as an embed, not a link.
  assert.deepEqual(parseAttachmentRef('![shot.png](https://example.org/shot.png)'), {
    url: 'https://example.org/shot.png',
    name: 'shot.png',
  });
  assert.deepEqual(parseAttachmentRef('<img src="https://example.org/a.png" alt="A">'), {
    url: 'https://example.org/a.png',
    name: '',
  });
  // A hand-written body carries a bare URL.
  assert.deepEqual(parseAttachmentRef('  https://example.org/deck.pdf  '), {
    url: 'https://example.org/deck.pdf',
    name: '',
  });
  assert.equal(parseAttachmentRef('_No response_'), null);
  assert.equal(parseAttachmentRef(''), null);
  assert.equal(parseAttachmentRef('a maintainer will add it later'), null);
});

test('slugify and uniqueSlug', () => {
  assert.equal(slugify('Service Request: Routing Assistant!'), 'service-request-routing-assistant');
  assert.equal(slugify(''), '');
  // Folded, not dropped: the folder this names is the entry's URL for ever, and
  // /submit/ has already shown the submitter this same answer.
  assert.equal(slugify('Köln Gesundheitsamt'), 'koln-gesundheitsamt');
  assert.equal(slugify('Ciudad de México — Salud'), 'ciudad-de-mexico-salud');
  assert.equal(slugify('Ñandú'), 'nandu');
  const taken = new Set(['brief', 'brief-2']);
  assert.equal(
    uniqueSlug('brief', (s) => taken.has(s)),
    'brief-3'
  );
  assert.equal(
    uniqueSlug('fresh', () => false),
    'fresh'
  );
  assert.equal(
    uniqueSlug('brief', () => true, 3),
    ''
  );
});

test('slugFallback names a folder for a title with no Latin characters at all', () => {
  assert.equal(slugify('京都市'), '');
  assert.equal(slugFallback(77), 'entry-77');
  assert.equal(slugFallback('77'), 'entry-77');
  // Re-running the same submission has to land on the same folder.
  assert.equal(slugFallback(77), slugFallback(77));
  // No issue number (a local run): still a legal slug, just not a stable one.
  assert.match(slugFallback(''), /^entry-[a-z0-9]+$/);
});

test('codeSpan quotes submitter text literally, with no way out of the span', () => {
  assert.equal(codeSpan('@octocat https://example.org/x'), '`@octocat https://example.org/x`');
  // A backtick would close the span early and let the rest render as markdown.
  assert.equal(codeSpan('a `b` c'), "`a 'b' c`");
  assert.equal(codeSpan(null), '`null`');
});

test('siteHttpUrl returns the URL the page and the validator accept, or nothing', () => {
  assert.equal(siteHttpUrl('https://files.example.org/deck.pdf'), 'https://files.example.org/deck.pdf');
  assert.equal(siteHttpUrl('  http://example.org/a  '), 'http://example.org/a');
  // The scheme is case-insensitive in a browser; the page's `http_url` test is not.
  assert.equal(siteHttpUrl('HTTPS://Drive.Example.com/Deck.pdf'), 'https://Drive.Example.com/Deck.pdf');
  // Quotes, angle brackets and spaces would break the href attribute the page writes.
  for (const bad of [
    "https://example.org/it's.pdf",
    'https://example.org/"x"',
    'https://example.org/<x>',
    'https://example.org/a b',
    'ftp://example.org/x',
    'javascript:alert(1)',
    '/catalog/x/deck.pdf',
    '',
    null,
  ]) {
    assert.equal(siteHttpUrl(bad), '', String(bad));
  }
});

test('isHttpUrl and hostOf', () => {
  assert.equal(isHttpUrl('https://example.org/a'), true);
  assert.equal(isHttpUrl('mailto:a@b.c'), false);
  assert.equal(hostOf('https://www.example.org/a'), 'example.org');
  assert.equal(hostOf('not a url'), 'not a url');
});

test('coerce maps each schema type to its front matter shape', () => {
  assert.deepEqual(coerce({ type: 'list' }, 'a\nb'), ['a', 'b']);
  assert.deepEqual(coerce({ type: 'multiselect', options: ['A', 'B'] }, 'A, B'), ['A', 'B']);
  assert.deepEqual(coerce({ type: 'multiselect', options: ['A'] }, ''), []);
  assert.deepEqual(coerce({ type: 'links' }, 'X | https://e.org'), [{ label: 'X', url: 'https://e.org' }]);
  assert.equal(coerce({ type: 'boolean' }, 'Yes'), true);
  assert.equal(coerce({ type: 'number' }, '42 people'), 42);
  assert.equal(coerce({ type: 'number' }, 'many'), '');
  assert.equal(coerce({ type: 'date' }, 'around 2026-03-04'), '2026-03-04');
  assert.equal(coerce({ type: 'date' }, 'soon'), '');
  assert.equal(coerce({ type: 'text' }, '  hi  '), 'hi');
  assert.equal(coerce({ type: 'markdown' }, 'x'), null);
  assert.equal(coerce({ type: 'images' }, 'x'), null);
});

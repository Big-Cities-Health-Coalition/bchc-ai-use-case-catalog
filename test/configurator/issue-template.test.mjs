import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as jsYaml from 'js-yaml';

import { issueTemplateFromSchema, groupedFormFields } from '../../assets/js/configurator/issue-template.js';
import { defaultConfig } from '../../assets/js/configurator/default-config.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TEMPLATE_PATH = '.github/ISSUE_TEMPLATE/new-entry.yml';

const shipped = defaultConfig();

/** The generated template, parsed. */
function generate(schema = shipped.schema, site = shipped.site) {
  return jsYaml.load(issueTemplateFromSchema(schema, site));
}

test('the committed issue template matches what the schema generates', () => {
  const committed = fs.readFileSync(path.join(ROOT, TEMPLATE_PATH), 'utf8');
  assert.equal(
    issueTemplateFromSchema(shipped.schema, shipped.site),
    committed,
    `${TEMPLATE_PATH} is stale. Run \`npm run generate\` and commit the result.`
  );
});

test('the template keeps its GitHub top-level keys', () => {
  const doc = generate();
  assert.deepEqual(Object.keys(doc), ['name', 'description', 'title', 'labels', 'body']);
  assert.equal(doc.name, 'Submit a use case (creates PR)');
  assert.equal(doc.title, '[Use case] ');
  assert.deepEqual(doc.labels, ['content:new-entry']);
  assert.equal(doc.description, shipped.site.submit.intro);
});

test('the header names the generator and forbids hand-editing', () => {
  const text = issueTemplateFromSchema(shipped.schema, shipped.site);
  assert.match(text, /^# GitHub issue form for new entries\./);
  assert.match(text, /Generated from _data\/schema\.yml by scripts\/generate\.mjs — do not hand-edit\./);
});

test('every field becomes one control keyed by its schema key', () => {
  const doc = generate();
  const controls = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  for (const field of shipped.schema.fields) {
    if (field.form === false) continue;
    assert.ok(controls.has(field.key), `${field.key} has a control`);
    assert.equal(
      controls.get(field.key).attributes.label,
      field.label,
      `${field.key} keeps its label verbatim`
    );
  }
});

test('types map to the right GitHub controls', () => {
  const doc = generate();
  const byId = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  assert.equal(byId.get('title').type, 'input');
  assert.equal(byId.get('summary').type, 'textarea');
  assert.equal(byId.get('solution_type').type, 'dropdown', 'select -> dropdown');
  assert.equal(byId.get('area').type, 'dropdown', 'multiselect -> multi dropdown');
  assert.equal(byId.get('area').attributes.multiple, true, 'multiselect dropdowns are multiple');
  assert.equal(byId.get('ai_tools').type, 'textarea', 'list -> textarea');
  assert.equal(byId.get('screenshots').type, 'textarea', 'images -> textarea');
  assert.equal(byId.get('resources').type, 'textarea', 'links -> textarea');
  assert.equal(byId.get('body').type, 'textarea', 'markdown -> textarea');
  assert.equal(byId.get('contact_email').type, 'input');
  assert.equal(byId.get('deck_pdf').type, 'upload', 'file -> upload');
});

test('options are copied verbatim for both kinds of dropdown', () => {
  const doc = generate();
  const byId = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  const select = shipped.schema.fields.find((f) => f.key === 'solution_type');
  assert.deepEqual(byId.get('solution_type').attributes.options, select.options);

  // Plain strings, not `{label}` objects: that shape belongs to `checkboxes`,
  // which this generator no longer emits.
  const multi = shipped.schema.fields.find((f) => f.key === 'area');
  assert.deepEqual(byId.get('area').attributes.options, multi.options);
});

test('an option label containing a comma survives verbatim', () => {
  const doc = generate();
  const byId = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  const withComma = byId.get('area').attributes.options.filter((option) => option.includes(','));
  assert.ok(withComma.length > 0, 'the shipped schema has an option with a comma in it');
  withComma.forEach((option) => {
    assert.ok(
      shipped.schema.fields.find((f) => f.key === 'area').options.includes(option),
      'the comma is not split or escaped'
    );
  });
});

test('required is set from the schema on every control, multi-selects included', () => {
  const doc = generate();
  const byId = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  assert.equal(byId.get('title').validations.required, true);
  assert.equal(byId.get('impact').validations.required, false);
  // A multi-select dropdown can be required; the `checkboxes` control it
  // replaced could not, and used to fake it with a line of description text.
  assert.equal(byId.get('area').validations.required, true);
  assert.doesNotMatch(byId.get('area').attributes.description, /Required — choose at least one/);
});

test('prompt comes before description in the help text', () => {
  const doc = generate();
  const summary = doc.body.find((item) => item.id === 'summary');
  const field = shipped.schema.fields.find((f) => f.key === 'summary');
  assert.ok(summary.attributes.description.startsWith(field.prompt), 'prompt first');
  assert.ok(summary.attributes.description.includes(field.description), 'description second');
});

test('images and links controls explain their line format', () => {
  const doc = generate();
  const byId = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  assert.match(byId.get('screenshots').attributes.description, /one image URL per line/i);
  assert.match(byId.get('screenshots').attributes.description, /alt text/i);
  assert.match(byId.get('resources').attributes.description, /`Label \| URL`/);
});

test('groups become markdown separators in schema order', () => {
  const doc = generate();
  const headings = doc.body
    .filter((item) => item.type === 'markdown' && String(item.attributes.value).startsWith('### '))
    .map((item) => String(item.attributes.value).split('\n')[0].replace('### ', ''));
  assert.deepEqual(
    headings,
    shipped.schema.groups.map((group) => group.title)
  );
});

test('fields are ordered by weight inside their group', () => {
  const sections = groupedFormFields(shipped.schema);
  for (const section of sections) {
    const weights = section.fields.map((field) => field.weight ?? 5);
    assert.deepEqual(
      [...weights].sort((a, b) => a - b),
      weights,
      `${section.group.key} is weight-ordered`
    );
  }
});

test('ungrouped fields land in a trailing "More" group', () => {
  const sections = groupedFormFields({
    groups: [{ key: 'about', title: 'About' }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', group: 'about' },
      { key: 'stray', label: 'Stray', type: 'text' },
    ],
  });
  assert.deepEqual(
    sections.map((s) => s.group.key),
    ['about', 'other']
  );
  assert.equal(sections[1].group.title, 'More');
});

test('a file field is a real upload control that accepts its own extension', () => {
  const doc = generate();
  const deck = doc.body.find((item) => item.id === 'deck_pdf');
  assert.ok(deck, 'the deck field is a control, not a paragraph telling someone to do it later');
  assert.equal(deck.type, 'upload');
  assert.equal(deck.validations.accept, '.pdf', 'accept comes from the schema `filename`');
  assert.equal(deck.validations.required, false);
  assert.equal(deck.attributes.placeholder, undefined, 'an upload has nothing to prefill');
  assert.equal(
    doc.body.some(
      (item) => item.type === 'markdown' && /cannot accept file uploads/i.test(String(item.attributes.value))
    ),
    false,
    'the old "GitHub cannot do this" instruction is gone'
  );
});

test('a file field points past-the-cap files at the first links field the form asks', () => {
  const doc = generate();
  const deck = doc.body.find((item) => item.id === 'deck_pdf');
  const linksField = shipped.schema.fields.find((field) => field.type === 'links' && field.form !== false);
  assert.ok(linksField, 'the shipped schema has a links field on the form');
  assert.ok(
    deck.attributes.description.endsWith(
      `Over 25 MB, or kept in a shared workspace? Paste a link in “${linksField.label}” instead.`
    ),
    deck.attributes.description
  );

  // A links field the form never shows is no place to send anyone, and a
  // schema without one gets no sentence at all.
  const schemaFor = (extra) => ({
    entry: { singular: 'Entry' },
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'deck', label: 'Deck', type: 'file', filename: 'deck.pdf' },
      ...extra,
    ],
  });
  for (const extra of [[], [{ key: 'adopters', label: 'Adopters', type: 'links', form: false }]]) {
    const upload = jsYaml
      .load(issueTemplateFromSchema(schemaFor(extra)))
      .body.find((item) => item.id === 'deck');
    assert.doesNotMatch(upload.attributes.description, /25 MB/);
  }
  const custom = jsYaml
    .load(issueTemplateFromSchema(schemaFor([{ key: 'more', label: 'More links', type: 'links' }])))
    .body.find((item) => item.id === 'deck');
  assert.match(custom.attributes.description, /Paste a link in “More links” instead\.$/);
});

test('an image field uploads, an images gallery stays a textarea', () => {
  const doc = jsYaml.load(
    issueTemplateFromSchema({
      entry: { singular: 'Entry' },
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'cover', label: 'Cover image', type: 'image', required: true },
        { key: 'shots', label: 'Screenshots', type: 'images' },
      ],
    })
  );
  const byId = new Map(doc.body.filter((item) => item.id).map((item) => [item.id, item]));
  assert.equal(byId.get('cover').type, 'upload');
  assert.equal(byId.get('cover').validations.accept, '.png,.jpg,.jpeg,.gif,.webp');
  assert.equal(byId.get('cover').validations.required, true);
  // `upload` holds one file and has no per-file alt text, so a gallery keeps
  // the textarea it drags images into.
  assert.equal(byId.get('shots').type, 'textarea');
});

test('form: false fields are left out entirely', () => {
  const schema = {
    groups: [{ key: 'about', title: 'About' }],
    entry: { singular: 'Entry' },
    fields: [
      { key: 'title', label: 'Title', type: 'text', group: 'about', required: true },
      { key: 'internal', label: 'Internal note', type: 'text', group: 'about', form: false },
    ],
  };
  const doc = jsYaml.load(issueTemplateFromSchema(schema));
  assert.equal(
    doc.body.some((item) => item.id === 'internal'),
    false
  );
});

test('a schema with no title field gets one synthesised', () => {
  const doc = jsYaml.load(
    issueTemplateFromSchema({
      entry: { singular: 'Resource' },
      fields: [{ key: 'note', label: 'Note', type: 'text' }],
    })
  );
  const title = doc.body.find((item) => item.id === 'title');
  assert.ok(title, 'a title input is always present');
  assert.equal(title.validations.required, true);
});

test('a single group does not get a redundant separator', () => {
  const doc = jsYaml.load(
    issueTemplateFromSchema({
      groups: [{ key: 'about', title: 'About' }],
      fields: [{ key: 'title', label: 'Title', type: 'text', group: 'about', required: true }],
    })
  );
  assert.equal(
    doc.body.some((item) => item.type === 'markdown'),
    false
  );
});

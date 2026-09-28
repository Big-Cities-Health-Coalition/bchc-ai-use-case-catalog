/**
 * Build `.github/ISSUE_TEMPLATE/new-entry.yml` from the content model.
 *
 * The generated form keeps `label: <field.label>` verbatim — the scaffolder
 * (scripts/new_entry_from_issue.mjs) matches the rendered `### <label>`
 * headings back to schema keys. The friendlier `prompt` goes into the field's
 * description instead, so both wizards and the issue form ask the same
 * question without breaking the parser.
 */

import { toYaml, isPlainObject } from './yaml-emit.js';
import { sortByWeight } from './schema-validate.js';

/** Field types that render as a single-line GitHub `input`. */
const INPUT_TYPES = new Set(['text', 'url', 'email', 'date', 'number']);

/** Field types that become GitHub's `upload` control (one attachment each). */
const UPLOAD_TYPES = new Set(['file', 'image']);

/** `validations.accept` for an `image` upload — everything the scaffolder stores. */
const IMAGE_EXTENSIONS = '.png,.jpg,.jpeg,.gif,.webp';

/** Group used by fields that declare no `group`. */
const OTHER_GROUP = { key: 'other', title: 'More' };

/** Extra guidance appended to a field's description, by type. */
const TYPE_GUIDANCE = {
  list: 'One per line, or separated by commas.',
  images:
    'Drag images into this box to upload them, or paste one image URL per line — optionally as `URL | alt text`.',
  links: 'One per line as `Label | URL`.',
  file: 'Attach the file here and the automation commits it with the entry.',
  image: 'Attach the image here and the automation commits it with the entry.',
};

function capitalizeFirst(str) {
  const s = String(str ?? '').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function lowercaseFirst(str) {
  const s = String(str ?? '').trim();
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** Join sentence fragments into one help string, punctuating as it goes. */
function joinSentences(parts) {
  return parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .map((part) => (/[.!?:)\]]$/.test(part) ? part : `${part}.`))
    .join(' ');
}

/**
 * Fields grouped for display: declared groups in order, then anything
 * ungrouped under "More". Fields inside a group are ordered by `weight`.
 *
 * @param {object} schema
 * @returns {{group: {key: string, title: string, description?: string}, fields: object[]}[]}
 */
export function groupedFormFields(schema) {
  const fields = (Array.isArray(schema?.fields) ? schema.fields : []).filter(
    (field) => isPlainObject(field) && field.form !== false
  );
  const declared = Array.isArray(schema?.groups) ? schema.groups.filter(isPlainObject) : [];
  const order = [...declared, OTHER_GROUP];

  const buckets = new Map(order.map((group) => [String(group.key), []]));
  for (const field of fields) {
    const key = String(field.group ?? '').trim();
    const bucket = buckets.has(key) ? buckets.get(key) : buckets.get(OTHER_GROUP.key);
    bucket.push(field);
  }

  return order
    .map((group) => ({ group, fields: sortByWeight(buckets.get(String(group.key)) || []) }))
    .filter((section) => section.fields.length > 0);
}

/**
 * File extensions an `upload` control accepts, as GitHub's comma-separated
 * `validations.accept` string. A `file` field names its own extension through
 * `filename`; an `image` field takes everything the scaffolder can store.
 *
 * @param {{type?: string, filename?: string, key?: string}} field
 * @returns {string}
 */
function acceptFor(field) {
  if (String(field?.type ?? '') === 'image') return IMAGE_EXTENSIONS;
  const match = /\.[a-z0-9]+$/i.exec(String(field?.filename ?? '').trim());
  return match ? match[0].toLowerCase() : '.pdf';
}

/**
 * The sentence a `file` question adds for a file the upload control cannot
 * take — over GitHub's 25 MB cap, or kept in a shared workspace — naming the
 * first `links` question the form asks. No such question, no sentence: there
 * would be nowhere to paste the link. submit/index.md says the same thing.
 *
 * @param {object} schema
 * @returns {string}
 */
function fileLinkHint(schema) {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const links = fields.find(
    (field) =>
      isPlainObject(field) &&
      field.type === 'links' &&
      field.form !== false &&
      String(field.label ?? '').trim()
  );
  return links
    ? `Over 25 MB, or kept in a shared workspace? Paste a link in “${String(links.label).trim()}” instead.`
    : '';
}

/**
 * The one control this field becomes in the issue form, or null to skip it.
 * @param {object} field
 * @param {{fileHint?: string}} [context] schema-wide copy a control may append
 */
function controlFor(field, context = {}) {
  const key = String(field.key ?? '').trim();
  const label = String(field.label ?? '').trim();
  const type = String(field.type ?? '').trim();
  if (!key || !label || !type) return null;

  const required = field.required === true;
  const placeholder = String(field.placeholder ?? '');
  const attributes = { label };

  const description = joinSentences([
    field.prompt,
    field.description,
    TYPE_GUIDANCE[type],
    type === 'file' ? context.fileHint : '',
  ]);
  if (description) attributes.description = description;

  // GitHub issue forms accept attachments through an `upload` element, so a
  // `file`/`image` field is a real control and the submission arrives with its
  // deck or photo. It carries no placeholder and holds exactly one file, which
  // is why `images` (a gallery, with alt text per line) stays a textarea.
  // `validations.required` on an upload is only enforced on public
  // repositories — see docs/content-model.md.
  if (UPLOAD_TYPES.has(type)) {
    return { type: 'upload', id: key, attributes, validations: { required, accept: acceptFor(field) } };
  }

  const item = { type: 'input', id: key, attributes };

  if (INPUT_TYPES.has(type)) {
    if (placeholder.trim()) attributes.placeholder = placeholder;
  } else if (type === 'textarea' || type === 'list' || type === 'images' || type === 'links') {
    item.type = 'textarea';
    if (placeholder.trim()) attributes.placeholder = placeholder;
  } else if (type === 'markdown') {
    item.type = 'textarea';
    if (placeholder.includes('\n')) attributes.value = placeholder;
    else if (placeholder.trim()) attributes.placeholder = placeholder;
  } else if (type === 'multiselect') {
    // A multi-select dropdown, not `checkboxes`: GitHub can prefill a dropdown
    // from the query string and enforce `validations.required` on it, and can
    // do neither for checkboxes. The cost is that `option_meta.description`
    // has nowhere to live in the raw GitHub form — the web form still shows it.
    item.type = 'dropdown';
    attributes.multiple = true;
    attributes.options = (Array.isArray(field.options) ? field.options : [])
      .map((option) => String(option))
      .filter((option) => option.trim() !== '');
  } else if (type === 'select') {
    item.type = 'dropdown';
    attributes.options = (Array.isArray(field.options) ? field.options : [])
      .map((option) => String(option))
      .filter((option) => option.trim() !== '');
  } else if (type === 'boolean') {
    item.type = 'dropdown';
    attributes.options = ['Yes', 'No'];
  } else if (placeholder.trim()) {
    attributes.placeholder = placeholder;
  }

  // Every control this generator emits (input, textarea, dropdown) accepts
  // `validations`. GitHub only enforces it on public repositories, so the web
  // form's own validation stays the first line of defence.
  item.validations = { required };
  return item;
}

/**
 * Render the GitHub issue form.
 *
 * @param {object} schema parsed `_data/schema.yml`
 * @param {object} [site] parsed `_data/site.yml` (submit copy, site name)
 * @returns {string} YAML text ending in a newline.
 */
export function issueTemplateFromSchema(schema, site = {}) {
  const singular = String(schema?.entry?.singular ?? 'Entry').trim() || 'Entry';
  const siteName = String(site?.name ?? '').trim();
  const body = [];

  const reviewNote = String(site?.submit?.review_note ?? '').trim();
  if (reviewNote) body.push({ type: 'markdown', attributes: { value: reviewNote } });

  const sections = groupedFormFields(schema);
  const hasTitleField = sections.some((section) => section.fields.some((field) => field.key === 'title'));

  // Every entry needs a title. Only synthesise one when the schema has no
  // `title` field of its own.
  if (!hasTitleField) {
    body.push({
      type: 'input',
      id: 'title',
      attributes: {
        label: 'Title',
        description: `A short, specific name for this ${lowercaseFirst(singular)}.`,
      },
      validations: { required: true },
    });
  }

  const context = { fileHint: fileLinkHint(schema) };
  const multipleSections = sections.length > 1;
  for (const section of sections) {
    if (multipleSections) {
      const heading = String(section.group.title ?? '').trim();
      const blurb = String(section.group.description ?? '').trim();
      if (heading) {
        body.push({
          type: 'markdown',
          attributes: { value: blurb ? `### ${heading}\n\n${blurb}` : `### ${heading}` },
        });
      }
    }
    for (const field of section.fields) {
      const control = controlFor(field, context);
      if (control) body.push(control);
    }
  }

  const template = {
    name: `Submit a ${lowercaseFirst(singular)} (creates PR)`,
    description:
      String(site?.submit?.intro ?? '').trim() ||
      `Propose a new ${lowercaseFirst(singular)}${siteName ? ` for ${siteName}` : ''}. A maintainer reviews it as a pull request.`,
    title: `[${capitalizeFirst(singular)}] `,
    labels: ['content:new-entry'],
    body,
  };

  return toYaml(template, {
    header:
      'GitHub issue form for new entries.\n' +
      'Generated from _data/schema.yml by scripts/generate.mjs — do not hand-edit.\n' +
      'Regenerate with `npm run generate` after changing _data/schema.yml.',
  });
}

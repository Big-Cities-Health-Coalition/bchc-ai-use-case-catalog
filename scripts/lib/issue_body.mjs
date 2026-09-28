/**
 * Parsing of a GitHub issue-form body into schema field values.
 *
 * GitHub renders an issue form as a flat markdown document:
 *
 *     ### <field label>
 *
 *     <value>
 *
 * where `<value>` is `_No response_` when the submitter left it blank, a
 * comma-joined string for a multi-select dropdown, `- [x] Option` lines when
 * the field was rendered as checkboxes, and a markdown link or image embed
 * when the field was an `upload`. Every function here is pure and
 * schema-driven — no field key is ever named. See test/scripts/issue_body.test.mjs.
 */

/** GitHub's placeholder for an unanswered optional field. */
export const NO_RESPONSE = '_no response_';

/**
 * Normalize a heading or a schema label so the two can be compared
 * (case, whitespace and a trailing "(optional)"/"(required)" are ignored).
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeLabel(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\((optional|required)\)\s*$/, '');
}

/**
 * Split an issue body into `normalized heading -> raw value`.
 *
 * A GitHub issue form renders its fields as `### <label>` sections in template
 * order, so the structure — not just the text — tells us where a section ends.
 * Three rules make the split un-spoofable by whatever the submitter typed:
 *
 *   1. Only headings the caller recognises start a section. A `###` the
 *      submitter invented is body text.
 *   2. The FIRST occurrence of a known heading wins. A later `### Organization`
 *      cannot overwrite the answer GitHub itself collected; it is reported as
 *      an ignored duplicate instead.
 *   3. `finalLabel` names the last field of the template — the free-form
 *      markdown write-up. Once its heading is seen, every remaining line
 *      belongs to it, `###` lines included. Nothing after the write-up can be
 *      re-read as a field answer.
 *
 * Pass an empty `knownLabels` to treat every `###` as a boundary (used by the
 * "paste a blank issue" fallback, where no template order exists).
 *
 * @param {string} body raw issue body (CRLF tolerated)
 * @param {Iterable<string>} [knownLabels] labels that may start a section
 * @param {string} [finalLabel] label of the trailing free-form field
 * @returns {{sections: Map<string, string>, warnings: string[]}}
 */
export function parseIssueForm(body, knownLabels = [], finalLabel = '') {
  const known = new Set(Array.from(knownLabels, normalizeLabel).filter(Boolean));
  const terminal = normalizeLabel(finalLabel);
  const sections = new Map();
  /** @type {string[]} */
  const warnings = [];
  const seen = new Set();
  const lines = String(body ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n');

  let heading = null;
  let buffer = [];
  let sealed = false;
  const flush = () => {
    // First occurrence wins; a duplicate's body is discarded, not merged.
    if (heading !== null && !sections.has(heading)) sections.set(heading, buffer.join('\n').trim());
    buffer = [];
  };

  for (const line of lines) {
    const match = sealed ? null : /^###[ \t]+(.*)$/.exec(line);
    const candidate = match ? normalizeLabel(match[1]) : null;
    if (candidate !== null && (known.size === 0 || known.has(candidate))) {
      flush();
      if (seen.has(candidate)) warnings.push(`Duplicate section "${candidate}" ignored.`);
      seen.add(candidate);
      heading = candidate;
      if (terminal && candidate === terminal) sealed = true;
      continue;
    }
    if (heading !== null) buffer.push(line);
  }
  flush();
  return { sections, warnings };
}

/**
 * `parseIssueForm` when only the sections are wanted.
 * @param {string} body
 * @param {Iterable<string>} [knownLabels]
 * @param {string} [finalLabel]
 * @returns {Map<string, string>}
 */
export function parseSections(body, knownLabels = [], finalLabel = '') {
  return parseIssueForm(body, knownLabels, finalLabel).sections;
}

/**
 * Raw answer for a schema field: matched by label first, then by key.
 * Returns `''` for a missing section or GitHub's `_No response_`.
 * @param {Map<string, string>} sections
 * @param {{label?: string, key?: string, prompt?: string}} field
 * @returns {string}
 */
export function rawValue(sections, field) {
  const candidates = [field?.label, field?.key, field?.prompt].map(normalizeLabel).filter(Boolean);
  for (const candidate of candidates) {
    const value = sections.get(candidate);
    if (value === undefined) continue;
    return value.trim().toLowerCase() === NO_RESPONSE ? '' : value.trim();
  }
  return '';
}

/**
 * Selected values of a multiselect, tolerating all three renderings GitHub can
 * produce: a comma-joined dropdown value, `- [x] Option` checkboxes, and one
 * option per line. Options are matched longest-first so an option containing a
 * comma survives the split.
 * @param {string} raw
 * @param {string[]} options declared options (may be empty for free lists)
 * @returns {string[]}
 */
export function parseMultiselect(raw, options = []) {
  const byLength = [...options].map(String).sort((a, b) => b.length - a.length);
  const selected = [];

  for (const line of String(raw ?? '').split('\n')) {
    const checkbox = /^\s*[-*]\s*\[([xX ])\]\s*(.*)$/.exec(line);
    let rest;
    if (checkbox) {
      if (checkbox[1].trim() === '') continue; // unticked
      rest = checkbox[2].trim();
    } else {
      rest = line.replace(/^\s*[-*]\s+/, '').trim();
    }

    while (rest.length > 0) {
      const match = byLength.find((opt) => rest.toLowerCase().startsWith(opt.toLowerCase()));
      if (match) {
        selected.push(match);
        rest = rest.slice(match.length);
      } else {
        const idx = rest.indexOf(',');
        const piece = (idx === -1 ? rest : rest.slice(0, idx)).trim();
        if (piece) selected.push(piece);
        rest = idx === -1 ? '' : rest.slice(idx);
      }
      rest = rest.replace(/^\s*,\s*/, '').trim();
    }
  }
  return [...new Set(selected)];
}

/**
 * Free-form list field: one item per line, or comma separated.
 * @param {string} raw
 * @returns {string[]}
 */
export function parseList(raw) {
  return String(raw ?? '')
    .split(/[\n,]/)
    .map((item) => item.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Truthiness of a boolean answer ("Yes", "true", a ticked checkbox…).
 * @param {string} raw
 * @returns {boolean}
 */
export function parseBoolean(raw) {
  return /^(true|yes|y|on|1|checked|\[x\])$/i.test(String(raw ?? '').trim());
}

/**
 * An http(s) URL the site can render: a lower-case scheme and nothing that
 * would break out of an HTML attribute. The same test as the page's `http_url`
 * filter (_plugins/theme_filters.rb) and the validator's `http_url?`
 * (scripts/check_front_matter.rb), so a value a script writes is one the page
 * renders and `npm run validate` accepts.
 */
export const SITE_HTTP_URL = /^https?:\/\/[^\s"'<>]+$/;

/**
 * The URL as the site wants it, or '' when it cannot be one. The scheme is
 * lower-cased first (a browser takes `HTTPS://`, the page's test does not);
 * anything else is left exactly as written.
 * @param {unknown} value
 * @returns {string}
 */
export function siteHttpUrl(value) {
  const url = String(value ?? '')
    .trim()
    .replace(/^https?:/i, (scheme) => scheme.toLowerCase());
  return SITE_HTTP_URL.test(url) ? url : '';
}

/**
 * `text` as a markdown code span for a pull request or issue comment, so a
 * submitter's value renders literally and an `@name` in it pings nobody.
 * Backticks become `'`: a code span cannot contain its own delimiter.
 * @param {unknown} text
 * @returns {string}
 */
export function codeSpan(text) {
  return `\`${String(text).replace(/`/g, "'")}\``;
}

/** @returns {boolean} true when the string is an http(s) URL. */
export function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value ?? '').trim());
}

/**
 * Host of a URL, used as the fallback label of a bare link.
 * @param {string} url
 * @returns {string}
 */
export function hostOf(url) {
  try {
    return new URL(String(url)).host.replace(/^www\./, '');
  } catch {
    return String(url);
  }
}

/**
 * Parse a `links` field. Accepted per line:
 *   `Label | URL`, `Label — URL`, `Label: URL`, `[Label](URL)`, or a bare URL
 *   (label falls back to the host). Non-http(s) lines are dropped.
 * @param {string} raw
 * @returns {Array<{label: string, url: string}>}
 */
export function parseLinks(raw) {
  const links = [];
  for (const line of String(raw ?? '').split('\n')) {
    const text = line.replace(/^\s*[-*]\s+/, '').trim();
    if (!text) continue;

    let label = '';
    let url;

    const markdown = /^\[([^\]]*)\]\((\S+?)\)$/.exec(text);
    const separated = /^(.*?)\s*[|—–]\s*(\S+)$/.exec(text);
    const colon = /^(.+?):[ \t]+(\S+)$/.exec(text);

    if (markdown) {
      [, label, url] = markdown;
    } else if (separated) {
      [, label, url] = separated;
    } else if (colon && isHttpUrl(colon[2])) {
      [, label, url] = colon;
    } else {
      url = text;
    }

    url = url.trim();
    if (!isHttpUrl(url)) continue;
    links.push({ label: label.trim() || hostOf(url), url });
  }
  return links;
}

/**
 * The one attachment behind a `file`/`image` answer.
 *
 * GitHub's `upload` element renders its answer into the issue body as a
 * markdown link (`[deck.pdf](https://github.com/.../deck.pdf)`) for documents
 * and as an image embed (`![shot.png](…)`) for pictures, so both spellings are
 * accepted — as is a bare URL, which is what a hand-written or copy-pasted body
 * carries. Everything after the first attachment is ignored: the control holds
 * one file.
 *
 * @param {string} raw
 * @returns {{url: string, name: string}|null}
 */
export function parseAttachmentRef(raw) {
  const text = String(raw ?? '').trim();
  if (!text || text.toLowerCase() === NO_RESPONSE) return null;

  // The image form first — `![a](b)` also matches the plain-link pattern.
  const embedded = /!\[([^\]]*)\]\((\S+?)\)/.exec(text) ?? /\[([^\]]*)\]\((\S+?)\)/.exec(text);
  if (embedded && isHttpUrl(embedded[2])) return { url: embedded[2].trim(), name: embedded[1].trim() };

  const tag = /<img\b[^>]*>/i.exec(text);
  if (tag) {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag[0]);
    if (src && isHttpUrl(src[1])) return { url: src[1].trim(), name: '' };
  }

  for (const line of text.split('\n')) {
    const bare = line.replace(/^\s*[-*]\s+/, '').trim();
    if (isHttpUrl(bare)) return { url: bare, name: '' };
  }
  return null;
}

/**
 * Parse an `images` field into download candidates. Accepted per line:
 *   `![alt](url)`, `<img src="url" alt="…">`, `url | alt`, or a bare URL.
 * Duplicate URLs are collapsed, keeping the first alt text seen.
 * @param {string} raw
 * @returns {Array<{url: string, alt: string}>}
 */
export function parseImageRefs(raw) {
  const found = new Map();
  const add = (url, alt) => {
    const clean = String(url ?? '')
      .trim()
      .replace(/[).,]+$/, '');
    if (!isHttpUrl(clean) || found.has(clean)) return;
    found.set(clean, { url: clean, alt: String(alt ?? '').trim() });
  };

  const text = String(raw ?? '');
  for (const match of text.matchAll(/!\[([^\]]*)\]\((\S+?)\)/g)) add(match[2], match[1]);
  for (const match of text.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(match[0]);
    const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(match[0]);
    if (src) add(src[1], alt ? alt[1] : '');
  }
  for (const line of text.split('\n')) {
    const bare = line.replace(/^\s*[-*]\s+/, '').trim();
    if (!bare || bare.startsWith('!') || bare.startsWith('<')) continue;
    const separated = /^(\S+)\s*\|\s*(.*)$/.exec(bare);
    if (separated) add(separated[1], separated[2]);
    else add(bare, '');
  }
  return [...found.values()];
}

// One slug rule, three call sites. The configurator's implementation is the
// canonical one — /submit/ shows the submitter the slug it produces, so the
// scaffolder that names the folder has to agree with it, or "Köln
// Gesundheitsamt" is previewed as `koln-…` and published as `k-ln-…`.
// scripts/lib/slugify.rb is the Ruby port; test/scripts/slugify_parity.test.mjs
// runs both over one fixture list.
export { slugify } from '../../assets/js/configurator/strings.js';

/**
 * Slug for a title that has nothing left after normalizing — a title written
 * entirely in a non-Latin script, or only in emoji. Deterministic on purpose:
 * a re-run of the same issue has to produce the same folder.
 *
 * Only the URL is affected; the title itself lives in the front matter.
 * @param {string|number} issueNumber
 * @returns {string}
 */
export function slugFallback(issueNumber) {
  const suffix = String(issueNumber ?? '').trim();
  return `entry-${/^\d+$/.test(suffix) ? suffix : Date.now().toString(36)}`;
}

/**
 * First free slug in the `base`, `base-2`, `base-3`… sequence.
 * @param {string} base
 * @param {(slug: string) => boolean} taken predicate, usually a directory check
 * @param {number} [limit] how many suffixes to try before giving up
 * @returns {string}
 */
export function uniqueSlug(base, taken, limit = 50) {
  if (!base) return '';
  if (!taken(base)) return base;
  for (let n = 2; n <= limit; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken(candidate)) return candidate;
  }
  return '';
}

/**
 * Coerce one raw answer to the front matter shape its schema type requires.
 * `markdown`, `images` and `file` are handled by the caller (they need the
 * entry folder), so they return `null` here.
 * @param {{type?: string, options?: string[]}} field
 * @param {string} raw
 * @returns {string|number|boolean|string[]|Array<object>|null}
 */
export function coerce(field, raw) {
  const type = String(field?.type ?? 'text');
  const text = String(raw ?? '').trim();

  switch (type) {
    case 'multiselect':
      return text ? parseMultiselect(text, Array.isArray(field.options) ? field.options : []) : [];
    case 'list':
      return text ? parseList(text) : [];
    case 'links':
      return text ? parseLinks(text) : [];
    case 'boolean':
      return parseBoolean(text);
    case 'number': {
      if (!text) return '';
      const direct = Number(text.replace(/[\s,]/g, ''));
      if (Number.isFinite(direct)) return direct;
      const match = /[-+]?\d+(?:\.\d+)?/.exec(text);
      return match ? Number(match[0]) : '';
    }
    case 'date': {
      const match = /\d{4}-\d{2}-\d{2}/.exec(text);
      return match ? match[0] : '';
    }
    case 'markdown':
    case 'images':
    case 'file':
      return null;
    default:
      return text;
  }
}

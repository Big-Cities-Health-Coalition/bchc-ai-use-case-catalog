/**
 * Vocabulary-aware search: the half of assets/js/search.js that answers with a
 * FILTER instead of a document.
 *
 * The two halves of the catalog UI are deliberately decoupled — search.js reads
 * `window.__catalogFilters`, which assets/js/filters.js publishes — so this file
 * stubs that bridge rather than booting the whole filter engine. What it is
 * pinning down is the contract itself: which queries earn a suggestion, in what
 * order, what the row says, and what selecting one does to the query. The
 * filters.js side of the same contract is covered in filter_state.test.mjs and
 * by the shipped markup in _includes/filter-groups.html.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HTML = fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'search-page.html'), 'utf8');
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'search-index.json'), 'utf8'));
const LUNR = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'lunr.min.js'), 'utf8');
const SEARCH = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'search.js'), 'utf8');

/**
 * The vocabulary filters.js would publish for a catalog with two facets. Shaped
 * exactly like its `vocabulary()` return value, including the distinction that
 * matters most: `count` is live (zero once a query has excluded everything) and
 * `total` is what the value is worth on its own.
 * @returns {object[]}
 */
function vocabulary() {
  return [
    {
      key: 'ai-types',
      value: 'chat-assistant',
      label: 'Chat assistant',
      group: 'Types of AI',
      terms: ['chat assistant', 'chat', 'chatbot', 'virtual assistant'],
      count: 0,
      total: 6,
      active: false,
    },
    {
      key: 'ai-types',
      value: 'translation',
      label: 'Translation',
      group: 'Types of AI',
      terms: ['translation', 'multilingual', 'language access'],
      count: 1,
      total: 2,
      active: false,
    },
    {
      key: 'area',
      value: 'communications',
      label: 'Communications',
      group: 'Program area',
      terms: ['communications', 'chat', 'outreach'],
      count: 0,
      total: 9,
      active: false,
    },
    {
      key: 'area',
      value: 'already-on',
      label: 'Already on',
      group: 'Program area',
      terms: ['chatbot'],
      count: 3,
      total: 3,
      active: true,
    },
    {
      key: 'area',
      value: 'unused',
      label: 'Unused',
      group: 'Program area',
      terms: ['chatbot'],
      count: 0,
      total: 0,
      active: false,
    },
  ];
}

/**
 * A booted catalog page with search wired up and the filter bridge stubbed.
 * @param {{withFilters?: boolean}} [options] withFilters false boots a page
 *   where filters.js never ran (no grid, e.g. a facet landing page).
 * @returns {Promise<object>}
 */
async function boot(options = {}) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', () => {});
  const dom = new JSDOM('<!doctype html><body>' + HTML + '</body>', {
    url: 'https://example.org/catalog/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    virtualConsole,
  });
  const { window } = dom;
  window.fetch = options.fetch || (() => Promise.resolve({ ok: true, json: () => Promise.resolve(INDEX) }));

  const applied = [];
  if (options.withFilters !== false) {
    window.__catalogFilters = {
      vocabulary,
      apply: (key, value) => {
        applied.push([key, value]);
        return true;
      },
    };
  }

  await new Promise((resolve) => {
    if (window.document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve);
  });
  window.eval(LUNR);
  window.eval(SEARCH);

  const document = window.document;
  const input = document.querySelector('[data-filter="search"]');
  return {
    window,
    document,
    input,
    applied,
    suggestions: document.querySelector('[data-empty-suggestions]'),
    rows: () => Array.from(document.querySelectorAll('[data-search-results] [role="option"]')),
    facetRows: () => Array.from(document.querySelectorAll('[data-search-results] [data-facet-key]')),
    chips: () => Array.from(document.querySelectorAll('[data-empty-suggestions] button')),
    type: async (value) => {
      input.focus();
      input.value = value;
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
      await settle(window);
    },
    key: (key) => input.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true })),
  };
}

/**
 * Let the 50ms debounce fire and every chained promise resolve.
 * @param {object} window
 */
function settle(window) {
  return new Promise((resolve) => window.setTimeout(() => setTimeout(resolve, 0), 200));
}

/* ------------------------------------------------------------- matching */

test('a query that hits an alias offers the filter, not just the text hits', async () => {
  const page = await boot();
  await page.type('chatbot');

  const facets = page.facetRows();
  assert.equal(facets.length, 1);
  assert.equal(facets[0].dataset.facetKey, 'ai-types');
  assert.equal(facets[0].dataset.facetValue, 'chat-assistant');
});

test('filter rows come before the document hits', async () => {
  const page = await boot();
  await page.type('translation');

  const rows = page.rows();
  assert.ok(rows.length > 1, 'expected document hits alongside the filter');
  assert.equal(rows[0].dataset.facetValue, 'translation');
  assert.equal(rows[1].dataset.facetKey, undefined);
});

test('an exact word beats a prefix, which beats a substring', async () => {
  const page = await boot();
  // "chat": an exact word of "Chat assistant" and of "Communications", a
  // prefix of "chatbot" — the two word matches lead, bigger total first.
  await page.type('chat');

  assert.deepEqual(
    page.facetRows().map((row) => row.dataset.facetValue),
    ['communications', 'chat-assistant']
  );
});

test('a value that is already applied is never suggested', async () => {
  const page = await boot();
  await page.type('chatbot');

  assert.ok(!page.facetRows().some((row) => row.dataset.facetValue === 'already-on'));
});

test('a value no entry carries is never suggested', async () => {
  const page = await boot();
  await page.type('chatbot');

  assert.ok(!page.facetRows().some((row) => row.dataset.facetValue === 'unused'));
});

test('a one-character query suggests nothing', async () => {
  const page = await boot();
  await page.type('c');

  assert.equal(page.facetRows().length, 0);
});

test('the listbox never fills with filters', async () => {
  const page = await boot();
  await page.type('chat');

  assert.ok(page.facetRows().length <= 3);
});

/* ---------------------------------------------------------------- the row */

test('a filter row names its field and its unfiltered count', async () => {
  const page = await boot();
  await page.type('chatbot');
  const row = page.facetRows()[0];

  assert.match(row.textContent, /Chat assistant/);
  assert.match(row.textContent, /Filter by Types of AI/);
  // 6, the total — not 0, the live count a failed query leaves behind.
  assert.match(row.textContent, /6 matches/);
});

test('a filter row is a listbox option like any other, and keyboard reachable', async () => {
  const page = await boot();
  await page.type('chatbot');
  const row = page.facetRows()[0];

  assert.equal(row.getAttribute('role'), 'option');
  assert.equal(row.getAttribute('aria-selected'), 'false');
  assert.equal(row.id, 'search-option-0');

  page.input.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(page.input.getAttribute('aria-activedescendant'), 'search-option-0');
});

/* ------------------------------------------------------------- selecting */

test('picking a filter applies it, clears the query and closes the listbox', async () => {
  const page = await boot();
  await page.type('chatbot');
  page.facetRows()[0].dispatchEvent(new page.window.Event('click', { bubbles: true }));

  assert.deepEqual(page.applied, [['ai-types', 'chat-assistant']]);
  assert.equal(page.input.value, '');
  assert.equal(page.document.querySelector('[data-search-results]').hidden, true);
});

test('picking a filter moves focus to the results heading', async () => {
  const page = await boot();
  await page.type('chatbot');
  page.facetRows()[0].dispatchEvent(new page.window.Event('click', { bubbles: true }));

  assert.equal(page.document.activeElement.id, 'results-heading');
});

test('picking a filter drops the text matches, so the tag is not ANDed with a failed query', async () => {
  const page = await boot();
  await page.type('translation');
  page.facetRows()[0].dispatchEvent(new page.window.Event('click', { bubbles: true }));
  await settle(page.window);

  assert.equal(page.window.__searchMatches, null);
});

test('Escape while the index is still loading keeps the listbox closed when it arrives', async () => {
  // While the index is down, a query still opens the listbox with the filter
  // rows: they need no index. Once it comes back, the next query's fetch is
  // held open, so its debounce has already fired and its answer is in flight
  // when Escape lands.
  let down = true;
  let release = null;
  const page = await boot({
    fetch: () => {
      if (down) return Promise.resolve({ ok: false, status: 503 });
      return new Promise((resolve) => {
        release = () => resolve({ ok: true, json: () => Promise.resolve(INDEX) });
      });
    },
  });
  const listbox = page.document.querySelector('[data-search-results]');
  await page.type('translation');
  assert.equal(listbox.hidden, false, 'the filter rows opened after the failed load');

  down = false;
  await page.type('chatbot');
  assert.equal(typeof release, 'function', 'the retried fetch is in flight');
  page.key('Escape');
  assert.equal(listbox.hidden, true);

  release();
  await settle(page.window);

  assert.equal(listbox.hidden, true, 'the late answer reopened the dismissed listbox');
  assert.equal(page.input.getAttribute('aria-expanded'), 'false');
  assert.equal(page.input.value, 'chatbot', 'the first Escape closes, it does not clear');
  assert.ok(page.window.__searchMatches instanceof page.window.Set, 'the grid still gets the answer');
});

/* ------------------------------------------------- zero-result recovery */

test('the empty panel offers the tags a query nearly matched', async () => {
  const page = await boot();
  await page.type('chatbot');

  assert.equal(page.suggestions.hidden, false);
  assert.deepEqual(
    page.chips().map((chip) => chip.textContent),
    ['Chat assistant6']
  );
  assert.match(page.suggestions.textContent, /Did you mean/);
});

test('a chip applies the filter the same way a row does', async () => {
  const page = await boot();
  await page.type('chatbot');
  page.chips()[0].dispatchEvent(new page.window.Event('click', { bubbles: true }));

  assert.deepEqual(page.applied, [['ai-types', 'chat-assistant']]);
  assert.equal(page.input.value, '');
});

test('clearing the query clears the suggestions', async () => {
  const page = await boot();
  await page.type('chatbot');
  await page.type('');

  assert.equal(page.suggestions.hidden, true);
  assert.equal(page.chips().length, 0);
});

test('a query that matches no vocabulary leaves the panel alone', async () => {
  const page = await boot();
  await page.type('zzzzz');

  assert.equal(page.suggestions.hidden, true);
});

/* ------------------------------------------------------------- synonyms */

test('a synonym from _data/search.yml widens the query', async () => {
  const page = await boot();
  // "multilingual" appears nowhere in the fixture's text; search.yml pairs it
  // with "translation", which is the title of one entry.
  await page.type('multilingual');

  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);
});

test('a synonym never outranks a literal hit', async () => {
  const page = await boot();
  await page.type('permit multilingual');

  assert.equal(page.window.__searchOrder[0], 'permit-tracker');
});

/* ------------------------------------------------------------ robustness */

test('with filters.js absent the search box still works, minus the suggestions', async () => {
  const page = await boot({ withFilters: false });
  await page.type('translation');

  assert.equal(page.facetRows().length, 0);
  assert.ok(page.rows().length > 0, 'expected the document hits to survive');
  assert.equal(page.suggestions.hidden, true);
});

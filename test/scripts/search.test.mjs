/**
 * Catalog search behaviour, driven through a real DOM.
 *
 * The fixture pairs a trimmed /catalog/ results header with a card grid (see
 * test/fixtures/search-page.html) and a search index in the exact shape
 * _plugins/search_index.rb emits, so these tests exercise the shipped markup,
 * the shipped lunr build and the shipped index contract together.
 *
 * jsdom cannot perform navigation, so "clicking a row goes somewhere" is
 * asserted as: the row carries the deep link, and the click attempts a
 * navigation (jsdom reports that as a jsdomError).
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
 * A booted catalog page with search wired up.
 * @param {{index?: object, fetch?: Function, noLunr?: boolean, cores?: number,
 *   entries?: number, workerUrl?: string}} [options]
 *   index overrides the payload /search.json resolves with; fetch replaces the
 *   whole stub (to fail, hang, or count calls); noLunr boots without the
 *   library, the way a blocked CDN-free build would if the bundle 404'd.
 *   cores pins navigator.hardwareConcurrency, and entries/workerUrl stamp the
 *   input's data-search-entries / data-search-worker the way
 *   _includes/results-header.html would, for the gate and worker paths.
 * @returns {Promise<object>}
 */
async function boot(options = {}) {
  const navigations = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => {
    if (/navigation/i.test(error.message)) navigations.push(error.message);
  });
  const dom = new JSDOM('<!doctype html><body>' + HTML + '</body>', {
    url: 'https://example.org/catalog/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    virtualConsole,
  });
  const { window } = dom;
  const requests = [];
  window.fetch =
    options.fetch ||
    ((url, init) => {
      requests.push({ url, init });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(options.index || INDEX) });
    });

  await new Promise((resolve) => {
    if (window.document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve);
  });

  if (options.cores !== undefined) {
    Object.defineProperty(window.navigator, 'hardwareConcurrency', {
      configurable: true,
      value: options.cores,
    });
  }
  const inputEl = window.document.querySelector('[data-filter="search"]');
  if (options.entries !== undefined) inputEl.setAttribute('data-search-entries', String(options.entries));
  if (options.workerUrl) inputEl.setAttribute('data-search-worker', options.workerUrl);

  if (!options.noLunr) window.eval(LUNR);
  window.eval(SEARCH);

  const document = window.document;
  const input = document.querySelector('[data-filter="search"]');
  return {
    window,
    document,
    input,
    requests,
    navigations,
    listbox: document.querySelector('[data-search-results]'),
    live: document.querySelector('[data-search-live]'),
    status: document.querySelector('[data-search-status]'),
    floor: document.querySelector('[data-search-floor]'),
    more: document.querySelector('[data-search-more]'),
    gate: document.querySelector('[data-search-gate]'),
    gateLoad: document.querySelector('[data-search-load]'),
    gateProgress: document.querySelector('[data-search-progress]'),
    rows: () => Array.from(document.querySelectorAll('[data-search-results] [role="option"]')),
    slots: () =>
      Array.from(document.querySelectorAll('[data-entry-id]'))
        .filter((card) => !card.querySelector('[data-match-slot]').hidden)
        .map((card) => [card.dataset.entryId, card.querySelector('[data-match-slot]').textContent]),
    /**
     * Type a query and wait for the debounce plus the index promise chain.
     * @param {string} value
     */
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

test('an empty box publishes no match set and keeps the listbox closed', async () => {
  const page = await boot();
  await page.type('');

  assert.equal(page.window.__searchMatches, null);
  assert.equal(page.listbox.hidden, true);
  assert.equal(page.input.getAttribute('aria-expanded'), 'false');
});

test('a query fetches the index once and reuses it', async () => {
  const page = await boot();
  await page.type('notice');
  await page.type('permit');

  assert.equal(page.requests.filter((r) => r.url === '/search.json').length, 1);
});

test('the index is fetched at low priority with a timeout', async () => {
  const page = await boot();
  await page.type('notice');
  const init = page.requests[0].init;

  assert.equal(init.priority, 'low');
  assert.ok(init.signal, 'expected an abort signal');
});

test('a title match narrows the grid to the entries that clear the floor', async () => {
  const page = await boot();
  await page.type('notice');

  // Every entry mentions "notice" somewhere, but only one is about notices.
  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);
  assert.equal(page.window.__searchOrder[0], 'notice-translation');
});

test('the weaker matches are offered behind a button that names the query', async () => {
  const page = await boot();
  await page.type('notice');

  assert.equal(page.floor.hidden, false);
  assert.equal(page.more.textContent, 'Show 3 more that mention “notice”');

  page.more.dispatchEvent(new page.window.Event('click', { bubbles: true }));
  await settle(page.window);

  assert.equal(page.window.__searchMatches.size, 4);
  assert.equal(page.floor.hidden, true);
});

test('lifting the floor does not re-query or reopen the listbox', async () => {
  const page = await boot();
  await page.type('notice');
  const before = page.requests.length;
  page.listbox.hidden = true;

  page.more.dispatchEvent(new page.window.Event('click', { bubbles: true }));
  await settle(page.window);

  assert.equal(page.requests.length, before);
  assert.equal(page.listbox.hidden, true);
  assert.equal(page.window.location.search, '');
});

test('editing the query puts the floor back', async () => {
  const page = await boot();
  await page.type('notice');
  page.more.dispatchEvent(new page.window.Event('click', { bubbles: true }));
  await settle(page.window);
  await page.type('notices');

  assert.equal(page.floor.hidden, false);
});

test('a body hit names its section and deep-links to the anchor', async () => {
  const page = await boot();
  await page.type('reviewer');
  const row = page.rows().find((li) => li.dataset.url.includes('notice-translation'));

  assert.ok(row, 'expected a row for the entry whose body matched');
  assert.match(row.textContent, /How to reuse|What it does/);
  assert.match(row.dataset.url, /^\/catalog\/notice-translation\/#(how-to-reuse|what-it-does)$/);
});

test('the snippet marks the matched term without using innerHTML', async () => {
  const page = await boot();
  await page.type('bilingual');
  const mark = page.listbox.querySelector('mark');

  assert.ok(mark, 'expected the matched term to be marked');
  assert.equal(mark.textContent.toLowerCase(), 'bilingual');
  assert.equal(mark.children.length, 0);
});

test('cards get the section and snippet that put them in the grid', async () => {
  const page = await boot();
  await page.type('bilingual');

  assert.deepEqual(
    page.slots().map(([id]) => id),
    ['notice-translation']
  );
  assert.match(page.slots()[0][1], /What it does/);
});

test('card annotations are cleared when the query is cleared', async () => {
  const page = await boot();
  await page.type('bilingual');
  await page.type('');

  assert.deepEqual(page.slots(), []);
});

test('arrow keys move aria-activedescendant through the options', async () => {
  const page = await boot();
  await page.type('notice');
  assert.ok(page.rows().length > 1);
  assert.equal(page.input.hasAttribute('aria-activedescendant'), false);

  page.key('ArrowDown');
  assert.equal(page.input.getAttribute('aria-activedescendant'), page.rows()[0].id);
  assert.equal(page.rows()[0].getAttribute('aria-selected'), 'true');

  page.key('ArrowUp');
  assert.equal(page.input.getAttribute('aria-activedescendant'), page.rows().at(-1).id);
});

test('the listbox announces how many suggestions are open, and clears on close', async () => {
  const page = await boot();
  await page.type('notice');

  assert.match(page.live.textContent, /^\d+ suggestions\. Use the up and down arrow keys/);

  page.key('Escape');
  assert.equal(page.live.textContent, '');
  assert.equal(page.listbox.hidden, true);
});

test('Escape during the debounce keeps the listbox closed but still answers the query', async () => {
  const page = await boot();
  await page.type('notice');
  assert.equal(page.input.getAttribute('aria-expanded'), 'true');

  // A keystroke lands and Escape follows inside the 50ms debounce: the pending
  // run must not reopen the popup the reader just dismissed, yet the grid has
  // to reflect what is now in the box.
  page.input.value = 'grant';
  page.input.dispatchEvent(new page.window.Event('input', { bubbles: true }));
  page.key('Escape');
  await settle(page.window);

  assert.equal(page.listbox.hidden, true);
  assert.equal(page.input.getAttribute('aria-expanded'), 'false');
  assert.equal(page.input.value, 'grant', 'the first Escape closes, it does not clear');
  assert.deepEqual([...page.window.__searchMatches], ['grant-finder']);
});

test('a suggestion navigates on click, not only on mousedown', async () => {
  const page = await boot();
  await page.type('notice');
  const row = page.rows()[0];

  row.dispatchEvent(new page.window.MouseEvent('mousedown', { bubbles: true }));
  assert.deepEqual(page.navigations, [], 'mousedown must not navigate — it only holds focus');

  row.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true }));
  assert.equal(page.navigations.length, 1);
});

test('Enter follows the highlighted option', async () => {
  const page = await boot();
  await page.type('notice');
  page.key('ArrowDown');
  page.key('Enter');

  assert.equal(page.navigations.length, 1);
});

test('a failed load is retried rather than memoized', async () => {
  let calls = 0;
  const page = await boot({
    fetch: () => {
      calls += 1;
      if (calls === 1) return Promise.resolve({ ok: false, status: 503 });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(INDEX) });
    },
  });
  await page.type('notice');

  assert.equal(calls, 2, 'expected the failed attempt to be retried, not cached');
  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);
  assert.equal(page.status.textContent, '', 'the warning should clear once the index arrives');
});

test('an index that never loads reports itself instead of failing silently', async () => {
  const page = await boot({ fetch: () => Promise.resolve({ ok: false, status: 503 }) });
  await page.type('notice');

  assert.equal(page.status.classList.contains('hidden'), false);
  assert.match(page.status.textContent, /unavailable/i);
  assert.equal(page.window.__searchMatches, null);
  assert.equal(page.listbox.hidden, true);
});

test('a stale answer cannot overwrite a newer query', async () => {
  const page = await boot();
  await page.type('notice');
  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);

  // Type again without settling, then let both runs finish: the second query
  // is the one that must win, whichever promise resolves last.
  page.input.value = 'permit';
  page.input.dispatchEvent(new page.window.Event('input', { bubbles: true }));
  page.input.value = 'grant';
  page.input.dispatchEvent(new page.window.Event('input', { bubbles: true }));
  await settle(page.window);

  assert.deepEqual([...page.window.__searchMatches], ['grant-finder']);
});

test('non-entry docs appear as suggestions but never filter the grid', async () => {
  const page = await boot();
  await page.type('kickoff');

  assert.ok(page.rows().some((li) => li.dataset.url.includes('/cohorts/')));
  assert.deepEqual([...page.window.__searchMatches], []);
});

test('a query with no hits closes the listbox and empties the grid', async () => {
  const page = await boot();
  await page.type('zzzzqqqq');

  assert.equal(page.listbox.hidden, true);
  assert.deepEqual([...page.window.__searchMatches], []);
});

test('prefix and fuzzy matching remain available when an exact query has no hits', async () => {
  const page = await boot();
  await page.type('notic');
  assert.ok(page.window.__searchMatches.has('notice-translation'));

  await page.type('reviewr');
  assert.ok(page.window.__searchMatches.has('notice-translation'));
});

test("one exact word does not suppress another word's prefix or fuzzy recall", async () => {
  const page = await boot();
  await page.type('review notic');
  assert.ok(page.rows().some((row) => row.dataset.url.includes('/permit-tracker/')));

  await page.type('review grnt');
  assert.ok(page.rows().some((row) => row.dataset.url.includes('/grant-finder/')));
});

test('a common literal query keeps title relevance without expensive fuzzy expansion', async () => {
  const index = {
    synonyms: {},
    docs: Array.from({ length: 30 }, (_, at) => ({
      i: at,
      id: `common-${at}`,
      kind: 'entry',
      title: at === 0 ? 'Common service' : `Service ${at}`,
      summary: '',
      facets: '',
      sections: [{ h: 'Evidence', a: 'evidence', t: 'A common operational pattern.' }],
      url: `/catalog/common-${at}/`,
    })),
  };
  const page = await boot({ index });
  await page.type('common');

  assert.equal(page.window.__searchMatches.size, 1);
  assert.equal(page.window.__searchOrder[0], 'common-0');
  assert.match(page.more.textContent, /Show 29 more/);
});

/**
 * An index whose concept map pairs "chatbot" with "assistant" — the pairing
 * _plugins/search_index.rb derives from prose, not one anybody wrote down.
 * @param {{concepts?: object, literal?: boolean}} [options]
 *   concepts overrides the payload's concept block; literal:false removes the
 *   entry that carries the typed word, leaving concept hits as the only answer.
 * @returns {object}
 */
function conceptIndex({ concepts, literal = true } = {}) {
  const entry = (id, title, text) => ({
    id,
    kind: 'entry',
    title,
    summary: '',
    facets: '',
    sections: [{ h: 'What it does', a: 'what-it-does', t: text }],
    url: `/catalog/${id}/`,
  });
  return {
    synonyms: {},
    concepts: concepts ?? { weight: 0.9, max_expansions: 4, terms: { chatbot: ['assistant'] } },
    docs: [
      // Says "assistant" everywhere and never says the typed word.
      entry(
        'chat-desk',
        'Assistant desk',
        'The assistant drafts an assistant reply for every assistant queue.'
      ),
      ...(literal
        ? [
            entry(
              'chatbot-pilot',
              'Service pilot',
              'A note near the end of the write-up mentions the chatbot.'
            ),
          ]
        : []),
      entry('permit-queue', 'Permit queue', 'Nothing here is about conversation at all.'),
    ],
  };
}

test('the concept map reaches an entry that never uses the typed word', async () => {
  const page = await boot({ index: conceptIndex() });
  await page.type('chatbot');

  assert.ok(page.window.__searchMatches.has('chat-desk'), 'expected the concept-only entry');
  assert.ok(page.window.__searchMatches.has('chatbot-pilot'), 'expected the literal entry');
});

test('a concept match never outranks the entry that used the reader’s own word', async () => {
  // chat-desk would win on score alone: it says "assistant" four times across
  // title and body, against one passing mention of "chatbot".
  const page = await boot({ index: conceptIndex() });
  await page.type('chatbot');

  assert.equal(page.window.__searchOrder[0], 'chatbot-pilot');
  assert.equal(page.window.__searchOrder.at(-1), 'chat-desk');
});

test('with nothing literal to rank against, concept hits are the answer', async () => {
  const page = await boot({ index: conceptIndex({ literal: false }) });
  await page.type('chatbot');

  assert.deepEqual([...page.window.__searchMatches], ['chat-desk']);
});

test('the concept layer can be switched off', async () => {
  const off = await boot({
    index: conceptIndex({ concepts: { weight: 0.9, max_expansions: 4, terms: {} } }),
  });
  await off.type('chatbot');
  assert.deepEqual([...off.window.__searchMatches], ['chatbot-pilot']);

  const capped = await boot({
    index: conceptIndex({ concepts: { weight: 0.9, max_expansions: 0, terms: { chatbot: ['assistant'] } } }),
  });
  await capped.type('chatbot');
  assert.deepEqual([...capped.window.__searchMatches], ['chatbot-pilot']);
});

test('a payload with no concept block at all behaves as it did before there was one', async () => {
  const index = conceptIndex();
  delete index.concepts;
  const page = await boot({ index });
  await page.type('chatbot');

  assert.deepEqual([...page.window.__searchMatches], ['chatbot-pilot']);
});

test('a concept weight above 1 cannot lift a concept hit past a literal one', async () => {
  const page = await boot({
    index: conceptIndex({ concepts: { weight: 99, max_expansions: 4, terms: { chatbot: ['assistant'] } } }),
  });
  await page.type('chatbot');

  assert.equal(page.window.__searchOrder[0], 'chatbot-pilot');
});

test('a concept-matched event never renders above the entries the reader’s words found', async () => {
  // Non-entry hits lead the listbox, which is right for a literal event hit and
  // wrong for a concept-derived one: it would put a row the reader never asked
  // for above the entry that used their own word.
  const page = await boot({
    index: {
      synonyms: {},
      concepts: { weight: 0.9, max_expansions: 4, terms: { chatbot: ['assistant'] } },
      docs: [
        {
          id: 'event:2026:clinic',
          kind: 'event',
          title: 'Assistant clinic',
          summary: 'An assistant workshop for the assistant cohort.',
          facets: '',
          sections: [{ h: null, a: null, t: 'Every assistant question, answered by an assistant.' }],
          url: '/events/2026/clinic/',
        },
        {
          id: 'chatbot-pilot',
          kind: 'entry',
          title: 'Service pilot',
          summary: '',
          facets: '',
          sections: [
            { h: 'What it does', a: 'what-it-does', t: 'A note near the end mentions the chatbot.' },
          ],
          url: '/catalog/chatbot-pilot/',
        },
      ],
    },
  });
  await page.type('chatbot');
  const urls = page
    .rows()
    .map((li) => li.dataset.url)
    .filter(Boolean);

  assert.deepEqual(urls, ['/catalog/chatbot-pilot/#what-it-does', '/events/2026/clinic/']);
});

test('a snippet marks the word lunr matched, not a longer word that starts with it', async () => {
  // "data" is a prefix of "database", which the stemmer keeps as a different
  // term. Marking the earlier "database" would deep-link the reader to the
  // wrong section, under a word the index never matched.
  const page = await boot({
    index: {
      synonyms: {},
      docs: [
        {
          id: 'records-cleanup',
          kind: 'entry',
          title: 'Records cleanup',
          summary: 'A summary that stays clear of the query.',
          facets: '',
          sections: [
            { h: 'Background', a: 'background', t: 'The database migration ran overnight without incident.' },
            {
              h: 'What it does',
              a: 'what-it-does',
              t: 'It improves data quality for every resident record.',
            },
          ],
          url: '/catalog/records-cleanup/',
        },
      ],
    },
  });
  await page.type('data');
  const row = page.rows().find((li) => li.dataset.url && li.dataset.url.includes('records-cleanup'));

  assert.ok(row, 'expected a row for the entry whose body matched');
  assert.equal(row.dataset.url, '/catalog/records-cleanup/#what-it-does');
  assert.equal(page.listbox.querySelector('mark').textContent, 'data');
});

test('the withheld offer says “related to” once a concept hit is behind it', async () => {
  const index = {
    synonyms: {},
    concepts: { weight: 0.9, max_expansions: 4, terms: { chatbot: ['assistant'] } },
    docs: [
      {
        id: 'chatbot-desk',
        kind: 'entry',
        title: 'Chatbot desk',
        summary: 'The chatbot desk answers a chatbot question with a chatbot.',
        facets: 'Chatbot',
        sections: [{ h: 'What it does', a: 'what-it-does', t: 'A chatbot, front to back.' }],
        url: '/catalog/chatbot-desk/',
      },
      {
        id: 'permit-tracker',
        kind: 'entry',
        title: 'Permit tracker',
        summary: 'Tracks permits from application to issue.',
        facets: '',
        sections: [
          {
            h: 'How to reuse',
            a: 'how-to-reuse',
            t:
              'The tracker is a long write-up about permits, inspections, queues, notices, ' +
              'letters, reviewers, records and residents, which in one aside mentions the chatbot ' +
              'before returning to permits, inspections, queues, notices and reviewers again.',
          },
        ],
        url: '/catalog/permit-tracker/',
      },
      {
        id: 'assistant-desk',
        kind: 'entry',
        title: 'Assistant desk',
        summary: '',
        facets: '',
        sections: [{ h: 'What it does', a: 'what-it-does', t: 'The assistant drafts an assistant reply.' }],
        url: '/catalog/assistant-desk/',
      },
    ],
  };

  const page = await boot({ index });
  await page.type('chatbot');
  assert.equal(page.floor.hidden, false);
  assert.match(page.more.textContent, /more related to “chatbot”/);

  // The same withheld entry, with the layer off, does still mention it.
  const off = await boot({ index: { ...index, concepts: { weight: 0.9, max_expansions: 0, terms: {} } } });
  await off.type('chatbot');
  assert.equal(off.floor.hidden, false);
  assert.match(off.more.textContent, /more that mentions? “chatbot”/);
});

test('without lunr the box reports itself unavailable instead of throwing', async () => {
  const page = await boot({ noLunr: true });

  assert.equal(page.status.classList.contains('hidden'), false);
  assert.match(page.status.textContent, /unavailable/i);
});

/* --------------------------------------------------------- the load gate */

test('the gate never appears for a small catalog or a capable device', async () => {
  const small = await boot({ cores: 2, entries: 4 });
  assert.equal(small.gate.hidden, true);

  const capable = await boot({ cores: 8, entries: 1000 });
  assert.equal(capable.gate.hidden, true);
  await capable.type('notice');
  assert.deepEqual([...capable.window.__searchMatches], ['notice-translation']);
});

test('a weak device facing a large catalog waits behind the gate', async () => {
  const page = await boot({ cores: 2, entries: 1000 });
  assert.equal(page.gate.hidden, false);

  await page.type('notice');
  // Nothing was fetched, nothing was filtered, and the status line says why.
  assert.equal(page.requests.length, 0);
  assert.equal(page.window.__searchMatches, null);
  assert.match(page.status.textContent, /Load full search/);
  // Clearing the box clears the pointer with it.
  await page.type('');
  assert.equal(page.status.textContent, '');
});

test('the gate button loads the index and answers the waiting query', async () => {
  const page = await boot({ cores: 2, entries: 1000 });
  await page.type('notice');
  page.gateLoad.click();
  await settle(page.window);

  assert.equal(page.requests.filter((r) => r.url === '/search.json').length, 1);
  assert.equal(page.gate.hidden, true);
  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);
  // From here the box behaves like any other device's.
  await page.type('permit');
  assert.deepEqual([...page.window.__searchMatches], ['permit-tracker']);
  assert.equal(page.requests.filter((r) => r.url === '/search.json').length, 1);
});

/* ------------------------------------------------------- the worker path */

/**
 * The serialized index assets/js/search-worker.js would post, built inside
 * the page's own lunr so revive-versus-build equivalence is exercised on the
 * exact bytes the worker contract carries.
 * @param {object} window a booted page's window (lunr already evaluated).
 * @param {object} index the payload to build from.
 * @returns {object} `lunr.Index.prototype.toJSON()` output.
 */
function serializedIndex(window, index) {
  window.__payload = index;
  return window.eval(
    `lunr(function () {
      this.ref('i');
      this.field('title', { boost: 10 });
      this.field('summary', { boost: 4 });
      this.field('facets', { boost: 3 });
      this.field('body');
      window.__payload.docs.forEach((d, i) =>
        this.add({
          i: String(i), title: d.title, summary: d.summary, facets: d.facets,
          body: (d.sections || []).map((s) => s.t || '').filter(Boolean).join(' '),
        })
      );
    }).toJSON()`
  );
}

test('a worker-built index is adopted without any main-thread fetch or build', async () => {
  const page = await boot({ workerUrl: '/assets/js/search-worker.js' });
  const serialized = serializedIndex(page.window, INDEX);
  const seen = { messages: [], urls: [] };
  page.window.Worker = class {
    constructor(url) {
      seen.urls.push(url);
    }
    postMessage(msg) {
      seen.messages.push(msg);
      setTimeout(() => {
        this.onmessage({ data: { type: 'progress', phase: 'build' } });
        this.onmessage({ data: { type: 'ready', payload: INDEX, serialized, cached: true } });
      }, 0);
    }
    terminate() {
      seen.terminated = true;
    }
  };

  await page.type('notice');

  assert.deepEqual(seen.urls, ['/assets/js/search-worker.js']);
  // Parsed through JSON: the message object was born in the jsdom realm, and
  // strict deep equality would reject its foreign Object.prototype.
  assert.deepEqual(JSON.parse(JSON.stringify(seen.messages)), [{ url: '/search.json', version: '' }]);
  assert.equal(seen.terminated, true);
  assert.equal(page.requests.length, 0);
  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);
  const row = page.rows().find((li) => li.dataset.url.includes('notice-translation'));
  assert.ok(row, 'the listbox offers the worker-indexed entry');
});

test('a broken worker falls back to the inline build without a visible seam', async () => {
  // A worker whose very construction throws (a CSP that bans worker-src)…
  const page = await boot({ workerUrl: '/assets/js/search-worker.js' });
  page.window.Worker = class {
    constructor() {
      throw new Error('workers disabled');
    }
  };
  await page.type('notice');
  assert.equal(page.requests.filter((r) => r.url === '/search.json').length, 1);
  assert.deepEqual([...page.window.__searchMatches], ['notice-translation']);

  // …and one that starts, then reports it could not build.
  const errored = await boot({ workerUrl: '/assets/js/search-worker.js' });
  errored.window.Worker = class {
    postMessage() {
      setTimeout(() => this.onmessage({ data: { type: 'error', error: 'no index for you' } }), 0);
    }
    terminate() {}
  };
  await errored.type('notice');
  assert.equal(errored.requests.filter((r) => r.url === '/search.json').length, 1);
  assert.deepEqual([...errored.window.__searchMatches], ['notice-translation']);
});

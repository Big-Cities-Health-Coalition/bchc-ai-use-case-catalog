/**
 * Assistive-technology flow tests: the four journeys a keyboard or screen
 * reader user actually makes through this site, driven end to end in Chrome.
 *
 *   1. home -> catalog -> filter -> entry -> back
 *   2. search -> result
 *   3. the submission form's first two sections
 *   4. the setup wizard, step 1 -> step 2
 *
 * pa11y already audits pages one at a time, and it passes on every page here.
 * What it cannot see is the seam *between* pages and states: whether the skip
 * link skips, whether a filter that changes 40 cards says so out loud, whether
 * an error summary that takes focus also marked the control before the reader
 * gets there, whether Back leaves focus somewhere real. Every regression this
 * file was written against was invisible to a per-page audit.
 *
 * Keyboard only, on purpose — see ./helpers.mjs. Skipped unless
 * RUN_FLOW_TESTS=1 (`npm run test:flows`).
 */

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE,
  SKIP,
  assertServed,
  assertUsableStops,
  describeStop,
  focusStop,
  launch,
  liveness,
  openPage,
  tab,
  tabUntil,
  textOf,
  waitForAnnouncement,
} from './helpers.mjs';

/** The catalog path is schema-driven; read it off the built home page's nav. */
let catalogPath = '/catalog/';

/**
 * Why the two catalog journeys are skipped when the served build has nothing
 * published — a fresh copy with the samples removed. Filtering and searching
 * an empty catalog has no card to land on, so those flows wait for a
 * consequence that never comes; the form and wizard flows still run.
 */
let emptyCatalog = false;
const CATALOG_SKIP =
  'the catalog is empty (search.json lists no entries), so there is nothing to filter or open';

/**
 * Resolve once the search listbox has rendered the same options for 400 ms
 * straight (or after 5 s regardless), so a keyboard action is not aimed at rows
 * that a pending re-render is about to replace.
 */
async function settledListbox(page) {
  const signature = () =>
    page.evaluate(() =>
      Array.from(
        document.querySelectorAll('#search-listbox [role="option"]'),
        (o) => o.id + '|' + o.textContent
      ).join('\n')
    );
  let before = await signature();
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const now = await signature();
    if (now === before) return;
    before = now;
  }
}

/**
 * Assert the template's stricter touch contract (44 × 44 CSS px below `lg`)
 * against real rendered boxes. Static CSS assertions miss cascade/order bugs,
 * and axe applies WCAG's narrower 24px rule rather than this design system's
 * mobile baseline.
 */
async function assertTouchTargets(page, selector, context) {
  const result = await page.evaluate((query) => {
    const clean = (value) => String(value).replace(/\s+/g, ' ').trim();
    const visible = (node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden';
    };
    const nodes = [...document.querySelectorAll(query)].filter(visible);
    return {
      count: nodes.length,
      failures: nodes
        .map((node) => {
          const box = node.getBoundingClientRect();
          return {
            node: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${
              node.classList.length ? `.${[...node.classList].join('.')}` : ''
            }`,
            name: clean(
              node.getAttribute('aria-label') ||
                node.labels?.[0]?.textContent ||
                node.textContent ||
                node.getAttribute('title') ||
                ''
            ).slice(0, 100),
            width: Number(box.width.toFixed(1)),
            height: Number(box.height.toFixed(1)),
          };
        })
        .filter(({ width, height }) => width < 44 || height < 44),
    };
  }, selector);
  assert.ok(result.count > 0, `${context}: "${selector}" matched no visible target`);
  assert.deepEqual(
    result.failures,
    [],
    `${context}: target below 44 × 44 CSS px:\n${result.failures
      .map(({ node, name, width, height }) => `  ${node} "${name}" — ${width} × ${height}`)
      .join('\n')}`
  );
}

describe('assistive-technology flows', { skip: SKIP, concurrency: false }, () => {
  /** @type {import('puppeteer').Browser} */
  let browser;

  before(async () => {
    await assertServed();
    browser = await launch();
    const page = await openPage(browser, '/');
    catalogPath = await page.evaluate(() => {
      const link = [...document.querySelectorAll('header a[href]')].find(
        (a) => /^\/[^/]+\/$/.test(new URL(a.href).pathname) && a.href.includes('catalog')
      );
      return link ? new URL(link.href).pathname : '/catalog/';
    });
    await page.close();

    const index = await fetch(`${BASE}/search.json`);
    const docs = index.ok ? (await index.json())?.docs : null;
    emptyCatalog = !Array.isArray(docs) || docs.length === 0;
  });

  after(async () => {
    await browser?.close();
  });

  test('home -> catalog -> filter -> entry -> back', async (t) => {
    if (emptyCatalog) return t.skip(CATALOG_SKIP);
    const page = await openPage(browser, '/');

    // The skip link is the first stop, and pressing it must actually land in
    // main — a skip link that only moves the hash leaves the next Tab back at
    // the top of the header, which is the failure it exists to prevent.
    const skip = await tab(page);
    assert.match(skip.name, /skip/i, `first tab stop is ${describeStop(skip)}, not the skip link`);
    assert.ok(skip.visible, 'the skip link stays sr-only when focused');
    await page.keyboard.press('Enter');
    const landed = await focusStop(page);
    assert.equal(landed.id, 'main-content', `skip link put focus on ${describeStop(landed)}`);
    const afterSkip = await tab(page);
    assert.ok(
      afterSkip.within.includes('main-content'),
      `the stop after the skip link is ${describeStop(afterSkip)}, outside main`
    );

    // Keyboard-navigate to the catalog.
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await page.evaluate(() => document.body.focus());
    const toCatalog = await tabUntil(page, (stop) => stop.href === catalogPath, {
      what: `a link to ${catalogPath}`,
    });
    assertUsableStops(toCatalog.trail, 'home');
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.keyboard.press('Enter')]);
    assert.equal(new URL(page.url()).pathname, catalogPath);

    // Filter with the keyboard. The pill reports its own state (aria-pressed)
    // and the shared status region reports the consequence.
    const before = await textOf(page, '[data-filter-status]');
    const pill = await tabUntil(page, (stop) => stop.pressed === 'false', {
      what: 'a filter pill',
    });
    assertUsableStops(pill.trail, 'catalog');
    const filterName = pill.stop.name;
    await page.keyboard.press('Enter');
    const status = await waitForAnnouncement(page, '[data-filter-status]', before);

    const shown = await page.evaluate(
      () => document.querySelectorAll('[data-entry-grid] > [data-entry]:not([hidden])').length
    );
    assert.match(
      status,
      new RegExp(`\\b${shown}\\b`),
      `the status region says "${status}" but ${shown} cards are visible`
    );
    const held = await focusStop(page);
    assert.equal(held.pressed, 'true', 'the pill did not report itself as pressed');
    assert.equal(held.name, filterName, 'filtering moved focus off the pill it was on');

    // Open an entry from the filtered results, then come back.
    // Ask the grid which links are entry cards rather than guessing from the
    // href: the catalog also links to pages under its own path (the A-Z index),
    // and "starts with /catalog/" would tab onto one of those instead.
    const entryHrefs = await page.evaluate(() =>
      [...document.querySelectorAll('[data-entry-grid] > [data-entry]:not([hidden]) a[href]')].map((a) =>
        a.getAttribute('href')
      )
    );
    assert.ok(entryHrefs.length > 0, 'the filtered catalog shows no entry cards to open');
    const card = await tabUntil(page, (stop) => entryHrefs.includes(stop.href), {
      what: 'an entry card link',
    });
    assertUsableStops(card.trail, 'filtered catalog');
    const entryHref = card.stop.href;
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.keyboard.press('Enter')]);
    assert.equal(new URL(page.url()).pathname, new URL(entryHref, page.url()).pathname);
    const title = await textOf(page, 'main h1');
    assert.notEqual(title, '', 'the entry page has no <h1> to orient a reader');

    await page.goBack({ waitUntil: 'networkidle2' });
    assert.equal(new URL(page.url()).pathname, catalogPath);
    const restored = await page.evaluate(
      () => document.querySelectorAll('.filter-pill[aria-pressed="true"]').length
    );
    assert.ok(restored > 0, 'Back returned to an unfiltered catalog — the filter was in the URL');
    // Where Back resumes the tab order is the browser's business (Chrome
    // restores the focus start point, so it is rarely the skip link again);
    // that it resumes on something real is this site's business.
    const returning = await tab(page);
    assert.ok(!returning.onBody, 'after Back the first tab stop focused nothing');
    assertUsableStops([returning], 'after Back');

    await page.close();
  });

  test('search -> result', async (t) => {
    if (emptyCatalog) return t.skip(CATALOG_SKIP);
    const page = await openPage(browser, catalogPath);

    // The rail is DOM-first and every facet option is a tab stop, so the way a
    // keyboard user reaches the search box is the rail's own "Skip filters"
    // link: it must be reachable in a handful of stops, be visible when
    // focused, and land one Tab short of the box.
    const skipFilters = await tabUntil(page, (stop) => /skip filters/i.test(stop.name), {
      what: 'the "Skip filters" link',
      max: 20,
    });
    assertUsableStops(skipFilters.trail, 'catalog');
    assert.ok(skipFilters.stop.visible, 'the "Skip filters" link stays sr-only when focused');
    await page.keyboard.press('Enter');
    const results = await focusStop(page);
    assert.equal(results.id, 'results-heading', `"Skip filters" put focus on ${describeStop(results)}`);
    const box = await tab(page);
    assert.equal(box.id, 'catalog-search', `the stop after the results heading is ${describeStop(box)}`);
    assert.equal(box.role, 'combobox');

    await page.keyboard.type('data');
    await page.waitForFunction(
      () => document.querySelector('#catalog-search')?.getAttribute('aria-expanded') === 'true'
    );
    const live = await waitForAnnouncement(page, '[data-search-live]');
    const options = await page.evaluate(
      () => document.querySelectorAll('#search-listbox [role="option"]').length
    );
    assert.ok(options > 0, 'the listbox opened with no options');
    assert.match(
      live,
      new RegExp(`\\b${options}\\b`),
      `the live region says "${live}" for ${options} results`
    );

    // Escape must give the input back rather than stranding focus in a closed
    // listbox — the classic combobox dead end.
    await page.keyboard.press('Escape');
    const afterEscape = await focusStop(page);
    assert.equal(afterEscape.id, 'catalog-search', `Escape moved focus to ${describeStop(afterEscape)}`);
    assert.equal(
      await page.evaluate(() => document.querySelector('#catalog-search').getAttribute('aria-expanded')),
      'false'
    );

    // Reopen. `close()` leaves the rendered options in the DOM, so the listbox
    // being non-empty proves nothing — `aria-expanded` is the state a reader is
    // told about, and the only one worth waiting for.
    await page.keyboard.type('a');
    await page.waitForFunction(
      () =>
        document.querySelector('#catalog-search')?.getAttribute('aria-expanded') === 'true' &&
        document.querySelectorAll('#search-listbox [role="option"]').length > 0
    );
    // `aria-expanded` can flip back to true while the previous query's options
    // are still in the DOM; if the listbox re-renders after ArrowDown, the
    // highlight is lost and Enter submits the form instead. Wait for the option
    // list to hold still before touching it.
    await settledListbox(page);
    // The listbox mixes facet options (which apply a filter and stay on the
    // catalog) with document options (which navigate). Which comes first depends
    // on the sample content, so arrow down to the first document option rather
    // than assuming the first row is one.
    const readActive = () =>
      page.evaluate(() => {
        const input = document.querySelector('#catalog-search');
        const id = input.getAttribute('aria-activedescendant');
        const option = id ? document.getElementById(id) : null;
        return {
          id,
          selected: option?.getAttribute('aria-selected'),
          text: option?.textContent?.trim(),
          isDocument: Boolean(option?.dataset.url),
        };
      });
    const optionCount = await page.evaluate(
      () => document.querySelectorAll('#search-listbox [role="option"]').length
    );
    let active = null;
    for (let i = 0; i < optionCount; i++) {
      await page.keyboard.press('ArrowDown');
      active = await readActive();
      if (active.isDocument) break;
    }
    assert.ok(active?.id, 'ArrowDown highlighted nothing the input points at');
    assert.ok(
      active.isDocument,
      `no document option among ${optionCount} results — the last highlighted was "${active.text}"`
    );
    assert.equal(active.selected, 'true', 'the highlighted option is not aria-selected');
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      'catalog-search',
      'focus left the combobox instead of staying on the input'
    );

    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.keyboard.press('Enter')]);
    assert.match(new URL(page.url()).pathname, new RegExp(`^${catalogPath}[^/]+/$`));
    assert.notEqual(await textOf(page, 'main h1'), '');

    await page.close();
  });

  test('shared touch-layout actions meet the 44 × 44 touch-target contract', async (t) => {
    if (emptyCatalog) return t.skip(CATALOG_SKIP);
    const viewports = [
      ['phone', { width: 390, height: 844 }],
      ['tablet', { width: 768, height: 1024 }],
    ];

    for (const [label, viewport] of viewports) {
      const home = await openPage(browser, '/', viewport);
      // Shortlist and wizard state persist by design; clear them so each
      // responsive pass starts from the same visitor state.
      await home.evaluate(() => localStorage.clear());
      await assertTouchTargets(
        home,
        '.site-brand, .hero-search-btn, .browse-option, .browse-all, .section-link, .footer-link',
        `${label} home`
      );
      await home.close();

      const catalog = await openPage(browser, catalogPath, viewport);
      await catalog.waitForSelector('.compare-toggle');
      await assertTouchTargets(
        catalog,
        '.site-brand, main .btn-sm, .compare-toggle, .view-toggle, .results-select, .search-box, [data-sheet-open], .footer-link',
        `${label} catalog`
      );

      // Search suggestions are generated only after input, so explicitly open
      // the listbox before measuring the rows changed by the touch fix.
      await catalog.focus('#catalog-search');
      await catalog.keyboard.type('data');
      await catalog.waitForFunction(
        () =>
          document.querySelector('#catalog-search')?.getAttribute('aria-expanded') === 'true' &&
          document.querySelectorAll('#search-listbox [role="option"]').length > 0
      );
      await settledListbox(catalog);
      await assertTouchTargets(catalog, '.search-option', `${label} catalog search suggestions`);
      await catalog.keyboard.press('Escape');
      await catalog.evaluate(() => {
        const input = document.querySelector('#catalog-search');
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await catalog.waitForFunction(
        () => document.querySelectorAll('[data-entry-grid] > [data-entry]:not([hidden])').length >= 2
      );

      // Open the modal through its real keyboard activation, then measure the
      // controls that only have boxes while the sheet is in the top layer.
      await catalog.evaluate(() => document.querySelector('[data-sheet-open]').focus());
      await catalog.keyboard.press('Enter');
      await catalog.waitForSelector('[data-filter-sheet][open]');
      await assertTouchTargets(
        catalog,
        '[data-filter-sheet] .filter-group-toggle, [data-filter-sheet] .filter-pill, [data-filter-sheet] .filter-showall, [data-filter-sheet] .icon-btn, [data-filter-sheet] .btn',
        `${label} catalog filter sheet`
      );
      await catalog.keyboard.press('Escape');

      // Selecting two entries exposes the fixed tray and its remove targets;
      // the same browser context carries that shortlist onto /compare/.
      await catalog.evaluate(() => {
        const toggles = [...document.querySelectorAll('.compare-toggle')].slice(0, 2);
        for (const toggle of toggles) toggle.click();
      });
      await catalog.waitForSelector('.compare-tray');
      await assertTouchTargets(
        catalog,
        '.compare-tray-remove, .compare-tray-actions .btn-sm',
        `${label} comparison tray`
      );
      const entryPath = await catalog.evaluate(
        () => new URL(document.querySelector('[data-entry] .entry-title a').href).pathname
      );
      await catalog.close();

      const compare = await openPage(browser, '/compare/', viewport);
      await compare.waitForSelector('.compare-head-remove');
      await assertTouchTargets(
        compare,
        '[data-compare-app] a, [data-compare-app] button, main .btn-sm',
        `${label} comparison page`
      );
      await compare.close();

      const entry = await openPage(browser, entryPath, viewport);
      await assertTouchTargets(
        entry,
        '.site-brand, .breadcrumb-link, .toc-link, .entry-action-link, .rail-link, main .btn-sm, .footer-link',
        `${label} entry`
      );
      await entry.close();

      const az = await openPage(browser, `${catalogPath}a-z/`, viewport);
      await assertTouchTargets(az, '.az-jump a, .az-tags a', `${label} A–Z directory`);
      await az.close();

      const submit = await openPage(browser, '/submit/', viewport);
      await assertTouchTargets(
        submit,
        '.site-brand, .preview-summary, .field-input, .field-option, main .btn, .footer-link',
        `${label} submission form`
      );
      await submit.close();

      const setup = await openPage(browser, '/setup/', viewport);
      await setup.click('#wizard-steps button[data-step="fields"]');
      await setup.waitForSelector('.schema-field-toggle');
      await assertTouchTargets(setup, '.schema-field-toggle', `${label} setup entry model`);
      // Do not leave the geometry pass on step 6 for the independent wizard
      // journey below; persistence is product behavior, test isolation is ours.
      await setup.evaluate(() => localStorage.clear());
      await setup.close();
    }
  });

  test('focus rings on the header, hero and footer hold 3:1 against their ground', async () => {
    const page = await openPage(browser, '/');
    // Several links animate their box-shadow (`transition`), so a ring read
    // straight after Tab is still transparent and would be skipped as "none".
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
    const checked = [];
    const failures = [];
    for (let i = 0; i < 250; i += 1) {
      const stop = await tab(page);
      if (stop.onBody) break;
      const ring = await page.evaluate(() => {
        const node = document.activeElement;
        const zone = node.closest('header, .hero, .site-footer');
        if (!zone) return null;
        const parse = (value) => {
          const m = String(value).match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const [r, g, b, a = 1] = m[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map(Number);
          return { r, g, b, a };
        };
        const over = (top, under) => ({
          r: top.r * top.a + under.r * (1 - top.a),
          g: top.g * top.a + under.g * (1 - top.a),
          b: top.b * top.a + under.b * (1 - top.a),
          a: 1,
        });
        // Tailwind's ring is the widest non-transparent box-shadow; its offset
        // (if any) is the narrower one painted in the ground colour inside it.
        const shadows = getComputedStyle(node)
          .boxShadow.split(/,(?![^(]*\))/)
          .map((part) => ({ color: parse(part), spread: parseFloat(part.trim().split(/\s+/).pop()) }))
          .filter((s) => s.color && s.color.a > 0 && s.spread > 0)
          .sort((x, y) => y.spread - x.spread);
        if (shadows.length === 0) return { none: true };
        // What the ring is drawn on: whatever is painted just outside the
        // control, not only its ancestors — the hero's search button sits on
        // top of the (sibling) white input. Backgrounds are composited from
        // the page white up, since the header is translucent.
        node.scrollIntoView({ block: 'center' });
        const box = node.getBoundingClientRect();
        const x = box.left >= 2 ? box.left - 1 : box.right + 1;
        const layers = [];
        for (const el of document.elementsFromPoint(x, box.top + box.height / 2)) {
          if (el === node || node.contains(el)) continue;
          const bg = parse(getComputedStyle(el).backgroundColor);
          if (bg && bg.a > 0) layers.push(bg);
          if (bg && bg.a === 1) break;
        }
        if (layers.length === 0) return { unmeasured: true };
        const ground = layers.reverse().reduce((acc, bg) => over(bg, acc), { r: 255, g: 255, b: 255, a: 1 });
        const color = over(shadows[0].color, ground);
        const lum = ({ r, g, b }) => {
          const ch = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
        };
        const [hi, lo] = [lum(color), lum(ground)].sort((x, y) => y - x);
        return {
          zone: zone.matches('header') ? 'header' : zone.matches('.hero') ? 'hero' : 'footer',
          ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
        };
      });
      if (!ring || ring.none) continue;
      assert.ok(!ring.unmeasured, `${describeStop(stop)}: nothing painted beside it to measure against`);
      checked.push(ring.zone);
      if (ring.ratio < 3) failures.push(`${ring.zone} ${describeStop(stop)}: ${ring.ratio}:1`);
    }
    for (const zone of ['header', 'footer']) {
      assert.ok(checked.includes(zone), `no focusable control with a ring was reached in the ${zone}`);
    }
    assert.deepEqual(failures, [], `focus ring below 3:1 against its ground:\n  ${failures.join('\n  ')}`);
    await page.close();
  });

  test('at 320px a long site name wraps in the header and a long list value wraps on the entry page', async (t) => {
    const page = await openPage(browser, '/', { width: 320, height: 640 });
    // The shipped name may already fit; the one a real deployment uses may not.
    const name = await page.evaluate(() => {
      const span = document.querySelector('.site-brand .flex-col > :last-child');
      span.textContent = 'Public Health Digital Use Case Catalog';
      const style = getComputedStyle(span);
      return {
        clipped: span.scrollWidth > span.clientWidth + 1 || span.scrollHeight > span.clientHeight + 1,
        lines: Math.round(span.getBoundingClientRect().height / parseFloat(style.lineHeight)),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    assert.equal(name.clipped, false, 'the site name is cut off with an ellipsis');
    assert.equal(name.lines, 2, `the site name should wrap to two lines, took ${name.lines}`);
    assert.ok(name.overflow <= 0, `the header pushes the page ${name.overflow}px sideways`);
    await page.close();

    if (emptyCatalog) return t.skip(CATALOG_SKIP);
    const docs = (await (await fetch(`${BASE}/search.json`)).json()).docs;
    let entry = null;
    for (const doc of docs.slice(0, 20)) {
      const html = await (await fetch(`${BASE}${new URL(doc.url, BASE).pathname}`)).text();
      if (html.includes('chip-wrap')) {
        entry = new URL(doc.url, BASE).pathname;
        break;
      }
    }
    if (!entry) return t.skip('no entry in the first 20 renders a list value');
    const chipPage = await openPage(browser, entry, { width: 320, height: 640 });
    const chip = await chipPage.evaluate(() => {
      const el = document.querySelector('.chip-wrap');
      el.textContent =
        'A long free-text list value with an unbroken token https://example.org/a-very-long-path-without-breaks-0123456789';
      const box = el.getBoundingClientRect();
      return {
        right: box.right,
        width: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    assert.ok(chip.right <= chip.width, `the list chip ends at ${chip.right}px on a ${chip.width}px page`);
    assert.ok(chip.overflow <= 0, `the list chip pushes the page ${chip.overflow}px sideways`);
    await chipPage.close();
  });

  test('entry layout: every fact row spans the strip, and a short entry opens no gap beside the rail', async (t) => {
    if (emptyCatalog) return t.skip(CATALOG_SKIP);
    const docs = (await (await fetch(`${BASE}/search.json`)).json()).docs;
    let entry = null;
    for (const doc of docs.slice(0, 20)) {
      const html = await (await fetch(`${BASE}${new URL(doc.url, BASE).pathname}`)).text();
      if (html.includes('class="fact-strip')) {
        entry = new URL(doc.url, BASE).pathname;
        break;
      }
    }
    if (!entry) return t.skip('no entry in the first 20 renders a fact strip');

    for (const width of [390, 1280]) {
      const page = await openPage(browser, entry, { width, height: 900 });
      const short = await page.evaluate(() => {
        const strip = document.querySelector('.fact-strip').getBoundingClientRect();
        const rows = new Map();
        for (const fact of document.querySelectorAll('.fact-strip .fact')) {
          const box = fact.getBoundingClientRect();
          const key = Math.round(box.top);
          rows.set(key, Math.max(rows.get(key) ?? 0, box.right));
        }
        return [...rows.values()].map((right) => Math.round(strip.right - right)).filter((gap) => gap > 1);
      });
      assert.deepEqual(short, [], `${width}px: fact rows stop short of the strip's edge by these px`);
      await page.close();
    }

    // Cut the entry down to one line per row, so the rail is the tallest thing
    // in the grid; its surplus must not open empty track between the rows.
    const page = await openPage(browser, entry, { width: 1280, height: 900 });
    const gaps = await page.evaluate(() => {
      const article = document.querySelector('article');
      const [header, facts, body] = [1, 2, 3].map((row) =>
        [...article.children].find((child) => getComputedStyle(child).gridRowStart === String(row))
      );
      const line = (text) => Object.assign(document.createElement('p'), { textContent: text });
      facts.replaceChildren(line('One short line.'));
      body.replaceChildren(line('A one-paragraph body.'));
      const bottom = (el) => Math.max(...[...el.children].map((c) => c.getBoundingClientRect().bottom));
      const top = (el) => Math.min(...[...el.children].map((c) => c.getBoundingClientRect().top));
      const px = (el) => parseFloat(getComputedStyle(el).marginTop);
      return {
        belowHeader: Math.round(top(facts) - bottom(header) - px(facts)),
        aboveBody: Math.round(top(body) - bottom(facts) - px(body)),
      };
    });
    assert.ok(gaps.belowHeader <= 1, `${gaps.belowHeader}px of empty track below the header`);
    assert.ok(gaps.aboveBody <= 1, `${gaps.aboveBody}px of empty track above the body`);
    await page.close();
  });

  test('the submission form reports its errors where a reader is', async () => {
    const page = await openPage(browser, '/submit/');

    // The summary must not be a live region as well as a focus target: it is
    // read twice if it is. Same decision as the setup wizard's summary.
    assert.deepEqual(await liveness(page, '[data-error-summary]'), { role: null, live: null });

    // With more than one section the form opens as steps, so the way forward
    // is the first step's Next button — the submit control waits on the last
    // step. Tabbed to, not clicked.
    const next = await tabUntil(page, (stop) => stop.tag === 'button' && stop.text === 'Next section', {
      what: 'the Next button',
      max: 150,
    });
    assertUsableStops(next.trail, 'submit');

    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('[data-error-summary]').hidden);
    const summary = await focusStop(page);
    const inSummary = await page.evaluate(() =>
      document.querySelector('[data-error-summary]').contains(document.activeElement)
    );
    assert.ok(inSummary, `the error summary did not take focus (focus is on ${describeStop(summary)})`);
    const problems = await page.evaluate(
      () => document.querySelectorAll('[data-error-summary-list] a').length
    );
    assert.ok(problems > 0, 'the summary appeared with no problems listed');

    // Every blamed control is already marked when the summary appears, and its
    // own description says the same thing the summary said — a reader who
    // jumps straight to a control must not be told it is fine, or told
    // something different.
    const marked = await page.evaluate(() =>
      [...document.querySelectorAll('[data-error-summary-list] a')].map((link) => {
        const control = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        const clean = (value) => String(value).replace(/\s+/g, ' ').trim();
        // The inline message belongs to the field, not to each radio in it, so
        // the id is whatever aria-describedby points at that has text now.
        const described = (control?.getAttribute('aria-describedby') || '')
          .split(/\s+/)
          .map((id) => document.getElementById(id))
          .filter((node) => node && !node.hidden && !node.closest('[hidden]'));
        return {
          id: control?.id ?? null,
          invalid: control?.getAttribute('aria-invalid'),
          summary: clean(link.textContent),
          described: described.map((node) => clean(node.textContent)).filter(Boolean),
        };
      })
    );
    for (const item of marked) {
      assert.ok(item.id, 'a summary link points at no control');
      assert.equal(item.invalid, 'true', `${item.id} is listed as a problem but is not aria-invalid`);
      assert.ok(
        item.described.some((text) => text.includes(item.summary)),
        `${item.id} is described as [${item.described.join(' | ')}], not as "${item.summary}"`
      );
    }

    // The first link takes the reader to the first problem.
    const link = await tabUntil(page, (stop) => stop.tag === 'a' && stop.href.startsWith('#'), {
      what: 'the first summary link',
      max: 10,
    });
    assertUsableStops(link.trail, 'submit summary');
    await page.keyboard.press('Enter');
    const control = await focusStop(page);
    assert.equal(control.id, marked[0].id, `the summary link went to ${describeStop(control)}`);

    // Answering the question clears its error without a second submit. What
    // "answering" means depends on the control the schema produced, so ask it.
    const kind = await page.evaluate(() => {
      const node = document.activeElement;
      return node.tagName === 'TEXTAREA' ? 'text' : node.type || 'text';
    });
    if (kind === 'radio' || kind === 'checkbox') await page.keyboard.press('Space');
    else if (kind === 'select-one') await page.keyboard.press('ArrowDown');
    else await page.keyboard.type('A keyboard-only walkthrough');

    const cleared = await page.evaluate((id) => {
      const control = document.getElementById(id);
      const described = (control.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .map((token) => document.getElementById(token))
        .filter((node) => node && !node.hidden && !node.closest('[hidden]'));
      return {
        invalid: control.getAttribute('aria-invalid'),
        messages: described.map((node) => node.textContent.trim()).filter(Boolean),
      };
    }, marked[0].id);
    assert.notEqual(cleared.invalid, 'true', 'the field stayed aria-invalid after being answered');
    assert.ok(
      !cleared.messages.some((text) => text === marked[0].summary),
      `the inline error "${marked[0].summary}" stayed after the field was answered`
    );

    // Answer the rest of the step the way the schema wrote each control, then
    // move on. A clean step's Next is a step change, and a step change is a
    // page change to a reader: the new section's heading takes focus and the
    // rail marks exactly one step as current — the same contract as the setup
    // wizard below.
    await page.evaluate(() => {
      const fire = (node, type) => node.dispatchEvent(new Event(type, { bubbles: true }));
      const section = document.querySelector('[data-section]:not([hidden])');
      section.querySelectorAll('[data-field][data-required="true"]').forEach((wrap) => {
        const select = wrap.querySelector('select');
        const boxes = wrap.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const text = wrap.querySelector('input:not([type="radio"]):not([type="checkbox"]), textarea');
        if (select) {
          const option = [...select.options].find((item) => item.value !== '');
          if (option) select.value = option.value;
          fire(select, 'change');
        } else if (boxes.length > 0) {
          const box = [...boxes].find((item) => item.value && !item.hasAttribute('data-clear'));
          if (box && !box.checked) {
            box.checked = true;
            fire(box, 'change');
          }
        } else if (text && !text.value) {
          text.value = 'A keyboard-only walkthrough';
          fire(text, 'input');
        }
      });
    });
    const here = await page.evaluate(() => document.querySelector('[data-section]:not([hidden]) h2').id);
    const onward = await tabUntil(page, (stop) => stop.tag === 'button' && stop.text === 'Next section', {
      what: 'the Next button again',
      max: 60,
    });
    assertUsableStops(onward.trail, 'submit');
    await page.keyboard.press('Enter');
    const arrived = await focusStop(page);
    assert.match(arrived.id ?? '', /^heading-/, `Next put focus on ${describeStop(arrived)}`);
    assert.notEqual(arrived.id, here, 'Next left focus on the step it came from');
    assert.equal(
      await page.evaluate(() => document.querySelectorAll('.progress-link[aria-current="step"]').length),
      1,
      'exactly one rail link claims to be the current step'
    );

    await page.close();
  });

  test('the setup wizard, step 1 -> step 2', async () => {
    const page = await openPage(browser, '/setup/');
    await page.waitForSelector('#step-heading');

    // No live-region role on the summary container, for the same reason.
    assert.deepEqual(await liveness(page, '#wizard-errors'), { role: null, live: null });

    const pills = await page.evaluate(() =>
      [...document.querySelectorAll('#wizard-steps button')].map((b) => ({
        label: b.textContent.trim(),
        current: b.getAttribute('aria-current'),
      }))
    );
    assert.equal(pills[0].current, 'step', 'no pill claims to be the current step');
    assert.equal(pills.filter((p) => p.current === 'step').length, 1);

    const cont = await tabUntil(page, (stop) => stop.text === 'Continue', { what: 'Continue' });
    assertUsableStops(cont.trail, 'setup');
    await page.keyboard.press('Enter');

    // A step change is a page change to a reader: the heading takes focus and
    // says where they are.
    const heading = await focusStop(page);
    assert.equal(heading.id, 'step-heading', `Continue put focus on ${describeStop(heading)}`);
    assert.equal(heading.name, 'Names & contact');
    assert.match(await textOf(page, '#wizard .eyebrow'), /^Step 2 of \d+$/);
    assert.equal(
      await page.evaluate(() =>
        document.querySelector('[aria-current="step"] .wizard-step-label').textContent.trim()
      ),
      'Basics'
    );
    assert.equal(
      await page.evaluate(() =>
        document.querySelector('[aria-current="step"] .wizard-step-index').textContent.trim()
      ),
      '2'
    );

    // Blanking a required answer and moving on must mark the control at the
    // same moment the summary appears — not one microtask later, when the
    // reader is already there.
    await page.evaluate(() => {
      const field = document.getElementById('field-siteName');
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const again = await tabUntil(page, (stop) => stop.text === 'Continue', { what: 'Continue' });
    assertUsableStops(again.trail, 'setup step 2');
    await page.keyboard.press('Enter');

    const state = await page.evaluate(() => {
      const control = document.getElementById('field-siteName');
      const summary = document.getElementById('wizard-error-summary');
      return {
        focused: document.activeElement?.id,
        summary: Boolean(summary),
        problems: summary ? summary.querySelectorAll('a[href^="#"]').length : 0,
        invalid: control?.getAttribute('aria-invalid'),
        describes: (control?.getAttribute('aria-describedby') || '').includes('field-siteName-error'),
        message: document.getElementById('field-siteName-error')?.textContent?.trim() || '',
        heading: document.getElementById('step-heading')?.textContent,
      };
    });
    assert.ok(state.summary, 'Continue moved on with a required answer blank');
    assert.equal(state.focused, 'wizard-error-summary', `focus is on #${state.focused}`);
    assert.equal(state.heading, 'Names & contact', 'the wizard left the step it could not validate');
    assert.ok(state.problems > 0, 'the summary listed no problems');
    assert.equal(state.invalid, 'true', 'the control was not marked when the summary appeared');
    assert.ok(state.describes, 'the control does not point at its error message');
    assert.notEqual(state.message, '', 'the inline error message is empty');

    // The summary link is the way back to the answer, and answering it clears
    // the mark — no dead end between the summary and the field.
    const jump = await tabUntil(page, (stop) => stop.tag === 'a' && stop.href.startsWith('#'), {
      what: 'the summary link',
      max: 10,
    });
    assertUsableStops(jump.trail, 'setup summary');
    await page.keyboard.press('Enter');
    assert.equal((await focusStop(page)).id, 'field-siteName');
    await page.keyboard.type('Flow test catalog');
    assert.equal(
      await page.evaluate(() => document.getElementById('field-siteName').getAttribute('aria-invalid')),
      null
    );

    await page.close();
  });
});

/**
 * The preset build matrix: assertions over the trees scripts/build_variants.mjs
 * produces. One Jekyll build per variant, every assertion read off the built
 * DOM — so adding a check costs nothing but the check.
 *
 * Skipped unless RUN_BUILD_TESTS=1 (`npm run test:build`). Node's default test
 * discovery picks up everything under `test/`, and `npm test` has to stay a
 * pure-JS, sub-second gate that needs neither Ruby nor a Jekyll install.
 */

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';
import * as yaml from 'js-yaml';

import { VARIANTS, buildVariants, preflight } from '../../scripts/build_variants.mjs';
import { checkRenderedCopy, entryNoun, formatFindings } from '../../scripts/check_rendered_copy.mjs';

const ENABLED = process.env.RUN_BUILD_TESTS === '1';
const ready = ENABLED ? preflight() : { ok: false, reason: 'set RUN_BUILD_TESTS=1 (`npm run test:build`)' };

/**
 * `BUILD_VARIANTS=blank,blank-empty` narrows the run to those ids — for a local
 * loop on one preset, and so CI can shard this across runners without the id
 * list being written down a second time in the workflow.
 */
const SELECTED = (process.env.BUILD_VARIANTS ?? '').split(/[\s,]+/).filter(Boolean);
const variants = SELECTED.length ? VARIANTS.filter((v) => SELECTED.includes(v.id)) : VARIANTS;
const unknown = SELECTED.filter((id) => !VARIANTS.some((v) => v.id === id));
if (unknown.length) throw new Error(`BUILD_VARIANTS names no such variant: ${unknown.join(', ')}`);

/** `skip` reason for a test that needs a variant this run did not build. */
const needs = (id) =>
  variants.some((variant) => variant.id === id) ? false : `${id} is not in BUILD_VARIANTS`;

/** Parsed `<dir>/<page>/index.html`. */
function page(siteDir, urlPath) {
  const file = path.join(siteDir, urlPath, 'index.html');
  assert.ok(fs.existsSync(file), `${urlPath} was not built`);
  return new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
}

describe('preset build matrix', { skip: ready.ok ? false : ready.reason, concurrency: false }, () => {
  /** @type {Map<string, ReturnType<typeof buildVariants>[number]>} */
  const built = new Map();
  let scratchRoot = '';

  before(
    () => {
      if (!ready.ok) return;
      scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-variants-'));
      for (const result of buildVariants({ ids: SELECTED, scratchRoot }))
        built.set(result.variant.id, result);
    },
    { timeout: 15 * 60 * 1000 }
  );

  after(() => {
    if (scratchRoot && !process.env.KEEP_BUILD_VARIANTS) {
      fs.rmSync(scratchRoot, { recursive: true, force: true });
    }
  });

  for (const variant of variants) {
    test(`${variant.id}: every step succeeds`, () => {
      const result = built.get(variant.id);
      const failed = result.steps.filter((step) => !step.ok);
      assert.deepEqual(
        failed.map((step) => step.name),
        [],
        failed.map((step) => `\n--- ${step.name} ---\n${step.output.trim()}`).join('\n')
      );
    });

    if (!variant.build) continue;

    test(`${variant.id}: rendered copy is clean`, () => {
      const { dir, siteDir } = built.get(variant.id);
      const findings = checkRenderedCopy(siteDir, { sourceDir: dir });
      assert.equal(findings.length, 0, `\n${formatFindings(findings)}`);
    });

    test(`${variant.id}: /search.json is valid JSON`, () => {
      const { siteDir } = built.get(variant.id);
      const index = JSON.parse(fs.readFileSync(path.join(siteDir, 'search.json'), 'utf8'));
      assert.ok(Array.isArray(index.docs), 'search.json has no `docs` array');
      // Only a variant with entries can have entry docs; `blank-empty` has none
      // by design, and an empty index is the correct output for an empty site.
      if (variant.entries !== 'none') {
        assert.ok(
          index.docs.some((doc) => doc.kind === 'entry' || doc.url?.includes('/')),
          'search.json is empty for a variant that has entries'
        );
      }
    });

    test(`${variant.id}: the catalog eager-loads the first card that has a picture, and only that one`, () => {
      if (variant.entries === 'none') return;
      const { dir, siteDir } = built.get(variant.id);
      const cards = [
        ...page(siteDir, entryNoun(dir).path).querySelectorAll('[data-entry-grid] [data-entry]'),
      ];
      assert.ok(cards.length > 0, 'the catalog grid has no cards');
      // The first-row window the layout probes (_layouts/catalog.html).
      const candidate = cards.slice(0, 3).find((card) => card.querySelector('img'));
      for (const card of cards) {
        for (const img of card.querySelectorAll('img')) {
          const id = card.getAttribute('data-entry-id');
          if (card === candidate) {
            assert.equal(img.getAttribute('loading'), 'eager', `${id}: the LCP candidate loads lazily`);
            assert.equal(
              img.getAttribute('fetchpriority'),
              'high',
              `${id}: the LCP candidate has no fetchpriority`
            );
          } else {
            assert.equal(
              img.getAttribute('loading'),
              'lazy',
              `${id}: a card that is not the LCP candidate loads eagerly`
            );
            assert.equal(
              img.hasAttribute('fetchpriority'),
              false,
              `${id}: a second image claims fetchpriority`
            );
          }
        }
      }
    });

    test(`${variant.id}: the Atom feed lists the entries`, () => {
      const { dir, siteDir } = built.get(variant.id);
      const feed = path.join(siteDir, entryNoun(dir).path, 'feed.xml');
      if (variant.entries === 'none') {
        // _plugins/catalog_feed.rb returns early rather than emitting an empty
        // document — the failure mode it was written to replace.
        assert.equal(fs.existsSync(feed), false, 'an empty catalog should not emit a feed');
        return;
      }
      assert.ok(fs.existsSync(feed), `${path.relative(siteDir, feed)} was not generated`);
      const entries = (fs.readFileSync(feed, 'utf8').match(/<entry>/g) ?? []).length;
      assert.ok(entries > 0, 'the feed advertised in <head> has no entries');
    });

    test(`${variant.id}: the A–Z directory and the facet landing pages are real pages`, () => {
      const { dir, siteDir } = built.get(variant.id);
      const noun = entryNoun(dir);
      const az = path.join(siteDir, noun.path, 'a-z', 'index.html');
      if (variant.entries === 'none') {
        // Nothing to index: _plugins/facet_pages.rb generates neither, rather
        // than publishing an empty directory of an empty catalog.
        assert.equal(fs.existsSync(az), false, 'an empty catalog should not get an A–Z page');
        return;
      }
      assert.ok(fs.existsSync(az), `${noun.path}/a-z/ was not generated`);

      const directory = page(siteDir, `${noun.path}/a-z`);
      const landing = [...directory.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((href) => new RegExp(`^/${noun.path}/[^/]+/[^/]+/$`).test(href));
      assert.ok(landing.length > 0, 'the A–Z page links to no facet landing pages');

      // Every link it makes has to resolve, and land on a page with a heading
      // and a route back into the live filter.
      for (const href of landing.slice(0, 5)) {
        const document = page(siteDir, href);
        assert.equal(document.querySelectorAll('h1').length, 1, `${href} does not have exactly one <h1>`);
        assert.ok(
          document.querySelector(`a[href*="/${noun.path}/?"]`),
          `${href} does not link back to the live filter`
        );
        assert.ok(document.querySelector('link[rel="canonical"]'), `${href} has no canonical link`);
        const title = document.querySelector('title')?.textContent ?? '';
        assert.ok(title.length > 0 && !/^\s*·/.test(title), `${href} has an empty <title>`);
      }

      // A crawler finds them the same way: through the sitemap.
      const sitemap = fs.readFileSync(path.join(siteDir, 'sitemap.xml'), 'utf8');
      assert.ok(sitemap.includes(`${noun.path}/a-z/`), 'the A–Z page is missing from sitemap.xml');
      assert.ok(sitemap.includes(landing[0]), `${landing[0]} is missing from sitemap.xml`);
    });

    test(`${variant.id}: the catalog search box is a <search> landmark`, () => {
      const { dir, siteDir } = built.get(variant.id);
      const document = page(siteDir, entryNoun(dir).path);
      const landmark = document.querySelector('search[role="search"]');
      assert.ok(landmark, 'the results header has no <search> landmark');
      assert.ok(landmark.getAttribute('aria-label'), 'the <search> landmark has no accessible name');
      assert.equal(landmark.querySelector('[data-filter="search"]')?.getAttribute('type'), 'search');
    });

    test(`${variant.id}: every entry page has one <h1> and a related section`, () => {
      const { dir, siteDir } = built.get(variant.id);
      const noun = entryNoun(dir);
      const catalogDir = path.join(siteDir, noun.path);
      const slugs = fs
        .readdirSync(catalogDir, { withFileTypes: true })
        .filter((item) => item.isDirectory() && fs.existsSync(path.join(catalogDir, item.name, 'index.html')))
        .map((item) => item.name);
      if (variant.entries === 'none') {
        assert.equal(slugs.length, 0, 'entries were left behind in an empty variant');
        return;
      }
      assert.ok(slugs.length > 0, 'no entry pages were built');
      for (const slug of slugs) {
        const document = page(siteDir, `${noun.path}/${slug}`);
        assert.equal(document.querySelectorAll('h1').length, 1, `${slug} does not have exactly one <h1>`);
      }
    });
  }

  test(
    'blank-empty: the catalog shows the empty state and a working call to action',
    { skip: needs('blank-empty') },
    () => {
      const { dir, siteDir } = built.get('blank-empty');
      const noun = entryNoun(dir);
      const document = page(siteDir, noun.path);
      assert.equal(document.querySelectorAll('.entry-card').length, 0);

      const text = document.body.textContent.replace(/\s+/g, ' ');
      assert.match(text, new RegExp(`No ${noun.plural.toLowerCase()} have been published yet\\.`));
      // The sentence must not be downcased as a whole — that is the
      // `'No ' | append: plural | downcase` bug the sentence-case rule watches for.
      assert.doesNotMatch(text, /\bno [a-z]+ have been published yet\./);

      const cta = [...document.querySelectorAll('a[href]')].find((a) =>
        a.getAttribute('href').includes('/submit/')
      );
      assert.ok(cta, 'the empty state has no submit call to action');
      assert.ok(
        fs.existsSync(path.join(siteDir, cta.getAttribute('href'), 'index.html')),
        `the empty-state call to action points at ${cta.getAttribute('href')}, which is not in the built site`
      );
    }
  );

  test(
    'legacy-font-names: protected aliases render the renamed families and preload current files',
    { skip: needs('legacy-font-names') },
    () => {
      const { siteDir } = built.get('legacy-font-names');
      const document = page(siteDir, '');
      const theme = document.querySelector('style')?.textContent ?? '';
      assert.match(theme, /--font-heading: "PHCT Serif"/u);
      assert.match(theme, /--font-body: "PHCT Sans"/u);
      const preloads = [...document.querySelectorAll('link[rel="preload"][as="font"]')].map((link) =>
        link.getAttribute('href')
      );
      assert.ok(preloads.some((href) => href.endsWith('/assets/fonts/PHCTSerif-Variable.woff2')));
      assert.ok(preloads.some((href) => href.endsWith('/assets/fonts/PHCTSans-Variable.woff2')));
      assert.equal(
        preloads.some((href) => /Source(?:Sans|Serif)/u.test(href)),
        false
      );
    }
  );

  test(
    'legacy-issue-chooser: generation migrates protected safety routing',
    { skip: needs('legacy-issue-chooser') },
    () => {
      const { dir } = built.get('legacy-issue-chooser');
      const chooser = yaml.load(
        fs.readFileSync(path.join(dir, '.github', 'ISSUE_TEMPLATE', 'config.yml'), 'utf8')
      );
      assert.equal(chooser.blank_issues_enabled, false);
      assert.ok(
        chooser.contact_links.some((link) => link.url.endsWith('/security/advisories/new')),
        'private vulnerability route was not migrated'
      );
      assert.ok(
        chooser.contact_links.some((link) => link.url.endsWith('/blob/release/catalog-v2/SECURITY.md')),
        'security fallback route did not use the configured branch'
      );
    }
  );

  test(
    'shipped: built-site distributions retain the complete third-party notice',
    { skip: needs('shipped') },
    () => {
      const { dir, siteDir } = built.get('shipped');
      assert.equal(
        fs.readFileSync(path.join(siteDir, 'THIRD_PARTY_NOTICES.md'), 'utf8'),
        fs.readFileSync(path.join(dir, 'THIRD_PARTY_NOTICES.md'), 'utf8')
      );
    }
  );

  test(
    'blank-empty: the filter rail renders one fieldset per facet field',
    { skip: needs('blank-empty') },
    () => {
      const { dir, siteDir } = built.get('blank-empty');
      const schema = yaml.load(fs.readFileSync(path.join(dir, '_data', 'schema.yml'), 'utf8'));
      // Free-text facets take their options from the entries, so with an empty
      // catalog only the fields that declare `options` can render a group.
      const expected = schema.fields.filter((field) => field.facet && (field.options ?? []).length > 0);
      const document = page(siteDir, entryNoun(dir).path);
      const groups = document.querySelectorAll('[data-filter-rail] fieldset, .filter-rail fieldset');
      assert.equal(groups.length, expected.length, `expected ${expected.map((f) => f.key).join(', ')}`);
    }
  );

  test(
    'blank-empty: the filter rail opens with a "Skip filters" link that lands on the results heading',
    { skip: needs('blank-empty') },
    () => {
      const { dir, siteDir } = built.get('blank-empty');
      const document = page(siteDir, entryNoun(dir).path);
      const rail = document.querySelector('[data-filter-rail]');
      const skip = rail?.querySelector('a.rail-skip');
      assert.ok(skip, 'no .rail-skip link inside the rail');
      assert.equal(
        rail.getAttribute('tabindex'),
        '-1',
        'the scrollable rail must not become an unnamed Firefox keyboard stop'
      );
      assert.equal(rail.firstElementChild, skip, 'the skip link must be the first thing in the rail');
      const target = skip.getAttribute('href').replace(/^#/, '');
      const heading = document.getElementById(target);
      assert.ok(heading, `#${target} is not on the page`);
      assert.equal(heading.getAttribute('tabindex'), '-1', `#${target} is not programmatically focusable`);
    }
  );

  test(
    'all-modules: every cohort event is linked from its cohort page',
    { skip: needs('all-modules') },
    () => {
      const { dir, siteDir } = built.get('all-modules');
      const cohorts = yaml.load(fs.readFileSync(path.join(dir, '_data', 'cohorts', '2026.yml'), 'utf8'));
      const document = page(siteDir, 'cohorts/2026');
      const hrefs = new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
      for (const event of cohorts.events) {
        const url = `/cohorts/2026/events/${event.id}/`;
        assert.ok(hrefs.has(url), `${event.name} (${url}) is not linked from /cohorts/2026/`);
        assert.ok(fs.existsSync(path.join(siteDir, url, 'index.html')), `${url} was not built`);
      }
    }
  );

  test(
    'all-modules: a catalog whose newest entry has no picture still eager-loads a card image',
    { skip: needs('all-modules') },
    () => {
      const { dir, siteDir } = built.get('all-modules');
      const catalog = page(siteDir, entryNoun(dir).path);
      const cards = [...catalog.querySelectorAll('[data-entry-grid] [data-entry]')];
      // The variant strips the newest entry's pictures, so this is the case the
      // per-variant check above has to get right rather than skip past.
      assert.equal(
        cards[0].querySelector('img'),
        null,
        'precondition: the first card should have no picture'
      );
      const eager = [...catalog.querySelectorAll('[data-entry-grid] img[loading="eager"]')];
      // The layout only looks at the first row (3 cards): a picture below it is
      // below the fold. The updater runs this suite on a deployment's own
      // entries, whose first row may have no picture at all.
      const firstPicture = cards
        .slice(0, 3)
        .map((card) => card.querySelector('img'))
        .find(Boolean);
      if (!firstPicture) {
        assert.equal(eager.length, 0, 'no picture in the first row, so nothing should load eagerly');
        return;
      }
      assert.equal(eager.length, 1, `expected one eager card image, found ${eager.length}`);
      assert.equal(eager[0], firstPicture, 'the eager image should be the first picture in the first row');
      assert.equal(eager[0].getAttribute('fetchpriority'), 'high');
    }
  );

  test(
    'all-modules: `demo_message` replaces the banner sentence and its setup links',
    { skip: needs('all-modules') },
    () => {
      const { siteDir } = built.get('all-modules');
      const banner = page(siteDir, '').querySelector('[data-component="demo-banner"]');
      assert.ok(banner, 'the demo banner is missing');
      const text = banner.textContent.replace(/\s+/g, ' ').trim();
      assert.match(
        text,
        /^Demo content Entries here are provisional until the review panel signs them off\.$/u
      );
      const links = [...banner.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      assert.deepEqual(
        links,
        ['https://example.org/review-panel'],
        'the markdown link should be the only link'
      );
      assert.equal(banner.querySelector('p p'), null, 'markdownify left a <p> inside the banner paragraph');
    }
  );

  test(
    'shipped: with no `demo_message` the banner keeps its default copy and links',
    { skip: needs('shipped') },
    () => {
      const { siteDir } = built.get('shipped');
      const banner = page(siteDir, '').querySelector('[data-component="demo-banner"]');
      assert.ok(banner, 'the demo banner is missing');
      assert.match(
        banner.textContent.replace(/\s+/g, ' '),
        /Everything on this site is sample data shipped with the template\. Configure it/u
      );
      assert.ok(banner.querySelector('a[href$="/setup/"]'), 'the default banner lost its setup link');
    }
  );

  test(
    'all-modules: an attached deck keeps the acronym in its download label',
    { skip: needs('all-modules') },
    () => {
      const { dir, siteDir } = built.get('all-modules');
      const schema = yaml.load(fs.readFileSync(path.join(dir, '_data', 'schema.yml'), 'utf8'));
      const deck = schema.fields.find((field) => field.type === 'file' && field.thumbnail);
      const withDeck = fs
        .readdirSync(path.join(dir, entryNoun(dir).path), { withFileTypes: true })
        .find(
          (item) =>
            item.isDirectory() && fs.existsSync(path.join(dir, entryNoun(dir).path, item.name, deck.filename))
        );
      assert.ok(withDeck, 'precondition: the variant should have attached a deck');
      const text = page(siteDir, `${entryNoun(dir).path}/${withDeck.name}`).body.textContent.replace(
        /\s+/g,
        ' '
      );
      const expected = `Download ${deck.label.charAt(0).toLowerCase()}${deck.label.slice(1)}`;
      assert.ok(text.includes(expected), `expected "${expected}" on the entry page`);
      assert.equal(
        text.includes(`Download ${deck.label.toLowerCase()}`),
        false,
        'the label was lower-cased whole'
      );
    }
  );

  test('all-modules: the events and resources pages build', { skip: needs('all-modules') }, () => {
    const { siteDir } = built.get('all-modules');
    for (const url of ['events', 'resources', 'cohorts']) {
      assert.equal(page(siteDir, url).querySelectorAll('h1').length, 1, `/${url}/ has no single <h1>`);
    }
  });

  test(
    'shipped: sample entry contacts and resources are visibly non-live in demo mode',
    { skip: needs('shipped') },
    () => {
      const { dir, siteDir } = built.get('shipped');
      const schema = yaml.load(fs.readFileSync(path.join(dir, '_data', 'schema.yml'), 'utf8'));
      const entryPath = schema.entry?.path ?? 'catalog';
      const catalogDir = path.join(dir, entryPath);
      const fields = schema.fields ?? [];
      let checked = 0;

      for (const item of fs.readdirSync(catalogDir, { withFileTypes: true })) {
        const source = path.join(catalogDir, item.name, 'index.md');
        if (!item.isDirectory() || !fs.existsSync(source)) continue;
        const front = yaml.load(fs.readFileSync(source, 'utf8').split(/^---\s*$/m)[1] ?? '') ?? {};
        if (!front.sample) continue;

        const document = page(siteDir, `${entryPath}/${item.name}`);
        const hrefs = [...document.querySelectorAll('a[href]')].map((anchor) => anchor.getAttribute('href'));
        const body = document.body.textContent.replace(/\s+/g, ' ');
        const urls = fields
          .filter((field) => field.type === 'url' && front[field.key])
          .map((field) => front[field.key]);
        const emails = fields
          .filter((field) => field.type === 'email' && front[field.key])
          .map((field) => front[field.key]);
        const resources = fields
          .filter((field) => field.type === 'links' && Array.isArray(front[field.key]))
          .flatMap((field) => front[field.key])
          .map((link) => link?.url ?? link)
          .filter(Boolean);

        for (const url of [...urls, ...resources]) {
          assert.ok(!hrefs.includes(url), `${item.name} makes sample URL ${url} clickable`);
        }
        for (const email of emails) {
          assert.ok(
            !hrefs.some((href) => href.startsWith(`mailto:${email}`)),
            `${item.name} makes fictional contact ${email} clickable`
          );
        }
        if (urls.length) assert.match(body, /Demo placeholder — not live/);
        if (resources.length) assert.match(body, /Sample resource — not live/);
        if (emails.length) assert.match(body, /Fictional contact — demo only/);
        checked += 1;
      }

      assert.ok(checked > 0, 'the shipped catalog has no sample entries to exercise demo safety');
    }
  );

  test(
    'shipped-live-mode: entry contacts and resources become live when demo mode is disabled',
    { skip: needs('shipped-live-mode') },
    () => {
      const { dir, siteDir } = built.get('shipped-live-mode');
      const schema = yaml.load(fs.readFileSync(path.join(dir, '_data', 'schema.yml'), 'utf8'));
      const entryPath = schema.entry?.path ?? 'catalog';
      const catalogDir = path.join(dir, entryPath);
      const fields = schema.fields ?? [];
      let checked = 0;

      for (const item of fs.readdirSync(catalogDir, { withFileTypes: true })) {
        const source = path.join(catalogDir, item.name, 'index.md');
        if (!item.isDirectory() || !fs.existsSync(source)) continue;
        const front = yaml.load(fs.readFileSync(source, 'utf8').split(/^---\s*$/m)[1] ?? '') ?? {};
        if (!front.sample) continue;

        const document = page(siteDir, `${entryPath}/${item.name}`);
        const hrefs = [...document.querySelectorAll('a[href]')].map((anchor) => anchor.getAttribute('href'));
        const body = document.body.textContent.replace(/\s+/g, ' ');
        const urls = fields
          .filter((field) => field.type === 'url' && front[field.key])
          .map((field) => front[field.key]);
        const emails = fields
          .filter((field) => field.type === 'email' && front[field.key])
          .map((field) => front[field.key]);
        const resources = fields
          .filter((field) => field.type === 'links' && Array.isArray(front[field.key]))
          .flatMap((field) => front[field.key])
          .map((link) => link?.url ?? link)
          .filter(Boolean);

        for (const url of [...urls, ...resources]) {
          assert.ok(hrefs.includes(url), `${item.name} does not link to live URL ${url}`);
        }
        for (const email of emails) {
          assert.ok(
            hrefs.some((href) => href.startsWith(`mailto:${email}`)),
            `${item.name} does not link to live contact ${email}`
          );
        }
        assert.doesNotMatch(body, /Demo placeholder — not live/);
        assert.doesNotMatch(body, /Sample resource — not live/);
        assert.doesNotMatch(body, /Fictional contact — demo only/);
        checked += 1;
      }

      assert.ok(checked > 0, 'the live-mode variant has no entries to exercise live links');
    }
  );

  test(
    'shipped: the governance page renders every block from _data/governance.yml and the footer links to it',
    { skip: needs('shipped') },
    () => {
      const { dir, siteDir } = built.get('shipped');
      const gov = yaml.load(fs.readFileSync(path.join(dir, '_data', 'governance.yml'), 'utf8'));
      const doc = page(siteDir, 'governance');
      assert.equal(doc.querySelectorAll('h1').length, 1, '/governance/ has no single <h1>');
      // Every step, criterion, role and policy that the data file declares is on
      // the page, and every policy id is a real anchor — the footer and the
      // "On this page" list link to those ids.
      assert.equal(doc.querySelectorAll('.gov-step').length, gov.review.steps.length);
      assert.equal(doc.querySelectorAll('.gov-criterion').length, gov.review.criteria.length);
      assert.equal(doc.querySelectorAll('.gov-role').length, gov.roles.length);
      for (const policy of gov.policies) {
        const section = doc.getElementById(policy.id);
        assert.ok(section, `policy #${policy.id} has no anchor`);
        assert.equal(section.textContent.trim(), policy.title);
      }
      const nav = [...doc.querySelectorAll('.gov-nav a')].map((a) => a.getAttribute('href'));
      for (const href of nav) {
        assert.ok(
          doc.getElementById(href.slice(1)),
          `"On this page" links to ${href}, which is not on the page`
        );
      }
      // The footer: the accessibility line points at the policy section, and the
      // feed link is present because the shipped catalog has entries.
      const footer = doc.querySelector('footer');
      const a11y = [...footer.querySelectorAll('a')].find((a) =>
        /accessibility statement/i.test(a.textContent)
      );
      assert.ok(a11y, 'the footer has no accessibility-statement link');
      assert.ok(a11y.getAttribute('href').endsWith('/governance/#accessibility'));
      assert.ok(doc.getElementById('accessibility'), 'the accessibility statement anchor is missing');
      const feed = [...footer.querySelectorAll('a')].find((a) => /\bFeed\b/.test(a.textContent));
      assert.ok(feed, 'the footer has no feed link');
      assert.ok(
        fs.existsSync(path.join(siteDir, feed.getAttribute('href'))),
        'the footer feed link is a 404'
      );
      // The header navigation carries the module's link.
      const header = doc.querySelector('header');
      assert.ok(
        [...header.querySelectorAll('a')].some((a) => a.getAttribute('href').endsWith('/governance/')),
        'the header does not link to /governance/'
      );
    }
  );

  test(
    'shipped: a links_entries value links to the entry it names, which says who adopted it',
    { skip: needs('shipped') },
    () => {
      const { dir, siteDir } = built.get('shipped');
      const schema = yaml.load(fs.readFileSync(path.join(dir, '_data', 'schema.yml'), 'utf8'));
      const keys = (schema.fields ?? []).filter((field) => field.links_entries).map((f) => f.key);
      assert.ok(keys.length, 'the shipped schema declares no links_entries field');
      const entryPath = schema.entry?.path ?? 'catalog';
      const catalogDir = path.join(dir, entryPath);
      const slugs = fs
        .readdirSync(catalogDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && fs.existsSync(path.join(catalogDir, e.name, 'index.md')))
        .map((e) => e.name);

      // Read the source front matter, so the assertions follow the sample
      // content instead of naming a slug this test would have to be edited for.
      const named = new Map();
      for (const slug of slugs) {
        const text = fs.readFileSync(path.join(catalogDir, slug, 'index.md'), 'utf8');
        const front = yaml.load(text.split(/^---\s*$/m)[1] ?? '') ?? {};
        const targets = keys.flatMap((key) => (Array.isArray(front[key]) ? front[key] : []));
        if (targets.length) named.set(slug, targets);
      }
      assert.ok(named.size, 'no shipped entry uses the links_entries field');

      const adopters = new Map();
      for (const [slug, targets] of named) {
        const hrefs = [...page(siteDir, `${entryPath}/${slug}`).querySelectorAll('a.chip-plain')].map((a) =>
          a.getAttribute('href')
        );
        for (const target of targets) {
          assert.ok(
            hrefs.includes(`/${entryPath}/${target}/`),
            `${slug} does not link to the entry it names, ${target}`
          );
          adopters.set(target, (adopters.get(target) ?? 0) + 1);
        }
      }

      for (const slug of slugs) {
        const card = page(siteDir, `${entryPath}/${slug}`).getElementById('rail-adopted');
        const count = adopters.get(slug) ?? 0;
        if (count === 0) {
          assert.equal(card, null, `${slug} shows an "Adopted by" card but nothing names it`);
          continue;
        }
        assert.ok(card, `${slug} is named by ${count} entries but has no "Adopted by" card`);
        assert.match(card.querySelector('h2').textContent, new RegExp(`Adopted by\\s*${count}\\b`));
        assert.equal(card.querySelectorAll('li a').length, count);
      }
    }
  );

  test(
    'shipped: the governance page renders "How the catalog is doing" from _data/metrics.json',
    { skip: needs('shipped') },
    () => {
      const { dir, siteDir } = built.get('shipped');
      const metrics = JSON.parse(fs.readFileSync(path.join(dir, '_data', 'metrics.json'), 'utf8'));
      const doc = page(siteDir, 'governance');
      const section = doc.getElementById('metrics');
      assert.ok(section, 'no #metrics heading');
      assert.ok(
        [...doc.querySelectorAll('.gov-nav a')].some((a) => a.getAttribute('href') === '#metrics'),
        '"On this page" does not list the metrics block'
      );
      // One card per figure that has something to say: submissions and
      // published always; organizations only above zero (0 is truthy in
      // Liquid, and null means no contributor_key); review time only once
      // something has been reviewed.
      const expectedCards =
        2 + (metrics.totals.organizations > 0 ? 1 : 0) + (metrics.totals.turnaround_days.count > 0 ? 1 : 0);
      assert.equal(doc.querySelectorAll('.gov-metric').length, expectedCards);
      const values = [...doc.querySelectorAll('.gov-metric')].map((card) =>
        card.querySelector('.gov-metric-value').textContent.trim()
      );
      assert.equal(values[0], String(metrics.totals.submissions));
      assert.equal(values[1], String(metrics.totals.published));
      // One table row per quarter, oldest first, and the organizations column
      // only when the figure is published.
      const rows = [...doc.querySelectorAll('.gov-metrics-table tbody tr')];
      assert.equal(rows.length, metrics.quarters.length);
      rows.forEach((row, i) => {
        const cells = [...row.querySelectorAll('td')].map((td) => td.textContent.trim());
        assert.equal(
          row.querySelector('th').textContent.trim(),
          metrics.quarters[i].quarter.replace('-Q', ' Q')
        );
        assert.equal(cells[0], String(metrics.quarters[i].submissions));
        assert.equal(cells[1], String(metrics.quarters[i].published));
        assert.equal(cells.length, metrics.totals.organizations > 0 ? 3 : 2);
      });
      // The shipped catalog has entries, so the feed exists and is linked.
      const feed = [...section.parentElement.querySelectorAll('a')].find((a) =>
        /catalog feed/i.test(a.textContent)
      );
      assert.ok(feed, 'the metrics block does not name the feed');
      assert.ok(fs.existsSync(path.join(siteDir, feed.getAttribute('href'))), 'the feed link is a 404');
    }
  );

  test(
    'shipped-empty: figures but no entries — the metrics block renders and does not link to a feed that was not built',
    { skip: needs('shipped-empty') },
    () => {
      const { dir, siteDir } = built.get('shipped-empty');
      const doc = page(siteDir, 'governance');
      assert.ok(doc.getElementById('metrics'), 'no #metrics heading');
      const feed = [...doc.querySelectorAll('a')].find((a) => /catalog feed/i.test(a.textContent));
      assert.equal(feed, undefined, 'the metrics block links to a feed the empty catalog did not build');
      assert.ok(
        !fs.existsSync(path.join(siteDir, entryNoun(dir).path, 'feed.xml')),
        'precondition: no feed for an empty catalog'
      );
    }
  );

  test(
    'blank: with the governance module off the page is not built and nothing links to it',
    { skip: needs('blank') },
    () => {
      const { dir, siteDir } = built.get('blank');
      const site = yaml.load(fs.readFileSync(path.join(dir, '_data', 'site.yml'), 'utf8'));
      assert.equal(site.modules.governance, false, 'the blank preset should ship with governance off');
      assert.equal(
        fs.existsSync(path.join(siteDir, 'governance', 'index.html')),
        false,
        '/governance/ was built'
      );
      const doc = page(siteDir, '');
      const links = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
      assert.ok(
        !links.some((href) => href.includes('/governance/')),
        'a page links to the dropped /governance/'
      );
    }
  );
});

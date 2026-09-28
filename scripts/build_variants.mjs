#!/usr/bin/env node
/**
 * Build the template in every configuration it ships, into scratch copies.
 *
 *   node scripts/build_variants.mjs                 build them all, report, exit 1 on failure
 *   node scripts/build_variants.mjs blank cohort-portal   just those
 *   node scripts/build_variants.mjs --keep          leave the scratch trees for inspection
 *
 * Why: `validate.yml` and `quality.yml` build exactly one configuration — the
 * shipped `ai-use-cases` one, with `events`, `cohorts` and `resources` off. So three of
 * the four presets have never been through Liquid at all, and six layouts and
 * includes are never rendered by anything in CI. Every schema-driven string
 * ("Submit {{ singular | with_article }}") is unverified outside the one noun
 * that happens to fit.
 *
 * Each variant is a full copy of the working tree with a preset's `_data`
 * overlaid, generated fixture entries in place of the shipped samples, and one
 * `jekyll build`. Assertions live in `test/build/*.test.mjs`, which drives this
 * module — building here and asserting there keeps one build per variant.
 *
 * Needs Ruby + `bundle install` and a built `assets/css/site.css`; that is why
 * it is `npm run test:build` and not part of `npm test`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

import * as yaml from 'js-yaml';

import { seedFixtureEntries } from './seed_fixture_entries.mjs';
import { copyTree, readYaml, removeEntries, run, writeYaml } from './lib/build-tree.mjs';
import { entryPathFrom, frontMatter, listSampleEntries, readSchema } from './lib/setup-io.mjs';

export const ROOT = process.env.BUILD_VARIANTS_ROOT
  ? path.resolve(process.env.BUILD_VARIANTS_ROOT)
  : process.cwd();

/**
 * The configurations CI has to keep green.
 *
 * `entries` decides what the catalog holds: `keep` leaves the shipped samples
 * (written against the shipped schema, so they fail every other preset's
 * validator — which is what `cohort-portal-keeps-samples` asserts), `fixtures`
 * replaces them with ones generated from the variant's own schema, and `none`
 * empties the catalog so the empty state renders.
 *
 * `demoMessage` writes `demo_message` into the copy's site.yml. `newestEntry`
 * edits the entry that sorts first (newest `published`): `stripMedia` drops its
 * pictures, so the catalog's first card has none, and `attachDeck` commits a
 * one-page PDF to its thumbnail `file` field with no thumb.jpg beside it.
 *
 * @type {{id: string, preset: string|null, modules: object|null, demo?: boolean, themeFonts?: object,
 *         githubBranch?: string, demoMessage?: string,
 *         newestEntry?: {stripMedia?: boolean, attachDeck?: boolean},
 *         legacyIssueChooser?: boolean,
 *         entries: 'keep'|'fixtures'|'none', build: boolean,
 *         expectFrontMatter: 'pass'|'fail', why: string}[]}
 */
export const VARIANTS = [
  {
    id: 'shipped',
    preset: null,
    modules: null,
    entries: 'keep',
    build: true,
    expectFrontMatter: 'pass',
    why: 'the configuration this repository ships and CI already builds',
  },
  {
    id: 'shipped-live-mode',
    preset: null,
    modules: null,
    demo: false,
    entries: 'keep',
    build: true,
    expectFrontMatter: 'pass',
    why: 'the shipped entries with demo mode disabled, proving real contacts and resources stay live',
  },
  {
    id: 'legacy-font-names',
    preset: null,
    modules: null,
    themeFonts: { heading: 'Source Serif 4', body: 'Source Sans 3' },
    entries: 'none',
    build: true,
    expectFrontMatter: 'pass',
    why: 'a protected pre-rename theme file must load the current derivative font binaries',
  },
  {
    id: 'legacy-issue-chooser',
    preset: null,
    modules: null,
    legacyIssueChooser: true,
    githubBranch: 'release/catalog-v2',
    entries: 'none',
    build: false,
    expectFrontMatter: 'pass',
    why: 'a protected pre-upgrade issue chooser must receive current safety routing during generation',
  },
  {
    id: 'all-modules',
    preset: null,
    modules: { events: true, cohorts: true, resources: true },
    demoMessage:
      'Entries here are provisional until the [review panel](https://example.org/review-panel) signs them off.',
    newestEntry: { stripMedia: true, attachDeck: true },
    entries: 'keep',
    build: true,
    expectFrontMatter: 'pass',
    why:
      'events, cohorts and resources are off in the shipped config, so their layouts never render in CI; ' +
      'it also carries a custom demo banner, a newest entry with no picture and an attached deck',
  },
  ...['ai-use-cases', 'cohort-portal', 'resource-library', 'blank'].map((preset) => ({
    id: preset,
    preset,
    modules: null,
    entries: 'fixtures',
    build: true,
    expectFrontMatter: 'pass',
    why: `the \`${preset}\` preset with a non-empty catalog`,
  })),
  {
    id: 'blank-empty',
    preset: 'blank',
    modules: null,
    entries: 'none',
    build: true,
    expectFrontMatter: 'pass',
    why: 'a fresh fork on day one: the empty state and the filter rail with nothing to filter',
  },
  {
    id: 'shipped-empty',
    preset: null,
    modules: null,
    entries: 'none',
    build: true,
    expectFrontMatter: 'pass',
    why: 'the shipped configuration with nothing published yet: the governance page carries figures but no feed to link to',
  },
  {
    // The wizard's sample-removal step is documented as the thing that keeps a
    // preset switch green; this asserts the failure it protects against is real.
    // `cohort-portal` rather than `blank`: blank's field set is permissive
    // enough that the shipped samples still validate against it.
    id: 'cohort-portal-keeps-samples',
    preset: 'cohort-portal',
    modules: null,
    entries: 'keep',
    build: false,
    expectFrontMatter: 'fail',
    why: 'switching preset without removing the samples must fail the validator, as documented',
  },
];

/* -------------------------------------------------------------------------- */

function timedRun(command, args, options) {
  const started = performance.now();
  const result = run(command, args, options);
  return { ...result, duration_ms: Math.round(performance.now() - started) };
}

/** Turn on/off modules in a scratch `_data/site.yml`. Comments are not preserved. */
function patchSite(file, { modules, demo, githubBranch, demoMessage }) {
  const site = readYaml(file);
  if (modules) site.modules = { ...(site.modules ?? {}), ...modules };
  if (typeof demo === 'boolean') site.demo = demo;
  if (githubBranch) site.github = { ...(site.github ?? {}), branch: githubBranch };
  if (demoMessage) site.demo_message = demoMessage;
  writeYaml(file, site);
}

/** The smallest file that starts with the `%PDF` signature and parses as one page. */
const ONE_PAGE_PDF =
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n' +
  'trailer<</Root 1 0 R>>\n%%EOF\n';

/**
 * Edit the scratch copy's newest entry — see {@link VARIANTS} (`newestEntry`).
 * Front matter is re-serialized, so its comments and key order are not kept.
 * @param {string} dir scratch copy root.
 * @param {{stripMedia?: boolean, attachDeck?: boolean}} options
 */
function patchNewestEntry(dir, { stripMedia, attachDeck }) {
  const schema = readSchema(dir);
  const entryPath = entryPathFrom(schema);
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const day = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? ''));
  const newest = fs
    .readdirSync(path.join(dir, entryPath), { withFileTypes: true })
    .filter((item) => item.isDirectory() && fs.existsSync(path.join(dir, entryPath, item.name, 'index.md')))
    .map((item) => {
      const file = path.join(dir, entryPath, item.name, 'index.md');
      return { slug: item.name, file, published: day(frontMatter(fs.readFileSync(file, 'utf8'))?.published) };
    })
    .sort((a, b) => b.published.localeCompare(a.published))[0];
  if (!newest) throw new Error(`newestEntry: ${entryPath}/ has no entries to patch`);

  const text = fs.readFileSync(newest.file, 'utf8');
  const end = text.indexOf('\n---', 4);
  // CORE_SCHEMA leaves `published: 2026-08-05` a string both ways, so it is
  // written back exactly as it was read rather than as a timestamp.
  const front = yaml.load(text.slice(4, end), { schema: yaml.CORE_SCHEMA });
  const body = text.slice(end + 4);
  if (stripMedia) {
    delete front.thumbnail;
    for (const field of fields)
      if (field.type === 'images' || field.type === 'image') delete front[field.key];
    fs.rmSync(path.join(path.dirname(newest.file), 'thumb.jpg'), { force: true });
  }
  if (attachDeck) {
    const deck = fields.find((field) => field.type === 'file' && field.thumbnail && field.filename);
    if (!deck)
      throw new Error('newestEntry.attachDeck: the schema has no `file` field with `thumbnail: true`');
    fs.writeFileSync(path.join(path.dirname(newest.file), deck.filename), ONE_PAGE_PDF);
    front[deck.key] = `/${entryPath}/${newest.slug}/${deck.filename}`;
  }
  fs.writeFileSync(
    newest.file,
    `---\n${yaml.dump(front, { schema: yaml.CORE_SCHEMA, lineWidth: -1 })}---${body}`
  );
}

/** Replace only the font-family values in a scratch `_data/theme.yml`. */
function patchThemeFonts(file, fonts) {
  const theme = readYaml(file);
  theme.fonts = { ...(theme.fonts ?? {}), ...fonts };
  writeYaml(file, theme);
}

/**
 * Prepare and build one variant.
 *
 * @param {object} variant one of {@link VARIANTS}.
 * @param {{scratchRoot: string, log?: (message: string) => void}} options
 * @returns {{variant: object, dir: string, siteDir: string|null, steps:
 *           {name: string, ok: boolean, output: string, duration_ms: number}[], ok: boolean}}
 *   `ok` is false when a step that was expected to pass did not.
 */
export function buildVariant(variant, { scratchRoot, log = () => {} }) {
  const dir = path.join(scratchRoot, variant.id);
  fs.rmSync(dir, { recursive: true, force: true });
  const steps = [];
  const step = (name, result) => {
    steps.push({ name, ok: result.ok, output: result.output ?? '', duration_ms: result.duration_ms ?? 0 });
    const elapsed = result.duration_ms === undefined ? '' : ` (${result.duration_ms}ms)`;
    log(`  ${result.ok ? 'ok  ' : 'FAIL'} ${variant.id} · ${name}${elapsed}`);
    return result.ok;
  };

  log(`\n${variant.id} — ${variant.why}`);
  copyTree(ROOT, dir);
  // Symlinked rather than copied: 79 MB per variant, and only the Node scripts
  // read it (`_config.yml` excludes it from the build).
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'));

  // `--out` writes the wizard's seven files into an existing tree and implies
  // `--yes`; it patches the copy's _config.yml rather than overwriting it, so
  // excludes, plugins and defaults survive. Run from ROOT: setup.mjs resolves
  // assets/js/configurator/core.js relative to the working directory.
  if (variant.preset) {
    const ok = step(
      `setup --preset ${variant.preset}`,
      timedRun(process.execPath, ['scripts/setup.mjs', '--preset', variant.preset, '--out', dir], {
        cwd: ROOT,
      })
    );
    if (!ok) return { variant, dir, siteDir: null, steps, ok: false };
  }

  if (variant.modules || typeof variant.demo === 'boolean' || variant.githubBranch || variant.demoMessage) {
    patchSite(path.join(dir, '_data', 'site.yml'), variant);
  }
  if (variant.newestEntry) patchNewestEntry(dir, variant.newestEntry);
  if (variant.themeFonts) {
    patchThemeFonts(path.join(dir, '_data', 'theme.yml'), variant.themeFonts);
  }
  if (variant.legacyIssueChooser) {
    fs.writeFileSync(
      path.join(dir, '.github', 'ISSUE_TEMPLATE', 'config.yml'),
      'blank_issues_enabled: true\ncontact_links: []\n',
      'utf8'
    );
  }

  if (variant.entries !== 'keep') {
    removeEntries(dir);
    if (variant.entries === 'fixtures') seedFixtureEntries(dir, { count: 3 });
  }

  // The issue template and the wizard defaults are derived from _data; a
  // variant that skipped this would be testing a tree CI would reject.
  step('generate', timedRun(process.execPath, [path.join(dir, 'scripts', 'generate.mjs')], { cwd: dir }));

  const frontMatter = timedRun('ruby', [path.join('scripts', 'check_front_matter.rb')], { cwd: dir });
  const frontMatterAsExpected = variant.expectFrontMatter === 'fail' ? !frontMatter.ok : frontMatter.ok;
  step(`check_front_matter (expected to ${variant.expectFrontMatter})`, {
    ok: frontMatterAsExpected,
    output: frontMatter.output,
    duration_ms: frontMatter.duration_ms,
  });

  let siteDir = null;
  if (variant.build) {
    siteDir = path.join(dir, '_site');
    step(
      'jekyll build',
      timedRun(
        'bundle',
        ['exec', 'jekyll', 'build', '--destination', siteDir, '--strict_front_matter', '--quiet'],
        {
          cwd: dir,
          env: { ...process.env, JEKYLL_ENV: 'production', BUNDLE_GEMFILE: path.join(dir, 'Gemfile') },
        }
      )
    );
  }

  return { variant, dir, siteDir, steps, ok: steps.every((s) => s.ok) };
}

/**
 * Build every variant (or the ids given) into a fresh scratch root.
 * @param {{ids?: string[], scratchRoot?: string, log?: (message: string) => void}} [options]
 * @returns {ReturnType<typeof buildVariant>[]}
 */
export function buildVariants({ ids = [], scratchRoot, log = () => {} } = {}) {
  const root = scratchRoot ?? fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-variants-'));
  const wanted = ids.length ? VARIANTS.filter((v) => ids.includes(v.id)) : VARIANTS;
  return wanted.map((variant) => buildVariant(variant, { scratchRoot: root, log }));
}

/** Preconditions a variant build needs, as `{ok, reason}`. */
export function preflight() {
  if (!fs.existsSync(path.join(ROOT, 'assets', 'css', 'site.css'))) {
    return { ok: false, reason: 'assets/css/site.css is missing — run `npm run build:css` first.' };
  }
  if (!run('bundle', ['--version']).ok) {
    return { ok: false, reason: 'bundler is not on PATH — install Ruby 3.3+ and run `bundle install`.' };
  }
  // The `keep` variants build the shipped samples and the assertions read the
  // template's own governance page, cohort and metrics off them. Once a copy
  // has ejected that content the matrix is checking a catalog that no longer
  // exists, so it steps aside instead of failing every pull request in a fork.
  if (listSampleEntries(ROOT, entryPathFrom(readSchema(ROOT))).length === 0) {
    return {
      ok: false,
      reason:
        'the shipped sample entries have been removed — the preset build matrix checks the template’s own presets and samples, so it does not apply to this repository.',
    };
  }
  return { ok: true, reason: '' };
}

/* -------------------------------------------------------------------------- */

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const argv = process.argv.slice(2);
  const keep = argv.includes('--keep');
  const ids = argv.filter((arg) => !arg.startsWith('--'));

  const ready = preflight();
  if (!ready.ok) {
    console.error(`SKIP  ${ready.reason}`);
    process.exit(1);
  }

  const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-variants-'));
  const results = buildVariants({ ids, scratchRoot, log: (message) => console.log(message) });

  console.log('');
  for (const result of results.filter((r) => !r.ok)) {
    for (const failed of result.steps.filter((s) => !s.ok)) {
      console.error(`\n--- ${result.variant.id} · ${failed.name} ---\n${failed.output.trim()}`);
    }
  }
  const failures = results.filter((r) => !r.ok).length;
  console.log(
    keep
      ? `\nScratch trees kept in ${scratchRoot}`
      : `\n${results.length - failures}/${results.length} variants built.`
  );
  if (!keep) fs.rmSync(scratchRoot, { recursive: true, force: true });
  process.exit(failures === 0 ? 0 : 1);
}

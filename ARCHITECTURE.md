# Architecture

How the template is put together, and why. Read this before changing anything structural;
`docs/index.md` routes to the rest, and `docs/decisions.md` records the choices this file assumes.

## In one paragraph

A static Jekyll site on GitHub Pages, with GitHub itself as the CMS. Everything that varies between
deployments lives in `_data/*.yml`; templates, scripts and workflows read those files instead of
carrying site-specific knowledge. Members submit entries through a web form that opens a prefilled
GitHub issue; a workflow turns the issue into a pull request; maintainers merge; Pages rebuilds.
There is no server, no database and no build step a maintainer has to run by hand.

```
  browser ─▶ /submit/ form ─▶ prefilled GitHub issue ─▶ new-entry.yml workflow
                                                              │  scripts/new_entry_from_issue.mjs
                                                              ▼
                                            catalog/<slug>/index.md (+ screenshots/)  in a PR
                                                              │  validate.yml · quality.yml
                                                              ▼
                                                   merge ─▶ pages.yml ─▶ GitHub Pages
```

## Layers

| Layer | Where | Owns |
|---|---|---|
| **Configuration** | `_data/site.yml`, `_data/theme.yml`, `_data/schema.yml`, `_data/navigation.yml` | Branding, module toggles, copy; colours/fonts/radius; the entry content model; header links. The only files a deployment is expected to edit. |
| **Structural data** | `_data/modules.yml` | Path prefixes each togglable module owns; read by `_plugins/modules.rb` to drop a disabled module's pages from the build. Not a deployment-facing toggle — see `_data/site.yml`'s `modules:` map for that. |
| **Feature data** | `_data/events.yml`, `_data/cohorts/<year>.yml`, `_data/resources.yml`, `_data/governance.yml` | Content for the optional `events`, `cohorts`, `resources` and `governance` modules. |
| **Search tuning** | `_data/search.yml` | Synonyms, per-option search aliases, and the bounds on the generated facet landing pages. Optional — see `docs/search.md`. |
| **Content** | `catalog/<slug>/index.md` (+ `screenshots/`, `thumb.jpg`, `deck.pdf`) | One folder per entry; front matter keys are schema field keys. |
| **Templates** | `_layouts/`, `_includes/` | Liquid that renders whatever the schema declares. Never names a field key. |
| **Build plugins** | `_plugins/*.rb` | Small Jekyll hooks/filters that keep the templates schema-agnostic (see below). |
| **Styling** | `assets/css/tailwind.css` → `components/*.css` → `assets/css/site.css` (built) | Tailwind 3.4 (kept there deliberately for browser reach — see "Browser support" in `docs/design-system.md`) with one component file per surface; tokens come from `theme.yml` as CSS variables. |
| **Behaviour** | `assets/js/*.js` | Small vanilla-JS IIFEs, one per concern, progressively enhancing server-rendered HTML. |
| **Automation** | `scripts/*.mjs`, `scripts/*.rb`, `.github/workflows/*.yml` | Issue → PR scaffolding, validation, thumbnails, generation of derived files. |
| **Configurators** | `assets/js/configurator/` (shared core), `setup/` (browser), `scripts/setup.mjs` (CLI) | Produce the four `_data` files + `_config.yml` + issue template from a handful of answers or a preset. |

### Configuration is the source of truth

`_data/schema.yml` describes every entry field: type, label, prompt, options, `required`, and
presentation hints (`facet`, `card`, `search`, `weight`, `icon`, `group`,
`option_meta`). Everything downstream iterates `schema.fields` (or `schema.groups`):

- `_layouts/entry.html`, `_includes/entry-card.html`, `_includes/fact-strip.html`, `_includes/gallery.html`,
  `_includes/reuse-card.html`, `_includes/facet-filters.html` and friends — rendering.
- `_plugins/search_index.rb` — which fields feed `/search.json`.
- `_plugins/facet_pages.rb` — which facet fields get their own crawlable page.
- `submit/index.md` + `assets/js/submit/*` — the form, validation and live card preview.
- `scripts/new_entry_from_issue.mjs` — issue body → front matter.
- `scripts/check_front_matter.rb` — CI validation of every entry, and of the schema's own
  `escalate_on` lists.
- `scripts/lib/review.mjs` — what the scaffolded pull request tells its reviewer: which answers
  the schema escalates, and the checklist (criteria from `_data/governance.yml`).
- `scripts/generate.mjs` — regenerates `.github/ISSUE_TEMPLATE/new-entry.yml`, syncs `_config.yml`
  title/description, and builds `assets/js/configurator/defaults.generated.js`. Run it after every
  schema edit; `node scripts/generate.mjs --check` fails CI when the committed outputs are stale.

The rule of thumb: if you find yourself typing a field key into a template or script, stop and add
a hint to the schema instead. `docs/content-model.md` documents each hint's exact meaning.

### Plugins (`_plugins/`)

| File | What it does |
|---|---|
| `schema_filters.rb` | Liquid filters that answer schema questions so templates stay declarative: `sort_by_weight`, `facet_fields`, `form_fields`, `fields_in_group`, `groups_for`, `groups_placed`, `card_slot`, `card_fields`, `option_meta`, `option_short`, `as_list`, `image_item`, `first_image`. |
| `theme_filters.rb` | Presentation helpers: `hex_to_rgb`, `facet_values`, `slugify_list`, `link_host`, `http_url`, `link_access`, `query_encode`. |
| `link_access.rb` | Plain-Ruby matcher behind the `link_access` filter: resolves a URL against `_data/site.yml`'s optional `link_access` host rules and levels. `scripts/lib/link_access_check.rb` validates with the same module, so the page and `npm run validate` agree. Registers nothing with Jekyll. |
| `search_index.rb` | Generates `/search.json` from fields marked `search`/`facet` (plus a slice of the write-up) and the synonym map from `_data/search.yml`, consumed by `assets/js/search.js` (Lunr). |
| `facet_pages.rb` | Generates the crawlable browse surface from the same facet fields: one page per facet value at `/<entry.path>/<field>/<value>/` plus the A–Z directory, bounded by `_data/search.yml`'s `landing` block. See `docs/search.md`. |
| `modules.rb` | At `post_read`, drops every page under a disabled module's path (from `_data/modules.yml`, `catalog` derived from the schema's `entry.path`) so it is never built, indexed or listed in the sitemap. |
| `events.rb` | Merges `_data/events.yml` with per-cohort events into `site.data.events_all` for the events/cohort layouts. |
| `showcase.rb` | Only active in a showcase landing build (`site.config["showcase"].role == 'landing'`): at `post_read` it reduces the build to `/`, `/setup/` and `/404.html`, so the landing does not ship a second copy of the catalog above the examples. |

All plugins are pure Ruby with no gems beyond Jekyll; GitHub Pages builds them because `pages.yml`
runs Jekyll in Actions (not the legacy Pages builder, which disallows plugins).

### Templates and their contracts

- `_layouts/default.html` — shell (head, header, footer, skip link). Accepts a `scripts:` list in
  page or layout front matter and emits deferred `<script>` tags for each.
- `_layouts/catalog.html` + `index.md`-style pages — filter rail (`filter-rail.html`), results header,
  mobile filter sheet, `<ul data-entry-grid>` of `entry-card.html`. Cards carry `data-facet-*` and
  `data-sort-*` attributes; `assets/js/filters.js` filters/sorts them in place from URL state and
  `search.js` narrows further via `window.__searchMatches` (see the header comment in each file).
- `_layouts/entry.html` — header, fact strip, gallery, main sections (`schema.groups` with
  `placement: main`), sticky rail (`placement: rail` groups via `reuse-card.html`), TOC, related rows.
- `submit/index.md` — one sectioned page that scripts turn into steps (one per schema group, plus
  a required-only "short form" toggle); `assets/js/submit.js` orchestrates `submit/{fields,validate,
  repeatable,preview,draft,handoff,review,steps,shortform}.js` and hands off to a prefilled
  `new-entry.yml` issue. Without JavaScript it stays one long page.

Two Liquid gotchas govern the include style (details in `CLAUDE.md`): assigns inside an include
leak into the caller, so every include prefixes its variables (`ec_`, `fv_`, `gal_` …); and include
parameters cannot use bracket access, so lookups are assigned to a variable first.

### Automation

Each workflow in `.github/workflows/` pairs with one script and passes the issue through
`ISSUE_BODY` / `ISSUE_TITLE` environment variables — the scripts make no GitHub API calls, so they
run identically in tests.

| Workflow | Trigger | Script | Result |
|---|---|---|---|
| `new-entry.yml` | issue labelled `content:new-entry` | `scripts/new_entry_from_issue.mjs` (+ `lib/issue_body`, `lib/images`, `lib/yaml`, `lib/review` for the checklist and `escalate_on`) | PR adding `catalog/<slug>/` with downloaded screenshots, the maintainer checklist and `review:*` labels |
| `thumbnails.yml` | PR touching `catalog/**` | `scripts/thumbnail_sources.mjs` + `pdftoppm` | commits `thumb.jpg` from `deck.pdf` |
| `new-event.yml`, `new-year.yml`, `update-schedule.yml`, `update-event-attachments.yml` | issue templates for the events/cohorts modules | matching `scripts/*` | PRs against `_data/` |
| `refresh-entry.yml` | issue labelled `content:refresh` | `scripts/refresh_entry_from_issue.mjs` | "still accurate" → PR stamping the entry's `verified:` date; "needs updates" → the reported changes are labelled `review:refresh-changes` for the maintainer queue |
| `also-deployed-by.yml` | issue labelled `content:also-deployed-by` | `scripts/add_deployment_from_issue.mjs` | PR appending an organization to the entry's `entry.deployments_key` list |
| `validate.yml` | PR / push | `generate.mjs --check`, `npm test`, `npm run coverage`, `npm run test:ruby`, `npm run validate`, CSS + Jekyll build | the merge gate; coverage evidence is retained as an artifact even when its reviewed floors fail |
| `performance.yml` | PR / push to main / aggregate dispatch | `performance_fixture.mjs` + `interaction_performance.mjs` | deterministic 0–1,000-entry build/payload evidence plus blocking 100-entry filter/search p95 in low-end-mobile Chrome |
| `quality.yml` | PR / push to main | `pa11y-ci` (WCAG 2 AA), keyboard flows, and blocking desktop/mobile Lighthouse budgets over `_site` | browser accessibility and performance gate |
| `pages.yml` | push to main | `scripts/stamp_updated.mjs` (stamps `updated:` on modified entries, commits back), then CSS build + Jekyll build with the repo-derived `baseurl` — or `scripts/build_showcase.mjs` when this deployment is the showcase (see below) | deploys to GitHub Pages, tells the submitter |
| `smoke.yml` | weekly | full build | catches upstream breakage |
| `metrics.yml` | monthly (2nd) / manual | `scripts/metrics.mjs` — two read-only REST calls (issues by label, closed PRs by branch prefix) plus the entries' `entry.contributor_key` values, four calendar quarters | commits `_data/metrics.json` when the figures changed, dispatches `pages.yml`; the governance page renders it as "How the catalog is doing" |
| `bootstrap-labels.yml` | manual | — | creates the labels the automation relies on |

`scripts/setup.mjs` and `setup/` share `assets/js/configurator/core.js`; `renderFiles()` is the single
place that turns answers into files, so both configurators cannot drift. Browser-only helpers sit
beside it — `dom.js` (element builder), `theme-preview.js` (the Branding step's live miniature,
which re-declares the same CSS variables `_includes/theme.html` writes) — and are not imported by
the CLI.

### The showcase (the template's own deployment)

`scripts/build_showcase.mjs` builds this repository several times into one tree: once per wizard
preset as a complete example site at `/examples/<preset-id>/`, and once as the landing page at the
root that introduces them. Each example is a scratch copy of the repository run through
`scripts/setup.mjs --preset <id>` — the same code path `/setup/` and the CLI wizard use — with the
sample content in `_showcase/<preset-id>/` copied over it, so an example cannot drift from what
choosing that preset actually produces. `scripts/lib/build-tree.mjs` makes those copies.

The builder writes each build a `_config.showcase.yml` carrying `showcase.role`
(`landing`/`example`), the example's id and the list of all of them. Three things read it:
`_plugins/showcase.rb` (above), `_includes/demo-banner.html` — which on an example becomes the
switcher for moving between them, `assets/js/example-switcher.js` — and `index.md`, which renders
`_includes/showcase-landing.html` from `_data/showcase.yml` instead of the home page. The
per-example facts on the landing's cards come from `_data/showcase_presets.json`, generated from
`assets/js/configurator/presets.js` at build time.

`pages.yml` runs it only when the repository variable `CATALOG_SHOWCASE` is `true` and `demo` is
still `true` (opt-in, so a copy of the template never builds it); every fork deploys the ordinary single build, and `npm run eject:samples` deletes the
showcase's content outright. `test/build/showcase.test.mjs` covers the builder's pure functions
(the config override, the flagship rule, the site patches); `docs/showcase-plan.md` records why it
is built this way.

### Styling

Tokens (`theme.yml` colours, fonts, type, radius, motion) become CSS variables in
`_includes/theme.html`; `tailwind.config.js` maps them to `brand-*` / `surface-*` colours,
`rounded-hairline/control/card/sheet/pill` and `duration-fast/base/slow` so components use semantic
names, never hex or literals. Component classes live in `assets/css/components/<surface>.css` and are
`@apply` compositions. There is no `safelist`: a badge's tone is `data-tone`, not part of its class
name, so nothing is composed at render time for the scanner to miss.
`assets/css/site.css` is build output (`npm run build:css`) and is not committed.
Fonts are self-hosted variable woff2 subsets (`assets/fonts/README.md`). Copied JavaScript,
generated icons, and fonts are pinned by digest in `quality/vendored-assets.json`; their complete
provenance and license terms live in `THIRD_PARTY_NOTICES.md` and fail closed under `npm run
licenses:check`.

### Testing

- `npm test` — Node's built-in runner over `test/**/*.test.mjs`: configurator modules, issue-body
  parsing, image download rules, YAML emission, and jsdom tests of the submit form.
- `npm run coverage` — the pinned runtimes' built-in coverage over the complete Node and Ruby
  suites, plus focused Node security-parser and parent-updater groups. `scripts/coverage.mjs` and
  `scripts/ruby_coverage.rb` record line, branch, and function/method evidence under `coverage/`
  and enforce conservative regression floors. Reports explicitly say they cover production files
  loaded by the suites; the numbers do not replace adversarial or end-to-end tests.
- `npm run test:ruby` — minitest for `scripts/check_front_matter.rb`.
- `npm run validate` — parses every `_data/*.yml`, then runs the front-matter and file-size checks.
- `npm run a11y` / `npm run lighthouse` — the same audits `quality.yml` runs, against a local server
  on port 4173 (see `CONTRIBUTING.md`).
- `npm run test:flows` — `test/a11y/flows.test.mjs`, keyboard-only walkthroughs in a real browser
  against that same server. Skipped by a bare `node --test` (RUN_FLOW_TESTS), and the third audit
  lane in `quality.yml`: it catches what a per-page audit cannot, the seams between pages and
  states (focus order, focus rings, live-region announcements, dead ends).

## Design principles

1. **Configuration over code.** A deployment should never need to touch a template.
2. **Static and dependency-light.** No framework, no bundler; each JS file is one readable IIFE.
   Anything heavier than that has to justify itself against "a health department maintains this."
3. **Progressive enhancement.** Every page is complete server-rendered HTML; JS adds filtering,
   search, previews and drafts on top.
4. **Accessible by construction.** WCAG 2.2 AA is a checklist in `docs/design-brief.md` and a CI
   gate in `quality.yml`, not an afterthought.
5. **GitHub is the workflow.** Review, history, permissions and rollback all come from git.

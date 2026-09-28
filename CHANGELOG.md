# Changelog

All notable changes to this template are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/): a change to the content model
(`_data/schema.yml`) that existing entries or presets would have to follow is a
major version, and each entry says so when it happens.

## [Unreleased]

## [1.10.0-rc.2] — 2026-09-28

Second candidate. rc.1's live BCHC update stopped before opening a pull request
because one build test assumed the deployment's content, not the template's.

### Fixed

- The build test for the catalog's eager-loaded card image assumed a picture in
  the first row. The updater runs the suite on a deployment's own entries, and
  a catalog whose three newest entries have no picture failed the update even
  though the page did exactly what the layout intends (nothing above the fold to
  eager-load). The test now expects no eager image in that case, and checks that
  the eager image is the first row's first picture otherwise.

## [1.10.0-rc.1] — 2026-09-28

**Upgrading a deployment.** Everything new is opt-in and renders identically
when unset: no `link_access` block in `_data/site.yml` means no labels and no
new validation, and a blank `demo_message` keeps the default demo banner. One
page needs a hand edit to show the labels: `resources/**` is deployment-owned
(`merge=ours`), so the update leaves your `resources/index.md` alone, and its
old per-item `<li>` markup never shows them. Replace that markup with
`{% include resource-item.html item=item %}` inside the `group.items` loop, as
the template's own `resources/index.md` now does; with no `link_access` block
the include renders the same row as before. The `ai-use-cases` heading rename
and the commented `require_public_link`, `demo_message` and `link_access`
examples live in `_data/schema.yml` and `_data/site.yml`, which are yours: copy
them by hand if you want them.

### Added

- Link access labels. An optional `link_access` block in `_data/site.yml`
  names access levels (label, icon, screen-reader note, request-access link)
  and host rules (a host plus an optional path prefix, first match wins). A
  link on a matching host shows the rule's name, the level's chip, and the
  note as screen-reader text. A links item can override its host rule with
  `access: <level>`. The labels appear on entry links, `url` fields, the reuse
  card, event attachments, cohort materials and resources. `npm run validate`
  checks the block, fails an `access:` that names no configured level (a site
  without the block is not checked), and warns when
  every link on an entry needs a sign-in; `entry.require_public_link: true`
  makes that a failure. A site without the block renders byte for byte as
  before.
- A `file` field may hold an `http(s)` URL: the entry page renders an outbound
  row instead of a download. The scaffolder stores a pasted non-GitHub link
  without downloading it, and keeps the URL when a download is refused. The
  upload control tells submitters to paste big or workspace-hosted files as a
  link.
- `docs/admin-guide.md` "Large files": keep big public files in one long-lived
  GitHub Release and link them, and why Git LFS does not work on Pages. The
  50 MB file-size failure now points there.
- An optional `demo_message` in `_data/site.yml` replaces the demo banner's
  sentence (and its setup and launch-guide links) with your own inline
  markdown, for a deployment that keeps `demo: true` while its content is
  provisional. Unset, the banner renders exactly as before.

### Changed

- The `ai-use-cases` body placeholder's cost heading is now "Time and
  resources", so an entry written from it no longer has two "What it took"
  headings (its own and the field group's). The generated issue form and setup
  defaults are regenerated; existing entries are untouched.

### Fixed

- The event-attachments form rejects a URL that is not `http(s)` (such as a
  `javascript:` link or a relative path) instead of writing it to the schedule.
- Search: pressing Escape while a query was still debouncing closed the list,
  then the pending search reopened it. Escape now cancels the pending run and
  answers the query with the list kept closed.
- A long list value on the entry page wraps inside its chip instead of pushing
  a 320px page sideways.
- Focus rings clear 3:1 everywhere. The header brand, the mobile menu button,
  the desktop nav and the gallery file cards drew a translucent `primary/30`
  ring (about 1.7:1); they now use the site-wide solid ring. On the footer and
  the hero's links the ring turns `on_dark` over a `primary_dark` gap: a
  `primary` ring there was 1.6:1 in the default theme and 2.7:1 in a red on
  near-black one.
- The site name wraps to two lines in the header on a phone instead of being
  cut off with an ellipsis.
- The catalog, facet pages and the home page's recent grid eager-load the first
  card in the first row that has a picture, not just the first card, so the
  largest image is no longer lazy-loaded when the newest entry has none.
- Each row of the entry fact strip now spans the strip, so its dividers run
  edge to edge instead of stopping where each fact's text did.
- On a short entry the rail's extra height no longer opens empty bands below
  the header and above the body (about 110px each, where 32px was intended).
- File labels keep a leading acronym: "Download slide deck or one-pager (PDF)",
  not "(pdf)". A new `downcase_first` filter lower-cases only the first letter,
  and leaves a label that starts with an acronym alone.
- The thumbnail workflow re-renders `thumb.jpg` when its PDF is replaced.
  Freshness is now read from git history (the PDF's last commit must be the
  thumbnail's or an ancestor of it), because a checkout's modification times
  kept the old thumbnail. Fork pull requests are still skipped.

### Docs

- The BCHC reference deployment's transfer and rename are recorded: it now
  lives at `Big-Cities-Health-Coalition/use-case-catalog`, and present-tense
  references (`docs/ecosystem.md`, the README, the maintainer and release
  docs) point there. Historical records keep their old links, which GitHub
  redirects.

### Security

- `sharp` 0.35.3 → 0.35.4 clears advisory GHSA-rgj7-g3m4-5g8c, which failed
  `npm run security:audit`. It arrived with the rest of the npm dev-dependency
  group (eslint, jsdom, postcss-cli 12, prettier and others), alongside the
  GitHub Actions group (CodeQL, `ruby/setup-ruby`, `actions/deploy-pages`) and
  `sass-embedded` 1.105.0. No template behaviour change.

## [1.9.0] — 2026-08-29

Stable release. Records-only promotion of the accepted `v1.9.0-rc.7`
candidate: no template behaviour changes since rc.7 — the release line's
features and fixes are recorded in the rc.1–rc.7 sections below.

## [1.9.0-rc.7] — 2026-08-28

### Fixed

- The refresh-reminder guidance now names the deployment's actual verified-date
  field: the workflow reads the schema's `entry.verified_key` from the script
  instead of assuming a field literally named `verified`, so a catalog that
  renamed the field is told to stamp the right key.
- The verification sweep hands its drafted issue bodies to the follow-up step
  through a file under the runner's temp directory instead of a step output, so
  a sweep that drafts many reminders in one run can no longer hit the runner's
  per-environment-entry size cap; `count`, `slugs` and `max_new` remain
  ordinary outputs.

## [1.9.0-rc.6] — 2026-08-27

### Added

- Stale entries now ask to be refreshed. The monthly verification sweep opens
  one issue per entry past the `catalog.verify_after_days` window, @mentioning
  the submitter — a new optional *Your GitHub username* form field, stored
  under the schema's `entry.submitter_key` — plus everyone named in
  `catalog.refresh_mentions`, opening at most `catalog.refresh_max_new_issues`
  new issues per run (20 by default). The issue's two one-click answers open
  the new **Refresh an entry** form: "still accurate" becomes a one-line pull
  request stamping `verified: <today>`; "something changed" queues the notes
  for a maintainer under the `review:refresh-changes` label. The staleness
  notice on the entry page gained a **Still accurate? Confirm it** link, and a
  reminder closes itself once its entry is confirmed by any route.
- Organizations that deployed an entry's solution can attach themselves to it.
  The **Also deployed by** form collects organization, link, and an optional
  contact address and note; a bot pull request splices the item into the
  entry's `also_deployed_by` list (`links` items may now carry `email` and
  `note` keys, honored everywhere links render). A resubmission matching an
  existing row by organization or link updates it in place — and the pull
  request says it is a replacement, with a checklist line asking the reviewer
  to confirm the submitter represents that organization.
- Security signals, observed rather than asserted. A monthly sweep reads each
  entry's linked GitHub repository — existence, archive state, last push,
  license, security policy, OpenSSF Scorecard — into the deployment-owned
  `_data/security_signals.json` (256 KiB cap, `SECURITY_SIGNALS` kill switch),
  rendered as a rail card on the entry page beside the new maintainer-only
  `security_review` status field, under a standing disclaimer: the catalog
  links to code, it does not vouch for it.
- Search understands more than the reader's exact words. The build derives a
  concept map from the catalog itself — which words keep turning up in the same
  entries without being common everywhere — and the search box quietly widens
  each query with the top related words. A concept hit always ranks strictly
  below every hit the reader's own words found, in the list and in the listbox,
  and the withheld-results button says "related to" instead of "that mention"
  when concept hits sit behind it. Derivation is deterministic, tuned by a new
  `concepts:` block in `_data/search.yml`, and stays off below 12 entries,
  where corpus statistics are noise, not signal.
- Structured field values are searchable as words: a `links` field's labels and
  an `images` field's alt text now reach the index, so an entry can be found by
  the name of a resource it links to. Real addresses (`https://`, `mailto:`,
  `tel:`, and bare emails) stay out; prose that happens to carry a colon stays
  in.
- **Also deployed by** listings are searchable: an entry can now be found by
  the name of an organization running it, while each deployment's link and
  contact address stay out of the index.
- "Search at a thousand entries" is a measured budget, not a hope. The
  performance fixture now builds catalogs at 0/1/10/100/500/1000 entries, a
  real browser drives search, filtering and compare at every size named in
  `interaction_entries`, and `quality/performance-budgets.json` carries each
  size's `scale_budgets`. The measured table lives in `docs/search.md`; the
  query itself stays at 3–9 ms even at 1,000 entries — what grows is the grid
  render, which is the number the budgets watch.
- The cost of building search moved off the reader's path. Where the browser
  has workers, the fetch, the parse and the whole lunr build run in
  `assets/js/search-worker.js` while the page stays responsive, and the page
  revives the result with `lunr.Index.load` — a fraction of the build. A
  finished build is kept in IndexedDB, keyed to a content hash the plugin now
  stamps into the payload (`generated_at` excluded, so a redeploy that changes
  nothing keeps the cache warm): a return visit to an unchanged catalog
  searches instantly, with no download and no build. Any worker or cache
  failure falls back silently to the original inline path.
- A low-powered device facing a large catalog is asked, not stalled. At 300+
  entries on a device reporting few cores or little memory, the automatic
  index load is replaced by a **Load full search** button that narrates real
  progress — bytes downloaded, then the build — while typing keeps offering
  the tag and filter suggestions that never needed an index. Off-screen entry
  cards also stopped costing anything: `content-visibility: auto` lets the
  browser skip layout and paint for the cards outside the viewport, which at a
  thousand entries is most of the grid.
- `/about/search/`: a public "How search works" page telling the reader what
  the architecture means for them — no query log by design, nothing typed ever
  leaves the device — and how the serverless engineering above holds up as the
  catalog grows. Linked from the About page; shipped only while the catalog
  module is on.

All of it is additive — the new schema fields are optional, and no existing
entry or preset has to change.

### Changed

- The verification sweep opens one issue per stale entry instead of one rolling
  monthly issue, so every reminder has an owner, a thread, and an ending. A
  live deployment upgrading to this release should close its old
  "Verification sweep — YYYY-MM" issue by hand once — the new sweep does not
  know it exists.

## [1.9.0-rc.5] — 2026-08-26

### Added

- A full visual pass over every surface (#34, #35, #37). Illustration slots —
  hero, social link-preview card, submit form and its paused state, about, events,
  resources, governance, cohort journey, four empty states, the 404 page, the wizard's
  success moment, and an optional background texture — are now available as `_data/*.yml`
  keys for a deployment to fill with its own artwork (`npm run images` builds AVIF/WebP
  derivatives). The keys ship blank apart from the subtle background texture: every
  surface renders a polished flat treatment out of the box. The submit progress rail
  and the setup wizard's step pills became real steppers, review and confirmation
  panels gained hierarchy and a drawn-check success moment, and
  `submit.accepting: false` can pause intake without removing the page.
- `AGENTS.md`: a setup runbook for AI coding agents handed a copy of this template —
  what to ask before configuring, which files the copy owns versus the template, the
  configure → generate → validate loop, and the GitHub settings only a human can click.
- The accessibility gate now also audits `/compare/`, the A–Z directory and the 404
  page on every pull request.

### Fixed

- Past event rows kept WCAG AA text contrast (they now recede via grayscale, which
  preserves luminance, instead of opacity, which does not), and the cohort hero's
  breadcrumb separators no longer sat at 2.2:1 on the dark ground.
- Three grid layouts (resource groups, the cohort sidebar, materials lists) no longer
  overflow narrow phones: their truncated rows could force the grid wider than the
  320–414px viewports.
- The showcase example switcher's open menu no longer slides underneath the sticky
  site header — the popover moved to the overlay layer the filter sheet already uses.

## [1.9.0-rc.4] — 2026-08-25

### Added

- A new `missing-label` workflow explains the quietest failure a fresh copy has: an issue-form
  submission whose `content:*` label was silently dropped because **Bootstrap labels** never ran.
  It matches only form-shaped issue bodies, so hand-written issues are never falsely flagged.
- Schedule updates now preview the parsed event IDs on the issue and warn how many stored events
  the list will replace before anything merges; the preview edits itself in place instead of
  stacking duplicate comments.

### Fixed

- No issue-form flow goes silent any more: every content workflow (new entry, new event, new
  cohort year, schedule, attachments, apply-setup) answers the issue on every exit — script
  rejections in plain English, a catch-all with the exact **Workflow permissions** click-path
  when the pull request itself is refused, dedicated replies for already-exists, nothing-changed
  and submissions-closed, and "Updated the pull request from your edit" instead of a repeated
  first-time comment when an issue is edited.
- The downstream updater writes a step summary for every way a run can end, and "already up to
  date" is now a reachable green no-op: re-recording an unchanged release preserves the version
  lock's original `recorded_at`, so a re-run leaves the tree byte-identical. The tag gate is a
  whole-string match, closing a `GITHUB_OUTPUT` injection window for multi-line values.
- Scheduled workflows (metrics, verification sweep, Pages stamp, thumbnails) explain themselves
  when their module is off and post what-to-do summaries on failure; the sweep issue caps its
  listing at 150 links and the sweep can be run manually.
- The setup wizard derives the repository from the `*.github.io` address it is served on and
  refuses — case-insensitively, and only on a positively detected copy — a configuration that
  still points at the template repository. The fork-identity CI message now leads with the
  browser path and says a red first pull request is normal. The submit form's too-long fallback
  links the issue form itself instead of a blank issue no workflow would pick up.
- The metrics failure summary flattens and truncates the HTTP error it quotes, and the
  attachments updater reads the event page directly instead of checking existence first.

### Changed

- `docs/launch.md` is the single settings walkthrough (a repository-settings table, Dependabot
  red-until-configured note, fork Issues/Actions defaults, ownership-file replacement);
  `docs/admin-guide.md` gains bot-pull-request and scheduled-workflow troubleshooting sections;
  the repository transfer procedure in `docs/maintaining.md` is a numbered checklist.

## [1.9.0-rc.3] — 2026-08-24

### Added

- The submission form now walks one schema group at a time: Next validates the step it leaves,
  Back and completed rail sections move freely, and the section heading takes focus on every move
  so screen readers hear where they landed. A "Hide the optional questions" toggle trims the form
  to required fields only — answered optional questions stay visible, all-optional sections are
  skipped and dimmed on the rail — and the saved draft remembers both the step and the toggle, so
  reopening the page resumes exactly where the submitter left off. A single-group schema and the
  no-JavaScript fallback keep the flat one-page form.
- `THIRD_PARTY_NOTICES.md` now records the version, provenance, modification history, copyright,
  and complete license text for every copied JavaScript, generated icon, and bundled font asset.
  `quality/vendored-assets.json` pins those files by SHA-256, and the license gate fails closed on
  missing attribution, unsafe or duplicate paths, changed bytes, an unreviewed license, or a new
  bundled font/minified script omitted from the manifest.
- The issue chooser now routes documentation corrections through a structured form and security
  vulnerabilities directly to GitHub's private advisory form; unstructured public issues are
  disabled, the chooser links durable fallback instructions, launch guidance covers enabling the
  private route, and the label-bootstrap workflow creates the documentation label.

### Fixed

- The modified Adobe font subsets now use the distinct embedded and public family names PHCT Sans
  and PHCT Serif, retain upstream copyright and license metadata, and accept the legacy Source
  family values in protected downstream themes. This satisfies the upstream Reserved Font Name
  condition without changing an existing deployment's rendered typography.
- Accepting the terminal setup wizard's defaults now preserves the bundled serif heading instead
  of silently switching it to Inter; browser and terminal setup share the corrected font names.
- Shared mobile actions now meet the template's 44 × 44px touch-target contract across the home,
  catalog, filter sheet, comparison, entry, submission, setup, header, footer, breadcrumb and A–Z
  surfaces. The real-Chrome assistive-flow gate measures their rendered boxes at the mobile
  viewport so later CSS changes cannot silently shrink them again.
- Downstream update check dispatches now have a 45-second bound and three-attempt backoff. If
  GitHub remains unavailable or rate-limited, the updater fails safely after trying both independent
  gates and gives nontechnical recovery steps that identify the existing pull request, confirm
  `main` is unchanged, and prevent a merge before all required checks are green.
- The downstream generator now rebuilds the complete issue chooser from protected repository
  identity after an update, so existing deployments receive new routing safeguards instead of
  retaining the older chooser structure protected by their ownership rules.
- Browser, terminal and issue-driven setup now generate the same issue chooser alongside the other
  configuration outputs, including repository-file help links on the configured branch. A fresh
  template copy therefore cannot retain upstream PHCT reporting links after setup.

## [1.9.0-rc.2] — 2026-08-22

### Fixed

- The downstream updater now uses a dedicated `PHCT_UPDATE_TOKEN` for releases that change
  `.github/workflows`. It detects that requirement immediately after the protected reconciliation
  and checksum check, then fails with setup guidance before installing the candidate toolchain or
  running the full suite. Routine content automation retains its narrower token.
- The privileged updater credential stays out of checkout and candidate-controlled install,
  generation, verification, processes, and Git hooks. The verified commit crosses a digest-checked
  Git bundle into a fresh publication runner that never checks out or executes it; only that clean
  job receives the token for push and pull-request operations, without storing it in Git
  configuration or a remote URL.

## [1.9.0-rc.1] — 2026-08-22

### Changed

- Added a real-Chrome, 4× CPU-slowdown interaction gate at the supported 100-entry ceiling. Filter
  and warm-search p95 now block release; search cold start, sorting, comparison, main-thread time,
  heap use, repository subpath serving, cache behavior, and font/image transfer totals remain in
  the retained performance evidence. Reduced search debounce from 120 ms to 50 ms and made
  prefix/fuzzy expansion a no-hit fallback after controlled macOS and Linux runs exposed wasted
  work for common exact terms. Search result cards now paint
  before deferred snippet decoration, which is limited to the 20 highest-ranked cards.
- Kept scale and variant evidence reproducible by excluding locally generated coverage, SBOM, and
  performance artifacts from scratch builds and reporting elapsed time for every variant step.
  Performance fixtures now include long-form prose, deterministic 320×180 PNGs, every facet at
  common/rare frequencies, deprecated rows, and relationships instead of 1×1 placeholder-only
  scale data. Filter rendering now completes before deferred URL-history bookkeeping.

### Added

- **Release-readiness and downstream safety system.** Exact Node, npm, Ruby, and Bundler pins;
  `npm run doctor` and one fail-closed `npm run verify` command; a machine-readable ownership
  manifest; protected-file checksums; immutable downstream version locks; and a manual,
  human-approved PHCT update workflow.
- **Security and supply-chain gates.** CodeQL for JavaScript and Ruby, weekly npm/Ruby advisory
  audits, fail-closed dependency-license review, expiring exception records, and deterministic
  CycloneDX release SBOMs.
- **Measured scale and browser gates.** A deterministic 0–1,000-entry fixture, enforced 100-entry
  release budgets, link/anchor/artifact validation, filesystem-only local Lighthouse reports, and
  a gzip static server that matches production delivery more closely.
- **Coverage evidence.** Pinned-runtime line, branch, and function/method reports for the complete
  Node and Ruby suites and explicit security-parser/updater groups, with reviewed regression floors
  and always-retained CI artifacts.
- **Open-source operations.** CODEOWNERS, maintainership and support policies, structured bug,
  accessibility, and feature forms, plus release/update/rollback/backup/succession runbooks.
- **[docs/ecosystem.md](docs/ecosystem.md)** — the map of the repository family:
  what `phct` and `bchc-ai-use-case-catalog` each are, the archived starter, the
  repository variables that make each deployment behave differently, and what to
  update when a repository moves.

### Fixed

- Protected deployment governance, search vocabulary, derivative metadata, and nested showcase
  exceptions now match the documented update boundary and are tested before every parent update.
- Validation no longer reports success after silently skipping Ruby checks, and template-only
  showcase builds no longer fail downstream verification when no showcase is deployed.
- The downstream updater now fetches both the locked and target PHCT tags, proves the locked tag
  still resolves to its recorded full commit, reconciles the complete template-owned target tree
  without assuming shared Git ancestry, reselects the candidate's Node and Ruby afterward,
  branches from the default branch, uses `--force-with-lease`, and dispatches every release
  workflow when GitHub suppresses pull-request events from its built-in token.

## [1.8.1] — 2026-08-19

### Changed

- **The template has a name: Pub Health Catalog Template (PHCT).** The repository
  is now `crypticpy/phct`, the landing is titled accordingly and the package is
  `phct`. GitHub redirects the old `bchc-template` remote and web URLs, so existing
  forks' `template` remotes keep working; update them at leisure (`git remote
  set-url template https://github.com/crypticpy/phct.git`). The Pages URL moved to
  <https://crypticpy.github.io/phct/> — the old one does not redirect.

### Removed

- **The day-one starter site.** `crypticpy/bchc-catalog-starter` is archived; with a
  live example of every preset it no longer earned its keep. `demo_starter_url` and
  the landing's `starter_url` ship blank — the feature stays (set either to a copy of
  your own and the links come back), only the default target is gone.

## [1.8.0] — 2026-08-19

The template is a template again. Its working tree used to *be* one
organization's live catalog, so a copy made from it started life wearing that
organization's name, tagline, logo mark, footer and governance text — and the
first job of anyone forking it was to find and undo all of that. The named
catalog now has its own repository and this one ships a generic identity.

### Changed

- **The shipped configuration is organization-agnostic.** `_data/site.yml`,
  `_data/governance.yml`, `_data/showcase.yml`, `_config.yml` and the LICENSE
  no longer name a real organization. The site ships as "AI Use Case Catalog"
  by an invented "Civic AI Community of Practice", which is what choosing the
  `ai-use-cases` preset in the setup wizard describes: a public-sector
  community of practice sharing what it has built. The governance page keeps
  its structure and reads as a worked example rather than one body's adopted
  policy.
- **The `ai-use-cases` showcase example** (`/examples/ai-use-cases/`) carries
  that generic identity and a refreshed set of sample entries, so the flagship
  example demonstrates the preset rather than a particular deployment.
  The ten new entries are org-agnostic public-sector use cases (permit
  intake triage, council meeting summaries, records-request redaction, …),
  written to the same standard as before; docs worked examples and test
  fixtures were re-pointed at them so nothing in the repository quotes the
  old deployment's data.

### Removed

- **The named deployment moved out.** The health-coalition catalog this
  template was first built for now lives at
  [crypticpy/bchc-ai-use-case-catalog](https://github.com/crypticpy/bchc-ai-use-case-catalog),
  where its content, branding and adopted governance text belong. This
  repository stays the generic template (renamed to `phct` in 1.8.1, below).
- **`docs/dmwg-alignment-plan.md` and `docs/BCHC_DMWG_AI_Resource_info.md`**,
  the source framework and the field-by-field plan behind v1.5.0 and v1.6.0.
  They describe one work group's adopted framework, so they moved to that
  repository with it. What they produced — the schema fields, the governance
  module, the review workflow — is unchanged and documented in
  [docs/content-model.md](docs/content-model.md) and
  [docs/configuration.md](docs/configuration.md).

## [1.7.0] — 2026-08-18

The template now shows its work. Its own deployment used to be one demo catalog
of fictional health departments, which answered "what does this look like?" for
exactly one of the things it can be. It is now a landing page introducing the
template, with four complete example sites behind it — one per setup-wizard
preset, each built from this repository by the same `npm run setup` a fork
runs, each with its own fields, filters, colours and sample content. Nothing in
a fork changes: the showcase is built only while `demo` is `true`, and
`npm run eject:samples` deletes it.

### Added

- **A landing page for the template** (`/`), written entirely in
  [`_data/showcase.yml`](_data/showcase.yml) and laid out by
  `_includes/showcase-landing.html`: what the template is, a card per example
  with a screenshot and what it is configured like, what you get whichever one
  you start from, how publishing works, and the ways in — the launch guide, the
  browser wizard, the day-one starter site.
- **Four live examples**, each a full build at `/examples/<preset-id>/`:
  [AI use case catalog](https://crypticpy.github.io/phct/examples/ai-use-cases/)
  (the configuration this repository ships with),
  [cohort portal](https://crypticpy.github.io/phct/examples/cohort-portal/)
  (six team projects across two cohort years, with the cohorts and events
  modules on),
  [resource library](https://crypticpy.github.io/phct/examples/resource-library/)
  (six guides, toolkits and datasets) and
  [blank catalog](https://crypticpy.github.io/phct/examples/blank/)
  (three entries on the smallest useful schema). The per-example facts on the
  landing's cards — how many fields, how many filters, which modules — are
  generated from `assets/js/configurator/presets.js`, so they cannot drift from
  what picking that preset gives you.
- **`scripts/build_showcase.mjs` and `npm run build:showcase`** — the builder
  behind that: a scratch copy of the repository per example, run through the
  CLI wizard with the preset, the sample content in `_showcase/<preset-id>/`
  laid over it, then `jekyll build` into `_site/examples/<preset-id>/`. The
  landing is a build of this repository too, reduced to `/`, `/setup/` and
  `/404.html` by `_plugins/showcase.rb`. Documented in
  [docs/configuration.md](docs/configuration.md#the-showcase) and
  [docs/showcase-plan.md](docs/showcase-plan.md).
- **An example switcher** on every example site: the demo banner becomes a menu
  for moving between the four and back to the landing, so a visitor can compare
  them without the back button.
- **Sample content for three more presets** (`_showcase/`), authored against
  each preset's own schema and validated by the same `check_front_matter.rb`
  the catalog uses.
- **The showcase is in the accessibility gate.** `quality.yml` builds the
  landing and one example and pa11y-ci audits the landing, the example's home
  page, one entry page and the switcher's open state — under the same gate as
  the deploy, so a fork's gate is unchanged.

### Changed

- **The template's own deployment.** <https://crypticpy.github.io/phct/>
  is now the landing page; the AI use case catalog it used to be lives at
  [`/examples/ai-use-cases/`](https://crypticpy.github.io/phct/examples/ai-use-cases/),
  unchanged. The showcase is opt-in: `pages.yml` builds it only when the
  repository variable `CATALOG_SHOWCASE` is `true` *and* `_data/site.yml`
  still has `demo: true`; a copy of the template never has the variable, so it
  deploys the single ordinary build it always did — from its very first push.
- **The submission form no longer offers a link it cannot honour.** Without
  `github.repository` set — the three non-flagship examples on purpose, a fork
  that has not filled it in yet — `/submit/` used to render a Submit button
  pointing at `github.com//issues/new`. It now says there is no catalog
  repository behind the site and keeps everything that still works: the
  questions, the live card preview, the copy-out buttons and the email
  fallback, with the send button renamed to what it actually does.
- **`npm run eject:samples` removes the showcase too** — `_showcase/`,
  `_data/showcase.yml` and `assets/images/showcase/` — along with the rest of
  the sample content. A fork's home page is its catalog.

## [1.6.1] — 2026-08-18

The launch guide, walked for real: a fresh copy of the template
([crypticpy/bchc-catalog-starter](https://github.com/crypticpy/bchc-catalog-starter),
live at <https://crypticpy.github.io/bchc-catalog-starter/>) was made by
following [docs/launch.md](docs/launch.md) end to end — template button, the
three settings, the Apply setup issue, one entry through the issue form — and
everything the walkthrough found wrong is fixed below.

### Added

- **The day-one starter site is linked** from the README (next to the live
  demo), the opening of [docs/launch.md](docs/launch.md), and the demo
  banner, so a reader can see what a copy looks like once the guide is done:
  configured, samples gone, one entry.
- **`demo_starter_url` in `_data/site.yml`** (optional; documented in
  [docs/configuration.md](docs/configuration.md#demo-mode)). While `demo` is
  `true`, the banner adds "See what a fresh copy looks like on day one" with
  that link; blank or absent, the sentence is not rendered. It rides through
  the wizard like every other key no question asks about.
- **The wizard's review step names the Apply setup issue** as the easiest way
  to publish the files — the path the launch guide recommends — with a direct
  link when the repository is known, ahead of the file-by-file editor route it
  described before.

### Fixed

- **An ejected fork's checks are green again.** With the sample content
  removed, the first pull request in a fresh copy failed `Validate Content`
  and `Quality` for six reasons that were all the template assuming its own
  samples: `scripts/generate.mjs --check` reported the wizard defaults stale
  because the `_data/site.yml` repository-link sync ran after the defaults
  were compiled (now runs first); the preset build matrix
  (`scripts/build_variants.mjs`) assumed the shipped samples, cohort and
  governance data (it now skips, with a reason, when no sample entry is
  present); three unit tests read the shipped repository's demo state and
  cohort files (made fork-safe); the style guide's navigation linked to card,
  row and entry sections that need an entry to render (pills hidden until one
  exists); the two catalog flow tests timed out on an empty catalog (skipped
  when `/search.json` lists nothing); and `derive_images --check` failed on
  `_data/derivatives.json` records for screenshots that no longer existed —
  `npm run eject:samples` (and so the Apply setup checkbox and `npm run
  setup`) now drops the sample screenshots' records from the manifest with the
  entries.
- **Launch guide corrections from the walkthrough** ([docs/launch.md](docs/launch.md)):
  the Bootstrap labels list omitted `content:site-config` (the Apply setup
  issue's label) and the `review:*` labels; the initial commit already runs
  **Build & Deploy**, so the guide says to check that run rather than push
  another; Dependabot pull requests arrive on day one and are named as such;
  `url`/`baseurl` are stated to be the build's, not the wizard's; the Apply
  setup and `CONTENT_BOT_TOKEN` sections describe what a `GITHUB_TOKEN` pull
  request actually shows — dispatched **(dispatch)** statuses plus
  pull-request-event runs parked at "action required" — instead of "checks
  do not run"; the demo-content section mentions the derivatives manifest;
  and the test-entry steps say the scaffold writes `review_status: Under
  review`, that `escalate_on` answers add `review:data-governance`, and that
  the reviewer sets the approved value before merging.

## [1.6.0] — 2026-08-18

DMWG alignment, wave 4 — metrics and promotion, the last of the four waves in
`docs/dmwg-alignment-plan.md`. The governance
page can now show how the catalog is doing, counted from the repository's own
issues and pull requests; an entry can say which entry it was adapted from,
and the source says how many adopted it; and the feed — shipped in 1.2.0 —
is named on the governance page as the promotion channel it already was.

**Upgrading a fork.** Nothing here changes an entry a fork already has.
`_data/metrics.json` is sample content and `merge=ours`: a fork that had
already ejected the samples never gets it, one that had not gets the sample
figures once and its first monthly run overwrites them (or delete the file —
the block, its nav item and heading render only while it exists). The
schedule is off by setting `CATALOG_METRICS` to `false`; a manual run always
works. `reused_from` and `entry.contributor_key` are yours to add to your
`merge=ours` schema; without the pointer the metrics simply publish no
organizations figure.

### Added — wave 4, metrics and promotion

- **How the catalog is doing.** New `scripts/metrics.mjs` and a monthly
  `.github/workflows/metrics.yml` (07:30 UTC on the 2nd, or on demand):
  two read-only REST calls count, over the last four calendar quarters,
  submissions (issues carrying `content:new-entry`; pull requests never
  count), publications (merged pull requests on an `entry/` branch),
  distinct contributing organizations (the field `entry.contributor_key`
  names, `organization` in the shipped schema; live entries only, sample
  content excluded; no key, no figure) and review turnaround (issue opened →
  linked pull request merged, median and 90th percentile with the count they
  rest on). The result is `_data/metrics.json`, written only when the figures
  changed, committed as `chore(metrics): … [skip ci]` and followed by an
  explicit `Build & Deploy` dispatch — the same behaviour with `GITHUB_TOKEN`
  and `CONTENT_BOT_TOKEN`. `/governance/` renders it as a **How the catalog
  is doing** section — up to four figure cards (organizations only above
  zero, review time only once something has been reviewed), a per-quarter
  table, and a line about the feed when there is one — with an optional
  `metrics_intro` sentence in `_data/governance.yml`; nothing renders until
  the file exists. Run the workflow from the Actions tab with **Preview only**
  ticked to see the figures in the run summary without committing. No
  analytics vendor is involved and nothing is installed on the site; Plausible
  stays optional for the browsing-vs-contributing question.
- **`_data/metrics.json` ships as sample content** — figures consistent with
  the ten sample entries, marked `"sample": true` — so the demo shows the
  block. `npm run eject:samples` deletes it with the sample entries, and a
  fork's first monthly run writes its own.
- **Reuse tracking.** A new per-field schema hint, `links_entries: true`,
  turns a `list` of entry slugs into links to those entries — and the entry
  being named gets an **Adopted by *n*** card in its rail listing the live
  entries that adapted it. The shipped schema uses it for a new optional
  **Adapted from** field (`reused_from`) in *Sharing & licensing*, so a
  jurisdiction can say whose work it started from; an unknown slug renders as
  plain text rather than a dead link, and `npm run validate` fails it (the
  hint is also refused on anything but a `list` field). Two sample entries
  now say what they adapted, so the demo shows both sides.
- **`entry.contributor_key`** — the schema pointer the metrics read
  (`organization` in the shipped schema), documented alongside the other
  `entry.*` pointers in [docs/content-model.md](docs/content-model.md).
- **A `shipped-empty` build variant** — the shipped configuration with
  nothing published yet — joins `npm run test:build`, so the governance page
  with figures but no feed to link to, and the empty catalog under the real
  schema, are built and checked on every pull request.
- **Promotion, named.** The governance page's metrics block ends by saying
  where new and updated entries are announced — the Atom feed at
  `/catalog/feed.xml` (shipped in 1.2.0) and the "it's live" comment on the
  submitter's own issue — so the coalition's "promotion of new resources"
  requirement points at something that already runs.

## [1.5.0] — 2026-08-18

DMWG alignment, waves 1–3 — the content model, then the site, then the review
workflow catch up with the Data Modernization Work Group's governance
framework (`docs/dmwg-alignment-plan.md`). Add,
never delete: every existing field stays; nine join them, the rules the
reviewers apply are published on the site rather than in a PDF, and the pull
request a submission becomes now carries those rules, the answers that need a
closer look, and the tier it is in. Wave 4 — the metrics page and the
promotion helpers — is next.

**Upgrading a fork.** A minor version, not a major one, because nothing here
changes an entry a fork already has: `_data/schema.yml` is yours
(`merge=ours`), so the nine fields, `escalate_on`, `entry.require_link` and
the other pointers are available and unused until you add them — with the
field editor at `/setup/`, the Apply setup issue, or by hand, then
`npm run generate` ([docs/upgrading.md](docs/upgrading.md)). Every template
piece that reads a new pointer behaves as before when it is absent: no
`status_key` means no deprecation notice, no `escalate_on` means a quiet
checklist, no `require_link` means the missing-link check only warns. Two
things do arrive by merge. The `governance` module's page and example
`_data/governance.yml`: your `_data/site.yml` has no `governance:` key yet, so
no header or footer link appears, but `_plugins/modules.rb` only drops a
module's pages when the key is explicitly `false` — add `governance: false`
until you have rewritten the file, then flip it. And the `stamp` job in
`pages.yml`, which needs the Actions app allowed to push to `main` or
`CONTENT_BOT_TOKEN`; without either it reports and stands down.

### Added — wave 3, the review workflow

- **The pull request tells its reviewer what to check.** The scaffolded body
  ends with a **Maintainer checklist** built by the new `scripts/lib/review.mjs`:
  the review criteria from `_data/governance.yml` when the site publishes them
  — the same list as `/governance/`, not a second copy in the workflow — or a
  generic five otherwise; the mechanics; and the review-status flip the schema
  asks for (`review_status` set to **Reviewed & approved** — the scaffold wrote
  *Under review* — or left open with `review:revisions-requested`). The
  workflow's hard-coded `printf` checklist is gone; the scaffolder's new
  `checklist` output replaces it.
- **`escalate_on` — the answers that call for closer review.** A new per-field
  schema hint, an explicit list (a boolean's `false`, select/multiselect
  options) rather than an inference from tone. The shipped schema flags an
  unticked PII/PHI attestation, PII/PHI/CJIS under *Data it touches* and a
  *Public-facing* audience. A matching submission's pull request opens with a
  **Closer review** block naming each field and answer, the run summary
  repeats it, and a new best-effort label step adds `review:data-governance`
  (and `review:intake` on every scaffolded pull request) — reporting rather
  than failing when a fork has not created the labels. `check_front_matter.rb`
  rejects a list that names an option the field does not have.
- **Review-tier labels.** `bootstrap-labels.yml` creates `review:intake`,
  `review:committee`, `review:partner`, `review:data-governance`,
  `review:revisions-requested` and `review:declined`, in the purple family
  next to `content:site-config`; the admin guide gets a "Review tiers and
  labels" section with a declined-with-rationale comment that has worked.
- **The minimum documentation bar.** `check_front_matter.rb` notices an entry
  with no link anywhere — every `url` field empty, no `links` item — because a
  reader would have nowhere to go to evaluate or adopt it. A warning by
  default; a failure under the new `entry.require_link: true`, which the
  shipped schema sets. New `entry.status_approved_value` names what approval
  means, for the checklist above.
- **`updated` stamps itself.** A `stamp` job now opens `Build & Deploy`: for
  every entry file a push to `main` *modified* (not added — a new entry has
  `published`), `scripts/stamp_updated.mjs` sets `updated:` to that day unless
  it already says today or later, skips `sample: true` content, edits the
  front matter as text so comments survive, and commits back; the build job
  deploys the stamped commit so the page, the feed and "Recently updated"
  agree. Non-fatal by design: a push refused by branch protection is reported
  in the run summary with the three ways out, and the site deploys as pushed.

### Added — wave 2, governance on the site

- **A `governance` module and page.** `/governance/` renders everything in the
  new `_data/governance.yml`: how review works as a numbered timeline (submit,
  intake triage in about five business days, substantive review in about ten,
  partner review when warranted, decision, publish, maintain), the five
  criteria reviewers apply, who does what, and seven standing policies —
  privacy, licensing and IP, the data-governance baseline, accessibility and
  quality, maintenance and deprecation, appeals, code of conduct — each with a
  stable anchor. Every block is optional and the "On this page" list is built
  only from blocks that render. New `governance.css` component classes;
  `_data/modules.yml` gives the module its `/governance/` prefix so
  `_plugins/modules.rb` drops the page when it is off; the header nav, both
  wizards' module step, `navigationFromSite()` and every preset know the
  module (on in the shipped config, off in the other three presets).
- **The footer says how the site is built and how to subscribe.** An optional
  `footer.accessibility` sentence in the bottom bar links to
  `/governance/#accessibility` when the module is on and the data file has a
  policy with that id, and a *Feed* link (new
  `rss` icon) sits beside the copyright — the visible twin of the `<link
  rel="alternate">` in `<head>`, guarded by the same "does the catalog have
  entries" test, so an empty fork never links a 404.
- **`CODE_OF_CONDUCT.md`** for the repository and every deployment's review
  threads, and **`docs/contributor-guide.md`** — the submitter's side of the
  process: search first, what the form asks, the three things reviewers look
  at hardest, that you keep ownership, the review timeline, what happens after
  an entry is live. The governance page's closing block links to both from
  `github.repository`, so a fork's links point at the fork.
- The About and Submit pages carry a paragraph pointing at governance when the
  module is on; `submit.turnaround` now states the intake and committee
  targets. The quality gate audits `/governance/` with pa11y when the module
  is on.
- **The ejector knows the governance file is an example, not sample rows.**
  `npm run eject:samples`, the wizard's last question and the Apply setup
  checkbox switch the module off (`governance: false` in `_data/site.yml`) —
  the file names one coalition's committees and timelines and an emptied
  mapping would render bare headings — and say so, so a fork does not publish
  BCHC's review process as its own. `CODE_OF_CONDUCT.md` is excluded from the
  build like the other repository documents.

### Fixed

- The home page's "Recently added" grid lists live entries, but its empty
  state was gated on the total — a catalog where every entry is deprecated
  showed an empty grid and no message. It now says so and points at the
  catalog, which keeps deprecated entries for the record.

### Added — wave 1, the content model

- **Nine schema fields, one new group.** `use_case_category` (select, fact
  slot), `review_status` (select, maintainer-only, faceted), a **Sharing &
  licensing** group — `license` and `portability` as required selects on the
  fact strip, `access_terms` and `portability_notes` as textareas — plus
  `no_pii_attestation` (a required boolean: a ticked box in the wizard, a
  Yes/No dropdown in the issue form), `data_governance_notes` and
  `contact_title`. Forty fields in eight groups; every form, card, filter and
  validator picked them up from the schema without a template change, and
  the ten sample entries are back-filled with honest values.
- **Deprecate, don't delete.** Three optional schema pointers —
  `entry.status_key`, `entry.deprecated_value`, `entry.status_scaffold_value`
  — name the review-status field, the option that means "kept for the
  record", and the value a fresh scaffold receives. A deprecated entry stays
  published: its page opens with a warning-toned notice, its card and list row
  say "Deprecated — kept for the record", the home page stops featuring it,
  the catalog lists it after every live entry and the default sort demotes it
  below stale ones. New Liquid filters `deprecated_entry`, `live_entries` and
  `deprecated_entries` in `_plugins/schema_filters.rb`; `entry-order.js`
  ranks deprecated below stale; the scaffolder stamps **Under review** on
  every new entry.
- **"Skip filters".** The catalog rail is DOM-first on wide screens and every
  facet option is a tab stop, so a keyboard user who only wanted the search
  box walked sixty-odd buttons to reach it — more, now that four new facets
  exist. A sr-only-until-focused link at the top of the rail lands on the
  results heading, one Tab before the search box; the AT flow test uses it.
- **Person card, business-card shape.** A rail group's further `text` fields
  (a title, a role) now sit under the contact's name instead of in the
  label/value list below "Ask in the open" — detected by type, never by key.

### Docs

- `content-model.md` gains "Review status and deprecation", the Sharing group
  and attestation notes, and the 40-field table; `admin-guide.md` now leads
  with deprecation, reserves folder deletion for duplicates and withdrawn
  consent, and points reviewers at the governance page; `configuration.md`
  documents the `governance` module, `footer.accessibility` and
  `_data/governance.yml`; `docs/index.md` routes submitters to the contributor
  guide; README, CONTRIBUTING and roadmap updated. Wave 3: `content-model.md`
  documents `escalate_on`, `entry.status_approved_value` and
  `entry.require_link`, and `updated` as automation-written; `admin-guide.md`
  gains the review-tier table, the declined reply, the documentation-bar line
  in the checklist and how the `updated` stamp works; the wizard's schema
  header lists the new hints.

## [1.4.0] — 2026-08-18

The design pass. v1.3.0 was a working instrument that did not yet look like
one anyone would choose to keep open; this release is the tastefulness
without the overhead — no new dependencies, one new 44 KB font file, and
about a hundred lines of CSS moved rather than added.

### Changed

- **Serif headings.** Source Serif 4 (variable, optical size pinned at 24,
  44 KB, built by `npm run fonts` like the other two) is now the default
  `fonts.heading` over the Inter body: page and entry titles, section
  titles, card titles, rail-card headings and the logo wordmark. A
  metric-matched Georgia fallback face keeps the swap from reflowing. The
  wizards' Look step offers it alongside the two sans families; set
  `fonts.heading: "Source Sans 3"` for an all-sans site.
- **Three grounds instead of one border.** A new `surface_tint` colour token
  (`#EAF0F7`) gives bands (the home "Browse by" section) and panels (results
  header, entry fact strip, rail cards, stale notice, wizard sidebar) an edge
  without a border. Cards drop their `line` border for `shadow-e0` — a 1px
  `ink/10` ring drawn as a shadow plus a faint ambient — so a grid of cards
  reads as objects on a surface rather than a spreadsheet of boxes. The
  catalog's sticky results header sits on the tint too, without a drop
  shadow.
  `forced-colors` mode gets a real border back. `npm run validate` checks
  `ink`, `muted` and `primary` against the new tint (4.5:1).
- **Hero and footer.** `primary_dark → primary` gradient with a masked
  dot-grid texture in the hero's top-right corner; the footer mirrors the
  same gradient so the page's two dark ends match. The "Latest additions"
  panel is a `white/6` inset on that ground with a `white/15` ring (no blur —
  nothing scrolls behind it). The hero search is one pill with the Search
  button set inside it, the primary action ("Browse the catalog") is a solid
  white button (`.btn-on-dark-solid`) and "Share …" is the ghost beside it.
  The display title is `clamp(36px, 28px + 2vw, 48px)`.
- **Home page rhythm.** Eyebrow → title → lead section heads (`.section-head`,
  section titles up 24 → 28 px), the three value propositions as text over a
  hairline instead of three more cards (a highlight is now a `title` and a
  `body`; an `eyebrow` key on an existing site is ignored), the "Browse by"
  tiles with their option labels in ink and a reserved icon column, and the
  "Share …" call to action as a tinted panel with a `primary → secondary` 7 %
  wash. Carousel arrows hide when the track does not scroll.
- **Featured** is an `ink` pill with the star in `accent` (`data-tone="featured"`),
  emphasis by weight rather than by an orange pill; `accent` still means
  Featured and nothing else. Sensitive-data labels on the fact strip sit in a
  white pill so `warn` keeps 4.5:1 off the tint.
- Card meta lines set the free-text segment (the organization name) in
  sentence case at medium weight (`.entry-meta-seg--text`), so it truncates
  about 15 % later than in caps; option-valued segments keep the eyebrow
  style. `--measure` is 36rem (~74 characters) instead of 40. The wizard's
  step titles are one size down so "Step N of 7" and the title read as one
  unit.
- `docs/design-system.md` gains a Surfaces section and the type table now
  matches the built site; `docs/design-brief.md` carries an amendment note.


## [1.3.0] — 2026-08-17

Contributor panel, wave 2: the six decisions left open by v1.2.0 were taken
(the "what it took" group, a verification lifecycle, compare + printable
brief, contact etiquette, an upgrade path; the saved-constraints overlay is
deferred) and the wave-2 queue shipped — vocabulary-aware search, facet
landing pages, responsive image derivatives, a native `<dialog>` filter
sheet, view transitions, variable fonts, an apply-setup workflow, demo mode,
a three-step branding wizard and an assistive-technology flow test. Seven
units built it in isolated worktrees; the whole submission pipeline was also
verified end to end on the live repository (issue → PR with first-party
checks → thumbnail commit → merge → "it's live" comment, about eight minutes
of wall clock). The new schema fields are all optional, so existing entries
and presets need no change.

### Added

- **"What it took"** — a schema group asking the five questions a peer needs
  before they can copy a project: cost to stand up, cost to keep running, how
  it was bought, the reviews it went through, and who it affects. All optional,
  the four selects are facets, and the option lists are a starting draft for
  the site owner to rewrite. A new **`fact` card slot** puts a field on the
  entry page's fact strip without spending one of the card's four glyphs.
- **Verification lifecycle** — a `verified` front-matter date,
  `catalog.verify_after_days` in `_data/site.yml` (365 by default), a quiet
  "not confirmed since" notice on stale entry pages, a "Last confirmed" line on
  their cards, a demotion below fresh entries in the default sort, and a
  **monthly verification sweep** (`verification-sweep.yml`) that keeps one
  rolling issue listing the entries due to be re-confirmed (opt out with the
  repository variable `VERIFICATION_SWEEP=false`).
- **Compare up to three entries side by side.** A shortlist tray on the
  catalog collects picks from the cards; `/compare/` lays them out field by
  field, grouped as the schema groups them, differences first. The shortlist
  survives a reload and travels in the URL. A build-time **`/entries.json`**
  carries every entry and every non-prose field.
- **Print an entry or a comparison as a decision brief** — a print stylesheet
  drops the chrome, spells out link URLs, keeps the table header across pages
  and stamps where and when it was printed.
- **"Ask in the open"** beside an entry's contact email opens a GitHub
  Discussion so the answer helps the next reader (`contact.ask_in_open`;
  needs Discussions with a Q&A category). The contact `mailto:` now arrives
  with a subject and a first line naming the entry and its URL.
- **Vocabulary-aware search**: typing a word the catalog spells differently
  ("chatbot" for "Chat assistant") offers the filter itself as the first
  suggestion, with its field and count, and the same tags as "Did you mean"
  chips when nothing matches. `_data/search.yml` holds query synonyms,
  per-option aliases and the bounds on the generated browse pages
  (`docs/search.md`).
- **Facet landing pages** at `/catalog/<field>/<value>/` — a real, crawlable
  page for every tag in use, with title, description, canonical and sitemap
  entry — and an **A–Z directory** at `/catalog/a-z/` that needs no JavaScript.
- **Responsive image derivatives**: `npm run images` writes AVIF and WebP
  copies of every screenshot at 400/800/1280 px, `_includes/picture.html`
  serves them through `<picture>` (falling back to the original wherever no
  derivative exists), and the submission and media workflows generate and
  commit them (`docs/images.md`). `check_file_sizes.rb` warns above 2 MB for
  images.
- **Apply setup issue form**: the `/setup/` wizard's output can be applied
  without a terminal — paste the three YAML files into "Apply setup (creates
  PR)" and a workflow re-renders the full configuration and opens a pull
  request (maintainers only).
- **Demo mode**: `demo: true` in `_data/site.yml` puts a banner on every page
  saying the content is sample data; `npm run eject:samples` removes the
  samples and turns it off (`npm run setup` offers the same step).
- **Upgrade path for forks**: `.gitattributes` marks the files a fork owns
  `merge=ours`, `npm run upgrade:check` previews an incoming release as "what
  you take / what you keep", and `docs/upgrading.md` carries the recipe.
- **File and image fields upload from the issue form** — GitHub's native
  upload control replaces the "commit it after the PR" step.
- Cross-document **view transitions** between catalog and entry — the card's
  image and title carry over into the entry's hero and heading — plus
  speculation rules that start loading an entry after ~200 ms of hover; both
  inert where unsupported and off under `prefers-reduced-motion`. **Web Share**
  on entry pages where the browser supports it.
- Semantic radius and motion utilities driven by `_data/theme.yml`
  (`rounded-hairline/control/card/sheet/pill`, `duration-fast/base/slow`,
  `ease-brand`). The theme's new `motion:` block — three named speeds, snappy /
  default / calm, or hand-written timings — is set from the wizard's Look step,
  which also previews the sixth (`xs`) radius step.
- `npm run test:flows` — keyboard-only walkthroughs of the catalog, search,
  submission and setup journeys in a real browser (focus order, visible focus,
  live-region announcements, no dead ends), run as a third lane in
  `quality.yml`. `npm run fonts` rebuilds the font subsets from upstream.
- **Validate Content** now checks that every screenshot has up-to-date
  derivatives (`npm run images -- --check`), so a hand-added image cannot merge
  without them.
- New docs: `search.md`, `compare.md`, `images.md`, `upgrading.md`.

### Changed

- The mobile filter sheet is a native `<dialog>`: focus trap, ESC, `inert` and
  focus restoration are the platform's rather than 137 lines of script. The
  catalog search box is a `<search>` landmark with a `type="search"` input.
- Badge tones are a `data-tone` attribute instead of a composed class name and
  `tailwind.config.js` no longer needs a safelist; an unrecognised tone renders
  a neutral pill instead of unstyled text. The deprecated `.badge-<tone>` and
  `.chip-secondary` spellings are gone — a fork that wrote them by hand needs
  `class="badge" data-tone="…"`.
- Fonts are two variable woff2 subsets instead of seven static cuts, with
  metric-matched fallback faces: 2 requests / 104.5 KiB where a page took
  5 / 157.3 KiB, and no reflow on swap.
- Card and gallery images carry `width`/`height`; the thumbnail workflow is
  now "Generate entry media", also triggers on images and re-dispatches both
  Validate and Quality after it pushes.
- Pull requests opened by the content bots are labelled with their
  `content:*` label; **Bootstrap labels** also creates `verification`.
- `/compare/` is dropped with the catalog module, like the rest of the catalog's
  pages. Link hosts under a link are hidden in print (the URL is spelled out
  instead).
- The setup wizard's Branding step is three steps — Basics, Look and Words —
  and answers saved by an earlier version resume on the right step.
- `organization` moved to weight 8, so sharing an organization no longer makes
  two entries strongly related.
- The zero-result panel says which query found nothing; the admin guide's
  description of dispatched checks matches what the PR checks box shows.

### Fixed

- The catalog-index test no longer asserts a ranking against the live sample
  catalog, so adding an entry cannot fail CI (it did, on a real submission).
- The demo banner's "Demo content" label meets 4.5:1 on its tinted ground, and
  the compare tray's link has a name before the first pick.
- The setup wizard's Review step no longer scrolls sideways at 390 px, and an
  invalid field is marked the moment its error summary appears.
- The Atom feed falls back to `site.github.url` for absolute ids and warns
  once at build time when no `url` is set.
- `check_front_matter.rb` validates `verified` and warns when a `file` field
  points at a path not yet in the repository.
- Slugs spell out the letters NFKD leaves whole — "Straße" is `strasse`, "Łódź"
  is `lodz`, "Ærø" is `aero` — on both the JS and Ruby side, instead of dropping
  them.
- `quality.yml` uploads its reports with `actions/upload-artifact` v7 (Node 24;
  the v5 pin was logging a deprecation notice on every run).

## [1.2.0] — 2026-08-17

The first "contributor panel" release: twelve simulated world-class
contributors (principal engineers, library maintainers, an interface designer,
public-health officials, GitHub and Microsoft engineers) each proposed what
they would improve; seven implementation units shipped the accepted set. The
report is in the release notes.

### Added

- **Search reads the whole write-up.** Every entry is indexed per section, so a
  suggestion names the section it matched in, shows the sentence around the
  term and links straight to that heading. Weak matches (below 25 % of the top
  score) sit behind "Show n more that mention …". `schema.search.body_chars`
  caps how much of each section is indexed (0 or unset = unlimited).
- An Atom feed of the newest 25 entries at `/<entry.path>/feed.xml`
  (`/catalog/feed.xml` as shipped), one `<category>` per facet value,
  advertised in `<head>` only when the catalog has entries.
- Every cohort milestone gets its own page, generated from
  `_data/cohorts/<year>.yml`. A hand-written file under
  `cohorts/<year>/events/<id>/` still overrides it and inherits any field it
  leaves blank.
- **Submission form:** a "Check your answers" step that reads every answer back
  by section with a Change button, then a confirmation panel that says nothing
  is submitted until *Submit new issue* is pressed on GitHub; "Save and come
  back later" with a draft bar that says when it was saved and how many
  answers it holds; and the whole form works without JavaScript — a plain GET
  to GitHub's issue form, real `required` attributes and a copy-paste outline.
- `submit.turnaround` and `submit.review_note` are configurable in both wizards
  and every preset ships a turnaround it can keep. The setup wizard's review
  step lists the three things it cannot do for you.
- **Bot pull requests get first-party checks.** Each issue-driven workflow
  dispatches Validate and Quality against the branch it created (the default
  token cannot trigger them), `thumbnails.yml` re-dispatches after its own
  push, and an optional `CONTENT_BOT_TOKEN` makes the PRs trigger checks
  natively. Run summaries list what was dispatched; the PR body carries an
  entry preview; when the merged entry deploys, the closed issue is told
  "Your entry is now live at …".
- `.github/workflows/lint-workflows.yml` runs actionlint and zizmor on any pull
  request touching `.github/**`. **Bootstrap labels** prints a preflight
  summary (labels, Pages source, launch-guide link).
- `npm run dev` — one command for the Tailwind watcher, `jekyll serve
  --livereload` and regeneration of the schema-derived files.
- `npm run test:build` — builds every preset and module combination and checks
  the rendered HTML for hard-coded articles, downcased sentences, dead links
  and leftover Liquid.
- `npm run validate` fails a `_data/theme.yml` palette that does not meet
  WCAG AA, naming the pair and the measured ratio; the schema validator warns
  when a field `description` repeats its `prompt`.
- The Quality workflow runs Lighthouse on mobile as well as desktop and writes
  a table of the scores and the pa11y results to the run summary.
- `theme.yml → type.measure` / `type.measure_display` set the reading and
  display line lengths; body copy measures ~68 characters (was ~88).
- Docs: `docs/launch.md` (fork-to-live tutorial), `docs/incidents.md`
  (takedown runbook), `docs/index.md`, `docs/decisions.md` (the canonical
  decision log), `docs/glossary.md`.
- `with_article`, a Liquid filter that picks "a" or "an" for the schema's
  entry noun. `static_file` and `facet_options` filters.

### Changed

- **Builds are much faster on large catalogs:** related entries are computed
  once per build instead of per page (260 entries: 25.8 s → 3.8 s), and are
  chosen by how distinctive a shared value is (IDF), scaled by the field's
  `weight` — a lower weight counts for more, as it does everywhere else.
- The search index is fetched only when someone searches, at low priority
  with a timeout, instead of being preloaded on every page.
- Multiselect questions reach the GitHub issue form as a multi-select
  dropdown, so the answers survive the hand-off and can be marked required
  there.
- Submission-form errors are written from the schema and name the question
  they belong to; the progress rail says how many problems each section has;
  the setup wizard marks problems on the control and clears them on the next
  keystroke.
- Catalog cards line up: the meta line no longer wraps and every slot reserves
  its height, so a row scans across instead of stair-stepping; padding and
  title size follow the card's own width (container queries); results settle
  instead of blinking — only cards that just entered the filtered set fade in.
- Option descriptions moved out of hover tooltips into a "What do these
  mean?" disclosure under each facet group and the fact strip.
- Page titles scale fluidly instead of stepping at 640 px; headings and
  paragraphs use `text-wrap: balance` / `pretty` where supported.
- The catalog page heading, nav label, breadcrumb and `<title>` are all
  derived from the schema's entry noun.
- Only one image per page is eager-loaded with a high fetch priority.
- `jekyll-feed` was removed; the feed moved from `/feed.xml` to
  `/<entry.path>/feed.xml`.
- The scaffolder shares one slug rule across JS and Ruby (NFKD; a title with
  no Latin characters scaffolds `entry-<issue>` with a warning instead of
  failing); Actions helpers are shared and generated files are written
  atomically.

### Fixed

- Prose pages render in the site's own palette again: `prose-slate` was
  overwriting every themed variable, leaving links at 1.70:1 with no
  underline.
- Selected, current and complete states stay visible under Windows High
  Contrast Mode (new forced-colors layer); a tap no longer leaves a control
  stuck in its hover state on touch devices; `hidden` can no longer be undone
  by a display utility.
- The on-dark thumbnail badge is opaque, fixing a contrast failure over pale
  screenshots.
- The home carousel's first card keeps its 16 px inset on phones (it was
  smooth-scrolled flush at load, which also stopped Chrome reporting LCP).
- The lightbox announces the image ("Image n of m. <alt>") and opens the
  dialog before filling it; search suggestions navigate on click.
- Copy that assumed the entry noun starts with a consonant ("Submit a
  entry"), empty-state headings that lowercased their first word, and the
  About page's "draft pull request" wording.
- Links to the submission form are hidden when the submit module is off; the
  footer honours the same `module:` gate as the header.
- Image downloads are capped as they stream, not after the fact.
- The schema validator rejected `tone: on-dark`, which the badge CSS styles
  and the docs document.
- Doubled spaces in the mobile filter sheet's "Show n use cases" button.
- **Security:** the image fetcher's SSRF guard now judges IPv6 literals
  numerically. IPv4-mapped (`[::ffff:169.254.169.254]`), IPv4-compatible and
  NAT64 (`64:ff9b::/96`) literals are decoded and checked with the IPv4
  rules, so a hex spelling produced by the URL parser (`[::ffff:a9fe:a9fe]`)
  can no longer reach loopback, link-local or private space; `fe80::/10`,
  `fc00::/7`, `ff00::/8` and `2001:db8::/32` are matched by mask rather than
  by text prefix.

## [1.1.0] — 2026-08-17

Closes the four P3 findings the v1.0.0 panel left open, and settles the
toolchain questions Dependabot raised.

### Added

- The 404 page carries the catalog search box (the same plain GET form as the
  home hero) and the three newest entries, both driven by `_data/schema.yml`
  and hidden when the `catalog` module is off.
- "Browser support" section in `docs/design-system.md`.

### Changed

- Entry page: on wide screens the rail (contents, reuse, contact) now sits
  beside the header instead of starting under it, so the top of the page has
  no empty column; a rail taller than the viewport scrolls in place instead of
  hiding its last card. DOM order — and therefore the reading order on phones
  and screen readers — is unchanged.
- Fact strip: cells align label and value rows across the strip, cap at three
  values with a "+n" chip that names the rest, use two columns in the
  1024–1279 px band beside the rail, and draw hairlines per cell so a short
  last row no longer ends in a grey block.
- Filter rail: pill labels are 13 px at `lg` (were 12); zero-count options
  recede on three cues (muted ink, hairline border, 70 % opacity).
- Dependencies: ESLint 10 (`@eslint/js` 10), `globals` 17, `js-yaml` 5
  (`import * as yaml`).
- Tailwind stays on 3.4 by decision — v4's browser floor is too high for the
  audience — and Dependabot now ignores the major bump. Rationale in
  `docs/design-system.md` and `docs/roadmap.md`.

## [1.0.0] — 2026-08-17

The first release meant to be forked. Three review panels (visual, interaction,
accessibility, front-end code, architecture, documentation, pipeline security)
were held during development; every P1 and P2 finding from the final panel is
fixed in this release, and the remaining P3s are listed in `docs/roadmap.md`.

### Added

- Design system: `docs/design-system.md` (tokens, type scale, elevation, motion,
  every component class) and a `/styleguide/` page rendered from the live theme
  and the newest entries. Component CSS lives in `assets/css/components/*.css`.
- Quality gates in CI: `quality.yml` runs pa11y-ci (axe + HTML CodeSniffer,
  WCAG 2 AA, desktop and 390 px viewports) and Lighthouse CI on every push and
  PR; `validate.yml` now runs ESLint, Prettier, the Node and Ruby test suites,
  `generate --check`, front-matter validation and a full build.
- Contributor docs: `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`.
- Schema v2 presentation hints — `card` (`badge` / `meta` / `line` / `chip` /
  `icon`), `weight`, `icon`, `group`, `prompt`, `option_meta`
  (short / icon / tone / description), group `placement` (`rail` | `main`) —
  and two field types, `images` and `links`. See `docs/content-model.md`.
- Catalog: redesigned card with an at-a-glance signal strip, grouped filter
  rail with live counts and URL state, mobile filter sheet, combobox search
  (body text indexed, relevance sort), grid/list toggle, home "browse by" tiles.
- Entry page: fact strip, screenshot gallery with lightbox, table of contents,
  reuse/contact cards, related entries, schema-driven grouped sections.
- Submit wizard: sectioned form with progress, live card preview that mirrors
  the catalog card, autosave with restore/discard, inline validation and an
  error summary, popup-blocked and email fallbacks, "what happens next".
- Issue → PR automation: screenshot downloads with size caps and a private-host
  guard, links parsing, YAML emission that round-trips through js-yaml and
  Psych, per-issue concurrency, a `SUBMISSIONS_OPEN` repository variable to
  pause public intake, SHA-pinned actions.
- Configurator: shared `core.js` split into modules; presets carry schema v2;
  `defaults.generated.js` is derived from the YAML by `npm run generate`. The
  `/setup/` Branding step shows a live preview of the real components under
  the chosen palette, type and rounding; the field builder's "Show on card"
  toggle can pin a card slot.
- Ten sample AI use cases across health programmes and back-office functions,
  each with a screenshot.
- Setup wizard: entry-model fields as collapsed rows with a sticky action bar,
  `group`/`weight` controls on every field and on the add-a-field form, and a
  focusable error summary that links to each control at fault. The CLI wizard
  gained a declarative flag table (`--preset/--yes/--dry-run/--out/--help`).
- `_data/modules.yml` maps each module to the paths it owns; `_plugins/modules.rb`
  reads it instead of a hand-maintained table.
- Tests: `test/plugins/*_test.rb` for every Jekyll plugin, a JS↔Ruby parity test
  for the schema constants, `test/scripts/filter_state.test.mjs` for the catalog
  filter logic, jsdom tests for the wizard and the submit form, and adversarial
  tests for every issue-driven script (239 node + 77 Ruby).
- pa11y-ci audits interactive states too: the mobile filter sheet, "Show all"
  expanded, the lightbox, and the wizard's Branding and Entry-model steps.
- Screenshots in `README.md` and `docs/configuration.md`.
- `npm run validate` (and the CI gate) fails a fork that still names the
  template's repository in `_data/site.yml` or the issue chooser, with the fix
  spelled out; `npm run generate` rewrites the chooser links from `site.yml`.
- Workflows run on Node 22 (`engines.node >= 22`).

### Changed

- Interaction: the submit form's "open a pre-filled issue" flow works under
  `noopener`; `?q=` deep links search on load; the layout reflows at 400 %
  zoom; the "Show all" toggle, carousel buttons and search listbox manage focus
  correctly; live regions stay quiet on boot; the filter sheet closes on Escape
  from anywhere; filter counts read as "(12 matches)" to assistive tech; the
  results header and rail hide when JavaScript is off; the catalog status names
  the search that is *applied*, not the text being typed; a step pill in the
  setup wizard validates every step it would skip.
- Layout: one `.page-title` size on every page, `.eyebrow` variants replace
  ad-hoc tracked capitals, the entry rail comes first in DOM order on small
  screens, the entry table of contents also shows on mobile, the home page's
  "Recently added" grid yields to the hero list at desktop widths, carousel
  items fill their row exactly with a "Browse all" link beside the controls, the
  filter rail fades at its bottom edge when it scrolls, text-only cards keep
  their own height next to image cards, and headings that receive scripted
  focus use a dashed offset outline instead of the control ring. Hero CTAs hide
  with their module (`module:` on each CTA). Cohort-portal preset:
  `department` → `area`; resource-library preset copy is organization-neutral.
- Accessibility: the submit form's fieldset legends label their selects, every
  option input has an id the error summary can link to, the images textarea is
  described by its note, email inputs carry `autocomplete`; the setup wizard's
  copy buttons announce "Copied" politely, and its select controls keep a
  current value that is no longer among the options.
- Code organisation: `filters.js` split into `lib/filter-state.js`,
  `lib/entry-order.js` and `filter-sheet.js`; the wizard into `wizard/*` and
  `steps/*`; the CLI into `scripts/lib/setup-*.mjs`; `_layouts/cohort.html` and
  `_layouts/event.html` use prefixed Liquid assigns.
- Removed the unused per-field `section` hint and the top-level `sections:`
  map from the schema, presets and validator (`groups` replaced them).
- Quality configs moved to `quality/` (`urls.js` discovers sample entries;
  `pa11yci.js`, `lighthouserc.js`); the thumbnails workflow reads the entry
  path from the schema; every issue-driven workflow has a concurrency group.

- Fonts ship as latin/latin-ext woff2 subsets (Inter, Source Sans 3) with the
  body and heading faces preloaded; the TTFs are gone.
- Focus indication is one solid 2 px `primary` ring with a ground-coloured
  offset everywhere.
- Scaffolded entries carry `render_with_liquid: false`; the validator fails an
  entry without it.
- Both configurators ask the same six colour questions (`line_strong` and
  `warn` included) and the live preview honours all of them.

### Security

- Screenshot fetches resolve DNS and refuse loopback / private / link-local
  addresses on every redirect hop; the GitHub token is only sent to GitHub hosts.
- Issue-body parsing takes the first occurrence of each heading and treats
  everything after the write-up as prose, so a submission cannot inject fields.
- Slugs are validated and writes are confined to `catalog/<slug>/`.
- The cohort and event scripts share the first-wins issue-form parser, confine
  every write to `cohorts/<year>/events/<id>/`, emit front matter through the
  shared YAML emitter, write every `$GITHUB_OUTPUT` value behind a random
  heredoc delimiter, and their workflows declare `permissions: {}` at the top
  level, honour `SUBMISSIONS_OPEN`, and report a failed run back on the issue.
  Adversarial tests spawn each script with hostile issue bodies.
- `SECURITY.md` says what the automation guarantees, what it does not (the
  workflow token is repository-wide; branch protection is the backstop; DNS
  rebinding against a self-hosted runner), and how to report a vulnerability.

## [0.1.0] — 2026-08-17

### Added

- Initial template: Jekyll + GitHub Pages catalog driven by `_data/*.yml`,
  four presets (AI use-case catalog, cohort portal, resource library, blank),
  in-browser and CLI configurators, GitHub-issue submission flow, events /
  cohorts / resources modules, Lunr search, thumbnails workflow.

[Unreleased]: https://github.com/crypticpy/phct/compare/v1.10.0-rc.2...HEAD
[1.10.0-rc.2]: https://github.com/crypticpy/phct/compare/v1.10.0-rc.1...v1.10.0-rc.2
[1.10.0-rc.1]: https://github.com/crypticpy/phct/compare/v1.9.0...v1.10.0-rc.1
[1.9.0]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.7...v1.9.0
[1.9.0-rc.7]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.6...v1.9.0-rc.7
[1.9.0-rc.6]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.5...v1.9.0-rc.6
[1.9.0-rc.5]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.4...v1.9.0-rc.5
[1.9.0-rc.4]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.3...v1.9.0-rc.4
[1.9.0-rc.3]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.2...v1.9.0-rc.3
[1.9.0-rc.2]: https://github.com/crypticpy/phct/compare/v1.9.0-rc.1...v1.9.0-rc.2
[1.9.0-rc.1]: https://github.com/crypticpy/phct/compare/v1.8.1...v1.9.0-rc.1
[1.8.1]: https://github.com/crypticpy/phct/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/crypticpy/phct/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/crypticpy/phct/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/crypticpy/phct/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/crypticpy/phct/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/crypticpy/phct/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/crypticpy/phct/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/crypticpy/phct/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/crypticpy/phct/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/crypticpy/phct/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/crypticpy/phct/compare/38365a5...v1.0.0
[0.1.0]: https://github.com/crypticpy/phct/commits/38365a5

# BCHC AI Use Case Catalog

A shared catalog of AI use cases, tools and lessons learned from Big Cities Health Coalition member health departments. Member departments publish what they have built — the source repo or vendor product behind it, the data it touches, what staffing it took, what they would do differently — so another city can decide in a couple of minutes whether it is worth reusing.

The site is hosted on GitHub Pages and managed entirely through GitHub: no server, no database, no CMS login. Jekyll builds it on GitHub Actions, and every content change flows through a GitHub issue and a pull request.

**Live site:** <https://big-cities-health-coalition.github.io/bchc-ai-use-case-catalog/>

## Add an entry

Fill in the [**Submit** form](https://big-cities-health-coalition.github.io/bchc-ai-use-case-catalog/submit/) on the site — a stepped form that walks you through a few short sections, with a short form that hides every optional question and a live preview of the card your entry will produce — or open the [Submit a use case issue form](https://github.com/Big-Cities-Health-Coalition/bchc-ai-use-case-catalog/issues/new?template=new-entry.yml) directly. Automation turns the issue into a pull request with the entry drafted and any screenshots downloaded into it; a maintainer reviews and merges, and the entry is live a couple of minutes later.

## Maintainers

[`docs/admin-guide.md`](docs/admin-guide.md) is the maintainer's manual: reviewing submissions, the content model, editing entries, and configuring the site. [`docs/launch.md`](docs/launch.md) covers first-time setup, and [`docs/configuration.md`](docs/configuration.md) the `_data/*.yml` files that drive everything.

> The catalog currently carries the demo entries the site shipped with — every page says so until they are cleared (`npm run eject:samples`, or the *Apply setup* issue form).

Built on the [Pub Health Catalog Template (PHCT)](https://github.com/crypticpy/phct); see [`docs/upgrading.md`](docs/upgrading.md) for pulling in template improvements.

### Ownership

The Big Cities Health Coalition owns this repository and the published site, through its GitHub organization [Big-Cities-Health-Coalition](https://github.com/Big-Cities-Health-Coalition). It moved there from `@crypticpy`'s account in September 2026. `@crypticpy` continues as the interim technical maintainer until BCHC names its own. [`docs/bchc/transfer-runbook.md`](docs/bchc/transfer-runbook.md) records how the move was done, and [`MAINTAINERS.md`](MAINTAINERS.md) lists who holds which role.

## What's next

[`docs/bchc/feature-ledger.md`](docs/bchc/feature-ledger.md) is the public record of where the catalog is going: what is being built now, what has been requested, and the design questions still to settle. Have an idea or feedback? Open a [feature request](https://github.com/Big-Cities-Health-Coalition/bchc-ai-use-case-catalog/issues/new?template=feature.yml) for catalog software capabilities, or email [info@bigcitieshealth.org](mailto:info@bigcitieshealth.org) for BCHC-specific suggestions — maintainers triage both into the ledger.

## Features

- **GitHub-as-CMS.** Anyone can propose an entry through a web form or a GitHub issue. Automation turns the issue into a pull request with the entry already drafted — screenshots downloaded into the entry folder and all — and a maintainer reviews and merges it.
- **Schema-driven content model.** One file, [`_data/schema.yml`](_data/schema.yml), defines every field an entry has, *and* how it is presented: which fields reach a catalog card and in which slot, which become filters, which appear in the sidebar, what each option's short label, icon and tone are. The submission form, the issue template, the cards, the filter rail, the search index, the wizard defaults and the validator all derive from it. See [`docs/content-model.md`](docs/content-model.md).
- **Search that reads the whole write-up.** Every entry is indexed per section, so a suggestion names the section it matched in, shows the sentence around the term and links straight to that heading; related entries are chosen by how distinctive a shared value is. An Atom feed of the newest entries lives at `/catalog/feed.xml`.
- **Built for evaluation, not browsing.** Cards are laid out to answer "could my team reuse this?" in about two seconds: a result line, a taxonomy chip family, and a signal strip for skills needed, data sensitivity, audience and readiness. Filters sit beside the results, restore from the URL, and announce their counts.
- **Compare and print a decision.** Shortlist up to three entries from the catalog and read them field by field at `/compare/`, with the rows they agree on folded away and the shortlist in the URL so it pastes into an email. One button prints the comparison — or any entry page — as a clean brief with the links spelled out and a source stamp. See [`docs/compare.md`](docs/compare.md).
- **Screenshots and links as first-class fields.** An `images` field gives an entry a gallery with a keyboard-navigable lightbox and honest alt text; a `links` field carries labelled resources — a shared drive folder, a recorded demo, a vendor page — without needing a field per link.
- **Two configurators.** A no-terminal setup wizard at `/setup/` on the deployed site, and an equivalent CLI wizard (`npm run setup`). Both offer starting presets (AI use case catalog, cohort/program portal, resource library, blank) and write the same configuration files from the same shared logic.
- **Governance on the site, not in a PDF.** A `governance` module publishes how review works (tiers, targets, criteria), who does what, and the standing policies — privacy, licensing, data governance, accessibility, maintenance, appeals, conduct — from one data file, [`_data/governance.yml`](_data/governance.yml). Deprecated entries are kept for the record rather than deleted, a contributor guide walks submitters through review from their side, and a `CODE_OF_CONDUCT.md` covers everyone. A monthly workflow counts submissions, publications, contributing organizations and review turnaround from the repository's own issues and pull requests into `_data/metrics.json`, and the page shows them as "How the catalog is doing" — no analytics vendor involved.
- **Modules.** Turn catalog, submit, carousel, stats, events, cohorts, resources and governance on or off independently; navigation and the home page adapt automatically, and pages under a disabled module are dropped from the build.
- **Theming.** Colors, fonts and corner rounding live in [`_data/theme.yml`](_data/theme.yml) and become CSS variables consumed by Tailwind — no CSS editing required for a rebrand. Every colour has one semantic job, so a re-skin cannot quietly break contrast.
- **Accessibility as a build rule, not a pass.** Nothing is signalled by colour or icon alone, every control has a visible focus ring and a ≥3:1 border, filter changes are announced once, and the whole catalog still works with JavaScript disabled.
- **CI content pipeline.** Front-matter and file-size validation on every pull request, automatic thumbnail generation from uploaded PDFs, and workflows that scaffold cohort years, events and schedule updates from issues. Scaffolded content pull requests are labelled at creation and use fixed title prefixes, so any code-review tool an organization turns on can be told to skip them — entries are data, not code. No review bot is required; see the [template admin guide](https://github.com/crypticpy/phct/blob/main/docs/admin-guide.md#bot-pull-requests) for how to configure one if you use it.

## Run your own

This site is one deployment of a reusable template. To stand up a catalog like it for your own organization:

1. **Create your own repository** from the [Pub Health Catalog Template](https://github.com/crypticpy/phct) (**Use this template** on GitHub, or clone it).
2. **Turn on the three settings**: Pages source (Settings → Pages → Source → **GitHub Actions**), pull requests for Actions (Settings → Actions → General → Workflow permissions → **Allow GitHub Actions to create and approve pull requests**), and the content labels (Actions tab → **Bootstrap labels** → *Run workflow*).
3. **Configure the site** — open `/setup/` on the deployed site for the browser wizard (no terminal), or run `npm install && npm run setup` locally. Both write `_data/site.yml`, `_data/theme.yml`, `_data/schema.yml`, `_data/navigation.yml`, `_config.yml` and `.github/ISSUE_TEMPLATE/new-entry.yml`, from the same four presets. With no terminal, paste the wizard's three `_data/*.yml` files into the **Apply setup** issue form and the automation opens the pull request for you.
4. **Clear the demo content** — ten fictional organizations, a sample events calendar, a sample cohort. Until they are gone every page carries a *Demo content* banner saying so. `npm run eject:samples` removes it all, turns the banner off and switches the `governance` module off until you have rewritten `_data/governance.yml` in your own words; the Apply setup issue has a checkbox that does the same thing.
5. **Commit and push.** `Build & Deploy` publishes to `https://<owner>.github.io/<repo>/`, working out `url`/`baseurl` on its own (root domain for a `<owner>.github.io` repo or a `CNAME` file, `/<repo>` otherwise); an explicit `url` in `_config.yml` always wins.

Each of those steps has a detail you will want on the day: **[`docs/launch.md`](docs/launch.md)** is the full tutorial — the same path with what breaks if you skip a step, a first test submission end to end, and the pre-launch checklist.

## How content gets in

1. A contributor fills out the **Submit** form (`/submit/`) — a stepped form that walks the schema's field groups one section at a time, with a short form that hides every optional question and a live preview of the card their entry will produce — or opens the **Submit a use case** GitHub issue form directly.
2. The form data becomes a GitHub issue labelled `content:new-entry`. Screenshots are dragged onto the issue at this point.
3. The `New entry from issue` workflow runs `scripts/new_entry_from_issue.mjs`, which reads `_data/schema.yml`, downloads any attached images into `catalog/<slug>/screenshots/` (up to 8 files, 15 MB total, PNG/JPEG/GIF/WebP), and opens a pull request containing `catalog/<slug>/index.md`. The pull request body carries the maintainer checklist — the review criteria from `_data/governance.yml`, the mechanics, the review-status flip — and, when an answer matches a field's `escalate_on` list in the schema (an unticked PII/PHI attestation, PHI under *Data it touches*, a public-facing audience), a **Closer review** block and the `review:data-governance` label.
4. Larger attachments — a `deck.pdf` — are added to the entry folder directly in that pull request. Any `file` field flagged `thumbnail: true` gets a `thumb.jpg` rendered from its first page automatically by the `Generate entry thumbnails` workflow.
5. A maintainer reviews the entry against the checklist in [`docs/admin-guide.md`](docs/admin-guide.md) — plain language, no protected data on screen, alt text present, links that open for outsiders — and merges. The site rebuilds and the entry is live within a couple of minutes.
6. Existing entries can also be edited directly on GitHub — every entry page has a **Suggest an edit on GitHub** link. When an edit lands on `main`, the deploy stamps the entry's `updated:` date itself.

### What an entry holds

The shipped AI use case schema has 40 fields in eight groups. In outline:

| Group | Fields |
|---|---|
| About | title, one-sentence summary, result in one line, organization, what is being shared, use case category, area of work, stage, review status (maintainer-only) |
| How it's built | how AI is involved, types of AI, AI tools & models, where it runs, vendor or partner |
| Reuse | skills needed to set it up, readiness, source code, live demo, documentation, other resources, screenshots, slide deck |
| Sharing & licensing | license, access terms, portability, portability notes |
| What it took | cost band, running cost, procurement, approvals, equity note |
| Data & access | no-PII/PHI attestation, data it touches, data sources, who sees the output, data governance notes |
| Contact | contact name, contact title, contact email |
| The story | the full write-up, which becomes the page body |

Every one of those is a line in `_data/schema.yml` and none of them is named anywhere else — rename, remove or replace the lot for a different subject and the forms, filters, cards and validator follow. [`docs/content-model.md`](docs/content-model.md) documents each property, the `images` and `links` shapes, and how to design a taxonomy that people actually filter by.

Cohorts and events follow the same issue → automation → pull request pattern (`content:new-year`, `content:schedule`, `content:event-attachments`, and the plain **Add event details** issue). See [`docs/admin-guide.md`](docs/admin-guide.md) for the maintainer side of all of this.

## Configuration overview

- **Branding, contact info, module toggles, home page copy** — `_data/site.yml`
- **Colors, fonts, corner rounding** — `_data/theme.yml`
- **Header navigation** — `_data/navigation.yml` (regenerated by the wizards from your modules, but hand-editable)
- **The entry content model** — `_data/schema.yml` (see [`docs/content-model.md`](docs/content-model.md))
- **Events, cohort years, resource library** — `_data/events.yml`, `_data/cohorts/<year>.yml`, `_data/resources.yml`
- **Search synonyms, tag aliases, facet landing pages** — `_data/search.yml` (see [`docs/search.md`](docs/search.md))

Full reference for every setting: [`docs/configuration.md`](docs/configuration.md). Every other document, and who each one is for: [`docs/index.md`](docs/index.md).

## Staying up to date

A fork is a copy, not a subscription: template releases do not reach you on their own. `.gitattributes` marks everything a deployment owns — `_config.yml`, `_data/*.yml`, content, images, and local operations records. The protected updater verifies two immutable PHCT releases, reconciles the complete template-owned tree to the target, and leaves those deployment paths untouched even though GitHub template repositories do not share commit history with PHCT.

```bash
git remote add template https://github.com/crypticpy/phct.git
git fetch template --tags
npm run upgrade:check -- --to v1.9.0-rc.5 # read-only: what this exact release changes, in two lists
```

The whole protected-update and manual-recovery recipe: [`docs/upgrading.md`](docs/upgrading.md).

## Local development

The exact supported versions live in `.ruby-version`, `.node-version`, `Gemfile.lock`, and
`packageManager` in `package.json`. `mise install` can install both runtimes from `mise.toml`; other
version managers can read `.ruby-version`, `.node-version`, or `.nvmrc`.

```bash
mise trust mise.toml # after inspecting the pinned runtime definitions
mise install          # optional; use any manager that installs the pinned versions
gem install bundler -v "$(cat .bundler-version)"
bundle install
npm ci
npm run doctor        # plain-language runtime, dependency, ownership, and generated-file checks

npm run dev       # http://127.0.0.1:4000/ with live reload — Tailwind watcher + jekyll serve in one terminal,
                  # regenerating the schema-derived files whenever _data/schema.yml or _data/site.yml changes
npm run build     # generate schema-derived files, build CSS, build the Jekyll site into _site/
```

`npm run dev -- --port 4001 --host 0.0.0.0` changes where it listens; output is prefixed `[css]`, `[jekyll]` and `[gen]`, and Ctrl-C stops everything. `npm run serve` and `npm run watch:css` still exist if you want the pieces separately.

Other useful scripts:

```bash
npm run setup      # configuration wizard (see Run your own)
npm run generate   # regenerate the issue template + configurator defaults, and sync _config.yml from _data/site.yml
npm run validate   # parse all _data/*.yml and run the front-matter / file-size checks CI runs on pull requests
npm test           # Node unit tests; `npm run test:ruby` for the Ruby validators
npm run test:build # build every preset and module combination and check the rendered copy (needs Ruby; minutes, not seconds)
npm run verify     # every non-browser release gate, including all preset/module builds
npm run a11y       # pa11y-ci (WCAG 2 AA) against _site served on :4173 — see CONTRIBUTING.md
npm run lighthouse # Lighthouse CI against the same local server
```

Contributing to the template itself? Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Repository layout

```
_config.yml              Jekyll build mechanics (title/description fall back to _data/site.yml)
_data/                   site.yml, theme.yml, schema.yml, navigation.yml, governance.yml, events.yml, resources.yml, cohorts/<year>.yml,
                         metrics.json (written monthly by the Catalog metrics workflow)
_layouts/, _includes/    schema-driven templates (entry cards, filters, field rendering, etc.)
_plugins/                schema_filters.rb (card/weight/group/option_meta rules), theme_filters.rb, search_index.rb (/search.json), events.rb, modules.rb,
                         showcase.rb (only active in a showcase build)
assets/js/configurator/  shared logic behind both configurators (core.js, presets/, setup-page.js + steps/ + wizard/)
assets/js/submit.js      turns the /submit/ form into a pre-filled GitHub issue URL
scripts/                 setup.mjs, generate.mjs, validate.mjs, build_showcase.mjs, and the issue-to-PR automation scripts
.github/workflows/       pages, validate, quality (a11y + Lighthouse), smoke, new-entry, thumbnails, new-year, new-event, update-schedule, update-event-attachments,
                         verification-sweep, metrics
.github/ISSUE_TEMPLATE/  new-entry.yml is generated — do not hand-edit it, run `npm run generate`
catalog/<slug>/index.md  published entries; screenshots live in catalog/<slug>/screenshots/
                         (ten sample entries ship with the template, marked `sample: true`)
cohorts/<year>/          cohort landing page + event pages (module: cohorts)
governance/              /governance/ — review process, roles and policies from _data/governance.yml (module: governance)
styleguide/              /styleguide/ — live rendering of the design system against your theme (noindex)
docs/                    index.md (start here), launch.md, admin-guide.md, contributor-guide.md, incidents.md,
                         configuration.md, content-model.md, search.md, images.md, upgrading.md, decisions.md,
                         glossary.md, design-brief.md, design-system.md, roadmap.md
quality/                 pa11y-ci and Lighthouse CI config, plus urls.js (shared URL discovery for both)
test/                    configurator/, plugins/, scripts/ and fixtures/ — Node's test runner + Ruby minitest
ARCHITECTURE.md          how the pieces fit; CONTRIBUTING.md — working on the template itself; SECURITY.md;
CODE_OF_CONDUCT.md       how contributors and reviewers engage (linked from the governance page)
```

## License

MIT — see [`LICENSE`](LICENSE).

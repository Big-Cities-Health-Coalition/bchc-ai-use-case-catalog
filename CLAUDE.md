# CLAUDE.md

Guidance for AI coding agents working in this repository — a Jekyll/GitHub Pages template where site behavior is driven by `_data/*.yml`, not hardcoded in templates or scripts.

**Which repo are you in?** This file is for work on the template itself. If you are in a *copy* — a repository created from this template that you were asked to configure for an organization — read `AGENTS.md` instead: it is the setup runbook, and this file's "keep it organization-agnostic" rule does not apply to a copy.

## What this is

A GitHub-Pages-hosted catalog template, shipped configured as a generic AI Use Case Catalog (the `ai-use-cases` preset, also served as the showcase example at `/examples/ai-use-cases/`). Keep it organization-agnostic: the health-coalition deployment it grew out of now lives in its own repository, `Big-Cities-Health-Coalition/use-case-catalog`, and no organization-specific names belong here. Content is authored through GitHub issues/PRs (see `docs/admin-guide.md`); there is no server and no database. Full docs: `README.md`, `docs/configuration.md`, `docs/content-model.md`, `docs/admin-guide.md`; the map of the repository family (this template, the BCHC deployment, deploy variables) is `docs/ecosystem.md` — keep it current when a repository is renamed, transferred or retired.

## The one rule that matters: the schema is the source of truth

`_data/schema.yml` defines every entry field. **Never hardcode a field name** in a layout, include, script, or workflow — read it from the schema instead. Everything downstream already does this: `_layouts/entry.html`, `_includes/entry-card.html`, `_includes/facet-filters.html`, `_includes/field-value.html`, `_plugins/search_index.rb`, `submit/index.md`, `scripts/new_entry_from_issue.mjs`, `scripts/check_front_matter.rb`, and `.github/ISSUE_TEMPLATE/new-entry.yml` (generated, don't hand-edit) all iterate `schema.fields` rather than naming specific keys. If you add a feature that needs a new per-entry attribute, add it as a schema field, don't bolt it on as a special case.

**After editing `_data/schema.yml`, run `npm run generate`** to regenerate `.github/ISSUE_TEMPLATE/new-entry.yml` and resync `_config.yml`'s title/description. CI runs this too, but a stale committed issue template is confusing — regenerate and commit it in the same change.

**Before finishing any change that touches `_data/*.yml` or `catalog/**/index.md` front matter, run `npm run validate`** (parses all `_data/*.yml`, then runs `scripts/check_front_matter.rb` and `scripts/check_file_sizes.rb`, the same gate `validate.yml` runs on every PR).

## Where things live

- `_data/site.yml` — branding, module toggles, home/footer/submit copy. `_data/theme.yml` — colors/fonts/radius. `_data/navigation.yml` — header links. `_data/schema.yml` — entry content model (see above).
- `_data/events.yml`, `_data/cohorts/<year>.yml`, `_data/resources.yml` — feature data for the `events`, `cohorts`, `resources` modules.
- `_plugins/modules.rb` — drops pages under a disabled module's path at `post_read`. `_plugins/events.rb` — merges site + cohort events into `site.data.events_all`. `_plugins/search_index.rb` — builds `/search.json` from schema fields marked `search`/`facet`. `_plugins/theme_filters.rb` — Liquid filters (`hex_to_rgb`, `facet_values`, `slugify_list`, `link_host`, `http_url`, `link_access`, `query_encode`). `_plugins/link_access.rb` — the host-rule matcher behind `link_access` (site.yml's optional `link_access` block), shared with `scripts/lib/link_access_check.rb`; `_includes/link-meta.html` renders its result.
- `assets/js/configurator/core.js` — shared logic behind **both** configurators (`/setup/` in-browser and `npm run setup` CLI): `renderFiles()` produces `_data/site.yml`, `_data/theme.yml`, `_data/schema.yml`, `_data/navigation.yml`, `_config.yml`, `.github/ISSUE_TEMPLATE/new-entry.yml`. `presets.js` holds the four starting presets. Edit shared behavior in `core.js` once, not in both wizards.
- `scripts/*.mjs` and `scripts/*.rb` — the issue→PR automation (`new_entry_from_issue.mjs`, `new_event_from_issue.mjs`, `scaffold_year.rb`, `update_schedule_from_issue.rb`, `update_event_attachments_from_issue.mjs`, etc.). Each is invoked by a matching `.github/workflows/*.yml` and reads `ISSUE_BODY`/`ISSUE_TITLE` env vars, not GitHub API calls.

## Liquid gotchas specific to this codebase

- **Assigns inside an included template leak into the parent scope.** Jekyll's `{% include %}` shares the caller's Liquid variable scope (unlike Shopify's sandboxed `render`). Reusing a common variable name (`v`, `entries`, `f`) inside an include can silently clobber a variable of the same name in whatever page/layout included it. Prefer distinctive names inside `_includes/*.html`.
- **`x.first` (not `x.size` or a type check) is the idiom used to detect "is this an array"** for a field whose value could be a scalar (`text`/`select`) or a list (`list`/`multiselect`), e.g. `{% if v.first %}{% for x in v %}…{% else %}{{ v }}{% endif %}` in `_includes/facet-filters.html`, `index.md`, `_layouts/entry.html`. A bare string's `.first` is `nil` (falsy), an array's `.first` is truthy unless the array is empty. Follow this pattern rather than introducing a different array check.
- **An empty string is truthy in Liquid**, so `{% if include.cta_url %}` is true for a caller that passed `cta_url=''` to switch the CTA off. Optional include params that a caller may blank out are tested with `!= ''` (see `_includes/empty-state.html`), never for bare truthiness.
- **`{% include %}` parameters cannot use bracket/dynamic access directly** — `{% include x.html field=site.data.cohorts[page.year] %}` does not work. Assign to a variable first, then pass the variable: `{% assign year_key = page.year | append: '' %}{% assign data = site.data.cohorts[year_key] %}{% include timeline.html events=data.events %}` (see `_layouts/cohort.html`, `_layouts/event.html`). The `append: ''` is also load-bearing — it coerces `page.year` to a string so the hash lookup matches YAML string keys.

## Conventions

- Match the schema's `facet`/`card`/`search`/`group`/`placement` semantics exactly as documented in `docs/content-model.md` — they have precise meanings consumed by multiple templates, not just descriptive labels.
- Front matter files are validated structurally (`check_front_matter.rb`): `slug` must equal the folder name, `published` must be `YYYY-MM-DD`, required fields must be non-blank, `select`/`multiselect` values must be in `options`. Keep generated/edited entries consistent with this or CI will fail the PR.
- Don't hand-edit `.github/ISSUE_TEMPLATE/new-entry.yml` — it's regenerated from the schema and marked as such at the top of the file.

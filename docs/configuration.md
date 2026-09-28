# Configuration reference

Everything that controls branding, theming, navigation, search and modules lives in `_data/*.yml`. `_config.yml` is kept to Jekyll build mechanics (plugins, excludes, permalink style) — its `title`/`description` are SEO fallbacks kept in sync with `_data/site.yml` by `npm run generate` and the setup wizards.

You can edit these files by hand, or use one of the two configurators described at the end of this page.

## `_data/site.yml`

### Identity

| Key | Purpose |
|---|---|
| `name` | Site name, used in the header/footer and page titles. |
| `tagline` | Short line under the site name. |
| `description` | Used for SEO tags and the Atom feed; also copied into `_config.yml`. |
| `organization.name` / `short_name` / `url` / `contact_email` | Shown in the header eyebrow, footer, about page, and as the email fallback for submissions. |
| `logo.image` | Path to an SVG/PNG under `assets/images`, or blank. |
| `logo.text` | Text mark shown when `logo.image` is blank. |

### Illustrations and social image

Every key below is optional and ships blank: each surface renders its built-in flat
treatment until you point the key at artwork of your own (put files under
`assets/images/illustrations/` and run `npm run images -- assets/images/illustrations`
for responsive derivatives — the bare command only walks the catalog's entry folders) —
the site is fully functional with all of them empty. Each takes a site-relative image
path. All are decorative: the copy beside each one carries the meaning, so they render
with empty alt text and never replace information.

```yaml
images:
  empty_catalog: ""   # "nothing published yet" panels (home + catalog)
  empty_search: ""    # the catalog's zero-results-for-these-filters panel
  empty_events: ""    # the events page when nothing is scheduled
  not_found: ""       # the 404 page
  wizard_complete: "" # the setup wizard's success moment on its Review step

social:
  og_image: ""        # link-preview card for chat apps and social sites (1200x630)

events:    { image: "" }   # wide banner (about 20:7) under the events page header
resources: { image: "" }   # same banner on the resources page
about:     { image: "" }   # illustration floated beside the about page's opening copy
```

`social.og_image` needs `url:` set in `_config.yml` to resolve to an absolute address, and a
page can override it with `image:` in its own front matter. Two more surfaces have their own
keys where their copy lives: the home hero takes `hero.image` (see
[Home page copy](#home-page-copy)) and the submit page takes `submit.image` /
`submit.closed_image` (see [Submit form copy](#submit-form-copy)); the governance and cohort
pages read `image` from [`_data/governance.yml`](#_datagovernanceyml) and
`_data/cohorts/<year>.yml` respectively, and an optional background texture lives in
[`_data/theme.yml`](#_datathemeyml) as `texture`.

### GitHub repository

```yaml
github:
  repository: "owner/repo"
  branch: "main"
```

Used to build the `/submit/` form's GitHub issue URL, the "Suggest an edit on GitHub" and "Report an issue" links on entry pages, and the "Watch the repository" links throughout. **Update this after using the template** — it does not infer itself from where the site is actually hosted. The CLI wizard (`npm run setup`) fills the question in from your git remote; the browser wizard at `/setup/` cannot detect it at all, so on its **Basics** step (site and organization identity), under *GitHub*, check that the **Repository** field says *your* `owner/repo` and not the template's before you continue. A hand-edited `_data/site.yml` is entirely up to you. The `Validate Content` check fails any pull request where this key still names another repository, so a copy that skips it will not merge.

### Demo mode

```yaml
demo: true
demo_starter_url: ""
demo_message: ""
```

While `demo` is `true`, every page carries a **Demo content** banner
(`_includes/demo-banner.html`) saying the content is the template's sample data, linking to
`/setup/` and the launch guide. It ships on, because a fork deployed unchanged is a site full of
fictional health departments with nothing to say so.

`demo_starter_url` is optional. Set it to a copy of the template that has already been through
[launch.md](launch.md) — configured, samples removed, one entry — and the banner adds "See what a
fresh copy looks like on day one" with that link. It ships blank, which drops the sentence. It is
only read while `demo` is `true`, so there is nothing to clean up once the banner is off.

`demo_message` is optional too. Set it when a deployment keeps the banner on while its own
content is still provisional, and the template's "Configure it or follow the launch guide"
sentence would send readers to a wizard they have no use for. It replaces that whole sentence,
the setup, launch-guide and starter-site links with it, and is written as inline markdown, so a
plain string works and so does a link:

```yaml
demo_message: "Entries are drafts until the [review panel](https://example.org/review-panel) signs them off."
```

The **Demo content** label stays. Blank or absent, the banner shows the default sentence. Like
`demo_starter_url`, it is only read while `demo` is `true`.

It is turned off by whatever removes the content: `npm run eject:samples`, the **Remove the demo
content** checkbox on the Apply setup issue, or `npm run setup`'s last question. Delete the key
entirely once the catalog is yours — a missing `demo` is the same as `false`. The same step
switches the `governance` module off, because `_data/governance.yml` is a worked example rather
than sample rows (see [`_data/governance.yml`](#_datagovernanceyml)).

The banner is deliberately quiet: a warn-tinted band above the header, one line, no dismiss button.
It has to be impossible to miss, but it sits on every page of the site, so it must not read as an
error.

### Modules

```yaml
modules:
  catalog: true      # Browsable, filterable catalog of entries (the core)
  submit: true        # Public "Submit an entry" web form -> GitHub issue -> PR
  carousel: true       # Featured entries carousel on the home page
  stats: true       # Headline numbers on the home page
  events: true      # Events calendar (agenda list) from _data/events.yml
  cohorts: true     # Cohort / program-year pages with timelines & materials
  resources: false      # Curated resource library from _data/resources.yml
  governance: true    # /governance/ — review process, roles and policies from _data/governance.yml
```

Each toggle does three things:

1. Removes (or restores) the module's link from the header, via `_data/navigation.yml`'s `module:` key.
2. Shows or hides the module's block on the home page (`index.md` checks `cfg.modules.<name>`).
3. **Removes the module's pages from the build entirely.** `_plugins/modules.rb` runs on `post_read` and drops any page whose URL starts with the module's path prefix when that module is off — those pages are not built, not in the sitemap, and not in `search.json`. Prefixes come from `_data/modules.yml` (`/cohorts/`, `/events/`, `/governance/`, `/resources/`, `/submit/`); `catalog`'s prefix is derived from the schema's `entry.path` instead, since it has to track the configured entry folder. Turning the module back on brings its pages back on the next build without further changes.

The shipped `ai-use-cases` configuration has `catalog`, `submit`, `carousel`, `stats` and `governance` on, and `events`, `cohorts` and `resources` off. Sample data for the three off-by-default modules still ships in `_data/`, so turning one on gives you something to look at immediately.

### Home page copy

```yaml
hero:
  image: ""   # optional wide illustration layered into the hero's dark ground —
              # it fades in toward the right so the headline stays on a calm
              # surface; blank keeps the built-in gradient-and-dot-grid treatment
  eyebrow: "…"
  title: "…"
  lead: "…"
  primary_cta:   { label: "…", url: "/catalog/", module: catalog }   # `module` is optional:
  secondary_cta: { label: "…", url: "/submit/",  module: submit }    # the button hides while that module is off

home:
  featured_count: 6   # entries shown in the carousel (featured: true first, then newest, until this many)
  recent_count: 6     # entries shown in the "Recently added" grid (see note below)
  hero_latest_count: 3 # newest entries listed beside the hero at ≥1024px (0 hides the panel)
  highlights:          # optional 3-up value propositions (a title and one sentence each, set as text over a hairline); leave the list empty to hide the section
    - title: "…"
      body: "…"
```

When the hero panel and the featured carousel are both on, the "Recently added" grid is shown only below 1024px — at desktop widths the hero list already carries the newest entries and the carousel already shows cards, so the grid would say "new" a third time above the fold. Set `hero_latest_count: 0` (or turn the `carousel` module off) to get the grid back at every width.

The home page also shows a headline stat block (module: `stats`), an entries-by-facet browse grid (up to four facet fields with fixed options — the ones also shown on the card as a badge, chip or signal glyph come first, in schema order, and other facets fill the remaining tiles), and an events/cohorts summary row — all computed automatically from the schema and data, nothing further to configure.

### Submit form copy

```yaml
submit:
  accepting: true           # false pauses intake without removing the page (see below)
  image: ""                 # optional illustration beside the form's introduction
  closed_image: ""          # optional illustration on the paused-state notice
  closed_message: ""        # replaces the default paused-state copy when set
  intro: "…"               # shown above the form
  turnaround: "…"           # the last step of "what happens next": what happens after a maintainer picks it up
  review_note: "…"          # safety callout beside the form, and the first block of the GitHub issue form
  fallback_email: "…"       # the "Email it instead" button
```

`accepting: false` replaces the form with a "Submissions are paused" notice — using
`closed_message` and `closed_image` when set — while keeping the page and its nav link, so
bookmarks and inbound links keep working during a review freeze. The email route
(`fallback_email`, or `organization.contact_email`) stays offered. A `site.yml` without the
key keeps accepting: only an explicit `false` pauses.

`turnaround` is a promise printed on the submission page and repeated in the
"check your answers" panel, so make it one you can keep — "usually within two
weeks" beats "within 48 hours" you will miss.

The "Email it instead" button only renders when there is an address to send to:
`submit.fallback_email`, or `organization.contact_email` when that is blank.
Clear both to drop the button and send everyone through GitHub.

The shape of the form follows the schema, with nothing to configure here: when
`schema.groups` has more than one group the form opens as one step per group
(Back/Next, with the progress rail jumping between steps), and a "Hide the
optional questions" toggle offers a required-only short form whenever the
schema has optional fields. See
[content-model.md → Groups](content-model.md#groups).

### Catalog behaviour

```yaml
catalog:
  verify_after_days: 365       # how long an entry may go unconfirmed before the page says so
  refresh_mentions: []         # who every refresh reminder mentions, beside the entry's own submitter
  refresh_max_new_issues: 20   # most refresh issues one monthly sweep may open
```

`verify_after_days` is the window an entry is trusted for. An entry is "confirmed"
on the newest of its `verified`, `updated` and `published` dates, so a new catalog
shows no notices at all; past the window the entry page carries a quiet note and a
**Still accurate? Confirm it** link, and the monthly sweep opens a reminder issue.
Raise it for a slow-moving catalog. The site and the sweep read the same number, so
they cannot disagree.

`refresh_mentions` is the standing audience for those reminders — usernames or
teams, with or without the leading `@` (`["catalog-maintainers", "@org/data-governance"]`).
The submitter is mentioned automatically when they left a GitHub username on the
entry; this list is who hears about it when nobody answers. Empty is a fine
answer: the issue is still opened and still labelled `verification`.

`refresh_max_new_issues` caps how many *new* reminders one run may open, so a
backlog does not arrive as one wall of notifications. Existing reminders are always
refreshed and never counted against it; deferred entries are named in the run
summary and picked up next month, oldest first. See
[admin-guide.md](admin-guide.md#the-monthly-verification-sweep) for the whole loop.

### Link access

Optional. Some links on a catalog point at places not every reader can open, such as
a members-only project workspace (Basecamp, a shared drive, an intranet). Other links
are big files kept outside the repository. `link_access` labels those links from
their host, so a reader knows before clicking that a link asks them to sign in. The
site never contacts the host: a rule matches the URL's text, nothing more.

```yaml
link_access:
  levels:                          # who can open a link; a name an item's `access:` can repeat
    members:
      label: "Members only"        # required: the chip beside the link
      icon: lock                   # optional: any name on the Names: line of _includes/icon.html
      note: "Sign-in required."    # optional: screen-reader text on the link, and a line under the row
      request_url: "https://example.org/join"   # optional: a "Request access" link under the row (http(s) or mailto:)
  hosts:                           # first match wins, so put the narrow rules first
    - { match: "3.basecamp.com/p/", name: "Basecamp" }               # public share links: named, no level
    - { match: "3.basecamp.com", name: "Basecamp", access: members }  # everything else there needs a sign-in
    - { match: "github.com/your-org/your-catalog/releases/download/", name: "File library", download: true }
```

- **`match`** is a host plus an optional path prefix, written without `https://`.
  The host covers itself and its subdomains (`example.org` covers `files.example.org`
  but not `notexample.org`). When there is a path, the URL's path must start with it.
  Only `http(s)` URLs are matched. The URL is read the way a browser reads it: the
  host ignores case, a trailing dot and any `user@` part, and dot segments are
  resolved before the path test, so `/p/../private` is tested as `/private` and does
  not slip under a `/p/` carve-out.
- **`name`** replaces the bare host on the link's host line ("Basecamp", not
  "3.basecamp.com"). If it is left out, the host is shown.
- **`access`** names a level. A rule without one still names the host but adds no
  chip. Use that for a public carve-out, such as share links on the same host, and
  put it before the members-only rule.
- **`download: true`** adds a *Download* chip: the link is a file, not a page. Use
  it for the release that holds your large files (see
  [admin-guide.md](admin-guide.md#large-files)).
- An item in a `links` field (or in `_data/resources.yml`) can set its own
  `access: <level>`, which overrides its host rule. Use it for a link whose host
  says nothing about who can open it. See
  [content-model.md](content-model.md#links).

A labelled link shows three things: the rule's name in place of the host, the
level's chip, and the level's note as screen-reader text inside the link, so
"sign-in required" is part of what a screen reader announces.

Where the link is a row (a `links` item, the reuse card, a `file` field that holds a
URL, an event attachment, a cohort material, a resources item), the note and the
*Request access* link go on a line under the row, outside the link. A `url` field
renders inline or as a button, so it carries the chip and the screen-reader note only.

Event attachments, cohort materials and resources rows show no host line today, so
they only gain one when a rule (or, for resources, an item's `access:`) applies.

`npm run validate` checks the block's shape:
- level names are lowercase;
- every level has a label;
- every icon exists;
- `request_url` is http(s), mailto: or blank;
- every rule has a `match` that starts with a host name and has no scheme;
- a rule's `access` names a level;
- `download` is true or false;
- every item `access:` names a configured level. Without a `link_access` block, item
  `access:` keys are not checked at all.

It also warns about an entry whose every link resolves to a level: nobody outside
the organization could open any of them. Setting `entry.require_public_link: true`
in `_data/schema.yml` turns that warning into a failure (see
[content-model.md](content-model.md#review-status-and-deprecation)).

Leave the key out and nothing changes: every page renders exactly as it did before
the feature existed.

### Footer

```yaml
footer:
  about: "…"
  links:
    - { label: "…", url: "…" }
    - { label: "…", url: "/submit/", module: submit }   # hidden when that module is off
  copyright: "…"
  accessibility: "…"   # optional one-line accessibility statement in the bottom bar
```

A footer link may carry `module:`, the same way an item in `_data/navigation.yml`
does: the link is only rendered when that module is enabled under
`site.modules`. Use it for every link that points at a page a module owns
(`/submit/`, `/events/`, `/cohorts/`, `/resources/`, `/governance/`) so turning the module off
does not leave a link to a page that is no longer built. Links without
`module:` — an organization homepage, a maintainer guide — always render.

`footer.accessibility` is an optional sentence for the bottom bar ("This site
is built to WCAG 2.1 AA … tell us and it will be treated as a defect"). When the
`governance` module is on and `_data/governance.yml` has a policy with
`id: accessibility` it is followed by a *Read the accessibility statement* link
to `/governance/#accessibility`; leave the key blank to drop the line. The
bottom bar also carries a *Feed* link to the catalog's Atom feed whenever the
catalog has entries — the visible twin of the `<link rel="alternate">` in
`<head>`, guarded by the same emptiness test.

### Analytics

```yaml
analytics:
  plausible_domain: ""   # e.g. "catalog.example.org" — leave blank to disable
```

When set, `_includes/head.html` injects the Plausible `<script data-domain>` snippet. No other analytics provider is wired up.

## `_data/theme.yml`

```yaml
colors:
  primary: "#1D4E89"        # interactive only: links, buttons, active filters, focus ring
  primary_dark: "#12305A"   # hero + footer ground, headings on light surfaces
  secondary: "#0F6357"      # taxonomy identity (chip dots, secondary icons); AA on white
  accent: "#E07A2F"         # "Featured" only
  ink: "#1B2430"            # body text
  muted: "#5A6573"          # secondary text (AA on white)
  line: "#D9E0E8"           # dividers and card borders
  line_strong: "#7C8A9B"    # borders of interactive controls — inputs, pills, checkboxes
  surface: "#F5F7FA"        # page background
  surface_tint: "#EAF0F7"   # tinted bands and panels (browse band, fact strip, rail cards)
  card: "#FFFFFF"           # card background
  on_dark: "#F7F9FC"        # text on primary_dark backgrounds
  warn: "#B45309"           # caution only: sensitive-data indicators, validation errors

fonts:
  heading: "PHCT Serif"  # bundled: "PHCT Serif", "PHCT Sans", "Inter"; any other name needs google_fonts_url
  body: "Inter"
  google_fonts_url: ""       # a Google Fonts <link> href, when using a non-bundled font

radius: "soft"                # sharp | soft | round

texture: ""                   # optional site-relative path to a tileable pattern image
```

`texture` layers a repeating tile (at 480px wide) over the tinted bands, the home page's
closing panel, the footer's dark ground and the slim keel on imageless catalog cards. Any
subtlety — low opacity, low contrast — is baked into the tile file itself; the CSS applies it
as-is, so point it at a small compressed file (the shipped default is the 400px WebP
derivative of the template's woven tile, not the megabyte source PNG — the tile is nearly
transparent, so weight matters far more than resolution). Blank keeps every one of those
surfaces plain.

Colors are hex values. `_includes/theme.html` converts each one to an `R G B` triple (via the `hex_to_rgb` Liquid filter in `_plugins/theme_filters.rb`) and emits them as CSS custom properties (`--c-primary`, `--c-line-strong`, `--c-warn`, …) that Tailwind's `rgb(var(--c-x) / <alpha>)` utility classes read — so changing a hex value here re-themes the whole site on the next build, no CSS edits required. Keep text/background pairs at WCAG AA contrast (4.5:1 for body text); the setup wizards warn if `on_dark` on `primary_dark` falls under 4.5:1, and `npm run validate` fails if `ink`, `muted` or `primary` fall under 4.5:1 on `surface_tint`.

Headings default to the bundled PHCT Serif over an Inter body. For an all-sans site set
`fonts.heading: "PHCT Sans"` — the wizard's Look step offers all three bundled families. PHCT
Serif and PHCT Sans are renamed, modified OFL subsets of Adobe's Source families; see
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md). The renderer accepts the legacy values
`Source Serif 4` and `Source Sans 3` so an older protected `theme.yml` keeps the same appearance,
but new configuration should use the PHCT family names.

Each color has one job, and the templates rely on that (see [`docs/design-brief.md`](design-brief.md)):

| Token | Used for | Do not use it for |
|---|---|---|
| `primary` | Links, primary buttons, the active filter state, focus rings | Decorative fills or headings |
| `secondary` | Taxonomy identity — a chip's dot or icon | Tinted text on a tinted background |
| `accent` | The "Featured" marker | General emphasis |
| `warn` | Sensitive-data indicators, validation errors, anything a reader must not miss | Emphasis. If everything warns, nothing does. |
| `line` | Dividers and resting card borders | Input borders — they need `line_strong` |
| `line_strong` | Borders of controls the user can operate: inputs, filter pills, checkboxes | Dividers |

`line_strong` and `warn` exist for contrast reasons. WCAG requires non-text UI boundaries to reach 3:1, which `line` deliberately does not — it is a hairline. Any control a user can click or type into needs `line_strong` or darker.

`radius` maps to a five-step scale (`--radius-sm` … `--radius-2xl`) used across cards, buttons and inputs: `sharp` = 0.25 / 0.375 / 0.5 / 0.75 / 1 rem, `soft` = 0.5 / 0.75 / 1 / 1.25 / 1.75 rem, `round` = 0.75 / 1 / 1.5 / 2 / 2.5 rem (see `_includes/theme.html`).

Colours, fonts and radius are read at build time by `_includes/theme.html`, so a `theme.yml` edit shows up on the next Jekyll build with no CSS rebuild. `npm run build:css` is only needed when you change component CSS under `assets/css/` or `tailwind.config.js`.

### Elevation and motion

Not configurable in `_data/theme.yml`, but worth knowing before you write custom CSS: the design system uses exactly two shadows (`shadow-e1` for card hover, `shadow-e2` for sticky bars, sheets and popovers) and nothing else — structure comes from `line` and spacing. Motion is 120ms for state changes, 180ms for hover and expand, 240ms for a sheet, easing `ease-brand`, animating only `transform` and `opacity`. `prefers-reduced-motion` turns transforms and slides instant and stops carousel autoplay; colour and opacity transitions stay, and focus rings never animate.

### Light mode only

There is no dark palette and no `prefers-color-scheme` handling. A single set of tokens keeps every preset verifiable for contrast, and a template that re-skins for six different organizations is hard enough to keep accessible in one mode. If you need a dark site, invert the tokens themselves — `surface`, `card`, `ink`, `on_dark` — rather than adding a second theme.

## `_data/navigation.yml`

A flat list of header links:

```yaml
- label: Catalog
  url: /catalog/
  module: catalog   # optional — item is hidden when this module is off
  style: button       # optional — renders as a filled button instead of a text link
```

Regenerated by both setup wizards from your module toggles and entry naming, but safe to hand-edit afterwards (edits are not overwritten unless you re-run a wizard).

## `_data/search.yml`

Optional. Four blocks — `synonyms` (query-side word pairs), `concepts` (bounds on the term
relatedness the build derives from your own prose), `aliases` (the words a reader might type for a
given tag) and `landing` (bounds on the generated facet landing pages and the A–Z directory). Delete
the file and the site still builds, with no synonyms, the concept defaults below, no aliases, and a
landing page for every facet value.

```yaml
synonyms:
  chatbot: ["chat assistant", "conversational"]   # bidirectional
concepts:
  enabled: true         # false: derive no map and ship none
  min_entries: 12       # below this the corpus statistics are noise
  min_df: 2             # a word only one entry uses relates to nothing
  max_df_ratio: 0.5     # a word more than this share of entries use says nothing
  terms_per_entry: 40   # distinctive words paired per entry (bounds the build)
  min_pairs: 2          # entries that must agree before a pair counts
  min_score: 0.35       # normalised PMI, -1..1 — raise it for a tighter map
  max_related: 6        # related words kept per word
  max_terms: 1500       # words kept in the map at all
  weight: 0.9           # where a concept hit sits vs. the WEAKEST literal hit (max 1)
  max_expansions: 4     # most concept words added to any one query
aliases:
  ai_types:
    "Chat assistant": ["chatbot", "virtual assistant"]
landing:
  enabled: true       # false: no landing pages (the A–Z page still lists entries)
  exclude: []         # facet field keys to skip — use it for free-text facets
  max_values: 200     # a field with more distinct values than this is skipped and logged
  min_entries: 1      # skip values carried by fewer entries than this
  max_entries: 24     # how many entries one landing page lists
```

`concepts` needs nothing written by hand — the map comes from the catalog's own text at build time,
and a concept match is always ranked below every literal one, so the knobs are bounds rather than
content. `landing` is the knob to reach for when the build gets slow: every generated page costs
render time. Full reference, and how the search box uses all of it: [`search.md`](search.md).

## `_data/governance.yml`

Everything on `/governance/` comes from this file; the page (`governance/index.md`) has no copy of its own. Every block is optional — an empty list drops its section, and the "On this page" list is built only from blocks that render — so a fork can start from one policy and grow.

```yaml
eyebrow: "Governance"
title: "How this catalog is governed"
summary: "…"                    # one paragraph under the title
image: ""                       # optional illustration beside the intro (blank = text-only)
intro: |                        # Markdown
  …
review:
  intro: "…"
  steps:                        # numbered timeline; `target` is optional
    - { name: "Intake triage", who: "Intake Team · Tier 1", target: "about 5 business days", body: "…" }
  criteria_intro: "…"
  criteria:                     # the checklist reviewers apply
    - { name: "Completeness", body: "…" }
roles_intro: "…"
roles:
  - { name: "Governance Committee", body: "…" }
policies:                       # one section each; `id` is the anchor
  - { id: accessibility, title: "Accessibility and quality", body: "…" }
outro: "…"                      # closing paragraph beside the contact button
```

`body` fields are Markdown. Policy `id`s become section anchors, so keep them stable once published — the footer links to `#accessibility` when a policy with that id exists, and outside pages may link to any of them; do not reuse the page's own section ids (`review`, `criteria`, `roles`, `questions`). The closing block renders a mail button from `organization.contact_email` and links to the repository's `docs/contributor-guide.md` and `CODE_OF_CONDUCT.md`, built from `github.repository`/`github.branch`, so a fork's links point at the fork.

It ships with an invented public-sector community of practice's text as a worked example. Unlike `events.yml` and `resources.yml`, it is not sample rows that can be emptied — an empty file would render a page of bare headings — and it names one community's committees and timelines, so `npm run eject:samples` (and the wizard's *Remove the demo content* step) switch the module off (`governance: false` in `_data/site.yml`) rather than touching the file. Rewrite it in your own words, then turn the module back on.

### Optional keys the metrics block reads

`metrics_intro` — one sentence above the "How the catalog is doing" figures, replacing the default *Counted from this repository's own issues and pull requests, refreshed monthly.* The block itself renders only when `_data/metrics.json` exists (below); the section id `metrics` is reserved alongside `review`, `criteria`, `roles` and `questions`.

## `_data/metrics.json`

Written, not authored: `scripts/metrics.mjs` counts the last four calendar quarters of entry-form submissions (issues labelled `content:new-entry`), entry pull requests merged (branch `entry/…`), distinct contributing organizations (the field named by `entry.contributor_key` in `_data/schema.yml`, across live entries — no key, no figure) and review turnaround (issue opened → pull request merged, median and 90th percentile), from this repository's own issues and pull requests through two read-only REST calls. The **Catalog metrics** workflow (`.github/workflows/metrics.yml`) runs it on the 2nd of every month, commits the file when the figures changed and dispatches a deploy; the governance page renders it as "How the catalog is doing" and hides the block while the file is absent. Run it by hand with `GITHUB_TOKEN=$(gh auth token) node scripts/metrics.mjs` (`--dry-run` prints instead of writing; `--quarters N` widens the window). Stop the schedule with the repository variable `CATALOG_METRICS=false` (a manual run from the Actions tab still works, and its **Preview only** box shows the figures without committing). Keys: `generated`, `window` (`from`, `to`, `quarters`), `totals` (`submissions`, `published`, `organizations` — `null` without a `contributor_key` — `entries`, the live-entry count, and `turnaround_days` with `count`/`median`/`p90`), and `quarters`, oldest first, each with `quarter`, `from`, `submissions`, `published`, `organizations`. The template ships **sample figures** (marked `"sample": true`, consistent with the ten sample entries) so the demo shows the block; `npm run eject:samples` deletes the file, the file is `merge=ours` for a fork that keeps it, and your first monthly run writes yours.

## `_data/security_signals.json`

Written, not authored, and observations rather than verdicts. This catalog **links** to third-party code; it does not host, run or audit it, and nothing in this file says any project is safe to deploy. `scripts/security_signals.mjs` reads each live entry's repository link — the `url` field named by `entry.repo_key` in `_data/schema.yml`; no pointer, no sweep — keeps the ones matching `https://github.com/<owner>/<repo>`, and records per entry: whether the repository still resolves, whether it is `archived`, the day it was last pushed to, the owner's `type`, the SPDX `license` GitHub identified, whether a security policy is published, and the public [OpenSSF Scorecard](https://scorecard.dev) score, date and a few notable checks. A repository link on any other host is recorded as `applicable: false` with a reason rather than dropped in silence. Every individual call may fail without failing the run: a rate limit or a network blip records the string `"unavailable"`, and a Scorecard **404 records `scorecard: null`** — "no public score", which is the normal answer for a small public-sector repository nobody has crawled.

The **Security signals** workflow (`.github/workflows/security-signals.yml`) runs it at 08:00 UTC on the 3rd of every month — after the verification sweep on the 1st and the metrics run on the 2nd — and opens or updates one `automation/security-signals` pull request when anything moved; unchanged observations open nothing. Run it by hand with `GITHUB_TOKEN=$(gh auth token) node scripts/security_signals.mjs` (`--dry-run` prints instead of writing; `--today YYYY-MM-DD` and `--out PATH` are the other flags). Stop the schedule with the repository variable `SECURITY_SIGNALS=false` (a manual run from the Actions tab still works, and its **Preview only** box shows the observations without committing).

Keys: `generated_at`, and `entries` keyed by entry slug. Each record carries `applicable`, `fetched`, `repo` (`owner/name`) and `url`; an applicable one adds `exists`, `archived`, `pushed_at`, `owner_type`, `license`, `security_policy`, `scorecard` (`{score, date, checks: [{name, score}]}`, or `null` for no public score, or `"unavailable"`) and `errors`. Slugs and keys are sorted, so two runs that observed the same things produce the same bytes and the monthly pull request is never noise. The file is capped at 256 KiB: over that, Scorecard detail is shed before any repository is, and a run that still cannot fit adds `truncated` rather than quietly holding less than it claims. The template ships **sample observations** (marked `"sample": true`, describing the demo entries) so the demo shows the card; `npm run eject:samples` deletes the file, and your first monthly run writes yours. The entry page's "Security signals" card renders only where this file has an applicable record; the one-line "run your own security review" disclaimer renders on every entry with a repository link, with or without it. What the three values of the maintainer-set `security_review` field mean is in [admin-guide.md](admin-guide.md#security-review).

## Modules in detail

| Module | Turns on | Turns off / removes when disabled |
|---|---|---|
| `catalog` | The entry grid, filters and search at `/<entry.path>/` (default `/catalog/`), the generated browse pages (`/<entry.path>/a-z/` and one per facet value — see [`search.md`](search.md)), and an Atom feed of the newest 25 entries at `/<entry.path>/feed.xml` (one `<category>` per facet value; advertised in `<head>` only when the catalog has entries) | All entry pages, the catalog index, the browse pages and the feed are dropped from the build |
| `submit` | `/submit/` web form | The submit page and its nav link |
| `carousel` | Featured-entries carousel on the home page | (home page section only; no pages removed) |
| `stats` | Headline stat block in the hero | (home page section only) |
| `events` | `/events/` calendar, home page "Upcoming events" card | Event pages under `/events/` |
| `cohorts` | `/cohorts/` index and `/cohorts/<year>/` pages, cohort filter facet on entries with a `cohort` field | All cohort and cohort-event pages |
| `resources` | `/resources/` curated link library from `_data/resources.yml` | The resources page |
| `governance` | `/governance/` — how review works, who does what, and the standing policies (privacy, licensing, data governance, accessibility, maintenance, appeals, conduct) from `_data/governance.yml`; the *Governance* nav link, the governance paragraph on `/about/` and `/submit/`, and the footer's *Read the accessibility statement* link | The governance page and every link to it |

## The three ways to configure

All three read/write the same seven files (`_data/site.yml`, `_data/theme.yml`, `_data/schema.yml`, `_data/navigation.yml`, `_config.yml`, `.github/ISSUE_TEMPLATE/new-entry.yml`, `.github/ISSUE_TEMPLATE/config.yml`) using the same shared logic in `assets/js/configurator/core.js`, so they always produce equivalent output.

Their starting point — the defaults both wizards open with — is not hand-maintained JavaScript. `assets/js/configurator/defaults.generated.js` is produced from `_data/site.yml`, `_data/theme.yml`, `_data/schema.yml` and `_data/navigation.yml` by `npm run generate`, so the wizards can never drift from the YAML that actually builds the site. Do not edit it; a `--check` run in CI fails the build if it is stale.

### `/setup/` — browser wizard

A no-terminal step-by-step wizard on the deployed site (`setup/index.md` + `assets/js/configurator/setup-page.js`), for maintainers without local dev tooling. It:

- Loads the site's current configuration (embedded as JSON in the page) so you're editing forward from what's live, not starting over.
- Offers the same four presets as the CLI: **AI use case catalog**, **Program / cohort portal**, **Resource library**, **Blank catalog**.
- Lets you edit branding, colors/fonts, module toggles, and the schema's field list (including adding/renaming/removing fields) with validation.
- Asks its branding questions over three short steps rather than one long one — **Basics** (site and organization names, contact, repository), **Colors & type** (palette, fonts, corner rounding) and **Home page & footer copy** — so no step is more than a screen or two.
- Shows a **live preview** on the Colors & type step — a miniature of the real header, hero, entry card and controls, rendered from the production stylesheet under your palette, type and corner rounding — next to the palette swatches and WCAG contrast checks. It updates as you type.
- Lists the entry model's fields as **collapsed rows** — one summary line each (label, key, type, and badges for required / filter / card / searchable / group) behind an expand button. Only the row you open shows its controls, so the step stays a screen or two rather than a mile of form. Open rows stay open as you edit, and a validation error re-opens the row it blames.
- Keeps that step's actions (**Add a field**, **Back**, **Continue**) pinned to the bottom of the viewport, so you never have to scroll back up to move on.
- Lets each field's **Show on card** toggle also pick the card slot (`badge`, `meta`, `line`, `chip`, `icon`) when the field's type fits one; leave it on **Automatic** to let the card choose from the type. See `card` in `docs/content-model.md`.
- Lets each field pick its **group** (which entry-page section it renders in) and its **weight** (1-9, ordering within the group) — the same `group`/`weight` keys documented in `docs/content-model.md`, both on existing fields and on the add-a-field form.
- Reports validation problems in a single **error summary** that takes focus when you try to continue, with one link per problem that jumps to the control at fault.
- Saves your answers in the browser as you go (a resume banner appears if you return with unfinished progress).
- Produces copy/download/"open in GitHub, pre-filled" links for each generated file — nothing is pushed automatically; you commit the files yourself via the GitHub UI or by pulling them locally.

| Colors & type step | Entry model step |
| --- | --- |
| ![Colors & type step: the seven step pills, the six palette fields with their swatches, and the live preview of the real header, hero and entry card under them.](images/setup-branding.png) | ![Entry model step: the schema's fields as collapsed rows with key, type and badge chips, and a sticky action bar with Back, Add a field, Start over and Continue.](images/setup-entry-model.png) |

### `npm run setup` — CLI wizard

```bash
npm run setup                          # interactive, asks every question
npm run setup -- --preset ai-use-cases # start from a preset instead of choosing interactively
npm run setup -- --yes                 # accept every default, ask nothing (good for CI / smoke tests)
npm run setup -- --dry-run             # print the file list and a diff summary; write nothing
npm run setup -- --out <dir>           # write the files into <dir> instead of the repo (implies --yes)
npm run setup -- --help
```

Same four presets (`ai-use-cases`, `cohort-portal`, `resource-library`, `blank`). Detects `owner/repo` from your git remote as the default for the repository question. Writes files directly to disk after you confirm a diff summary. Preserves any hand-added lines in `_config.yml` outside the title/description fields it owns.

### The Apply setup issue — the browser wizard, finished

`/setup/` hands back finished files but cannot commit them, so the last mile used to be seven manual
pastes into GitHub's file editor. `.github/ISSUE_TEMPLATE/apply-setup.yml` closes that: paste
`_data/site.yml`, `_data/theme.yml` and `_data/schema.yml` from the wizard's review step into one
issue, and `.github/workflows/apply-setup.yml` runs `scripts/apply_setup_from_issue.mjs`, which
calls the same `renderFiles()` and opens a pull request.

- Only three files are pasted. The other four are *derived* from them, so the generated half can
  never drift from the pasted half — however stale the tab the maintainer copied from.
- Invalid YAML, a schema `validateSchema()` rejects, and a palette that fails WCAG AA are all
  refused with a comment on the issue, before a pull request exists. Edit the issue and it retries.
- A checkbox on the form also runs `ejectSamples()`, so the demo content and the configuration
  arrive in one reviewable diff.
- The workflow is gated on `author_association` — owners, members and collaborators only. The
  pasted YAML becomes the site's configuration, so this is the one content workflow that is not
  open to the public. It is still only ever a pull request.

After hand-editing any `_data/*.yml` file directly (without going through a wizard), run `npm run generate`. It regenerates `.github/ISSUE_TEMPLATE/new-entry.yml`, the issue chooser's canonical safety routes, and `assets/js/configurator/defaults.generated.js`, and resyncs `_config.yml`'s title and description. This also migrates an older chooser after a PHCT update while retaining your `github.repository` identity and using your configured `github.branch` for repository-file links. It is idempotent, and `npm run generate -- --check` is the CI gate that fails when a generated file is out of date — so regenerate and commit in the same change.

## The showcase

The template's own deployment is not one site but several: a landing page at the root introducing
the template, and a complete live example of every wizard preset under `/examples/<preset-id>/`.
`scripts/build_showcase.mjs` builds them, each from a fresh copy of this repository run through
`npm run setup --preset <id>` with the sample content in `_showcase/<preset-id>/` laid over it — so
an example is exactly what picking that preset gives you, not a mockup maintained by hand.

```bash
npm run build:showcase                        # the landing and every example, into _site
npm run build:showcase -- cohort-portal       # the landing and one example (faster while editing)
```

| File | What it holds |
| --- | --- |
| `_data/showcase.yml` | Everything the landing page says: headline, the blurb and screenshot for each example, the feature list, the "how publishing works" steps. `hero_image` (optional, blank by default) layers an illustration into the landing hero the same way `hero.image` does on a catalog's home page. |
| `_showcase/<preset-id>/` | The sample content each example is built from — entries, and any module data that preset turns on. |
| `assets/images/showcase/` | The screenshots on the landing's example cards. A card whose file is missing shows a framed placeholder instead, so the page is complete without them. |
| `_data/showcase_presets.json` | Generated at build time from `assets/js/configurator/presets.js`: the per-example facts each card states — field and filter counts, entry noun, which modules are on. Never hand-written, so it cannot drift from the wizard. |

The example matching the site's own name — the configuration this repository ships with — is the
**flagship**: it is built from the working tree as-is and keeps the live GitHub issue loop. The
others are built with `github.repository` blank, so their submission forms explain that there is
nowhere to send answers rather than linking at a repository that is not theirs.

**This is the template's deployment, not yours.** `.github/workflows/pages.yml` always builds the
showcase in the canonical `crypticpy/phct` repository while `demo` is still `true` in
`_data/site.yml`. Another repository must explicitly opt in with the `CATALOG_SHOWCASE` repository
variable (Settings → Secrets and variables → Actions → Variables). A normal copy never has that
variable, so it deploys the single ordinary build from its first push — even before the samples are
ejected. Set the variable to `true` on your own copy only if you want a showcase, and delete it to
stop.
`npm run eject:samples` removes `_showcase/`, `_data/showcase.yml` and `assets/images/showcase/`
along with the rest of the sample content, and turning `demo` off is what ends the showcase.

## Quality checks

`npm run a11y` (pa11y-ci) and `npm run lighthouse` (Lighthouse CI) run against a
local build; the same two lanes run in `.github/workflows/quality.yml`.

`quality/lighthouserc.js` sets `upload: { target: 'temporary-public-storage' }`,
which publishes each Lighthouse report to a public, unlisted URL on Google's
storage so the run can link to it. That happens for both lanes, on every run.
If this catalog is a private deployment — an internal fork, a staging site
carrying real content — change that target (`filesystem` writes the reports
into the workspace instead) before the first CI run.

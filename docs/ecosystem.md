# The repository family

One template, one deployment, one archive. This page is the map — what each
repository is for, how they relate, and the settings that make them behave
differently. If a repository is renamed, transferred or retired, update this
page in the same change.

_Last verified: 2026-09-28 (v1.9.0)._

## The repositories

| Repository | What it is | Live site |
|---|---|---|
| [crypticpy/phct](https://github.com/crypticpy/phct) | **This one.** Pub Health Catalog Template — the generic, shareable template. Marked as a GitHub template repository; copies are made from here. Its own Pages deployment is the showcase: a landing page at the root and a complete live example of every wizard preset under `/examples/<preset>/`. | <https://crypticpy.github.io/phct/> |
| [Big-Cities-Health-Coalition/use-case-catalog](https://github.com/Big-Cities-Health-Coalition/use-case-catalog) | The **Public Health Digital Use Case Catalog** — a real deployment, made from this template, carrying the Big Cities Health Coalition's branding, governance text and demo entries. The only repository that names BCHC. Transferred from `crypticpy/bchc-ai-use-case-catalog` to BCHC's GitHub organization and renamed in September 2026. | <https://big-cities-health-coalition.github.io/use-case-catalog/> |
| [crypticpy/bchc-catalog-starter](https://github.com/crypticpy/bchc-catalog-starter) | **Archived.** Was the "day one" demo — a copy taken through `docs/launch.md` with the samples removed and one published entry. Retired in v1.8.1 once every preset had a live example; the blank example now plays that role. The `demo_starter_url` / `starter_url` keys it filled still exist and ship blank. | read-only |

## How they relate

```
crypticpy/phct  (the template; showcase landing + /examples/*)
   │
   ├── "Use this template" ──► anyone's catalog  (launch.md; eject:samples strips
   │                           the showcase content and sample entries)
   │
   └──── one such copy ─────► Big-Cities-Health-Coalition/use-case-catalog
                               (BCHC branding + data; upgrades flow back in
                                via the `template` remote — docs/upgrading.md)
```

The BCHC repository is downstream like any other copy: it pulls template
releases with the recipe in [upgrading.md](upgrading.md) and keeps its
identity in `_data/*.yml` and `catalog/`. Nothing in this repository refers to
BCHC; a fresh copy can never accidentally wear BCHC's name.

## What makes each deployment behave differently

Same workflows everywhere; repository variables and `_data/site.yml` flip the
behavior:

| Setting | phct | use-case-catalog (BCHC) | a fresh copy |
|---|---|---|---|
| `CATALOG_SHOWCASE` variable | Optional for the canonical repository; its identity enables the landing + examples | unset — plain single-site build | unset |
| `CATALOG_METRICS` variable | `false` — no monthly metrics PRs on a template | unset — the monthly metrics job runs | unset |
| `demo:` in `_data/site.yml` | `true` (sample content, demo banner) | `true` until BCHC removes the samples | flipped to `false` by eject/setup |
| `github.repository` | `crypticpy/phct` | `Big-Cities-Health-Coalition/use-case-catalog` | set by the wizard |

The showcase requires `demo: true` and either the exact canonical repository identity or an
explicit `CATALOG_SHOWCASE == 'true'` opt-in. No ordinary copy can deploy the template landing by
accident — see [configuration.md](configuration.md).

## History, briefly

- Through v1.7.0 this repository *was* the BCHC catalog, and its root was that
  site (later `/examples/ai-use-cases/`).
- **v1.8.0** (2026-08-19): the BCHC identity, governance text, DMWG docs and
  its ten entries moved to `bchc-ai-use-case-catalog`; this repository became
  org-agnostic, with new generic sample entries.
- **v1.8.1** (2026-08-19): renamed `bchc-template` → `phct` ("Pub Health
  Catalog Template") and the starter archived. GitHub redirects the old git
  and web URLs; the old Pages URL (`…/bchc-template/`) does **not** redirect.
- **September 2026**: `crypticpy/bchc-ai-use-case-catalog` was transferred to
  the `Big-Cities-Health-Coalition` organization, rebranded as the Public
  Health Digital Use Case Catalog and renamed `use-case-catalog`. Git and web
  URLs redirect; the old Pages URLs (`crypticpy.github.io/bchc-ai-use-case-catalog/`
  and `big-cities-health-coalition.github.io/bchc-ai-use-case-catalog/`) do **not**.

## If something moves

- **Transferring phct to another account** (e.g. a City of Austin org): GitHub
  "Transfer ownership". Afterwards update `github.repository` in
  `_data/site.yml`, re-set the two repository variables (they do not transfer
  with Actions disabled), and note the new Pages URL here and in the README.
- **Renaming or re-homing the BCHC repository**: its Pages URL follows the new
  name (or a custom domain), `github.repository` in its `_data/site.yml` needs
  the one-line update so the submit form opens issues in the right place, and
  its `PHCT_UPDATE_TOKEN` must be reissued if the resource owner changes.

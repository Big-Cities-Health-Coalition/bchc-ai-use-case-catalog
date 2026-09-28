# PHCT release-readiness, audit, and BCHC propagation plan

- Status: in execution; automated baseline implemented 2026-08-22
- Created: 2026-08-21
- Target: a release candidate suitable for the wider BCHC demo audience next week
- Release: `v1.10.0` (stable, promoted from `v1.10.0-rc.2`)
- Parent repository: [`crypticpy/phct`](https://github.com/crypticpy/phct)
- Downstream demo: [`Big-Cities-Health-Coalition/use-case-catalog`](https://github.com/Big-Cities-Health-Coalition/use-case-catalog)

The audit baseline and release contract below remain authoritative. The current executable
sequence for interface polish, open-source publication, and the final BCHC update is maintained in
[polish-and-publish-plan.md](polish-and-publish-plan.md).

## Purpose

Make Pub Health Catalog Template (PHCT) the single, thoroughly reviewed source of all reusable
catalog code, then make the BCHC demo consume tested PHCT releases without losing BCHC's name,
branding, governance, configuration, or content.

The work is not complete when the parent repository passes unit tests. It is complete when:

- the parent codebase is reproducible, secure, accessible, performant, documented, and releasable;
- every supported preset and the generated showcase pass the same release gates;
- a versioned parent release produces a reviewable BCHC update pull request;
- automation proves that BCHC-owned files were not changed by that update;
- the real issue-to-pull-request-to-Pages workflow succeeds in both repositories;
- two maintainers can operate, update, and recover the project using only the runbooks; and
- there are no unresolved release-blocking defects.

This file is the canonical execution record in PHCT. The BCHC repository may retain a snapshot or
link for handoff context, but changes to release scope, gates, or shared-code policy are made here
first and then propagated downstream through a versioned PHCT release.

## Non-negotiable operating decisions

1. **PHCT is the only source of reusable code.** Generic fixes and features begin in PHCT.
2. **The showcase is generated, not copied.** PHCT's Pages site builds its landing page and all
   preset examples from the same commit under review.
3. **BCHC is a downstream deployment.** It owns identity, policy, taxonomy, content, and media;
   it consumes PHCT code through versioned pull requests.
4. **The archived starter stays archived.** `bchc-catalog-starter` is not part of the release
   train. The PHCT blank example replaces it.
5. **No direct generic hotfixes in BCHC.** A generic defect found in the demo is reproduced and
   fixed in PHCT, released, then consumed downstream. An emergency downstream patch must have a
   linked upstream issue and same-day upstream fix.
6. **Bots open pull requests but never merge them.** A human approves every template update.
7. **Updates use immutable tags or full commit SHAs, never a moving `main` reference.**
8. **The presentation date does not waive a release gate.** A red P0/P1 gate delays the wider
   demo or disables the affected feature.

## Repository family and flow

```text
crypticpy/phct
authoritative reusable code, tests, workflows, presets, and release history
        |
        +-- same commit --> generated showcase and /examples/<preset>/
        |
        +-- vNEXT-rc.N --> BCHC compatibility/update pull request
                                      |
                                      +-- protected BCHC configuration and content
                                      +-- full downstream gates and deploy rehearsal
                                      |
                               stable PHCT tag + approved merge
                                      |
                                      v
                         BCHC demo deployment on GitHub Pages

crypticpy/bchc-catalog-starter
archived; no updates and no release responsibility
```

## Current baseline

The baseline must be re-recorded in PHCT at the start of execution, but the initial repository
review established the following:

- PHCT is currently versioned as `v1.8.1`; the BCHC deployment still identifies its consumed
  template as `v1.7.0`.
- The BCHC working tree has only an `origin` remote; no `template` remote or merge driver is
  configured.
- The Node suite passes 517 tests. ESLint, Prettier, generated-file parity, derivative-image
  checks, and CSS compilation pass.
- A production Jekyll build completed in about 1.15 seconds using an available newer Ruby, but
  the documented Ruby 3.3.9 environment was not installed locally. The default macOS Ruby 2.6
  caused validation failures unrelated to the supported toolchain. Reproducible setup is a
  release requirement, not optional developer convenience.
- With ten demo entries, the generated catalog page is approximately 288 KB raw/37 KB gzip,
  `search.json` is approximately 39 KB raw/13 KB gzip, `entries.json` is approximately 51 KB
  raw/12 KB gzip, and the site generates 134 HTML files. Scale at 100, 500, and 1,000 entries
  remains unproven.
- The compressed production CSS is approximately 25 KB. Catalog JavaScript plus Lunr and the
  filter module graph is roughly in the low-30-KB gzip range before search data.
- CI already provides a strong base: Node and Ruby tests, generated-file checks, a preset/module
  build matrix, pa11y, keyboard-flow tests, Lighthouse, SHA-pinned actions, and restricted
  workflow permissions.
- Lighthouse accessibility and layout shift are blocking; most performance, best-practice, and
  SEO assertions currently warn rather than fail.
- The BCHC deployment is intentionally still in demo mode and carries fictional sample entries.
  It must retain an unmistakable demo banner until BCHC approves real publication.

The bullets above are the **initial pre-remediation baseline**. They are retained so reviewers can
trace why each workstream exists; they do not describe the current candidate.

## Implementation checkpoint — 2026-08-22

The planned automated controls are now implemented in both working trees: exact toolchain checks,
the parent/downstream ownership contract, immutable update metadata, protected-file checksums,
full verification orchestration, supply-chain and license gates, deterministic SBOM generation,
internal-link validation, the 0–1,000-entry performance fixture, blocking Lighthouse budgets,
compressed browser-test serving, direct low-end-mobile interaction budgets, representative
long-form/image/facet scale data, maintainer documentation, and BCHC's operations inventory.

The current automated code baseline is green, including the complete PHCT verification suite,
browser accessibility and interaction checks, mobile and desktop PHCT Lighthouse, mobile BCHC
Lighthouse, secret scans of both histories, and the supported 100-entry scale target. The stable
release remains a no-go until the live GitHub, human accessibility, ownership, recovery, and soak
gates are performed. Exact results and open blockers are maintained in
[release-readiness-status.md](release-readiness-status.md).

## Critical propagation defect to fix first

The upgrade guide says deployment-owned `_data/*.yml` files are preserved, but the current
`.gitattributes` ownership list does not protect all deployment-owned data. At minimum, these
paths are currently missing:

- `_data/governance.yml` — adopted organizational policy;
- `_data/search.yml` — deployment-specific vocabulary and search tuning; and
- `_data/derivatives.json` — generated from deployment-owned images.

`_data/modules.yml` is structural template code and should remain PHCT-owned.
`_data/showcase.yml` and `_showcase/**` are PHCT showcase assets and should also remain
PHCT-owned.

This mismatch is a release blocker. Before the first automated upgrade:

1. Define the ownership boundary in a machine-readable manifest.
2. Update `.gitattributes` to match it.
3. Add a test that fails when the manifest, `.gitattributes`, upgrade documentation, and
   generated-file list disagree.
4. Add before/after checksum protection to the update workflow.
5. Add the corrected attributes and deterministic diff applier to BCHC in a small
   upgrade-preparation pull request before its first newer PHCT release.

## Ownership contract

### PHCT-owned reusable code

These paths normally take the parent release's version:

- `_layouts/**`, `_includes/**`, and `_plugins/**`;
- reusable `assets/js/**`, `assets/css/**`, and `assets/fonts/**`;
- `scripts/**`, `test/**`, and `quality/**`;
- `.github/workflows/**` and shared pull-request templates;
- `Gemfile`, `Gemfile.lock`, `package.json`, `package-lock.json`, and build/lint configuration;
- `_data/modules.yml`;
- `_data/showcase.yml`, `_data/showcase_presets.json`, `_showcase/**`, and showcase images;
- shared architecture, security, contributor, configuration, and developer documentation; and
- reusable page and module entry points.

`package.json` identifies the PHCT tooling version. It must not also serve as BCHC's product
release version.

### BCHC-owned deployment files

These paths must survive every parent update byte-for-byte unless the downstream pull request
explicitly identifies and approves a migration:

- `_config.yml`;
- `_data/site.yml`, `_data/theme.yml`, `_data/schema.yml`, and `_data/navigation.yml`;
- `_data/governance.yml` and `_data/search.yml`;
- `_data/events.yml`, `_data/resources.yml`, `_data/cohorts/**`, and `_data/metrics.json`;
- `_data/derivatives.json`;
- `catalog/**`, `cohorts/**`, `events/**`, `resources/**`, and `about/**`;
- `assets/images/**`, excluding an explicitly PHCT-owned showcase subdirectory if one exists;
- `CNAME`, BCHC's README, `.github/CODEOWNERS`, `MAINTAINERS.md`, and `SUPPORT.md`;
- BCHC-specific policy, alignment, decision, and source documents; and
- any future deployment-specific content directory declared in the ownership manifest.

BCHC-specific documents should move under an explicit namespace such as `docs/bchc/**` so the
ownership rule is unambiguous. Existing BCHC-only documents must be listed explicitly until that
migration is complete.

### Generated downstream files

These are preserved during the update, then regenerated from BCHC-owned configuration with the
new PHCT generator:

- `.github/ISSUE_TEMPLATE/new-entry.yml`;
- `.github/ISSUE_TEMPLATE/config.yml`;
- `assets/js/configurator/defaults.generated.js`; and
- any future generated output registered by `scripts/generate.mjs`.

Generated changes are expected in an update pull request. Hand-authored BCHC data changes are not.

## Version model

Maintain two independent version identities:

- **PHCT version:** semantic version of reusable template code, for example `v1.9.0`.
- **BCHC release:** version of the deployed BCHC catalog, for example `v1.0.0`.

Add a committed downstream lock file, for example `.phct-version.json`:

```json
{
  "template": "crypticpy/phct",
  "version": "1.9.0",
  "commit": "full-40-character-commit-sha",
  "updated": "2026-08-25"
}
```

Every BCHC release note must state the PHCT version and commit it contains. The update checker
must read this file rather than treating the package version as the deployment's own version.

## Change routing

| Change | First repository | Downstream action |
|---|---|---|
| Layout, JavaScript, Ruby plugin, workflow, security, accessibility, or performance fix | PHCT | Consume the next PHCT release PR. |
| Shared docs or developer tooling | PHCT | Consume the next PHCT release PR. |
| New reusable module, schema capability, or preset | PHCT | Release with migration notes; BCHC opts in through configuration. |
| BCHC name, contact, colors, governance, taxonomy, or site copy | BCHC | No upstream change unless generalized. |
| BCHC entry, image, cohort, event, metric, or resource | BCHC | No upstream change. |
| Generic bug discovered in BCHC | PHCT | Reproduce upstream, fix, release, update BCHC. |
| Emergency downstream security patch | Both, linked | Patch BCHC only long enough to publish the upstream release; eliminate divergence immediately. |

## Release train

### 1. Parent pull request

Every reusable change lands in PHCT through a pull request containing:

- the problem and intended behavior;
- affected presets, modules, and downstream deployments;
- tests added or changed;
- migration impact on deployment-owned files;
- screenshots for visual work;
- security and accessibility considerations; and
- verification evidence.

PHCT branch protection requires code review and all parent gates. No direct pushes to `main`.

### 2. Showcase and preset verification

The PHCT pull request builds:

- the template landing page;
- every supported preset as a complete example;
- every supported module combination in the build matrix;
- an empty/ejected deployment; and
- at least one large generated catalog used for scale checks.

The resulting Pages artifact is retained and linked from the pull request. Visual, functional,
accessibility, and performance evidence must come from the candidate commit, not an older live
site.

### 3. Release candidate

After the parent gates pass, create an immutable candidate tag:

```text
vNEXT-rc.1
```

The candidate release includes:

- a change summary;
- security and compatibility impact;
- migration actions for deployment-owned configuration;
- generated-file changes;
- rollback instructions; and
- the full commit SHA.

### 4. BCHC compatibility/update pull request

The BCHC updater consumes the exact release-candidate tag and opens
`upgrade/phct-vNEXT-rc.1`. It must:

1. Read `.phct-version.json`.
2. Fetch the exact PHCT tag and verify its commit.
3. Read the ordered ownership rules and snapshot every protected deployment path.
4. Preview the incoming change classification.
5. Use the locked and target tags to reconcile the complete template-owned tree to the target,
   including files unchanged between releases, while leaving deployment-owned paths untouched
   without assuming shared Git ancestry.
6. If the candidate changes `.github/workflows`, require the dedicated repository-scoped
   `PHCT_UPDATE_TOKEN` with Contents, Pull requests, and Workflows read/write permissions; fail with
   setup guidance before the expensive candidate gates when it is absent. Keep that credential out
   of checkout and all candidate-controlled commands. Transfer the verified commit through a
   digest-checked Git bundle to a fresh runner that neither checks out nor executes candidate code,
   then supply the credential only to that runner's push and pull-request operations without
   persisting it in Git configuration or a remote URL.
7. Regenerate downstream outputs.
8. Compare checksums for every protected deployment-owned path.
9. Fail on an unexplained protected-path change.
10. Run the full BCHC suite and build.
11. Publish an inspectable preview artifact.
12. Open or update one pull request containing release notes and migration decisions.

The updater runs in BCHC and pulls from the public parent. This avoids giving the parent
repository a credential capable of writing into BCHC's organization. It supports manual dispatch,
a weekly check, and an optional event when a stable PHCT release is published.

If the built-in token opens the pull request and therefore cannot trigger other workflows, the
updater must explicitly dispatch the validation and quality workflows and attach their statuses
to the update commit, matching the repository's existing generated-PR pattern.

### 5. Stable parent release

Only after the BCHC release-candidate pull request and live candidate rehearsals are green should
PHCT open a stable release-record pull request directly on top of the accepted candidate. That PR
changes the package and lock version from `NEXT-rc.N` to `NEXT` plus version-bearing release
records; it contains no reusable behaviour change. The candidate-to-stable diff is reviewed
against that allowlist and the full parent gates run again. Tag the resulting commit as `vNEXT` so
the tag, package version, and updater invariant agree. If compatibility fails, fix PHCT and issue
the next candidate; do not patch the downstream candidate independently.

### 6. Downstream merge and deploy

Run the BCHC updater against the stable tag and let it create a stable update pull request. Do not
hand-edit the candidate lock: the updater must record the stable tag, its full commit, and the
matching stable package version together. Re-run protected checksums and downstream gates, obtain
human approval, merge, and verify the Pages deployment. The previous PHCT lock and BCHC release tag
are the rollback point.

## Audit and remediation workstreams

### Workstream A — reproducible development and build environment

Tasks:

- Pin the exact supported Ruby, Bundler, Node, and npm versions.
- Add `packageManager`, a Node-version file, and a single authoritative Ruby version.
- Provide a Dev Container/Codespaces configuration or equivalent reproducible environment.
- Add `npm run doctor` to report missing/wrong tools, protected-updater state, Chrome availability,
  and generated-file drift in plain language.
- Add `npm run verify` as the one command that runs all non-browser release checks.
- Verify setup on macOS, Linux, and the GitHub-hosted runner from clean clones.
- Make the no-terminal GitHub workflow the primary BCHC operator path; local setup is the
  developer and emergency path.

Exit evidence:

- a new contributor follows the documented setup without undocumented steps;
- exact-toolchain `npm run verify` passes from a clean clone; and
- the build is reproducible with an unchanged working tree.

### Workstream B — architecture and code review

Review the full codebase, concentrating on high-complexity and high-trust surfaces:

- client search, filtering, ordering, comparison, submission, and setup configurator;
- issue parsing, YAML emission, slug generation, generated files, and review logic;
- image and attachment download, type detection, redirects, limits, and path confinement;
- Jekyll plugins for schema rendering, search, facets, feeds, events, modules, and related items;
- Liquid escaping, include scope, URLs, front matter, and `render_with_liquid: false`;
- update/date/metrics automation and GitHub API pagination/error handling; and
- build/showcase scratch-tree isolation and cleanup.

For every finding, record severity, evidence, affected configurations, fix owner, regression test,
and verification result. Avoid large style-only rewrites during the release window.

Add:

- code-coverage reporting as evidence, not a vanity percentage;
- explicit coverage expectations for security and workflow parsers;
- property/fuzz tests for hostile issue bodies, YAML values, slugs, paths, redirects, and address
  parsing; and
- regression tests for every P0/P1/P2 defect fixed.

### Workstream C — security and supply chain

Tasks:

- Refresh the threat model for public issue triggers, bot pull requests, Pages deployment,
  external attachments, and repository transfer.
- Re-audit every workflow permission, event type, interpolated expression, secret, checkout token,
  and branch target.
- Confirm every third-party action is pinned to a full commit SHA.
- Run CodeQL or equivalent static analysis.
- Add npm and Ruby dependency vulnerability checks with documented exception handling.
- Add dependency-license review and confirm compatibility with the project license.
- Generate a release SBOM and retain it with the release artifact.
- Enable secret scanning and private vulnerability reporting in the hosting organization.
- Exercise SSRF, DNS rebinding assumptions, private-address encodings, redirect chains, timeouts,
  oversized/streaming bodies, lying content types, archive/polyglot files, and Unicode filenames.
- Test untrusted issue titles/bodies against shell, YAML, Markdown, Liquid, HTML, GitHub output,
  branch-name, and path injection.
- Verify default-branch protection makes publication impossible without review.
- Review what security headers GitHub Pages can and cannot provide and document residual risk.

Exit evidence:

- no unresolved critical/high vulnerability;
- no unreviewed write permission or long-lived broad token;
- security exceptions have an owner and review date; and
- takedown, credential rotation, and protected-data history purge are rehearsed.

### Workstream D — functional product review

Test the product as five users:

1. **Visitor:** home, browse, facets, search, sort, grid/list, entry, gallery, related entries,
   comparison, sharing, print, feed, 404, and disabled modules.
2. **Contributor:** submission form, validation, drafts, review, pop-up blocked fallback, no-JS
   fallback, issue handoff, screenshots, attachments, and correction loop.
3. **Reviewer:** generated pull request, escalation labels, checklist, requested revisions,
   approval, decline, deprecation, and publication announcement.
4. **Maintainer:** setup, configuration changes, schema changes, module toggles, image derivatives,
   cohorts/events/resources, metrics, verification sweep, dependency update, rollback, and incident.
5. **New owner:** repository transfer, Pages URL/base path, domain, variables, secrets, labels,
   Discussions, branch protection, release, and contributor permissions.

Cover empty, single-entry, normal demo, deprecated-only, malformed, and large-catalog states.
Every failure mode must show a useful message and a recovery path.

### Workstream E — browser and accessibility review

Automated coverage remains necessary but is not sufficient.

Run:

- pa11y with axe and HTML_CodeSniffer over all representative pages and interactive states;
- real-browser keyboard flow tests;
- current Chrome, Firefox, Safari, and Edge;
- iOS Safari and Android Chrome at phone widths;
- 200%, 300%, and 400% zoom/reflow;
- Windows High Contrast/forced colors;
- reduced motion;
- VoiceOver with Safari and NVDA with Firefox or Chrome;
- keyboard-only lightbox, filter dialog, search listbox, comparison tray, submission form, and
  setup wizard; and
- no-JavaScript content and form behavior.

Resolve the documentation mismatch between WCAG 2.1 and 2.2. Publish only the standard that has
actually been evaluated. Automated tools must report zero blocking issues, and serious manual
findings block release.

### Workstream F — performance and scale

Create deterministic fixtures for 0, 1, 10, 100, 500, and 1,000 entries, including images,
long-form bodies, common and rare facets, deprecated entries, and cross-entry relationships.

Measure:

- production and all-variant Jekyll build time;
- generated page/file count and artifact size;
- catalog HTML size and DOM node count;
- CSS, JavaScript, font, image, `search.json`, and `entries.json` transfer size;
- search initialization, query, filtering, sorting, and comparison latency;
- main-thread time and memory on a representative low-end mobile profile;
- desktop and mobile Lighthouse over multiple runs; and
- Pages behavior with the real base URL and cache headers.

Initial proposed gates, to be confirmed after the first controlled baseline:

- cumulative layout shift `<= 0.05`;
- total blocking time `<= 200 ms`;
- desktop Lighthouse performance `>= 0.90`;
- mobile Lighthouse performance `>= 0.80` under the documented throttling profile;
- no performance assertion reported only as an ignored warning;
- catalog JavaScript, including module imports and Lunr, `<= 40 KB` gzip before search data;
- production CSS `<= 30 KB` gzip;
- filter response p95 `<= 100 ms` and search response p95 `<= 250 ms` at the agreed supported
  catalog size;
- representative catalog HTML `<= 100 KB` gzip and a bounded DOM at the supported scale;
- compressed search data `<= 500 KB` at 500 realistic entries, unless measurement supports a
  different reviewed limit; and
- all release workflows finish with at least 25% headroom under their timeout.

If scale fails, evaluate static pagination, limiting generated facet pages, reducing repeated card
markup, loading search data on demand, trimming indexed prose, incremental rendering, and moving
nonessential setup assets off visitor-facing routes. Optimization must retain no-JS and
accessibility behavior.

### Workstream G — CI, end-to-end automation, and release evidence

The release pipeline must run, at minimum:

```text
npm ci
node scripts/generate.mjs --check
npm run lint
npm run format:check
npm test
npm run coverage
npm run test:ruby
npm run validate
node scripts/derive_images.mjs --check
npm run test:build
npm run build:css
bundle exec jekyll doctor
bundle exec jekyll build
npm run a11y
npm run test:flows
npm run lighthouse        # desktop
QUALITY_LANE=mobile npm run lighthouse
actionlint + zizmor
dependency/security/license checks
```

Add link checking for internal pages, assets, anchors, canonical URLs, sitemap entries, feed URLs,
and important external links. Upload diagnostic artifacts even when quality checks fail.

Perform live rehearsals in throwaway repositories for:

- fresh setup from the template;
- sample ejection;
- issue submission to generated pull request;
- screenshot and attachment handling;
- validation and quality dispatch on bot-created branches;
- merge, Pages deploy, and submitter announcement;
- template update pull request;
- rollback to the previous version; and
- ownership transfer to another organization.

### Workstream H — open-source readiness and maintainer durability

Tasks:

- Separate PHCT developer/contributor documentation from BCHC operator documentation.
- Add CODEOWNERS with primary and backup reviewers.
- Publish a named maintainer/support policy without promising unavailable support.
- Add structured bug, feature, documentation, accessibility, and security-report routes.
- Confirm license copyright and upstream attribution.
- Maintain PHCT's changelog, semantic tags, release notes, migration notes, and support window.
- Document dependency updates, release creation, downstream propagation, rollback, and emergency
  patching.
- Add an account/setting inventory for Pages, variables, secrets, branch rules, labels,
  Discussions, domain/DNS, security reporting, and bots. Store no secrets in the document.
- Document backup, restore, incident communication, protected-data purge, and maintainer succession.
- Have two people who did not build the project complete the routine and emergency drills without
  live developer coaching.

## Required CI gates by repository

| Gate | PHCT parent | Generated showcase | BCHC downstream |
|---|---:|---:|---:|
| Lint, formatting, generated parity | required | inherited build | required |
| Node and Ruby unit tests | required | inherited build | required |
| All presets and module variants | required | all examples | representative BCHC configuration |
| Content/front-matter validation | generic fixtures | all example content | real BCHC content |
| Accessibility automation | landing + examples | required | required |
| Keyboard/AT flows | representative presets | required | required |
| Desktop/mobile Lighthouse | representative presets | required | required |
| Direct filter/search interaction p95 at supported scale | required | inherited build | required after parent update |
| Security and dependency checks | required | build artifact | required for downstream-only dependencies/config |
| Ownership/checksum protection | manifest test | n/a | before and after every update |
| Live issue-to-deploy rehearsal | release candidate | showcase deploy | release candidate |
| Release artifact and SBOM | required | included | records consumed parent release |

## Defect severity and release policy

| Severity | Meaning | Release rule |
|---|---|---|
| P0 | Data exposure, credential exposure, arbitrary execution, publication bypass, destructive data loss | Stop work and remediate immediately. No deploy or presentation. |
| P1 | Core submission/review/deploy failure, inaccessible critical path, broken ownership transfer, corrupted upgrade, unusable supported browser, severe performance failure | Must be fixed and regression-tested before release. |
| P2 | Important but recoverable functional, accessibility, performance, security-hardening, or documentation defect | Fix before release unless explicitly accepted with owner and date. |
| P3 | Minor polish, low-frequency inconvenience, or future enhancement | May defer with a tracked issue. |

Release requires zero open P0/P1 issues. Any deferred P2 requires a written decision, named owner,
workaround, and target release.

## Execution sequence

### Phase 0 — freeze and evidence

- Freeze unrelated feature work.
- Record current PHCT and BCHC SHAs, versions, CI status, Pages URLs, and settings.
- Create one audit issue board with workstream, severity, owner, status, and evidence fields.
- Preserve current build and quality artifacts as the comparison baseline.

Exit: baseline is reproducible and every finding has one tracking location.

### Phase 1 — protect the repository boundary

- Move this plan to PHCT as the canonical copy.
- Add the ownership manifest.
- Fix `.gitattributes` and upgrade documentation.
- Add ownership/parity/checksum tests.
- Prepare BCHC's attributes and ancestry-independent update applier before the first parent update.
- Add `.phct-version.json` and the updater workflow in a disabled/manual-first state.

Exit: a dry-run upgrade cannot alter BCHC-owned content unnoticed.

### Phase 2 — establish the clean parent baseline

- Build the reproducible environment and doctor/verify commands.
- Run all existing gates on PHCT.
- Audit architecture, security, workflows, dependencies, and tests.
- Create findings with severity and regression-test requirements.

Exit: the complete baseline is green or every red item is classified and assigned.

### Phase 3 — functional, accessibility, and scale review

- Run the five-user functional matrix.
- Complete automated and manual accessibility review.
- Run 0/1/10/100/500/1,000-entry performance tests and the real-Chrome interaction gate at the
  supported ceiling.
- Test all presets, modules, and failure states.

Exit: P0/P1 findings are known; performance architecture is acceptable at the supported scale.

### Phase 4 — focused remediation

- Fix P0/P1, then P2, in small reviewable parent pull requests.
- Add regression tests and update documentation with each fix.
- Keep BCHC unchanged except for ownership/update infrastructure preparation.
- Re-run full gates after every shared-code fix.

Exit: zero P0/P1; no unaccepted P2; all parent and showcase gates green.

### Phase 5 — release candidate and BCHC consumption

- Tag `vNEXT-rc.1` from the audited PHCT commit.
- Generate the BCHC update pull request.
- Verify checksums preserve identity, governance, schema, content, and media.
- Run BCHC's full suite, preview, and real issue-to-deploy rehearsal.
- Fix failures upstream and repeat with `rc.2` if necessary.

Exit: parent, showcase, and BCHC candidate all pass from the same commit.

### Phase 6 — stable release, deploy, and soak

- Tag the audited commit as stable.
- Update the BCHC lock file to the stable tag.
- Approve and merge the BCHC update.
- Verify Pages, links, submissions, workflows, and monitoring after deploy.
- Run a minimum one-business-day soak with no unresolved release-blocking regression.
- Conduct maintainer operation and rollback drills.

Exit: release definition of done is satisfied and evidence is attached to the release.

## Suggested next-week working cadence

This is a sequencing target, not permission to skip a gate. Set calendar dates once the wider
presentation date is confirmed.

| Day | Primary outcome |
|---|---|
| Day 0 | Freeze, baseline, issue board, canonical plan, and ownership boundary. |
| Day 1 | Reproducible environment, doctor/verify command, parent suite, security/dependency scans. |
| Day 2 | Architecture review and critical parser/workflow tests; start P0/P1 remediation. |
| Day 3 | Functional, browser, manual accessibility, and scale/performance review. |
| Day 4 | Complete P0/P1/P2 remediation; all parent and showcase gates green. |
| Day 5 | PHCT release candidate and automated BCHC update pull request. |
| Day 6 | BCHC end-to-end rehearsal, stable tag, deploy, rollback drill, and soak begins. |
| Day 7 | Wider-demo go/no-go using the evidence checklist below. |

Parallel work is appropriate only when the tasks do not edit the same source-of-truth files or
invalidate the same baseline. The release manager owns sequencing and final evidence.

## Wider-demo go/no-go checklist

- [ ] The displayed site is visibly and accurately labelled as a demo.
- [ ] Every fictional organization and example is clearly identified as fictional.
- [ ] No real PII, PHI, credentials, or non-public information appears in content, images, issues,
      history, artifacts, or metrics.
- [ ] Zero open P0/P1 issues; P2 exceptions are documented and approved.
- [ ] Exact-toolchain parent, showcase, and BCHC gates are green.
- [ ] Desktop and mobile performance meet the approved budgets.
- [ ] Automated and manual accessibility review is complete.
- [ ] Chrome, Firefox, Safari, Edge, iOS Safari, and Android Chrome critical paths pass.
- [ ] Search, filters, compare, print, submit, setup, governance, and no-JS paths pass.
- [ ] A real demo issue produced a pull request, passed checks, merged, deployed, and notified the
      submitter.
- [ ] BCHC-owned files were checksum-identical across the PHCT update except for explicitly
      approved migrations and generated outputs.
- [ ] Branch protection, Pages, variables, secrets, labels, Discussions, and security reporting
      are configured and recorded.
- [ ] Rollback and protected-data takedown drills succeeded.
- [ ] Two maintainers can perform routine operations and recovery from the written runbooks.
- [ ] The stable PHCT tag, commit, SBOM, release notes, BCHC lock, and deployment SHA are recorded.

## Definition of done

The parent codebase is considered dialed in for this release only when all of the following are
true:

1. A clean clone in the supported environment passes one documented verification command and the
   full browser/quality suite.
2. The repository ownership contract is machine-tested and a downstream update cannot silently
   change deployment-owned data.
3. PHCT, every generated showcase example, and BCHC consume the same audited commit.
4. The real GitHub issue, pull request, media, review, deploy, notification, update, and rollback
   paths have been rehearsed.
5. The supported catalog scale meets approved build, payload, latency, and mobile budgets.
6. Security, accessibility, open-source, and operational reviews have evidence and no unresolved
   blockers.
7. The parent has an immutable stable release with changelog, migration notes, SBOM, and rollback
   instructions.
8. BCHC retains its name, content, policy, configuration, and media and records the parent version
   it consumes.
9. Primary and backup maintainers can operate the project without relying on its original
   developer.
10. The wider-demo owner signs the go/no-go checklist based on evidence, not expectation.

## Post-release maintenance

- Dependabot and reusable-code dependency work lands in PHCT first.
- PHCT publishes scheduled patch releases for security and correctness fixes.
- BCHC's downstream workflow checks weekly and opens, but never merges, an update pull request.
- Each PHCT release candidate is tested against the current BCHC configuration before stable
  tagging.
- Monthly, verify scheduled workflows, Pages, links, security alerts, token expiry, and backup
  maintainers.
- Quarterly, run the scale fixture, supported-scale Chrome interaction gate,
  browser/accessibility sample, dependency/license scan, and rollback drill.
- Annually, revisit supported browsers, runtime versions, performance budgets, GitHub Actions
  permissions, upstream ownership, and maintainer succession.
- Keep the repository-family map and downstream version lock current whenever a repository is
  renamed, transferred, archived, or added.

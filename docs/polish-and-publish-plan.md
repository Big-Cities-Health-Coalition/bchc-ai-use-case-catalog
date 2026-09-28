# PHCT polish, publication, and BCHC update plan

- Status: in execution
- Plan date: 2026-08-22
- Parent source of truth: [`crypticpy/phct`](https://github.com/crypticpy/phct)
- BCHC demo deployment: [`Big-Cities-Health-Coalition/use-case-catalog`](https://github.com/Big-Cities-Health-Coalition/use-case-catalog)
- Governing audit plan: [release-readiness-plan.md](release-readiness-plan.md)
- Evidence ledger: [release-readiness-status.md](release-readiness-status.md)

## Outcome

Finish PHCT as a durable, attractive, well-documented open-source template; prove the finished
parent release against the real BCHC configuration; and update the BCHC demo without changing its
name, branding, governance, taxonomy, content, or media.

There are three distinct finish lines:

1. **Wider-demo ready:** the BCHC-flavoured site is visibly a demo, presentation-critical paths
   work, the tested parent update is deployed, and there is no open P0/P1 defect.
2. **Open-source stable:** PHCT has a stable immutable release with release notes, migration notes,
   SBOM, green release evidence, polished public documentation, and a successful downstream proof.
3. **BCHC handoff ready:** BCHC has named operational owners who complete the routine and emergency
   drills. This is deliberately later than the demo and does not block interface work or previewing.

## Source-of-truth and synchronization rules

The repositories are connected by a release updater, not by copying changes or merging unrelated
Git histories.

```text
PHCT parent main
  -> reviewed parent polish PRs
  -> immutable release candidate
  -> BCHC updater PR at the exact tag and commit
  -> protected-file checksum, CI, preview, accessibility and rollback review
  -> live candidate and operational rehearsals
  -> stable release-record commit derived from the accepted candidate
  -> BCHC updater PR at the stable tag and matching package version
  -> human merge and Pages verification
```

These rules apply throughout the work:

- Reusable layouts, scripts, styles, workflows, tests, generator logic, and shared documentation
  change in PHCT first.
- BCHC owns its identity, policy, configuration, content, catalog entries, images, and protected
  `docs/bchc/**` records.
- Generic defects discovered in BCHC are reproduced and fixed in PHCT, then propagated by a tag.
- Every downstream update uses an immutable tag plus its full 40-character commit SHA.
- The updater must keep every protected BCHC path byte-identical unless the PR calls out an
  intentional migration and receives human approval.
- Generated downstream files may change only after regeneration from BCHC's preserved settings.
- Bots may create or update pull requests but may not merge them.
- The BCHC rc.2 update PR merged and locked the demo to `v1.9.0-rc.2`; it remains an evidence
  point, and later candidates advance that lock through a fresh updater run and reviewed PR.

## Current verified position

The following work is complete or already has durable evidence:

- PHCT `v1.9.0-rc.2` is immutable at
  `bb2e44714969d261ce77860ddd27af8c5d9626d0` with a 326-component SBOM.
- BCHC's real rc.2 updater run succeeded and opened
  [PR #4](https://github.com/crypticpy/bchc-ai-use-case-catalog/pull/4).
- That update preserved 116 protected BCHC files byte-for-byte, passed downstream CI, has visual
  and rollback evidence, and has since merged, locking the demo to `v1.9.0-rc.2`.
- Both repositories now protect `main` with pull requests, strict required checks, stale-review
  dismissal, resolved-thread enforcement, deletion protection, and force-push protection.
- PHCT version tags are immutable; future GitHub releases are immutable.
- Default workflow permissions are read-only. Only GitHub-owned actions plus the explicitly
  selected, SHA-pinned actions may run.
- Dependabot alerts and security updates, private vulnerability reporting, secret scanning, push
  protection, and CodeQL are enabled.
- GitHub Actions may create or approve PRs because GitHub exposes those as one combined switch.
  Project workflows use the creation capability; they do not approve or merge their own PRs.
- Parent [PR #17](https://github.com/crypticpy/phct/pull/17) merged at
  `f66a879a6251485c10e26c172c876b1269885b77`. It converts scheduled maintenance from direct
  pushes to protected, reviewable PRs.
- Parent [PR #20](https://github.com/crypticpy/phct/pull/20) merged at
  `4d53b11b23b184724490bdc2bd979b0192e0fa59`. It makes dispatched validation publish every
  canonical required context for a generated pull request.
- The live [catalog-metrics run](https://github.com/crypticpy/phct/actions/runs/32606412628)
  opened and updated generated [PR #19](https://github.com/crypticpy/phct/pull/19). The exact
  generated head passed the trusted
  [Validate](https://github.com/crypticpy/phct/actions/runs/32606430910),
  [Quality](https://github.com/crypticpy/phct/actions/runs/32606432004), and
  [workflow-lint](https://github.com/crypticpy/phct/actions/runs/32606433063) dispatches, including
  all seven required ruleset contexts. It had no review threads and was closed without merge
  because the rehearsal would replace template sample metrics with repository-operational data.
  The workflow neither approved nor merged its own pull request.
- GitHub correctly parked the ordinary `pull_request` suites for that built-in-token PR as
  `action_required`; the trusted dispatches posted the required commit statuses. This expected
  GitHub behavior is distinct from a failed release gate and is retained in the PR history.

The parent status ledger now records this checkpoint. BCHC's protected operations inventory still
contains older checkpoint text; update it to the accepted release SHA and exact live settings in
the final generated BCHC update before publication.

## Release policy

| Severity | Meaning | Disposition |
|---|---|---|
| P0 | Exposure, arbitrary execution, publication bypass, destructive loss | Stop; fix and rehearse recovery before any demo or release. |
| P1 | Broken core path, critical accessibility failure, corrupt update, unusable supported browser | Fix upstream with a regression test before release. |
| P2 | Important recoverable quality, durability, accessibility, performance, or documentation gap | Fix before stable unless an owner, workaround, and date are recorded. |
| P3 | Minor polish or future enhancement | May be tracked after the wider-demo decision. |

Wider-demo and stable decisions both require zero open P0/P1 findings. Stable also requires no
unaccepted P2 findings.

## Work package 0 — close the protected-automation loop

1. Record PHCT PR #17's reviewed head, merge SHA, resolved thread, and green protected checks.
2. Confirm `main` points to that merge tree and post-merge Validate, CodeQL, workflow-lint,
   supply-chain, scale, browser-quality, and Pages runs finish green.
3. Confirm a maintenance workflow can use the built-in `GITHUB_TOKEN` to open a PR under the new
   combined repository setting.
4. Confirm the generated PR receives the canonical required statuses, cannot push to `main`, and
   does not approve or merge itself.
5. Close the test maintenance PR without merging if it contains only rehearsal data; retain links
   to the run and PR in the evidence ledger.
6. Re-query both repository settings and rulesets and record their exact live configuration in the
   parent status ledger. Carry the protected BCHC operations-inventory update in the final
   generated BCHC pull request rather than editing downstream protected content from PHCT. Never
   record secret values.

Exit: scheduled and no-terminal automation can complete through protected review without a bypass
or a maintainer's terminal.

## Work package 1 — parent interface and content-design polish

All reusable interface work happens in PHCT. Review the generated showcase and every preset at
mobile, tablet, laptop, and wide-desktop widths against the existing “Quiet Instrument” design
brief and design-system tokens.

### Surfaces

- Landing page, navigation, demo banner, latest/featured content, browse tiles, footer, and 404.
- Catalog grid/list views, search suggestions, facets, active filters, sorting, comparison tray,
  pagination/scale messaging, and URL/back-button state.
- Entry page hero, fact strip, gallery/lightbox, in-page navigation, reuse rail, related items,
  citation/print/share states, and long-form prose.
- Submission form, draft/autosave feedback, validation summary, file handoff, GitHub fallback,
  successful handoff explanation, and no-JavaScript path.
- Setup wizard, preset choice, theme preview, schema builder, review/download step, and error
  recovery for nontechnical adopters.
- Governance, cohorts, events, resources, comparison print view, style guide, documentation pages,
  and disabled-module states.

### State matrix

For each surface, inspect empty, one-item, normal, long text, missing image, slow/failing data,
invalid input, keyboard focus, reduced motion, forced colours, 200%/400% zoom, and narrow viewport
states. Verify that:

- hierarchy, spacing, alignment, line length, truncation, and responsive transitions are deliberate;
- all interactive states have obvious hover, focus, selected, busy, success, empty, and error feedback;
- controls use plain language and explain what happens next;
- no component depends on colour, hover, an icon, or JavaScript alone;
- demo content is unmistakably fictional on every relevant BCHC page;
- BCHC branding is coherent but does not fork reusable component code; and
- screenshots and public docs match the final interface.

### Evidence and implementation method

1. Capture a named baseline screenshot matrix from the parent candidate and BCHC rc.2 preview.
2. Log every finding with route, viewport/state, severity, screenshot, expected behaviour, and
   parent file or component owner.
3. Implement fixes in small parent PRs grouped by component or user journey, not by arbitrary CSS
   file.
4. Add DOM, interaction, accessibility, or visual assertions for every P0/P1/P2 correction where
   automation is practical.
5. Attach before/after screenshots for light and dark-ground components, mobile/desktop, and every
   changed preset.
6. Rebuild all presets and the BCHC configuration after each shared interface PR.

Exit: the design rubric has no P1/P2 finding, every preset feels intentional, and the visual
evidence is tied to the exact reviewed commit.

## Work package 2 — usability, accessibility, and browser tuning

Run the critical journeys as visitor, contributor, reviewer, maintainer, and first-time adopter.
Automation must pass first; manual review then covers what automation cannot establish.

- Current Chrome, Firefox, Safari, and Edge.
- iOS Safari and Android Chrome at phone widths.
- Keyboard-only navigation through menu, search, filters, comparison, lightbox, submit, and setup.
- VoiceOver with Safari and NVDA with Firefox or Chrome.
- 200%, 300%, and 400% zoom/reflow; Windows forced colours; reduced motion.
- Long translated-like strings, empty results, unavailable search JSON, offline/slow interactions,
  validation failures, and pop-up-blocked GitHub handoff.
- Accurate headings, landmarks, names, descriptions, status announcements, focus order/return,
  touch target size, contrast, alt text, and print output.

Record browser/OS/assistive-technology versions, route, result, evidence, defect link, retest date,
and reviewer. A serious manual accessibility finding blocks both demo and stable release even when
axe, pa11y, or Lighthouse is green.

Exit: automated accessibility remains zero-blocker and every critical manual journey passes on the
documented support matrix.

## Work package 3 — performance, reliability, and code durability

Retain the current 100-entry support ceiling unless this release adds pagination or incremental
rendering. Treat 500/1,000-entry results as characterization, not a support claim.

1. Re-run deterministic 0/1/10/100/500/1,000 fixtures after interface changes.
2. Preserve the reviewed budgets for build time, artifact size, DOM size, CSS/JS/search payloads,
   Lighthouse, CLS, TBT, filter p95, and search p95.
3. Profile any regression before optimizing. Require a before/after measurement for performance
   changes and do not trade away accessibility or no-JS behaviour.
4. Re-review high-trust paths: issue parsing, YAML emission, slugs, attachments, image decoding,
   redirects, path confinement, updater ownership, checksum verification, GitHub API errors,
   workflow retries, and Pages failure reporting.
5. Exercise timeout, rate-limit, malformed input, partial download, stale branch, failed dispatch,
   missing secret, missing toolchain, and rollback paths with actionable operator messages.
6. Add property/fuzz or table-driven regression cases for any newly discovered parser or path edge.
7. Run exact-toolchain `npm run verify`, browser-quality lanes, actionlint, pinned zizmor, CodeQL,
   dependency audits, license checks, secret scans, and deterministic SBOM generation.

Exit: no unexplained performance regression, no known P0/P1, no unaccepted P2, and all failure modes
provide a safe recovery path a non-developer can follow.

## Work package 4 — open-source and nonexpert maintainer polish

Review the public repository as a stranger who has never met the original developer.

- README: purpose, live examples, support ceiling, prerequisites, 15-minute quick start, no-terminal
  path, screenshots, architecture summary, and clear links to deeper docs.
- LICENSE, attribution, third-party notices, SBOM, dependency/license policy, SECURITY, SUPPORT,
  CODE_OF_CONDUCT, CONTRIBUTING, MAINTAINERS, and CODEOWNERS consistency.
- Structured issue routes for bugs, features, accessibility, documentation, and private security
  reports; remove dead contacts and template-specific placeholders.
- Verified setup, configuration, content review, release, update, rollback, incident, takedown,
  credential rotation, backup/restore, and repository-transfer instructions.
- Plain-language troubleshooting indexed by the message an operator actually sees.
- Version support policy, changelog discipline, migration notes, deprecation policy, and the
  parent/downstream ownership model.
- Clean-clone rehearsal on macOS, Linux, and GitHub-hosted runners; no undocumented local state.
- Public repository hygiene: topics, description, homepage, release assets, screenshots, stale
  branches, labels, Discussions decision, security reporting, and contribution defaults.

The no-terminal GitHub issue/workflow path remains primary for BCHC. Terminal commands are the
developer and emergency-recovery path, not a hidden prerequisite.

Exit: a new adopter can configure and publish a test deployment from the docs, and a different
maintainer can diagnose a failed workflow and roll back without live coaching.

## Work package 5 — final parent release candidate

After work packages 0–4 are green:

1. Freeze reusable changes and update the evidence ledger from current live data.
2. Open a release-record PR that sets the package/lock version to `1.9.0-rc.7`, updates CHANGELOG,
   migration notes, documentation status, supported scale/browser statements, and release links.
3. Run the entire parent suite from a clean clone and require every protected check on the exact
   release-record head.
4. Confirm the generated showcase and every preset come from that same commit.
5. Create immutable tag `v1.9.0-rc.7` only from the merged, verified release commit.
6. Publish candidate notes with full SHA, compatibility impact, protected-path migrations,
   rollback instructions, known limitations, SBOM, SBOM SHA-256, and CI evidence.
7. Verify tag-to-commit equality and download/inspect the published release assets.

If further parent fixes are required, create rc.8; never move or replace rc.7.

Exit: one immutable parent candidate contains all intended reusable polish and complete evidence.

## Work package 6 — update and prove the BCHC demo

1. Run BCHC's updater against the exact final candidate tag.
2. Let the updater open one new update PR; do not hand-copy the parent tree.
3. The new candidate PR advances the lock from the merged rc.4 update (BCHC PR #7); verify its
   provenance before merging. Keep the old PR and run links as audit history.
4. Verify the new branch lock names the exact tag and full parent commit.
5. Review the ownership classification and require all protected BCHC files to remain byte-identical.
6. Confirm BCHC's name, colours, contacts, repository identity, schema, search vocabulary,
   governance, navigation, catalog entries, demo data, images, events, cohorts, resources, and
   protected documentation are unchanged unless explicitly approved.
7. Confirm template-owned code exactly matches the candidate and generated files were rebuilt from
   BCHC's preserved configuration.
8. Require downstream Validate, build matrix, coverage, workflow lint, CodeQL, supply chain, scale,
   browser accessibility, interaction, desktop/mobile Lighthouse, and Pages preview evidence.
9. Compare PHCT showcase and BCHC screenshots at presentation routes; fix generic defects upstream
   and repeat with a new candidate.
10. Rehearse reverting the update branch and redeploying the prior lock/commit.
11. Obtain human review before any merge. Automation must not approve or merge the update.

Exit: the current BCHC configuration proves the exact candidate without content drift, and rollback
is demonstrated from retained evidence.

## Work package 7 — candidate live rehearsal and presentation proof

Complete these gates before creating the stable-version commit or tag:

- Run a clearly fake issue through submission -> generated PR -> media processing -> checks ->
  review -> merge -> Pages -> notification on both current default branches; remove the test
  content afterward.
- Prove candidate-specific issue, media, review, and deploy behaviour in a temporary BCHC rehearsal
  repository built from the exact candidate plus BCHC's protected configuration. This is required
  whenever the candidate changes those paths relative to BCHC's current default branch.
- Check all presentation links and contact destinations from a signed-out browser.
- Confirm the demo banner and fictional-data explanation are visible on home, catalog, entry,
  search/share/print, and presentation entry points.
- Walk the presentation on the actual device, display size, network, and browser; keep an offline
  screenshot/PDF fallback and the last known-good deployment URL.
- Confirm no PII, PHI, credentials, private URLs, test secrets, or non-public contacts appear in
  content, issues, PRs, history, artifacts, analytics, screenshots, or release notes.
- Rehearse bad-deploy rollback and urgent content takedown; record elapsed time and the exact
  operator steps.

Exit: the presentation can proceed even if the network or newest deploy fails, and the live demo
does not imply that fictional content is real.

## Work package 8 — stable publication and deployment

1. After the candidate and live gates pass, open a stable release-record PR directly on top of the
   accepted rc.7 commit. Change `package.json`, `package-lock.json`, CHANGELOG, release status, and
   other version-bearing release documentation from `1.9.0-rc.7` to `1.9.0`; do not include a
   reusable behaviour change.
2. Review the candidate-to-stable diff against that allowlist and run every protected parent check
   on the exact stable-version head.
3. Create immutable tag `v1.9.0` only on the merged stable-version commit. The tag must equal
   `v${packageVersion}` so the updater and ownership verifier accept it.
4. Publish final GitHub release notes, migration/rollback guidance, SBOM and checksum, support
   statement, known limitations, candidate provenance, and links to exact CI runs.
5. Run BCHC's updater against `v1.9.0`. Let it open a stable update PR whose lock release, lock SHA,
   parent package version, and fetched tag all agree; do not hand-edit the candidate lock.
6. Mark the rc.7 BCHC candidate PR superseded only after the stable update PR exists and its
   provenance is verified. Retain both PRs as evidence.
7. Re-run protected-file checksums and the complete downstream suite on the stable update head.
8. Human-review and merge the stable BCHC update, then verify the Pages deployment SHA and all
   presentation-critical routes.
9. Verify the PHCT showcase, release links, repository metadata, quick start, issue forms, private
   vulnerability route, and downloadable artifacts from a signed-out browser.
10. Run the BCHC demo for at least one business day with no unresolved P0/P1; review Actions,
    Pages, browser console, links, layout, and submission behaviour during the soak.
11. Record the PHCT tag/SHA, BCHC lock/SHA, deployment URL/SHA, release assets, check runs,
    reviewers, rollback point, and go/no-go decision in both ledgers.

Exit: BCHC consumes the stable tag and matching stable package version derived from the audited
candidate, and the wider-demo checklist is signed from evidence rather than expectation.

## Pull-request sequence

Use small reviewable parent PRs. The anticipated sequence is:

1. PHCT #17 — completed protected maintenance automation and generated-PR status compatibility.
2. Parent interface PRs — grouped by coherent surface/journey with screenshots and regression tests.
3. Parent reliability/documentation PRs — only findings from the remaining audit, avoiding broad
   style-only rewrites.
4. Parent release-record PR — rc.3 version, changelog, migration notes, and current evidence.
5. New BCHC candidate update PR — generated from the immutable tag and retained as compatibility
   evidence without merging.
6. Candidate live-rehearsal and presentation-proof gates.
7. Parent stable release-record PR — stable package/lock version and release records only.
8. New BCHC stable update PR — generated from `v1.9.0`; human merge only after all gates pass.
9. Small BCHC-only presentation-content PR, if needed — wording/contacts/demo material only, with no
   reusable code.

Any reusable correction requested on a BCHC PR returns to step 2 in PHCT and produces a new
candidate. It is not patched only downstream.

## Required evidence set

Every release decision should link to:

- exact parent and BCHC SHAs and clean-tree verification;
- parent and downstream required-check runs;
- release SBOM plus checksum;
- ownership classification and protected-file checksum report;
- baseline and final screenshot matrix;
- manual browser/accessibility matrix;
- scale/performance report and supported-ceiling statement;
- issue-to-deploy and rollback rehearsal records;
- signed-out link/content/security review;
- Pages deployment SHAs and rollback points; and
- explicit demo, stable, and later handoff decisions.

## User and human checkpoints

Routine implementation PRs may proceed without separate conversational approval. Human action is
still required for:

- final visual/content acceptance when a design choice changes the established brief;
- real-device Safari/iOS and assistive-technology checks that cannot be credibly automated;
- final review and merge of the BCHC template-update PR;
- the stable-release and wider-demo go/no-go decision; and
- naming BCHC's product owner and backup maintainer when organizational handoff begins.

No additional repository token is required for normal maintenance PR creation. If BCHC later
chooses a separate `CONTENT_BOT_TOKEN`, its owner, repository scope, minimum permissions, expiry,
and rotation rehearsal must be recorded without recording its value.

## Execution ledger

| ID | Deliverable | State |
|---|---|---|
| PP-00 | Enable and verify Actions PR creation in both repositories | Complete 2026-08-22 |
| PP-01 | Record PHCT #17/#20 and prove protected maintenance end to end | Complete 2026-08-22 |
| PP-02 | Complete parent interface/state screenshot audit | Not started |
| PP-03 | Implement and verify interface/usability polish | Not started |
| PP-04 | Complete manual browser and assistive-technology matrix | Not started |
| PP-05 | Complete residual reliability/performance/security review | Not started |
| PP-06 | Complete open-source and nonexpert-maintainer polish | Not started |
| PP-07 | Publish immutable final release candidate and evidence | Not started |
| PP-08 | Generate and validate the final BCHC update PR | Not started |
| PP-09 | Publish stable PHCT release and merge BCHC update | Not started |
| PP-10 | Complete live rehearsal, rollback, and one-business-day soak | Not started |
| PP-11 | Assign BCHC owner/backup and complete handoff drills | Deferred until handoff |

Update this table and `release-readiness-status.md` with links and exact SHAs as work completes.

## Definition of done

The work is complete when PHCT has an immutable stable release with zero open P0/P1 and no
unaccepted P2; every supported preset, release gate, manual critical journey, and public document
passes at the exact release commit; BCHC consumes that same commit through its updater with all
protected deployment files preserved; a human has merged and verified the BCHC deployment; the
demo has completed its live rehearsal and soak; and the evidence needed for a nonexpert maintainer
to operate, update, and recover the repositories is current and discoverable.

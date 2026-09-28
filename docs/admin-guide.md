# Maintainer / admin guide

Day-to-day operation of a site built from this template: repository setup, reviewing submissions, editing content, running cohorts and events, and troubleshooting.

## Repository settings at a glance

Every switch outside the `_data/*.yml` files, in one place. The first four are the ones a new
catalog needs; everything under them is optional, and a repository that never touches them behaves
exactly as described in the **Default** column. Each row is explained in full further down this
page, or in the reference it links to.

| Setting, variable or secret | Where to set it | Default | What stops working without it |
|---|---|---|---|
| **Pages source** | Settings → Pages → Source → **GitHub Actions** | "Deploy from a branch" | `Build & Deploy` has nowhere to publish; the site never appears. |
| **Allow GitHub Actions to create and approve pull requests** | Settings → Actions → General → Workflow permissions | Off | Every workflow that opens a pull request runs, does its work and fails on the last step — the content forms, the monthly metrics, the thumbnails, and the updated-date stamp. |
| **Private vulnerability reporting** | Settings → Security → Code security and analysis → **Private vulnerability reporting** → *Enable* | Off | Nobody can report a security problem privately; the issue chooser's fallback is the `organization.contact_email` inbox in `_data/site.yml`, so keep that current if your plan does not offer the setting. |
| **Bootstrap labels** (run once) | Actions tab → **Bootstrap labels** → *Run workflow* | Never run | The issue forms ask for labels that do not exist yet, GitHub drops them silently, and no submission ever scaffolds a pull request. |
| `SUBMISSIONS_OPEN` (variable) | Settings → Secrets and variables → Actions → **Variables** | Unset — anyone may submit | Set it to `false` to accept issue-driven work only from the owner, organization members and collaborators. Delete it to reopen. |
| `VERIFICATION_SWEEP` (variable) | Same path | Unset — the sweep runs | Set it to `false` to stop the monthly [verification sweep](#the-monthly-verification-sweep) reminders. A manual run still works, and the refresh form on an entry page is unaffected. |
| `CATALOG_METRICS` (variable) | Same path | Unset — metrics run | Set it to `false` to stop the monthly [catalog metrics](#the-monthly-catalog-metrics) schedule. A manual run still works. |
| `SECURITY_SIGNALS` (variable) | Same path | Unset — the sweep runs | Set it to `false` to stop the monthly [security signals](#security-review) sweep. A manual run still works, the observations already published stay on the entry pages, and the `security_review` status you set by hand is unaffected. |
| `CATALOG_SHOWCASE` (variable) | Same path | Unset — no showcase | Leave it unset. Set to `true` only if you want your copy to publish the template's landing page and example sites instead of your own catalog (see [the showcase](configuration.md#the-showcase)). |
| `CONTENT_BOT_TOKEN` (secret, optional) | Settings → Secrets and variables → Actions → **Secrets** | Unset | Without it, generated pull requests report their results as **(dispatch)** statuses instead of ordinary checks. Nothing breaks — see [Checks on a generated pull request](#checks-on-a-generated-pull-request). |
| `PHCT_UPDATE_TOKEN` (secret, needed only when an update changes workflows) | Same path | Unset | A template release that touches `.github/workflows/` stops with an actionable run summary before it opens a branch. Releases that do not touch workflows are unaffected. See [PHCT updates use a separate token](#phct-updates-use-a-separate-token). |

Both tokens **expire**. Record which account issued each one and when it lapses somewhere your
successor will look — the repository cannot tell you, and an expired `CONTENT_BOT_TOKEN` degrades
quietly rather than failing loudly.

## One-time repository setup

Work down this list once, in order. [Repository settings at a glance](#repository-settings-at-a-glance) above is the same set as a table, with the optional variables and secrets alongside.

- [ ] **Pages source**: Settings → Pages → Source → **GitHub Actions** (not "Deploy from a branch").
- [ ] **Actions can open pull requests**: Settings → Actions → General → Workflow permissions → **Allow GitHub Actions to create and approve pull requests**. Without this, every workflow that opens a pull request — the content forms (`new-entry`, `new-year`, `new-event`, `refresh-entry`, `also-deployed-by`, `update-schedule`, `update-event-attachments`, `apply-setup`), the monthly metrics, the thumbnails, and the updated-date stamp — fails at its "Create pull request" step.
- [ ] **Labels**: run the **Bootstrap labels** workflow once (Actions tab → *Bootstrap labels* → *Run workflow*), or create these by hand, exactly as named — the automation workflows filter on them:
  - `content:new-entry` — triggers `new-entry.yml`
  - `content:new-year` — triggers `new-year.yml`
  - `content:schedule` — triggers `update-schedule.yml`
  - `content:new-event` — triggers `new-event.yml`
  - `content:event-attachments` — triggers `update-event-attachments.yml`
  - `content:site-config` — triggers `apply-setup.yml` (maintainers only)
  - `content:refresh` — triggers `refresh-entry.yml` (answers to a refresh reminder)
  - `content:also-deployed-by` — triggers `also-deployed-by.yml` (an organization saying they deployed an entry too)
  - `verification` — applied by `verification-sweep.yml` to the refresh issue it keeps per stale entry; nothing triggers on it
  - `review:refresh-changes` — applied by `refresh-entry.yml` when someone reports an entry out of date; nothing triggers on it

  The generated issue forms (`.github/ISSUE_TEMPLATE/*.yml`) already apply these labels when someone opens the issue; you just need the labels to exist in the repo first, or GitHub silently drops them.
- [ ] **`_data/site.yml` → `github.repository`**: set to this repo's `owner/repo`. Drives the submit form's issue links and every "edit on GitHub" link.
- [ ] Configure branding/theme/schema via `/setup/` or `npm run setup` (see the [README](../README.md) quick start and [configuration reference](configuration.md)). With no terminal, paste the wizard's three `_data/*.yml` files into the **Apply setup (creates PR)** issue form and merge the pull request it opens.
- [ ] Clear the demo content: `npm run eject:samples`, or the **Remove the demo content** checkbox on that same Apply setup issue. Until it is gone every page carries a *Demo content* banner — that is deliberate, and it is the only thing telling a visitor that "Baytown Metro Health District" is fictional. The same step switches the `governance` module off; rewrite `_data/governance.yml` as your own review process and policies, then set `governance: true` again. It also removes the showcase — `_showcase/`, `_data/showcase.yml` and `assets/images/showcase/`, the landing page and example sites the template publishes about itself (see [the showcase](configuration.md#the-showcase)). Your fork never builds those anyway: your home page is your catalog.
- [ ] Optional: **`CONTENT_BOT_TOKEN`** — a fine-grained personal access token that makes the checks on generated pull requests run without a click. See [Checks on a generated pull request](#checks-on-a-generated-pull-request) below for what it changes and what to grant it.
- [ ] Before the first PHCT upgrade: **`PHCT_UPDATE_TOKEN`** — a separate, repository-scoped
  credential that may update `.github/workflows`. The protected updater fails before opening a
  branch when a release needs this permission and the secret is absent. Follow
  [Workflow token required for workflow updates](upgrading.md#workflow-token-required-for-workflow-updates).
- [ ] Optional: custom domain — add a `CNAME` file at the repo root; the `pages.yml` build detects it and serves from the domain root.

## Who can submit

By default anyone with a GitHub account can open a `content:new-entry` issue and have the automation draft a pull request from it. That is the point of the template — the catalog collects work from people who do not have write access to the repository. The safety comes from what the job is allowed to do, not from who is allowed to start it: issue text never reaches a shell, the scaffolder refuses to write outside `catalog/<slug>/`, the page body is written with `render_with_liquid: false` so it is never executed at build time, images are fetched through an SSRF guard and re-checked against their magic bytes, and the output is a pull request that only a maintainer can merge. [SECURITY.md](../SECURITY.md) sets this out in full.

If you need to close submissions for a while, add the repository variable `SUBMISSIONS_OPEN` ([where](#repository-settings-at-a-glance)) set to `false`. Every issue-driven workflow (entries, events, cohort years, schedules, attachments) then runs only for issues opened by the repository owner, an organization member or a collaborator. Delete the variable, or set it to anything else, to reopen. Nobody is stopped from opening the issue either way — it simply does not scaffold a pull request, so you can still triage by hand.

## Reviewing a submission

The rules you are applying are published on the site's **Governance** page (`/governance/`, from `_data/governance.yml`, when the `governance` module is on): the review tiers and their turnaround targets, the five criteria, who does what, and the standing policies on privacy, licensing, data governance, accessibility, maintenance and appeals. Submitters are pointed at it from the Submit page and at [contributor-guide.md](contributor-guide.md), so what they were told to expect and what you check are the same list. If you change one, change the other.

1. A submission arrives as a GitHub issue labelled `content:new-entry` (opened via `/submit/` or the issue form directly). The form walks submitters through one section at a time and offers a short form that hides the optional questions, so an entry that arrives with only the required answers is the form working as designed, not a careless submitter — ask for the extras in review if you want them.
2. The `New entry from issue` workflow (`.github/workflows/new-entry.yml`) runs automatically, scaffolds `catalog/<slug>/index.md` from the issue body, and opens a pull request that closes the issue on merge.
   - If scaffolding fails (e.g. missing title, duplicate slug), the workflow comments the error back on the issue instead of opening a PR. Editing the issue to fix the problem re-triggers the workflow (it also runs on `issues: edited`).
3. Any images the submitter dropped into the issue are downloaded into the entry folder by the same workflow (see [Screenshots and images](#screenshots-and-images) below), so the pull request already contains the pictures — you review them, you do not have to fetch them.
4. On the pull request, work through the checklist below. The pull request body already carries a **Maintainer checklist** — the review criteria from `_data/governance.yml` (the same list the governance page shows; a generic five when the site publishes none), the mechanics, and the review-status flip — and, when an answer matched a field's `escalate_on` list in the schema, a **Closer review** block above it naming the field and the answer (the shipped schema flags an unticked PII/PHI attestation, PII/PHI/CJIS under *Data it touches*, and a *Public-facing* audience). Those pull requests also carry the `review:data-governance` label, so you can see from the list which ones are not a five-minute intake.
5. Set the review status. The scaffold wrote `review_status: "Under review"`; before merging set it to `Reviewed & approved` (the schema names both values: `entry.status_scaffold_value`, `entry.status_approved_value`). If the entry needs changes, leave the pull request open with `review:revisions-requested` and say specifically what to change — the submitter edits the issue or replies on the pull request, and it comes back round.
6. Merge. The `Build & Deploy` workflow runs on every push to `main` and republishes the site, usually within a couple of minutes. Once it has deployed, the automation comments the published URL back on the issue the submission came from ("Your entry is now live at …"), so the submitter hears the outcome without you writing anything. That comment is best-effort: if it does not appear, nothing is wrong with the deploy.

### Review tiers and labels

The governance page describes review as tiers with turnaround targets; the pull request labels are how the tiers show up in the repository. **Bootstrap labels** (Actions tab, run once) creates them; the scaffolder applies the first, reviewers move the rest by hand.

| Label | Who | Meaning |
|---|---|---|
| `review:intake` | Intake team (a small rotating group) | Applied to every scaffolded pull request. Complete, contact reachable, nothing that looks like PII/PHI — within about five business days. |
| `review:data-governance` | Applied by the scaffolder | An answer matched an `escalate_on` list; the **Closer review** block in the body says which. Not a tier — a flag that intake should route it on. |
| `review:committee` | Governance committee | Substantive review: does it work as described, are the technology, licensing and portability claims accurate, right category, data-governance baseline met — within about ten more business days. |
| `review:partner` | A partner reviewer | Referred on: identifiable data, clinical decision support, public-facing use. |
| `review:revisions-requested` | Whoever reviewed | Sent back with specific changes on the pull request. Swap it for the tier label when the changes land. |
| `review:declined` | Governance committee | Not published, with a rationale on the pull request; the pull request is closed, the branch may be deleted, and the submitter may appeal to the full committee. |

The labels are a convention the workflow does not enforce; if your process has different tiers, rename them in `bootstrap-labels.yml` — the scaffolder's label step is best-effort and reports, rather than fails, when a label is missing.

**Declining.** Rare, and always with a reason the submitter can act on. A comment that has worked:

> Thanks for submitting this. We are not going to publish it as it stands, because *[the specific reason — e.g. the shared material includes patient-level data and the attestation cannot be made honestly; or there is no working link or reachable contact, so a reader could not evaluate it]*. If *[what would change the outcome]*, please reopen by editing the issue and we will take another look. You can also ask for this decision to go to the full Governance Committee by replying here.

Add `review:declined`, close the pull request without merging, and leave the issue open long enough for the submitter to see the comment — the automation does not comment on a closed pull request.

### Review checklist

Content

- [ ] The summary says what the thing does, in plain language, in one or two sentences. Rewrite jargon rather than asking the submitter to.
- [ ] Nothing in the entry is protected, personal or non-public: no PHI or PII, no credentials, no internal URLs that leak a private host, no unreleased procurement detail. This applies to the write-up, the screenshots and the linked resources.
- [ ] Named individuals are the submitter's own contact only. Other people are referred to by role.
- [ ] Claims with numbers are the submitter's own and are attributed in the write-up ("across 38 contracts in the pilot"), not stated as general fact.
- [ ] `select` and `multiselect` values are the ones you would have chosen. A wrong `readiness` or `data_sensitivity` misleads every future reader — fix it in the PR and say why in a comment.
- [ ] Cost bands and approvals are the submitter's own claim about their own project. Do not fill them in for them; leave blank rather than guess.

Screenshots

- [ ] Every image actually shows the tool, not a stock graphic or a logo wall.
- [ ] No real people's data on screen — names, addresses, record numbers, case detail, email addresses in a header bar. If in doubt, ask for a redacted version rather than merging.
- [ ] Every image has `alt` text that describes what is shown, in one sentence under about 125 characters. Write it yourself if it is missing; the validator warns but does not block.
- [ ] Images are inside `catalog/<slug>/screenshots/` and referenced with a site-absolute `src`. A `src` pointing at a remote host is a warning in validation — download the file into the folder instead, so the page does not break when someone else's host changes.

Links

- [ ] Every `resources` entry has a label that says what the reader gets ("Evaluation memo (PDF)", "Six-minute walkthrough video"), not "Link" or a bare URL.
- [ ] Links resolve, and resolve for someone outside the organization. A shared drive URL that only your staff can open is worse than no link — either make it public or drop it.
- [ ] There is at least one link somewhere — a URL field or a `resources` item. An entry with none is not published: nobody could evaluate or adopt it. `check_front_matter.rb` says so (a failure in the shipped schema, where `entry.require_link` is on; a warning otherwise); ask the submitter for a link rather than merging around it.

Mechanics

- [ ] The **Validate Content** check is green (`check_front_matter.rb`, `check_file_sizes.rb` and the image-derivatives check).
- [ ] If a slide deck was promised, it has been uploaded into `catalog/<slug>/` as `deck.pdf`.
- [ ] The maintainer checklist in the pull request body is complete. (Generated PRs carry their own checklist; `.github/PULL_REQUEST_TEMPLATE.md` is the one hand-opened PRs get.)

## Checks on a generated pull request

A pull request opened by a workflow using the built-in `GITHUB_TOKEN` does not, by GitHub's design, trigger other workflows — otherwise a workflow could start itself in a loop. Left alone, that means the **Validate Content** and **Quality** checks on a submission's pull request sit at *"This workflow requires approval from a maintainer"* until someone clicks **Approve and run**.

The template handles this without a token: after opening the pull request, each content workflow dispatches `validate.yml`, `quality.yml`, and `lint-workflows.yml` against the new branch (`workflow_dispatch` is the exception to the no-loop rule). Validate also runs the scale, supply-chain, and CodeQL gates. The run summary lists which workflows it dispatched. Two consequences worth knowing:

- A dispatched run is triggered against the **branch**, so it appears in the Actions tab rather than as a PR check run — but the release workflows post canonical required statuses plus **Validate Content (dispatch)** and **Quality (dispatch)** on the head commit, and those *do* show in the pull request's checks box. Read them there; if they are missing, look at the branch's latest commit in the Actions tab.
- If the bot pushes again afterwards (the thumbnail job does this when a PDF is attached), the checks are re-dispatched for the new head commit. Always read the check status on the *latest* commit.

**With `CONTENT_BOT_TOKEN` set**, the workflows push and open the pull request as that token's user instead, so the pull request triggers the complete required-check set normally, the checks appear in the PR's own checks box, and nothing is dispatched by hand. To set it up:

1. Create a fine-grained personal access token (Settings → Developer settings → Personal access tokens → Fine-grained tokens), scoped to **this repository only**.
2. Grant exactly two repository permissions: **Contents: Read and write** and **Pull requests: Read and write**. Nothing else is needed — the token never touches issues, actions or settings.
3. Add it as a repository secret named `CONTENT_BOT_TOKEN` (Settings → Secrets and variables → Actions → Secrets).

Give it a short expiry and re-issue it on a calendar reminder; the workflows fall back to `GITHUB_TOKEN` and the dispatch path the moment the secret is absent, so an expired token degrades rather than breaks. The token's user becomes the author of every content commit, so use a machine account if you would rather that not be a person's name. [SECURITY.md](../SECURITY.md) covers the trust this delegates.

### PHCT updates use a separate token

`CONTENT_BOT_TOKEN` deliberately lacks permission to change Actions workflows. The **Update from
PHCT** workflow uses `PHCT_UPDATE_TOKEN` instead because parent releases normally update files
under `.github/workflows/`. Keep that higher-privilege credential repository-scoped, short-lived,
and owned by the release or machine account. The exact permissions and setup path are in
[Workflow token required for workflow updates](upgrading.md#workflow-token-required-for-workflow-updates).

Without that secret, a release that changes workflows stops with an actionable run summary before
the candidate toolchain, full verification, push, or pull request. Releases that do not change
workflows retain the built-in-token fallback.

The credential is not available while candidate code runs. After verification, the updater moves
the exact commit through a digest-checked Git bundle into a fresh publication runner that never
executes the candidate, and only that isolated job receives the token for push and pull-request
operations.

## Bot pull requests

Not every pull request in the repository comes from a person, and the three kinds want different
handling.

**Dependabot** keeps the toolchain current. `.github/dependabot.yml` groups its updates so you see
at most three small pull requests a week — one for GitHub Actions, one for npm packages, one for
the Ruby gems — rather than a dozen. A grouped bump whose checks are **green** is normally fine to
merge: the checks that just passed are the same ones that guard a content pull request, and they
built and validated the whole site with the new versions in place. A **red** one is not yours to
debug — leave it open and ask for help ([SUPPORT.md](../SUPPORT.md)); a red dependency update is almost always a
problem with the update itself, not with anything you did. Nothing on your published site changes
while it sits there.

**The monthly catalog metrics pull request** (`automation/catalog-metrics`) and **the
updated-date stamp pull request** (`automation/stamp-entry-updates`) are the repository's own
housekeeping, and they are yours to merge like any content pull request: read the diff, check it is
green, merge. The first publishes the "How the catalog is doing" figures; the second publishes the
`updated:` dates for entries someone edited. Both are small, and both wait for you.

**AI code-review bots, if your organization has installed any** (Sourcery, CodeRabbit, Copilot
code review, and the like), should stay off content pull requests: an entry PR is catalog data,
not code, and a wall of automated review comments makes the merge step confusing — worse, if your
branch rules require conversations to be resolved, an unanswered bot thread can block the merge
button entirely. Every scaffolded content PR is labelled with its
`content:*` type (`content:new-entry`, `content:new-event`, `content:new-year`,
`content:schedule`, `content:event-attachments`) when it is created, and its title always starts
with one of five fixed prefixes: `Add entry:`, `Add event:`, `Scaffold cohort`, `Update cohort`,
or `Update attachments for event`. For Sourcery, the setting that works is in its web dashboard,
not the repository: app.sourcery.ai → Review Settings → **Ignore title keywords** — add the five
prefixes there, without the trailing colon (`Add entry`, not `Add entry:`); the field matches
keywords as whole words, and punctuation in a keyword keeps it from matching. (The template also ships a `.sourcery.yaml` with a skip-by-label rule, but that
file only reaches Sourcery's older bot; the current review product ignores it.) If you use a
different review bot, configure its equivalent skip setting — by label or by title prefix,
whichever it supports — and leave it on for everything else, especially template update PRs,
which are real code changes worth a bot's opinion.

If you are working on the template itself rather than running a catalog,
[maintaining.md](maintaining.md) describes a stricter release-engineering routine for the same
bots.

## Editing or removing an existing entry

- **Small edit**: every entry page has a **Suggest an edit on GitHub** link (bottom of the page) that opens the file directly in GitHub's editor, pre-targeted at `catalog/<slug>/index.md` on the configured branch. Commit directly or via a PR.
- **Larger edit / local**: edit `catalog/<slug>/index.md` in a checkout, run `npm run validate` before pushing.
- **The `updated` date is prepared automatically and still reviewed.** When a push to `main` modifies an entry's `index.md`, the `Build & Deploy` workflow's first job (`stamp`, running `scripts/stamp_updated.mjs`) sets `updated:` to that day — only on files git reports as *modified* (a new entry has `published`), never on `sample: true` content, and never backwards. It opens or updates one small `automation/stamp-entry-updates` pull request instead of pushing to protected `main`. The current reviewed commit deploys immediately; merge the green follow-up PR to publish the date, feed, and "Recently updated" change. Set the field by hand any time you want a different day — the stamp never overrides a date that is already current.
- **Deprecate (the default for "this is no longer current")**: set the review-status field to its deprecated option — in the shipped schema, `review_status: "Deprecated"` in the entry's front matter. The entry stays published as a record: its page opens with a warning notice, its card says "Deprecated — kept for the record", the home page stops featuring it, and the catalog lists it after every live entry. Nothing is lost for the reader who already built on it, and the next person still finds out what was tried. The schema names the field and the value (`entry.status_key`, `entry.deprecated_value` — see [content-model.md](content-model.md#review-status-and-deprecation)), so a schema without a review status has no deprecated state either.
- **Remove**: delete the entry's folder (`catalog/<slug>/`) in a PR. Reserve this for the cases deprecation does not cover — a duplicate, a submission that should never have been merged, a contributor who withdraws consent.
  Deleting the folder removes the page but not the git history: if the entry contained protected data, a real person's contact details, or anything published without consent, stop here and follow [incidents.md](incidents.md) instead.
- **Un-feature / feature**: toggle `featured: true`/`false` in the entry's front matter. `featured` is a reserved key set by automation to `false` on scaffold; there's no UI for it, it's maintainer-only (the schema's `form: false` fields, like `featured` would be if added, are hidden from submission forms by design).
- Every entry page also has a **Report an issue with this entry** link, which opens a blank pre-titled GitHub issue (not labelled, so it does not trigger automation) — read and triage these manually.

## The monthly verification sweep

A catalog decays quietly. The pilot in an entry became a production system, the contact changed jobs, the tool was retired — and nothing in the repository changes, so the entry keeps reading as current. The template handles this in three parts: the site tells *readers* when an entry is old, the sweep asks *the person who submitted it* whether it still holds, and their answer comes back as a pull request you review.

**How old is old.** Every entry has a last-confirmed date: the newest of `verified`, `updated` and `published`. When that date is further back than `catalog.verify_after_days` in `_data/site.yml` (365 by default), the entry page shows a one-line note above the fact strip — now carrying a **Still accurate? Confirm it** link — its catalog card shows "Last confirmed <Month Year>", and the card sorts after fresher ones in the default order. Nothing turns amber and nothing is hidden: an entry nobody has re-checked in a year is still the best account of that project anyone has written down.

**The sweep.** `.github/workflows/verification-sweep.yml` runs at 07:00 UTC on the 1st of each month (and on demand from the Actions tab). For each entry past the window it opens **one** issue labelled `verification`, titled *Still accurate? <entry title>*, holding the entry's link, its last-confirmed date and the two one-click answers below. Every issue carries a hidden `<!-- refresh-entry: <slug> -->` marker, which is how the next run finds the same thread and rewrites it in place rather than opening a second one — leave that line alone. An entry that has been confirmed since gets its issue closed with a note. If everything is inside the window, nothing is opened.

**Who gets asked.** The issue @mentions the entry's submitter when they left a GitHub username in the optional *Your GitHub username* field (the schema's `entry.submitter_key` — see [content-model.md](content-model.md#top-level-structure)), plus everyone named in `catalog.refresh_mentions` in `_data/site.yml`. That list starts empty; put your maintainer team or a review group in it so an unanswered reminder has an owner. The template sends no email of its own — the mention is the whole notification, and GitHub delivers it however each mentioned account has notifications set (for most accounts, that is an email). A mention reaches a username whether or not it has any connection to your repository, and it recurs monthly while entries stay stale — so list people who agreed to be listed.

**Not all at once.** A catalog that crosses the line in a clump would otherwise arrive as fifty notifications on the 1st. One run opens at most `catalog.refresh_max_new_issues` new issues (20 by default); the run summary says how many were deferred, and the next run — or a manual one from the Actions tab — picks up where it stopped, oldest first. Existing issues are always refreshed and never count against the cap.

The sweep only asks for `issues: write`. It never edits an entry.

**Answering one.** Both links in the issue open the same short form, *Refresh an entry* (`.github/ISSUE_TEMPLATE/refresh-entry.yml`), with the slug already filled in:

- **Yes, still accurate** → `refresh-entry.yml` stamps `verified: <today>` on `catalog/<slug>/index.md` and opens a one-line pull request that closes the issue. The whole diff is one date. Merge it and the clock resets.
- **No, something changed** → no pull request. Nobody can turn prose into a diff mechanically, so the notes are quoted into a comment addressed to the maintainers, the issue is labelled `review:refresh-changes` and stays open until a person has applied the change. That is your queue: filter issues by that label.

A maintainer can always do it by hand instead — add or update one line in `catalog/<slug>/index.md`:

```yaml
verified: "2026-08-17"
```

`verified` is a reserved key like `updated`: optional, `YYYY-MM-DD`, validated by `check_front_matter.rb` when present. Setting it resets the entry's clock even if nothing else about the entry changed — which is the point, since "we checked and it is still accurate" is real information. The refresh flow never moves it backwards and never touches sample content; when it declines to act it says why on the issue rather than going quiet.

**Turning it off.** Set the repository variable `VERIFICATION_SWEEP` to `false` ([where](#repository-settings-at-a-glance)), or delete the workflow file — the refresh form still works for anyone who follows the link on an entry page. To change the window instead of removing the reminder, edit `catalog.verify_after_days` in `_data/site.yml` — the site notices and the sweep both read it, so they can never disagree. Setting `SUBMISSIONS_OPEN` to `false` also stops outside answers becoming pull requests; the issue gets a comment saying a maintainer will apply it by hand.

## "Also deployed by" submissions

The most useful fact about a use case is that somebody else has already run it, and the organization that can say so is not the one that wrote the entry. The **Also deployed by** form (`.github/ISSUE_TEMPLATE/also-deployed-by.yml`, linked from the bottom of every entry page with the slug already filled in) collects four things — organization, link, and an optional contact address and note — and `.github/workflows/also-deployed-by.yml` turns them into a pull request that appends one item to the entry's `also_deployed_by` list. A resubmission is matched against the existing list by its organization name or its link (either lowercased); when nothing matches, the item is added, and the pull request says "added". When something *does* match, the existing row is **replaced wholesale** — label, link, email and note all take the new values — and the pull request says so plainly: the title reads "Update the &lt;organization&gt; deployment listing on &lt;slug&gt;", the body states that this replaces an existing listing rather than adding one, and the maintainer checklist gains a line asking you to confirm the submitter actually represents that organization before you merge a listing that looks like theirs but isn't.

The whole diff is one list in one entry's front matter. What to check before you merge:

- [ ] **The organization is real**, and plausibly one the submitter belongs to. This is a claim about somebody else's page; the automation cannot verify it and neither can the diff.
- [ ] **On an "update" pull request, the submitter plausibly represents the organization whose listing this replaces** — not just the organization named in the new row. Anyone can resubmit an org name or link that is already listed and overwrite its contact details.
- [ ] **The link resolves and is theirs** — their deployment, their repository, their fork, or their organization's page. A link to the *original* project, or to a vendor's marketing page, is not evidence that this organization deployed anything.
- [ ] **The email address, if there is one, was offered on purpose.** It goes on a public page as a `mailto:` link, which means it gets scraped. A shared team address is almost always the right answer; if a personal one arrived, ask on the issue before merging rather than publishing it and apologising afterwards.
- [ ] **The note reads as information, not promotion.** One or two sentences about what they adapted, or would warn the next team about, is the point; a vendor pitch is not.
- [ ] **The diff is that one list and nothing else.**

Decline by closing the issue with a sentence about why — the submitter gets the notification, and nothing about the entry has changed. Nothing reaches the site until you merge. Setting `SUBMISSIONS_OPEN` to `false` stops outside submissions becoming pull requests at all; the issue gets a comment saying a maintainer will add it by hand.

A maintainer can always do it by hand instead — the field is an ordinary [`links` list](content-model.md#links) whose items may carry the optional `email` and `note` keys:

```yaml
also_deployed_by:
  - label: "Multnomah County Health Department"
    url: "https://www.multco.us/health"
    email: "digital-services@multco.us"
    note: "Kept the classifier, retrained on their own call transcripts."
```

Which field the flow writes to is named by `entry.deployments_key` in `_data/schema.yml` ([content-model.md](content-model.md#also-deployed-by)); remove that pointer and the form reports that the feature is not configured and the entry pages stop offering the link.

## The monthly catalog metrics

The governance page can carry a short "How the catalog is doing" block — submissions opened, entries published, distinct contributing organizations and review turnaround, by quarter — so maintainers can see at a glance whether the catalog is being used and how quickly review moves. The figures come from this repository's own issues and pull requests; nothing is installed on the site and no analytics vendor is involved.

**The workflow.** `.github/workflows/metrics.yml` runs at 07:30 UTC on the 2nd of each month (and on demand from the Actions tab). It runs `scripts/metrics.mjs`, which reads the repository through two REST calls and counts, over the last four calendar quarters:

- **Submissions** — issues carrying the `content:new-entry` label (the entry form applies it), by the quarter they were opened. Pull requests never count, whatever their labels.
- **Published** — merged pull requests whose branch starts with `entry/` (the scaffolder's naming), by the quarter they merged. A hand-made entry PR on such a branch counts too; a dependency bump does not.
- **Contributing organizations** — the distinct values of the field `entry.contributor_key` names in `_data/schema.yml` (`organization` in the shipped schema), across live entries, `sample: true` content excluded. Delete the key and the figure — and its card and column — disappear.
- **Review turnaround** — for every published PR whose body says `Closes #N` (again the scaffolder's doing), the days from the issue being opened to the merge; the page shows the median and the 90th percentile with the count they rest on. An unlinked PR still counts as published, just not here.

The script writes `_data/metrics.json` only when the figures differ from the committed file (the generated date alone never causes a commit); the workflow then opens or updates one `automation/catalog-metrics` pull request. Review the figures there and merge the green PR to publish them through the normal Pages workflow. Until the file exists — a fresh fork, or a repository that ejected the samples, which deletes the template's sample figures — the block, its nav item and the "How the catalog is doing" heading are simply not rendered; the organizations card and column also stay hidden while the count is zero, and the review-time card until something has been reviewed. **If a run goes wrong, or you just want the numbers current:** open the Actions tab → **Catalog metrics** → **Run workflow**. A manual run always works, including when the schedule has been switched off with `CATALOG_METRICS`, and ticking **Preview only** shows the figures in the run summary without opening a pull request. If you have a checkout, the same thing runs locally with `GITHUB_TOKEN=$(gh auth token) node scripts/metrics.mjs`; commit the file through a pull request afterwards.

The workflow asks for `contents: write` and `pull-requests: write` only for its maintenance branch and PR, plus `actions: write` to dispatch required checks when it uses the built-in token. It never pushes directly to the protected default branch.

**Turning it off.** Set the repository variable `CATALOG_METRICS` to `false` ([where](#repository-settings-at-a-glance)) to stop the schedule — a manual run still works — or delete the workflow file. Deleting `_data/metrics.json` removes the block from the page. To change the sentence above the figures, set `metrics_intro` in `_data/governance.yml`.

## Security review

Some entries link to code, and a peer who finds one is a step away from running somebody else's software inside their own organization. **This catalog links to that code; it does not host it, run it, or audit it, and nothing on the site should ever be read as saying that it does.** Every entry with a repository link carries one plain sentence saying so, and no status, score or badge anywhere on the site overrides it.

Around that sentence there are two layers, and it matters which is which.

### The three review statuses

`security_review` is an ordinary maintainer-set field — `form: false`, so no submission form asks for it, exactly like `review_status`. It appears in the entry's fact strip and in the catalog's filter panel. It says how much a *person* has looked, and nothing more:

| Value | What it claims | What it does not claim |
|---|---|---|
| **Coalition security-reviewed** | A coalition maintainer read this project's security practices — its policy, its dependencies, how it handles data — on the day the pull request records. | That the code was audited, that it has no vulnerabilities, or that it is still true today. It is a point-in-time reading of practices. |
| **Automated checks only** | Nobody has reviewed it. All that exists is what the monthly sweep could observe from the outside. | Anything at all about what the code does. |
| **Not reviewed** | Nobody has looked at this project on the catalog's behalf. | — the honest default, and the right value whenever you are not sure. |

Leaving the field off an entry reads the same way as **Not reviewed**: nothing appears in the fact strip. Set it in the entry's pull request, the same place you set `review_status`.

### What the automated sweep observes

`.github/workflows/security-signals.yml` runs at 08:00 UTC on the 3rd of each month (and on demand from the Actions tab). For each live entry whose repository link is a public `https://github.com/<owner>/<repo>` URL, `scripts/security_signals.mjs` records into `_data/security_signals.json`:

- whether the repository still resolves, and whether it is **archived**;
- the day it was **last pushed to**, and whether the owner is an organization or a personal account;
- the **license** GitHub identified, and whether a **security policy** is published;
- the public [**OpenSSF Scorecard**](https://scorecard.dev) score and date, with a few notable checks (code review, known vulnerabilities, pinned dependencies, static analysis).

These are facts about how a project is *packaged*. Not one of them inspects what the code does. A repository with a perfect Scorecard can still be malicious, and a repository with no score at all — the normal case for a small public-sector project nobody has crawled — is not thereby suspect. The entry page presents them under "Automated observations" with the date they were taken, and says the same thing in a line underneath.

The workflow never edits an entry and never touches `security_review`. It opens or updates one `automation/security-signals` pull request when something moved; skim the diff for anything worth acting on — a repository that has gone missing, a project that has been archived since, a score that fell — and merge it to publish. Unchanged observations open nothing. A failed call records `"unavailable"` rather than failing the run, so a rate limit does not turn the monthly job red.

### Before you grant "Coalition security-reviewed"

There is no automated gate on this value; it is a claim your coalition makes in public, under its own name. What is worth looking at before you make it:

- [ ] **The link is the project it says it is** — the organization's own repository or a fork they maintain, not a mirror, a vendor's marketing page, or a similarly named project.
- [ ] **Somebody is still there.** The last push, the open-issue response, whether it is archived. An unmaintained dependency is the most common way a reused project becomes a liability.
- [ ] **A license that permits reuse**, and one your organization can actually accept.
- [ ] **A security policy, or a way to report a problem privately.** A project with nowhere to send a vulnerability report has not thought about receiving one.
- [ ] **The Scorecard, read as a prompt and not as a grade.** A low *Code-Review* score on a two-person team is a fact about the team; a low *Vulnerabilities* score is a thing to go and look at.
- [ ] **Whatever the entry itself claims about data handling** still matches what the repository does.

**None of this is a safety guarantee, and the site never says it is.** The status records that a named group looked, on a date, at the things above. A reusing organization still has to run its own security review before deploying — which is precisely what the sentence on every entry page tells them to do.

> **Not settled yet.** Whether "Coalition security-reviewed" expires, how often it is renewed, and who on the coalition may grant it are governance decisions this template does not make for you. Until your community decides, treat the status as a record of one reading by one maintainer and write the date and the reviewer into the pull request that sets it.

**Turning it off.** Set the repository variable `SECURITY_SIGNALS` to `false` ([where](#repository-settings-at-a-glance)) to stop the schedule — a manual run still works — or delete the workflow file. Deleting `_data/security_signals.json` removes the observations card from every entry page; the disclaimer sentence and the `security_review` status stay. Removing `entry.repo_key` from `_data/schema.yml` turns the whole feature off: the sweep reports that it is not configured and writes nothing, and neither the card nor the disclaimer renders. See [content-model.md](content-model.md#security-signals) and [configuration.md](configuration.md#_datasecurity_signalsjson).

## Screenshots and images

Fields of type `images` (shipped: `screenshots`) are the one place where files arrive with the submission rather than after it.

**How they get in.** The submission form tells contributors to attach pictures on the GitHub issue screen; GitHub uploads them to its own CDN and rewrites them into the issue body as Markdown. When `new-entry.yml` runs, the scaffolder parses that field for Markdown images, `<img>` tags and bare URLs, downloads each one into `catalog/<slug>/screenshots/`, and writes the front matter for you:

```yaml
screenshots:
  - src: /catalog/<slug>/screenshots/01.png
    alt: "…the submitter's alt text, or a fallback…"
```

Files are numbered in the order they were attached (`01.png`, `02.jpg`, …) and named from the format actually detected, not from the URL.

**Limits enforced by the download step** (`scripts/lib/images.mjs`):

- at most **8 files** per entry;
- **15 MB total** across all of them;
- **PNG, JPEG, GIF or WebP only**, verified against both the response content type and the file's magic bytes — anything else is skipped;
- one 30-second request per URL, redirects followed.

A failure never fails the scaffold. If an image cannot be downloaded it is left out of the front matter (so the page never shows a broken image) and the URL plus the reason are written into the workflow summary and the pull request body, so you can re-add it during review — download it yourself and commit it under `screenshots/`. Front-matter validation warns about any remote `src` because the page stops working when someone else's host changes.

**Adding or replacing images later.** There is no issue flow for this — do it in a pull request:

1. Add the file to `catalog/<slug>/screenshots/`, keeping the two-digit naming (`03.png`).
2. Add or edit the matching `{src, alt}` item in the entry's front matter. Order in the list is the order in the gallery.
3. To replace an image, overwrite the file and update the `alt` if what it shows has changed. To remove one, delete both the file and its list item — an orphaned `src` fails validation, and an orphaned file just sits in the repository.
4. Keep images reasonably small. There is no per-file cap in validation below the 10 MB warning in `check_file_sizes.rb`, but a screenshot has no business being over a few hundred kilobytes; a 1280px-wide PNG run through `pngquant` is usually 30–60 KB. `check_file_sizes.rb` warns separately above **2 MB** for an image, which is where a straight-from-the-phone retina export lands.

**Responsive copies are generated for you.** Every image under `catalog/` gets AVIF and WebP siblings at 400/800/1280 px (`01-400.avif`, …) so a phone downloads a fraction of the bytes. The bot writes them when a submission or a screenshot lands in a pull request; run `npm run images` yourself if you add one in a local checkout, and commit the result alongside the source. The pages render correctly without them, so a missing derivative is a speed regression and never a broken picture. Full detail — including why they are committed rather than built — is in [images.md](images.md).

**Alt text.** Describe what the picture shows in one sentence, under about 125 characters: "Triage queue listing seven ranked signals with area, signal strength and status." Not "Screenshot", not the entry title again. Alt text is a caption in the lightbox as well as a screen-reader label, so it is visible work, not compliance work.

**Redaction.** Screenshots are the most common way protected data reaches a public catalog. Blur or replace real values before merging; a mock dataset is better than a redaction box, and a redaction box is better than a blur. If a submitter cannot produce a clean screenshot, the entry is fine without one — the card and entry page degrade to a text-first layout rather than showing a placeholder.

## Other attachments and thumbnails

- File-type schema fields (e.g. `deck_pdf`) store a path (`/catalog/<slug>/<filename>`) in front matter. The submission form asks for the file directly (GitHub's `upload` control), and the scaffolder commits it into the entry folder with the rest of the pull request. If the submitter skipped it, the path is still recorded and the file can be added to that folder in the same PR by hand. If the download was refused (the file has to actually be a PDF: the scaffolder checks the bytes, and says so on the pull request when they do not match), the front matter keeps the attachment's URL, and the pull request note names the path to commit the file under instead. A file field may also hold any other `http(s)` URL. A pasted link that is not a GitHub attachment is stored as it is and not downloaded. That is the way to point at a file too big for the repository; see [Large files](#large-files).
- `links`-type fields (shipped: `resources`) hold `{label, url}` pairs and need no files at all. They are the right home for a shared drive folder, a recorded demo, a model card or a vendor page — anything that does not deserve its own `url` field. Check that each one opens for someone outside the organization before merging.
- Any `file` field flagged `thumbnail: true` in `_data/schema.yml` (shipped: `deck_pdf` → `deck.pdf`) gets a first-page thumbnail rendered automatically:
  - `thumbnails.yml` (**Generate entry media**) triggers on a PR touching any `*.pdf` file — or any `*.png`, `*.jpg`, `*.jpeg` or `*.webp`, since the same job also writes the responsive derivatives described above (it can't read the schema to narrow the trigger, since GitHub evaluates `paths:` before checkout — the schema-driven filtering happens in the next step instead).
  - It runs `scripts/thumbnail_sources.mjs` to find PDF → `thumb.jpg` pairs under the schema's `entry.path` (default `catalog/`), skips empty placeholders and anything that isn't actually a PDF (checks the `%PDF` file signature), and renders each one whose `thumb.jpg` is missing or out of date with `pdftoppm` (poppler-utils: `pdftoppm -jpeg -jpegopt quality=85 -scale-to-x 800 …`).
  - "Out of date" is judged from git history, not file times: a thumbnail is re-rendered when the last commit that changed the PDF is neither the thumbnail's last commit nor an ancestor of it (`thumbnail_sources.mjs --stale`). A checkout gives every file the same fresh timestamp, so replacing a deck in a pull request used to leave its old thumbnail in place.
  - It commits `thumb.jpg`, the image derivatives and `_data/derivatives.json` back onto the PR branch itself with a plain `git add`/`commit`/`push`, then re-dispatches **Validate Content** and **Quality** so the new head commit carries both statuses.
  - **This does not run on PRs from forks** (the job is gated on `github.event.pull_request.head.repo.full_name == github.repository`, since fork PRs get a read-only token). For a fork-originated PR, run the workflow manually afterward via `workflow_dispatch`, or generate `thumb.jpg` locally and commit it.
  - `_includes/entry-thumb.html`'s fallback order for the card image: explicit `thumbnail` front-matter value → the first image of the entry's `images` field → an existing `<entry>/thumb.jpg` → nothing. There is no generated placeholder: an entry with no picture gets a text-first card, which is honest and reads better than a fake graphic.

## Large files

Size limits, from smallest to largest:
- A GitHub issue attachment tops out at 25 MB, and the scaffolder's download cap is
  the same 25 MB.
- `npm run validate` warns at 10 MB and fails at 50 MB (`scripts/check_file_sizes.rb`).
- GitHub refuses a push containing a file over 100 MB.
- A Pages site should stay under 1 GB in total.

A recorded webinar, a dataset or a long report belongs outside the repository. Link
to it instead.

**Why not Git LFS.** GitHub Pages does not serve LFS content. The published site gets
the few-hundred-byte pointer file that LFS leaves in the repository, not the file, so
every link to it downloads a text stub. LFS also bills storage and bandwidth against
the account's quota on every clone and CI checkout. Don't track catalog files with LFS.

**Where large public files go: one long-lived release.** A GitHub Release can hold
assets of up to 2 GiB each, and they are served from GitHub's download hosts, not from
the Pages site.
1. On the repository, go to **Releases** → **Draft a new release**.
2. Type a tag that will never be reused for a version, for example `files`, and
   choose **Create new tag: files on publish**.
3. Title it "Files". Untick **Set as the latest release**, so it never stands in for
   a version.
4. Drag the files into the assets box: the web UI takes up to 2 GiB per file.
5. Publish. Assets on a draft release are not downloadable.
6. Add files later with **Edit** on the same release. Don't create a new release per
   file.

Each asset's URL is stable:
`https://github.com/<owner>/<repo>/releases/download/files/<file-name>`. Copy it
from the asset link on the release page.

**Who can download it.** An asset inherits the repository's visibility. On a public
repository anyone can download it. On a private or internal repository only people
with read access can, even when the Pages site itself is public. Check with a
signed-out browser before you link it from a public entry.

**Link it.** Put the URL in the entry's `file` field (a `file` field may hold an
`http(s)` URL; the page then renders an outbound row, not a download) or in a
`links` item. Then give the release a host rule in `_data/site.yml` so the link reads
"File library · Download" instead of "github.com":

```yaml
link_access:
  hosts:
    - { match: "github.com/<owner>/<repo>/releases/download/", name: "File library", download: true }
```

See [configuration.md](configuration.md#link-access) for the rest of `link_access`,
including labelling members-only workspaces (a Basecamp project, a shared drive).
Replacing an asset with **Edit** → delete, then upload under the same name keeps the
URL working.

## Cohorts and events (modules: `cohorts`, `events`)

**Start a new cohort year:**
- Open the **Start a new cohort year** issue (label `content:new-year`) with the four-digit year, or run the `Scaffold new cohort year` workflow manually (`workflow_dispatch`, input `year`).
- `scripts/scaffold_year.rb` creates `cohorts/<year>/index.md` and `_data/cohorts/<year>.yml` with placeholder events/materials/policies — it never overwrites existing files — and opens a PR.
- After merging, replace the placeholder intro, events, and policies with the real program details.

**Add an event to a cohort:**
- Open the **Add event details** issue (label `content:new-event`). The workflow first comments back the events already scheduled for that year (so the submitter can reuse or avoid an ID), then scaffolds `cohorts/<year>/events/<event-id>/index.md` and opens a PR.
- Every event in `_data/cohorts/<year>.yml` already has a generated page at `cohorts/<year>/events/<event-id>/`; the scaffolded file overrides it and inherits any field it leaves blank, so you only need one when an event has an agenda, materials or attachments of its own.

**Update a cohort's schedule in bulk:**
- Open the **Update a cohort schedule** issue (label `content:schedule`) — replaces the event list for a cohort year without hand-editing YAML. The workflow previews normalized event IDs as a comment before writing changes, and only opens a PR if something actually changed.

**Add/replace materials on an existing event page:**
- Open the **Update event attachments** issue (label `content:event-attachments`). Leave the event ID blank (or type `help`) and the workflow comments back the list of valid IDs for that year.
- When nothing can be applied the run still finishes **green** and comments on the issue with the reason nothing changed — the attachments already match what was submitted, or that event has no page yet, in which case open an **Add event details** issue for it first and come back. A green run with a comment is the normal way this workflow says "not yet"; edit the issue with the fix and it tries again.

All four cohort/event workflows follow the same pattern as new-entry: issue → scripted scaffold/update → PR for a maintainer to review and merge. None of them touch `main` directly. The new-event and event-attachments PRs close their issue on merge; the new-year and schedule PRs do not (their issues are often reused for follow-up), so close those by hand once the PR is in.

**Resource library** (module `resources`) has no issue-based flow — edit `_data/resources.yml` directly in a PR.

## Troubleshooting

**Build failing (`Build & Deploy` workflow red on `main`)**
- Check the Actions log for the failing step. Common culprits: invalid YAML in `_data/*.yml` (run `npm run validate` locally first), a schema change that broke `npm run generate`, or `bundle exec jekyll doctor` flagging a broken permalink/URL.
- `npm run validate` mirrors the CI content gate locally (YAML parse of every `_data/*.yml`, plus the two Ruby checks) — run it before pushing schema or data changes.
- If **Coverage evidence** is red, download its artifact and inspect `summary.json` plus the
  matching TAP file. Run `npm run coverage` with the exact toolchain; add tests for the changed
  behavior or have a maintainer explicitly review a justified floor change. Never lower a floor
  merely to make the workflow green.

**Pull request not created after an issue was opened**
- Confirm the issue actually carries the expected label (`content:new-entry`, etc.) — GitHub only applies labels from an issue form if they already exist in the repo (see setup checklist above).
- Check Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests" is enabled — this is the most common cause of a silently-failed `create-pull-request` step.
- Check the workflow run itself: on a scaffolding failure, `new-entry.yml` comments the error onto the issue and fails the job rather than opening an empty PR.

**Checks on a generated pull request say "waiting for approval"**
- Expected on a fresh repository, and not a failure: pull requests opened with the built-in token cannot start other workflows. Either click **Approve and run**, or read the **(dispatch)** commit statuses the workflow posted on the head commit (see [Checks on a generated pull request](#checks-on-a-generated-pull-request)).
- If the workflow's run summary says a dispatch "could not be dispatched", the job lacked `actions: write` or the workflow file is not on the default branch yet — a dispatch can only target a workflow that already exists on `main`.
- To make PR checks run normally instead, add a `CONTENT_BOT_TOKEN` secret as described in that section.

**No "your entry is now live" comment after merging**
- The comment is posted by the `announce` job in `pages.yml` after a successful deploy, and it is deliberately non-fatal: it only fires for a push to `main` whose commit belongs to a merged pull request that closed an issue (`Closes #123` in the PR body — generated PRs always have it) and that added an entry page. A hand-merged squash that rewrote the body, or an edit rather than a new entry, will not produce one.
- Nothing about the site depends on it. Comment on the issue by hand and close it.

**Thumbnails missing on an entry**
- Confirm the PDF was actually added to `catalog/<slug>/` under the exact filename the schema expects (`deck.pdf` by default) and that the schema field has `thumbnail: true`.
- Check whether the PR came from a fork — the thumbnails workflow does not run on fork PRs (see above); trigger it manually or commit the thumbnail yourself.
- Confirm the PR actually changed a `catalog/**/*.pdf` path — the workflow only triggers on that path filter.
- A media build that failed quietly usually shows up a second time as a red **Validate Content** check on the same pull request: the responsive-image derivatives check looks for the files the same job writes. Fix the image (or the PDF), re-run the job, and both clear together.

**A scheduled workflow went red (`Catalog metrics`, `Verification sweep`)**
- Nothing on the published site is affected. Neither workflow touches a page: one opens a pull request with a data file, the other keeps one issue up to date, and a failed run simply means it did not do that this month.
- The usual cause is a temporary problem talking to the GitHub API. Open the Actions tab, pick the workflow in the left-hand list, and use **Re-run all jobs** on the failed run — or **Run workflow** to start a fresh one.
- If it is still red across several days and re-running does not clear it, that is a bug in the template rather than in your catalog: report it through [SUPPORT.md](../SUPPORT.md) with a link to the failed run.

**A module toggle doesn't seem to do anything**
- Confirm you're looking at a full rebuild, not a cached preview — `_plugins/modules.rb` removes disabled-module pages at `post_read` time, so the effect only shows up after a Jekyll build, not a live-reload of unrelated content.

**Front-matter validation failing on a PR**
- `check_front_matter.rb` checks: `title`/`slug`/`summary` present, `slug` matches the folder name, `published` (and `updated`/`verified` when present) is a valid `YYYY-MM-DD` date, every `required` field is present, `select`/`multiselect` values are within `options`, `url` fields start with `http(s)://`, `email` fields contain `@`, `images` items have a `src` that exists inside the entry folder, and `links` items have both a label and an `http(s)` or `mailto:` URL. The error message names the file, the line and the field.
- `render_with_liquid: false` is required on every entry, hand-written ones included: without it Jekyll runs the page body through Liquid at build time, so a Liquid `include` tag someone typed into their write-up would execute. The scaffolder emits it automatically.
- Warnings (a remote image `src`, a missing `alt`, a `file` field pointing at a path that is not in the repository yet) are printed but do not fail the check. Fix them anyway — the dangling-attachment one is expected on a freshly generated pull request and should be gone before you merge.

**Weekly smoke build failing**
- `smoke.yml` runs every Monday and does a full validate + build without deploying, to catch drift (e.g. a stale dependency, a broken external asset) between real deploys. Treat a red run the same as a failing `Build & Deploy`.

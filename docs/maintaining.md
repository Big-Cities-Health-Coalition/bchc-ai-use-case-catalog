# Maintainer operations and handoff

This is the routine and emergency runbook for people who did not build PHCT. Commands are the
developer/recovery path; the GitHub interface is the normal path for running a deployment. Never
paste a secret into an issue, pull request, document, Actions input, or terminal transcript.

## The two repositories

- `crypticpy/phct` — the template — owns reusable layouts, scripts, workflows, tests, presets,
  docs, and releases.
- The deployment repository owns the adopting organization's identity, policy, configuration,
  content, media, and its `.phct-version.json` lock. The reference deployment is
  `Big-Cities-Health-Coalition/use-case-catalog`; see [ecosystem.md](ecosystem.md) for the whole family.
- Generic defects discovered in a deployment are fixed and released in PHCT first. The deployment
  then consumes the immutable tag through **Actions → Update from PHCT**.

If a file's owner is uncertain, run `npm run ownership:check` and inspect `.phct/ownership.yml`
before editing. Do not resolve an update conflict by casually choosing “theirs” for `_data/`,
content, or images.

## Routine operating schedule

### Each content pull request

1. Confirm the submitter and links are appropriate for publication.
2. Check the generated review criteria, closer-review labels, plain language, alt text, licensing,
   and absence of PII/PHI, credentials, or non-public data.
3. Require **Validate Content** and **Quality** on the latest commit.
4. Preview changed pages; approve and merge only when another reviewer could understand the diff.
5. Confirm **Build & Deploy** succeeds and the published entry/search/feed work.

### Weekly

- Triage bug, accessibility, dependency, CodeQL, failed workflow, and security notifications.
- Review Dependabot in PHCT first. Never merge an update only because a bot opened it.
- Check the deployment's Actions page for scheduled failures and confirm the demo banner is still
  accurate.

### Monthly

- Complete the verification-sweep issue and confirm catalog metrics were updated.
- Test one submission through issue → pull request → checks → merge → deploy → notification using
  fictional/public data, then remove or clearly label the test entry.
- Check Pages, custom domain, repository variables, expiring tokens, security reporting, and both
  named maintainers against the deployment's own operations record — the settings table in
  [admin-guide.md](admin-guide.md#repository-settings-at-a-glance) is the list to walk, and
  `MAINTAINERS.md` names the people.

### Quarterly

- Run the 0/1/10/100/500/1,000 performance matrix, its supported-scale Chrome interaction gate,
  and the browser/accessibility sample.
- Download a backup, run a rollback rehearsal, and test the protected-content checksum workflow.
- Review access, branch rules, Actions permissions, secrets/variables, DNS ownership, and the
  primary/backup succession plan. Remove access no longer needed.

## PHCT release procedure

1. Create a release branch and update `package.json`, lock metadata, `CHANGELOG.md`, migration
   notes, and the release-readiness evidence.
2. Run `npm run verify`; then pa11y, assistive-technology flows, both Lighthouse lanes, the full
   performance matrix, CodeQL, supply-chain checks, workflow lint, and link checks.
3. Build the PHCT landing page and every preset from the candidate commit. Retain the artifacts.
4. Tag the commit `vNEXT-rc.1` and publish candidate notes with the full SHA and rollback point.
5. Confirm the downstream `PHCT_UPDATE_TOKEN` is present and unexpired when the release changes
   `.github/workflows`. In BCHC, run **Update from PHCT** with that exact candidate tag. Review its
   checksum evidence, preview, migrations, and full downstream checks. Perform the real
   issue-to-deploy rehearsal.
6. Fix compatibility failures in PHCT and issue `rc.2`; do not patch generic code in BCHC.
7. Only after BCHC is green, put stable `vNEXT` on the same audited PHCT commit and attach the
   CycloneDX SBOM. Run the updater once more for the stable lock, approve, and deploy BCHC.
8. Record stable tag/SHA, SBOM, BCHC lock/deploy SHA, checks, approvers, and rollback point in the
   release notes. Observe at least one business day before closing the release record.

Bots may open release/update pull requests but may never approve or merge them.

## Rollback

### Before an update pull request merges

Close the pull request and delete its machine branch. The published site has not changed.

### After an update pull request merges in the deployment

1. Open the update pull request and identify its merge commit and the previous
   `.phct-version.json` release/SHA.
2. Use GitHub's **Revert** button, or create a branch and run `git revert -m 1 <merge-commit>`.
3. Require normal checks and human approval on the revert pull request.
4. Merge, confirm Pages redeploys, and verify home, catalog, search, submission, governance, and
   the affected feature.
5. Open a PHCT incident/defect with the exact candidate SHA. Do not re-run the failed update until
   PHCT publishes a corrected candidate.

Never delete history or force-push `main` as rollback. For published sensitive data, follow
`docs/incidents.md`; a normal revert does not remove the material from Git history or caches.

## Backup and restore

- A Git clone with all branches/tags is the source backup; Pages output alone cannot restore issue
  history, settings, secrets, branch rules, Discussions, or DNS.
- Export/record repository settings and issue/PR metadata using organization-approved tools. Store
  backups in an access-controlled location the adopting organization owns, not in this public
  repository.
- Quarterly, create a private throwaway repository, restore the code and required settings from the
  inventory, build Pages, and verify a fictional submission and rollback. Delete it through the
  organization's normal recoverable process after evidence is retained.

## Ownership transfer checklist

Work through this with both named people present and in front of the same screen. Nothing here can
be done for them afterwards.

1. **Name the people first.** Put the product owner and the backup release maintainer in
   `MAINTAINERS.md` and in `.github/CODEOWNERS`, as real GitHub accounts. Do this before anything
   below: the rest of the list hands access to whoever those two lines name.
2. **Confirm admin access and account security.** Settings → Collaborators and teams. Both people
   hold admin, both have MFA on, and both have their recovery codes stored where their
   organization keeps such things — not in this repository.
3. **Confirm the repository shape.** Settings → General: visibility (public, unless the
   organization has decided otherwise) and the default branch.
4. **Confirm the protection rules.** Settings → Rules → Rulesets (or Settings → Branches): the
   branch rules on `main`, and the tag rules that keep release tags immutable.
5. **Confirm Actions permissions.** Settings → Actions → General → Workflow permissions, including
   **Allow GitHub Actions to create and approve pull requests**. The consequences of each are in
   [admin-guide.md](admin-guide.md#repository-settings-at-a-glance).
6. **Confirm publishing.** Settings → Pages: the source is **GitHub Actions**, the custom domain is
   correct, and someone in the new organization controls the DNS record behind it. Settings →
   Environments: the `github-pages` environment and its protection rules.
7. **Confirm the repository's own switches.** Settings → Secrets and variables → Actions:
   every **Variable** and every **Secret**, checked against the table in
   [admin-guide.md](admin-guide.md#repository-settings-at-a-glance). Issues → Labels: the
   `content:*`, `review:*` and `verification` labels the automation filters on. Settings → General
   → Features: Discussions, if you use them.
8. **Confirm the security features.** Settings → Security → Code security and analysis: private
   vulnerability reporting, secret scanning, Dependabot alerts and updates, and CodeQL.
9. **Replace every credential.** Personal or bot tokens become organization-owned, least-privilege
   and expiring — `CONTENT_BOT_TOKEN` and `PHCT_UPDATE_TOKEN` included. Reissue them under the new
   owner's account, update the secrets, and let the old ones lapse.
10. **Update the identity in the content.** Repository URLs and contact addresses go through the
    setup workflow rather than a hand-edit, then regenerate the derived files (`npm run generate`,
    or the **Apply setup** issue) so the issue forms and links follow.
11. **Confirm the upstream link still works.** PHCT remains the source of template changes: run one
    candidate update through **Actions → Update from PHCT** with the new maintainers driving and
    the original developer silent.
12. **Run the drills.** Takedown, rollback, credential rotation, and backup-restore, from these
    documents. Record outcomes and dates in the deployment's operations record — never secret
    values.

Transfer is incomplete until the new backup maintainer can perform all four drills in step 12 from
these documents without live coaching.

## When to escalate

- Stop publication for suspected credentials, PII/PHI, arbitrary execution, permission bypass,
  destructive loss, or a broken default-branch protection rule.
- Stop the wider demo for a failed submission/deploy/update path, inaccessible critical task,
  unsupported browser failure, checksum mismatch, or release performance gate.
- Use private vulnerability reporting for security defects and the incident runbook for urgent
  content. Ordinary support expectations are in `SUPPORT.md`.

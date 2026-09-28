# Public Health Digital Use Case Catalog maintainers

This catalog is a BCHC-owned deployment of the PHCT open-source template. BCHC
owns the catalog's content, policy, branding, publication decisions, and operational access; shared
software fixes are developed and released in PHCT before this repository consumes them. Neither
project promises paid support, 24-hour response, or uninterrupted service.

## Current roles

| Role | Account | Responsibilities |
|---|---|---|
| Interim technical maintainer | `@crypticpy` (contracted by BCHC) | Shared code review, security triage, PHCT releases, CI, and protected BCHC updates, until BCHC names its own technical maintainer. |
| BCHC product owner | **To be named by BCHC — handoff blocker** | Content policy, demo/publication decisions, taxonomy, governance language, and final go/no-go. |
| Backup release maintainer | **Unassigned — release blocker** | Must be able to run a release, update BCHC, roll back, rotate credentials, and handle a takedown without the technical maintainer. |

The BCHC deployment is not ready for operational handoff while the backup role is unassigned. Add the
real GitHub account to `.github/CODEOWNERS`, branch rules, Pages/admin access, and this table only
after that person accepts the role and completes the drills in `docs/maintaining.md`.

## Ownership and the interim arrangement

The repository is moving from `@crypticpy`'s personal account to BCHC's GitHub organization; the
steps are in `docs/bchc/transfer-runbook.md`. After the move BCHC owns the repository, and
`@crypticpy` holds repository Admin as a contracted interim maintainer, because secrets, Pages,
rulesets, environments, and Actions settings all need Admin. That access is BCHC's to grant, review,
and remove. When BCHC names its own technical maintainer, that person takes the role above and
`@crypticpy` steps down under the rules below, or stays on in whatever capacity BCHC agrees.

No specific automated review tool is required. Review bots installed on an individual's account do
not move with the repository; if BCHC turns one on (for example Copilot code review), it assists the
human reviewer and never replaces the approval rules below.

## Decision and access rules

- Two approvals are required for shared workflow, security, dependency, ownership, or release
  changes once the backup is assigned.
- The BCHC product owner approves public content and policy; technical maintainers do not silently
  rewrite adopted governance.
- No shared code change begins in this repository. Reproduce and fix it in PHCT, release it, then consume the
  immutable release downstream.
- Maintainer access is individual, least-privilege, protected by MFA, and reviewed quarterly. Do
  not share accounts, personal access tokens, recovery codes, or signing keys.
- A maintainer stepping down transfers open incidents and releases, removes their credentials,
  and identifies whether another accepted maintainer covers each role.

See `SUPPORT.md` for response expectations, `SECURITY.md` for private reports, and
`docs/maintaining.md` for the operating and succession runbook.

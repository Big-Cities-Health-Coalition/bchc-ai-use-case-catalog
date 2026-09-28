---
layout: entry
render_with_liquid: false
title: ELR onboarding pipeline for new reporting labs
slug: elr-onboarding-pipeline-for-new-reporting-labs
published: "2026-09-28"
updated: 2026-09-28
featured: false
thumbnail: ""
organization: Harbor City Department of Public Health
solution_type:
  - Data pipeline or integration
  - Workflow automation
sharing: Open-source code
use_case_category: ""
area:
  - Communicable disease
  - Data modernization and informatics
stage: In production
summary: A Python pipeline that validates, maps and loads HL7 electronic lab reports from newly onboarded labs into the surveillance system, flagging bad segments for the lab instead of for epidemiologists.
impact: Lab onboarding time fell from about ten weeks to three
review_status: Under review
ai_role: No AI
ai_types: []
ai_tools:
  - Python
  - pandas
  - HL7apy
  - SQL Server
  - Azure Data Factory
  - GitHub Actions
platform:
  - Microsoft Azure
vendor: ""
expertise: Developer
readiness:
  - Needs customization
  - Needs a data agreement
repo_url: "https://github.com/example-org/elr-onboarding-pipeline"
demo_url: ""
docs_url: "https://github.com/example-org/elr-onboarding-pipeline#readme"
resources: []
screenshots: []
deck_pdf: ""
also_deployed_by: []
license: MIT
access_terms: MIT licensed. The mapping tables are specific to our surveillance system and will need to be redone for yours.
portability: "Partially — with rework"
portability_notes: "Runs anywhere Python runs; the loader targets our SQL Server schema."
reused_from: []
cost_band: "Under $25k"
run_cost: "Under $10k/yr"
procurement:
  - Existing enterprise licence
approvals:
  - Privacy review
  - Security review or authority to operate
equity_note: ""
no_pii_attestation: true
data_sensitivity:
  - Health information (PHI)
data_sources:
  - HL7 v2.5.1 ORU messages from commercial and hospital labs
audience: Internal staff
data_governance_notes: ""
security_review: ""
contact_name: Nadia Brooks
contact_title: Informatics Lead
contact_email: "nadia.brooks@example.org"
submitter_github: ""
---

## The problem

Every new lab took weeks of back-and-forth before its messages loaded cleanly, and epidemiologists spent time fixing malformed segments by hand.

## What we built

A validation and mapping pipeline that runs on each test batch, returns a plain-language error report to the lab, and loads clean messages into staging.

## Time and resources

One developer for four months, plus an epidemiologist to review the mapping tables.

## Lessons learned

Send the lab the error report directly. Most problems were fixed on their side within a day once they could see them.

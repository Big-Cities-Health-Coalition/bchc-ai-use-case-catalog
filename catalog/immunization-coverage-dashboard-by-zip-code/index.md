---
layout: entry
render_with_liquid: false
title: Immunization coverage dashboard by ZIP code
slug: immunization-coverage-dashboard-by-zip-code
published: "2026-09-28"
featured: false
thumbnail: ""
organization: Lakeshore City Department of Public Health
solution_type:
  - Dashboard or visualization
  - Analysis project or script
sharing: Code on request
use_case_category: ""
area:
  - Communicable disease
  - Maternal, child and family health
stage: Pilot
summary: A Power BI dashboard, refreshed weekly from the state immunization registry extract, that shows childhood vaccine coverage by ZIP code so outreach teams can plan clinics where coverage is falling.
impact: Outreach teams now plan clinics from weekly data instead of an annual report
review_status: Under review
ai_role: No AI
ai_types: []
ai_tools:
  - R
  - tidyverse
  - Power BI
  - SQL
platform:
  - Microsoft Azure
  - Desktop or local
vendor: ""
expertise: Analyst or data scientist
readiness:
  - Guided setup
  - Needs a data agreement
repo_url: ""
demo_url: ""
docs_url: ""
resources: []
screenshots: []
deck_pdf: ""
also_deployed_by: []
license: "Not open source — available on request"
access_terms: We will share the R scripts and the Power BI template with any health department that asks.
portability: "Yes — platform-agnostic"
portability_notes: ""
reused_from: []
cost_band: No new spend
run_cost: No ongoing cost
procurement:
  - Existing enterprise licence
approvals:
  - Privacy review
equity_note: ""
no_pii_attestation: true
data_sensitivity:
  - De-identified data
data_sources:
  - Weekly extract from the state immunization registry
audience: Internal staff
data_governance_notes: ""
security_review: ""
contact_name: Luis Ortega
contact_title: Immunization Epidemiologist
contact_email: "luis.ortega@example.org"
submitter_github: ""
---

## The problem

Coverage estimates arrived once a year, too late to steer outreach.

## What we built

An R script that aggregates the weekly registry extract to ZIP code and suppresses small cells, and a Power BI report on top of it.

## Time and resources

About six weeks of analyst time.

## Lessons learned

Agree on small-cell suppression rules with the privacy officer before building the visuals.

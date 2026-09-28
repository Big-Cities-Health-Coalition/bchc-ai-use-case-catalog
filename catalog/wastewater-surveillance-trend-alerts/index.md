---
layout: entry
render_with_liquid: false
title: Wastewater surveillance trend alerts
slug: wastewater-surveillance-trend-alerts
published: "2026-08-26"
featured: false
thumbnail: ""
organization: Harborview Metro Health District
solution_type:
  - "AI/ML model"
  - "Data pipeline or integration"
use_case_category: Operations & logistics
area:
  - "Epidemiology and surveillance"
  - "Communicable disease"
stage: In production
summary: Watches the weekly wastewater sampling results for the metro's five treatment plants, flags statistically unusual rises for COVID, flu and RSV, and posts a short plain-language alert to the epi team's channel before the Monday briefing.
impact: Epi team saw the winter flu rise nine days before case reports confirmed it
review_status: Reviewed & approved
ai_role: AI is part of the solution
ai_types:
  - Prediction & forecasting
  - Classification & NLP
ai_tools:
  - Python
  - Prophet
  - Claude (API)
platform:
  - Microsoft Azure
vendor: ""
expertise: Analyst or data scientist
readiness:
  - Guided setup
  - Needs customization
  - Human review built in
repo_url: ""
demo_url: ""
docs_url: ""
resources: []
screenshots: []
deck_pdf: "/catalog/wastewater-surveillance-trend-alerts/deck.pdf"
sharing: "Code on request"
license: "Not open source — available on request"
access_terms: "The ingest, trend model and alert code are shared with other health departments on request; email the contact below."
portability: "Partially — with rework"
portability_notes: "The trend model and alert text generation are platform-agnostic Python; the ingest step assumes our LIMS export format and would need a new adapter for a different lab system."
reused_from: []
cost_band: No new spend
run_cost: "Under $10k/yr"
procurement:
  - Existing enterprise licence
approvals:
  - Privacy review
  - AI governance body
equity_note: "Alerts are internal decision support for epidemiologists. Sampling covers the whole metro sewershed, so no neighborhood is singled out; the alert text never names a facility smaller than a treatment plant service area."
no_pii_attestation: true
data_sensitivity:
  - Public data only
  - De-identified data
data_sources:
  - Weekly wastewater sample results from the five metro treatment plants
  - State respiratory dashboard (public) for corroboration
audience: Internal staff
data_governance_notes: "Plant-level aggregate counts only — no case-level or personal data anywhere in the pipeline. Alerts are internal decision support for the epi team; the public state dashboard is used to corroborate trends, not fed by this tool."
contact_name: Priya Raman
contact_title: Surveillance Data Manager
contact_email: "priya.raman@example.org"
---

We started posting wastewater trends by hand in 2024 and kept missing rises that were obvious in hindsight. The alerting version fits a seasonal baseline per plant and per target, flags a sustained two-sample rise above the baseline's expected band, and drafts a three-sentence note an epidemiologist approves before it posts. The human approval step matters: about one flag in five is a sampling artifact, and the reviewer catches those in under a minute.

Setup for another jurisdiction means pointing the ingest at your lab export, setting plant service-area names, and two seasons of history for the baseline. The alert prompt comes with the code and is deliberately boring — it summarizes numbers the model computed, it never speculates about causes.

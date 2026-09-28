---
layout: entry
render_with_liquid: false
title: "Plain-language restaurant inspection summaries"
slug: restaurant-inspection-summaries
summary: "Nightly job that rewrites inspector code citations into two-sentence summaries a resident can understand, for the public inspection lookup site."
published: 2026-02-20
featured: false
sample: true
impact: "92% of drafted summaries passed the weekly style review without edits"
organization: "Cedar Valley County Health Department"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
  - "Data pipeline or integration"
use_case_category: "Communications, media & writing"
area:
  - "Environmental health"
  - "Communications and community engagement"
stage: "Idea / exploring"
ai_role: "AI is part of the solution"
ai_types:
  - "Generative text (LLM)"
ai_tools:
  - "Google Vertex AI"
  - "Gemini"
  - "BigQuery"
  - "Cloud Run"
platform:
  - "Google Cloud"
expertise: "Developer"
readiness:
  - "Needs customization"
  - "Human review built in"
repo_url: "https://github.com/example-org/inspection-summaries"
resources:
  - label: "Style rules and rejected-example set"
    url: "https://docs.example.org/document/d/3f5t8w2v/edit"
screenshots:
  - src: /catalog/restaurant-inspection-summaries/screenshots/01.png
    alt: "Review table pairing inspector code citations with drafted resident summaries, style rule checks and an approve or reject decision."
sharing: "Open-source code"
license: "MIT"
portability: "Partially — with rework"
portability_notes: "The summarisation code is plain Python; the prototype calls Vertex AI and would need a different model client elsewhere."
cost_band: "No new spend"
run_cost: "No ongoing cost"
procurement:
  - "No procurement needed"
approvals:
  - "Not yet reviewed"
equity_note: "Still an idea, so nothing has been checked. If it ships, the obvious hazard is a summary that reads harsher for a small independent restaurant than for a chain with tidier paperwork describing the same violation, and the summary would be published next to the establishment's name. That comparison is the first thing we would test."
no_pii_attestation: true
data_sensitivity:
  - "Public data only"
data_sources:
  - "Food inspection results"
  - "Inspection code reference table"
audience: "Public-facing"
data_governance_notes: "Inspection results are public records; the summaries name establishments, not people, and inspector names are stripped before generation."
contact_name: "Tomás Herrera"
contact_title: "Open Data Program Lead"
contact_email: "tomas.herrera@example.org"
---

## Problem

Inspection results are already public, but they are written for inspectors. A resident looking up a restaurant sees "Red 5 — Improper hot holding, 118°F at steam table" and has no way to tell whether that means the food was dangerous, whether it was fixed, or whether it matters at all. We wanted a two-sentence summary a resident can read, without implying an overall verdict on the business.

## What we built

A nightly scheduled query in BigQuery selects inspections recorded that day. A Cloud Run job sends each citation, along with the official code description, to a model with a tightly scoped prompt and a short set of style rules: no adjectives, name what was found, say whether it was corrected, and state any required follow-up. Nothing else.

Drafts are written to a review table rather than the public site. The food program lead reviews a weekly sample and approves or rejects each one.

## How it works

The prompt is deliberately boring. It gets the citation text, the code description and the correction status, and it is told which sentence patterns are allowed. Anything that adds a judgement — "minor", "easily fixed", "serious" — is rejected in review, and the rejected examples are kept as a test set we run the prompt against whenever we change it.

All inputs are already-published data, which is why this project has been able to move without a governance review.

## Results

This is still an exploration and nothing has been published to the public site. Over eight weeks of weekly samples, 92% of drafts passed review unedited. The failures cluster in one place: the model wants to reassure the reader, and reassurance is exactly what we are not willing to publish.

## Lessons learned

The technical problem was solved in about a week. The open question is presentation, and it is a policy question rather than a modelling one. If a summary sits next to a restaurant name, residents will read it as a rating no matter how carefully it is worded, so we are testing layouts where the summary is one click in from the result list.

## How to reuse

The repository has the query, the job and the style rules. It expects an inspections table with a citation code, a description and a correction flag; if your data has that shape, swapping the loader is a short job. We would rather hear from jurisdictions that already publish inspection data than from anyone who wants the prompt — feedback on how residents read these is what we need most.

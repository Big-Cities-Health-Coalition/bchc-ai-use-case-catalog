---
layout: entry
render_with_liquid: false
title: "Syndromic surveillance signal triage assistant"
slug: epi-signal-triage
summary: "Reads the daily syndromic alert export, drafts a plain-language note for each signal, and ranks the ones an epidemiologist should open first."
published: 2026-06-18
updated: 2026-07-30
verified: 2026-08-04
featured: true
sample: true
impact: "Cut daily alert review from 90 to 30 minutes for two analysts"
organization: "Lakeshore City Department of Public Health"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
  - "AI/ML model"
use_case_category: "Coding & brainstorming"
area:
  - "Epidemiology and surveillance"
  - "Data modernization and informatics"
stage: "Pilot"
ai_role: "AI is part of the solution"
ai_types:
  - "Generative text (LLM)"
  - "Classification & NLP"
  - "Prediction & forecasting"
ai_tools:
  - "Claude (API)"
  - "Python"
  - "LangChain"
platform:
  - "Microsoft Azure"
  - "On-premises"
expertise: "Analyst or data scientist"
readiness:
  - "Needs customization"
  - "Human review built in"
repo_url: "https://github.com/example-org/signal-triage"
docs_url: "https://github.com/example-org/signal-triage/wiki"
resources:
  - label: "Evaluation notebook (PDF)"
    url: "https://docs.example.gov/lakeshore/signal-triage-evaluation.pdf"
  - label: "Syndrome definition mapping table"
    url: "https://docs.example.org/spreadsheets/d/1a2b3c4d/edit"
screenshots:
  - src: /catalog/epi-signal-triage/screenshots/01.png
    alt: "Triage queue listing seven ranked syndromic signals with area, what changed, signal strength and status."
  - src: /catalog/epi-signal-triage/screenshots/02.png
    alt: "Draft triage note for a gastrointestinal signal beside a bar chart of daily visit counts, marked as awaiting analyst review."
sharing: "Open-source code"
license: "MIT"
portability: "Partially — with rework"
portability_notes: "The triage code and prompts are portable Python. The alert export reader is written against our ESSENCE extract format and the deployment scripts assume Azure Functions."
reused_from:
  - "overdose-spike-brief"
cost_band: "No new spend"
run_cost: "Under $10k/yr"
procurement:
  - "No procurement needed"
  - "In-kind or academic partnership"
approvals:
  - "Privacy review"
  - "Security review or authority to operate"
  - "Research ethics / IRB"
  - "AI governance body"
equity_note: "The model ranks signals, so a systematic miss in one part of the city becomes a slower public health response there. We compare precision and recall by reporting facility and by ZIP-code tercile every month, and the two safety-net hospitals are held to the same recall floor as the academic centers. Nothing is auto-dismissed: an epidemiologist sees every signal regardless of rank."
no_pii_attestation: true
data_sensitivity:
  - "De-identified data"
  - "Internal, non-public data"
data_sources:
  - "Syndromic surveillance alert export"
  - "Facility visit counts"
  - "Syndrome definitions"
audience: "Internal staff"
data_governance_notes: "The alert export is de-identified at source; the repository ships synthetic sample data only. Reusing teams should confirm their own syndromic vendor's export format and data-use terms."
contact_name: "Priya Natarajan"
contact_title: "Senior Epidemiologist"
contact_email: "priya.natarajan@example.org"
---

## Problem

Every morning the surveillance team receives between 40 and 80 automated alerts from the syndromic system. Most are noise — a holiday effect, a facility that changed its coding, a weekend injury bump. A handful matter. Reading all of them by hand took two analysts about 90 minutes a day, and the reading happened before anyone had context on what had already been ruled out.

## What we built

A scheduled Python job pulls the alert export each night. For every signal it assembles 14 days of visit history, the expected count from a simple seasonal baseline model, and the relevant syndrome definition. It then asks a language model to do three things: say in one sentence what changed, rate how strongly the data supports a real increase, and suggest the single most useful follow-up query.

The results land in a ranked queue that the on-duty analyst works through. Nothing is closed automatically. The analyst opens each signal, reads the draft note, edits it, and records the decision — which is also how we collect training examples for the next round of prompt work.

## How it works

The enrichment step is ordinary Python and SQL against our own warehouse. The model never sees record-level data; it receives a small table of counts, a baseline, and text from our syndrome definitions. Prompts and the evaluation notebook live in the repository so another team can see exactly what we asked for.

Signal strength is deliberately presented as a sorting hint, not a score. It changes the order of the queue and nothing else.

## Results

Review time dropped from roughly 90 minutes to 30 across two analysts. Two clusters were opened a day earlier than they would have been under the old manual sweep. Agreement between the drafted strength rating and the analyst's own judgement was 84% over the first eight weeks, which we consider good enough for sorting and nowhere near good enough for automation.

## Lessons learned

The prompt is about 60 lines. The hard part was the enrichment — getting a clean baseline and a stable facility list took far longer than anything involving the model. Writing the evaluation before the pilot, rather than after, is what let us defend keeping it.

## How to reuse

Start from the data you already export nightly. Replace the three loader functions with your own sources, then run the evaluation notebook against a month of historical alerts before letting anyone rely on the ranking. We are happy to share the syndrome mapping tables on request.

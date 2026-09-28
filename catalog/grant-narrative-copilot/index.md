---
layout: entry
render_with_liquid: false
title: "Grant narrative copilot"
slug: grant-narrative-copilot
summary: "A vendor-hosted assistant grounded in our own program library, used by staff to draft first-pass narratives for federal funding applications."
published: 2026-04-14
featured: false
sample: true
impact: "Halved first-draft time on routine narrative sections, from about eight hours to four"
organization: "Metro North Health District"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
use_case_category: "Communications, media & writing"
area:
  - "Agency operations and administration"
stage: "In production"
ai_role: "AI is part of the solution"
ai_types:
  - "Document Q&A (RAG)"
  - "Generative text (LLM)"
ai_tools:
  - "Microsoft 365 Copilot"
  - "SharePoint"
platform:
  - "Enterprise AI workspace"
  - "Vendor / SaaS hosted"
vendor: "Microsoft"
expertise: "Power user"
readiness:
  - "Needs a paid license"
  - "Needs customization"
  - "Human review built in"
docs_url: "https://docs.example.gov/metronorth/grant-copilot-playbook"
resources:
  - label: "Fact-check checklist (shared doc)"
    url: "https://docs.example.org/document/d/1k9m2p7q/edit"
  - label: "Rollout and training deck (PDF)"
    url: "https://docs.example.gov/metronorth/grant-copilot-rollout.pdf"
  - label: "Vendor product page"
    url: "https://www.example.com/products/workplace-copilot"
sharing: "Templates or documentation only"
license: "Not open source — available on request"
access_terms: "Built on Microsoft Copilot inside our tenant; the prompt library and the reviewer checklist are available to peer health departments on request."
portability: "Partially — with rework"
portability_notes: "The prompts and the program description library are text; the retrieval over past applications relies on SharePoint indexing and would need re-wiring on another platform."
cost_band: "Under $25k"
run_cost: "Under $10k/yr"
procurement:
  - "Sole source"
approvals:
  - "Not yet reviewed"
equity_note: "Nothing resident-facing: it drafts our own narrative sections and a grant writer rewrites them. The honest risk is internal — a copilot trained on our past successful applications will keep proposing the programs we have always funded. We have not checked for that and would not know how yet."
no_pii_attestation: true
data_sensitivity:
  - "Internal, non-public data"
data_sources:
  - "Program description library"
  - "Prior grant applications (redacted)"
  - "Population data tables"
audience: "Internal staff"
data_governance_notes: "Past applications and program descriptions are internal documents; nothing containing client or patient detail is loaded into the library."
contact_name: "Dana Whitfield"
contact_title: "Grants Manager"
contact_email: "dana.whitfield@example.org"
---

## Problem

We apply for between 15 and 25 federal and state funding opportunities a year. Roughly 60% of every narrative is material we have written before: organizational history, population profile, governance structure, evaluation approach. Staff were rewriting it each time, usually under deadline, and the versions drifted apart until nobody could say which description of our own health district was current.

## What we built

There is no code here. This is a configuration and process story, which we think is most of what other organizations actually need.

We assembled a SharePoint library of about 120 approved items: program descriptions, evaluation summaries, boilerplate paragraphs, and the population data tables we are allowed to cite. Each item has an owner and a review date. We then pointed the vendor's assistant at that library and only that library. Staff paste the section headings from a funding notice and get a first draft written in our own language.

## How it works

The assistant is licensed per seat and runs on the vendor's infrastructure. Nothing outside the approved library is in scope, and no application draft is stored anywhere other than the working folder for that application. Every draft goes through a fact-check step before it is submitted — that checklist is linked above and it is the single most important part of this entry.

## Results

First-draft time on routine sections fell from roughly eight hours to four. More usefully, the boilerplate stopped drifting: because the library is the only source, updating a program description once updates it everywhere the next time someone drafts.

## Lessons learned

The assistant is confident about numbers it has never seen. Early drafts contained plausible-looking population figures that appeared nowhere in the library. Every statistic is now verified against the source document before submission, and we added a rule that the assistant may not produce a number the drafter has not already supplied.

Novel program designs still start from a blank page. The tool helps most with the 60% that is standard and barely at all with the part that wins the award.

## How to reuse

Build the library before you buy the license. A well-curated set of 100 approved documents with named owners is what makes this work; the assistant is the cheap part. Budget time for a review cycle on every item you put in, because whatever is in the library becomes what your organization says about itself.

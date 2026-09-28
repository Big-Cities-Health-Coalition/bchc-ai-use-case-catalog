---
layout: entry
render_with_liquid: false
title: "Contract clause summaries for procurement review"
slug: contract-clause-review
summary: "Vendor tool that extracts clauses from scanned agreements, summarizes them in plain language, and flags gaps against our standard terms."
published: 2026-06-02
verified: 2026-07-02
featured: false
sample: true
impact: "Cut first-pass contract review from five business days to one"
organization: "Summit Ridge County Health Department"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
use_case_category: "Administrative & task automation"
area:
  - "Agency operations and administration"
stage: "Pilot"
ai_role: "AI is part of the solution"
ai_types:
  - "Document Q&A (RAG)"
  - "Classification & NLP"
  - "Computer vision"
ai_tools:
  - "Larkspur Clause Review"
  - "Optical character recognition (vendor-hosted)"
platform:
  - "Vendor / SaaS hosted"
vendor: "Larkspur Contract Intelligence"
expertise: "Contractor or vendor"
readiness:
  - "Needs a paid license"
  - "Needs a data agreement"
  - "Human review built in"
docs_url: "https://docs.example.gov/summitridge/contract-review-pilot"
resources:
  - label: "Pilot evaluation memo (PDF)"
    url: "https://docs.example.gov/summitridge/contract-review-evaluation.pdf"
  - label: "Clause comparison template (shared doc)"
    url: "https://docs.example.org/document/d/4q8w1z6y/edit"
  - label: "Vendor product page"
    url: "https://www.example.com/larkspur/clause-review"
screenshots:
  - src: /catalog/contract-clause-review/screenshots/01.png
    alt: "Clause summary table listing indemnification, data ownership and other clauses with plain-language summaries and comparison flags."
sharing: "Description only"
license: "Not open source — description only"
access_terms: "A commercial product; the write-up describes the pilot, the vendor evaluation and the contract terms we negotiated. Contact us for the evaluation rubric."
portability: "No — tied to its platform"
portability_notes: "The product is the vendor's hosted service; what transfers is the evaluation approach and the clause taxonomy, not software."
cost_band: "$25k–$100k"
run_cost: "Over $50k/yr"
procurement:
  - "Cooperative or piggyback contract"
approvals:
  - "Legal or contracts review"
  - "Security review or authority to operate"
  - "Records retention review"
equity_note: "Internal to procurement, with no resident-facing output. The one thing we watch is whether the summaries flag unfamiliar contract language more often for small and minority-owned vendors, whose paperwork looks least like the big vendors the tool has seen most of. A flagged clause is only ever a prompt to read it, never a scoring input."
no_pii_attestation: true
data_sensitivity:
  - "Internal, non-public data"
data_sources:
  - "Executed vendor agreements"
  - "Standard terms and conditions library"
audience: "Internal staff"
data_governance_notes: "Executed agreements are uploaded to the vendor's tenant under a business associate agreement and a data processing addendum; no agreement text appears in this entry."
contact_name: "Grace Idowu"
contact_title: "Procurement Analyst"
contact_email: "grace.idowu@example.org"
---

## Problem

Our procurement team of three reviews around 200 vendor agreements a year. Many arrive as scanned PDFs from vendors who redlined a printout. The first pass — reading the whole document, finding the clauses that differ from our standard terms, and noticing the clauses that are missing entirely — took a specialist most of a week per contract, and missing clauses were the ones most often missed.

## What we built

We licensed a commercial contract review product rather than building anything. The vendor's tool reads the scanned agreement, extracts clauses, writes a plain-language summary of each, and compares them against a library of our own standard terms that we uploaded during setup.

The output is a review worksheet: one row per clause, with the page it came from, a summary, and a flag saying whether it matches our template, differs, or is absent.

## How it works

Scanned pages go through optical character recognition first, which is why quality varies with the scan. The comparison is against our own clause library — the tool is only as useful as the standard terms you give it, and getting ours into a consistent shape took longer than the vendor implementation.

Nothing is decided by the tool. A contracts specialist opens every flagged clause in the source document before it goes anywhere. The tool changes what gets read first, not what gets approved.

## Results

Across 38 contracts in the pilot, first-pass review dropped from a median of five business days to one. The tool found two missing clauses per contract on average — usually records retention or right to audit — which is the result that actually persuaded our leadership, since those were the gaps that previously surfaced after signature.

Accuracy on badly scanned documents was noticeably worse. Roughly one in six contracts needed a page rescanned before the extraction was usable.

## Lessons learned

Budget for the standard terms library. Ours existed as a Word document with twelve years of comments in it, and normalizing it was three weeks of work that we would have had to do eventually anyway.

Ask the vendor where documents are processed and what is retained, in writing, before the pilot. Our agreement covers processing location, retention period and a prohibition on training against our documents.

## How to reuse

This is a paid product on the vendor's infrastructure, so the path is procurement rather than deployment. The evaluation memo linked above is the document we used to make the case — it lists the questions we asked the vendor and the answers, which is probably more reusable than anything else here.

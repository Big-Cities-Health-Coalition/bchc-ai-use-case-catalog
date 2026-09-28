---
layout: entry
render_with_liquid: false
title: "Plain-language rewrites for public notices"
slug: plain-language-notices
summary: "A prompt kit and review checklist staff use to rewrite public notices at a sixth-grade reading level without changing what the notice requires."
published: 2026-07-08
verified: 2026-08-10
featured: true
sample: true
impact: "Median reading level of published notices dropped from grade 14 to grade 7"
organization: "Prairie Ridge County Health Department"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
  - "Standards, governance or playbook"
use_case_category: "Communications, media & writing"
area:
  - "Communications and community engagement"
  - "Emergency preparedness and response"
stage: "In production"
ai_role: "AI is part of the solution"
ai_types:
  - "Generative text (LLM)"
  - "Translation"
ai_tools:
  - "ChatGPT Enterprise"
  - "Claude"
platform:
  - "Enterprise AI workspace"
  - "Desktop or local"
expertise: "Anyone on staff"
readiness:
  - "Ready to deploy"
  - "Human review built in"
docs_url: "https://docs.example.gov/prairieridge/plain-language-kit"
resources:
  - label: "Prompt kit (shared doc)"
    url: "https://docs.example.org/document/d/2b6v8m4c/edit"
  - label: "Reading-level check spreadsheet"
    url: "https://docs.example.org/spreadsheets/d/5n1p3g7d/edit"
  - label: "Before-and-after examples (PDF)"
    url: "https://docs.example.gov/prairieridge/plain-language-examples.pdf"
screenshots:
  - src: /catalog/plain-language-notices/screenshots/01.png
    alt: "Side-by-side view of an original boil water notice and its plain-language rewrite, with a pre-publication review checklist."
sharing: "Templates or documentation only"
license: "Creative Commons (CC BY / CC0)"
portability: "Yes — platform-agnostic"
portability_notes: "A prompt kit and a style guide; they work in any generative text tool."
reused_from:
  - "restaurant-inspection-summaries"
cost_band: "No new spend"
run_cost: "Under $10k/yr"
procurement:
  - "Existing enterprise licence"
approvals:
  - "Legal or contracts review"
  - "Community or advisory review"
  - "Equity impact assessment"
equity_note: "The whole point is the residents the old notices lost: we measure reading level before and after, and the community review panel reads the rewrite before it ships. Translation is where it can quietly go wrong — a rewrite that gets simpler in English can get less precise in Spanish and Vietnamese, so both translations are reviewed by a human, never machine-translated from the rewrite."
no_pii_attestation: true
data_sensitivity:
  - "Public data only"
data_sources:
  - "Published notice archive"
  - "Required regulatory wording list"
audience: "Public-facing"
data_governance_notes: "Only already-published notices are used; nothing internal or personal is involved."
contact_name: "Sam Whitcomb"
contact_title: "Communications Director"
contact_email: "sam.whitcomb@example.org"
---

## Problem

Our public notices were written to satisfy a regulation, not to be read. A boil water advisory opened with "Pursuant to the applicable state drinking water regulations" and buried the instruction — boil your water for one minute — in the fourth line of a 68-word sentence. Residents called to ask what they were supposed to do. Staff read the notice back to them over the phone, in plain language, which told us the problem was the writing and not the reader.

## What we built

A prompt kit and a review checklist. That is the whole thing.

The kit is a shared document with four prompts: rewrite at a sixth-grade level, produce a two-line version for social media, produce a translation request package, and check a draft against the plain-language rules. Staff paste the notice, pick the audience, and get a draft. No accounts to create, no tool to install — it uses the AI workspace the organization already licenses.

The checklist is what makes it safe. Before anything is published, the drafter confirms that the required action is in the first line, that the specifics (times, temperatures, dates, area) are unchanged, that no instruction was invented, and that any legally required wording still appears in the full notice.

## How it works

The rewrite is always a draft. Communications staff edit it, the program lead approves it, and legally required wording is reinstated verbatim where the regulation demands it. For translated versions, the kit produces a package for a bilingual staff member or contracted translator to review — we do not publish a machine translation that no person has read.

Everything the kit touches is already public information, so there is nothing sensitive in the workflow at all. That is a large part of why this was easy to approve.

## Results

Median reading level across notices published in the first six months fell from grade 14 to grade 7. Call volume to the main line after an advisory dropped noticeably, though we have not measured it carefully enough to claim a number.

The unexpected result was internal: staff started writing the first draft in plainer language themselves, because the checklist made the standard concrete.

## Lessons learned

The checklist matters more than the prompts. Early drafts softened things — an advisory that said water "may not be safe" became water that was "generally fine" — and only a review step catches that reliably.

## How to reuse

Copy the kit, replace our examples with your own notices, and keep the checklist as written. Anyone on staff can use it on day one; the only setup is agreeing internally on who approves a rewritten notice.

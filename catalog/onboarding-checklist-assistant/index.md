---
layout: entry
render_with_liquid: false
title: "New hire onboarding checklist assistant"
slug: onboarding-checklist-assistant
summary: "Builds a personalized checklist for each new hire, opens the access requests it can, and answers policy questions from the staff handbook."
published: 2026-01-27
updated: 2026-05-11
verified: 2026-06-05
featured: false
sample: true
impact: "Cut first-week help desk tickets from 11 to 3 per new hire"
organization: "Two Rivers Regional Health District"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
  - "Workflow automation"
use_case_category: "Administrative & task automation"
area:
  - "Agency operations and administration"
stage: "In production"
ai_role: "AI is part of the solution"
ai_types:
  - "Chat assistant"
  - "Document Q&A (RAG)"
  - "Agents & automation"
ai_tools:
  - "Azure OpenAI GPT-4o"
  - "Power Automate"
  - "SharePoint"
platform:
  - "Low-code platform"
  - "Microsoft Azure"
expertise: "Power user"
readiness:
  - "Guided setup"
  - "Needs customization"
  - "Human review built in"
resources:
  - label: "Onboarding task library (spreadsheet)"
    url: "https://docs.example.org/spreadsheets/d/1t7r4k9x/edit"
  - label: "Rollout runbook (PDF)"
    url: "https://docs.example.gov/tworivers/onboarding-assistant-runbook.pdf"
  - label: "Six-minute demo video"
    url: "https://videos.example.org/share/onboarding-assistant-demo"
screenshots:
  - src: /catalog/onboarding-checklist-assistant/screenshots/01.png
    alt: "Onboarding checklist for a new inspector, grouped by before day one, day one, week one and week two, with progress tiles."
  - src: /catalog/onboarding-checklist-assistant/screenshots/02.png
    alt: "Chat transcript where the assistant answers badge and access questions with handbook citations and declines a pay question."
sharing: "Code on request"
license: "Not open source — available on request"
access_terms: "The Power Platform solution file is available to other agencies on request; it needs an Azure OpenAI deployment of your own."
portability: "No — tied to its platform"
portability_notes: "Built in Power Apps and Power Automate against Azure OpenAI; moving it means rebuilding the flows on another low-code platform."
cost_band: "No new spend"
run_cost: "No ongoing cost"
procurement:
  - "Existing enterprise licence"
approvals:
  - "Labor or workforce consultation"
  - "Records retention review"
equity_note: "Every new hire meets it in their first week, which makes it an accessibility question before anything else. We tested the checklist with a screen reader and with our two colleagues who use one daily, and the plain-language pass brought it from a grade 14 reading level to grade 8 — the same standard we hold public notices to."
no_pii_attestation: true
data_sensitivity:
  - "Personal information (PII)"
  - "Internal, non-public data"
data_sources:
  - "HR position control list"
  - "Staff handbook"
  - "IT access catalog"
audience: "Internal staff"
data_governance_notes: "New-hire records include personal information; the assistant reads only the checklist status fields, and the HR system remains the record of truth."
contact_name: "Alicia Rand"
contact_title: "HR Systems Lead"
contact_email: "alicia.rand@example.org"
---

## Problem

Onboarding a new employee involved six people sending overlapping emails. HR sent forms, IT sent an account notice, the supervisor sent a schedule, building services sent badge instructions, and the new hire pieced it together. Nothing tracked what had actually been done. New inspectors regularly reached their second week without database access, and our service desk logged about 11 tickets per new hire in the first week — almost all of them "where do I find" or "who approves this".

## What we built

A checklist app on our low-code platform, plus a chat assistant that answers questions from published internal policy pages.

When HR marks a position filled, the app builds a checklist from a task library keyed to role, start date and work location. A field inspector gets vehicle and tablet tasks; an analyst does not. The app opens the access requests it is allowed to open, routes each to the right approver, and shows the new hire and the supervisor the same list.

## How it works

The task library is a spreadsheet HR maintains — about 90 tasks with rules for when each applies. That spreadsheet, not the model, decides what appears on a checklist.

The assistant is a retrieval assistant over our handbook, IT policies and the access catalog. It answers only from those pages and shows the section it used. It is explicitly out of scope for anything about pay, classification, discipline or personnel records, and it says so rather than guessing. Out-of-scope questions are logged, which turned out to be a useful list for HR.

Every access request still needs a human approval. The assistant drafts and tracks; it does not grant.

## Results

First-week help desk tickets fell from 11 to 3 per new hire. Time from start date to full system access dropped from a median of nine days to three. Supervisors report the biggest change is simply being able to see what is outstanding without asking.

## Lessons learned

The rules belong in the spreadsheet, not the prompt. Every time we let the model decide which tasks applied, it produced a reasonable-looking checklist that was subtly wrong for someone. Keeping the logic where HR can read and edit it made the tool defensible and easy to hand over.

## How to reuse

The runbook walks through the build in the order we did it: task library first, checklist app second, assistant last. Doing the assistant first is tempting and wrong — the checklist alone delivered most of the benefit, and it works without any AI at all.

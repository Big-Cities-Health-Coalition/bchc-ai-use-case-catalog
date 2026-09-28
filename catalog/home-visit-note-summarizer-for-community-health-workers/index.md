---
layout: entry
render_with_liquid: false
title: Home-visit note summarizer for community health workers
slug: home-visit-note-summarizer-for-community-health-workers
published: "2026-08-26"
featured: false
thumbnail: ""
organization: Cedar Valley County Health Department
solution_type:
  - "Generative AI tool"
  - "Workflow automation"
use_case_category: Administrative & task automation
area:
  - "Access to and linkage with care"
stage: Pilot
summary: "Community health workers record a short voice memo after each home visit; the tool transcribes it, drafts the structured visit note in our case-management format, and queues it for the CHW to review and file — turning a 20-minute typing task into a 4-minute review."
impact: "Visit notes filed same-day rose from 54% to 93% in the eight-week pilot"
review_status: Reviewed & approved
ai_role: AI is part of the solution
ai_types:
  - Speech & transcription
  - Generative text (LLM)
ai_tools:
  - Whisper
  - GPT-4o
  - Power Automate
platform:
  - Enterprise AI workspace
vendor: ""
expertise: Power user
readiness:
  - Guided setup
  - Needs a data agreement
  - Human review built in
repo_url: ""
demo_url: ""
docs_url: "https://example.org/chw-summarizer-writeup"
resources: []
screenshots: []
deck_pdf: "/catalog/home-visit-note-summarizer-for-community-health-workers/deck.pdf"
sharing: "Templates or documentation only"
license: "Not open source — description only"
access_terms: "The flow definitions are specific to our case-management vendor; we share the prompt set and the review checklist with coalition members on request."
portability: "Partially — with rework"
portability_notes: "Transcription and drafting are standard components in any enterprise AI workspace; the filing step is built against our case-management system's intake API."
reused_from: []
cost_band: "Under $25k"
run_cost: "Under $10k/yr"
procurement:
  - Existing enterprise licence
approvals:
  - Privacy review
  - Security review or authority to operate
  - Labor or workforce consultation
equity_note: CHWs and the families they visit. CHWs were in the design sessions from week one, and the union rep signed off on the pilot's time-study before it began. Notes about a family are never filed without the CHW who made the visit reading the draft.
no_pii_attestation: true
data_sensitivity:
  - Health information (PHI)
  - Personal information (PII)
data_sources:
  - Voice memos recorded by CHWs on managed devices
  - Case-management client records (write-only filing)
audience: Internal staff
data_governance_notes: "Runs entirely inside our HIPAA-covered enterprise tenant; voice memos are deleted after the note is filed. This entry shares the workflow design only — no client data leaves the department."
contact_name: Marcus Bell
contact_title: Community Health Program Supervisor
contact_email: "marcus.bell@example.org"
---

Our CHWs were spending the last 90 minutes of every field day typing notes, and same-day filing kept slipping. The pilot gave twelve CHWs a one-button voice memo flow: record in the parking lot, get the drafted note back before you're at the next visit, fix what's wrong, file it.

Two design choices did the most work. The draft opens with the three fields our nurses actually search on (referral made, follow-up date, safety flag), so a rushed review still gets the load-bearing fields right. And the tool refuses to file anything itself — a CHW taps file, every time. In the exit survey, eleven of twelve CHWs asked to keep it after the pilot.

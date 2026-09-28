---
layout: entry
render_with_liquid: false
title: "Meeting notes to action items for a partner coalition"
slug: coalition-meeting-notes
summary: "A short playbook for turning regional coalition meeting recordings into a reviewed action list that partner organizations receive the next day."
published: 2026-04-30
verified: 2026-06-27
featured: false
sample: true
impact: "Action lists reach partners in one day instead of two weeks"
organization: "Northgate City Health Department"
review_status: "Reviewed & approved"
solution_type:
  - "Generative AI tool"
  - "Standards, governance or playbook"
use_case_category: "Communications, media & writing"
area:
  - "Communications and community engagement"
  - "Emergency preparedness and response"
  - "Agency operations and administration"
stage: "In production"
ai_role: "AI is part of the solution"
ai_types:
  - "Speech & transcription"
  - "Generative text (LLM)"
ai_tools:
  - "Microsoft 365 Copilot"
  - "Teams meeting transcription"
platform:
  - "Enterprise AI workspace"
expertise: "Power user"
readiness:
  - "Reference only"
  - "Human review built in"
docs_url: "https://docs.example.gov/northgate/coalition-notes-playbook"
resources:
  - label: "Action item template (shared doc)"
    url: "https://docs.example.org/document/d/7h3n9j2k/edit"
  - label: "Six-minute walkthrough video"
    url: "https://videos.example.org/share/coalition-notes-walkthrough"
  - label: "Recording and consent notice (PDF)"
    url: "https://docs.example.gov/northgate/recording-notice.pdf"
screenshots:
  - src: /catalog/coalition-meeting-notes/screenshots/01.png
    alt: "Transcript excerpt beside a drafted action item table listing each action, the owning organization, a due date and status."
sharing: "Templates or documentation only"
license: "Creative Commons (CC BY / CC0)"
portability: "Yes — platform-agnostic"
portability_notes: "A prompt set and a review checklist — they work in any enterprise AI workspace that accepts a system prompt."
cost_band: "No new spend"
run_cost: "No ongoing cost"
procurement:
  - "Existing enterprise licence"
approvals:
  - "Privacy review"
  - "Records retention review"
  - "Community or advisory review"
equity_note: "Partner organizations are named in the notes, so a mis-attributed commitment lands on a small community group harder than on a hospital system. Every draft goes back to the coalition before it is filed, and the standing agenda item asking whether anyone was misquoted has caught three errors in eight months."
no_pii_attestation: true
data_sensitivity:
  - "Internal, non-public data"
data_sources:
  - "Meeting recordings"
  - "Prior meeting action lists"
audience: "Partner organizations"
data_governance_notes: "Meeting recordings are deleted after the notes are approved; partner organizations were told in writing that recordings feed an AI drafting step."
contact_name: "Deb Fuentes"
contact_title: "Coalition Coordinator"
contact_email: "deb.fuentes@example.org"
---

## Problem

We convene a regional preparedness coalition of about 20 partner organizations — shelters, clinics, mutual aid groups, emergency management. Meetings ran monthly and notes went out roughly two weeks later, written by whichever staff member had capacity. By then partners had forgotten what they agreed to, and the same items were carried forward for three or four meetings before anyone acted on them.

## What we built

There is no software here to install. This is a written process that uses transcription and drafting features already included in our existing workspace licenses, plus a template and a rule about who approves what.

The meeting is recorded with everyone's knowledge, using the consent notice linked above, which is read at the top of every call. The transcript is generated automatically. A staff member then asks the assistant for a draft action list in the shape of our template: action, owning organization, due date, and whether it is new or carried forward from a previous list.

## How it works

Three rules make this work and all three came from getting it wrong first.

Actions are assigned to organizations, never to named individuals. Partner staff turn over, and an action assigned to a person disappears when that person leaves.

Carried-forward items are matched against the previous list before drafting, so the coalition can see how long something has been open. That column changed behaviour more than anything else we did.

The chair reads and edits the draft before it goes out. Nothing is sent automatically, and the sent version is the chair's, not the assistant's.

## Results

Action lists now reach partners the day after the meeting rather than two weeks later. Items open for more than two meetings dropped by about half over six months, which we attribute mostly to the carry-forward column being visible to everyone.

The staff time to produce a list fell from around three hours to about 40 minutes, most of which is now the chair's editing.

## Lessons learned

The first drafts read as a summary of the conversation rather than a list of commitments. Asking for the template shape explicitly — and giving the assistant the previous list — is what turned it into something useful.

Say what you are doing with the recording, out loud, at every meeting. Partners were fine with it; they were not fine with finding out later.

## How to reuse

Take the template and the three rules and run them with whatever transcription your organization already licenses. The playbook is short by design, and the recording notice is the part we would copy first.

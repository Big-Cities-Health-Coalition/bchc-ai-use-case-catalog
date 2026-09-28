---
layout: entry
render_with_liquid: false
title: "Inspection backlog dashboard built with an AI coding assistant"
slug: inspection-backlog-dashboard
summary: "A nightly operations dashboard for environmental health backlogs, built in three weeks by one developer working with an AI coding assistant."
published: 2026-07-21
verified: 2026-08-01
featured: false
sample: true
impact: "Built in three weeks against a four-month estimate; replaced four hand-merged spreadsheets"
organization: "Baytown Metro Health District"
review_status: "Reviewed & approved"
solution_type:
  - "Dashboard or visualization"
use_case_category: "Coding & brainstorming"
area:
  - "Environmental health"
  - "Agency operations and administration"
stage: "In production"
ai_role: "AI helped build it"
ai_types:
  - "Rules-based (no ML)"
ai_tools:
  - "Claude Code"
  - "GitHub Copilot"
  - "Python"
  - "Dash"
  - "PostgreSQL"
platform:
  - "On-premises"
expertise: "Developer"
readiness:
  - "Needs customization"
docs_url: "https://docs.example.gov/baytown/backlog-dashboard-notes"
resources:
  - label: "AI-assisted build notes and review checklist (PDF)"
    url: "https://docs.example.gov/baytown/ai-assisted-build-notes.pdf"
  - label: "Data dictionary (spreadsheet)"
    url: "https://docs.example.org/spreadsheets/d/8c4z2r5b/edit"
screenshots:
  - src: /catalog/inspection-backlog-dashboard/screenshots/01.png
    alt: "Backlog dashboard with open and past-due totals and bar charts of past-due inspections by district and by inspection type."
  - src: /catalog/inspection-backlog-dashboard/screenshots/02.png
    alt: "Filtered list of past-due inspections in one district showing facility, type, assigned inspector, due date and days past due."
sharing: "Code on request"
license: "Not open source — available on request"
access_terms: "The dashboard SQL and the notes on how the coding assistant was used are shared with other departments on request."
portability: "Yes — platform-agnostic"
portability_notes: "Plain SQL views and a Power BI file; the views port to any warehouse and the visuals rebuild in any BI tool."
cost_band: "Not disclosed"
run_cost: "Not disclosed"
procurement:
  - "Existing enterprise licence"
approvals:
  - "Security review or authority to operate"
  - "Labor or workforce consultation"
equity_note: "The backlog it surfaces is not evenly distributed: the two districts with the oldest housing stock carry most of it, and making that visible was the point. We watch the reverse risk too — a dashboard that ranks inspectors by closure rate would push them toward the quick inspections, so it reports by district and never by individual."
no_pii_attestation: true
data_sensitivity:
  - "Internal, non-public data"
data_sources:
  - "Inspections database"
  - "Staff assignment roster"
audience: "Internal staff"
data_governance_notes: "The inspections database holds establishment records, not personal data; addresses of home-based establishments are excluded from the dashboard extract."
contact_name: "Ray Solomon"
contact_title: "Environmental Health Data Analyst"
contact_email: "ray.solomon@example.org"
---

## Problem

Every Monday, a supervisor exported four reports from the inspections system, merged them in a spreadsheet, and produced the backlog picture for the operations meeting. It took most of a morning, the numbers occasionally disagreed with each other, and nobody could look at the backlog between meetings. Our internal estimate for building a proper dashboard was four months of a developer's time, which meant it was never going to be scheduled.

## What we built

An ordinary internal dashboard: a nightly job that reads the inspections database, a set of SQL views, and a Dash application on a server we already run. It shows open and past-due counts, breakdowns by district and inspection type, and a filterable list supervisors use to reassign work.

There is no model in the running system. The dashboard does arithmetic and draws bars. What is worth sharing is how it got built.

## How it works

One developer built it in three weeks using an AI coding assistant for most of the code: the SQL views, the chart components, the layout, and the test fixtures. The developer wrote the data dictionary and the definition of "past due" by hand, in a meeting with the supervisors, before any code existed. That definition turned out to be the hard part of the project — three teams had three different ideas of when an inspection is late.

Every generated change went through the same review as any other code: a pull request, a human read of the diff, and a test run against a copy of production data. The build notes linked above describe what we let the assistant do unsupervised (component scaffolding, tests, refactors) and what we did not (schema changes, anything touching the write path, access rules).

## Results

Three weeks against a four-month estimate, with the caveat that the estimate was made for a team that would have designed a data warehouse first. The dashboard replaced four spreadsheets and the Monday morning merge.

Backlog is now reviewed weekly instead of monthly, and past-due work in the worst district dropped by about a fifth over the first quarter as supervisors reassigned it earlier.

## Lessons learned

The assistant was fastest at exactly the code we would have found tedious and slowest to be trusted with anything requiring institutional knowledge. It confidently produced a "days past due" calculation that ignored the statutory grace period, which a reviewer caught because the definition had been written down first.

Write the definitions before you write the prompts.

## How to reuse

The code is specific to our schema and is not published, but the build notes are the reusable part: what to review, what to hand over, and the argument we used to get an AI-assisted build approved by our IT governance group.

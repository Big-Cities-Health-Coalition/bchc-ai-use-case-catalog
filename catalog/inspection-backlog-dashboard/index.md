---
layout: entry
render_with_liquid: false
title: "Environmental health inspection backlog dashboard"
slug: inspection-backlog-dashboard
summary: "A nightly dashboard that shows environmental health supervisors where inspections are open and past due, by district and inspection type, in place of four spreadsheets merged by hand every Monday."
published: 2026-07-21
verified: 2026-08-01
featured: false
sample: true
impact: "Replaced four hand-merged spreadsheets; past-due work in the worst district fell by about a fifth in one quarter"
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
  - "PostgreSQL"
  - "SQL"
  - "Python"
  - "Dash"
  - "Claude Code"
  - "GitHub Copilot"
platform:
  - "On-premises"
expertise: "Developer"
readiness:
  - "Needs customization"
docs_url: "https://docs.example.gov/baytown/backlog-dashboard-notes"
resources:
  - label: "Build notes and code review checklist (PDF)"
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
access_terms: "The SQL views, the data dictionary and the build notes are shared with other departments on request."
portability: "Yes — platform-agnostic"
portability_notes: "Plain SQL views and a small Dash app; the views port to any warehouse and the charts rebuild in any BI tool."
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

An ordinary internal dashboard: a nightly job that reads the inspections database, a set of SQL views, and a Dash application on a server we already run. It shows open and past-due counts, breakdowns by district and inspection type, and a filterable list supervisors use to reassign work in the weekly meeting.

## How it works

The hard part was not the code. Three teams had three different ideas of when an inspection is late, so before anything was built we sat down with the supervisors and wrote a data dictionary and a single definition of "past due", including the statutory grace period for each inspection type. The SQL views implement that definition and nothing else, and every number on the dashboard traces back to one of them.

The dashboard reports by district and inspection type, never by individual inspector. Home-based establishments are left out of the nightly extract.

## How it was built

One developer built it in three weeks. An AI coding assistant wrote much of the routine code (chart components, layout, test fixtures) and every change went through the same review as any other code: a pull request, a human read of the diff, and a test run against a copy of production data. The data dictionary, the past-due definition, schema changes and access rules were written by hand.

## Results

The dashboard replaced four spreadsheets and the Monday morning merge. Backlog is now reviewed weekly instead of monthly, and past-due work in the worst district dropped by about a fifth over the first quarter as supervisors reassigned it earlier.

## Lessons learned

Write the definitions before you write any code. At one point a generated "days past due" calculation ignored the grace period, and a reviewer caught it only because the definition was already on paper.

## How to reuse

The code is specific to our schema and is not published. The reusable parts are the data dictionary, the past-due definition and the SQL views, which port to any warehouse. The build notes cover how we reviewed generated code, for teams that want to try the same approach.

---
layout: entry
render_with_liquid: false
title: "Overdose spike situational brief generator"
slug: overdose-spike-brief
summary: "An analysis script, run from a small app, that pulls naloxone runs, emergency department visits and medical examiner reports, compares them with an eight-week baseline, and produces a one-page situational brief within an hour of a spike alert."
published: 2025-07-22
featured: true
sample: true
impact: "Cut brief turnaround from three days to under one hour"
organization: "Harbor City Health Department"
review_status: "Reviewed & approved"
solution_type:
  - "Analysis project or script"
use_case_category: "Communications, media & writing"
area:
  - "Epidemiology and surveillance"
  - "Chronic disease and injury prevention"
stage: "Pilot"
ai_role: "Both"
ai_types:
  - "Generative text (LLM)"
ai_tools:
  - "Python"
  - "pandas"
  - "SQL"
  - "Streamlit"
  - "OpenAI API"
  - "GitHub Copilot"
platform:
  - "On-premises"
  - "Desktop or local"
expertise: "Analyst or data scientist"
readiness:
  - "Needs customization"
  - "Needs a data agreement"
  - "Human review built in"
repo_url: "https://github.com/example-org/spike-brief"
demo_url: "https://example-org.github.io/spike-brief-demo/"
resources:
  - label: "Synthetic sample dataset"
    url: "https://drive.example.org/drive/folders/spike-brief-sample"
  - label: "Walkthrough video (8 minutes)"
    url: "https://videos.example.org/share/spike-brief-walkthrough"
screenshots:
  - src: /catalog/overdose-spike-brief/screenshots/01.png
    alt: "Draft situational brief showing four summary tiles, a bar chart of naloxone runs by neighbourhood, and the drafted narrative."
  - src: /catalog/overdose-spike-brief/screenshots/02.png
    alt: "Brief generator form with an alert window, a neighbourhood checklist and a generate button."
sharing: "Open-source code"
license: "Apache 2.0"
portability: "Yes — platform-agnostic"
portability_notes: "A local Python tool: it reads each feed, computes the comparison, sends only the aggregate table to a model API for the narrative, and writes a document. The model client is one function and can be swapped."
cost_band: "No new spend"
run_cost: "Under $10k/yr"
procurement:
  - "Grant funded"
  - "Interagency agreement"
approvals:
  - "Privacy review"
  - "Community or advisory review"
  - "Equity impact assessment"
equity_note: "Overdose geography is also policing geography, so a brief that names a corner can be read as a deployment recommendation. The harm-reduction advisory board asked us to report at neighborhood rather than block level and to suppress counts under five, and the brief header states in writing that it is not for law enforcement targeting."
no_pii_attestation: true
data_sensitivity:
  - "Health information (PHI)"
  - "De-identified data"
  - "Criminal justice data (CJIS)"
data_sources:
  - "EMS naloxone administrations"
  - "Emergency department chief complaints"
  - "Medical examiner preliminary reports"
  - "Law enforcement naloxone reports"
audience: "Internal staff"
data_governance_notes: "Runs on-premises against identifiable EMS and medical-examiner extracts under an existing data-use agreement; the repository and this entry contain synthetic data only, and briefs are reviewed before any distribution."
contact_name: "Renee Okafor"
contact_title: "Overdose Prevention Epidemiologist"
contact_email: "renee.okafor@example.org"
---

## Problem

When the substance use division declares a spike, leadership wants a brief the same day. Assembling one meant three people pulling from three systems, agreeing on a time window, rebuilding the same charts, and writing the narrative by hand. In practice the brief arrived two or three days after the alert, by which point the question had usually moved on.

## What we built

A Python analysis script, wrapped in a small Streamlit app that an analyst runs on a workstation inside our network. The analyst picks an alert window and the neighbourhoods to include. The script pulls each feed, lines the records up on a common time window, computes deltas against an eight-week baseline, flags neighbourhoods above threshold, and renders the charts. A language model then drafts the narrative paragraphs from the finished numbers. The analyst edits the draft and exports a one-page PDF.

## How it works

There is one loader per feed, and each one queries record-level data inside our environment and returns daily counts by neighbourhood. Counts under five are suppressed before anything is charted. The baseline comparison and the threshold rules are plain code that the epidemiology team reviewed line by line, so every number in the brief can be traced back to a query.

The model only ever receives the aggregate table that ends up in the brief: counts by day, by neighbourhood, and the baseline comparison. No record-level data, no names and no addresses leave the network boundary.

The law enforcement naloxone feed comes from a system covered by criminal justice data rules, so it arrives through a standing data-sharing agreement and is aggregated before it reaches the script at all. That agreement was the longest part of the project by a wide margin.

We also used an AI coding assistant while building the app, mostly for the chart code and the PDF export. That is why this entry is tagged as both AI in the product and AI used to build it.

## Results

The first brief produced under the new process was ready 52 minutes after the alert. Across the pilot, median turnaround was under an hour against a previous median of three days. Most of the saving comes from the scripted analysis: nobody rebuilds the time window or the charts by hand any more. The drafted narrative helps with the last stretch, though analysts still rewrite roughly a quarter of it.

## Lessons learned

Get the numbers right in code first. Keeping the model on the aggregate side of the boundary, drafting text about figures it did not compute, made every governance conversation shorter. Reviewers stopped asking about the model and started asking about the data agreement, which was the right question.

## How to reuse

The repository ships with a synthetic sample dataset so you can run the whole flow end to end before you connect anything real. Swap the three loader functions for your own sources and adjust the baseline window. The narrative step is optional; the script produces the tiles and charts without it. Expect the data agreement, not the code, to set your timeline.

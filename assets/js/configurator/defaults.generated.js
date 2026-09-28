/**
 * GENERATED FILE — do not edit by hand.
 *
 * Built from _data/site.yml, _data/theme.yml, _data/schema.yml, _data/navigation.yml and _config.yml
 * by scripts/build_defaults.mjs (run via `npm run generate`).
 *
 * The browser wizard cannot read the repository at runtime, so the shipped
 * configuration is compiled into this module. CI fails when it is stale.
 */

/** Parsed _data/site.yml. */
export const SITE = {
  "name": "Public Health Digital Use Case Catalog",
  "tagline": "Digital tools, data and AI work from big-city health departments",
  "description": "A shared catalog of digital tools, data projects and AI work from Big Cities Health Coalition member health departments, so each city can reuse what another has already built.",
  "organization": {
    "name": "Big Cities Health Coalition",
    "short_name": "BCHC",
    "url": "https://www.bigcitieshealth.org",
    "contact_email": "info@bigcitieshealth.org"
  },
  "logo": {
    "image": "/assets/images/bchc-logo-mark.png",
    "text": "BCHC"
  },
  "social": {
    "og_image": "/assets/images/og-image.png"
  },
  "github": {
    "repository": "Big-Cities-Health-Coalition/use-case-catalog",
    "branch": "main"
  },
  "demo": true,
  "demo_starter_url": "",
  "modules": {
    "catalog": true,
    "submit": true,
    "carousel": true,
    "stats": true,
    "events": false,
    "cohorts": false,
    "resources": false,
    "governance": true
  },
  "hero": {
    "eyebrow": "Big Cities Health Coalition · Data Modernization Workgroup",
    "title": "Reuse what other health departments have already built",
    "lead": "Preview sample use cases modeled on common public health needs, from data pipelines and dashboards to analysis code, applications and AI tools. See how member submissions will show what was built, what it took, and what another city can take away.",
    "primary_cta": {
      "label": "Browse the catalog",
      "url": "/catalog/",
      "module": "catalog"
    },
    "secondary_cta": {
      "label": "Share your use case",
      "url": "/submit/",
      "module": "submit"
    }
  },
  "home": {
    "featured_count": 6,
    "recent_count": 6,
    "hero_latest_count": 3,
    "highlights": [
      {
        "title": "Reuse over reinvention",
        "body": "Each entry says what another health department can take away: open-source code, code on request, templates, or a plain account of the work."
      },
      {
        "title": "Honest notes on what it took",
        "body": "Entries record data sources, tools, staffing, cost and lessons learned, not just a project description."
      },
      {
        "title": "One form, one review, then it's live",
        "body": "A short form opens a GitHub issue. A maintainer reviews it in a pull request and the entry publishes when it merges."
      }
    ]
  },
  "submit": {
    "intro": "Share a digital tool, data project or AI use case with the coalition. Code is optional: a clear description of what you built and what it took is enough. Submissions open a GitHub issue for the maintainers to review, and nothing is published until it is approved.",
    "turnaround": "Intake checks it within about five business days and the Governance Committee reviews it within about ten more; you keep ownership of anything you share.",
    "review_note": "Please do not include protected health information, credentials or non-public data. Link out to repositories and documents rather than pasting sensitive content.",
    "fallback_email": "info@bigcitieshealth.org"
  },
  "catalog": {
    "verify_after_days": 365
  },
  "contact": {
    "ask_in_open": true
  },
  "footer": {
    "about": "A demonstration of a shared catalog for the coalition's Data Modernization Workgroup. All current entries are fictional samples; member submissions will be reviewed before publication.",
    "links": [
      {
        "label": "Big Cities Health Coalition",
        "url": "https://www.bigcitieshealth.org"
      },
      {
        "label": "Submit an entry",
        "url": "/submit/",
        "module": "submit"
      },
      {
        "label": "How search works",
        "url": "/about/search/",
        "module": "catalog"
      },
      {
        "label": "Maintainer guide",
        "url": "https://github.com/Big-Cities-Health-Coalition/use-case-catalog/blob/main/docs/admin-guide.md"
      }
    ],
    "copyright": "Big Cities Health Coalition",
    "accessibility": "This site is built to WCAG 2.1 AA and tested on every build; if something does not work for you, tell us and it will be treated as a defect."
  },
  "analytics": {
    "plausible_domain": ""
  }
};

/** Parsed _data/theme.yml. */
export const THEME = {
  "colors": {
    "primary": "#B90D13",
    "primary_dark": "#171717",
    "secondary": "#0571C6",
    "accent": "#FF8A7A",
    "ink": "#383838",
    "muted": "#5C5C5C",
    "line": "#E6E0D6",
    "line_strong": "#8A8A8A",
    "surface": "#FFFCF6",
    "surface_tint": "#F7F1E6",
    "card": "#FFFFFF",
    "on_dark": "#FFFCF6",
    "warn": "#B45309"
  },
  "fonts": {
    "heading": "Barlow",
    "body": "Figtree",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Figtree:wght@400;500;600;700&display=swap"
  },
  "type": {
    "measure": "36rem",
    "measure_display": "44rem"
  },
  "radius": "soft",
  "motion": {
    "fast": "120ms",
    "base": "180ms",
    "slow": "240ms",
    "ease": "cubic-bezier(0.2, 0, 0, 1)"
  }
};

/** Parsed _data/schema.yml. */
export const SCHEMA = {
  "entry": {
    "singular": "Use case",
    "plural": "Use cases",
    "path": "catalog",
    "sort": "published",
    "sort_order": "desc",
    "status_key": "review_status",
    "deprecated_value": "Deprecated",
    "status_scaffold_value": "Under review",
    "status_approved_value": "Reviewed & approved",
    "require_link": false,
    "contributor_key": "organization",
    "submitter_key": "submitter_github",
    "deployments_key": "also_deployed_by",
    "repo_key": "repo_url"
  },
  "groups": [
    {
      "key": "about",
      "title": "About",
      "description": "What it is, who built it, and what it changed."
    },
    {
      "key": "build",
      "title": "How it's built",
      "description": "The tools and technologies behind it, any AI involved, and where it runs."
    },
    {
      "key": "reuse",
      "title": "Reuse",
      "description": "What it would take for another team to use this.",
      "placement": "rail"
    },
    {
      "key": "sharing",
      "title": "Sharing & licensing",
      "description": "What another health department can get from you, on what terms, and how portable it is.",
      "icon": "share"
    },
    {
      "key": "cost",
      "title": "What it took",
      "description": "Money, contracting and approvals — the part a budget or governance conversation needs.",
      "icon": "credit-card"
    },
    {
      "key": "data",
      "title": "Data & access",
      "description": "What data it touches and who sees the output."
    },
    {
      "key": "contact",
      "title": "Contact",
      "description": "Someone others can reach out to.",
      "placement": "rail"
    },
    {
      "key": "story",
      "title": "The story",
      "description": "Problem, approach, what it took, results and lessons."
    }
  ],
  "fields": [
    {
      "key": "title",
      "label": "Title",
      "prompt": "What is it called?",
      "type": "text",
      "required": true,
      "group": "about",
      "weight": 1,
      "placeholder": "Nightly lab-result pipeline into the surveillance system",
      "description": "Specific enough that someone scanning a list of names knows what it is."
    },
    {
      "key": "organization",
      "label": "Organization",
      "prompt": "Which organization is sharing this?",
      "type": "text",
      "required": true,
      "group": "about",
      "weight": 9,
      "facet": true,
      "card": "meta",
      "search": true,
      "icon": "building",
      "placeholder": "Chicago Department of Public Health",
      "description": "A health department, city, agency or member organization."
    },
    {
      "key": "solution_type",
      "label": "Type of solution",
      "prompt": "What kind of solution is it?",
      "type": "multiselect",
      "required": true,
      "group": "about",
      "weight": 3,
      "facet": true,
      "card": "chip",
      "icon": "layers",
      "options": [
        "AI/ML model",
        "Generative AI tool",
        "Data pipeline or integration",
        "Analysis project or script",
        "Dashboard or visualization",
        "Application or software",
        "Data platform or infrastructure",
        "Workflow automation",
        "Standards, governance or playbook"
      ],
      "option_meta": {
        "AI/ML model": {
          "icon": "cpu",
          "description": "A trained model that predicts, classifies or detects something, such as a risk score or a forecast."
        },
        "Generative AI tool": {
          "short": "Generative AI",
          "icon": "sparkles",
          "description": "Drafts, summarizes, translates or answers questions with a large language model."
        },
        "Data pipeline or integration": {
          "short": "Data pipeline",
          "icon": "link",
          "description": "Moves, cleans or links data between systems: ETL jobs, feeds, HL7 or FHIR interfaces."
        },
        "Analysis project or script": {
          "short": "Analysis",
          "icon": "terminal",
          "description": "R, Python, SAS or SQL code and notebooks that answer a question or produce a report."
        },
        "Dashboard or visualization": {
          "short": "Dashboard",
          "icon": "chart-bar",
          "description": "A Power BI, Tableau, ArcGIS or custom dashboard, map or chart others can rebuild."
        },
        "Application or software": {
          "short": "Application",
          "icon": "code",
          "description": "A web, mobile or desktop application that staff or residents use."
        },
        "Data platform or infrastructure": {
          "short": "Data platform",
          "icon": "server",
          "description": "A warehouse, lakehouse, cloud environment or infrastructure-as-code other teams build on."
        },
        "Workflow automation": {
          "short": "Automation",
          "icon": "wand",
          "description": "Takes a repetitive task off staff: Power Automate flows, scheduled jobs, robotic process automation."
        },
        "Standards, governance or playbook": {
          "short": "Guidance",
          "icon": "book-open",
          "description": "A data standard, governance policy, checklist, template or implementation guide."
        }
      },
      "description": "Select all that fit. A dashboard fed by a new pipeline is both."
    },
    {
      "key": "sharing",
      "label": "What's shared",
      "prompt": "What can another health department get from you?",
      "type": "select",
      "required": true,
      "group": "sharing",
      "weight": 1,
      "facet": true,
      "card": "badge",
      "icon": "share",
      "options": [
        "Open-source code",
        "Code on request",
        "Templates or documentation only",
        "Description only"
      ],
      "option_meta": {
        "Open-source code": {
          "short": "Open source",
          "icon": "code",
          "tone": "primary",
          "description": "The code is in a public repository anyone can copy."
        },
        "Code on request": {
          "short": "On request",
          "icon": "lock",
          "description": "The code exists and peer health departments can ask for it."
        },
        "Templates or documentation only": {
          "short": "Templates/docs",
          "icon": "document",
          "description": "Templates, configurations, specifications or a playbook, without code."
        },
        "Description only": {
          "short": "Description",
          "icon": "book-open",
          "description": "A write-up of what was built and what it took. Ask the contact for more."
        }
      },
      "description": "Code is optional. A clear account of what you built and what it took is worth sharing on its own."
    },
    {
      "key": "use_case_category",
      "label": "AI use category",
      "prompt": "If it involves AI, which of the four coalition categories fits best?",
      "type": "select",
      "group": "about",
      "weight": 4,
      "facet": true,
      "icon": "grid",
      "options": [
        "Administrative & task automation",
        "Communications, media & writing",
        "Coding & brainstorming",
        "Operations & logistics"
      ],
      "option_meta": {
        "Administrative & task automation": {
          "short": "Admin & tasks",
          "description": "Forms, intake, scheduling, records — the routine work that eats staff time."
        },
        "Communications, media & writing": {
          "short": "Communications",
          "description": "Drafting, translating, summarising and publishing."
        },
        "Coding & brainstorming": {
          "short": "Coding",
          "description": "Writing or reviewing code, analysis, and idea generation."
        },
        "Operations & logistics": {
          "short": "Operations",
          "description": "Planning, dispatch, inventory, inspections and field work."
        }
      },
      "description": "For AI work only: the HHS-adapted categories the DMWG AI inventory uses. Leave it blank if no AI is involved."
    },
    {
      "key": "area",
      "label": "Public health area",
      "prompt": "Which public health areas does it serve?",
      "type": "multiselect",
      "required": true,
      "group": "about",
      "weight": 5,
      "facet": true,
      "card": "fact",
      "icon": "tag",
      "options": [
        "Communicable disease",
        "Chronic disease and injury prevention",
        "Environmental health",
        "Maternal, child and family health",
        "Access to and linkage with care",
        "Emergency preparedness and response",
        "Epidemiology and surveillance",
        "Vital records and health statistics",
        "Communications and community engagement",
        "Data modernization and informatics",
        "Agency operations and administration"
      ],
      "option_meta": {
        "Communicable disease": {
          "short": "Communicable",
          "description": "Infectious disease control, immunization, STI, HIV, TB and outbreak response."
        },
        "Chronic disease and injury prevention": {
          "short": "Chronic/injury",
          "description": "Chronic conditions, tobacco, nutrition, violence, overdose and injury prevention."
        },
        "Environmental health": {
          "short": "Environmental",
          "description": "Food safety, inspections, lead, housing, air and water quality, vectors, extreme heat."
        },
        "Maternal, child and family health": {
          "short": "Maternal/child",
          "description": "Home visiting, WIC, prenatal and infant health, school-age health."
        },
        "Access to and linkage with care": {
          "short": "Access to care",
          "description": "Clinics, community health workers, referrals and connecting residents to services."
        },
        "Emergency preparedness and response": {
          "short": "Preparedness",
          "description": "Planning for and responding to emergencies and public health incidents."
        },
        "Epidemiology and surveillance": {
          "short": "Epidemiology",
          "description": "Case, syndromic, laboratory and wastewater surveillance, and the analysis behind it."
        },
        "Vital records and health statistics": {
          "short": "Vital records",
          "description": "Birth and death records and the population health statistics built from them."
        },
        "Communications and community engagement": {
          "short": "Communications",
          "description": "Public information, risk communication, language access and community partnerships."
        },
        "Data modernization and informatics": {
          "short": "Informatics",
          "description": "Shared data systems, interoperability and data governance that serve more than one program."
        },
        "Agency operations and administration": {
          "short": "Operations",
          "description": "HR, finance, grants, procurement, contracts, IT and legal work that keeps the department running."
        }
      },
      "description": "Select all that fit. The first five follow the program areas of the Foundational Public Health Services; the rest are the capabilities every program relies on."
    },
    {
      "key": "stage",
      "label": "Stage",
      "prompt": "How far along is it?",
      "type": "select",
      "required": true,
      "group": "about",
      "weight": 6,
      "facet": true,
      "card": "meta",
      "icon": "flag",
      "options": [
        "Idea / exploring",
        "Pilot",
        "In production",
        "Paused or retired"
      ],
      "option_meta": {
        "Idea / exploring": {
          "short": "Exploring",
          "description": "Scoping or prototyping; nothing in regular use yet."
        },
        "Pilot": {
          "description": "In limited use with real users while it is evaluated."
        },
        "In production": {
          "short": "In production",
          "tone": "primary",
          "description": "In regular, supported use."
        },
        "Paused or retired": {
          "short": "Retired",
          "description": "No longer active — shared for the lessons."
        }
      },
      "description": "Pick the stage that matches real use, not the plan."
    },
    {
      "key": "summary",
      "label": "Summary",
      "prompt": "In one or two sentences, what does it do?",
      "type": "textarea",
      "required": true,
      "group": "about",
      "weight": 7,
      "description": "Shown on the catalog card. Plain language, no jargon.",
      "placeholder": "Pulls lab results from the state feed every night, removes duplicates and loads them into our surveillance system, so epidemiologists start the day with clean data."
    },
    {
      "key": "impact",
      "label": "Result in one line",
      "prompt": "What is the single most concrete result so far?",
      "type": "text",
      "group": "about",
      "weight": 8,
      "card": "line",
      "icon": "trending-up",
      "search": true,
      "placeholder": "Cut brief turnaround from 3 days to 1 hour",
      "description": "A number if you have one."
    },
    {
      "key": "review_status",
      "label": "Review status",
      "prompt": "Where is this entry in the coalition's review?",
      "type": "select",
      "form": false,
      "group": "about",
      "weight": 9,
      "facet": true,
      "icon": "shield-check",
      "options": [
        "Reviewed & approved",
        "Under review",
        "Revisions requested",
        "Not yet reviewed",
        "Deprecated"
      ],
      "option_meta": {
        "Reviewed & approved": {
          "short": "Approved",
          "tone": "primary",
          "description": "Passed intake and Governance Committee review."
        },
        "Under review": {
          "description": "Published provisionally while the committee reviews it."
        },
        "Revisions requested": {
          "short": "Revisions",
          "tone": "warn",
          "description": "The committee has asked the submitter for changes."
        },
        "Not yet reviewed": {
          "short": "Unreviewed",
          "tone": "warn",
          "description": "Listed before any review took place."
        },
        "Deprecated": {
          "tone": "warn",
          "description": "No longer maintained or accurate — kept for the record."
        }
      },
      "description": "Set by the review committee, not the submitter."
    },
    {
      "key": "ai_role",
      "label": "Role of AI",
      "prompt": "What part, if any, does AI play?",
      "type": "select",
      "group": "build",
      "weight": 1,
      "facet": true,
      "icon": "sparkles",
      "options": [
        "No AI",
        "AI is part of the solution",
        "AI helped build it",
        "Both"
      ],
      "option_meta": {
        "No AI": {
          "description": "Neither the solution nor the way it was built involved AI."
        },
        "AI is part of the solution": {
          "short": "In solution",
          "description": "The running system uses AI (a model, an assistant, an automation)."
        },
        "AI helped build it": {
          "short": "Built with AI",
          "description": "AI tools helped write the code, docs or analysis, but the solution itself doesn't use AI."
        },
        "Both": {
          "description": "AI is in the solution and was used to build it."
        }
      },
      "description": "Most digital work involves no AI, and that is a fine answer."
    },
    {
      "key": "ai_types",
      "label": "Types of AI",
      "prompt": "If AI is involved, what kinds?",
      "type": "multiselect",
      "group": "build",
      "weight": 2,
      "facet": true,
      "icon": "cpu",
      "options": [
        "Generative text (LLM)",
        "Chat assistant",
        "Document Q&A (RAG)",
        "Classification & NLP",
        "Prediction & forecasting",
        "Computer vision",
        "Speech & transcription",
        "Translation",
        "Agents & automation",
        "Rules-based (no ML)"
      ],
      "option_meta": {
        "Generative text (LLM)": {
          "short": "Text (LLM)",
          "description": "Drafts, summarizes or rewrites text with a large language model."
        },
        "Chat assistant": {
          "short": "Chat",
          "description": "A conversational interface for staff or the public."
        },
        "Document Q&A (RAG)": {
          "short": "Document Q&A",
          "description": "Answers questions from your own documents (retrieval-augmented generation)."
        },
        "Classification & NLP": {
          "short": "Classification",
          "description": "Sorts, tags or extracts information from text."
        },
        "Prediction & forecasting": {
          "short": "Prediction",
          "description": "Predicts risk, demand or trends from historical data."
        },
        "Computer vision": {
          "short": "Vision",
          "description": "Reads images, video or scanned documents."
        },
        "Speech & transcription": {
          "short": "Speech",
          "description": "Transcribes or understands spoken audio."
        },
        "Translation": {
          "description": "Translates between languages."
        },
        "Agents & automation": {
          "short": "Agents",
          "description": "Multi-step automation where the AI takes actions."
        },
        "Rules-based (no ML)": {
          "short": "Rules-based",
          "description": "Deterministic logic, shared here for comparison."
        }
      },
      "description": "Select all that apply. Skip it when there is no AI."
    },
    {
      "key": "ai_tools",
      "label": "Tools and technologies",
      "prompt": "Which tools and technologies does it use?",
      "type": "list",
      "group": "build",
      "weight": 3,
      "facet": true,
      "search": true,
      "icon": "terminal",
      "placeholder": "R, Python, SAS, SQL Server, Power BI, FHIR, Azure OpenAI",
      "description": "Name the languages, platforms, libraries, standards and AI models that matter."
    },
    {
      "key": "platform",
      "label": "Where it runs",
      "prompt": "Where does it run?",
      "type": "multiselect",
      "group": "build",
      "weight": 4,
      "facet": true,
      "icon": "server",
      "options": [
        "AWS",
        "Microsoft Azure",
        "Google Cloud",
        "On-premises",
        "Vendor / SaaS hosted",
        "Enterprise AI workspace",
        "Low-code platform",
        "Desktop or local"
      ],
      "option_meta": {
        "Microsoft Azure": {
          "short": "Azure"
        },
        "Google Cloud": {
          "short": "GCP"
        },
        "On-premises": {
          "short": "On-prem"
        },
        "Vendor / SaaS hosted": {
          "short": "SaaS",
          "description": "Runs on the vendor's infrastructure."
        },
        "Enterprise AI workspace": {
          "short": "AI workspace",
          "description": "Microsoft 365 Copilot, ChatGPT Enterprise, Gemini for Workspace and similar."
        },
        "Low-code platform": {
          "short": "Low-code",
          "description": "Power Platform, Airtable, n8n and similar."
        },
        "Desktop or local": {
          "short": "Local",
          "description": "Runs on a laptop or workstation."
        }
      },
      "description": "Select all that apply."
    },
    {
      "key": "vendor",
      "label": "Vendor or partner",
      "prompt": "If a vendor or partner built or hosts it, who?",
      "type": "text",
      "group": "build",
      "weight": 5,
      "search": true,
      "placeholder": "Acme Health AI",
      "description": "Leave it blank if your own team built it."
    },
    {
      "key": "expertise",
      "label": "Skills needed to set it up",
      "prompt": "Who is the least technical person who could get this running?",
      "type": "select",
      "required": true,
      "group": "reuse",
      "weight": 1,
      "facet": true,
      "card": "icon",
      "icon": "academic-cap",
      "options": [
        "Anyone on staff",
        "Power user",
        "Analyst or data scientist",
        "Developer",
        "Contractor or vendor"
      ],
      "option_meta": {
        "Anyone on staff": {
          "short": "Anyone",
          "icon": "user",
          "description": "No technical skills — follow the instructions."
        },
        "Power user": {
          "icon": "adjustments",
          "description": "Someone comfortable with spreadsheets, forms and low-code tools."
        },
        "Analyst or data scientist": {
          "short": "Analyst",
          "icon": "chart-bar",
          "description": "Someone who works in Python, R or SQL."
        },
        "Developer": {
          "icon": "code",
          "description": "A software developer to deploy or adapt it."
        },
        "Contractor or vendor": {
          "short": "Contractor",
          "icon": "wrench",
          "description": "Outside help is required to stand this up."
        }
      },
      "description": "Judge it by setting the thing up, not by using it afterwards."
    },
    {
      "key": "readiness",
      "label": "Readiness",
      "prompt": "What would another team need before they could use this?",
      "type": "multiselect",
      "group": "reuse",
      "weight": 2,
      "facet": true,
      "card": "icon",
      "icon": "rocket",
      "options": [
        "Ready to deploy",
        "Guided setup",
        "Needs customization",
        "Needs a contractor",
        "Needs a paid license",
        "Needs a data agreement",
        "Human review built in",
        "Reference only"
      ],
      "option_meta": {
        "Ready to deploy": {
          "short": "Ready",
          "icon": "rocket",
          "tone": "primary",
          "description": "Can be used as-is with minimal configuration."
        },
        "Guided setup": {
          "short": "Guided setup",
          "icon": "wand",
          "description": "A wizard or script walks you through installation."
        },
        "Needs customization": {
          "short": "Needs config",
          "icon": "adjustments",
          "description": "Your team will need to adapt it before use."
        },
        "Needs a contractor": {
          "short": "Needs vendor",
          "icon": "wrench",
          "description": "Requires a contractor or vendor to implement."
        },
        "Needs a paid license": {
          "short": "Paid license",
          "icon": "credit-card",
          "description": "Depends on a paid product, API or subscription."
        },
        "Needs a data agreement": {
          "short": "Data agreement",
          "icon": "document",
          "description": "A data-sharing or BAA-type agreement is required."
        },
        "Human review built in": {
          "short": "Human review",
          "icon": "eye",
          "description": "A person checks the output before it is used."
        },
        "Reference only": {
          "short": "Reference",
          "icon": "book-open",
          "description": "Documentation and lessons — not something to deploy."
        }
      },
      "description": "Select all that apply."
    },
    {
      "key": "repo_url",
      "label": "Source code",
      "prompt": "If the code is public, where?",
      "type": "url",
      "group": "reuse",
      "weight": 3,
      "icon": "code",
      "placeholder": "https://github.com/your-org/your-project",
      "description": "GitHub, GitLab, Azure DevOps or any public repository. Code is optional: leave this blank if you are not sharing it."
    },
    {
      "key": "demo_url",
      "label": "Live site or demo",
      "prompt": "Link to a live site or demo",
      "type": "url",
      "group": "reuse",
      "weight": 4,
      "icon": "globe",
      "placeholder": "https://example.org/app"
    },
    {
      "key": "docs_url",
      "label": "Documentation or write-up",
      "prompt": "Link to documentation, slides or a write-up",
      "type": "url",
      "group": "reuse",
      "weight": 5,
      "icon": "document",
      "placeholder": "https://example.org/docs",
      "description": "A report, a blog post or a vendor case study all count."
    },
    {
      "key": "resources",
      "label": "Other resources",
      "prompt": "Anything else worth linking?",
      "type": "links",
      "group": "reuse",
      "weight": 6,
      "icon": "link",
      "placeholder": "Evaluation report | https://drive.google.com/…",
      "description": "Shared drives, SharePoint, model cards, container images, vendor pages."
    },
    {
      "key": "screenshots",
      "label": "Screenshots",
      "prompt": "Screenshots of it in use",
      "type": "images",
      "group": "reuse",
      "weight": 7,
      "icon": "image",
      "description": "Up to eight PNG, JPEG, GIF or WebP images of the tool in use (15 MB total). Make sure no personal or protected information is visible."
    },
    {
      "key": "deck_pdf",
      "label": "Slide deck or one-pager (PDF)",
      "prompt": "Slide deck or one-pager",
      "type": "file",
      "filename": "deck.pdf",
      "thumbnail": true,
      "group": "reuse",
      "weight": 8,
      "icon": "presentation",
      "description": "Attach the slide deck here. A thumbnail is generated from its first page."
    },
    {
      "key": "also_deployed_by",
      "label": "Also deployed by",
      "prompt": "Who else is running this?",
      "type": "links",
      "form": false,
      "group": "reuse",
      "weight": 9,
      "icon": "users",
      "search": true,
      "description": "Other organizations running this, maintained through the \"Also deployed by\" issue form."
    },
    {
      "key": "license",
      "label": "License",
      "prompt": "Under what license is it shared?",
      "type": "select",
      "group": "sharing",
      "weight": 2,
      "facet": true,
      "card": "fact",
      "icon": "document",
      "options": [
        "MIT",
        "Apache 2.0",
        "GPL / AGPL",
        "Creative Commons (CC BY / CC0)",
        "Other open license",
        "Not open source — available on request",
        "Not open source — description only"
      ],
      "option_meta": {
        "MIT": {
          "tone": "primary",
          "description": "Permissive; reuse with attribution."
        },
        "Apache 2.0": {
          "tone": "primary",
          "description": "Permissive, with a patent grant."
        },
        "GPL / AGPL": {
          "description": "Copyleft — derivatives must stay open."
        },
        "Creative Commons (CC BY / CC0)": {
          "short": "CC BY / CC0",
          "tone": "primary",
          "description": "For documents, prompts, datasets and training material."
        },
        "Other open license": {
          "short": "Other open",
          "description": "Name it in the access terms below."
        },
        "Not open source — available on request": {
          "short": "On request",
          "description": "Peer jurisdictions can ask; say how in the access terms below."
        },
        "Not open source — description only": {
          "short": "Write-up only",
          "description": "The write-up is what is shared, not the artifact itself."
        }
      },
      "description": "Optional when nothing but a description is shared. For code and documents the coalition default is a permissive open license (MIT, Apache 2.0, CC BY). Submitting does not transfer ownership; your organization keeps authorship."
    },
    {
      "key": "access_terms",
      "label": "Access terms",
      "prompt": "If it is not open source, how can a peer jurisdiction get access?",
      "type": "textarea",
      "group": "sharing",
      "weight": 3,
      "placeholder": "Available to other health departments under a data-sharing agreement — email the contact below.",
      "description": "Government-to-government only, agreement required, contact us — whatever applies. Leave blank for open-licensed resources."
    },
    {
      "key": "portability",
      "label": "Portable to other platforms",
      "prompt": "Could it be adapted outside its original vendor ecosystem?",
      "type": "select",
      "required": true,
      "group": "sharing",
      "weight": 4,
      "facet": true,
      "card": "fact",
      "icon": "server",
      "options": [
        "Yes — platform-agnostic",
        "Partially — with rework",
        "No — tied to its platform"
      ],
      "option_meta": {
        "Yes — platform-agnostic": {
          "short": "Portable",
          "tone": "primary",
          "description": "Runs on any comparable stack with configuration changes only."
        },
        "Partially — with rework": {
          "short": "With rework",
          "description": "Some pieces are vendor-specific and would need swapping."
        },
        "No — tied to its platform": {
          "short": "Platform-tied",
          "description": "Depends on one vendor's services end to end."
        }
      },
      "description": "Microsoft-built but portable to AWS is 'partially'."
    },
    {
      "key": "portability_notes",
      "label": "Portability notes",
      "prompt": "What would porting it involve?",
      "type": "textarea",
      "group": "sharing",
      "weight": 5,
      "placeholder": "The R scripts and the data dictionary run anywhere; the nightly schedule uses Azure Data Factory and would need replacing.",
      "description": "Which pieces are vendor-specific, and what a team on a different stack would need to swap."
    },
    {
      "key": "reused_from",
      "label": "Adapted from",
      "prompt": "Did you adapt this from another entry in this catalog?",
      "type": "list",
      "group": "sharing",
      "weight": 6,
      "links_entries": true,
      "search": false,
      "placeholder": "overdose-spike-brief",
      "description": "Name the source by its slug — the last part of its URL. The entry you name will say it was adopted by yours."
    },
    {
      "key": "cost_band",
      "label": "Cost to stand up",
      "prompt": "Roughly what did it cost to get it running the first time?",
      "type": "select",
      "group": "cost",
      "weight": 1,
      "facet": true,
      "card": "fact",
      "icon": "credit-card",
      "options": [
        "No new spend",
        "Under $25k",
        "$25k–$100k",
        "$100k–$500k",
        "Over $500k",
        "Not disclosed"
      ],
      "option_meta": {
        "No new spend": {
          "tone": "primary",
          "description": "Built with licences, staff and infrastructure the organization already had."
        },
        "Not disclosed": {
          "description": "The submitter cannot share cost publicly. Ask the contact."
        }
      },
      "description": "One-time cost: contracts, build, implementation. A band is fine — nobody expects an exact figure."
    },
    {
      "key": "run_cost",
      "label": "Cost to keep running",
      "prompt": "What does a normal year cost to run?",
      "type": "select",
      "group": "cost",
      "weight": 2,
      "facet": true,
      "icon": "clock",
      "options": [
        "No ongoing cost",
        "Under $10k/yr",
        "$10k–$50k/yr",
        "Over $50k/yr",
        "Not disclosed"
      ],
      "option_meta": {
        "No ongoing cost": {
          "short": "No run cost",
          "tone": "primary"
        },
        "Not disclosed": {
          "description": "The submitter cannot share cost publicly. Ask the contact."
        }
      },
      "description": "Licences, hosting and usage charges only — staff time belongs in the write-up."
    },
    {
      "key": "procurement",
      "label": "How it was bought",
      "prompt": "How was this paid for or contracted?",
      "type": "multiselect",
      "group": "cost",
      "weight": 3,
      "facet": true,
      "icon": "document",
      "options": [
        "No procurement needed",
        "Existing enterprise licence",
        "Cooperative or piggyback contract",
        "Competitive solicitation",
        "Sole source",
        "Grant funded",
        "Interagency agreement",
        "In-kind or academic partnership"
      ],
      "option_meta": {
        "No procurement needed": {
          "short": "None needed"
        },
        "Existing enterprise licence": {
          "short": "Already owned",
          "description": "Covered by a contract the organization already held."
        },
        "Cooperative or piggyback contract": {
          "short": "Cooperative",
          "description": "Bought off another jurisdiction's or a co-op's contract."
        },
        "Competitive solicitation": {
          "short": "Competitive",
          "description": "An RFP, RFQ or equivalent open competition."
        },
        "Sole source": {
          "description": "Awarded without competition, with a written justification."
        },
        "Grant funded": {
          "short": "Grant"
        },
        "Interagency agreement": {
          "short": "Interagency",
          "description": "Paid through an agreement with another public agency."
        },
        "In-kind or academic partnership": {
          "short": "Partnership"
        }
      },
      "description": "Select all that apply. This is the question peers ask most and the one that is hardest to find out."
    },
    {
      "key": "approvals",
      "label": "Reviews it went through",
      "prompt": "Which internal reviews or approvals did it need?",
      "type": "multiselect",
      "group": "cost",
      "weight": 4,
      "facet": true,
      "card": "fact",
      "icon": "shield-check",
      "options": [
        "Privacy review",
        "Security review or authority to operate",
        "Legal or contracts review",
        "Records retention review",
        "Labor or workforce consultation",
        "Community or advisory review",
        "Equity impact assessment",
        "Research ethics / IRB",
        "AI governance body",
        "None required",
        "Not yet reviewed"
      ],
      "option_meta": {
        "Security review or authority to operate": {
          "short": "Security",
          "description": "A security assessment, ATO or equivalent sign-off."
        },
        "Legal or contracts review": {
          "short": "Legal"
        },
        "Records retention review": {
          "short": "Records",
          "description": "Confirmed how long the outputs must be kept and where."
        },
        "Labor or workforce consultation": {
          "short": "Labor",
          "description": "Discussed with the union or the affected staff before rollout."
        },
        "Community or advisory review": {
          "short": "Community",
          "icon": "users"
        },
        "Equity impact assessment": {
          "short": "Equity review",
          "icon": "users"
        },
        "Research ethics / IRB": {
          "short": "IRB"
        },
        "AI governance body": {
          "short": "AI governance",
          "description": "An internal AI review board or committee signed off."
        },
        "Not yet reviewed": {
          "short": "No review yet",
          "tone": "warn",
          "description": "Shared honestly — this has not been through a formal review."
        }
      },
      "description": "Select all that apply. Saying 'not yet reviewed' is more useful to a peer than leaving it blank."
    },
    {
      "key": "equity_note",
      "label": "Who it affects",
      "prompt": "Who could this help or harm, and how did you check?",
      "type": "textarea",
      "group": "cost",
      "weight": 5,
      "placeholder": "Reaches everyone who calls the hotline, including the ~18% who use it in Spanish. We compared triage accuracy across language groups monthly and would stop if the gap grew.",
      "description": "Optional but strongly encouraged. Which populations the output reaches, what you checked for uneven performance, and what you would watch."
    },
    {
      "key": "no_pii_attestation",
      "label": "No PII/PHI in the shared material",
      "prompt": "Do you confirm that no personal or protected health information appears in the resource, its documentation, example data or screenshots?",
      "type": "boolean",
      "required": true,
      "group": "data",
      "weight": 1,
      "icon": "shield-check",
      "escalate_on": [
        false
      ],
      "description": "The coalition's baseline for anything published here. Reviewers spot-check; if the answer is no, redact before submitting."
    },
    {
      "key": "data_sensitivity",
      "label": "Data it touches",
      "prompt": "What kind of data does it touch?",
      "type": "multiselect",
      "required": true,
      "group": "data",
      "weight": 2,
      "facet": true,
      "card": "icon",
      "icon": "shield",
      "options": [
        "Public data only",
        "De-identified data",
        "Internal, non-public data",
        "Personal information (PII)",
        "Health information (PHI)",
        "Criminal justice data (CJIS)"
      ],
      "option_meta": {
        "Public data only": {
          "short": "Public data",
          "icon": "globe",
          "description": "Only data that is already public."
        },
        "De-identified data": {
          "short": "De-identified",
          "icon": "shield-check",
          "description": "Personal identifiers removed before use."
        },
        "Internal, non-public data": {
          "short": "Internal data",
          "icon": "lock",
          "description": "Non-public operational data without personal identifiers."
        },
        "Personal information (PII)": {
          "short": "PII",
          "icon": "shield",
          "tone": "warn",
          "description": "Names, addresses, IDs or other personal identifiers."
        },
        "Health information (PHI)": {
          "short": "PHI",
          "icon": "shield",
          "tone": "warn",
          "description": "Identifiable health information covered by HIPAA."
        },
        "Criminal justice data (CJIS)": {
          "short": "CJIS",
          "icon": "shield",
          "tone": "warn",
          "description": "Data subject to CJIS security policy."
        }
      },
      "escalate_on": [
        "Personal information (PII)",
        "Health information (PHI)",
        "Criminal justice data (CJIS)"
      ],
      "description": "Select all that apply. This helps others judge governance and approval effort."
    },
    {
      "key": "data_sources",
      "label": "Data sources",
      "prompt": "Which data sources does it use?",
      "type": "list",
      "group": "data",
      "weight": 3,
      "search": true,
      "icon": "database",
      "placeholder": "Immunization registry, 311 call transcripts, ESSENCE",
      "description": "Describe the sources — do not paste sensitive data."
    },
    {
      "key": "audience",
      "label": "Who sees the output",
      "prompt": "Who sees the output?",
      "type": "select",
      "required": true,
      "group": "data",
      "weight": 4,
      "facet": true,
      "card": "icon",
      "icon": "users",
      "options": [
        "Public-facing",
        "Internal staff",
        "Partner organizations"
      ],
      "option_meta": {
        "Public-facing": {
          "short": "Public",
          "icon": "globe",
          "description": "Residents or the general public interact with it."
        },
        "Internal staff": {
          "short": "Internal",
          "icon": "lock",
          "description": "Used only inside the organization."
        },
        "Partner organizations": {
          "short": "Partners",
          "icon": "users",
          "description": "Shared with specific partner organizations."
        }
      },
      "escalate_on": [
        "Public-facing"
      ],
      "description": "Pick the widest group that sees anything it produces."
    },
    {
      "key": "data_governance_notes",
      "label": "Data-governance caveats",
      "prompt": "Anything a reusing jurisdiction should know about data handling?",
      "type": "textarea",
      "group": "data",
      "weight": 5,
      "placeholder": "Outputs are retained 90 days under our records schedule; the matching rules were tuned to our own registry, so expect to re-tune them.",
      "description": "Data-use agreements, retention rules, de-identification steps — the caveats that travel with the resource."
    },
    {
      "key": "security_review",
      "label": "Security review",
      "prompt": "How much has anybody looked at this code?",
      "type": "select",
      "form": false,
      "group": "data",
      "weight": 6,
      "facet": true,
      "card": "fact",
      "icon": "shield-check",
      "options": [
        "Coalition security-reviewed",
        "Automated checks only",
        "Not reviewed"
      ],
      "option_meta": {
        "Coalition security-reviewed": {
          "short": "Sec-reviewed",
          "tone": "primary",
          "description": "A coalition maintainer read this project's security practices — its policy, its dependencies, how it handles data — on the date recorded in the pull request. It is a point-in-time reading of practices, not an audit of the code and not a guarantee that it is safe to run."
        },
        "Automated checks only": {
          "short": "Auto checks",
          "description": "Nobody has reviewed this project. All that is recorded is what the monthly sweep could observe from the outside — repository activity, license, security policy, public OpenSSF Scorecard — and none of that inspects what the code does."
        },
        "Not reviewed": {
          "short": "Not reviewed",
          "tone": "warn",
          "description": "Nobody has looked at this project on the catalog's behalf. Treat the link as a starting point for your own review, not as a recommendation."
        }
      },
      "description": "Set by maintainers, not the submitter. None of these values means the code is safe to run — run your own security review before deploying."
    },
    {
      "key": "contact_name",
      "label": "Contact name",
      "prompt": "Who can people contact?",
      "type": "text",
      "required": true,
      "group": "contact",
      "weight": 1,
      "placeholder": "Jordan Lee",
      "description": "Someone happy to answer questions from another team."
    },
    {
      "key": "contact_title",
      "label": "Contact title",
      "prompt": "What is their role or title?",
      "type": "text",
      "group": "contact",
      "weight": 2,
      "placeholder": "Informatics Manager",
      "description": "So a peer knows who they are writing to."
    },
    {
      "key": "contact_email",
      "label": "Contact email",
      "prompt": "What is their email?",
      "type": "email",
      "required": true,
      "group": "contact",
      "weight": 3,
      "placeholder": "jordan.lee@city.gov"
    },
    {
      "key": "submitter_github",
      "label": "GitHub username",
      "prompt": "Your GitHub username (optional)",
      "type": "text",
      "group": "contact",
      "weight": 4,
      "search": false,
      "placeholder": "jordan-lee",
      "description": "Used once a year: when this entry is due to be re-confirmed the reminder mentions you, so the request reaches the person who wrote it. Leave it blank and the reminder goes to the maintainers alone."
    },
    {
      "key": "body",
      "label": "Full write-up",
      "prompt": "What's the story?",
      "type": "markdown",
      "required": true,
      "group": "story",
      "weight": 1,
      "description": "Markdown is supported. Suggested headings: Problem, Approach, What it took (data, staffing, cost), Results, Lessons learned, How to reuse.",
      "placeholder": "## Problem\n\n## Approach\n\n## What it took\n\n## Results\n\n## Lessons learned\n\n## How to reuse this\n"
    }
  ]
};

/** Parsed _data/navigation.yml. */
export const NAVIGATION = [
  {
    "label": "Home",
    "url": "/"
  },
  {
    "label": "Use cases",
    "url": "/catalog/",
    "module": "catalog"
  },
  {
    "label": "Events",
    "url": "/events/",
    "module": "events"
  },
  {
    "label": "Cohorts",
    "url": "/cohorts/",
    "module": "cohorts"
  },
  {
    "label": "Resources",
    "url": "/resources/",
    "module": "resources"
  },
  {
    "label": "About",
    "url": "/about/"
  },
  {
    "label": "Governance",
    "url": "/governance/",
    "module": "governance"
  },
  {
    "label": "Submit",
    "url": "/submit/",
    "module": "submit",
    "style": "button"
  }
];

/** Verbatim _config.yml; the wizard patches title/description/url/baseurl into it. */
export const JEKYLL_CONFIG = "# Jekyll configuration.\n# Most site-specific settings live in _data/site.yml (branding, modules, labels),\n# _data/theme.yml (colors, fonts) and _data/schema.yml (the entry content model).\n# Keep this file to build mechanics. `title`/`description` here are fallbacks for\n# SEO tags; the setup wizard keeps them in sync with _data/site.yml.\n\ntitle: \"Public Health Digital Use Case Catalog\"\ndescription: \"A shared catalog of digital tools, data projects and AI work from Big Cities Health Coalition member health departments, so each city can reuse what another has already built.\"\nurl: \"\"\nbaseurl: \"\"\ntheme: null\ntimezone: \"America/Chicago\"\nmarkdown: kramdown\npermalink: pretty\nfuture: false\n\nexclude:\n  - node_modules\n  - vendor\n  - README.md\n  - ARCHITECTURE.md\n  - CONTRIBUTING.md\n  - CODE_OF_CONDUCT.md\n  - CHANGELOG.md\n  - SECURITY.md\n  - CLAUDE.md\n  - AGENTS.md\n  - LICENSE\n  - package-lock.json\n  - package.json\n  - tailwind.config.js\n  - postcss.config.js\n  - eslint.config.js\n  - quality\n  - assets/css/tailwind.css\n  - scripts\n  - test\n  - docs\n  - Gemfile\n  - Gemfile.lock\n  - .ruby-version\n\n# If you change entry.path in _data/schema.yml, change the first scope's path\n# here to match — this is what gives every entry the `entry` layout.\ndefaults:\n  - scope:\n      path: \"catalog\"\n    values:\n      layout: entry\n  - scope:\n      path: \"cohorts\"\n    values:\n      layout: cohort\n\nplugins:\n  - jekyll-seo-tag\n  - jekyll-sitemap\n  - jekyll-include-cache\n\nsass:\n  style: compressed\n";

/** The build-mechanics values _config.yml ships with. */
export const JEKYLL_DEFAULTS = {
  "title": "Public Health Digital Use Case Catalog",
  "description": "A shared catalog of digital tools, data projects and AI work from Big Cities Health Coalition member health departments, so each city can reuse what another has already built.",
  "url": "",
  "baseurl": "",
  "timezone": "America/Chicago"
};

/** Icon names available to `icon` hints, read from _includes/icon.html. */
export const ICON_NAMES = [
  "academic-cap",
  "adjustments",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "bolt",
  "book-open",
  "building",
  "calendar",
  "chart-bar",
  "chat",
  "check",
  "check-circle",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "clock",
  "close",
  "cloud",
  "code",
  "copy",
  "cpu",
  "credit-card",
  "database",
  "document",
  "download",
  "edit",
  "expand",
  "external-link",
  "eye",
  "eye-off",
  "filter",
  "flag",
  "globe",
  "grid",
  "home",
  "image",
  "info",
  "language",
  "layers",
  "link",
  "list",
  "location-pin",
  "lock",
  "mail",
  "menu",
  "microphone",
  "minus",
  "plus",
  "presentation",
  "rocket",
  "rss",
  "search",
  "server",
  "share",
  "shield",
  "shield-check",
  "sparkles",
  "star",
  "tag",
  "terminal",
  "trending-down",
  "trending-up",
  "user",
  "users",
  "wand",
  "warning",
  "wrench",
  "zoom-in"
];

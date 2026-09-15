# MantraCare Scan Prompt (Claude-for-Chrome)

Tailored from the Tealfeed scanning prompt (`docs/Tealfeed/04_Chrome_Agent_Prompt.md`).
**Everything the Tealfeed prompt captured is preserved** — the 7 phases, all output
schemas, the safety constraints, the design audit. What's **added** for MantraCare:
a public product & content surface pass (Phase 8), because MantraCare's crown jewels
(assessment tests, condition programs, provider directory, pricing, corporate/EAP)
are mostly public, whereas Tealfeed was a private admin CRM.

## How to use

1. Open `https://www.mantracare.com` in Chrome.
   - If you have any account (client / therapist / corporate-HR), log in first so the
     agent inherits the session and can reach dashboards. If you don't, that's fine —
     most of MantraCare is public and the scan still works anonymously.
2. In a separate tab, open Claude for Chrome.
3. Paste the prompt block below.
4. Answer its startup questions (what you're logged in as, if anything).
5. Let it run Phase 1 (reconnaissance), review, then approve Phase 2 section-by-section.
   Do **not** try to do the whole site in one session — output will be long.
6. Copy each schema section into your workbook as it completes.

### Safety reality check before you start

- This is a competitor site you likely do **not** own. The prompt forbids creating
  accounts, submitting forms, booking sessions, or making payments. It reads and
  screenshots only.
- If you *are* logged into a real account, real data (yours or, for a corporate HR
  account, employees') may render. The prompt redacts all PII/PHI — describe field
  presence and type, never contents.
- Respect the site: no rapid-fire crawling, no download of bulk assets, no login
  attempts the agent makes on its own. Treat it like a shadowing intern, not autopilot.

---

## THE PROMPT — copy everything between the fences

```
# ROLE
You are a senior product researcher. Your job is to systematically scan the website
MantraCare (https://www.mantracare.com) and produce a structured inventory of
everything it contains — its public product surface AND any logged-in dashboards I
can reach. The output will be pasted into a pre-built planning workbook, so it must
match the schemas specified below EXACTLY.

# WHAT I AM BUILDING (CONTEXT)
I run a mental-health group practice of psychiatrists and psychologists (Saday
Wellness). I am designing our own patient platform + clinical CRM by studying existing
systems, keeping what works, discarding what doesn't, and adding differentiators.
MantraCare is one of the systems I am studying. I have already scanned a private
practitioner CRM (Tealfeed); MantraCare is different — it is a large patient-facing
therapy/wellness brand with a lot of PUBLIC surface (free assessment tests, condition
programs, a provider directory, pricing, and a corporate/EAP offering) plus, possibly,
logged-in client / therapist / corporate-HR dashboards. Capture BOTH surfaces.

# CRITICAL SAFETY CONSTRAINTS — REREAD BEFORE EVERY ACTION
You must obey every one of these. If an action would violate any rule, STOP and ask me.

1. NEVER click any control whose effect is destructive, irreversible, transactional,
   or external-facing. This includes but is not limited to: Sign up / Create account,
   Log in (I will log in myself), Book / Schedule / Confirm appointment, Start session,
   Pay / Subscribe / Checkout / Apply coupon, Submit (any form, including free
   assessment tests and contact/lead forms), Send, Post, Delete, Archive, Deactivate,
   Cancel, Export, Import, Invite, Refund.
2. NEVER create an account and NEVER attempt to log in. If I am already logged in, use
   that session; if I am not, scan anonymously and note what is gated behind login.
3. To see a form's fields (assessment test, intake, booking, lead-capture), OPEN it and
   record the fields, but do NOT submit it. Navigate away or Cancel without saving.
4. If any screen shows content that appears to be real personal or health data (a
   plausible name + contact + clinical/assessment detail), STOP and ask me whether this
   account is mine/test or contains other people's data. In your output, REDACT any
   person's name, DOB, phone, email, address, government ID, insurance ID, employer,
   payment detail, or clinical/assessment answer using [REDACTED]. Describe field
   PRESENCE and TYPE, never the contents.
5. Do not install extensions, change browser settings, log me out, or switch accounts.
6. Do not navigate to sites other than mantracare.com and its own subdomains / linked
   MantraCare-network brands without telling me first and getting a yes.
7. Take screenshots liberally. Do NOT download files or bulk-save assets.
8. Go at a human pace. Do not hammer the site with rapid successive requests.
9. If you hit a paywall, login wall, CAPTCHA, or bot-check: STOP, screenshot it, note
   it as "gated", and ask me — never attempt to bypass or solve it.

# STARTUP
When you see this prompt, respond with:
(a) A one-line restatement of the task.
(b) The safety constraints above, in your own words.
(c) These four questions:
   1. Am I logged into MantraCare right now, and as what? (not logged in / client /
      therapist-provider / corporate-HR / admin / other)
   2. If logged in: is this MY/test account, or could it contain other people's data?
   3. Which surface should I prioritize — the PUBLIC product/content surface, the
      logged-in dashboard(s), or both (and in what order)?
   4. Should I begin Phase 1 now, or wait?

Wait for my replies before acting.

# PHASED PROCEDURE
Complete the phases in order. Do not interleave. After each phase, pause and give me a
short status report with counts and blocking questions before continuing.

## Phase 1 — Reconnaissance (target: 30 minutes)
Goal: a top-level map. Do NOT go deep.
1. Confirm the brand, any visible product/version, and the top-level information
   architecture of the PUBLIC site: main nav, mega-menu contents, and the footer
   sitemap (footers on sites like this expose the fullest link list — enumerate it).
2. Identify the distinct PRODUCT LINES / offerings (e.g. individual therapy,
   couples/relationship, condition-specific programs, corporate/EAP, coaching,
   physical-health programs, self-help tools/tests). One line each.
3. Identify any sub-brands or network sites MantraCare links to (it often operates a
   family of sites). List them; do not visit yet.
4. Detect whether there is a login / member area / dashboard, and what roles it implies
   (client, therapist, corporate HR, admin). Note what is gated.
5. Output the Phase 1 artifact using the Sitemap schema below.
6. STOP and ask me which sections to prioritize in Phase 2.

## Phase 2 — Deep capture (run once per section I approve)
Goal: a complete screen-by-screen inventory of the section (public page-type or
logged-in module), with fields, actions, and features.
For each screen / page-type:
1. Navigate to it. 2. Take a screenshot.
3. Open (but do not submit) any Create / New / Edit / Book / Test / Enroll / Contact
   form to reveal the full field set. Cancel or navigate away to exit.
4. Record the screen using the Screen schema.
5. Record features present using the Features schema.
6. Record visible data fields using the Data-fields schema. Flag PII/PHI explicitly.
7. Record any third-party system referenced (payment, calendar/scheduling, video/
   teletherapy, chat, SMS/WhatsApp, email, analytics, CRM, LMS) using the Integration
   schema.
8. For list/directory screens (e.g. therapist directory, program catalog, blog index),
   note filters, sort options, search facets, pagination, and any exports.
9. Check for a Settings / Account / Preferences area within any logged-in section;
   templates, notifications, and automations often live there.

## Phase 3 — Flows (after Phase 2 covers the core sections)
Goal: capture multi-step journeys as sequences of actor actions and system responses.
OBSERVE only — do NOT submit, book, pay, or send. Walk each flow to the last step
BEFORE the irreversible action, screenshot it, then stop. Produce a Flow schema each.
- F1  Take a free self-assessment test (open it, capture EVERY question, answer options,
      and scoring/result screen structure — walk to the point of "submit"; DO NOT
      submit; if a result requires submit, note that and stop).
- F2  Find-a-therapist / matching (filters → results → a provider profile → the point
      of "book"; do NOT book).
- F3  Booking / scheduling a session (walk the calendar/slot UI to checkout; do NOT
      confirm or pay).
- F4  Program / plan enrollment (condition program or subscription — walk to checkout;
      do NOT pay).
- F5  Pricing → checkout (capture every plan, price, billing period, what's included;
      walk to the payment step; do NOT pay).
- F6  Corporate / EAP enquiry (the B2B "for employers" journey and any HR-facing demo
      or dashboard; lead form fields only, do NOT submit).
- F7  Teletherapy / video session launch (dry-run the join UI if reachable; do NOT
      start a live session).
- F8  Client dashboard tour (if logged in as a client — home, upcoming sessions,
      messages, worksheets/homework, progress; read-only).
- F9  Therapist/provider dashboard tour (if logged in as a provider — caseload,
      calendar, notes, earnings; read-only, do NOT sign or submit notes).
- F10 Content / resource journey (blog or tool hub → an article/tool → related links
      and internal CTAs — capture how content routes users to products).
- F11 Onboarding / intake (if a new-client questionnaire exists, walk it and capture the
      question set; do NOT submit).
- F12 Support / contact / chat (how users reach help; chatbot vs human; fields only).

## Phase 4 — Permissions / gating matrix
For each role I can reach (including "anonymous public"), note what differs:
- Nav / sections visible vs hidden or gated behind login/paywall
- Data that is masked or restricted
- Default landing screen per role
- Actions available vs greyed/absent
- Any role-specific workflows (therapist co-sign, HR aggregate-only views)
Output using the Permissions schema. (If I only have one role, still capture
"anonymous public vs logged-in" as the two columns.)

## Phase 5 — Data-model extraction
Visit every screen that exposes structured data: assessment result pages, provider
profiles, program/plan detail, dashboards, reports/analytics, account settings, any
API docs or JSON the page loads. Build a catalog of entities and fields.
Output using the Data-model schema.

## Phase 6 — Integrations & tech inventory
List third-party services referenced anywhere: payment gateway(s), scheduling, video,
chat/messaging, SMS/WhatsApp, email/marketing, analytics/trackers, CRM, LMS/course,
review widgets, cookie/consent tool. Note where each was observed.
Output using the Integration schema.

## Phase 7 — Security, privacy & compliance surface
Locate and screenshot (do not modify) whatever exists:
- Login security: MFA/2FA option, session timeout, password policy, SSO
- Privacy policy, terms, and any data-retention / deletion statements
- Consent capture (checkboxes at signup/intake/tests), cookie/consent banner behaviour
- Stated compliance / certifications (HIPAA, ISO 27001, SOC 2, GDPR, India's DPDP,
  Mental Healthcare Act references)
- Data-subject-request / "delete my data" / right-of-access workflow
- How sensitive assessment data is described as stored / shared
- For corporate/EAP: whether employer sees individual vs aggregate-only data
Output using the Compliance schema.

## Phase 8 — Public product & content surface  (NEW — MantraCare-specific)
This is what makes MantraCare different from a private CRM. Capture its public assets.
1. PROGRAM / SERVICE CATALOG — every condition program and service line, with what it
   claims to treat, format (self-serve / coached / live therapy), and price if shown.
   Output using the Program-catalog schema.
2. ASSESSMENT / TEST CATALOG — every free test/quiz/screener offered. For each, capture
   the name, what it screens for, whether it maps to a known instrument (PHQ-9, GAD-7,
   etc.), number of questions, the full question + option set (walk F1's approach),
   how results are presented, and what it upsells to.
   Output using the Assessment-catalog schema.
3. PRICING / PLANS — every plan, price, currency, billing period, session counts, and
   inclusions/exclusions. Output using the Pricing schema.
4. PROVIDER DIRECTORY — the therapist/coach listing: what fields a profile shows
   (specialties, languages, experience, credentials, price, availability, ratings),
   and the directory's filters/facets. Fields and structure only — REDACT names.
   Output using the Data-fields schema (Entity = Provider).
5. CONTENT TAXONOMY & SEO — the blog/resource/tool architecture: top categories, content
   types (articles, tools, tests, videos), how content links into products, and any
   visible SEO signals (title patterns, breadcrumb structure, internal-link CTAs).
   Output using the Content-taxonomy schema.

## DESIGN AUDIT (cross-cutting — do this while capturing each screen in Phase 2/8)
For a representative screen of each distinct page-type / template, record its visual
system so the set can be compared. Output using the Design-audit schema.

# OUTPUT SCHEMAS (MATCH EXACTLY)
Use the exact headings below. Markdown tables. One table per section. Emit headings even
if empty.

## Sitemap
| # | Section / product line | Submenu | Screen / page-type | Public or gated | Purpose (1 line) | Screenshot ref |

## Screen
### [Screen name]
- **Site**: MantraCare
- **Path**: Section > Submenu > Screen (URL)
- **Public or gated**: public / login / paywall
- **Primary purpose**: 1 sentence
- **Key UI elements**: tabs, panels, modals, drawers, tables, cards
- **Data shown**: visible data categories (NOT values — REDACT any PII/PHI)
- **Actions available**: every button / link visible in the current state
- **Notes / pain points**: UX friction, missing info, oddities
- **Role/gating differences observed**: if any
- **Screenshot ref**: filename or session screenshot id

## Features
| Section | Feature | Sub-capability | Present? (Yes/Partial/Unknown) | Quality (1-5) | Notes |
Quality rubric: 5=best-in-class, 4=good, 3=works but would redesign, 2=frustrating, 1=unusable.

## Data-fields
| Entity | Field | Type (guess) | Required? | Enum values | PII/PHI? | Source screen | Notes |
Types: string, text, int, decimal, date, datetime, bool, enum, json, relation, file.

## Flow
### [Flow name]
| # | Actor role | Action | System response | Screen (URL) | Observations / pain points |
Also note any info the user must provide that they wouldn't naturally have at that moment.

## Permissions
| Capability | Anonymous | Client | Therapist/Provider | Corporate-HR | Admin | Notes |
Values: Full / Read / Own-only / Gated / No / (blank)=unknown.

## Integration
| Category | Function | Vendor (if visible) | Direction (in/out/both) | Where observed | Notes |

## Compliance
| Area | Setting / requirement | Present? | Where it lives | Configuration observed | Notes |

## Data-model
| Entity | Field | Type | Required | Enum | PII/PHI | Source (screen / report / JSON) | Notes |

## Program-catalog
| Program / service | Treats / for | Format (self / coached / live) | Duration | Price (if shown) | Upsell path | Source URL |

## Assessment-catalog
| Test name | Screens for | Maps to instrument? | # questions | Result format | Requires login? | Upsell after result | Source URL |

## Pricing
| Plan | Price | Currency | Billing period | Sessions / quota | Includes | Excludes | Source URL |

## Content-taxonomy
| Category | Content type | Example titles (structure, not full copy) | Links into which product | SEO signal noted | Source URL |

## Design-audit
### [Page-type / template name]
- **Colors**: role → hex → usage (Text / Background / Accent / Border)
- **Typography**: font families, heading vs body sizes/weights
- **Buttons**: variants seen (primary/outline/text/link) and their styling
- **Layout**: grid, spacing rhythm, container widths, header/footer pattern
- **Components**: cards, tabs, accordions, carousels, modals, forms
- **Accessibility signals**: inputs missing labels, images missing alt, obvious
  contrast issues, focus states
- **Screenshot ref**

# HOW TO HANDLE EDGE CASES
- Unclear button effect → ASK before clicking.
- Real personal/health data visible and account not confirmed as mine/test → STOP, ask.
- Login wall / paywall / CAPTCHA / bot-check → screenshot, mark "gated", ask — never bypass.
- Slow or failing page → skip, note in the Screen entry, continue.
- Modal you can't dismiss without an action you're unsure about → screenshot + ask.
- A "submit" is the only way to see the next screen (e.g. test results) → STOP at submit,
  note it, do not submit.
- Running long in a section (>~25 screens) → pause and summarize what remains.

# PROGRESS REPORTING
After every section (Phase 2/8) or flow (Phase 3), post a short status block:
- Section / flow: [name]
- Screens captured: [count]
- Features identified: [count]
- Integrations noted: [count]
- Blocking questions: [list or "none"]

# END-OF-SESSION DELIVERABLE
When I say "wrap up", produce:
1. A summary count (sections, screens, features, integrations, fields, flows, programs,
   assessments, plans).
2. A "what I could not reach" list (gated by login, by paywall, by unknown effect).
3. A recommended next-session agenda (which surface/role next, which sections remain).

# REMEMBER
- Safety first. When in doubt, ASK. Never create an account, submit, book, or pay.
- Schema compliance second. My workbook depends on it.
- Completeness third. Missing rows are easier to add than misreported ones.
- Redact all PII/PHI. Describe structure, never content.
```

---

## What changed vs. the Tealfeed prompt (so you can see nothing was lost)

**Kept identical in spirit:** the 7-phase structure, all core schemas (Sitemap, Screen,
Features, Data-fields, Flow, Permissions, Integration, Compliance, Data-model), the
"senior product researcher" role, the safety-first + PHI-redaction discipline, the
startup questions, edge-case handling, progress reporting, and the end-of-session
deliverable.

**Adapted for MantraCare:**
- Context now describes a **patient-facing therapy/wellness brand**, not a private CRM.
- Safety adds: **no account creation, no login attempts, no form submits (incl. tests),
  no booking/payment, no CAPTCHA-solving** — because it's a competitor site you don't own.
- Phase 3 **flows** are rewritten to MantraCare's journeys (assessment test, find-a-
  therapist, booking, enrollment, pricing→checkout, corporate/EAP, teletherapy, client &
  provider dashboards, content-to-product, intake, support).
- Phase 7 compliance is **retargeted** from clinical-EHR specifics (EPCS, 42 CFR Part 2)
  to what a therapy platform exposes (privacy/consent, DPDP/HIPAA/ISO claims, DSR, and
  the corporate individual-vs-aggregate question).

**Added (new, MantraCare needs it, Tealfeed didn't have it):**
- **Phase 8 — public product & content surface**, plus four new schemas: **Program-catalog,
  Assessment-catalog, Pricing, Content-taxonomy** — to capture the public assets that are
  MantraCare's actual value.
- **Design-audit** promoted to an explicit schema (it was a bonus in the Tealfeed output),
  so you get the color/typography/component/a11y capture per template.

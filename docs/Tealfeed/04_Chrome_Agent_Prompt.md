# Claude-for-Chrome Scanning Prompt

Paste the block below into Claude for Chrome at the start of a fresh session. Run it once per CRM (i.e., two times total). Before you paste, log in to the CRM in the same browser window so Claude inherits your session.

## How to use

1. Open the CRM in Chrome and log in as admin.
2. In a separate tab, open Claude for Chrome.
3. Paste the prompt below into Claude for Chrome.
4. When it asks clarifying questions, answer them (which product, test tenant vs prod, what role you're logged in as).
5. Let it run Phase 1 (reconnaissance). Review the output.
6. Tell it which role/module to deep-scan next. Run Phase 2 module-by-module — don't try to do the whole CRM in one session. Output will be long.
7. Copy each section of its output into the matching sheet in `02_Capture_Workbook.xlsx`.
8. When CRM A is done, start a fresh Chrome tab and repeat for CRM B.

### Safety reality check before you start

- If your CRM contains real patient data, the prompt tells Claude to redact identifiers — but the safest option is to create a test tenant or a dummy-data sandbox. Every major mental-health EHR offers this.
- Claude may still render real PHI on-screen during scanning; close any session reports shared publicly. Do not share screen recordings of the scan unless they are scrubbed.
- Computer-use / browsing agents occasionally misfire. The prompt below blocks destructive actions, but treat Claude like a shadowing intern, not an autopilot. Watch the session.

---

## THE PROMPT — copy everything between the fences

```
# ROLE
You are a senior product researcher. Your job is to systematically scan a web-based CRM that the operator (me) is already logged into, and produce a structured inventory of everything it contains. The output will be pasted into a pre-built planning workbook, so it must match the schemas specified below EXACTLY.

# WHAT I AM BUILDING (CONTEXT)
I run a mental-health group practice of psychiatrists and psychologists. I am replicating a CRM by studying two existing systems, keeping what works, discarding what doesn't, and adding differentiators. You are helping me scan ONE of those two CRMs in this session. I will tell you which.

# CRITICAL SAFETY CONSTRAINTS — REREAD BEFORE EVERY ACTION
You must obey every one of these. If an action would violate any rule, STOP and ask me.

1. NEVER click any control whose effect is destructive, irreversible, or external-facing. This includes but is not limited to: Send, Submit, Sign (note), Lock, Post (charge/claim), Prescribe, Transmit, Fax, Email, SMS, Confirm payment, Refund, Delete, Archive, Deactivate, Release records, Generate superbill, Book appointment (on real calendar), Cancel appointment, Merge patients, Import, Export, Bulk-update.
2. For any button whose effect you cannot predict with certainty, ASK me before clicking. It is always better to ask than to act.
3. NEVER modify, create, or delete records containing real patient data. If you must interact with a form to see its fields, CANCEL or close the form without saving.
4. If any screen shows content that appears to be real PHI (a plausible name + DOB + clinical detail) and I have not confirmed I am in a test tenant, STOP and ask me whether this is test or production data. When you record findings in your output, REDACT any patient name, DOB, phone, email, address, SSN, insurance ID, or clinical content using [REDACTED]. Describe field PRESENCE and TYPE, never the contents.
5. Do not install extensions, change browser settings, log out, or sign me into a different account.
6. Do not navigate to external sites (other than the CRM being scanned) without my permission.
7. Take screenshots liberally. Do not download files.
8. If you encounter a modal you cannot dismiss without taking an action you are unsure about, screenshot it and ask me.

# STARTUP
When you see this prompt, respond with:
(a) A one-line restatement of the task.
(b) A list of the safety constraints you just read, in your own words.
(c) These four questions:
   1. Which CRM am I scanning in this session? (name / URL root)
   2. Am I currently in a TEST tenant or PRODUCTION? (Do not proceed with production until I confirm there is no real PHI in the tenant.)
   3. Which role am I currently logged in as? (psychiatrist / psychologist / admin / front desk / billing / other)
   4. Should I begin Phase 1 now, or wait?

Wait for my replies before acting.

# PHASED PROCEDURE
Complete the phases in order. Do not interleave. After each phase, pause and give me a short status report with counts and a list of blocking questions (if any) before continuing.

## Phase 1 — Reconnaissance (target: 30 minutes)
Goal: produce a top-level map. Do NOT go deep.
1. Confirm the product name and version visible in the UI.
2. Enumerate the top-level navigation. Click each top-nav item and open every dropdown WITHOUT going further.
3. Enumerate the user-role list. Navigate to Settings > Users / Admin > Roles / equivalent. List every role with a one-line description.
4. Enumerate any "admin" or "configuration" section at a high level only.
5. Output the Phase 1 artifact using the Sitemap schema below.
6. STOP and ask me which modules to prioritize in Phase 2, and which role to scan as first.

## Phase 2 — Deep capture (run once per module I approve)
Goal: a complete screen-by-screen inventory of the module, with fields, actions, and features.
For each screen in the module:
1. Navigate to the screen.
2. Take a screenshot.
3. Click into (but do not submit) any Create / New / Edit / Add form to reveal the full field set. Use Cancel to exit.
4. Record the screen using the Screen schema below.
5. Record features present using the Features schema.
6. Record visible data fields using the Data-fields schema. Flag PHI/PII explicitly.
7. Record any third-party system referenced (e-prescribe, labs, clearinghouse, telehealth, SMS, payment, calendar) using the Integration schema.
8. For list screens, note filters, sort options, bulk actions, and exports.
9. Check for a Settings / Configure / Preferences area within the module; templates, alerts, and automations often live there.

## Phase 3 — Flows (after Phase 2 is complete for at least the core modules)
Goal: capture multi-step workflows as sequences of actor actions and system responses. OBSERVE only — do not submit.
Walk each of these flows. For each, produce a Flow schema output.
- F1 New patient intake (front-desk creates patient → assigns insurance → sends intake packet)
- F2 Appointment booking + reminder generation (do not actually send)
- F3 Progress-note creation (open a note on a test patient, explore the template, DO NOT sign)
- F4 Medication order — non-controlled (walk through the e-Rx UI, DO NOT transmit)
- F5 Medication order — controlled / EPCS (walk through, DO NOT transmit)
- F6 Assessment delivery (PHQ-9 / GAD-7 / similar — walk through send flow, DO NOT send)
- F7 Claim creation (walk to the point of scrub/submit, DO NOT submit)
- F8 Patient-portal tour (if a separate patient view exists, open it read-only)
- F9 Release of records / ROI
- F10 Suicide-risk / safety-plan workflow (if present at all)
- F11 Telehealth launch (dry-run — do not actually start a session)
- F12 Internal messaging / staff inbox

## Phase 4 — Permissions matrix (requires me to switch users)
For each role I can log into, note what differs from the admin view:
- Top-nav items visible / hidden
- Data that is masked or restricted
- Default landing screen
- Buttons that are greyed out or missing
- Any role-specific workflows (co-sign, supervisor review)
Output using the Permissions schema.

## Phase 5 — Data-model extraction
Visit every screen that exposes structured data: reports, analytics, export/download, admin-field-configuration, API docs, schema browser. Build a catalog of entities and fields.
Output using the Data-model schema.

## Phase 6 — Integrations inventory
Navigate to Settings > Integrations / Marketplace / Apps. List each integration (enabled or available).
Output using the Integration schema.

## Phase 7 — Security & compliance surface
Locate and screenshot (do not modify) the following if they exist:
- MFA / 2FA settings
- Session timeout / auto-logoff policy
- Password policy
- SSO / SAML / OIDC config
- Audit log / access log screen (filter by a test user; do not export)
- Encryption disclosures
- Data retention / deletion policy
- BAA list / subprocessor list
- 42 CFR Part 2 / SUD record handling toggle
- EPCS identity-proofing screen
- HIPAA right-of-access workflow
Output using the Compliance schema.

# OUTPUT SCHEMAS (MATCH EXACTLY)
Use the exact headings below so I can paste directly into the spreadsheet. Use Markdown tables. One table per section. Emit the headings even if empty.

## Sitemap
| # | Top nav / module | Submenu | Screen / page | Available to roles | Purpose (1 line) | Screenshot ref |

## Screen
### [Screen name]
- **CRM**: [A or B — from my answer to startup question 1]
- **Path**: Module > Submenu > Screen
- **Primary purpose**: 1 sentence
- **Key UI elements**: tabs, panels, modals, side drawers, tables
- **Data shown**: list the visible data categories (NOT the values — REDACT any PHI)
- **Actions available**: every button / link visible to the current role
- **Notes / pain points**: observations about UX friction, missing info, oddities
- **Role visibility differences observed**: if any
- **Screenshot ref**: filename or session screenshot id

## Features
| Module | Feature | Sub-capability | Present? (Yes/Partial/Unknown) | Quality (1-5) | Notes |

Quality rubric: 5=best-in-class, 4=good, 3=works but would redesign, 2=frustrating, 1=unusable.

## Data-fields
| Entity | Field | Type (guess) | Required? | Enum values | PHI? | Source screen | Notes |

Types: string, text, int, decimal, date, datetime, bool, enum, json, relation, file.

## Flow
### [Flow name]
| # | Actor role | Action | System response | Screen | Observations / pain points |

Also note any information the clinician must provide that they wouldn't naturally have at that moment.

## Permissions
| Capability | Psychiatrist | Psychologist | Therapist | Front desk | Billing | Admin | Notes |

Values: Full / Read / Own-only / No / (blank) = unknown.

## Integration
| Category | Function | Vendor (if visible) | Direction (in/out/both) | Protocol | BAA required? | Notes |

## Compliance
| Area | Setting / requirement | Present? | Where it lives | Configuration observed | Notes |

## Data-model
| Entity | Field | Type | Required | Enum | PHI | Source (screen / report / export) | Notes |

# HOW TO HANDLE EDGE CASES
- Unclear button effect → ASK before clicking.
- Real PHI visible and tenant not confirmed as test → STOP immediately, ask me.
- Slow or failing screen → skip, note in the Screen entry, continue.
- Modal you can't dismiss safely → screenshot + ask.
- Logged out unexpectedly → stop. Ask me to re-authenticate. Do not attempt to log in yourself.
- You're running long in a module (more than ~25 screens) → pause and summarize what remains so I can decide whether to split into a fresh session.

# PROGRESS REPORTING
After every module (Phase 2) or flow (Phase 3), post a short status block:
- Module / flow: [name]
- Screens captured: [count]
- Features identified: [count]
- Integrations noted: [count]
- Blocking questions: [list or "none"]

# END-OF-SESSION DELIVERABLE
When I say "wrap up", produce:
1. A summary count (modules, screens, features, integrations, fields, flows).
2. A "what I could not reach" list (screens blocked by role, by data, by unknown button effect).
3. A recommended next-session agenda (which role to log in as next, which modules to tackle).

# REMEMBER
- Safety first. When in doubt, ASK.
- Schema compliance second. My workbook depends on it.
- Completeness third. Missing rows are easier to add than misreported ones.
- Redact all PHI. Describe structure, never content.
```

---

## Adapting the prompt

- **Short session vs long session**: Claude for Chrome context is limited. If the CRM is large, run Phase 1 in one session, save output, then run Phase 2 module-by-module in separate sessions. Paste a trimmed version of the prompt each time (just the Role, Safety, and the specific module instruction).
- **If no test tenant is available**: answer "production" to question 2. The prompt's PHI redaction rules will kick in. Do not run Phase 3 flows on real patients — create a single dummy patient first and tell Claude to use that patient ID exclusively.
- **If the CRM blocks the agent** (some single-page apps confuse browsing agents): fall back to screenshotting yourself and pasting the screenshots to regular Claude using the same output schemas from this prompt. The schemas are the real deliverable.

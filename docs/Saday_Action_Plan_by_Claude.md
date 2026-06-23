# Saday Wellness — Action Plan (by Claude)

> **File:** `docs/Saday_Action_Plan_by_Claude.md`
> **Version:** 1.0 · Compiled 2026-04-21
> **Companion to:** `docs/Saday_Master_Blueprint.html` v1.1 (strategy/architecture — this file = execution)
> **Horizon:** 24 weeks · Phase 0 (W1) → Public Launch (W24)
> **Audience:** CTO/Dev (same person), Designer, MHPs · Co-founder reads Monday review
> **Inputs merged:** SwasthMind CRM scan (clinical CRM reference) + Tealfeed admin scan (booking/payments reference)

---

## 0 · How to use this document

1. **Monday, 30 min — Week kickoff.** Read the week's row. Copy that week's day list into your local calendar / todo. Open the blueprint section it links to (`→ BP §N`) once; it's the *why*.
2. **Daily — 5 min standup against this plan.** Not what you did yesterday. What does today's row say + what's blocking you?
3. **Friday, 30 min — Week close.** Walk the DoD checklist for the week. Anything red stays on the risk watchlist. Anything green gets a git tag.
4. **Whenever you are tempted by a feature not in this doc:** read the §2A Tealfeed adoption pills in the blueprint. If it's not V1-green there, it's V1.5+. Close the tab.
5. **This file is a plan, not a contract.** When reality drifts, update the row — don't write around it. Dates shift in writing or they shift in pain.

### Roles (abbrev used below)

| Code | Who |
|------|-----|
| **CTO** | You (psychiatrist-CTO, also the developer, architecture owner, clinical lead) |
| **CF** | Clinical Psychologist co-founder |
| **DES** | Amateur designer (UI/UX; mobile + WCAG AA is the job) |
| **MHP** | 2–3 already-enrolled mental-health professionals |
| **JC** | Junior counsellor (hired before W11 — §18 in blueprint) |
| **ML** | One-time medico-legal consultant (W13) |
| **AI** | Claude (dev assist, doc drafts, scoring functions, prompts referenced in §15 of blueprint) |

### Severity / status legend

- 🔴 **P0** = safety or compliance critical — never ships broken
- 🟠 **P1** = MVP-critical — V1 is wrong without it
- 🔵 **P2** = polish / V1.5 candidate — may slip, document when it does
- ✅ **Done** = shipped to `main`, test passes, blueprint DoD met
- 🟡 **WIP** = this week
- ⚪ **Planned** = not started

### Weekly ritual (every week, non-negotiable)

| Day | Ritual | Duration |
|-----|--------|----------|
| Mon | Week kickoff: read this week's row + blueprint link | 30 min |
| Tue–Thu | Daily 5-min solo standup against plan | 5 min |
| Wed | MHP pulse-check message ("anything friction-y?") | 10 min |
| Fri | Week close: DoD checklist, risk review, git tag | 30 min |
| Sun | One-hour block: next-week prep, artifact review, AI-tool-call log scan | 60 min |

---

## 1 · Phase map

| Phase | Weeks | Theme | Exit criterion |
|-------|-------|-------|----------------|
| **0** | W1 | Foundation docs, no code | 6 specs + seed JSON in `docs/` ; WhatsApp templates submitted |
| **1** | W2 | Intake prototype (client-only HTML) | Working 7-screen prototype on localhost, JSON export valid |
| **1.5** | W3 | Real-user test of intake (n=5) | Written learnings memo; intake spec updated |
| **2** | W4–W10 | Backend MVP | Patient can book → pay → video-consult → MHP can note → patient can see summary |
| **3** | W11–W14 | Closed beta (10–15 patients) | Medico-legal sign-off; incident-free week; baseline metrics captured |
| **4** | W15–W24 | Launch prep + public launch | Public launch W24 |

---

## 2 · PHASE 0 — Foundation docs (Week 1)

**Goal:** every downstream code decision has a document to point at. No code this week.
**Milestone:** 6 specs committed to `docs/`; WhatsApp templates submitted to Meta; 5 testers scheduled.
**Blueprint refs:** §5 intake, §6 tools, §7 routing, §11 data model, §12 CTO non-negotiables, §20 next actions.

### Day-level tasks

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| **Mon** | 🔴 Write `docs/architecture.md` — auth middleware, error shape, DB tx rules, PHI redaction, naming. This doc gets cited in every AI prompt. (→ BP §12) | Set up Figma workspace; import Saday color tokens (see BP §13 stack: teal/green/amber/orange/red track palette). | CF: read blueprint §2, §2A, §2B. Note disagreements. |
| **Tue** | 🔴 Draft `docs/intake-spec.md` — state machine, 7 screens, cluster routing config, exit rules, safety thresholds. (→ BP §5, §7) | Sketch mobile intake screens 0–6 (low-fi); focus on text hierarchy, not visual polish yet. | MHPs: read blueprint §4 (care tracks). Each writes 3 lines: *"A patient I'd send to Track X is…"*. |
| **Wed** | 🔴 Draft `docs/data-model.md` — Postgres DDL for V1 entities (21 from BP §11). Include `assessment_tool_versions`, `earnings_ledger`, `deductions`, `payouts` (Tealfeed-derived). | Color-palette lockdown; WCAG AA contrast check on every pair; export as design tokens JSON. | CF: review intake-spec draft, mark any clinical language that sounds like a form, not a conversation. |
| **Thu** | 🟠 Seed `docs/tool-library.json` — 12 V1 tools × EN + HI (PHQ-9, GAD-7, MDQ, ASRS-v1.1, AUDIT-C, PCL-5, OCI-R, MSI-BPD, SCOFF, PSS-10, ISI, C-SSRS). Each item = `{id, name_en, name_hi, items:[], scoring, cutoffs, version}`. (→ BP §6) | Build a micro-styleguide page: buttons, inputs (labelled!), form spacing, error state. This doc is what we guard against Tealfeed's 102-unlabeled-input failure mode. (→ BP R-16) | MHPs: identify which of the 12 V1 tools they are comfortable interpreting; flag any needing training. |
| **Fri** | 🟠 Draft + submit 4 WhatsApp templates to MSG91/Meta: booking-confirmation, reminder-24h, post-session-check-in, safety-net. (→ BP §20 item 5) 24h clock starts. | First accessibility audit of the styleguide: axe-core + contrast ratio on every component. Fix before merge. | CF: identify 5 real testers (demographic: 25–40, Tier 2/3 city, Hindi-comfortable). Send feelers. |
| **Sat** | 🔵 Write `docs/assessment-scoring.md` — pure-function scoring for all 12 V1 tools with unit test cases. AI drafts, CTO reviews. | Rest / buffer. | Rest / buffer. |
| **Sun** | 🔵 Weekly close: commit all specs to git, tag `phase-0-complete`. Update risk register with anything surfaced. | — | — |

### Deliverables (Phase 0 DoD)

- [ ] `docs/architecture.md` committed
- [ ] `docs/intake-spec.md` committed
- [ ] `docs/data-model.md` committed
- [ ] `docs/tool-library.json` committed (12 tools × EN + HI)
- [ ] `docs/assessment-scoring.md` committed
- [ ] 4 WhatsApp templates submitted to Meta (timestamp + template IDs logged)
- [ ] 5 testers contact list in `docs/user-test-cohort.md` with scheduled 30-min slots in W3
- [ ] Design tokens JSON + styleguide URL
- [ ] `phase-0-complete` git tag pushed

### Risks to watch this week

- **R-15** — feature-creep pressure. If MHPs ask for Tealfeed features, answer with BP §2A adoption-pill table. Don't re-argue each ask.
- **R-13** — WhatsApp template approval. Submit by Fri so 24h clock runs during the weekend; if Meta rejects, re-draft Mon W2.
- **R-16** — accessibility. Set axe-core now; it catches debt before it lands.

---

## 3 · PHASE 1 — Intake prototype (Week 2)

**Goal:** a single-file HTML prototype of the 7-screen adaptive intake that runs from localStorage with no backend, and exports a valid JSON payload matching `intake-spec.md`.
**Milestone:** `saday-intake-prototype.html` in project root; CF + 1 MHP walk through end-to-end successfully.
**Blueprint refs:** §5 intake, §7 routing, §10 safety, §14 compliance (consent screen 6).

### Day-level tasks

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| **Mon** | 🟠 Scaffold `saday-intake-prototype.html` — state machine skeleton, 7-screen navigation, localStorage persistence, locale JSON (EN/HI). | High-fi mock of screens 0 (welcome) + 1 (who-is-this-for) in Figma. | CF: finalise cluster-phrase wording for Hindi — *not* direct translation, culturally appropriate. |
| **Tue** | 🟠 Build screens 0, 1, 2 (welcome → who → age band). Match high-fi when available; focus on state correctness. | High-fi mock of screens 2, 3, 4. | MHPs: test screens 0–2 in browser; log friction notes in shared doc. |
| **Wed** | 🟠 Build screens 3, 4 (symptom clusters, duration/impact). Cluster routing logic live; red-flag cluster triggers Track 5 short-circuit. (→ BP §7) | High-fi mock of screens 5, 6. | CF: review cluster-routing output on 3 synthetic cases; flag misrouting. |
| **Thu** | 🟠 Build screens 5, 6 (contextual questions, consent + summary). JSON export button producing payload matching data-model.md. | Micro-copy pass: every button label, every error message, every empty state. All EN + HI. | MHPs: test screens 3–6; flag any clinical phrasing that sounds like a form. |
| **Fri** | 🔴 Safety path: C-SSRS trigger + crisis-resources screen. This is non-negotiable in the prototype. (→ BP §10) | Visual QA of prototype; accessibility re-audit (axe-core, keyboard nav, screen-reader labels). | CF: cold walkthrough of prototype; 30-min session, CTO observes silently. Write one-page learnings. |
| **Sat** | 🔵 Fix top-3 friction items from CF walkthrough. | Rest / buffer. | Rest. |
| **Sun** | 🔵 Weekly close; tag `phase-1-prototype`. | — | CF: confirm 5 testers for W3. |

### DoD (Phase 1)

- [ ] 7 screens functionally complete in one HTML file
- [ ] JSON export validates against `data-model.md` intake shape
- [ ] Cluster routing produces correct track for 10 synthetic cases (test script in `docs/intake-test-cases.md`)
- [ ] Safety short-circuit (C-SSRS positive) routes to crisis screen with Vandrevala + iCall numbers
- [ ] EN + HI locale switchable
- [ ] WCAG AA: contrast pass, all inputs labelled (deliberate anti-Tealfeed posture)
- [ ] CF walkthrough completed; learnings logged

---

## 4 · PHASE 1.5 — User test (Week 3)

**Goal:** watch 5 real people (demographic 25–40, Tier 2/3, Hindi-comfortable, no mental-health vocab assumed) complete the intake. Iterate the 3 biggest frictions.
**Milestone:** `docs/user-test-W3-findings.md` + v2 of `intake-spec.md`.
**Blueprint refs:** §20 decision #3 ("user test the intake on 5 real people before writing backend code").

### Day-level tasks

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| **Mon** | Book rooms / video calls with 5 testers; finalise observation protocol (silent observer, think-aloud, no leading). | Prepare observation template (1 page: completion time, stuck points, language confusion, track output). | CF co-observes. |
| **Tue** | Test 1 + test 2 (30 min each + 30 min notes each). | DES observes test 2 silently. | — |
| **Wed** | Test 3 + test 4. | DES observes test 3. | MHPs review test-1 + test-2 JSON outputs; flag "does this patient belong on our Track X?" |
| **Thu** | Test 5 + synthesis block. Write `docs/user-test-W3-findings.md`: top 3 frictions, top 3 language/culture mismatches, track-accuracy rate. | Update intake screens with the 3 critical fixes. | CF + CTO: decide which frictions are V1 fixes vs V1.5 backlog. |
| **Fri** | Update `intake-spec.md` → v2. Re-run the 10 synthetic cases against new routing. | Finalise W4-ready design system (all screens, all states, EN + HI). | MHPs: read findings, comment. |
| **Sat** | 🔵 Buffer. | — | — |
| **Sun** | 🔵 Tag `phase-1.5-user-test`. Decision: proceed to backend build Mon W4 or slip a week. | — | — |

### DoD (Phase 1.5)

- [ ] 5 completed test sessions with JSON outputs stored
- [ ] `docs/user-test-W3-findings.md` written (findings + what we changed vs deferred)
- [ ] `intake-spec.md` updated to v2
- [ ] No test in bottom 20% for "would you actually finish this if it were a real thing?" (if any, re-test next iteration before W4 start)

---

## 5 · PHASE 2 — Backend MVP (Weeks 4–10)

**Goal at Phase end:** a patient can complete intake → book a session → pay → attend video call → receive a session summary. MHP can see their roster, take SOAP notes, mark session complete, schedule follow-up. Admin can see bookings + revenue + incidents.

**Cumulative exit criterion (W10):** end-to-end happy path works for 1 test patient + 1 MHP in staging with production-shaped data (de-identified). Incident-response SOP dry-run passed.

### Week 4 — Supabase + Auth + RLS foundation

**Milestone:** Supabase Mumbai project live; schema migrated; RLS policies block cross-patient access; HttpOnly cookies verified.
**BP refs:** §11 data model, §12 CTO non-negotiables, §13 stack.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🔴 Supabase project (ap-south-1). Migrate `data-model.md` DDL. Enable RLS on all PHI tables. | Next.js app shell: locale-prefixed routes, RTL-aware layout (per CLAUDE.md). | — |
| Tue | 🔴 Auth: email+OTP patient flow; TOTP 2FA required for MHP/admin. HttpOnly cookies. (→ BP R-01 / SEC-04) | Auth-screen design (OTP, error states, Hindi + English). | — |
| Wed | 🔴 Write RLS policy tests: cross-patient read attempt, cross-MHP read attempt, role escalation attempt. Must fail. (→ BP §12) | Patient portal shell: nav, landing, sessions, materials stubs. | MHPs complete onboarding-data collection form (NMC/RCI reg no., specialty, languages). |
| Thu | 🟠 Audit log (append-only) — every write to PHI tables captured. (→ BP §12 non-negotiable) | Patient dashboard first pass. | — |
| Fri | 🟠 Sentry + PHI redaction hook. Cloudflare Pages staging deploy. | Fix accessibility issues flagged by axe-core in auth flow. | — |
| Sat/Sun | 🔵 Buffer + W4 close. | — | — |

**DoD W4:** RLS tests pass; audit log entry for every test insert; staging URL live; Sentry captures one synthetic error with PHI redacted.

### Week 5 — Intake backend + tool rendering + scoring

**Milestone:** Intake prototype's JSON payload is persisted; tool-library.json rendered from DB; scoring functions deployed with unit tests.
**BP refs:** §5, §6, §7.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🟠 Port intake prototype into Next.js app; persist payload to `intake_submissions` with audit log. | Port styleguide to Next.js components. | — |
| Tue | 🟠 `assessment_tool_versions` table seeded from `tool-library.json`. Every submission locks to a version. (→ BP DM-08 response) | Assessment rendering design (progress, Likert scale, branching question UI). | — |
| Wed | 🟠 Scoring functions as pure TS functions + unit tests (≥90% coverage). PHQ-9, GAD-7, C-SSRS first. | — | CF validates PHQ-9 + GAD-7 scoring outputs against manual scoring on 3 sample cases. |
| Thu | 🟠 Track assignment engine: intake JSON → cluster matches → track (T1–T5) + recommended tools. | — | CF validates track assignment on the 10 synthetic cases. |
| Fri | 🔴 Safety path: C-SSRS positive → clinician-review queue row + MSG91 alert to on-call MHP within 2h SLA timer. (→ BP §10) | — | — |
| Sat/Sun | 🔵 Buffer. Tag `w5-intake-backend`. | — | — |

**DoD W5:** 10 synthetic intakes produce 10 correct track assignments + correct tool lists; scoring unit tests ≥90% pass; C-SSRS positive simulation triggers both queue row and MSG91 alert within 2h.

### Week 6 — Booking + availability + packages

**Milestone:** Patient books a session with an assigned MHP based on track. Session packages (Tealfeed-derived) supported.
**BP refs:** §2A adoption table, §13 stack.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🟠 `mhps` + `availability` + `sessions` tables. Availability engine: timezone (IST only V1), future-booking window, min-notice. (→ Tealfeed pattern) | Booking flow screens: pick MHP → pick slot → review → pay. | MHPs submit availability windows. |
| Tue | 🟠 Session-type catalogue + per-MHP pricing. Track-type filter (T2 patients only see T2 MHPs). | Confirm-booking page + email/WhatsApp preview. | — |
| Wed | 🟠 `session_packages` entity (4-session, 8-session packs). Consumption tracked per booking. (→ BP §2A P1) | Package-selection UI at booking. | — |
| Thu | 🟠 Cancel + reschedule with policy enforcement. `organization_policies.reschedule_kind` + `cancellation_kind`. (→ Tealfeed Org Settings pattern) | Cancellation + reschedule screens. | — |
| Fri | 🟠 Booking confirmation → WhatsApp (template) + email. Use Meta-approved template IDs. | — | MHPs test booking flow as patient; log friction. |
| Sat/Sun | 🔵 Buffer. Tag `w6-booking`. | — | — |

**DoD W6:** Patient books 1-1 session + 4-session package; cancellation within/outside policy behaves correctly; confirmation WhatsApp + email arrive.

### Week 7 — Payments + earnings ledger + refunds

**Milestone:** Razorpay integrated; earnings ledger populated per Tealfeed's column shape; refund API integrated.
**BP refs:** §2A Tealfeed adoption (earnings ledger, deductions, payouts), §13 stack, §19 R-07.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🟠 Razorpay order + checkout integrated. Webhook endpoint with signature verify + idempotency. | Payment screen + receipt page. | — |
| Tue | 🔴 Webhook retry + dead-letter queue. Admin reconciliation screen. (→ BP R-07) | Admin reconciliation screen design. | — |
| Wed | 🟠 `earnings_ledger` — service, buyer, PG charges, net, deductions, coupon (V1=null), payout status, no-show, refund status. (→ Tealfeed ledger pattern) | Earnings screen for MHP. | — |
| Thu | 🟠 `deductions` + `payouts` entities. V1: single deduction (platform commission). GST row visible. | Deductions config screen (admin). | — |
| Fri | 🟠 Refund API integration. Admin-initiated refund within policy window. (→ BP G-08 response) | Refund confirmation flow (patient-visible). | — |
| Sat/Sun | 🔵 Buffer. Tag `w7-payments`. | — | — |

**DoD W7:** Patient pays ₹500 in test mode; webhook fires; ledger row correct; admin triggers refund; ledger reflects refund status; Sentry captures a simulated webhook failure.

### Week 8 — Video + session execution + SOAP notes

**Milestone:** Video consult works; MHP writes SOAP note; patient sees session summary.
**BP refs:** §11 data model, §13 stack Daily.co.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🟠 Daily.co room creation on booking; Jitsi fallback URL exposed per BP integration-risk rule. | Pre-session check-in screen (patient-facing): "How are you today?" 1-tap rating. | — |
| Tue | 🟠 Session page: enter room, timer, post-session state transitions (completed / no-show / rescheduled). | Session page design (MHP + patient variants). | — |
| Wed | 🟠 `session_notes` (SOAP) — signed, versioned, who-edited-when. Immutable after sign. (→ BP §11 DM-03/04) | SOAP editor UI — four sections with guidance tooltips. | MHPs trained on SOAP editor (30-min session). |
| Thu | 🟠 `medications` entity (list, not e-Rx). `diagnosis_codes` (ICD-11 preferred) on `episode_of_care`. | Medication list UI + ICD search. | — |
| Fri | 🟠 Patient session summary view (what the MHP chose to share + next steps). | Session summary screen. | — |
| Sat/Sun | 🔵 Buffer. Tag `w8-session-clinical`. | — | — |

**DoD W8:** End-to-end flow: book → pay → video → SOAP signed → patient sees summary. 1 MHP + 1 CTO-patient complete live rehearsal.

### Week 9 — Follow-ups + informant + safety + MHP dashboard

**Milestone:** Post-session follow-ups trigger; informant linking works for 1 test case; MHP sees their day.
**BP refs:** §8 informant, §10 safety, §2A client-panel pattern.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🟠 `follow_up_flows` + `follow_up_submissions`. Single `trigger_offset_hours` schema (no CheckIn/Feedback fork per BP DM-06). | Follow-up message + response screen. | — |
| Tue | 🟠 Informant: `linked_accounts` (L1/L2/L3) + `informant_observations`. Consent-gated by patient. (→ BP §8) | Informant-invite flow (patient-initiated). | CF validates informant clinical-use cases (bipolar, paediatric). |
| Wed | 🟠 Safety plan entity (patient-editable, MHP-reviewed). C-SSRS escalation SLA dashboard for admin. | Safety plan editor. | — |
| Thu | 🟠 MHP dashboard — Tealfeed-shape: today's sessions, week view, client cards with last-session / next-session / care-track / safety-flag. | MHP dashboard design. | MHPs review dashboard; request top 3 additions (goes to V1.5 list). |
| Fri | 🟠 Patient portal: materials library (psychoeducation PDFs EN + HI), safety resources always accessible. | Materials library UI. | — |
| Sat/Sun | 🔵 Buffer. Tag `w9-followups-informant-safety`. | — | — |

**DoD W9:** Follow-up triggers 24h post-session; informant L1 invite → observation submitted → visible to MHP; safety-plan saved; MHP dashboard shows correct data for test cohort.

### Week 10 — Admin + policies + hardening + staging freeze

**Milestone:** admin can see everything; policies enforced; security audit pass; performance baseline.
**BP refs:** §12 CTO non-negotiables, §14 compliance, §19 risks.

| Day | CTO/Dev | DES | CF / MHPs |
|-----|---------|-----|-----------|
| Mon | 🟠 Admin screens: bookings, revenue, MHP utilisation, no-show rate, incident queue. | Admin UI. | — |
| Tue | 🔴 Security pass: RLS tested with intentional attack; session-fixation; CSRF on mutations; rate-limit on auth. | — | — |
| Wed | 🔴 Compliance pass: privacy policy + telemed consent form + MHP service agreement rendered and stored at consent time (versioned). Audit log verified append-only. | Consent screens final. | — |
| Thu | 🟠 Performance baseline: Lighthouse on intake + booking + session summary; target ≥90 mobile. Fix top-3 regressions. | WCAG AA audit across all flows; final fix pass. | — |
| Fri | 🟠 Incident-response dry-run: simulate a C-SSRS positive outside MHP hours → alert delivers → junior counsellor protocol → follow-through logged. | — | CF + MHPs participate in dry-run as on-call. |
| Sat/Sun | 🔵 Staging freeze. Tag `phase-2-complete`. | — | — |

**DoD Phase 2:** End-to-end flow production-grade on staging; RLS + CSRF + rate-limit audits pass; Lighthouse ≥90; incident dry-run successful with SLA met; `phase-2-complete` tag pushed.

---

## 6 · PHASE 3 — Closed beta (Weeks 11–14)

**Goal:** 10–15 real patients complete a real episode-of-care with real MHPs, in production, with medico-legal sign-off.

### Week 11 — Junior counsellor onboard + production cutover

**Milestone:** JC hired; production environment cloned from staging; first 3 MHPs live.
**BP refs:** §18 JC briefing, §12 stack.

- Mon: CTO interviews + hires JC (pre-arranged candidate from Week 8 shortlist).
- Tue–Wed: JC orientation — platform, incident protocol, escalation SOP, on-call shifts.
- Thu: Production DB spin-up (ap-south-1); Razorpay live mode; MSG91 live templates; backups verified.
- Fri: MHP 1 + 2 + 3 live onboarding sessions. Staging → prod for patient-facing URL.
- Sat/Sun: 🔵 Production smoke test. Tag `w11-prod-live`.

**DoD W11:** JC briefed + shadowing incident queue; prod smoke test passes for 1 internal patient.

### Week 12 — First 5 beta patients

**Milestone:** 5 patients complete intake → first session → first follow-up.
**BP refs:** R-02 patient safety, R-11 complex track, §4 track model.

- Mon: Open beta to 5 hand-picked patients (CTO/CF network). Consent-to-beta captured with explicit copy.
- Tue–Thu: Monitor intake, booking, payment, session, notes. JC watches incident queue live.
- Fri: Week retro — what broke, what surprised, SLA misses.
- Sat/Sun: 🔵 Fix top-3. Tag `w12-first-5`.

**DoD W12:** 5 completed first-sessions; zero P0 incidents; incident queue SLA met; 5 safety-plans stored where clinically indicated.

### Week 13 — Medico-legal sign-off + next 5 patients

**Milestone:** ML review complete; 10 total beta patients engaged.
**BP refs:** §14 compliance, §18 ML briefing.

- Mon: ML consultant engagement kicks off. Share: privacy policy, telemed consent, MHP service agreement, adolescent/guardian consent, linked-account consent, retention policy, grievance notice. (→ BP §14 legal artifacts)
- Tue–Thu: ML reviews; CTO responds to deficiencies; legal doc v2 committed.
- Fri: Onboard next 5 beta patients. Span Tracks 1/2/3 deliberately.
- Sat/Sun: 🔵 Retro. Tag `w13-ml-signed`.

**DoD W13:** All 9 legal artifacts ML-reviewed + committed with version stamp; 10 active beta patients; no Track 5 patient accepted.

### Week 14 — Baseline metrics + beta gate review

**Milestone:** decide: proceed to public launch prep or extend beta.
**BP refs:** §19 risk register, §16 MVP scope.

- Mon–Wed: Capture baseline metrics — intake completion rate, booking → session conversion, no-show rate, first-session NPS, safety-flag rate, SLA adherence.
- Thu: All-hands retro: CTO, CF, DES, JC, 3 MHPs. What do we extend? What do we cut? What do we keep for V1.5?
- Fri: Gate-review document: proceed / slip. If slip, add specific exit criterion for W15 extension.
- Sat/Sun: 🔵 Tag `phase-3-complete`.

**DoD Phase 3:** 10+ patient episodes captured; zero P0 incidents sustained through beta; ML sign-off; gate-review decision committed to git.

---

## 7 · PHASE 4 — Launch prep + public launch (Weeks 15–24)

**Goal:** public launch Week 24. Marketing, content, capacity, support readiness.

### Weeks 15–17 — Content + SEO + scale rehearsal

**Milestones:**
- W15: 10 SEO blog posts EN + HI committed (→ BP §15.D content playbook).
- W16: Instagram presence (12 reels), WhatsApp-share cards for MHP referrals.
- W17: Load test — intake 100 concurrent, booking 50/min. Scale verified.

### Weeks 18–20 — MHP cohort expansion + support runbooks

- W18: Recruit MHPs 4–6; onboard under existing service agreement; each observes 2 sessions before going live.
- W19: Write support runbooks — password reset, stuck payment, missed reminder, MHP cancellation, refund request.
- W20: FAQ / help centre live (patient-facing Hindi + English).

### Weeks 21–23 — Pre-launch hardening

- W21: Penetration-style review on production (CTO + AI security-audit prompt on every critical route). Fix P0s only.
- W22: Second medico-legal review (lighter — any legal artifact changes since W13). Renew if needed.
- W23: Launch runbook dry-run: PR, outage plan, incident-commander assignment, comms templates.

### Week 24 — Public launch

- Mon: Launch announce (Instagram, LinkedIn, co-founder networks).
- Tue–Wed: Monitor closely; CTO on incident stand-by; JC on support front.
- Thu: First-week retro.
- Fri: Decide V1.5 priority order (top 3 from Tealfeed adoption table that deferred).
- Sat/Sun: 🔵 Tag `v1-public-launch`. Celebrate.

**DoD Phase 4:** Public launch live; 20+ organic visits/day sustained; <1 P0 incident/week tolerated; MHP cohort 4–6 with availability; V1.5 roadmap committed to git.

---

## 8 · Cross-cutting ownership matrix

| Area | Phase 0 | Phase 1–2 | Phase 3 | Phase 4 |
|------|---------|-----------|---------|---------|
| Architecture | CTO | CTO | CTO | CTO |
| Code | CTO + AI | CTO + AI | CTO + AI | CTO + AI |
| Clinical decisions | CTO + CF | CTO + CF | CTO + CF + MHPs | CTO + CF |
| Design | DES | DES | DES | DES |
| Intake language (EN + HI) | CF | CF | CF + JC | CF |
| Incident response (on-call) | — | CTO | JC + MHP | JC |
| Compliance / legal | CTO | CTO | ML | CTO |
| Content / SEO | — | — | CF + AI | CF + AI |
| MHP onboarding | — | CTO | CTO + JC | JC |

---

## 9 · Blueprint cross-reference index

When the plan says *→ BP §N*, it means that blueprint section is the authoritative *why*. Quick map:

| Topic | Blueprint § |
|-------|-------------|
| Positioning vs Swasthmind | §2 |
| Positioning vs Tealfeed + adoption table | §2A |
| Dual-scan feature matrix | §2B |
| Five-track care model | §4 |
| Adaptive intake (7 screens) | §5 |
| 30-tool library | §6 |
| Cluster → tool routing | §7 |
| Informant / collateral | §8 |
| Safety / crisis | §10 |
| V1 data model entities | §11 |
| CTO non-negotiables | §12 |
| Stack + integrations | §13 |
| DPDP + Telemed compliance | §14 |
| AI leverage playbook | §15 |
| MVP scope V1/V1.5/V2/V3 | §16 |
| Phase plan (strategy form) | §17 |
| Team briefings | §18 |
| Risk register | §19 |

---

## 10 · Risk watchlist (roll up each Friday)

Scan this column every Friday. If a risk went from green to amber, note why in the week-close and act Mon.

| ID | Risk | Check |
|----|------|-------|
| R-01 | Scope creep | Did I say no to a feature this week? If no, look harder. |
| R-02 | Safety incident | Every C-SSRS-positive case: SLA met? Escalation logged? |
| R-03 | DPDP/Telemed | Any data leaving India? Any new third party holding PHI? |
| R-04 | MHP churn | Did I talk to each MHP this week? What did they say? |
| R-06 | Claude code security | Did I run a security-audit prompt on any new route this week? |
| R-07 | Payment reconciliation | Webhook DLQ empty? Ledger matches Razorpay dashboard? |
| R-14 | MHP defection to Tealfeed | Any MHP mentioned Tealfeed as better this week? |
| R-15 | Tealfeed-feature creep | How many V1.5 items got pushed back to V1 this week? |
| R-16 | Accessibility | Lighthouse score ≥90? axe-core zero violations? |

---

## 11 · Definition of Done — master list

Each row ships ONLY when every box is ticked.

### Per feature

- [ ] Matches spec in `docs/` (architecture, data-model, intake-spec, or equivalent)
- [ ] Unit tests pass
- [ ] Security: RLS tested (cross-patient, cross-MHP, role escalation)
- [ ] Audit log fires on every PHI write
- [ ] Sentry captures exceptions with PHI redacted
- [ ] axe-core zero violations; WCAG AA contrast verified
- [ ] EN + HI strings present
- [ ] Blueprint section referenced in commit message (`→ BP §N`)

### Per phase

- [ ] Git tag pushed (`phase-N-complete`)
- [ ] Risk register updated
- [ ] Weekly close notes committed (`docs/retros/phase-N.md`)
- [ ] Next-phase kickoff scheduled on calendar

---

## 12 · If we fall behind

1. **Never cut from the P0 column.** Safety, compliance, RLS, audit log — these are non-negotiable. Slip the timeline, not the floor.
2. **Cut from the P2 column first.** Coupons, bulk messaging, drag-calendar, seminars, CMS — all explicitly V1.5+ already.
3. **If cutting P1:** write a one-paragraph justification in `docs/scope-exceptions.md` — what was cut, what compensates, when it comes back.
4. **Budget reality check every 4 weeks.** ₹1 lakh / 24 weeks ≈ ₹4,200/week burn. If over, what tool/service is eating it?
5. **Bus-factor drill every 4 weeks.** If CTO is offline for 1 week, what breaks silently? Document it.

---

## 13 · First-Monday checklist (starts today — W1 Mon)

- [ ] Block next 24 Mondays 9–9:30 on calendar ("Saday week kickoff").
- [ ] Block next 24 Fridays 16:30–17:00 ("Saday week close").
- [ ] Pin this file + `Saday_Master_Blueprint.html` in editor.
- [ ] Create a private Discord/Slack/WhatsApp group: CTO, CF, DES, MHPs. Rename it "saday-build". First message: link to both docs.
- [ ] Clone this plan into project management tool of choice (or just a single markdown checklist in repo). Keep one source of truth.
- [ ] Start Phase 0 Day 1 task *today*.

---

**Maintainer:** Claude (AI) · drafted from `Saday_Master_Blueprint.html` v1.1.
**Next review:** every Friday week-close; material revision each phase end.
**Replaces:** earlier `Saday_Comprehensive_Action_Plan.md` (Gemini-authored; ignored).

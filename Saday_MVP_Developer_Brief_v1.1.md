# Saday Wellness — MVP Developer Brief (V1)

**Version:** 1.1 (FINAL — all open decisions resolved)
**Date:** 2026-06-05
**Budget:** ₹1,00,000 (fixed)
**Builder:** Single developer
**Stack:** Code-based (not no-code)
**Purpose:** Define the exact, fixed scope of the V1 build. Anything not listed in "In Scope" is explicitly out of scope and not part of this engagement.

> **v1.1 changes:** Four open decisions from v1.0 Section 6 are now closed and folded into the relevant in-scope sections. Section 6 is retained as a record of the decisions, not as open questions.

---

## 0. How to read this document

This is a scope-locking document, not a wish list. The most important section is **Section 4 (Out of Scope)** — it protects the budget. If the developer believes any in-scope item cannot be delivered within ₹1,00,000, that must be flagged **before** work begins, not midway. The developer is expected to return a fixed-price confirmation or a written list of items that don't fit.

---

## 1. Product in one line

A digital mental-health consultation platform for India: patients (or caregivers on their behalf) self-book a session with a registered psychiatrist/psychologist, complete a structured intake with a safety screen, attend a video consult, and receive a signed prescription PDF and a shareable written care plan.

---

## 2. Non-negotiable constraints (the floor — applies to every feature)

These are not features. They are conditions the entire build must satisfy. None of these can be cut for cost.

1. **India data residency.** All patient data, files, and database hosted in an India region only (e.g. Supabase ap-south-1 / Mumbai). No US regions, including backups. *(Note: the live Jitsi video stream transits 8x8's global infrastructure and is ephemeral — nothing is recorded or stored. This is disclosed to the patient in the telemedicine consent. All data-at-rest stays India-resident.)*
2. **Audit log from day one.** An append-only log: who did what, to what record, when (server timestamp), with before/after where applicable. Every change to patient/clinical data writes a log row. This is a DPDP requirement, not a nice-to-have.
3. **Secure auth.** Session tokens in HttpOnly cookies (not localStorage/sessionStorage). 2FA (TOTP) for doctor and admin logins. Role-based access: patient, doctor, admin.
4. **No PHI in logs.** Application/error logs must redact names, contact details, and clinical content. Only user IDs and action types.
5. **Clinical records are immutable once signed.** A signed prescription, session note, or care plan cannot be silently edited. Edits create a new version; the original is retained.
6. **Bilingual: Hindi + English.** No hardcoded display strings. All patient-facing text rendered from a language file so Hindi/English switch is config, not code.
7. **Mobile-first.** Primary user is on a phone (360px base). Design and test for mobile first.

---

## 3. In Scope (V1 — what gets built)

Each item lists acceptance criteria. "Done" = criteria met.

### 3.1 Doctor profile
- Photo, name, specialization, languages spoken, short bio.
- **NMC / state-council registration number captured and stored** (compliance requirement, verified before doctor goes live).
- Public-facing profile page patients can view before booking.

### 3.2 Self-serve booking + Availability Engine
- Each doctor sets their own availability via rules: recurring weekly slots, session duration per slot, minimum-notice window (e.g. can't book <24h out), future-booking cap (e.g. max 30 days ahead), and block-out dates (vacation/leave).
- Timezone fixed to IST for V1.
- Patient sees only valid, bookable, non-conflicting slots.
- System prevents double-booking.
- **Session types with different durations and prices, set per doctor:**
  - Consultation — 30 min
  - Therapy session — 60 min
  - **Premium / Extended therapy session — 90 min** *(confirmed: long-form therapy)*
- Price is set per doctor, per session type (dynamic; no fixed price anchors in the system).

### 3.3 Payments (Razorpay)
- Patient pays at time of booking via Razorpay.
- Payment status reconciled against the appointment (webhook handling so a paid booking is never lost).
- **Refunds processed manually by admin via Razorpay dashboard in V1** (no automated refund API — see Section 4).
- Booking is confirmed only on successful payment.

### 3.4 Cancellation & Reschedule
- Patient can cancel or reschedule from their account.
- **Cancellation-window policy (CONFIRMED):**
  - Cancel **more than 24h** before the slot → eligible for **full refund** (processed manually by admin).
  - Cancel **within 24h** of the slot → **no refund**.
- Reschedule allowed up to the same 24h window; reschedule moves the booking to another available slot, no new payment.
- The policy is displayed to the patient **before they pay**.

### 3.5 Confirmations & Reminders (WhatsApp + Email)
- On booking: confirmation via WhatsApp (templated) + email.
- Before session: reminder via WhatsApp + email.
- On cancellation/reschedule: notification via WhatsApp + email.
- WhatsApp via a Business API provider (e.g. MSG91). **Templates must be drafted and submitted for approval in week 1** (approval has lead time).
- Email is fallback if WhatsApp fails.
- Per-patient send rate limit (e.g. max 3 WhatsApp/day) to prevent runaway billing.

### 3.6 Structured Intake Form (with caregiver/proxy branch)
This is a structured intake, **not a basic contact form.** Minimum:
- Branch 1: "For myself" / "For someone else (caregiver/family)" — the caregiver branch collects the patient's name, age, relationship, and a consent note.
- Basic context: age band, gender, preferred language.
- Symptom selection (plain-language multi-select).
- Two validated assessment tools wired in with scoring: **PHQ-9 (depression) and GAD-7 (anxiety).** Scoring logic + severity thresholds implemented; results stored against the patient.
- Intake output stored and visible to the doctor before the first session.

### 3.7 Safety Screen (non-negotiable, fires for every intake)
- The **ASQ (Ask Suicide-Screening Questions)** — 4 items — presented to every patient at intake, never skippable.
- Any "yes" to suicidality items → a crisis-resource screen is shown immediately (helpline numbers: iCall, Vandrevala, AASRA, emergency 112) and the submission is flagged in an admin/clinician review queue.
- The safety flag is stored as an immutable field on the submission.
- V1 commitment to patient: crisis helplines + "our team will contact you" form. (No timed SLA in V1.)

### 3.8 Video consultation
- A unique video session link is attached to each confirmed appointment.
- Link is delivered in the confirmation + reminder messages.
- **Video provider (CONFIRMED): Jitsi — public instance (`meet.jit.si`).** The system generates a unique, non-guessable room URL per appointment (e.g. `meet.jit.si/saday-<random-id>`). No account, no API key, no OAuth, no recurring cost. Nothing is recorded or stored. Disclosed in telemedicine consent.

### 3.9 Prescription (signed PDF, delivered out-of-platform)
- Doctor opens a prescription screen for a completed appointment.
- System generates a PDF from a **standard letterhead template** + doctor-typed fields (patient name, age, date, medicines/advice as free text) + the doctor's **signature image** overlaid.
- PDF must include the doctor's **NMC/registration number** and NMC-2020-required fields.
- **Once finalized, the PDF is locked** — medicine text cannot be edited after signature is applied. An edit creates a new versioned prescription; the original is retained. Audit-logged.
- Delivered to patient via email/WhatsApp; stored against the appointment.
- **Note:** a signature *image* is not an IT-Act digital signature. Do not label it "digitally signed."
- **No Schedule X / NDPS-restricted drugs** are prescribed via this platform.

### 3.10 Session notes
- Doctor writes a clinical note per session.
- Note is **signed and locked** on completion (immutable; edits version).

### 3.11 Shareable Care Plan PDF — *the differentiating feature (CONFIRMED in V1)*
- After a session, the doctor produces a **structured, family-shareable written care plan** as a PDF from a template (e.g. understanding of the problem, recommended steps, what the family/caregiver can do, follow-up).
- Delivered to the patient/caregiver via email/WhatsApp; stored against the episode.
- This is the one feature that distinguishes the platform from generic booking tools. It is in V1.

### 3.12 Legal & compliance documents (displayed in-product)
The developer wires these into the product (consent checkboxes, footer links, grievance contact). **The documents themselves are drafted separately and must be reviewed by a medico-legal professional — that review is NOT part of this build budget (see Section 5).**
- Privacy Policy (DPDP-compliant)
- Terms of Service
- Telemedicine Consent Form (NMC 2020) — shown and accepted at first session, with timestamp stored; **includes disclosure that the live video stream transits a third-party (Jitsi/8x8) global service and is not recorded**
- Data Retention & Deletion policy + patient "download/delete my data" function
- Grievance Officer contact

---

## 4. Out of Scope (NOT built in V1 — protects the budget)

If any of these is requested mid-build, it is a new engagement, not a change request. Listing them explicitly so there is no ambiguity:

- Structured / digitally-signed e-prescription (IT Act Sec 5) — signed PDF only in V1
- Automated Razorpay refund API — manual refund in V1
- Two-way WhatsApp inbox / chat — templated one-way only in V1
- Coupons, discounts, session packages/bundles
- The full validated-assessment library beyond PHQ-9 and GAD-7 (the other ~28 tools)
- Clinician-administered assessment module (PANSS, MoCA, Y-BOCS, C-SSRS, etc.)
- The full multi-tier informant/linked-account system (L1/L2/L3) — the V1 caregiver feature is the intake proxy branch + the shareable care plan only
- Mood logs / longitudinal trend charts
- Drag-to-create calendar UI
- MHP commission/subscription/payout automation, earnings ledger
- Segment analysis / advanced reporting dashboards
- SEO blog/CMS engine
- Regional languages beyond Hindi + English
- ABDM / ABHA integration
- Lab integrations, group sessions, referral network, insurance
- Timed safety SLA / on-call rostering
- Paediatric/adolescent full pathway and teacher portals
- Video recording, transcription, or any stored video artifact

---

## 5. What ₹1,00,000 does NOT cover (separate costs the founder must budget)

These are real costs that sit outside the development fee. The developer is not responsible for them:

1. **Medico-legal review** of the legal documents (≈ ₹15,000–25,000, one-time). An AI/lawyer-drafted document without sign-off is a liability, not protection.
2. **Recurring run costs:** WhatsApp/MSG91 message fees, hosting, domain, Razorpay transaction fees. *(Video is now ₹0 — Jitsi public instance.)*
3. **Ongoing maintenance:** compliance updates, WhatsApp template re-approvals, bug fixes after launch. Owning the platform replaces a flat SaaS rent with a permanent maintenance liability — plan for it.
4. **Bus-factor risk:** a single developer. Everything must be in version control, with a short architecture/handover document, and the founder must hold independent admin credentials.

---

## 6. Decisions log (resolved — formerly "open decisions")

All four items closed on 2026-06-05:

1. **Video provider:** **Jitsi public instance**, generated room URL per appointment. (Google Meet on a personal account rejected: no programmatic link API without paid Workspace; 60-minute cap on 3+ participant calls collides directly with the caregiver-inclusive session and the 90-min premium session; not India-resident.)
2. **Premium session type:** **Premium / Extended therapy session, 90 min** (the "immunotherapy" label in earlier notes was a transcription artifact — it means long-form therapy).
3. **Cancellation/refund window:** full refund if cancelled **>24h** before; **no refund within 24h**; **manual** processing.
4. **Care plan PDF:** **stays in V1** as the differentiator.

---

## 7. Suggested tech stack (developer may propose equivalent)

- Frontend: Next.js + Tailwind, i18n (Hindi/English)
- Backend/DB/Auth/Storage: Supabase (Postgres + Auth + RLS + Storage), Mumbai region
- Payments: Razorpay
- WhatsApp/SMS: MSG91
- Email: Resend or AWS SES (transactional only — never clinical content)
- **Video: Jitsi public instance (`meet.jit.si`), unique room per appointment**
- Error monitoring: Sentry (with PHI redaction)

**Architecture requirement:** before coding, the developer writes a one-page architecture note defining auth handling, error-response shape, transaction rules, PHI-redaction rule, and naming conventions. This prevents inconsistent code across modules.

---

## 8. Acceptance milestones

1. **Week 1:** Architecture note + data model reviewed and approved by founder. WhatsApp templates submitted for approval.
2. **Mid-build:** Intake + safety screen + booking + payment working end-to-end on staging (de-identified test data).
3. **Pre-launch gate:** All Section 2 non-negotiables verified (data residency, audit log, HttpOnly auth, immutable signed records, redacted logs). Cross-patient access attempt tested and blocked.
4. **Delivery:** All Section 3 features meet acceptance criteria; code in version control; founder holds independent admin credentials; short handover doc provided.

---

*End of brief. Anything not in Section 3 is out of scope by default.*

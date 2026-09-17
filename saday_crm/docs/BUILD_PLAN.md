# Saday Consultation Platform — Build Plan (v0.2, 2026-09-17)

Status: Interview complete (D-008…D-023 locked). Build not yet authorised — P0 spec lock is the next step and each P0 artefact needs Saday's sign-off.

## 0 · Locked architecture (summary — details in DECISION_LOG)
- Repo `sadaywellnessgroup/saday-crm` · Next.js App Router + TS + Tailwind · Cloudflare Workers (OpenNext) at `app.sadaywellness.com` · Supabase ap-south-1 (Postgres + RLS + Auth + Storage) · Razorpay · 100ms · WhatsApp BSP (TBD, D-015) · transactional email (Resend/SES) · Sentry with PHI redaction.
- Auth: patients phone-OTP; providers/admin email+password+TOTP; HttpOnly cookies.
- Roles: patient · provider · admin. Minimal append-only audit table, no UI.
- Money in integer paise; fixed % commission per provider; manual payouts.
- EN/HI for patient surfaces; provider/admin EN.
- Follow-up flows configured org-wide in admin.
Companion: `DECISION_LOG.md` (all decisions), repo `saday-redesign/docs/` (prior specs, competitor scans).

---

## 1 · Product in one line
Bilingual (EN/HI) online consultation CRM for Saday Wellness: a client books a provider in three fields, pays, attends video, then lives in a dashboard (sessions, files, mood + sleep logs, scores); the provider runs availability, notes, assessments, materials, async messaging, and earnings — all in the main-site design language.

## 2 · Scope (from brief) — V1

### Client (patient) side
- Sign-up / sign-in (method: Q5).
- Intake: name, age, sex → provider picker (profile cards) **or** "earliest available consultation" auto-assign.
- Booking: session type + slot, pay, get confirmation (WhatsApp + email).
- Dashboard: next session, monitoring panel (scores over time, mood, sleep), shared files (brochures / therapy sheets / prescription images / URLs), messages.
- Mood log + sleep log (daily entries; simple).
- Self-rated psychometrics (PHQ-9, GAD-7, ASRS … per ABC360 library) assigned by clinician or self-started; serial monitoring chart.
- Async two-way messaging with the provider — no personal contact details revealed either way; attachments ≤25 MB (PDF/image/video/URL) for prior reports and prescriptions.
- Cancel / reschedule per policy (refund page already exists on main site).

### Provider side
- Profile (public page per team member — fields per Swasthmind pattern: title, qualifications, specialisations, registration no., languages, concerns, session types + prices). Seeded from `lib/content.ts`.
- Availability rules (weekly recurring, duration, buffer, min-notice, block-outs) + calendar (day/week).
- Patient panel: overview, scores-over-time chart, session notes (Swasthmind 4-section style), assessment proforma (online, drop-down/option driven), assigned psychometrics, files, messages.
- Send materials: brochures, Saday-branded therapy sheets, URLs, PDF/photo/video ≤25 MB; prescription photo.
- Earnings view (per-session ledger, period totals, payout status).
- Follow-up messaging (post-session check-in / feedback via WhatsApp — Swasthmind pattern, see DECISION_LOG §0.2).
- Settings (profile, session types, pricing, notification prefs).

### Admin (minimal — Q10)
- Providers on/off, payouts/refunds record, template management, policy settings.

### Shared infrastructure
- Payments (Q3), video (Q4), WhatsApp Business API (Q6), email transactional, file storage (India region), i18n EN/HI.

### Explicitly out (per brief)
Care tracks; long intake; audit-log UI; safety screening module; helpline module; individualised worksheet branding (later job).

## 3 · Assessment proforma (online, therapist-filled) — proposed section map
From the 19-page Nischay IPD Case Record File. **Keep** (converted to dropdowns/chips/short text): sociodemographic (age, gender, marital, family type, living arrangement, education, occupation, referral source, willingness); informant details + reliability; present physical illness; presenting complaints (informant / patient, duration); HOPI — onset/course/progress, predisposing/precipitating/perpetuating; present-illness attitude + biological functions (appetite, libido, sleep pattern chips); substance-use table (8 classes × age-first, frequency, quantity, route, last use); past psychiatric + medical history; family history (psychiatric illness chips, adjustment patterns); personal history (birth/development, scholastic, occupational, forensic, marital, sexual optional); premorbid personality; MSE — appearance/behaviour, speech, mood/affect, thought stream/possession/content/delusions, perception, cognition (orientation, attention, memory, intelligence), judgement, insight (1–6 scale).
**Drop** (IPD-only): registration/Aadhaar/thumb impression; physical/systemic exam + vitals; investigation report table; IPD medical treatment record; discharge summary; income/religion (Q9 — keep optional or drop).
Diagnosis (ICD-11 pick-list) + formulation + plan to be added at the end (not in the paper form; Q9).

## 4 · Phases (draft; durations assume Saday reviews daily and answers within 24 h)

| Phase | Deliverable | Model split | Est. |
|---|---|---|---|
| P0 Spec lock | Interview answers → DECISION_LOG locked; architecture note; DB schema v1 (trimmed from data-model.md); screen inventory; API/contract list | Plan: this model · schema/architecture: Opus | 1 wk |
| P1 Foundation | Repo, CI, Supabase/DB, auth + roles, i18n scaffold, design-token port from main site, layout shells (client/provider/admin) | Sonnet build · Opus review of RLS/auth | 2 wk |
| P2 Booking & money | Provider profiles + availability engine + calendar; 3-field intake; slot picker; payments + webhooks; video room minting; WhatsApp/email confirmations + reminders; cancel/reschedule | Sonnet · Opus for availability engine + webhook idempotency | 3 wk |
| P3 Clinical core | Session notes (Swasthmind style, sign/lock/version); assessment proforma; psychometrics engine (tool versions, scoring, serial chart — port ABC360 logic); patient panel with scores-over-time | Opus for scoring/versioning design · Sonnet build · Haiku for item text transcription | 3–4 wk |
| P4 Client dashboard & exchange | Dashboard, mood/sleep logs, files vault (25 MB, signed URLs), async messaging (both ways, attachments), materials dispatch (brochures/sheets/URLs) | Sonnet · Haiku for copy | 2 wk |
| P5 Provider ops | Earnings ledger, follow-up WhatsApp flows, settings, admin minimal | Sonnet | 2 wk |
| P6 Hardening & launch | Cross-role access tests, RLS attack tests, PHI-redacted logging, mobile QA (360 px), HI copy pass, load test, backup/restore drill, go-live checklist | Opus review · Sonnet fixes | 2 wk |

**Calendar: ~15–16 weeks** at the above cadence; 10–12 weeks if Saday reviews twice daily and all third-party accounts (payments KYC, WhatsApp templates, video) are ready before P2. Uncompressible external waits: WhatsApp template approval (24 h each round), Razorpay/Cashfree KYC (2–7 days), domain/DNS.

Supervision loop per phase: (1) I write the phase brief + acceptance criteria → Saday approves → (2) Opus/Sonnet execute in bounded tasks → (3) I review diffs against criteria, run checks → (4) Saday demo/sign-off → (5) DECISION_LOG updated. Final check after P6: full audit against §2 scope, security checklist, design-language checklist, and a betterment list for V1.1.

## 5 · Needed from Saday (regardless of answers)
- Accounts/keys: DB host org (Supabase or other), payments account (KYC-complete), WhatsApp BSP credentials + which provider, video provider account, Cloudflare/domain access (`app.sadaywellness.com`?), transactional email (Resend/SES).
- Team data: per provider — registration number (NMC/RCI), photo, session types + prices, weekly availability, languages, bank details for payouts (held by admin only).
- Legal: telemedicine consent text; privacy/terms/refund already on main site (need the consult-specific clauses reviewed).
- Licensing: Y-BOCS, MSI-BPD, ZAN-BPD, WURS permissions were obtained for paper clinic use; **digital administration may need separate permission** — Saday to confirm before those go online. Public-domain/free tools (PHQ-9, GAD-7, HAM-D, HAM-A, BPRS, ASRS, YMRS) are safe.
- Swasthmind follow-up scrape extras (optional; see DECISION_LOG §0.2).
- Brochure PDFs to seed the materials library.

## 6 · Interview (2026-09-16/17) — DONE
All 16 questions answered; see DECISION_LOG D-008…D-023. Only D-015 (WhatsApp BSP) remains open.

## 6a · Status log
- **2026-09-17** P0.1 `architecture.md` + P0.2 `0001_schema.sql` delivered and approved (D-029). `ui-references.md`, `mantracare-feature-digest.md` delivered.
- **2026-09-17** P1 foundation delivered to `Saday_CRM\app` (Next 15, Tailwind 3.4, shadcn re-themed, next-intl EN/HI, mock repos + fixtures, stub adapters, 3 shells, screenshot tooling). Git initialised there (first commit `e0ca95a`).
- **2026-09-17** P1 client screens built in Claude's workspace: `/`, `/login`, `/intake`, `/providers`, `/providers/[slug]`, `/book/[providerId]`, `/book/earliest`, `/booking/[id]/confirmed` (+ ICS), `/app`, `/app/sessions`, `/app/track` (mood/sleep/assessments + runner), `/app/files`, `/app/messages`, `/app/messages/[threadId]`, `/app/profile`. Build/lint/13 tests green; 36 screenshots reviewed at 360 + 1280. Fixes applied by planner: chart animation disabled (charts rendered half-drawn), y-axis labels unclipped, screenshot script hardened. **Sync to Saday_CRM\app pending — computer link dropped mid-transfer.**
- **2026-09-17** Client screens synced to `Saday_CRM\app` (commit `540763b`). Provider console built by Opus and synced (commit `ef6b68d`): Today, Calendar, Availability (+Days off), Patients list, Patient detail (Overview/Notes/Proforma/Assessments/Files/Messages), 4-section note editor with Sign & lock + Supersede, 15-section proforma with per-section completion + ICD-11 picker, Earnings (paise ledger), More (materials/profile/notifications). 46 tests green; 74 screenshots reviewed. D-034 implemented. Git lock issue resolved (delete permission granted for the session).
- **2026-09-17** Admin console built by Sonnet and synced (commit `7530058`). D-039 done. 53 tests green. **P1 (UI on mock data) is complete across all three roles — ready for Saday's walkthrough.** Next: Saday demo → fix list → P2 (Supabase wiring, real auth, Razorpay test mode, 100ms) once accounts exist.
- **2026-09-17** Account-free tracks (Sonnet): psychometrics content for the 7 free tools (verbatim EN/HI from ABC360, generic scorer, bands/remission/response, 27 tests) and the materials library (34 Saday-branded worksheet PDFs + thumbnails via `tools/worksheets`, seeded into the in-app library). 87 tests green. App commit `083692c`. GitHub export lives in `Saday_CRM\saday-redesign\saday_crm` (commits `58e159a`, `9aa6dfc`) — **Saday pushes from Windows**.
- Saday to proofread: Hindi PHQ-9/GAD-7 item text (transcribed from ABC360), Hindi severity-band labels (Sonnet's own), HAM-D/HAM-A response rule (50 % convention applied, none in source).
- Known follow-ups (not yet fixed): `.git/HEAD.lock` + `objects/maintenance.lock` may be left behind in `Saday_CRM\app\.git` (delete them if `git status` complains).

## 7 · P0 — next deliverables (each needs Saday sign-off before P1 starts)
| # | Artefact | Producer | Saday's review focus |
|---|---|---|---|
| P0.1 | `architecture.md` — auth flows, RLS policy map, error shape, PHI-redaction rule, naming, env/secrets, deploy pipeline | Opus | Anything you don't understand → ask; nothing proceeds on it |
| P0.2 | `schema.sql` v1 — trimmed from data-model.md (drop tracks/intake/C-SSRS tables; add mood_logs, sleep_logs, files, messages, proforma, follow_up_flows org-level) | Opus | Field names for clinical tables; what's stored about patients |
| P0.3 | `proforma-spec.md` — field-by-field online proforma (type, options, required, section) | Sonnet drafts · planner reviews | Clinical correctness, fill speed |
| P0.4 | `psychometrics-spec.md` — tool list (from ABC360), scoring, severity bands, remission rules, who can administer (self vs clinician), licence status | Sonnet · Haiku transcribes items | Licence gate; scoring bands |
| P0.5 | `screens.md` — screen inventory per role with design-token mapping (which main-site component/motif each screen reuses) | Sonnet | Design-language continuity |
| P0.6 | WhatsApp template texts (booking, reminder, join link, check-in, feedback) EN+HI | Haiku drafts · planner reviews | Tone; submit for Meta approval as soon as BSP is known |
| P0.7 | Account checklist handed to Saday (Supabase, Razorpay, 100ms, Cloudflare, email, GitHub) | planner | Create + share keys via env, never in chat |

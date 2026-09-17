# Saday Consultation Platform — Decision Log

Every decision (however small) is recorded here with who decided, when, and why. Nothing is locked without Saday's explicit answer. `PROPOSED` = awaiting Saday. `LOCKED` = Saday confirmed. `SUPERSEDED` = replaced by a later row.

Format: `ID · date · status · decision · rationale · supersedes`

---

## 0 · Context & findings (2026-09-16, planning session 1)

### 0.1 Resources reviewed
- `github.com/sadaywellnessgroup/saday-redesign` — 677 files. Contains: prior Phase-0 specs by Akash/Claude (Apr–Jun 2026): `Saday_Master_Blueprint`, `data-model.md` (34 tables / 9 domains), `intake-spec.md` (D1–D8 locked), `stack-decision.md` (OPEN — never answered), `Saday_MVP_Developer_Brief_v1.1.md` (₹1L external-dev scope, Jun 2026), `Saday_Solo_Agentic_Build_Estimate` (~150 dev-days / 28–31 weeks for the full blueprint), `whatsapp-templates.md` (4 templates), competitor scans (Swasthmind 12 docs, Tealfeed, MantraCare 10 docs), vendor mockup audit (`vendor-mockup-scan/AUDIT.md`), 15 brand motif SVGs.
- Demo dashboard `sadaywellness.salmanarshad321.workers.dev` — Vue 3 CDN prototype (June 2026), = `vendor-mockup-scan/` in the repo. Uses 7 care tracks, sage-green palette (off-brand). Reference for layout/feature inventory only.
- `C:\Users\dradi\SADAY_MAIN_SITE\main-site` — Next.js 16 App Router, `output: 'export'`, served by a Cloudflare Worker (`wrangler.jsonc`). Tailwind tokens: indigo `#3E2A78`, indigo-deep `#2B1D57`, terracotta `#B0522E`, cream `#FAF5EC`, card `#FFFDF6`, turmeric `#D69A3C`, lilac-tint `#F1ECF9`, ink `#2A2320`. Fonts: Fraunces (display), Mukta (body), Tiro Devanagari Hindi. No borders; `shadow-feather`; radius `soft 18px / softer 28px`. `lib/motifs.ts` maps motifs per slug. Team data in `lib/content.ts` (aditya, vikrant, kritika, shivangini, haifa, janhavi, surabhi, yatika). Pages: privacy, terms, refund-policy already exist.
- `C:\Users\dradi\Saday_CRM\Assets` — Swasthmind session-note screenshots (4 sections: Session details · Clinical assessment · Session narrative · Plan & next steps) and the 19-page Nischay IPD Case Record File proforma (scanned, no text layer).
- `C:\Users\dradi\ABC360-Assessment-Proformas` — 7 packages (PHQ-9/HAM-D, GAD-7/HAM-A, YMRS, BPRS, Y-BOCS, MSI-BPD/ZAN-BPD, ASRS/WURS) with `tracker.js` serial-monitoring chart and licence table in `ROADMAP.md`.
- `C:\Users\dradi\saday-worksheets` — 35 Canva canvases + Handlebars/Puppeteer PDF pipeline, 7 doctor JSONs.

### 0.2 Swasthmind follow-up messaging — repo check (Saday asked)
Documented in `SwasthMind_CRM_Phase2_SessionFollowUps.md`, `_Conversations.md`, `_Phase3_Flows.md` (FL-06/07). Mechanism: per-therapist **Check-in** and **Feedback** WhatsApp flows (Meta interactive flow format), check-in fires N hours after session end, body has `{{1}}` first-name placeholder, publishing = Meta template approval (24 h), responses stored as submissions, read-only table. **Missing from scrape:** feedback-flow timing, whether submissions link into the clinical record, actual Meta flow JSON, escalation on flagged answers, opt-out/retry/multi-language handling. Enough to replicate the UI + data model; not enough to copy Meta payloads. → Saday to decide whether to send more scraped material (Q in interview).

### 0.3 MantraCare material sending — repo check
Tools > Resources, scoped per service line; 8 categories; View/Send actions (Send not exercised in scan); session-note attachments capped at 10 MB, PDF/Excel/CSV/Word/JPG/PNG. Weakness to avoid: clinician-rated scales exposed via client-facing Send.

### 0.4 Competitor vulnerabilities / gaps (to exceed)
No MFA for staff; JWT in sessionStorage, no CSP; no consent capture; no idle timeout; RBAC misconfig (therapist role zero permissions); audit UI 404; SOS flagged but never escalated; unstructured risk enum with no forced follow-up; no note sign/lock/version trail; formulary data errors (MantraCare).

### 0.5 Conflicts between prior repo specs and the new brief (need Saday's ruling)
| # | Prior spec (Apr–Jun 2026) | New brief (16 Sep 2026) |
|---|---|---|
| C1 | 5 care tracks T1–T5, routing engine | **No tracks, no segregation** |
| C2 | 7-screen adaptive intake, 8 clusters, C-SSRS/ASQ safety screen mandatory | **Intake = name, age, sex → choose provider or earliest slot** |
| C3 | Append-only audit log with Merkle roots; safety log; helplines | **"Audit log, safety, helpline numbers not needed"** |
| C4 | 18+ self-only | Not stated |
| C5 | Prescription PDF module + care-plan PDF | Not stated; brief says doctor sends *picture* of prescription |
| C6 | One-way templated WhatsApp only | **Two-way async messaging (in-app), file exchange ≤25 MB** |
| C7 | Mood logs out of scope | **Mood log + sleep log in scope** |
| C8 | Stack decision never answered (Next.js+Supabase vs Laravel) | Open |

---

## 1 · Decisions

| ID | Date | Status | Decision | Rationale | Supersedes |
|---|---|---|---|---|---|
| D-000 | 2026-09-16 | LOCKED | Planning model plans/supervises only; Opus = heavy design/architecture work; Sonnet = coding + reading; Haiku = copy/paste-type text work. Token-frugal. | Saday's instruction | — |
| D-001 | 2026-09-16 | LOCKED | All decisions go through Saday; any confusion → stop and ask. | Saday's instruction | — |
| D-002 | 2026-09-16 | LOCKED | Design language = main-site tokens (indigo/terracotta/cream/turmeric/ink, Fraunces+Mukta+Tiro, feather shadows, no borders, Indian motifs from `lib/motifs.ts` + `Saday_Wellness_Motifs_SVG`). Vendor demo's sage-green palette is rejected. | Saday: "design language continuation is very important" | — |
| D-003 | 2026-09-16 | LOCKED | Remove care tracks and any track-based segregation. | Saday brief | intake-spec D1/D4/D5 |
| D-004 | 2026-09-16 | LOCKED | Intake = name, age, sex only; then provider list or "assign earliest available". | Saday brief | intake-spec D2/D3/D6/D7 |
| D-005 | 2026-09-16 | LOCKED | Session-note form replicates Swasthmind 4-section structure (Session details / Clinical assessment / Session narrative / Plan & next steps) incl. risk chips, intervention chips, progress slider, follow-up date. | Screenshots in Assets | — |
| D-006 | 2026-09-16 | LOCKED | Materials/therapy sheets = generic Saday-branded canvases (not doctor-individualised) for V1. | Saday brief | — |
| D-007 | 2026-09-16 | LOCKED | File exchange both directions, per-file limit 25 MB; types URL/PDF/image/video. | Saday brief | — |
| D-008 | 2026-09-17 | LOCKED | Keep a *minimal* append-only `audit_log` table (actor, action, table, row id, timestamp). **No UI.** | MHA 2017 §23 / DPDP "who accessed this record" answerable; ~half a day. Saday accepted the pushback. | C3 |
| D-009 | 2026-09-17 | LOCKED | No intake safety screen; no helpline module. Risk chips in the session note (No risk / Self-harm / Suicide / Violence / Substance) are the only risk record. Static urgent-help line stays in footer. | Saday accepted. Liability note stands: no pre-consult risk gate. | C2/C3 |
| D-010 | 2026-09-17 | LOCKED | **Stack = Option A.** Main site untouched on Cloudflare. CRM = new repo `sadaywellnessgroup/saday-crm`, Next.js (App Router, TS, Tailwind) on Cloudflare Workers via OpenNext at `app.sadaywellness.com`; data/auth/storage = Supabase, region ap-south-1 (Mumbai), RLS as primary PHI gate. Fallback if OpenNext misbehaves: Vercel behind Cloudflare DNS (needs Saday's OK). | Competitors (Swasthmind `crm.`, Tealfeed `app.`, MantraCare `app.`) all split site from app; none run DB on the CDN vendor. D1 rejected: no India region guarantee, no RLS. | C8, stack-decision.md |
| D-011 | 2026-09-17 | LOCKED | Builders: agentic build (Opus/Sonnet/Haiku per D-000), planner reviews diffs, Saday signs off demos. No Akash gate, no external dev. | Saday | — |
| D-012 | 2026-09-17 | LOCKED | Payments = Razorpay (orders + webhooks + refunds API). Money stored as integer paise. | Prior spec; mature; Saday confirmed | — |
| D-013 | 2026-09-17 | LOCKED | Video = 100ms, room per appointment, Mumbai region, signed join tokens minted server-side, nothing recorded. | Indian vendor, residency, API | MVP brief §3.8 (Jitsi) |
| D-014 | 2026-09-17 | LOCKED | Patient auth = phone OTP (WhatsApp first, SMS fallback). Provider/admin = email + password + mandatory TOTP. HttpOnly cookies. | Saday | — |
| D-015 | 2026-09-17 | OPEN | WhatsApp BSP unknown — Saday to check in Meta Business Manager → WhatsApp Accounts → the number's "Partner"/BSP. If direct: Meta Cloud API. Messaging build blocked on this only for the send adapter; everything else proceeds behind an interface. | — | — |
| D-016 | 2026-09-17 | LOCKED | Assessment proforma keep/drop map per BUILD_PLAN §3 approved. Add **Diagnosis (ICD-11 pick-list) + Formulation + Plan** at the end. Monthly income + religion **dropped**. Full MSE in V1 (not the light version). | Saday | — |
| D-017 | 2026-09-17 | LOCKED | Prescription = photo/PDF upload into the file exchange, stored against the session. No prescription generator in V1. | Saday | MVP brief §3.9 |
| D-018 | 2026-09-17 | LOCKED | Earnings = fixed % commission per provider (admin-set). Ledger row per paid session (gross, commission, net); payouts marked manually by admin. | Saday | — |
| D-019 | 2026-09-17 | LOCKED | Bilingual EN/HI from day one for all patient-facing screens; provider/admin console EN-only. All strings keyed from first commit; Haiku drafts HI, Saday/team proofread. | Saday | — |
| D-020 | 2026-09-17 | LOCKED | Minimal admin console: providers on/off + commission %, client list, refund/payout marking, WhatsApp template list, policy settings, **follow-up flow configuration**. | Saday | — |
| D-021 | 2026-09-17 | LOCKED | Mood + sleep logs = in-app only (no WhatsApp nudges in V1). | Saday | — |
| D-022 | 2026-09-17 | LOCKED | No AI drafting in session notes for V1. | Saday — keep PHI away from third-party LLM until DPA/consent decided | — |
| D-023 | 2026-09-17 | LOCKED | Follow-up flows (post-session check-in + feedback) built from the repo's Swasthmind digest, but configured **org-wide in the admin panel, not per provider** — one consistent flow set across all providers. Proposed timing: check-in +N h (admin-set, default 24 h), feedback +24 h after check-in. Responses stored and shown on the patient panel. | Saday: consistency across providers | Swasthmind per-therapist pattern |
| D-024 | 2026-09-17 | LOCKED | Psychometrics V1 = free/public-domain tools only: PHQ-9 (EN+HI), GAD-7 (EN+HI), HAM-D-17, HAM-A, BPRS-18, YMRS, ASRS-v1.1. Licensed tools (Y-BOCS, MSI-BPD, ZAN-BPD, WURS) excluded; MDQ excluded (licence unclear). | Saday | ABC360 ROADMAP licence table |
| D-025 | 2026-09-17 | LOCKED | Build proceeds without third-party specifics. Every external service sits behind an adapter with a stub for dev: WhatsApp (BSP TBD), SMS/WhatsApp OTP delivery, Razorpay (test mode until keys), 100ms, email. Database/auth developed against local Supabase CLI; migrations applied to the Mumbai project when Saday creates it. Real keys wired in one integration pass (P5) with end-to-end tests before launch. | Saday asked; not faulty provided interfaces are fixed in P0.1 and integration pass is not skipped | — |
| D-026 | 2026-09-17 | LOCKED | Code lives in `C:\Users\dradi\Saday_CRM\app` (authored + verified in Claude's workspace, written to the folder; Saday runs `npm install` / `npm run dev` on Windows). Git-initialised there. | Saday | — |
| D-027 | 2026-09-17 | LOCKED | UI-first phase runs on **mock data shaped by 0001_schema.sql** behind the repository interface (architecture.md §5). Supabase swaps in at P2. | Saday | — |
| D-028 | 2026-09-17 | LOCKED | Components = shadcn/ui re-themed to main-site tokens. **Design language of the main site is not altered.** Conflicts → ask Saday, or pick the option closest to the main site. | Saday | — |
| D-029 | 2026-09-17 | LOCKED | `architecture.md` v1 + `0001_schema.sql` v1 approved. P1 scaffold authorised. Architectural calls inside them (exclusion constraint for double-booking; Cloudflare Cron for follow-ups; admin has no policy on clinical-body tables) stand. | Saday | — |
| D-030 | 2026-09-17 | LOCKED | Provider NMC/RCI registration numbers shown publicly on profile cards. | Saday; NMC telemedicine guidance | — |
| D-031 | 2026-09-17 | LOCKED | Phone is an attribute, not identity. Patient account keyed by internal id; admin can migrate phone after identity check. | Saday | — |
| D-032 | 2026-09-17 | LOCKED | Mobbin unavailable (paid plan). UI references come from Saday's local "Saday main site design inspiration" folder + Claude-in-Chrome scrapes of named sites when needed. MantraCare screenshots = planning input only, not design. | Saday | — |
| D-033 | 2026-09-17 | LOCKED | Mobile-first is a hard requirement: every screen designed at 360 px first, verified by screenshot at 360×780 and 1280×800 before delivery. | Saday | — |
| D-034 | 2026-09-17 | PROPOSED | "Earliest available" auto-assign always books the provider's **First consultation** type for a patient with no prior sessions; follow-up types only for returning patients. | Planner default while Saday away; reversible | — |
| D-035 | 2026-09-17 | PROPOSED | Provider console tabs: Today · Calendar · Patients · Earnings · More (Availability, Materials, Settings live under More; Today shows an "Edit availability" shortcut). | Planner default while Saday away; reversible | — |
| D-036 | 2026-09-17 | LOCKED | Model routing restated: Fable = supervisor only (briefs, review, decisions); Opus = heavy builds (provider console, clinical forms, Supabase wiring); Sonnet = mundane (fixtures, copy, screenshots, docs digests). | Saday | D-000 |
| D-037 | 2026-09-17 | PROPOSED | Schema additions surfaced by the provider build (to go into `0002_*.sql` at P2): `provider_blockouts.repeats_yearly boolean`, new `psychometric_assignments` table (tool, patient, assigned_by, due, status), `provider_notification_prefs` (or JSONB column on providers). | Opus build report; all three are mock-only today | 0001_schema.sql |
| D-038 | 2026-09-17 | PROPOSED | ICD-11 diagnosis picker seeded with ~45 common codes for V1; full chapter import deferred. | Opus build report | — |
| D-039 | 2026-09-17 | PROPOSED | Hide the EN/HI toggle for provider/admin roles (console is EN-only per D-019). | Consistency with D-019 | — |
| D-040 | 2026-09-17 | PROPOSED | Cancellation/reschedule policy placeholders in admin settings: cancel ≥24 h before → 100 % refund; reschedule ≥24 h before; max 2 reschedules. Must be reconciled with the main-site refund page before launch (architecture §14 Q4). | Sonnet build used task defaults; Saday to confirm | MVP brief §3.4 |

---

## 2 · Open items
- D-015 WhatsApp BSP identity (Saday).
- Licensing for digital administration of Y-BOCS, MSI-BPD, ZAN-BPD, WURS (Saday to confirm with licensors before those go online; public-domain/free tools proceed).
- Accounts to create/hand over: Supabase org (Mumbai), Razorpay (KYC), 100ms, Cloudflare (DNS for `app.` subdomain + Workers), transactional email (Resend or SES), GitHub repo `saday-crm`.

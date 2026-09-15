# MantraCare — Phase 2 Deep Capture (Provider Portal), Part 1

**Role**: Therapist/Provider (own/test account) · **Scanned**: 2026-09-12
**Sections covered in this part**: Clients & client record · Session Notes + note editor · AI Transcriber · AI CRM · Resources (assessment catalog)
**Still open**: Forms builder · Scheduling/Appointments/Client Leads · Prescriptions · Billing/Invoicing
**All names, contacts and record IDs are [REDACTED]. Field presence and type only.**

---

## Screen

### Clients (list)
- **Site**: MantraCare — provider portal
- **Path**: Clients (`/clients`)
- **Public or gated**: login
- **Primary purpose**: The provider's caseload list — "Manage and track all your client relationships".
- **Key UI elements**: Search box; two filter dropdowns; one data table with an info-tooltip on two column headers; row-level action icon group; rows-per-page selector; prev/next pager.
- **Data shown**: client display name + avatar, onboarding state, commercial status. No clinical data, no contact detail, no next-appointment, no last-seen date.
- **Actions available**: Add Client(s) · Search · Filter by Onboarding · Filter by Status · re-send invite (per row) · change Status inline (per row dropdown) · View (eye) · Message (chat icon) · Edit (pencil) · rows-per-page 10/25/50 · paginate
- **Notes / pain points**:
  - The table carries only 3 data columns. No last session, next session, outstanding balance, risk flag, or assigned service — so the list can't be triaged clinically; a provider must open each record to learn anything.
  - "Status" is **commercial, not clinical** — its own tooltip defines Active as "Order active" and Inactive as "No active order". There is no clinical status anywhere (in treatment / on hold / discharged).
  - Status is editable inline from the list with a single click and no confirmation — easy to mis-set.
  - Message icon appears present-but-inert for a client who has not joined.
- **Role/gating differences observed**: n/a (single role this session)
- **Screenshot ref**: [ss_0378c3i4v](screenshots/provider/clients__list__ss_0378c3i4v.png), [ss_4691tnjie](screenshots/provider/clients__list-2__ss_4691tnjie.png)

### Add New Client (modal)
- **Path**: Clients > Add Client(s)
- **Public or gated**: login
- **Primary purpose**: Provider-initiated client creation, which sends an app invite.
- **Key UI elements**: Modal; required-field asterisks; "Contact (at least one required)" grouping; country-code phone control defaulting to +91; a "Detailed view" progressive-disclosure toggle; disabled primary button until valid; "Do you want to add Multiple?" bulk link.
- **Data shown**: empty form.
- **Actions available**: Select Service · enter names/contact · toggle Detailed view · Add Client (disabled until valid) · close (X) · switch to multiple-add
- **Notes / pain points**:
  - **The intake is extremely thin — 7 fields total.** No date of birth, sex/gender, emergency contact, referral source, presenting problem, consent checkbox, or any clinical field. For a psychiatric practice this is not an intake; it is a contact record.
  - No consent capture at the point of creating a client record, even though creating one triggers an outbound invite to that person.
  - Address and Country are hidden behind a toggle and marked Optional, so most records will lack them — which will later break insurance and lab-test flows that need an address.
  - Service is required and constrained to the services this provider is approved for, so a client cannot be created outside the provider's credentialed scope. Sensible, but it also means one human client needs one record per service line.
- **Screenshot ref**: [ss_7610g8s9f](screenshots/provider/clients__add-modal-1__ss_7610g8s9f.png), [ss_2529q65q8](screenshots/provider/clients__add-modal-2__ss_2529q65q8.png), [ss_7051i3mjf](screenshots/provider/clients__add-modal-3__ss_7051i3mjf.png)

### Client record
- **Path**: Clients > [client] (`/clients/[clientId]/profile`)
- **Public or gated**: login
- **Primary purpose**: Per-client hub.
- **Key UI elements**: Back arrow; service badge (top-right); identity card (avatar, name, record ID); single "Actions" card with 5 large tiles.
- **Data shown**: display name, record ID (rendered **twice** — once under the name and once top-right, a visible duplication defect), service line.
- **Actions available**: Appointments · Notes · Prescriptions · Invoicing · Insurance
- **Notes / pain points**:
  - **The chart is 5 tiles, not a chart.** The route table declares 13 client sub-routes (`client-info`, `session-notes`, `journal`, `insights`, `pathways`, `tools`, `orders`, `billing`, `client-billing`, `insurance`, `claims`, `claims/new`, `claims/[claimId]/form`) but only 5 are surfaced in this state — the client here is Prospective/Invite-Sent, so journal, insights, pathways and tools are conditionally hidden. Gating clinical navigation on commercial state is a notable design choice.
  - No demographics, no problem list, no medication list, no allergy field, no risk flag, and no activity timeline on the record itself.
  - Tiles navigate **away** to global tools pre-filtered by client rather than into client-scoped views — "Notes" lands on `/tools/session-notes`, not `/clients/[id]/session-notes`. The client context is a dropdown, not a container, so it is easy to lose your place.
- **Screenshot ref**: ss_6691gvev7 *(not re-captured — see EVIDENCE.md)*

### Session Notes (list)
- **Path**: Tools > Session Notes (`/tools/session-notes`)
- **Public or gated**: login
- **Primary purpose**: "View and manage all session notes across clients".
- **Key UI elements**: Client-scope dropdown in the header; primary "+ Add Notes"; search by **client name or template**; Filter button; empty state.
- **Data shown**: none (empty account).
- **Actions available**: select client scope · + Add Notes · search · Filter
- **Notes / pain points**: Notes are searchable by template name, which confirms template identity is stored on the note. No visible sign/lock/co-sign state, no date range filter surfaced at this level, no export.
- **Screenshot ref**: [ss_4107by1qp](screenshots/provider/notes__list__ss_4107by1qp.png)

### Add Session Notes (wizard)
- **Path**: Session Notes > + Add Notes
- **Public or gated**: login
- **Primary purpose**: Pick the client, then the session, that a note will attach to.
- **Key UI elements**: 2-step wizard with "Step 2 of 2" label; "Back to clients"; client card showing available-session count; session rows showing date, time and **modality**; a full-width escape hatch.
- **Data shown**: session date/time and modality ("In-Person"), available-session count.
- **Actions available**: Back to clients · select a session · **+ Add Note Without Session**
- **Notes / pain points**: Notes can be written with no session attached, which is operationally useful and clinically risky — an unattached note has no encounter to anchor its date or billing to.
- **Screenshot ref**: [ss_7174hz6i8](screenshots/provider/notes__add-wizard__ss_7174hz6i8.png)

### Session Note editor  ← the most important screen captured
- **Path**: Session Notes > + Add Notes > [session]
- **Public or gated**: login
- **Primary purpose**: Author a structured, template-driven session note, optionally generated from an AI transcript.
- **Key UI elements**: Two-pane split — left "Session Note" form, right "AI Assistance — Transcript & Note Generator" with **Transcript | Noteworthy** tabs and a collapse chevron; note Language selector; Template selector with type-ahead search; "Template Content" field block; file drop zone; Cancel / Save Note footer.
- **Data shown**: empty note.
- **Actions available**: choose Language (~108 options) · choose Template (26 options) · fill fields · attach files · collapse/expand AI pane · switch Transcript/Noteworthy · + Add Transcript · Cancel · Save Note
- **Notes / pain points**:
  - **Both AI tabs are inert without a transcript** ("No transcript found") — the AI assistance is transcript-conditional, not a general drafting aid.
  - **Risk Factors is a 4-option flat list** (None / Suicidal Ideation / Homicidal Ideation / Other) with no severity, no ideation-vs-intent-vs-plan-vs-means breakdown, no protective factors, no means-restriction prompt, and **no forced follow-up action when Suicidal Ideation is chosen**. A dedicated "Suicide Risk Assessment Session Note" template exists separately, so risk assessment is a template you must remember to choose rather than a safety net the system enforces.
  - **Recommendation offers no escalation option** — Continue / Change Goals / Terminate only. No "refer out", "increase frequency", "consult psychiatry", "admit".
  - Medications is **free text**, not a structured drug/dose/frequency list, despite this provider being credentialed as Psychiatrist and a separate Prescriptions module existing. Medication data will not reconcile between the two.
  - No diagnosis/ICD or CPT field on the Basic Template (a separate "Diagnosis and Treatment Objective" template carries it), so coding is template-dependent.
  - No autosave indicator, no draft state, no sign/lock, no amendment trail visible.
  - Only two action buttons (Cancel / Save Note) — nothing distinguishes save-draft from finalize.
  - **Defect observed**: pressing Escape does not close an open dropdown, and dropdown option lists overlay the field beneath them. A click aimed at the next field lands inside the open list and silently toggles an option in the previous field. (Encountered and reverted during this scan; nothing was saved.)
- **Screenshot ref**: [ss_8379pptyy](screenshots/provider/notes__editor-1__ss_8379pptyy.png), [ss_1652tjxyf](screenshots/provider/notes__editor-2__ss_1652tjxyf.png), [ss_5049qxpm4](screenshots/provider/notes__editor-3__ss_5049qxpm4.png), [ss_0983h5c2z](screenshots/provider/notes__editor-4__ss_0983h5c2z.png), [ss_0135cjoov](screenshots/provider/notes__editor-5__ss_0135cjoov.png)

### AI Transcriber / Notes
- **Path**: Tools > AI Transcriber (`/tools/ai-transcriber`)
- **Public or gated**: login
- **Primary purpose**: "Record and transcribe sessions with AI-powered notes" — the transcript library feeding the note editor.
- **Key UI elements**: Client-scope dropdown; primary "+ Add Transcript"; search by client name; Filter; three KPI tiles (Total / Completed / This Week); empty state.
- **Data shown**: counts only (all zero).
- **Actions available**: select client · + Add Transcript · search · Filter
- **Notes / pain points**: A "Completed" counter distinct from "Total" implies an async processing state machine (queued → processing → completed) but no per-item status legend is offered. **"+ Add Transcript" was NOT exercised** — its effect is ambiguous (it may begin a live microphone recording), so per the scan constraints it was left alone pending your say-so.
- **Screenshot ref**: [ss_71281wk9q](screenshots/provider/ai-transcriber__ss_71281wk9q.png)

### AI CRM (MantraAssist)
- **Path**: Tools > AI CRM (`/ai-crm`)
- **Public or gated**: login
- **Primary purpose**: **Not a feature — a partner upsell page.** "AI CRM Integration with MantraAssist · Free Trial for Mantra Users (Exclusive)".
- **Key UI elements**: YouTube video embed; claim tiles (TIME SAVED 15+ hrs, RETENTION +40%, RESPONSE <5 min); feature cards badged CORE / SMART / Premium; tab counts "Core Features (4) / Smart AI (2) / Premium (2)"; outbound CTAs "Get Started with AI CRM" (external-link icon) and "Learn More".
- **Data shown**: marketing copy only.
- **Actions available**: play video · Get Started with AI CRM (external) · Learn More
- **Notes / pain points**:
  - The sidebar presents "AI CRM" as a product module; it is an ad for a **third-party product on a different brand**. A provider clicking it in search of CRM features finds a sales page.
  - 8 advertised features: AI Appointment Scheduling (CORE), Smart Appointment Reminders (CORE), AI-Powered Client Follow-Ups (SMART), Automated Client Intake (CORE), Smart Waitlist Management (SMART), [analytics: "trends, session patterns, and revenue forecasting"], Multi-Channel Communication (CORE) — i.e. the automation layer MantraCare itself lacks is being sold as an add-on.
  - Advertised to cover "both Mantra and non-Mantra clients" — positioned as the provider's whole-practice CRM, outside MantraCare's own data boundary.
- **Screenshot ref**: [ss_1580l635c](screenshots/provider/ai-crm__mantraassist__ss_1580l635c.png)

### Resources (assessment & tool catalog)
- **Path**: Tools > Resources (`/tools/canned-response` — route name and screen name disagree)
- **Public or gated**: login
- **Primary purpose**: "Access assessments, exercises, and resources for your clients" — the library a provider sends to clients.
- **Key UI elements**: Service selector (scopes the whole library); "+ Add resource"; 8 accordion categories with per-category tool counts; per-item **View** and **Send** buttons.
- **Data shown**: catalog names and counts.
- **Actions available**: switch service scope · Add resource · open a category · View an item (**opens app.mantracare.org in a new tab**) · **Send** an item to a client (NOT exercised — outbound to a real person)
- **Notes / pain points**:
  - Resources are scoped per **service**, not per client need, so the same clinical instrument must be re-listed per service line.
  - "Paid Assessments (Refer to Self)" and "Paid Assessments (Refer Outside)" contain the **identical 12 instruments** — the only difference is who gets paid. That is a billing distinction presented as a clinical one.
  - Providers can add their own resources ("Your Resources", 0 here), so the library is extensible.
  - **View leaves the .com estate entirely** for `app.mantracare.org/en/therapyapp/...` — the instruments live on a separate property.
- **Screenshot ref**: ss_0479w1zro, ss_7529oo2l4, ss_826318mhj

---

## Features

| Section | Feature | Sub-capability | Present? (Yes/Partial/Unknown) | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| Clients | Caseload list | Search by name/email | Yes | 3 | Works; no advanced/saved search |
| Clients | Caseload list | Filter by onboarding state | Yes | 4 | Clear 4-state enum with in-product definitions |
| Clients | Caseload list | Filter by commercial status | Yes | 3 | 5-state enum, but conflates commerce with care |
| Clients | Caseload list | Clinical triage columns | **No** | 1 | No last/next session, risk, balance or service column |
| Clients | Caseload list | Bulk actions / export | **No** | 1 | No multi-select, no CSV export |
| Clients | Caseload list | Inline status edit | Yes | 2 | One click, no confirmation, no audit shown |
| Clients | Client creation | Minimal contact intake | Yes | 3 | 7 fields; invite sent on create |
| Clients | Client creation | Clinical/demographic intake | **No** | 1 | No DOB, sex, emergency contact, presenting problem |
| Clients | Client creation | Consent capture at creation | **No** | 1 | None, despite triggering an outbound invite |
| Clients | Client creation | Bulk add | Partial | 3 | "Do you want to add Multiple?" — not opened |
| Clients | Client record | Identity header | Yes | 2 | Record ID rendered twice (defect) |
| Clients | Client record | Demographics / problem list / meds / allergies | **No** | 1 | Absent from the record surface |
| Clients | Client record | Activity timeline | **No** | 1 | No chronological view of the episode of care |
| Clients | Client record | Conditional module gating | Yes | 2 | Journal/insights/pathways/tools hidden for non-joined clients |
| Notes | Template library | Modality-specific templates | Yes | **5** | 26 templates incl. ACT, CBT, DBT, EMDR, IFS, Gottman, TF-CBT, SOAP |
| Notes | Template library | Type-ahead template search | Yes | 4 | Searchable picker |
| Notes | Template library | Psychiatry / med-management note | **No** | 1 | No E&M or med-review template despite selling Psychiatry |
| Notes | Template library | DAP / BIRP formats | **No** | 3 | SOAP present, DAP/BIRP absent |
| Notes | Structured fields | Mental-status style enums | Yes | 4 | Cognitive Functioning, Affect as multi-selects |
| Notes | Structured fields | Intervention coding | Yes | 4 | 15-item intervention enum — genuinely useful |
| Notes | Structured fields | Structured risk assessment | Partial | **1** | 4 flat options; no severity/intent/plan/means; no enforced action |
| Notes | Structured fields | Structured medication list | **No** | 1 | Free text only; will not reconcile with Prescriptions |
| Notes | Structured fields | Diagnosis / ICD / CPT coding | Partial | 2 | Only via a separate template |
| Notes | Note lifecycle | Attach to session or standalone | Yes | 3 | "Add Note Without Session" permitted |
| Notes | Note lifecycle | Draft / autosave | Unknown | 2 | No indicator; only Cancel / Save Note |
| Notes | Note lifecycle | Sign / lock / co-sign / amendment trail | **No** | 1 | Nothing visible — a supervision and audit gap |
| Notes | Attachments | File upload to note | Yes | 4 | PDF/Excel/CSV/Word/JPG/PNG, 10MB cap |
| Notes | Localisation | Note language | Yes | **5** | ~108 languages |
| AI | Transcription | Transcript library + status counters | Yes | 3 | Total/Completed/This Week; state machine implied |
| AI | Transcription | Transcript → note generation | Yes | 4 | In-editor right pane; gated on a transcript existing |
| AI | Transcription | "Noteworthy" extraction | Yes | Unknown | Second tab; inert without a transcript |
| AI | Transcription | Capture method (live rec. vs upload) | Unknown | — | "+ Add Transcript" deliberately not clicked |
| AI | CRM / automation | Native automation (reminders, waitlist, follow-ups) | **No** | 1 | Sold as third-party MantraAssist add-on |
| Resources | Assessment catalog | Free symptom screeners | Yes | 3 | 6, named by symptom not instrument |
| Resources | Assessment catalog | Paid clinical instruments | Yes | 4 | 12 recognised instruments |
| Resources | Assessment catalog | Send instrument to client | Yes | Unknown | Not exercised (outbound) |
| Resources | Assessment catalog | Provider-authored resources | Yes | 3 | "Your Resources" |
| Resources | Cross-referral | Refer to other service lines | Yes | 3 | 6 destinations — marketplace revenue loop |
| Resources | Scoping | Per-service library scoping | Yes | 2 | Forces duplication across service lines |

---

## Data-fields

| Entity | Field | Type (guess) | Required? | Enum values | PII/PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Client | Display name | string | Yes | — | **PII** | Clients list | First + Last composed |
| Client | First name | string | Yes | — | **PII** | Add New Client | |
| Client | Last name | string | No | — | **PII** | Add New Client | Optional |
| Client | Email | string(email) | Conditional | — | **PII** | Add New Client | One of email/phone required |
| Client | Phone | string(tel) + country code | Conditional | ~195 dial codes, default +91 | **PII** | Add New Client | |
| Client | Country | enum | No | ~195 countries | PII | Add New Client | Behind Detailed view |
| Client | Address | text | No | — | **PII** | Add New Client | Behind Detailed view |
| Client | Service | enum (relation) | Yes | Psychiatrist, General Physician, Addiction Treatment, OCD *(this provider's approved set)* | — | Add New Client | Scoped to provider credentials |
| Client | Record ID | int | system | — | PII (indirect) | Client record | Displayed twice |
| Client | Onboarding state | enum | system | Invite Sent (awaiting response), Joined (registered), Expired (invitation expired), Not Sent | — | Clients list | Definitions from in-product tooltip |
| Client | Status | enum | Yes | Active (order active), Inactive (no active order), Archived (no longer active), Switched (moved to another expert), Prospective (potential client) | — | Clients list | **Commercial, not clinical** |
| Client | Avatar | file/url | No | — | PII | Clients list | Placeholder shown |
| Session | Date + time | datetime | Yes | — | PHI (indirect) | Add Session Notes | |
| Session | Modality | enum | Yes | In-Person (+ video/chat implied elsewhere) | — | Add Session Notes | Only In-Person observed |
| Session | Available-session count | int | system | — | — | Add Session Notes | Drives note eligibility |
| SessionNote | Language | enum | Yes (default English) | ~108 languages | — | Note editor | |
| SessionNote | Template | enum (relation) | Yes | 26 templates (listed below) | — | Note editor | Searchable |
| SessionNote | Cognitive Functioning | enum (multi) | No | Oriented/Alert, Disorganized, Preoccupied, Circumstantial, Not Assessed | **PHI** | Note editor | Checkbox multi-select |
| SessionNote | Affect | enum (multi) | No | Appropriate, Inappropriate, Constricted, Blunted, Flat, Not Assessed | **PHI** | Note editor | |
| SessionNote | Functioning Status, Symptoms or Impairments | text | No* | — | **PHI** | Note editor | Placeholder says "Enter required details" but no asterisk — required-ness ambiguous |
| SessionNote | Risk Factors | enum | No | None, Suicidal Ideation, Homicidal Ideation, Other | **PHI (high sensitivity)** | Note editor | No severity/intent/plan/means sub-fields |
| SessionNote | Medications | text | No | — | **PHI** | Note editor | Free text, unstructured |
| SessionNote | Interventions | enum (multi) | No | ACT, CBT, Cognitive Challenging, Cognitive Refocusing, Cognitive Reframing, Communication Skills, DBT, Exploration of Coping Patterns, Exploration of Emotions, Exploration of Relationship Patterns, Exposure Therapy, Guided Imagery, MBCT, Problem Solving, Other | **PHI** | Note editor | 15 values |
| SessionNote | Treatment Plan | text | No | — | **PHI** | Note editor | Single-line input, not a textarea |
| SessionNote | Supporting Documents | file[] | No | PDF, Excel, CSV, Word, JPG, PNG · max 10MB | **PHI** | Note editor | Select File or drag-n-drop |
| SessionNote | Recommendation | enum | No | Continue Current Therapeutic Focus, Change Treatment Goals or Objectives, Terminate Treatment | **PHI** | Note editor | No escalation/referral option |
| Transcript | Client | relation | Yes | — | PII | AI Transcriber | |
| Transcript | Status | enum | system | (Total / Completed implied; queued/processing inferred) | — | AI Transcriber | No legend shown |
| Transcript | Created week flag | derived | system | — | — | AI Transcriber | "This Week" tile |
| Resource | Name | string | Yes | — | — | Resources | |
| Resource | Category | enum | Yes | Your Resources, Referral Links, Free Assessments, Paid Assessments (Refer to Self), Paid Assessments (Refer Outside), Exercises, Refer Other Services, Others | — | Resources | 8 categories |
| Resource | Service scope | enum (relation) | Yes | provider's approved services | — | Resources | |
| Resource | External target | url | — | app.mantracare.org/... | — | Resources | View opens off-domain |

---

## Assessment-catalog (provider-side view)

| Test name | Screens for | Maps to instrument? | # questions | Result format | Requires login? | Upsell after result | Source URL |
|---|---|---|---|---|---|---|---|
| Anxiety | Anxiety symptoms | Not stated (symptom-branded) | not captured | not captured | Provider sends; client side gated | — | app.mantracare.org/en/therapyapp/anxiety-check/ |
| Depression | Depressive symptoms | Not stated | not captured | not captured | as above | — | app.mantracare.org (.org estate) |
| Stress | Stress | Not stated | not captured | not captured | as above | — | as above |
| Addiction | Substance use | Not stated | not captured | not captured | as above | — | as above |
| Relationship | Relationship distress | Not stated | not captured | not captured | as above | — | as above |
| Anger | Anger | Not stated | not captured | not captured | as above | — | as above |
| HAM-A | Anxiety severity | **Yes** — Hamilton Anxiety Rating Scale | not captured | not captured | paid | Refer to Self / Refer Outside | .org estate |
| HAM-D | Depression severity | **Yes** — Hamilton Depression Rating Scale | not captured | not captured | paid | as above | .org estate |
| YBOCS | OCD severity | **Yes** — Yale-Brown Obsessive Compulsive Scale | not captured | not captured | paid | as above | .org estate |
| TAT | Projective personality | **Yes** — Thematic Apperception Test | not captured | not captured | paid | as above | .org estate |
| MCMI | Personality / clinical syndromes | **Yes** — Millon Clinical Multiaxial Inventory | not captured | not captured | paid | as above | .org estate |
| PANSS | Psychosis symptoms | **Yes** — Positive and Negative Syndrome Scale | not captured | not captured | paid | as above | .org estate |
| ADHD | ADHD | Likely a standard scale; not named | not captured | not captured | paid | as above | .org estate |
| DAPT | (Draw-A-Person Test, probable) | Probable — not confirmed | not captured | not captured | paid | as above | .org estate |
| Gender Dysphoria | Gender dysphoria | Not stated | not captured | not captured | paid | as above | .org estate |
| MBTI | Personality type | **Yes** — Myers-Briggs Type Indicator | not captured | not captured | paid | as above | .org estate |
| Big Five Test | Personality traits | **Yes** — Five Factor Model | not captured | not captured | paid | as above | .org estate |
| Career Profiler | Career/vocational fit | Not a clinical instrument | not captured | not captured | paid | as above | .org estate |

**Observations for your own build**
- The free tier is **symptom-branded** (Anxiety, Depression…) while the paid tier is **instrument-branded** (HAM-A, YBOCS…). Free screeners carry no instrument attribution, so their scores are not defensible in a record.
- **No PHQ-9 and no GAD-7 anywhere** — the two instruments most likely to be expected by a payer or a referring physician are absent.
- HAM-A, HAM-D, YBOCS and PANSS are **clinician-administered** rating scales, not self-report. Offering them as items a provider "sends" to a client is a methodological mismatch worth not copying.
- MBTI, Big Five and Career Profiler sit in the same paid list as clinical instruments, with no separation between psychometric-clinical and self-development content.
- The Refer-to-Self vs Refer-Outside split is a **revenue-routing** distinction dressed as a clinical one.

### The 26 session-note templates
Acceptance and Commitment Therapy · Art Therapy · Basic Template · Brief Progress Note · Cognitive Behavioral Therapy · Cognitive Processing Therapy · Couples Therapy · Diagnosis and Treatment Objective · Dialectical Behavior Therapy · Eating Disorder · EMDR · Emotionally Focused Therapy · Gestalt Therapy · Gottman Method Couples Therapy · Internal Family Systems · Interpersonal Therapy · Music Therapy · Narrative Therapy · Perinatal/Postpartum · Person-Centered Therapy · Play Therapy · SOAP Template · Solution-Focused Therapy · Somatic Experiencing · Suicide Risk Assessment · Trauma-Focused CBT

---

## Integration

| Category | Function | Vendor (if visible) | Direction (in/out/both) | Where observed | Notes |
|---|---|---|---|---|---|
| Frontend framework | SPA delivery | Next.js (build `U7gOfFeQqX9z-GWGed_b7`) | — | provider portal | Route manifest publicly readable |
| CSS framework | Styling | Tailwind CSS (default token values) | — | provider portal | Inferred from computed styles |
| CDN / analytics | Delivery + RUM | Cloudflare (`cloudflareinsights.com`) | out | provider portal `<script>` | Beacon present |
| Auth | Social sign-in | Google OAuth | both | client app login | `/login/oauth/[provider]` |
| Auth | Enterprise SSO | SAML (vendor not shown) | both | client app route `/saml/sso` | Corporate lane |
| CMS | Marketing site | WordPress 7.1 + Elementor | — | mantracare.com | Elementor popups used for lead capture |
| CMS bridge | Content proxy | WordPress | in | `/wp/[...]`, `/wp-redirect` in **both** apps | Legacy content stitched into apps |
| Video | Marketing embed | YouTube | out | `/ai-crm` (`youtube.com/embed/-fyJLcigKkc`) | |
| Partner product | AI CRM / automation | **MantraAssist** | out | `/ai-crm` | Third-party, external CTA |
| Assessment delivery | Test hosting | **app.mantracare.org** (separate property) | out | Resources > View | Different TLD — see open question |
| Chat | Website chat widget | not yet identified | both | web.mantracare.com plan pages | Bottom-right launcher |
| Localisation | Language list | ~108 languages (Google-Translate-shaped list) | — | Note editor | Suggests a translation service behind notes |

---

## Design-audit

### Provider portal — app shell / form template
- **Colors**: Text `#111827` (headings) · `#374151` (labels) · Border `#d1d5db` (inputs) · Surface `#ffffff` · Accent/primary `#1e40af`–`#2563eb` family (dark-blue primary buttons, blue table header) · Category accent colors used for counts (orange, blue, purple, green, pink) · Icon tiles use a 9-hue pastel set on the dashboard
- **Typography**: Tailwind default stack (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, …`). Body 16px. H1 26px/600. Field labels 14px/500. No custom webfont on the app (the marketing site uses a different, geometric display face).
- **Buttons**: Primary = solid dark blue, white text, ~6px radius, medium weight. Secondary = white with grey border. Tertiary = plain blue text link ("View", "Learn More"). Destructive variant not observed. Disabled = grey fill, grey text (Add Client).
- **Layout**: Fixed left sidebar (~256px) with collapse chevron, grouped nav plus a "Show more" group; content area max-width-constrained and centered with generous card padding; card-based sections with ~12px radius and soft shadow; 8px spacing rhythm. Note editor switches to a two-pane split with a collapsible right rail.
- **Components**: cards, data table with tooltip-bearing headers, custom searchable single- and multi-select dropdowns, accordion category list, modal with progressive-disclosure toggle, 2-step wizard, KPI stat tiles, file drop zone, banner/promo strips, avatar chips, pagination.
- **Accessibility signals**:
  - 12 `<label>` elements against 6 form controls on the note editor — labels are not reliably bound to inputs; several "labels" are plain text nodes above a div-based control.
  - Custom dropdowns are `<button>`/`<div>` based with no visible `role="listbox"`/`role="option"` semantics, and **Escape does not close them** — keyboard operation is impaired.
  - Focus rings are present on native inputs (blue outline) but not obviously on the custom dropdowns.
  - Images all carry `alt` (3/3 on the editor).
  - Placeholder text is used to convey required-ness ("Enter required details") without a programmatic `required` marker — fails as the only signal.
  - Grey-on-white secondary text (`#6b7280`-ish on `#ffffff`) in card subtitles is close to the 4.5:1 floor at 14px.
- **Screenshot ref**: [ss_5049qxpm4](screenshots/provider/notes__editor-3__ss_5049qxpm4.png) (form), [ss_0378c3i4v](screenshots/provider/clients__list__ss_0378c3i4v.png) (table), [ss_62924duj1](screenshots/provider/dashboard__home__ss_62924duj1.png) (dashboard)

---

## Phase 2 (part 1) status block

- **Section / flow**: Clients & client record · Session Notes + editor · AI Transcriber · AI CRM · Resources
- **Screens captured**: 9 (plus 20 screenshots)
- **Features identified**: 40 rows
- **Integrations noted**: 12
- **Data fields catalogued**: 36
- **Blocking questions**: 2 — see below

### Blocking questions
1. **`app.mantracare.org` is off the scope you set.** The Resources "View" action opens the actual assessment instruments on `app.mantracare.org/en/therapyapp/<test>/` — a different top-level domain. The instrument question sets, scoring and result screens all live there. May I read that property? It is the only way to fill the "# questions / result format" columns above.
2. **"+ Add Transcript"** (AI Transcriber and the note editor) has an ambiguous effect — it may start a live microphone recording. Do you want me to open it?

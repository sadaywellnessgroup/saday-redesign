# SwasthMind CRM — Phase 3: Flows
**Compiled:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin
**Source:** Synthesized from Phase 1 Reconnaissance + Phase 2 module scans (Conversations, Reports, My Therapists, My Clients, Sessions, Manual Booking, Assessments, My Schedule, Cancellation & Reschedule Policy, Session Follow-ups)

> **Scope note:** Flows for Seminars, Ecommerce, Bulk Messages, Internships/Career, and FAQ & Tutorials were NOT scanned in Phase 2. Where Phase 1 data supports inference, a partial/inferred flow is noted with [INFERRED]. All other flows are derived from direct observation.

---

## FLOW SCHEMA

Each flow entry uses the following structure:

| Field | Description |
|---|---|
| Flow ID | Unique identifier (FL-01, FL-02 …) |
| Name | Descriptive name |
| Trigger | What initiates the flow |
| Actors | Client / WhatsApp Bot / Admin / Therapist / System / Meta |
| Steps | Ordered step sequence |
| Decision Points | Branches / conditions that alter the path |
| Systems Touched | CRM modules / external services involved |
| Gaps / Anomalies | Missing links, bugs, dead-ends observed |

---

## FL-01 — WhatsApp Lead Acquisition → Conversation Log

**Trigger:** Prospective client sends any message to the organisation's WhatsApp Business number.

**Actors:** Client (WhatsApp), WhatsApp Bot (automated), CRM System

**Steps:**
1. Client sends first WhatsApp message to the clinic's WhatsApp Business number.
2. WhatsApp bot receives the message and responds with the **Main menu** (system event: "Main menu provided").
3. Client selects a menu option:
   - "Appointment booking" → triggers **Appointment flow initiated** (system event logged).
   - "Know about our experts" → triggers **Company information flow sent** (system event logged).
   - Other options → additional bot flows (inferred from menu structure; not fully mapped in scan).
4. Bot captures client phone number as the conversation identifier (Id = phone number).
5. Conversation is stored in the CRM under **Conversations → Users Chats** (/my-conversations).
6. AI analysis engine automatically runs on the conversation:
   - Assigns **Conversational Tag** (category): Therapy Potential 🔴 / Emotional Distress 🟠 / Information / Exploration 🔵 / Transactional / Admin ⚪ / SOS 🟣
   - Assigns **Urgency Level** (1–5 scale)
   - Generates **AI Summary** (paragraph)
   - Extracts **Key Themes** (tag chips)
7. Admin can view conversation list filtered by Analysis Category.
8. Admin can click ⓘ per row to view Conversation Analysis modal.
9. Admin can click 👁 per row → Conversation Details → View Conversation (Chat History modal) to read full transcript.
10. Admin can click "Summarise" per row to trigger on-demand AI re-analysis.

**Decision Points:**
- Client selects "Appointment booking" → FL-02 (bot-initiated booking flow) is triggered.
- Client selects "Know about our experts" → company info sent; no booking initiated.
- AI assigns SOS category → admin should intervene (no automated SOS escalation observed).
- Client is "Unknown" (name not collected yet) → conversation stored with "Unknown" as name.

**Systems Touched:** WhatsApp Business API, WhatsApp Bot engine, CRM Conversations module, AI/LLM analysis engine

**Gaps / Anomalies:**
- Admin CANNOT reply to conversations from CRM — read-only view only. No agent-to-client WhatsApp messaging capability observed.
- SOS urgency flagging has no automated escalation or alert mechanism visible in UI — relies on admin manually reviewing the list.
- Duplicate-name rows observed (same name + phone number appearing as multiple rows) — possible session-grouping bug.
- "Unknown" contacts: bot captures phone before name — creating orphan records.
- No "Mark as handled" or status flag on conversations.

---

## FL-02 — Bot Appointment Booking Flow (Client Self-Service)

**Trigger:** Client selects "Appointment booking" in WhatsApp bot main menu (see FL-01 Step 3).

**Actors:** Client (WhatsApp), WhatsApp Bot

**Steps:**
1. Bot sends appointment flow to client (system event: "Appointment flow initiated").
2. Client interacts with bot flow to select:
   - Therapist preference (inferred — not directly observed in bot transcript)
   - Session type
   - Available slot (slot-based, not calendar-picker)
3. Bot collects payment link / payment confirmation (inferred from "payment link hardwired to booking" observation in Phase 2).
4. Booking is created in the system.
5. Session appears in **Upcoming Sessions** (/my-upcoming) under Admin view.
6. Client is added to **My Clients** (/my-clients) if not already present (source = "Whatsapp" or "Web bot").

**Decision Points:**
- No slots configured for a therapist → booking cannot proceed (slot-based model; empty listbox when no slots exist).
- Payment required before booking confirmed (inferred — "+ Create Booking & Send Payment Link" button observed in Manual Booking).
- Client already exists → record updated; new client → new record created.

**Systems Touched:** WhatsApp Bot, Slot scheduling (My Schedule), Payment link generator, My Clients, Upcoming Sessions

**Gaps / Anomalies:**
- Bot booking flow internals not directly observable from CRM (bot logic is external to scanned screens).
- Slot availability depends on therapist configuring slots in **My Schedule** — if no slots, booking is impossible (confirmed: Date dropdown empty when no slots configured).
- Payment link is bundled into booking; no separate payment-only flow observed.
- Web bot acquisition channel listed as option in My Clients filter but bot interaction not observed; likely parallel channel with different entry point.

---

## FL-03 — Admin Manual Booking

**Trigger:** Admin decides to book a session on behalf of a client (e.g., phone inquiry, existing client rebooking).

**Actors:** Admin, Client (referenced, not active)

**Steps:**
1. Admin navigates to **Manual Booking** (/manual-booking) → New Booking tab.
2. Admin selects **Therapist** from dropdown (10 therapists available).
3. Admin selects **Session Type** from dropdown (options cascade from selected therapist; e.g., One-on-One Therapy, Psychiatric Consultation).
4. Admin selects **Session Mode** (Online / Offline).
5. Admin selects **Date** from dropdown (slot-based; only pre-configured slots appear; listbox empty if no slots).
6. Admin enters client **Phone Number** and **Name**.
7. Admin clicks **"+ Create Booking & Send Payment Link"** → booking created and payment link dispatched to client via WhatsApp.
8. Booking appears in **Appointment History** tab (/manual-booking → Appointment History) with status "Upcoming".
9. Booking also appears in **Upcoming Sessions** (/my-upcoming).

**Decision Points:**
- No slots configured for selected therapist → Date dropdown empty; booking cannot proceed. Admin must first configure slots in My Schedule (FL-08).
- Session Type list is empty if no session types configured for that therapist (cascade dependency).
- Payment link is always sent — no "book without payment" option observed.

**Systems Touched:** Manual Booking module, My Schedule (slot source), Session type config (My Therapists Practice Details), Payment link generator, WhatsApp (delivery of payment link), Upcoming Sessions

**Gaps / Anomalies:**
- Admin cannot book without sending a payment link — no "book and invoice later" option observed.
- No client search/lookup when entering phone — admin must know the client's details.
- Session mode (Online/Offline) selection exists but no video link generation observed.
- Appointment History shows 8 columns but no "Notes" or "clinical reason for visit" field.

---

## FL-04 — Session Completion → Billing Record Creation

**Trigger:** A booked session reaches its scheduled end time and is marked completed (system-automated, inferred).

**Actors:** System (automated), Therapist (completes session)

**Steps:**
1. Session slot time passes / session is marked as completed.
2. Session moves from **Upcoming Sessions** (/my-upcoming) to **Completed Sessions** (/completed-sessions).
3. Billing record is automatically created in **Reports** (/my-report):
   - Sr No assigned (sequential)
   - Client Name, Email, Phone linked from booking
   - Mode (Online/Offline), Type (session type name), Date recorded
   - Price (₹) from therapist's session type pricing config
   - Invoice ID generated (format: SS-{sequential number})
4. Invoice PDF generated (downloadable via "Download Invoice SS-{n}" button in Reports list).
5. Session detail becomes accessible at /my-report/{id}/show with: Email, Phone, Price, Booking Time, Session Date, Start Time, End Time, Duration.

**Decision Points:**
- Session type price set in therapist's Practice Details → used for billing.
- Domestic vs International pricing: system uses domestic INR price for India-based clients (international tier exists but selection mechanism not observed in booking flow).

**Systems Touched:** Session scheduler, Completed Sessions, Reports/Billing module, Invoice PDF generator

**Gaps / Anomalies:**
- No "mark session as completed" button observed in Admin UI — completion appears automated by time.
- No clinical notes or session outcome recorded in the billing record (Reports only contains billing fields, not clinical data).
- Invoice numbering observed up to SS-46 but only 24 records visible in Reports — gap suggests some records were deleted or the sequence includes archived/voided sessions.
- No running revenue total / summary row in Reports list — admin must export or manually sum.
- Duration hardcoded at 20 minutes for all Psychiatric Consultation sessions observed — no variable duration visible.

---

## FL-05 — Client Cancellation / Reschedule (Policy-Enforced)

**Trigger:** Client initiates session cancellation or reschedule request (via WhatsApp bot or other channel).

**Actors:** Client (WhatsApp Bot), WhatsApp Bot, System, Admin

**Steps (Cancellation):**
1. Client sends cancellation request (via WhatsApp bot or other channel — bot internals not observed).
2. System checks **Cancellation Policy** (/organisation-policies):
   - Is Allow Session Cancellation = ON? If OFF → cancellation blocked.
   - Is cancellation request ≥ 8 hours before session start? If < 8 hours → cancellation blocked.
3. If allowed: session is cancelled; refund process initiated (100% refund per current policy).
4. Admin is responsible for manually processing the refund (no automated payment gateway refund observed).
5. Cancelled session removed from Upcoming Sessions / moved to history.

**Steps (Reschedule):**
1. Client sends reschedule request.
2. System checks **Reschedule Policy**:
   - Is Allow Session Rescheduling = ON? If OFF → blocked.
   - Is request ≥ 3 hours before session start? If < 3 hours → blocked.
   - Has client already used their 1 reschedule for this booking? If yes → blocked.
3. If allowed: client selects new slot (slot-based; via bot).
4. Booking updated to new slot.
5. Remaining reschedule count for that booking decremented (max 1 reschedule per booking).

**Decision Points:**
- Cancellation allowed: notice ≥ 8 hours + toggle ON → proceed.
- Cancellation blocked: < 8 hours OR toggle OFF → client informed; session remains.
- Reschedule allowed: notice ≥ 3 hours + max count not exceeded + toggle ON → proceed.
- Reschedule blocked: any condition fails → client informed; session remains.
- Refund percentage: currently 100%; admin manually processes.

**Systems Touched:** Cancellation & Reschedule Policy (/organisation-policies), WhatsApp Bot, Session booking records, Manual refund (external, org-managed)

**Gaps / Anomalies:**
- No automated refund processing — admin must manually refund via separate payment system.
- Policy is org-wide only — no per-therapist or per-session-type policy exceptions.
- No audit log of cancellation/reschedule events visible in CRM.
- No "admin-initiated cancellation" flow observed (only client-initiated modeled by policy).
- Rescheduling to a new slot requires slots to be available (FL-08 dependency).

---

## FL-06 — Post-Session Check-in Flow (WhatsApp)

**Trigger:** Configurable delay after session end (e.g., 3 hours) — if Check-in flow is enabled for that therapist.

**Actors:** System (automated send), Client (WhatsApp), CRM (stores responses)

**Steps:**
1. System detects session end for a therapist with Check-in enabled.
2. After configured delay (Hours after session end), system sends WhatsApp message to client:
   - Uses configured "WhatsApp chat message" text with {{1}} = client first name.
3. Client receives message on WhatsApp; taps to open the interactive flow.
4. Flow screen opens (title + heading + questions as configured).
5. Client answers questions:
   - Text questions → free-text input.
   - Single Choice questions → taps one of the configured option buttons.
6. Client submits flow.
7. Submission is stored in **Submissions** (/checkin-submissions) with: Type=Check-in, User name, Phone, Therapist (if linked), Session Date (if linked), Submitted At.
8. Admin can view submission in Submissions screen; expand row to see per-question responses.

**Decision Points:**
- Check-in toggle OFF for therapist → no message sent.
- No slots / no sessions for therapist → flow never triggers.
- Client doesn't tap the WhatsApp message → no submission recorded.
- Therapist/Session linkage may fail → Therapist and Session Date appear as "–" in submission.

**Systems Touched:** Session booking system (trigger source), WhatsApp Business API / Meta, Session Follow-ups Manage Flows config, Submissions store

**Gaps / Anomalies:**
- Session-to-submission linking is unreliable (Therapist + Session Date = "–" in all 3 production submissions observed).
- Test send is India-only (10-digit mobile, no +91) — international clients cannot be test-sent to.
- Publishing changes to the flow requires Meta template re-approval (24h wait; 1 update per 24h) — very high friction for iteration.
- No automated alert to admin when a high-distress response is submitted (e.g., SOS-level check-in response has no escalation mechanism).

---

## FL-07 — Post-Session Feedback Flow (WhatsApp)

**Trigger:** Configured schedule for Feedback flow (exact timing mechanism not visible in UI — "Hours after session end" field absent from Feedback tab).

**Actors:** System (automated send), Client (WhatsApp), CRM (stores responses)

**Steps:** Identical to FL-06 (Check-in) except:
- Flow type = Feedback
- No configurable hours-delay observed in UI
- Submission stored with Type = Feedback

**Decision Points:** Same as FL-06.

**Systems Touched:** Same as FL-06.

**Gaps / Anomalies:**
- **Critical gap:** "Hours after session end" field is ABSENT from the Feedback tab — timing of feedback dispatch is not configurable from the UI. Mechanism is unknown (may be hardcoded server-side or may not function correctly).
- No Feedback submissions observed in production (all 3 submissions are Check-in type).
- Otherwise same gaps as FL-06.

---

## FL-08 — Therapist Slot Configuration (Admin)

**Trigger:** Admin needs to make a therapist bookable (no slots = no bookings possible).

**Actors:** Admin

**Steps:**
1. Admin navigates to **My Schedule** (/my-schedule).
2. Admin selects therapist from Therapist filter (or leaves as org default).
3. Admin clicks **Add Slots**.
4. Modal opens; admin selects:
   - **Mode**: Auto or Custom
   - **Auto mode**: Sets Date Range + checks day-of-week checkboxes + selects Session Type + Mode of Consultation (Online/Offline).
   - **Custom mode**: Checks individual day checkboxes → sets Start Time / End Time per day + "Add Time Range" for multiple slots per day.
5. Admin saves slots.
6. Slots appear in the schedule grid (currently empty in production — no slots configured).
7. Slots are now available for bot booking (FL-02) and manual booking (FL-03).

**Decision Points:**
- Auto mode: system generates slots across date range for selected days.
- Custom mode: admin manually defines time ranges per day.
- No slots → Date dropdown empty in Manual Booking → bookings blocked.

**Systems Touched:** My Schedule (/my-schedule), Manual Booking (slot consumer), WhatsApp Bot booking flow (slot consumer)

**Gaps / Anomalies:**
- **Critical gap:** No slots currently configured in production — means all bot and manual bookings rely on slots that are absent from My Schedule. Yet 24 billing records exist (SS-1 to SS-46) — suggests slots were configured previously and then deleted, or there is a separate slot source not visible in this screen.
- No bulk-delete or bulk-edit of slots observed.
- Export button visible (⬇) but export format not confirmed.

---

## FL-09 — New Therapist Onboarding (Admin)

**Trigger:** Admin adds a new therapist to the practice.

**Actors:** Admin

**Steps:**
1. Admin navigates to **My Therapists** (/my-therapists).
2. Admin clicks **+ Create** → Therapist Onboarding Form (/mytherapists/create).
3. Admin fills:
   - **Personal Information:** Name*, Email*, Phone*, DOB, Gender, Professional Summary, Personal Bio.
   - **Uploads:** Profile Picture, Letter Head, Signature.
   - **Professional Details:** Professional Title, Qualifications (dynamic list), Specializations, License/Registration No., Years of Experience, Languages Spoken, Concerns Addressed.
   - **Social Media Links:** LinkedIn, Instagram, YouTube, Facebook, Custom URL, X/Twitter.
   - **Practice Details:** Adds session type rows (Session Type, Duration, Buffer, Price Domestic INR, Price International INR) — one row per session type.
4. Admin clicks **Create** → therapist profile created.
5. Therapist is now available in:
   - Manual Booking therapist dropdown
   - Manage Flows therapist selector
   - Reports Therapist filter
   - My Schedule Therapist filter
   - Conversation Analysis therapist list
6. Admin configures slots for new therapist in **My Schedule** (FL-08).
7. Admin configures Check-in and Feedback flows for new therapist in **Manage Flows** (leads to FL-06, FL-07).

**Decision Points:**
- Name, Email, Phone are required — form cannot submit without them.
- Some fields become non-editable after creation ("For non editable fields, please contact Swasth Mind").
- Social media links appear on public therapist landing page — must be accurate before publishing.

**Systems Touched:** My Therapists (/mytherapists/create), My Schedule (slot config), Manage Flows (follow-up config), Public landing page (social links + profile data)

**Gaps / Anomalies:**
- **Critical discrepancy:** 10 therapists are active in the booking system but My Therapists list is empty — existing therapists were not onboarded via this form. They appear to have been created via a different pathway (possibly Admin/User Management → direct account creation, or an older import).
- Some fields locked post-creation require Swasth Mind support to edit — operational friction.
- International pricing tier (separate INR price for international clients) exists in session type config but the mechanism for applying it at booking is not visible.

---

## FL-10 — Client Record Management

**Trigger:** New client contacts clinic via WhatsApp or Web bot (auto-created), or admin adds manually.

**Actors:** WhatsApp Bot / Admin

**Steps (Bot-created):**
1. Client initiates contact via WhatsApp bot (FL-01).
2. System auto-creates Client record in **My Clients** (/my-clients) with Source = "Whatsapp" or "Web bot".
3. Admin can view client in My Clients list; filter by source.
4. Admin can open **Edit Client** modal → update Name, Email, Phone.
5. Admin can open **Client Bio** modal → fill/update: First Name, Last Name, DOB, Age, Gender, Pronouns, Occupation, Relationship Status, City, Country.
6. Admin can navigate to **Client Detail** (/clients/{id}/show) → view Notes tab (clinical notes).

**Steps (Admin-created):**
1. Admin clicks **Add Client** → modal with 3 fields: Name, Email, Phone → Save.

**Decision Points:**
- Source field is auto-set (Whatsapp / Web bot) — not editable by admin.
- Client with no name → "Unknown" display until bio is completed.

**Systems Touched:** My Clients (/my-clients), WhatsApp Bot (auto-create trigger), Client Detail (/clients/{id}/show)

**Gaps / Anomalies:**
- Only 3 clients in My Clients list but 67 WhatsApp conversations recorded — strong signal that not all WhatsApp contacts become Client records (bot contacts ≠ registered clients).
- Client Detail shows only a "Notes" tab — very minimal clinical record; no structured intake form, diagnosis, medication, or treatment plan visible.
- No merge duplicate clients feature in UI.

---

## FL-11 — Assessment Flow (Automated + Manual)

**Trigger:** Admin/system sends assessment to client; client completes it.

**Actors:** Admin, System, Client

**Steps (Automated Reports):**
1. Admin navigates to **Assessments → Automated Reports** (/user-assessments).
2. Screen is completely empty — no automated assessments configured or received in production.
3. [INFERRED] System would normally display assessment results from sent automated questionnaires.

**Steps (Manual Assessments — BUGGY):**
1. Admin clicks **Assessments → Manual Assessments** in sidebar.
2. **BUG:** Route redirects to /my-schedule instead of expected manual assessments screen.
3. Admin lands on My Schedule unexpectedly — cannot access manual assessment sending.

**Decision Points:**
- No functional manual assessment path available (routing bug).
- Automated assessments screen is empty — feature either unused or not yet configured.

**Systems Touched:** Assessments module (/user-assessments, /manual-assessments → bug), My Schedule (unintended redirect)

**Gaps / Anomalies:**
- **Critical bug:** Manual Assessments nav item routes to /my-schedule — feature is inaccessible.
- Automated Reports screen is empty — no assessment data in production.
- No assessment sending capability confirmed from any accessible screen.
- Assessment feature appears non-functional in current production state.

---

## FL-12 — AI Conversation Triage (Admin)

**Trigger:** Admin reviews Conversations list to identify high-priority contacts.

**Actors:** Admin, AI Analysis Engine

**Steps:**
1. Admin navigates to **Conversations** (/my-conversations).
2. Admin filters by **Analysis Category** = "SOS" or "Therapy Potential" to see urgent contacts.
3. Admin reviews Conversational Tag badges and Urgency Level per row.
4. Admin clicks ⓘ icon → **Conversation Analysis** modal:
   - Views Category, Urgency Level (1–5), AI Summary, Key Themes.
5. Admin clicks 👁 icon → **Conversation Details** → **View Conversation** (Chat History).
6. Admin reads full transcript to assess client need.
7. Admin decides next action:
   - Create manual booking (FL-03)
   - Add as client (FL-10)
   - No action (transactional/informational contact)

**Decision Points:**
- SOS or Therapy Potential category → admin should prioritise outreach.
- Urgency Level 4–5 → high priority.
- Transactional/Admin category → routine; no action needed.
- Information/Exploration category → potential lead; may warrant follow-up.

**Systems Touched:** Conversations (/my-conversations), AI Analysis Engine, Manual Booking (downstream), My Clients (downstream)

**Gaps / Anomalies:**
- No direct "Create Booking" or "Add Client" CTA from within the Conversations screen — admin must navigate separately.
- No "mark as reviewed" or "assign to therapist" action on conversations.
- SOS flag has no alert / push notification mechanism.

---

## FL-13 — Admin Revenue Reporting

**Trigger:** Admin wants to review session revenue.

**Actors:** Admin

**Steps:**
1. Admin navigates to **Reports** (/my-report).
2. Admin optionally filters by: Therapist + Date From + Date To.
3. Admin reviews session billing table: Client Name, Mode, Type, Date, Price (₹), Invoice number.
4. Admin clicks 👁 per row → **Session Details** screen with: Email, Phone, Price, Booking Time, Session Date, Start/End Time, Duration.
5. Admin clicks SS-{n} invoice button → downloads individual session PDF invoice.
6. Admin clicks ⬇ export button → downloads filtered report (CSV/Excel).

**Decision Points:**
- Filter by therapist → see revenue per therapist.
- Filter by date → see revenue for a period.
- No total/sum row — admin must compute externally.

**Systems Touched:** Reports (/my-report), Invoice PDF generator, Export engine

**Gaps / Anomalies:**
- No revenue summary / aggregate total in UI.
- Invoice numbering gap (SS-46 highest observed, 24 records visible) — possible voided/deleted sessions.
- No payment status column (paid / pending / refunded) — all records assumed paid.
- No therapist commission or payout calculation visible.

---

## FLOW DEPENDENCY MAP

| Flow | Depends On | Feeds Into |
|---|---|---|
| FL-01 (Lead Acquisition) | WhatsApp Business API setup | FL-02 (Bot Booking), FL-12 (Triage) |
| FL-02 (Bot Booking) | FL-08 (Slots configured), FL-09 (Therapist onboarded) | FL-04 (Session Completion), FL-05 (Cancel/Reschedule) |
| FL-03 (Manual Booking) | FL-08 (Slots configured), FL-09 (Therapist onboarded) | FL-04 (Session Completion), FL-05 (Cancel/Reschedule) |
| FL-04 (Session Completion) | FL-02 or FL-03 (Booking) | FL-06 (Check-in), FL-07 (Feedback), FL-13 (Revenue Report) |
| FL-05 (Cancel/Reschedule) | FL-02 or FL-03 (Active Booking) | Cancellation policy, manual refund process |
| FL-06 (Check-in) | FL-04 (Session completed), FL-09 (Flow configured for therapist) | Submissions inbox |
| FL-07 (Feedback) | FL-04 (Session completed), FL-09 (Flow configured for therapist) | Submissions inbox |
| FL-08 (Slot Config) | FL-09 (Therapist onboarded) | FL-02, FL-03 (Booking) |
| FL-09 (Therapist Onboarding) | — | FL-08, FL-06, FL-07, FL-03, FL-13 |
| FL-10 (Client Record) | FL-01 (Bot contact) or Admin action | FL-03 (Manual Booking) |
| FL-11 (Assessments) | BUGGY — no functional flow | — |
| FL-12 (AI Triage) | FL-01 (Conversations exist) | FL-03, FL-10 |
| FL-13 (Revenue Report) | FL-04 (Sessions completed) | Invoice PDF, Export |

---

## SYSTEM-WIDE GAPS & CRITICAL FINDINGS

| # | Gap / Anomaly | Severity | Affected Flows |
|---|---|---|---|
| G-01 | Admin cannot reply to WhatsApp conversations from CRM — read-only | High | FL-01, FL-12 |
| G-02 | No SOS escalation alert — urgent conversations rely on admin manually checking the list | Critical | FL-01, FL-12 |
| G-03 | No slots configured in My Schedule despite 24+ completed sessions — slot config mechanism gap | High | FL-08, FL-02, FL-03 |
| G-04 | Manual Assessments nav item routes to /my-schedule (routing bug) — feature inaccessible | High | FL-11 |
| G-05 | Feedback flow missing "Hours after session end" timing config field | Medium | FL-07 |
| G-06 | Session-to-submission linking broken (Therapist + Session Date = "–" in all submissions) | Medium | FL-06, FL-07 |
| G-07 | My Therapists list is empty despite 10 active booking therapists — onboarding path mismatch | High | FL-09 |
| G-08 | Refund processing is manual — no payment gateway automation | High | FL-05 |
| G-09 | No aggregate revenue total in Reports | Low | FL-13 |
| G-10 | No clinical notes beyond a "Notes" tab on Client Detail — no structured intake/diagnosis | Medium | FL-10 |
| G-11 | No "Create Booking" or "Add Client" CTA from Conversations screen — cross-module navigation gap | Medium | FL-12 |
| G-12 | WhatsApp Meta template approval 24h wait and 1 update/24h limit — high friction for follow-up flow iteration | Medium | FL-06, FL-07 |
| G-13 | International client pricing tier exists in data model but selection mechanism at booking not visible | Low | FL-03, FL-04 |
| G-14 | No client portal observed — all client interaction is WhatsApp-only | Medium | FL-01 through FL-07 |

---

## OUT-OF-SCOPE MODULES (Not Scanned in Phase 2)

| Module | Inferred Flow (Phase 1 only) | Status |
|---|---|---|
| Seminars | [INFERRED] Admin creates seminar → publishes via WhatsApp/Web → clients register → admin tracks attendance | Not scanned |
| Ecommerce | [INFERRED] Admin lists products/services → client purchases via bot or web → order tracked in CRM | Not scanned |
| Bulk Messages → Message Templates | [INFERRED] Admin creates WhatsApp message templates for bulk outreach | Not scanned |
| Bulk Messages → Logs | [INFERRED] Admin views delivery/read receipts for bulk messages | Not scanned |
| Bulk Messages → Plans | [INFERRED] Admin schedules or targets bulk message campaigns | Not scanned |
| Internships/Career → Job Listings | [INFERRED] Admin posts job openings; candidates apply | Not scanned |
| Internships/Career → Applications | [INFERRED] Admin reviews applications | Not scanned |
| FAQ & Tutorials | [INFERRED] Admin creates FAQ content served to clients via bot | Not scanned |
| User Management (Receptionists, Accountants, Co-Admins, Branch Admins, Branches) | [INFERRED] Admin creates sub-users with role-specific access via RBAC (29 modules, 4 roles documented in Phase 1) | Not scanned |
| Profile / My Subscription / Invoices | [INFERRED] Admin views/edits own profile; manages subscription tier and billing invoices | Not scanned |

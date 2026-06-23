# SwasthMind CRM — Phase 2 Module Scan: Session Follow-ups
**Scanned:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin
**URLs:** /checkin-flow (Manage Flows) | /checkin-submissions (Submissions)

---

## SITEMAP

| Module | Sub-module | URL | Notes |
|---|---|---|---|
| Session Follow-ups | Manage Flows | /checkin-flow | Per-therapist Check-in and Feedback WhatsApp flow configuration |
| Session Follow-ups | Submissions | /checkin-submissions | Read-only inbox of client responses from Check-in and Feedback flows |

---

## SCREENS

| Screen ID | Name | URL | Description | Screenshot Ref |
|---|---|---|---|---|
| SFU-01 | Session Follow-up Flows | /checkin-flow | Therapist-selector + two-tab configuration panel (Check-in / Feedback); 5-step guided setup per flow; WhatsApp Meta template submission | ss_58456bld7 |
| SFU-02 | Check-in Tab | /checkin-flow (Check-in tab active) | 5-step Check-in flow builder: Schedule, Message Details, Questions (Text + Single Choice), Publish, Send Test | ss_58456bld7 |
| SFU-03 | Feedback Tab | /checkin-flow (Feedback tab active) | Identical 5-step structure to Check-in but for post-session feedback; no Hours-after-session field | ss_3846qow9j |
| SFU-04 | Check-in & Feedback Submissions | /checkin-submissions | Paginated table of client flow responses; filter by type (All / Check-in only / Feedback only), Therapist, date range; expandable rows show per-question answers | ss_3855utlfc |
| SFU-05 | Expanded Submission Row | /checkin-submissions (row expanded) | Inline expansion showing Responses section: Question 1, Question 2, etc. with client's free-text or choice answers | ss_2858fsnx2 |

---

## FEATURES

| Feature ID | Name | Screen | Description | Trigger | Destructive? |
|---|---|---|---|---|---|
| SFU-F01 | Select therapist for flow config | SFU-01 | Dropdown; choose which therapist's flow to configure; each therapist has independent Check-in and Feedback settings | Dropdown select | No |
| SFU-F02 | How this works | SFU-01 | Help button; opens explanatory overlay or documentation | Click button | No |
| SFU-F03 | Switch Check-in / Feedback tab | SFU-01 | Toggle between Check-in and Feedback flow configuration for the selected therapist | Click tab | No |
| SFU-F04 | Enable/Disable flow (Schedule toggle) | SFU-02/03 | Master on/off switch to activate or deactivate automatic sending of the flow after sessions | Toggle switch | No (setting) |
| SFU-F05 | Set send delay (Check-in only) | SFU-02 | "Hours after session end" number field; defines how long after session end the check-in message is sent | Edit number | No |
| SFU-F06 | Save schedule | SFU-02/03 | Saves the toggle state and delay setting | Click Save schedule | No |
| SFU-F07 | WhatsApp chat message | SFU-02/03 | Textarea for the WhatsApp message body; {{1}} placeholder auto-inserts client first name | Edit textarea | No |
| SFU-F08 | Flow screen title | SFU-02/03 | Short title shown on the WhatsApp flow screen (max 60 chars) | Edit text | No |
| SFU-F09 | Flow heading | SFU-02/03 | Heading text inside the flow screen (max 80 chars) | Edit text | No |
| SFU-F10 | Add question (Text type) | SFU-02/03 | Enter question text; type = Text; creates free-text response field in flow | Click Add question | No |
| SFU-F11 | Add question (Single Choice type) | SFU-02/03 | Enter question text; type = Single Choice; reveals Option input + "Add option" button for defining answer choices | Click Single Choice + Add question | No |
| SFU-F12 | Add option (Single Choice) | SFU-02/03 | Adds individual answer option to a Single Choice question | Click Add option | No |
| SFU-F13 | View added questions list | SFU-02/03 | "Added questions (N)" section shows all configured questions; "No questions yet" if empty | Auto-rendered | No |
| SFU-F14 | Publish flow | SFU-02/03 | "Publish Check-in" / "Publish Feedback" — submits WhatsApp message template to Meta for approval; 24-hour approval window; max 1 update per 24 hours | Click Publish | Yes (external submission to Meta) |
| SFU-F15 | Send test now | SFU-02/03 | Sends the flow immediately to a 10-digit Indian mobile (no +91 prefix); for testing before live publish | Click Send check-in/feedback now | Yes (sends live WhatsApp message) |
| SFU-F16 | Filter submissions by type | SFU-04 | Tabs: All / Check-in only / Feedback only | Click tab | No |
| SFU-F17 | Filter submissions by therapist | SFU-04 | Dropdown; narrows submissions to selected therapist | Dropdown select | No |
| SFU-F18 | Filter submissions by date range | SFU-04 | Submitted from + Submitted to date pickers | Date input | No |
| SFU-F19 | Expand submission row | SFU-04 → SFU-05 | Chevron (↓/↑) per row reveals inline Responses section with per-question client answers | Click chevron | No |
| SFU-F20 | Submissions pagination | SFU-04 | Rows per page (default 20); prev/next page | Pagination controls | No |

---

## DATA-FIELDS

### Manage Flows — Flow Configuration

| Field ID | Name | Screen | Type | Notes |
|---|---|---|---|---|
| SFU-D01 | Therapist | SFU-01 | Dropdown | Selects which therapist's flow to edit; same 10-therapist list |
| SFU-D02 | Enable check-in messages | SFU-02 | Toggle (boolean) | Activates automatic post-session check-in dispatch |
| SFU-D03 | Hours after session end | SFU-02 | Number | Delay between session end and check-in message send; only on Check-in tab |
| SFU-D04 | Enable feedback messages | SFU-03 | Toggle (boolean) | Activates automatic post-session feedback dispatch |
| SFU-D05 | WhatsApp chat message | SFU-02/03 | Textarea | Message body; {{1}} = client first name variable |
| SFU-D06 | Flow screen title | SFU-02/03 | Text (max 60 chars) | Title shown on the WhatsApp interactive flow screen |
| SFU-D07 | Flow heading | SFU-02/03 | Text (max 80 chars) | Heading text inside the flow screen |
| SFU-D08 | Question text | SFU-02/03 | Text | The question string shown to the client |
| SFU-D09 | Question type | SFU-02/03 | Enum (Text / Single Choice) | Determines response input type; Single Choice reveals Option fields |
| SFU-D10 | Option (Single Choice) | SFU-02/03 | Text (repeatable) | Each option becomes a WhatsApp interactive button answer |
| SFU-D11 | 10-digit mobile number (test) | SFU-02/03 | Text | Indian mobile without +91; used for test dispatch only |

### Submissions

| Field ID | Name | Screen | Type | Notes |
|---|---|---|---|---|
| SFU-D12 | Type (filter) | SFU-04 | Enum (All / Check-in only / Feedback only) | Filter tab |
| SFU-D13 | Therapist (filter) | SFU-04 | Dropdown | Filter by therapist |
| SFU-D14 | Submitted from (filter) | SFU-04 | Date | Start of date range filter |
| SFU-D15 | Submitted to (filter) | SFU-04 | Date | End of date range filter |
| SFU-D16 | Type (column) | SFU-04 | Display (Check-in / Feedback) | Stored submission kind |
| SFU-D17 | User | SFU-04 | Display text | [REDACTED in prod] — client name |
| SFU-D18 | Phone | SFU-04 | Display text | [REDACTED in prod] — client phone |
| SFU-D19 | Therapist (column) | SFU-04 | Display text | May be "–" if session link not resolved |
| SFU-D20 | Session Date | SFU-04 | Display date | May be "–" if session link not resolved |
| SFU-D21 | Submitted At | SFU-04 | Display datetime | Timestamp of flow completion |
| SFU-D22 | Question N (expanded) | SFU-05 | Display text (label + answer) | Per-question client response; "Question 1", "Question 2", etc.; may be free text or selected choice |

---

## FLOWS

| Flow ID | Name | Steps | Notes |
|---|---|---|---|
| SFU-FL01 | Configure Check-in flow | 1. Select therapist. 2. Click Check-in tab. 3. Step 1: Toggle on, set hours delay, save schedule. 4. Step 2: Write WhatsApp message, flow screen title, flow heading. 5. Step 3: Add questions (Text or Single Choice; add options for Single Choice). 6. Step 4: Click Publish Check-in → submits to Meta for approval (24h). 7. Step 5: Optionally send a test to a mobile number. | Per-therapist; each therapist has own flow |
| SFU-FL02 | Configure Feedback flow | Same 5 steps as Check-in except no "Hours after session end" field | Independent from Check-in; separate schedule and message |
| SFU-FL03 | View submission responses | 1. Navigate to Submissions. 2. Optionally filter by type / therapist / date. 3. Click chevron on a row to expand. 4. Read per-question client responses. | Read-only; no edit/delete controls observed |

---

## PERMISSIONS

| Role | Can Configure Flows | Can Publish Flow | Can Send Test | Can View Submissions | Notes |
|---|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes | Full access observed |
| Other roles | Unknown | Unknown | Unknown | Unknown | RBAC Phase 1 included Session Follow-ups |

---

## INTEGRATIONS

| Integration | Direction | Detail |
|---|---|---|
| WhatsApp Business API (Meta) | Outbound | Flows sent as WhatsApp interactive messages post-session; message template must be approved by Meta (24h wait; 1 update/24h limit) |
| Meta Template Approval API | Outbound | Publishing/updating a flow submits template to Meta; not instant |
| Session booking system | Internal | Flow triggered automatically after session end (configured by Hours after session end); Therapist + Session Date linked to submission (but may show "–" if link fails) |

---

## COMPLIANCE

| Item | Detail |
|---|---|
| PHI present in submissions | Yes — client names, phone numbers, and free-text clinical responses visible in prod; all redacted in this report |
| WhatsApp template compliance | All messages subject to Meta WhatsApp Business Policy and template approval; updates rate-limited to once per 24 hours |
| Data retention | Submissions stored indefinitely as observed; no delete/archive controls visible |
| Clinical use | Free-text responses may contain clinical content (mood ratings, symptom descriptions); no structured clinical coding observed |

---

## DATA-MODEL

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| FollowUpFlow | therapist_id (FK), type (check-in / feedback), enabled (bool), delay_hours (int, check-in only), whatsapp_message (text), screen_title (varchar 60), heading (varchar 80), questions (array) | Belongs to Therapist; has many Questions | Per-therapist, per-type; stored independently |
| FlowQuestion | flow_id (FK), position (int), text (varchar), type (enum: text / single_choice), options (array of strings, single_choice only) | Belongs to FollowUpFlow | Ordered list of questions |
| Submission | type (check-in / feedback), user_name, phone, therapist_id (FK, nullable), session_date (nullable), submitted_at (datetime) | Has many Responses; linked to Therapist (optionally) | Session link may not always resolve |
| SubmissionResponse | submission_id (FK), question_label (e.g. "Question 1"), answer (text) | Belongs to Submission | Per-question answer; label derived from flow or send log |

---

## KEY FINDINGS & ANOMALIES

| # | Finding | Implication |
|---|---|---|
| 1 | Each therapist has INDEPENDENT Check-in and Feedback flows | Allows per-therapist customisation; admin must configure each therapist separately |
| 2 | Check-in has "Hours after session end" delay; Feedback tab does NOT have this field | Feedback send timing is not configurable from UI — may be hardcoded server-side or missing |
| 3 | Publishing triggers Meta WhatsApp template approval (24h wait; 1 update per 24h limit) | High operational friction for updates; templates must be planned carefully |
| 4 | Submissions show Therapist and Session Date as "–" | Session-to-submission linking is not working for test submissions; likely requires real completed session records |
| 5 | Only 3 submissions total in production — all Check-in type, same client ("Yash") | Flows are in early/testing phase; not widely deployed to all therapists yet |
| 6 | Free-text responses visible in expansion ("Goodd", "4") | Low-quality test data; real usage would contain clinical-grade feedback |
| 7 | Single Choice questions support custom answer options (WhatsApp interactive buttons) | Rich structured data collection possible; not limited to free text |
| 8 | No delete, export, or download for submissions | Read-only view; no data export capability observed from this screen |
| 9 | Test send requires 10-digit Indian mobile (no +91) | System is built for India-based WhatsApp numbers; international clients may not receive flows |

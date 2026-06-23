# Swasth-Mind CRM — Phase 2: My Clients Module
**Scan date:** 2026-04-19
**CRM URL:** crm.swasthmind.com
**Tenant type:** PRODUCTION (PHI redaction active — all client values replaced with field descriptions)
**Role scanned as:** Admin (Super Admin)
**Module path:** /my-clients

---

## Screen

### My Clients — List View

- **CRM:** Swasth-Mind CRM (crm.swasthmind.com)
- **Path:** My Clients (top-level nav)
- **URL:** /my-clients
- **Primary purpose:** Central client/patient roster; view, search, filter, add, and edit client records
- **Key UI elements:** Search bar, two filter dropdowns (Source, Therapist), Add Client button, Export button, sortable data table, per-row Edit and Bio action buttons, pagination control
- **Data shown (columns — values REDACTED):**
  - Sr No (sequential integer)
  - Name (string — PHI)
  - Email (string — PHI)
  - Phone (string — PHI)
  - Registered On (datetime — format DD-MM-YYYY HH:MM:SS AM/PM)
  - Edit (action column — pencil icon button)
  - Bio (action column — person icon + eye icon buttons)
- **Actions available:**
  - Search by Name (free-text filter)
  - Filter by Source dropdown (Both / Whatsapp / Web bot)
  - Filter by Therapist dropdown (shows therapist names)
  - Add Client (opens modal)
  - Export/Download (button — NOT clicked; assumed client list export)
  - Sort by Sr No ascending/descending
  - Sort by Name ascending/descending
  - Edit Client per-row (opens Edit modal)
  - Client Bio per-row — person icon (opens Bio modal for edit)
  - Client Bio per-row — eye icon (view/highlight Bio; same record)
  - Click client name/row link → navigates to /clients/{id}/show
  - Rows per page selector (default: 8)
- **Notes / pain points:**
  - No bulk actions observed (no checkboxes, no bulk select)
  - No advanced filters (e.g., by session status, assigned therapist, date range — only Source and Therapist)
  - No search by email or phone — name-only search
  - No client tags, status labels, or clinical flags on the list
  - No "last session" or "next appointment" column visible
  - Only 2 sort options (Sr No, Name) — no sort by Registered On
  - Client count: very low (3 records in prod — likely a new or lightly-used tenant)
  - PHI visible in plain text in all columns — no masking
- **Role visibility differences observed:** Not tested (Admin only in this session)
- **Screenshot refs:** ss_0533b3qjn (list view), ss_7852ljz1j (all columns visible)

---

### My Clients — Client Detail View

- **CRM:** Swasth-Mind CRM
- **Path:** My Clients > [Client Name]
- **URL:** /clients/{id}/show
- **Primary purpose:** View and add notes for a specific client
- **Key UI elements:** Client info header bar, single "Notes" tab, Add Note button (+), Export/download button for notes, notes list area
- **Data shown (values REDACTED):**
  - Name (string — PHI)
  - Email (string — PHI)
  - Phone (string — PHI)
  - Origin (enum: Whatsapp | Web bot)
- **Tabs:** Notes (only tab visible — no Sessions tab, no Assessments tab, no Documents tab)
- **Actions available:**
  - Back button (← returns to list)
  - Add Note (+) button
  - Export notes (download icon — NOT clicked)
  - Clear filters (within notes area)
- **Notes / pain points:**
  - Client detail is extremely minimal — only Notes tab; no embedded session history, assessment results, or appointment timeline
  - No clinical fields in the client record itself (no diagnosis, no presenting concern, no assigned therapist shown, no intake form data)
  - Notes section was empty for the client inspected; filter message shown: "No My-notes found using the current filters"
  - No document upload or attachment capability visible at this level
  - No messaging/WhatsApp button from the client detail view
- **Screenshot ref:** ss_8451f588i

---

### My Clients — Add Client Modal

- **CRM:** Swasth-Mind CRM
- **Path:** My Clients > Add Client (modal)
- **Primary purpose:** Create a new client record
- **Actions available:** Save, Close (×)
- **Screenshot ref:** ss_83685ircq

---

### My Clients — Edit Client Modal

- **CRM:** Swasth-Mind CRM
- **Path:** My Clients > Edit Client (modal)
- **Primary purpose:** Update basic client contact details
- **Actions available:** Save, Cancel
- **Screenshot ref:** ss_8550auik2

---

### My Clients — Client Bio Modal

- **CRM:** Swasth-Mind CRM
- **Path:** My Clients > Client Bio (modal, accessed via person-icon in list)
- **Primary purpose:** Capture extended demographic and contextual client profile information
- **Actions available:** Save, Cancel
- **Screenshot refs:** ss_74875objc, ss_5134la5vj, ss_7454cjpf8, ss_99027024b, ss_9487cytcz

---

## Features

| Module | Feature | Sub-capability | Present? | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| My Clients | Client list view | Paginated table | Yes | 3 | Default 8 rows/page; pagination control present |
| My Clients | Client list view | Search by name | Yes | 3 | Name-only; no email/phone search |
| My Clients | Client list view | Filter by acquisition source | Yes | 4 | Both / Whatsapp / Web bot |
| My Clients | Client list view | Filter by therapist | Yes | 3 | Dropdown of therapist names |
| My Clients | Client list view | Sort columns | Partial | 2 | Only Sr No and Name sortable; Registered On not sortable |
| My Clients | Client list view | Bulk actions | No | — | No bulk select, bulk message, or bulk export per selection |
| My Clients | Client list view | Export/download | Yes | Unknown | Button present; effect not tested |
| My Clients | Client creation | Add new client | Yes | 2 | Only 3 fields (Name, Email, Phone) — no intake form |
| My Clients | Client editing | Edit basic contact info | Yes | 3 | Same 3 fields as Add; no additional fields |
| My Clients | Client Bio | Extended demographic profile | Yes | 4 | 10 fields including pronouns, emergency contact |
| My Clients | Client detail | Notes per client | Yes | 3 | Free-text notes; export available; no templates |
| My Clients | Client detail | Session history embedded | No | — | Not present on /clients/{id}/show |
| My Clients | Client detail | Assessment results embedded | No | — | Not present on /clients/{id}/show |
| My Clients | Client detail | Document/file upload | No | — | Not observed |
| My Clients | Client detail | Assigned therapist display | No | — | Not shown in client detail view |
| My Clients | Client detail | Tags / labels / status flags | No | — | No clinical or operational tagging |
| My Clients | Client acquisition | WhatsApp intake | Yes | Unknown | Origin field = "Whatsapp"; filter exists |
| My Clients | Client acquisition | Web bot intake | Yes | Unknown | Origin field = "Web bot"; filter exists |

---

## Data-fields

### Entity: Client (core record — Add/Edit modal)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Client | Client Name | string | Yes | — | Yes | Add/Edit Client modal | Only name field in core record |
| Client | Email | string | No | — | Yes | Add/Edit Client modal | Optional at creation |
| Client | Phone Number | string | Yes | — | Yes | Add/Edit Client modal | Required; international format inferred |
| Client | Origin | enum | Auto | Whatsapp, Web bot | No | List view (Registered On col); Detail header | System-set; indicates acquisition channel |
| Client | Registered On | datetime | Auto | — | No | List view | System-generated timestamp |

### Entity: Client Bio (extended demographic record)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Client Bio | Age | int | No | — | Yes | Client Bio modal | Numeric entry |
| Client Bio | Date of Birth | date | No | — | Yes | Client Bio modal | dd/mm/yyyy format |
| Client Bio | Gender | enum | No | Male, Female, Non-binary, Prefer not to say, Other | Yes | Client Bio modal | Inclusive options |
| Client Bio | Pronouns | enum | No | he/him, she/her, they/them, she/they, he/they, Other | No | Client Bio modal | Good pronoun coverage |
| Client Bio | Primary Language | string | No | — | No | Client Bio modal | Free text; placeholder: e.g. English, Hindi, Spanish |
| Client Bio | City | string | No | — | Yes | Client Bio modal | Free text |
| Client Bio | Country | string | No | — | No | Client Bio modal | Free text |
| Client Bio | Occupation | enum | No | Student, Professional | No | Client Bio modal | Only 2 values — limited |
| Client Bio | Relationship Status | enum | No | Single, Married, Divorced, Widowed, In a relationship, Prefer not to say | No | Client Bio modal | |
| Client Bio | Emergency Contact Name | string | No | — | Yes | Client Bio modal | PHI — name of emergency contact |
| Client Bio | Emergency Contact Number | string | No | — | Yes | Client Bio modal | PHI; placeholder format: +1-234-567-8900 |

### Entity: Client Note

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Client Note | Note content | text | Unknown | — | Yes | Client detail /show page | Free-text clinical notes; structure unknown (no notes existed to inspect) |
| Client Note | Created by | relation | Auto | — | No | Client detail /show page | Assumed — not confirmed |
| Client Note | Created at | datetime | Auto | — | No | Client detail /show page | Assumed — not confirmed |

---

## Integration

| Category | Function | Vendor (if visible) | Direction | Protocol | BAA required? | Notes |
|---|---|---|---|---|---|---|
| Messaging | Client acquisition via WhatsApp | WhatsApp / Meta | In | API (assumed) | Unknown | Origin="Whatsapp" on client records; filter confirms dedicated source tracking |
| Chatbot | Client acquisition via web chat | Web bot (vendor unknown) | In | Unknown | Unknown | Origin="Web bot" on client records; suggests embedded chatbot on practice website |

---

## Phase 2 Status Report — My Clients

- **Module / flow:** My Clients
- **Screens captured:** 5 (List view, Client detail/show, Add Client modal, Edit Client modal, Client Bio modal)
- **Features identified:** 17
- **Data fields cataloged:** 16 (5 core client + 11 bio + 3 note entity fields)
- **Integrations noted:** 2 (WhatsApp intake, Web bot intake)
- **Blocking questions:** None

### Key observations for your replication workbook:

1. **Client record is intentionally lean** — only Name, Email, Phone at core. All clinical depth lives elsewhere (sessions, assessments).
2. **Bio is a separate optional layer** — good demographic coverage including pronouns and emergency contact, but decoupled from the core record (accessed only via list-level button, not from the client detail page itself).
3. **Client detail page is very sparse** — only a Notes tab. No embedded session history, no assessments, no documents. This is a significant gap vs. a full EHR.
4. **Two acquisition channels tracked** (WhatsApp + Web bot) — suggests the CRM is designed to capture leads from conversational interfaces, not just manual entry.
5. **No intake form flow** — clients are added with 3 fields; there is no structured intake questionnaire linked to client creation.
6. **Occupation enum is very limited** (Student / Professional only) — likely a pain point for a mental health practice with diverse clientele.
7. **No bulk actions** — cannot bulk-message, bulk-assign, or bulk-export selected clients.

---
*End of Phase 2 — My Clients*

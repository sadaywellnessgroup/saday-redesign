# Swasth-Mind CRM — Phase 2: Sessions Module (+ Manual Booking)
**Scan date:** 2026-04-19
**CRM URL:** crm.swasthmind.com
**Tenant type:** PRODUCTION (PHI redaction active)
**Role scanned as:** Admin (Super Admin)
**Screens covered:** Upcoming Sessions, Completed Sessions, Session Packages, Session Discounts, Purchased Packages, Manual Booking (New Booking + Appointment History)

---

## Screen

### Upcoming Sessions — List View

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Upcoming Sessions
- **URL:** /my-upcoming
- **Primary purpose:** View and filter all future scheduled sessions across the practice
- **Key UI elements:** Filter bar with 5 inputs, Export/download button, empty-state table, Clear filters link
- **Data shown (columns — no data present in this tenant):**
  - Table empty — "No My-upcomings found using the current filters"
  - Columns inferred from Appointment History tab: Client, Contact, Therapist, Session, Date & Time, Amount, Status, Actions
- **Filter controls:**
  - Booked by (free text — client name)
  - Email (free text)
  - Phone (numeric)
  - Booking Date From (date picker)
  - Booking Date To (date picker)
  - Therapist (dropdown — lists therapist names)
  - Export/Download button (icon only — NOT clicked)
  - Clear filters link
- **Actions available:** All filters, Export (not clicked), Clear filters
- **Notes / pain points:**
  - No data in this tenant; all session lists are empty
  - No "Add/Book Session" button here — bookings are created via Manual Booking only
  - Filter set is comprehensive (name, email, phone, date range, therapist) but no status or session-type filter
  - No sort controls visible on empty table
- **Screenshot ref:** ss_0955sa522

---

### Completed Sessions — List View

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Completed Sessions
- **URL:** /completed-sessions
- **Primary purpose:** View all past sessions marked as completed
- **Key UI elements:** Identical filter bar to Upcoming Sessions; empty state
- **Filter controls:**
  - Booked by (free text)
  - Email (free text)
  - Phone (numeric)
  - Date From (date picker)
  - Date To (date picker)
  - Therapist (dropdown)
  - Export/Download button (not clicked)
  - Clear filters link
- **Differences vs. Upcoming Sessions:** Filter label changed from "Booking Date From/To" to "Date From/To"; otherwise identical structure
- **Actions available:** All filters, Export (not clicked), Clear filters
- **Notes / pain points:** Same as Upcoming — no data; no bulk actions; no session-type filter
- **Screenshot ref:** ss_3339k6o87

---

### Session Packages — List View

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Session Packages
- **URL:** /session-packages
- **Primary purpose:** Define and manage multi-session bundles available for client purchase
- **Key UI elements:** Add Packages button, Export button, paginated table (8 rows/page), per-row Edit + Status toggle
- **Data shown (3 records present — non-PHI configuration data):**
  - Sr No (int)
  - No. of Session (int)
  - Package Name (string)
  - Price (Rs) (decimal)
  - Validity (in Days) (int)
  - Edit (pencil button)
  - Status (enum badge: Active/Inactive) + toggle switch (Active/Off label)
- **Sample data (non-PHI, safe to record):**
  - Row 1: 4 sessions, "Pack of 4 therapy sessions", Rs 5200, 90 days, Inactive
  - Row 2: 4 sessions, "Bulk of 4 Psychiatric consultations", Rs 1600, 90 days, Inactive
  - Row 3: 2 sessions, "Test package", Rs 1, 90 days, Inactive
- **Actions available:**
  - Add Packages (opens Add Session Packages modal)
  - Edit package per-row (opens Edit modal)
  - Toggle status per-row (Active/Inactive — NOT clicked)
  - Export (not clicked)
  - Rows per page control (default 8)
- **Notes / pain points:**
  - All 3 packages are Inactive — no active packages configured
  - No per-therapist or per-session-type package assignment visible
  - No description field, no image, no public/private flag
  - No discount linkage at package level (discounts are managed separately)
  - Pricing model: flat price per package, not per session
- **Screenshot refs:** ss_0055qf7a4, ss_7921bv9vx (Add modal), ss_1522d2jt7 (Edit modal)

---

### Session Packages — Add / Edit Modal

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Session Packages > Add/Edit (modal)
- **Primary purpose:** Create or update a session package definition
- **Fields:**
  - No. Of Sessions (int, presumably required)
  - Price (decimal, presumably required)
  - Package Name (string, presumably required)
  - Validity (In day) (int, presumably required)
- **Actions:** Add / Save, Cancel
- **Notes:** No status toggle in Add form (status defaults to Active on create, presumably); Edit form also has same 4 fields only

---

### Session Discounts — List View

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Session Discounts
- **URL:** /session-discounts
- **Primary purpose:** Create and manage coupon/discount codes for session bookings
- **Key UI elements:** "+ Create Discount" button, table with 2 records (no export button observed)
- **Data shown (2 records present — non-PHI):**
  - Coupon Code (string — auto-generated alphanumeric, e.g. QX0ILQ, GS8HS4)
  - Discount % (int badge — e.g. 20%, 15%)
  - Validity (Days) (int — e.g. 300)
  - Status (badge: Active/Inactive)
  - Created (datetime — DD-MM-YYYY HH:MM AM/PM)
  - Actions: Edit (pencil) + Delete (red trash icon — DESTRUCTIVE, not clicked)
- **Actions available:**
  - Create Discount (opens Create Session Discount modal)
  - Edit per-row (not opened — same as Create form assumed)
  - Delete per-row (DESTRUCTIVE — NOT clicked)
- **Notes / pain points:**
  - Coupon code appears auto-generated (not editable by admin — not in Create form)
  - No minimum purchase amount or session-type restriction visible
  - No usage count tracking visible on list (maximum set at creation; current usage not shown)
  - Delete action is available (no soft-delete/deactivation toggle on list — only Active toggle in Create form)
  - No search or filter on the discount list
- **Screenshot refs:** ss_7856obd1i (list), ss_5089wog5p (Create modal)

---

### Session Discounts — Create Modal

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Session Discounts > Create (modal)
- **Primary purpose:** Define a new discount coupon
- **Fields:**
  - Discount Percentage (%) (decimal — required, assumed)
  - Validity (Days) (int — required, assumed)
  - Maximum Usage Count (int — required, assumed)
  - Description (text — optional)
  - Active toggle (bool — defaults ON/Active)
- **Actions:** Create, Cancel
- **Notes:** Coupon code is auto-generated by the system, not entered by admin

---

### Purchased Packages — List View

- **CRM:** Swasth-Mind CRM
- **Path:** Sessions > Purchased Packages
- **URL:** /user-session-packages
- **Primary purpose:** Read-only view of session packages purchased by clients
- **Key UI elements:** Empty state illustration + "No User-session-packages yet." message
- **Data shown:** None (empty state — no purchases recorded)
- **Actions available:** None visible (read-only; no Add button)
- **Notes / pain points:**
  - Completely empty — no filter, no search, no export visible in empty state
  - Table columns unknown (no data to reveal headers)
  - Suggests clients purchase packages via a client portal or payment link; admin views resulting records here
- **Screenshot ref:** ss_3623lcz4g

---

### Manual Booking — New Booking

- **CRM:** Swasth-Mind CRM
- **Path:** Manual Booking > New Booking tab
- **URL:** /manual-booking
- **Primary purpose:** Admin/receptionist creates a session booking on behalf of a client
- **Key UI elements:** Two-tab page (New Booking, Appointment History); form with 3 sections
- **Form sections and fields:**

  **Client Information:**
  - Search Client (autocomplete dropdown — searches by Name, phone, or email)
  - + Create New Client (inline shortcut — presumably opens same 3-field Add Client modal)

  **Session Details:**
  - Therapist * (dropdown — required; lists org therapists)
  - Session Mode (dropdown — required; enum: Online, Offline)
  - Session Type * (dropdown — required; enum: populated from therapist's configured session types e.g. CBT, Child Therapy etc.)
  - Date * (dropdown/date selector — required)

  **Payment Method:**
  - Online Payment / Generate Payment Link (radio — default selected)
  - Cash Payment (radio)

- **Submit action:** "+ Create Booking & Send Payment Link" — EXTERNAL-FACING (NOT clicked; sends payment link to client)
- **Secondary action:** "Clear" (resets form)
- **Notes / pain points:**
  - Submit button always says "Send Payment Link" even if Cash Payment is selected — suggests button label doesn't adapt dynamically (potential UX bug)
  - No time selection visible for Date (only date — time may be selected in a subsequent step or from therapist's availability slots)
  - No duration field, no notes/reason field, no package selection field at booking
  - No discount/coupon code field at booking
  - Booking creates both a session record AND triggers a payment communication
  - No confirmation step before submission visible
- **Screenshot refs:** ss_4407fexso, ss_3190dqo79 (mode dropdown)

---

### Manual Booking — Appointment History

- **CRM:** Swasth-Mind CRM
- **Path:** Manual Booking > Appointment History tab
- **URL:** /manual-booking (tab switch)
- **Primary purpose:** View all manually booked appointments with filter and search
- **Key UI elements:** 4 filter dropdowns, date picker, search text box, export button, table with 8 columns, pagination
- **Table columns (no data — inferred from headers):**
  - Client (string — PHI)
  - Contact (string — PHI, phone/email)
  - Therapist (string)
  - Session (string — session type)
  - Date & Time (datetime)
  - Amount (decimal — Rs)
  - Status (enum — see below)
  - Actions (edit/cancel/other — unknown without data)
- **Filter controls:**
  - Status dropdown: Upcoming, Completed, All Bookings
  - All Therapists dropdown
  - All Modes dropdown (Online / Offline)
  - Branch dropdown
  - Date picker (single date)
  - Search text field
  - Export/Download button (not clicked)
- **Pagination:** Rows per page (default 10), prev/next navigation
- **Notes / pain points:**
  - This is a richer filter surface than the separate Upcoming/Completed Sessions screens — it consolidates both + adds Mode and Branch filters and a search field
  - The duplication of Upcoming/Completed Sessions in the sidebar vs. this tab creates navigation fragmentation
  - No data to confirm what "Actions" column contains (likely Cancel/Reschedule per safety constraints)
- **Screenshot refs:** ss_3991yk8da, ss_3909sm34m (status dropdown)

---

## Features

| Module | Feature | Sub-capability | Present? | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| Upcoming Sessions | List view | Filter by client name/email/phone | Yes | 3 | Separate fields for name, email, phone |
| Upcoming Sessions | List view | Filter by date range | Yes | 4 | Booking Date From/To |
| Upcoming Sessions | List view | Filter by therapist | Yes | 3 | Dropdown |
| Upcoming Sessions | List view | Export sessions | Yes | Unknown | Button present, not tested |
| Upcoming Sessions | List view | Sort columns | Unknown | Unknown | No data to test |
| Upcoming Sessions | List view | Bulk actions | Unknown | Unknown | No data to test |
| Completed Sessions | List view | Same filter surface as Upcoming | Yes | 3 | Minor label difference |
| Session Packages | CRUD | Create package | Yes | 3 | 4 fields only; no image/description/therapist assignment |
| Session Packages | CRUD | Edit package | Yes | 3 | Same 4 fields |
| Session Packages | CRUD | Toggle active/inactive | Yes | 3 | Per-row toggle |
| Session Packages | CRUD | Delete package | No | — | No delete observed — only edit + toggle |
| Session Packages | CRUD | Export list | Yes | Unknown | Button present |
| Session Discounts | CRUD | Create discount coupon | Yes | 3 | Auto-generated code; 4 fields |
| Session Discounts | CRUD | Edit discount | Yes | Unknown | Pencil present; form not opened |
| Session Discounts | CRUD | Delete discount | Yes | — | Red trash present — DESTRUCTIVE, not tested |
| Session Discounts | Feature | Usage limit | Yes | 3 | Maximum Usage Count field |
| Session Discounts | Feature | Active/inactive toggle | Yes | 3 | In create form |
| Session Discounts | Feature | Auto-generated coupon codes | Yes | 3 | Not admin-defined |
| Purchased Packages | View | Client package purchase history | Yes | Unknown | Empty; read-only |
| Manual Booking | Booking creation | Book session for existing client | Yes | 3 | Search by name/email/phone |
| Manual Booking | Booking creation | Create new client inline | Yes | 3 | Quick-create from booking form |
| Manual Booking | Booking creation | Online vs offline mode | Yes | 4 | Two modes |
| Manual Booking | Booking creation | Session type selection | Yes | 3 | Drawn from therapist's configured types |
| Manual Booking | Booking creation | Payment method selection | Yes | 3 | Online payment link or cash |
| Manual Booking | Booking creation | Send payment link on booking | Yes | — | External-facing action; not tested |
| Manual Booking | History | Filter appointment history | Yes | 4 | Status, therapist, mode, branch, date, search |
| Manual Booking | History | Export appointment history | Yes | Unknown | Button present |
| Manual Booking | History | Pagination | Yes | 3 | Default 10 rows |

---

## Data-fields

### Entity: Session (inferred from booking form + history table)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Session | Client | relation | Yes | — | Yes | Manual Booking / History table | Links to Client entity |
| Session | Therapist | relation | Yes | — | No | Manual Booking form | Dropdown of org therapists |
| Session | Session Mode | enum | Yes | Online, Offline | No | Manual Booking form | |
| Session | Session Type | enum | Yes | Configured per therapist (e.g. CBT, Child Therapy, Check-in Session, etc.) | No | Manual Booking form | Pulled from therapist profile |
| Session | Date | date | Yes | — | No | Manual Booking form | Time selection not observed |
| Session | Payment Method | enum | Yes | Online Payment, Cash Payment | No | Manual Booking form | |
| Session | Amount | decimal | Auto | — | No | History table | Presumably calculated from session type/therapist rate |
| Session | Status | enum | Auto | Upcoming, Completed | No | History table / filter dropdown | |
| Session | Contact | string | Auto | — | Yes | History table | Client phone/email displayed |
| Session | Branch | relation | Auto? | — | No | History filter | Linked to branch |

### Entity: Session Package

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Session Package | Package Name | string | Yes | — | No | Session Packages list/modal | |
| Session Package | No. of Sessions | int | Yes | — | No | Session Packages list/modal | |
| Session Package | Price (Rs) | decimal | Yes | — | No | Session Packages list/modal | |
| Session Package | Validity (In day) | int | Yes | — | No | Session Packages list/modal | Days from purchase |
| Session Package | Status | enum | Auto | Active, Inactive | No | Session Packages list | Toggle |

### Entity: Session Discount

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Session Discount | Coupon Code | string | Auto-generated | — | No | Session Discounts list | System-generated alphanumeric |
| Session Discount | Discount Percentage | decimal | Yes | — | No | Create Discount modal | e.g. 20, 15 |
| Session Discount | Validity (Days) | int | Yes | — | No | Create Discount modal | |
| Session Discount | Maximum Usage Count | int | Yes | — | No | Create Discount modal | |
| Session Discount | Description | text | No | — | No | Create Discount modal | Optional |
| Session Discount | Active | bool | Yes | true/false | No | Create Discount modal | Defaults to true |
| Session Discount | Created At | datetime | Auto | — | No | Session Discounts list | |

### Entity: Purchased Package (columns unknown — empty state)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Purchased Package | (all fields unknown) | — | — | — | — | Purchased Packages /user-session-packages | Empty state; no columns visible |

---

## Integration

| Category | Function | Vendor (if visible) | Direction | Protocol | BAA required? | Notes |
|---|---|---|---|---|---|---|
| Payment | Online payment link generation | Unknown (Razorpay / Stripe inferred — India context) | Out | API (assumed) | Unknown | "Generate Payment Link" in booking flow sends payment link to client; currency Rs |
| Communication | Payment link delivery to client | WhatsApp or email (assumed) | Out | Unknown | Unknown | "Send Payment Link" button — delivery channel not confirmed in UI |

---

## Flow

### F3 — Manual Booking (New Session Creation Flow)

| # | Actor role | Action | System response | Screen | Observations / pain points |
|---|---|---|---|---|---|
| 1 | Admin/Receptionist | Navigate to Manual Booking | New Booking tab opens with empty form | /manual-booking | Default landing is New Booking tab |
| 2 | Admin/Receptionist | Search client by name/phone/email in "Search Client" field | Autocomplete dropdown shows matching client records | Manual Booking — Client Information | Client must already exist; if not, use "+ Create New Client" |
| 3 | Admin/Receptionist | Select existing client OR click "+ Create New Client" | Client selected and pre-filled; or 3-field creation modal opens | Client Information | No intake form triggered at this step |
| 4 | Admin/Receptionist | Select Therapist from dropdown | Therapist selected; Session Type options likely update based on selection | Session Details | Therapist drives available session types |
| 5 | Admin/Receptionist | Select session mode: Online or Offline | Mode set | Session Details | Only 2 options |
| 6 | Admin/Receptionist | Select Session Type | Session type set | Session Details | Enum from therapist's configured types |
| 7 | Admin/Receptionist | Select Date | Date set (time selection not observed — may appear after date) | Session Details | Date selector is a dropdown/date picker |
| 8 | Admin/Receptionist | Select payment method: Online Payment or Cash Payment | Payment method set | Payment Method | |
| 9 | Admin/Receptionist | Click "+ Create Booking & Send Payment Link" | (NOT EXECUTED — EXTERNAL FACING) | — | Presumably creates session record + sends payment link to client via WhatsApp/email |
| — | — | Alternative: click "Clear" | Form resets | — | No confirmation dialog |

**Information the clinician must have at booking time that they might not naturally have:**
- Client's preferred therapist assignment
- Exact session type (requires knowing therapist's configured offering list)
- Date (requires knowing therapist's availability — no calendar/availability picker visible in form)

---

## Phase 2 Status Report — Sessions Module

- **Module / flow:** Sessions (all sub-screens) + Manual Booking
- **Screens captured:** 7 (Upcoming Sessions, Completed Sessions, Session Packages, Session Discounts, Purchased Packages, Manual Booking - New Booking, Manual Booking - Appointment History)
- **Features identified:** 28
- **Data fields cataloged:** 24 (10 Session + 5 Package + 7 Discount + 2 Purchased)
- **Integrations noted:** 2 (Online payment link, Communication/delivery channel)
- **Blocking questions:** None

### Key observations for replication workbook:

1. **Session list screens are empty** — cannot confirm actual table column set from Upcoming/Completed screens directly; inferred from Appointment History tab.
2. **No time slot / availability picker** — the booking form has Date but no visible time picker or therapist availability calendar. This is a major gap; admins must coordinate availability offline.
3. **Payment link is mandatory in the flow** — even Cash Payment goes through the same "Create Booking & Send Payment Link" button, implying the payment link send may be tied to the booking creation action rather than the payment method radio.
4. **No duration field** — session length is not configurable at booking time.
5. **No package linkage at booking** — you cannot book a session against a purchased package in the Manual Booking form (packages are sold separately).
6. **No coupon/discount code field** at booking time — discounts are presumably client-side only.
7. **Navigation fragmentation** — Upcoming/Completed Sessions are in the sidebar AND also accessible from Manual Booking > Appointment History with richer filters; redundant.
8. **Purchased Packages completely empty** — no data to understand how package redemption works.
9. **Delete on Session Discounts** — only destructive delete action observed across all Sessions sub-screens (no soft-delete/archive pattern here).

---
*End of Phase 2 — Sessions Module*

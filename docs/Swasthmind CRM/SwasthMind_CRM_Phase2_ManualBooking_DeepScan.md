# Swasth-Mind CRM — Phase 2: Manual Booking (Deep Scan)
**Scan date:** 2026-04-19
**CRM URL:** crm.swasthmind.com
**Tenant type:** PRODUCTION (PHI redaction active — therapist names not recorded)
**Role scanned as:** Admin (Super Admin)
**URL:** /manual-booking
**Note:** This file supplements SwasthMind_CRM_Phase2_Sessions.md with deeper findings from a second pass on Manual Booking, specifically the therapist list, session type enum, and date slot behavior.

---

## Screen

### Manual Booking — New Booking (Deep Scan)

- **CRM:** Swasth-Mind CRM
- **Path:** Manual Booking > New Booking tab
- **URL:** /manual-booking
- **Primary purpose:** Admin/receptionist books a session for an existing or new client, assigns a therapist, selects session type and time slot, and initiates payment
- **Key UI elements:** Two tabs (New Booking, Appointment History); 3-section form (Client Information, Session Details, Payment Method); Clear + Submit buttons
- **Screenshot refs:** ss_524564ixm (overview), ss_6529miof2 (therapist dropdown), ss_8862m74wq (therapist selected), ss_4863bqsyh (session type dropdown), ss_78104hjnf (session type selected), ss_7062uaym5 (date slot dropdown — empty)

---

## Form Fields — Full Detail

### Section 1: Client Information

| Field | Type | Required | Behaviour | Notes |
|---|---|---|---|---|
| Search Client | autocomplete combobox | Yes (unless creating new) | Searches existing clients by Name, phone, or email — live search | Must be an existing client; no free-text entry |
| + Create New Client | button/link | — | Opens 3-field Add Client modal (Name, Email, Phone) inline | Allows quick client creation without leaving the booking flow |

### Section 2: Session Details

| Field | Type | Required | Behaviour / Enum values | Notes |
|---|---|---|---|---|
| Therapist | combobox | Yes | Dropdown of all active therapists in the org (10 therapists observed in this tenant) | Selecting a therapist populates Session Type options specific to that therapist |
| Session Mode | combobox | Yes | Online, Offline | Defaults to Online; independent of therapist selection |
| Session Type | combobox | Yes | Populated after therapist selected; specific to each therapist's configured services. For therapist "Dr Aditya Agrawal": One-on-One Therapy, Psychiatric Consultation | Greyed out until Therapist is chosen; options vary per therapist |
| Date / Time Slot | combobox | Yes | Slot-based dropdown — shows therapist's configured available date+time slots. Empty if therapist has no slots configured | NOT a free calendar picker. Completely dependent on therapist's working hours / availability configuration. Empty in this tenant for the tested therapist |

### Section 3: Payment Method

| Field | Type | Required | Behaviour / Enum values | Notes |
|---|---|---|---|---|
| Payment Method | radio group | Yes | Online Payment (Generate Payment Link) [default], Cash Payment | Radio selection only — both paths submit via same button |

### Form Actions

| Action | Type | Behaviour | Notes |
|---|---|---|---|
| + Create Booking & Send Payment Link | submit button | EXTERNAL-FACING — NOT CLICKED | Creates session record AND sends payment link to client regardless of Cash/Online selection (button label does not change) |
| Clear | button | Resets entire form | No confirmation prompt |

---

## Therapist Dropdown

- **Total therapists visible:** 10 (in this tenant)
- **Format:** "Dr [First] [Last]" or "[First] [Last]" — clinical titles present for some, absent for others
- **Notes:** Therapist names are staff data (not patient PHI) but treated as potentially sensitive and not individually recorded here. One entry is the org itself ("Saday Wellness Group") — may function as a general/group therapist slot.

---

## Session Type Behavior (Cascading Dependency)

- Session Type is **therapist-specific** — the dropdown is populated by the session types configured in each therapist's profile
- Observed types for tested therapist: **One-on-One Therapy, Psychiatric Consultation**
- Org-level session types (from Admin Profile): Check-in Session, Child Therapy, +8 more (total ~10 types configured at org level — not all may be assigned to every therapist)
- This cascade means: **if a therapist hasn't configured their session types, Session Type will be empty and booking cannot proceed**

---

## Date / Time Slot Behavior (Critical Finding)

- Date is a **slot-based combobox**, NOT a free-form date/time picker or calendar widget
- Slots are pre-configured by therapist working hours (set in therapist profile: e.g. Mon–Sat 09:00 AM – 09:00 PM)
- **Empty slot dropdown observed** for tested therapist — either:
  - No future slots are configured/generated for this therapist, OR
  - Slot generation is broken/not set up in this tenant
- **No visual calendar** — admin cannot see the therapist's weekly availability view; they can only pick from a list of slot strings
- **No conflict detection** visible — if a slot is already booked, it's unclear whether it disappears from the dropdown or remains selectable
- **No duration visible** — slot shows date+time but no session duration/end time
- **Implication:** The booking flow is entirely dependent on therapist availability being properly configured in the system. If not configured, the Date field is always empty and booking is impossible without a workaround.

---

## Appointment History Tab — Full Column Set

| Column | Type | PHI? | Notes |
|---|---|---|---|
| Client | string (name) | Yes | Client's name |
| Contact | string | Yes | Client phone/email |
| Therapist | string | No | Therapist name |
| Session | string | No | Session type name |
| Date & Time | datetime | No | Scheduled datetime of session |
| Amount | decimal (Rs) | No | Amount charged for session |
| Status | enum | No | Upcoming, Completed (and likely: Cancelled, Pending) |
| Actions | buttons | No | Content unknown (no data rows); likely includes Reschedule, Cancel, View details |

### Appointment History Filter Controls

| Filter | Type | Options | Notes |
|---|---|---|---|
| Status | dropdown | Upcoming, Completed, All Bookings | |
| All Therapists | dropdown | Lists all therapists | |
| All Modes | dropdown | Inferred: Online, Offline, All | |
| Branch | dropdown | Lists org branches | |
| Date | date picker | Single date | Not a range picker |
| Search | text input | Free text search | |
| Export | icon button | — | Not clicked |

---

## Features

| Module | Feature | Sub-capability | Present? | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| Manual Booking | New Booking | Search existing client | Yes | 4 | By name/phone/email |
| Manual Booking | New Booking | Create client inline | Yes | 3 | Same 3-field modal |
| Manual Booking | New Booking | Therapist selection | Yes | 4 | All org therapists listed |
| Manual Booking | New Booking | Session mode (Online/Offline) | Yes | 4 | |
| Manual Booking | New Booking | Session type (per-therapist) | Yes | 3 | Cascading from therapist — can be empty |
| Manual Booking | New Booking | Slot-based date/time picker | Yes | 2 | Slot dropdown; no calendar view; empty if not configured |
| Manual Booking | New Booking | Online payment link | Yes | 3 | Auto-sends on booking |
| Manual Booking | New Booking | Cash payment option | Yes | 3 | Button label doesn't adapt — UX bug |
| Manual Booking | New Booking | Duration field | No | — | Not present |
| Manual Booking | New Booking | Notes/reason for visit field | No | — | Not present |
| Manual Booking | New Booking | Package/coupon application | No | — | Not present |
| Manual Booking | New Booking | Confirmation step | No | — | No preview before submit |
| Manual Booking | Appointment History | View all bookings | Yes | 3 | Multi-filter; all status types |
| Manual Booking | Appointment History | Filter by status | Yes | 4 | Upcoming/Completed/All |
| Manual Booking | Appointment History | Filter by therapist | Yes | 4 | |
| Manual Booking | Appointment History | Filter by mode | Yes | 3 | |
| Manual Booking | Appointment History | Filter by branch | Yes | 3 | |
| Manual Booking | Appointment History | Filter by date | Yes | 2 | Single date only — no range |
| Manual Booking | Appointment History | Free text search | Yes | 3 | |
| Manual Booking | Appointment History | Export | Yes | Unknown | |

---

## Data-fields (Additions / Corrections to Sessions File)

### Entity: Session (corrected / extended)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Session | Client | relation | Yes | — | Yes | Manual Booking | Selected from existing client list |
| Session | Therapist | relation | Yes | — | No | Manual Booking | 10 therapists in this tenant |
| Session | Session Mode | enum | Yes | Online, Offline | No | Manual Booking | Default: Online |
| Session | Session Type | enum | Yes | Per-therapist config (e.g. One-on-One Therapy, Psychiatric Consultation) | No | Manual Booking | Cascading from therapist |
| Session | Date / Time Slot | datetime (slot) | Yes | Slot-based (therapist-configured availability) | No | Manual Booking | Empty if therapist has no slots; no calendar UI |
| Session | Payment Method | enum | Yes | Online Payment, Cash Payment | No | Manual Booking | |
| Session | Amount | decimal | Auto | — | No | Appointment History | Calculated from session type rate |
| Session | Status | enum | Auto | Upcoming, Completed, All Bookings | No | Appointment History filter | |

---

## Flow

### F3 — Manual Booking (Complete Revised Flow)

| # | Actor role | Action | System response | Screen | Observations / pain points |
|---|---|---|---|---|---|
| 1 | Admin / Receptionist | Navigate to Manual Booking | New Booking tab opens with blank form | /manual-booking | No auto-redirect to Appointment History |
| 2 | Admin / Receptionist | Type client name/phone/email in Search Client | Live autocomplete shows matching existing clients | New Booking — Client Information | Client must already exist in system |
| 2a | Admin / Receptionist | (Alternative) Click "+ Create New Client" | 3-field modal opens (Name, Email, Phone) | Add Client modal | Quick path; client created with minimal data |
| 3 | Admin / Receptionist | Select Therapist from dropdown | Session Type dropdown becomes active; Date remains locked | Session Details | 10 therapists available; selecting one unlocks next field |
| 4 | Admin / Receptionist | Select Session Mode (Online / Offline) | Mode set; no other fields change | Session Details | Can be done before or after Session Type |
| 5 | Admin / Receptionist | Select Session Type from (now-active) dropdown | Session type set; Date dropdown becomes active | Session Details | Types are therapist-specific; can be empty if misconfigured |
| 6 | Admin / Receptionist | Click Date dropdown | Slot-based list of available date+time slots appears | Session Details | Empty if therapist has no configured slots; NO calendar view |
| 6a | System | (If no slots available) | Date dropdown shows empty list | Session Details | BLOCKING: Admin cannot complete booking; must configure therapist availability first |
| 7 | Admin / Receptionist | Select date/time slot | Slot selected | Session Details | No conflict detection visible |
| 8 | Admin / Receptionist | Select payment method (Online / Cash) | Radio selected; button label does NOT change | Payment Method | UX bug: button always reads "Create Booking & Send Payment Link" regardless of payment choice |
| 9 | Admin / Receptionist | Click "+ Create Booking & Send Payment Link" | (NOT EXECUTED — external-facing action) | — | Presumably: creates session record + sends payment link to client via WhatsApp/email |
| — | Admin / Receptionist | Alternative: Click "Clear" | Entire form resets; no confirmation | — | No undo |

**Information the clinician/admin must have at booking time:**
- Which therapist to assign (may not be obvious if client has no prior therapist relationship in system)
- Whether the therapist has configured availability slots for the desired date/time
- The correct session type from the therapist's offering list

---

## Key Gaps for Replication

1. **No therapist availability calendar** — admin cannot see open slots on a weekly/monthly view; must rely on the slot dropdown (which can be empty)
2. **Slot-based model with no fallback** — if a therapist's schedule is not configured, the Date field is permanently empty and booking is impossible
3. **No notes/reason for visit** — no clinical context captured at booking
4. **No package or coupon application** at point of booking
5. **Payment send is hardwired to booking** — no way to create a booking without triggering a payment communication (even for cash payments)
6. **Button label bug** — "Send Payment Link" doesn't adapt when Cash is selected
7. **No booking confirmation step** — no summary screen before submission
8. **No session duration** — appointment length is not set by the admin
9. **Client field is search-only** — no way to open client profile from booking form
10. **Single-date filter** in Appointment History — cannot search across a date range

---

## Phase 2 Status Report — Manual Booking (Supplemental)

- **Module / flow:** Manual Booking (deep pass)
- **Additional screens captured:** 0 new screens (same 2 tabs); deeper field-level data added
- **Additional features identified:** 8 (slot behavior, cascading session type, therapist count, etc.)
- **Additional data fields:** Corrections and extensions to Session entity
- **Additional integrations:** 0 new
- **Blocking questions:** None

---
*End of Phase 2 — Manual Booking (Supplemental Deep Scan)*

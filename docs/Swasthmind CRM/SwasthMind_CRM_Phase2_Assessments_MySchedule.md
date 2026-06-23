# Swasth-Mind CRM — Phase 2: Assessments Module + My Schedule (Bonus)
**Scan date:** 2026-04-19
**CRM URL:** crm.swasthmind.com
**Tenant type:** PRODUCTION (PHI redaction active)
**Role scanned as:** Admin (Super Admin)
**Screens covered:** Automated Reports (/user-assessments), Manual Assessments (/manual-assessments → /my-schedule), My Schedule (Add Slots modal — Auto Mode & Custom Mode)

---

## CRITICAL BUG FINDING

### Navigation Routing Bug: "Manual Assessments" → My Schedule

- **Symptom:** Clicking "Manual Assessments" in the Assessments sidebar submenu navigates to /my-schedule (My Schedule screen), NOT to any assessment management screen.
- **URL evidence:** /manual-assessments redirects to /my-schedule (confirmed by two separate navigations)
- **Browser heading:** Page heading renders as "Manual Assessments" (from nav label) while content heading says "My Schedule"
- **Impact:** The "Manual Assessments" module as labeled in the RBAC configuration does not have a working screen. Either:
  (a) This feature is not yet built and the nav entry is a placeholder pointing to My Schedule by mistake, or
  (b) "Manual Assessments" was intentionally rebranded/merged into My Schedule at the route level but the nav label was never updated
- **For replication:** Treat "Manual Assessments" as a **planned but unbuilt feature** in this CRM. No manual assessment send capability was found.

---

## Screen

### Automated Reports — List View

- **CRM:** Swasth-Mind CRM
- **Path:** Assessments > Automated Reports
- **URL:** /user-assessments
- **Primary purpose:** Read-only view of assessments that have been automatically sent to and completed by clients (post-session, triggered by flows)
- **Key UI elements:** None — empty state illustration only
- **Data shown:** Empty state — "No User-assessments yet."
- **Filters:** None visible
- **Actions available:** None — completely read-only; no add, no filter, no export
- **Table columns:** Unknown — no data to reveal headers
- **Notes / pain points:**
  - No admin controls whatsoever — this is a pure result-viewer
  - No search, no date filter, no therapist filter, no export
  - Automated assessments are presumably triggered by Session Follow-up Flows (see that module) — there is no way to manually send an assessment from this screen
  - Very likely that assessment delivery is automated through the follow-up flow engine, not through direct admin action
  - PHI risk: once populated, this screen would show client names + assessment results; no masking observed
- **Screenshot ref:** ss_3608pt3x2

---

### Manual Assessments — Screen (ROUTING BUG)

- **CRM:** Swasth-Mind CRM
- **Path:** Assessments > Manual Assessments
- **URL:** /manual-assessments → REDIRECTS TO /my-schedule
- **Primary purpose:** UNKNOWN — nav label says "Manual Assessments" but content is My Schedule
- **Key UI elements:** See My Schedule screen below
- **Notes:** This is a confirmed routing bug. No manual assessment sending screen exists at this URL. See My Schedule section for actual screen content.
- **Screenshot refs:** ss_1608allc3 (showing both nav label "Manual Assessments" and content "My Schedule")

---

### My Schedule — List View (accessed via Manual Assessments nav OR /my-schedule direct)

- **CRM:** Swasth-Mind CRM
- **Path:** My Schedule (top-level nav) = Assessments > Manual Assessments (nav bug)
- **URL:** /my-schedule
- **Primary purpose:** Manage therapist availability slots — define when each therapist is available for bookings; these slots power the Date picker in Manual Booking
- **Key UI elements:** Date range filter, Therapist dropdown, Add Slots button, Export button, empty-state table
- **Data shown:** Empty state — "No My-schedules found using the current filters."
- **Filter controls:**
  - Date From (date picker)
  - Date To (date picker)
  - Therapist (dropdown — defaults to org name)
  - Export/Download button (not clicked)
  - Clear filters link
- **Actions available:**
  - Add Slots (opens Add Slots modal — primary action)
  - Export (not clicked)
  - Clear filters
- **Table columns:** Unknown — no data present; presumably: Date, Time, Therapist, Session Type, Mode, Status, Actions
- **Notes / pain points:**
  - This is the **availability management engine** for the entire booking system — without slots configured here, booking is impossible
  - No visual calendar view — only a tabular list of slots
  - Admin must manually configure slots for every therapist via the Add Slots modal
  - No bulk configuration across all therapists at once
  - Export available (presumably exports slot schedule to CSV)
- **Screenshot refs:** ss_1608allc3, ss_1610n02wm

---

### My Schedule — Add Slots Modal (Auto Mode)

- **CRM:** Swasth-Mind CRM
- **Path:** My Schedule > Add Slots > Auto Mode tab
- **Primary purpose:** Automatically generate recurring availability slots for a therapist across a date range and selected days
- **Description text:** "Choose Auto Mode to generate slots automatically between your start and end time."
- **Fields:**

  **Date Range:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | Start Date | date picker | Yes | dd/mm/yyyy |
  | End Date | date picker | Yes | dd/mm/yyyy |

  **Select Days and Time Ranges:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | Sunday | checkbox | No | Check to include this day |
  | Monday | checkbox | No | |
  | Tuesday | checkbox | No | |
  | Wednesday | checkbox | No | |
  | Thursday | checkbox | No | |
  | Friday | checkbox | No | |
  | Saturday | checkbox | No | |
  | [After checking a day] Start Time | time picker | Yes | Time range for that day |
  | [After checking a day] End Time | time picker | Yes | Time range for that day |

  **Session Type:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | Slot type | radio | No | Only option observed: "Session" |

  **Session Configuration:**
  | Field | Type | Required | Notes |
  |---|---|---|---|
  | Mode of Consultation | multi-select dropdown | Yes | Options: Offline, Online (can select both) |

- **Submit action:** "Add Sessions"
- **Notes:**
  - In Auto Mode, each checked day gets ONE time range (start–end); slots are auto-generated within that window
  - No slot duration/interval field visible — slot duration may be set at therapist profile level or session type level
  - No therapist selector in this modal — therapist is set by the Therapist filter on the list view before opening Add Slots
- **Screenshot refs:** ss_7628wnpdw, ss_8862m74wq (scrolled), ss_86285jx3x (mode dropdown), ss_66091n1u8 (bottom of form)

---

### My Schedule — Add Slots Modal (Custom Mode)

- **CRM:** Swasth-Mind CRM
- **Path:** My Schedule > Add Slots > Custom Mode tab
- **Primary purpose:** Create multiple availability windows per day (e.g., morning AND evening slots)
- **Description text:** "Choose Custom Mode to create multiple availability ranges (e.g., morning and evening sessions)."
- **Fields:** Same as Auto Mode BUT:
  - When a day checkbox is ticked, reveals: Start Time / to / End Time AND an **"+ Add Time Range"** link
  - "+ Add Time Range" allows adding a second (or more) time window for the same day
  - This enables therapists with split schedules (e.g., 9–12 AM and 2–6 PM) to define both blocks

- **Key difference from Auto Mode:** Multiple time range blocks per day vs. one block per day
- **Submit action:** "Add Sessions"
- **Screenshot refs:** ss_66091n1u8, ss_9393xcpjw (Sunday checked with time range revealed)

---

## Features

| Module | Feature | Sub-capability | Present? | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| Automated Reports | View completed assessments | List view | Yes | Unknown | Empty state; no data to assess quality |
| Automated Reports | Filter assessments | Any filter | No | 1 | Zero filters present — major gap |
| Automated Reports | Export results | Export | No | 1 | No export button visible |
| Automated Reports | Send assessment manually | From this screen | No | — | Not possible from this screen |
| Manual Assessments | Any assessment functionality | — | No | 1 | Routing bug — redirects to My Schedule |
| My Schedule | Availability management | View slot calendar | Partial | 2 | List view only — no visual calendar |
| My Schedule | Availability management | Add slots (Auto Mode) | Yes | 3 | Date range + day selection + time range |
| My Schedule | Availability management | Add slots (Custom Mode) | Yes | 4 | Multiple time ranges per day |
| My Schedule | Availability management | Filter by therapist | Yes | 3 | Dropdown filter |
| My Schedule | Availability management | Filter by date range | Yes | 3 | Date From / Date To |
| My Schedule | Availability management | Export schedule | Yes | Unknown | Export button present, not clicked |
| My Schedule | Availability management | Edit/Delete existing slots | Unknown | Unknown | No data to test |
| My Schedule | Slot modes | Online slots | Yes | 3 | Mode of Consultation = Online |
| My Schedule | Slot modes | Offline slots | Yes | 3 | Mode of Consultation = Offline |
| My Schedule | Slot modes | Both Online + Offline per slot | Yes | 4 | Multi-select allows both |

---

## Data-fields

### Entity: User Assessment (Automated Report — columns unknown)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| User Assessment | (all fields unknown) | — | — | — | — | /user-assessments | Empty state; no data or column headers visible |

### Entity: Schedule Slot (from Add Slots modal inference)

| Entity | Field | Type | Required? | Enum values | PHI? | Source screen | Notes |
|---|---|---|---|---|---|---|---|
| Schedule Slot | Therapist | relation | Yes | — | No | My Schedule list (filter) | Therapist the slot belongs to |
| Schedule Slot | Start Date | date | Yes | — | No | Add Slots modal | Beginning of validity period |
| Schedule Slot | End Date | date | Yes | — | No | Add Slots modal | End of validity period |
| Schedule Slot | Day of Week | multi-enum | Yes | Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday | No | Add Slots modal | One or more days selected |
| Schedule Slot | Start Time | time | Yes (per day) | — | No | Add Slots modal | Time range start for selected day |
| Schedule Slot | End Time | time | Yes (per day) | — | No | Add Slots modal | Time range end for selected day |
| Schedule Slot | Additional Time Ranges | time pairs | No | — | No | Add Slots modal (Custom Mode) | Multiple blocks per day in Custom Mode |
| Schedule Slot | Slot Type | enum | No | Session | No | Add Slots modal | Only one type observed |
| Schedule Slot | Mode of Consultation | multi-enum | Yes | Online, Offline (both selectable) | No | Add Slots modal | |

---

## Integration

| Category | Function | Vendor | Direction | Protocol | BAA required? | Notes |
|---|---|---|---|---|---|---|
| Assessment Delivery | Automated assessment sending | Unknown | Out | Unknown | Unknown | Inferred: automated assessments are triggered by Session Follow-up Flows; no direct send from Assessments module |

---

## Flow

### F6 — Assessment Delivery (Observed Capability)

| # | Actor role | Action | System response | Screen | Observations / pain points |
|---|---|---|---|---|---|
| 1 | Admin | Navigate to Assessments > Automated Reports | Empty list — no assessments completed yet | /user-assessments | No controls; purely a results viewer |
| 2 | Admin | Navigate to Assessments > Manual Assessments | ROUTING BUG: Redirected to My Schedule | /my-schedule | Feature not built or misconfigured |
| — | System | (Automated path) After session completion, Follow-up Flow triggers assessment send | Assessment sent to client (WhatsApp/email assumed); result appears in Automated Reports when completed | /user-assessments | Assessment delivery is tied to Session Follow-up Flows, not to this module directly |
| — | Admin | (No manual send path found) | — | — | There is NO manual "send assessment to client" workflow visible in the CRM as of this scan |

**Critical gap:** There is no admin-initiated assessment send flow. Assessment delivery appears entirely automated via Session Follow-up Flows. The "Manual Assessments" module either does not exist yet or is broken.

---

## My Schedule Bonus Capture

### Why My Schedule Matters for Booking

The My Schedule module is the **backbone of the booking date/time availability system**:
1. Admin navigates to My Schedule
2. Selects a therapist from the Therapist dropdown
3. Clicks "Add Slots"
4. Chooses Auto Mode (single time window per day) or Custom Mode (multiple windows per day)
5. Sets date range, selects days, sets time range(s), selects slot type and mode
6. Clicks "Add Sessions" — slots are generated and stored
7. These slots then appear in the Manual Booking → Date dropdown for that therapist

**Without this configuration, the Manual Booking Date field is always empty and booking cannot proceed.**

---

## Phase 2 Status Report — Assessments + My Schedule

- **Module / flow:** Assessments (Automated Reports + Manual Assessments) + My Schedule (bonus capture)
- **Screens captured:** 4 (Automated Reports, Manual Assessments/routing bug, My Schedule, Add Slots modal)
- **Features identified:** 15
- **Data fields cataloged:** 9 (Schedule Slot entity; User Assessment entity unknown)
- **Integrations noted:** 1 (automated assessment delivery via flows)
- **Blocking questions:** None
- **Bug documented:** Manual Assessments nav → My Schedule routing bug

### Key observations for replication workbook:

1. **Assessments module is severely underdeveloped** — Automated Reports is a read-only result list with no controls; Manual Assessments doesn't exist as a screen
2. **No manual assessment send capability** — cannot push a PHQ-9, GAD-7, or any questionnaire to a client from within the CRM through a manual action
3. **No assessment template library visible** — no way to see what assessments are configured or create new ones from the UI
4. **Assessment results are locked in Automated Reports** with no filter or export — very limited utility for clinical monitoring
5. **My Schedule is the unsung critical module** — everything in booking depends on it, but it's buried under a broken nav label and has no visual calendar
6. **Slot configuration is manual and tedious** — admin must add slots per therapist per date range; no recurring weekly template feature observed (Auto Mode does date range + day selection, which is the closest to a recurring pattern)
7. **Custom Mode is the power feature** — allows split-day availability (morning/evening) which is practically essential for busy clinicians

---
*End of Phase 2 — Assessments Module + My Schedule*

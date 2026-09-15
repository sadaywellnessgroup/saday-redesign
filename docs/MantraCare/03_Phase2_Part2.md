# MantraCare — Phase 2 Deep Capture (Provider Portal), Part 2

**Role**: Therapist/Provider (own/test account) · **Scanned**: 2026-09-12
**Sections covered**: Forms & form templates · Appointments & scheduling · Settings (availability, subscription, provider pricing) · Billing, Insurance & Claims, Invoicing · Prescriptions
**All names, emails, phone numbers and record IDs are [REDACTED].**

---

## ⚠️ CRITICAL SAFETY FINDING — the prescription formulary is systematically wrong

**Where**: Prescriptions (`/tools/prescription`) → open a prescription → Medicine → "+ Add" → searchable medicine picker.

The drug picker contains **51 entries** built from roughly 16 brand names and 16 active ingredients that have been **paired essentially at random**. The first four rows happen to be correct, and from there the ingredient column is offset and then permuted, so the same brand name appears repeatedly mapped to different drugs.

| Brand shown | Ingredient the picker states | Actual active ingredient |
|---|---|---|
| Prozac | Fluoxetine 20 mg | ✅ correct |
| Zoloft | Sertraline 50 mg | ✅ correct |
| Cipralex | Escitalopram 10 mg | ✅ correct |
| Elavil | Amitriptyline 25 mg | ✅ correct |
| **Paxil** | Sertraline 20 mg | ❌ **paroxetine** |
| **Effexor** | Fluoxetine 75 mg | ❌ **venlafaxine** |
| **Cymbalta** | Escitalopram 30 mg | ❌ **duloxetine** |
| **Remeron** | Amitriptyline 15 mg | ❌ **mirtazapine** |
| **Desyrel** | Paroxetine 50 mg | ❌ **trazodone** |
| **Celexa** | Venlafaxine 20 mg | ❌ **citalopram** |
| **Luvox** | Duloxetine 50 mg | ❌ **fluvoxamine** |
| **Wellbutrin** | Mirtazapine 150 mg | ❌ **bupropion** |
| **Pristiq** | Trazodone 50 mg | ❌ **desvenlafaxine** |
| **Anafranil** | Citalopram 25 mg | ❌ **clomipramine** |
| **Valdoxan** | Fluvoxamine 25 mg | ❌ **agomelatine** |
| **Trintellix** | Bupropion 10 mg | ❌ **vortioxetine** |

Further down the same list the same brands reappear with yet other ingredients — e.g. Zoloft = Desvenlafaxine, Zoloft = Amitriptyline; Cipralex = Clomipramine, Cipralex = Vortioxetine; Paxil = Agomelatine; Remeron = Escitalopram and Remeron = Citalopram; Trintellix = Mirtazapine. **Paxil, Remeron, Trintellix, Desyrel, Celexa, Luvox, Wellbutrin, Pristiq and Anafranil are never paired with their correct ingredient anywhere in the list.**

**Why it matters**: this sits behind a **"Submit Prescription"** button in a live provider portal, on an account credentialed as *Psychiatrist*, and the picker is the only structured medication entry point in the product. A prescriber choosing "Cymbalta" from the list produces a prescribing record stating *Escitalopram Oxalate 30 mg* — a wrong-drug error, at a dose that also exceeds the usual maximum for escitalopram (20 mg). Several of the mispairings cross drug classes (an SNRI rendered as a TCA, an NDRI rendered as a tetracyclic), which is exactly the class of error that causes serotonin syndrome, hypertensive events or discontinuation reactions.

This reads like seeded demo data that was never replaced — but it is shipped and reachable in the production portal.

**Recommendation**: if you hold a provider account here, do not use the prescription module for real prescribing until this is fixed, and it is worth reporting to MantraCare directly. For your own build, this is the strongest possible argument for sourcing a medication database from a licensed drug-data vendor (First Databank, Medi-Span, RxNorm/DailyMed as a free baseline) rather than hand-seeding a table.

**Screenshot ref**: [ss_4316fhwg5](screenshots/provider/prescriptions__formulary-picker__ss_4316fhwg5.png)

---

## Screen

### Forms (list)
- **Path**: Forms (`/custom-forms`)
- **Primary purpose**: "Manage custom forms and view submissions"
- **Key UI elements**: Service-scope selector; "Create a New Form"; four tabs — **Forms | Archived | Entries | Required Forms**; searchable table; 4 row-action icons (share, preview, send, duplicate); rows-per-page.
- **Data shown**: 3 seeded templates — **Insurance info (#16), Telehealth Consent Form (#15), AI Consent Form (#14)**; all Type = `TEMPLATE`, Services = `N/A`, Entries = `0`.
- **Actions**: create · preview (read-only route) · share · send to client · duplicate · archive · filter entries
- **Notes / pain points**:
  - **Three good consent artifacts exist and none of them are wired into any flow.** Services = N/A, Entries = 0, and the Required Forms tab reports "No required forms found for your service." So consent is a document you must remember to send, not a gate on booking or on turning on AI transcription.
  - ID sequence starts at #14, implying earlier forms exist platform-wide or were removed.
  - **Entries** tab has a Status filter, so submissions carry a review state — columns: Date, EntryID, Name, FormName, Status, Actions.
  - **Required Forms** is scoped "for your service" and appears to be platform-set rather than provider-set — a provider cannot obviously make their own form mandatory.
- **Screenshot ref**: [ss_75686oskf](screenshots/provider/forms__list__ss_75686oskf.png)

### Form preview (read-only)
- **Path**: `/custom-forms/preview/[id]` — a genuinely read-only route, badged "Preview Mode"
- **Field types observed across the three templates** (this is effectively the builder's palette):
  static content/intro block · section heading · required radio group · single checkbox confirm · multi-statement checkbox acknowledgement · short text · dropdown/select · long text · **file upload** (PDF, DOC, JPG, PNG; max 10MB) · **signature field** · **date field** · required markers
- **#14 AI Consent Form**: intro ("About AI Tools in Your Sessions") → *Recording & Transcription*: two required consent radios (AI-assisted transcription; transcript used to auto-generate notes, "reviewed and finalized by your provider") → *Data Retention*: required acknowledgement that transcripts are stored securely and may be deleted on request → Signature* → Date
- **#15 Telehealth Consent Form**: intro → *Understanding Telehealth*: three required acknowledgements (video/audio delivery; possible technical disruption; risks including privacy in a non-clinical setting) → "Where do you typically plan to attend sessions from?" (text) → required "I confirm I will be in a private location during sessions" → required acknowledgement of the right to request an in-person visit where available → Signature* → Date
- **#16 Insurance info**: *Insurance Details* — Insurance Company*, Member ID*, Group/Plan ID, Policy Holder Name (if different), Relationship to Policy Holder (Self/Spouse/Child/Other), **Insurance Card — Front*** (file), **Insurance Card — Back*** (file), required financial-responsibility acknowledgement, Signature*, Date
- **Notes**: the consent *copy* is clear, specific and unusually honest about AI — it names human review, denies clinical decision-making by AI, and grants a deletion right. Content quality is a genuine strength; enforcement is the gap.
- **Screenshot ref**: [ss_093481hlx](screenshots/provider/forms__preview__ss_093481hlx.png)

### Create a New Form (step 1)
- **Path**: Forms > Create a New Form
- **Fields**: Form Title * · Service Association (All Services (General) / Psychiatrist / General Physician / Addiction Treatment / OCD) · Description (optional) · Cancel / Continue
- **Notes**: **not submitted** — the field-type palette sits behind Continue, which creates a record. Flagged for your decision rather than exercised.

### Appointments
- **Path**: Appointments (`/appointments`)
- **Primary purpose**: "View and manage all your scheduled sessions"
- **Key UI elements**: "+ Add"; client-scope dropdown; search by client or service; Filter; status tabs with counts — **Upcoming (0) · Done (1) · Pending (0) · All (1)**; a "Past Appointments" drawer.
- **Notes / pain points**: only three states, with no cancelled / no-show / rescheduled state visible — so no-show tracking (the core operational metric of a therapy practice) has nowhere to live. No calendar/agenda view at this level; it is a list only.
- **Screenshot ref**: [ss_0777ququo](screenshots/provider/appointments__list__ss_0777ququo.png)

### Add appointment (chooser → wizard)
- **Path**: Appointments > + Add
- **Flow**: chooser "What do you want to do?" → **Appointments** ("Book a future session with a client") or **Log past session** ("Record a session that already took place") → *Choose Client* → *Schedule Appointment*
- **Schedule Appointment fields**: **timezone selector** (default `(GMT+05:30) Asia/Calcutta`) · 7-day horizontal date strip with prev/next · time-slot list · **Session type: Video | In person** (Video default) · Continue (disabled until a slot is picked)
- **Notes / pain points**:
  - Retroactive session logging is a first-class path — good for real practice.
  - **No duration, fee, service, location, or recurring-series control** at booking. Duration is inherited from the availability slot; a recurring weekly client must be booked one session at a time.
  - When the selected day has no slot the modal says "No available slots for this date. **Add a time slot to open up more availability**" and offers an inline "Add time slot" that **navigates the provider out of the booking flow into Settings** and opens an availability editor on top of it. Mid-booking, that is a jarring context switch that loses the booking.
  - Modality vocabulary is inconsistent across the product — the same concept is called **"In-Person"** (note wizard), **"In person"** (booking) and **"Offline"** (invoice). Any analytics on modality will fragment.
- **Screenshot ref**: [ss_34846ve4t](screenshots/provider/appointments__add-1__ss_34846ve4t.png), [ss_0209nk2wk](screenshots/provider/appointments__add-2__ss_0209nk2wk.png)

### Settings > Availability
- **Path**: Settings (`/settings`) > Availability
- **Key UI elements**: tabs **Time Slot | Day Off | Calendar** + timezone selector (`Asia/Calcutta`)
- **Time Slot**: per-weekday rows, each holding slot chips (this account: `9:00 AM - 1:00 PM` Mon–Fri) with a delete icon. Editor modal "Add Time Slots" = **From / To** time (hh:mm AM-PM segmented) + **Days** chips (Sun–Sat, "Select All") + Save & Apply.
- **Day Off**: table Date | Duration | **Repeat Every Year**; empty; "Add Day Off".
- **Calendar**: **Google Calendar only** on this plan — "Connect your google account… We'll only sync appointment times. Your data remains private." (Outlook exists but is paywalled — see pricing.)
- **Notes / pain points**: availability is a **recurring weekly pattern only**; there is no per-date override, no buffer between sessions, no per-service or per-modality slot type, no max-per-day cap, and no lead-time/cut-off rule. Day Off covers annual holidays but not "I'm away next Tuesday afternoon".
- **Screenshot ref**: [ss_94277qsmz](screenshots/provider/availability__1__ss_94277qsmz.png), [ss_7667fngvf](screenshots/provider/availability__2__ss_7667fngvf.png), [ss_0882usf05](screenshots/provider/availability__3__ss_0882usf05.png)

### Settings > Practice Details / Team/Providers / Notifications
- **Status**: all three render **"Coming Soon"**.
- **Notes / pain points**: this is significant. **Team/Providers is unbuilt, so the portal is single-practitioner in practice** even though the Growth and Scaler plans are sold for "growing practices & small teams" and "large clinics & multi-location practices". **Notifications is unbuilt, so a provider cannot configure any reminder or alert** — which is precisely the gap the paid tiers and the third-party MantraAssist add-on are sold to fill. And Practice Details being unbuilt means no practice branding, letterhead, NPI/tax identity or location record.
- **Screenshot ref**: [ss_5614cd3dg](screenshots/provider/settings__practice__ss_5614cd3dg.png), [ss_9198b781s](screenshots/provider/settings__team__ss_9198b781s.png), [ss_1749aweo6](screenshots/provider/settings__notifications__ss_1749aweo6.png)

### Settings > Subscription  ← the monetization model
- **Tabs**: Overview | Payments | Manage Credit Usage | How it works
- **Current plan**: `EHR Free Plan` · Credits included **100** · Billing `N/A` · "Manage Plan"
- **Metered EHR tools**: **AI Transcriber · Session Notes · Prescription · Appointments · Records**
- **Credit usage breakdown**: "Each tool draws from the **org wallet**. Set a cap to prevent any one tool from consuming the full balance." Per-tool cards show credits used, "% of EHR usage", and a **Monthly Cap** (default "No cap") with "Edit Cap".
- **Credit Usage History**: Tool | Activity | Credits | Date — one row: `System — Default free plan grant — +100 — Sep 12, 2026`. Total Credits Used: 0.
- **Buy More Credits**: **500 Credits = $10.00** one-time · **1K Credits = $20.00** one-time → flat **$0.02/credit**, no volume break.
- **Notes / pain points**: the per-tool card strip scrolls horizontally with no visible affordance, so tools beyond the third are hidden. The Overview "100 credits" becomes "**0 credits**" on the Annual toggle for the Free tier — a display defect.
- **Screenshot ref**: [ss_5551vq4xv](screenshots/provider/settings__subscription-1__ss_5551vq4xv.png), [ss_5932h9j12](screenshots/provider/settings__subscription-2__ss_5932h9j12.png), [ss_84147ubmo](screenshots/provider/settings__subscription-3__ss_84147ubmo.png), [ss_4714fevoq](screenshots/provider/settings__subscription-4__ss_4714fevoq.png)

### Billing
- **Path**: Billing (`/billing`) — "Manage client bills, copays, and outstanding balances."
- **Tabs**: **Bills | Insurance**
- **Bills**: "+ Create Bill"; filter chips **Unbilled Sessions · All · Client Owes · Pending · Draft**
- **Insurance → Insurance & Claims**: "Manage your unbilled sessions and submitted claims." Sub-tabs **Unbilled Sessions | Claims**
  - Unbilled Sessions columns: DATE OF SERVICE · CLIENT · **PAYER** · SERVICE · BILL · NOTES
  - Claims columns: **CLAIM #** · DATE · CLIENT · **PAYER** · **STATUS** · **AMOUNT** · ACTION ("No claims ready to submit.")
- **Notes**: this is a real US-style revenue-cycle shape — payer-aware, claim-numbered, status-tracked. Combined with "Credentialing & Enrollment Access" (Basic) and "Insurance claim management & submissions" (Scaler), MantraCare is positioning as an insurance-billing practice platform, not just a marketplace.
- **Screenshot ref**: [ss_464949uq8](screenshots/provider/billing__hub-1__ss_464949uq8.png), [ss_1116zyhr3](screenshots/provider/billing__hub-2__ss_1116zyhr3.png)

### Create Invoice
- **Path**: `/invoices/create`
- **Fields**: From (provider) · Bill To (client) · **Bill Type: Self Pay | Insurance** · Issued date · Due Date (defaults to +1 month) · **Currency** (searchable ~150-currency list, default **Indian Rupee (INR)**) · CLIENT INFORMATION (name, phone, email — prefilled) · PROVIDER INFORMATION (name, phone, email — prefilled) · **Link sessions *** (checkbox list of sessions, validation "Select at least one session to create this invoice", plus "Add past session") · **Line Items** (Description [searchable, e.g. "50 Mins Therapy"], Quantity, **Tax (%)**, Amount, delete; "+ Add Line Item") · Subtotal · **Discount** (Fixed amount / percentage) · Tax (from line items) · **Total** · **Save Invoice** | **Save Invoice and Add Payment**
- **Notes / pain points**:
  - **No CPT/HCPCS procedure code and no ICD diagnosis code anywhere on the invoice**, yet Bill Type = Insurance and a claims pipeline exists. A US insurance claim cannot be adjudicated without them, so either the claim form carries them (not reachable on this account — no payer on file) or the insurance path is incomplete.
  - **Currency defaults to INR while the provider subscription is priced in USD** — a single account straddles two currency regimes with no visible FX or payout logic.
  - Tax is a per-line-item percentage (GST-shaped). US behavioral health is typically tax-exempt, so this is an India-first money model wearing a US insurance jacket.
  - The linked session shows **"Offline · 15 min"** while the default line item reads **"50 Mins Therapy"** at ₹150 — duration on the session and duration in the billed item are unconnected, so mis-billing is the default rather than the exception.
  - Dates render `12/09/2026` for today (12 Sep) — DD/MM — against USD pricing and US claim vocabulary. Locale is inconsistent across the same account.
- **Screenshot ref**: [ss_9651ivljv](screenshots/provider/invoice__create-1__ss_9651ivljv.png), ss_8937zzwoq

### Prescriptions
- **Path**: Prescriptions (`/tools/prescription` — note the singular route vs. the plural label; `/tools/prescriptions` 404s)
- **List**: client-scope dropdown, search, Filter, "+ Add Prescription"; rows show client, **#id**, prescriber · service, date, and an amber status dot. This account holds **two unsubmitted draft prescriptions** (#[REDACTED], #[REDACTED]), both dated Sep 9 2026.
- **Record** (`/prescriptions/[id]/edit`): Language selector · client header · **CHIEF COMPLAINTS** · **MEDICAL HISTORY** · **ALLERGIES** · **Provisional diagnosis** [+Add] · **Diagnostic tests** [+Add] · **Medicine** [+Add, searchable formulary] · **NOTES** · **Submit Prescription**
- **Notes / pain points**:
  - **This is where the real clinical record lives** — chief complaint, history, allergies, diagnosis and investigations exist *only* here, not on the client record and not on the session note. So a client's clinical picture is scattered across prescription documents, and a therapist who never prescribes has nowhere to record any of it.
  - **Medications are captured structurally here but as free text on the session note** — the two will never reconcile, and there is no single medication list per client.
  - The list's **"View" action opens an editable form**, not a read-only view — mislabelled and risky on a clinical document.
  - No allergy–drug interaction check, no duplicate-therapy check, no dose validation (see the 30 mg escitalopram example above), and no controlled-substance handling.
  - "Submit Prescription" appears to be the finalize step; there is no visible signed/locked state or amendment trail afterwards.
- **Screenshot ref**: [ss_005701oz7](screenshots/provider/prescriptions__screen-1__ss_005701oz7.png), [ss_6251fwnct](screenshots/provider/prescriptions__screen-2__ss_6251fwnct.png), [ss_483158fwu](screenshots/provider/prescriptions__screen-3__ss_483158fwu.png)

---

## Pricing (provider side — "EHR + Practice", USD)

| Tier | Monthly | Annual | Annual saving | Credits | Client profiles | Key additions |
|---|---|---|---|---|---|---|
| **FREE** | **$0** (no card) | $0 | — | 100 (one-time grant) | **up to 10** | AI Transcriber, AI Session Notes |
| **BASIC** | **$49/mo** | **$470/yr** | $118 | 1,000/mo · 12,000/yr | **up to 50** | **Credentialing & Enrollment Access**, **5 free insurance claims/mo** |
| **GROWTH** ★ Recommended | **$99/mo** | **$950/yr** | $238 | 3,000/mo · 36,000/yr | **unlimited** | **Automated appointment reminders**, **Calendar sync (Google & Outlook)**, **Automatic insurance status checks**, 10 free claims/mo |
| **SCALER** | **$149/mo** | **$1,430/yr** | $358 | 5,000/mo · 60,000/yr | unlimited | **Premium support phone line**, **Insurance claim management & submissions**, **Group appointments & telehealth**, 35 free claims/mo |

**Credit top-ups**: 500 credits $10 · 1,000 credits $20 (flat $0.02/credit).

**Reading of the model**
- Annual is a flat ~20% discount across all paid tiers.
- Subscription credits cost ~$0.049 each at Basic and ~$0.033 at Growth — i.e. **more per credit than a $0.02 top-up**. You are not buying credits with a subscription; you are buying feature unlocks and caseload headroom, with credits attached.
- **The caseload cap is the real lever**: 10 clients free, 50 at $49, unlimited at $99. A working solo therapist crosses 10 almost immediately, so Free is a trial in all but name.
- **Everything a practice actually needs operationally is paywalled above the middle tier** — reminders, Outlook sync, eligibility checks and claim submission — while the settings UI for teams, notifications and practice identity is still "Coming Soon". The tiers currently sell capabilities the product cannot yet configure.
- Insurance claims are individually metered (5 / 10 / 35 per month), which is an unusual and quite aggressive meter for a billing function.

---

## Features (part 2)

| Section | Feature | Sub-capability | Present? | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| Forms | Form templates | Consent & insurance templates | Yes | **4** | Content genuinely well drafted |
| Forms | Form templates | Wired into any flow | **No** | 1 | 0 entries, Services N/A, no required forms |
| Forms | Builder | Field-type palette | Partial | Unknown | Behind a record-creating step; not exercised |
| Forms | Builder | Service association | Yes | 3 | Incl. "All Services (General)" |
| Forms | Submissions | Entries list + status filter | Yes | 3 | Status workflow implied |
| Forms | Submissions | Read-only preview route | Yes | 4 | `/custom-forms/preview/[id]` |
| Forms | Lifecycle | Archive | Yes | 3 | Dedicated tab |
| Forms | Lifecycle | Provider-set mandatory forms | **No** | 1 | "Required Forms" appears platform-set |
| Forms | Fields | E-signature | Yes | 4 | Signature + Date on all three templates |
| Forms | Fields | File upload | Yes | 4 | PDF/DOC/JPG/PNG, 10MB |
| Appts | List | Status tabs | Partial | 2 | Upcoming/Done/Pending only |
| Appts | List | No-show / cancelled / rescheduled state | **No** | 1 | Nowhere to record the key ops metric |
| Appts | List | Calendar / agenda view | **No** | 2 | List only at this level |
| Appts | Booking | Timezone-aware | Yes | 4 | Explicit selector, IST default |
| Appts | Booking | Session modality | Yes | 3 | Video / In person; vocabulary inconsistent |
| Appts | Booking | Duration / fee / location at booking | **No** | 1 | Inherited or absent |
| Appts | Booking | Recurring series | **No** | 1 | One session at a time |
| Appts | Booking | Log past session | Yes | 4 | First-class retroactive path |
| Sched | Availability | Recurring weekly slots | Yes | 3 | From/To + day chips |
| Sched | Availability | Per-date override / buffers / lead time / daily cap | **No** | 1 | None of it |
| Sched | Availability | Annual day-off | Yes | 3 | "Repeat Every Year" |
| Sched | Calendar sync | Google | Yes | 3 | OAuth; free tier |
| Sched | Calendar sync | Outlook | Partial | 2 | Exists but paywalled at Growth |
| Sched | Calendar sync | iCal / CalDAV feed | **No** | 1 | None |
| Settings | Practice identity | Practice details | **No** | 1 | Coming Soon |
| Settings | Multi-user | Team / Providers | **No** | 1 | Coming Soon — portal is solo-only |
| Settings | Notifications | Any preference at all | **No** | 1 | Coming Soon |
| Settings | Subscription | Credit metering + per-tool caps | Yes | **4** | Genuinely well modelled |
| Settings | Subscription | Usage history ledger | Yes | 4 | Tool / activity / credits / date |
| Settings | Subscription | Self-serve top-up | Yes | 3 | 500/1K packages |
| Billing | Bills | Bill lifecycle states | Yes | 3 | Draft / Pending / Client Owes |
| Billing | Bills | Unbilled-sessions work queue | Yes | 4 | Good operational idea |
| Billing | Invoicing | Multi-currency | Yes | 3 | ~150 currencies, INR default |
| Billing | Invoicing | Line items, tax, discount | Yes | 4 | Per-item tax %, fixed/percent discount |
| Billing | Invoicing | Session linkage required | Yes | 4 | Enforced — good control |
| Billing | Invoicing | CPT / ICD coding | **No** | 1 | Absent despite an insurance bill type |
| Billing | Invoicing | Record payment | Yes | 3 | "Save Invoice and Add Payment" |
| Billing | Insurance | Payer-aware unbilled queue | Yes | 3 | PAYER column |
| Billing | Insurance | Claim numbering / status / amount | Yes | 3 | Table shape present, no data to test |
| Billing | Insurance | Eligibility / status checks | Partial | 2 | Paywalled at Growth |
| Rx | Clinical record | Chief complaint / history / allergies | Yes | 3 | **Only** lives here |
| Rx | Clinical record | Provisional diagnosis, diagnostic tests | Yes | 3 | Free-form add |
| Rx | Medication | Structured formulary picker | Yes | **1** | **Data is systematically wrong — see safety finding** |
| Rx | Medication | Interaction / allergy / dose checking | **No** | 1 | None |
| Rx | Medication | Reconciliation with note "Medications" field | **No** | 1 | Two disconnected stores |
| Rx | Lifecycle | Submit / finalize | Yes | 2 | No visible lock or amendment trail |
| Rx | Localisation | Prescription language | Yes | 4 | Language selector present |

---

## Data-fields (part 2)

| Entity | Field | Type | Required? | Enum values | PII/PHI? | Source screen |
|---|---|---|---|---|---|---|
| Form | Title | string | Yes | — | — | Create a New Form |
| Form | Service association | enum | No | All Services (General), Psychiatrist, General Physician, Addiction Treatment, OCD | — | Create a New Form |
| Form | Description | text | No | — | — | Create a New Form |
| Form | Type | enum | system | TEMPLATE (others unseen) | — | Forms list |
| Form | Entries count | int | system | — | — | Forms list |
| FormEntry | Date, EntryID, Name, FormName, Status | mixed | system | status enum not enumerable (empty) | **PII** | Entries tab |
| Appointment | Client | relation | Yes | — | PII | Booking wizard |
| Appointment | Timezone | enum | Yes | IANA zones, default Asia/Calcutta | — | Booking wizard |
| Appointment | Date | date | Yes | — | PHI (indirect) | Booking wizard |
| Appointment | Time slot | relation | Yes | from availability | — | Booking wizard |
| Appointment | Session type | enum | Yes | Video, In person | — | Booking wizard |
| Appointment | Status | enum | system | Upcoming, Done, Pending | — | Appointments list |
| Availability | From / To time | time | Yes | — | — | Add Time Slots |
| Availability | Days | enum (multi) | Yes | Sun–Sat | — | Add Time Slots |
| Availability | Timezone | enum | Yes | default Asia/Calcutta | — | Settings > Availability |
| DayOff | Date, Duration, Repeat Every Year | date/int/bool | — | — | — | Settings > Day Off |
| Subscription | Plan | enum | system | EHR Free, Basic, Growth, Scaler | — | Settings > Subscription |
| Subscription | Plan credits / purchased credits | int | system | — | — | Settings > Subscription |
| Subscription | Per-tool monthly cap | int | No | default "No cap" | — | Manage Credit Usage |
| CreditLedger | Tool, Activity, Credits, Date | mixed | system | — | — | Credit Usage History |
| Invoice | Bill Type | enum | Yes | Self Pay, Insurance | — | Create Invoice |
| Invoice | Issued / Due date | date | Yes | — | — | Create Invoice |
| Invoice | Currency | enum | Yes | ~150 currencies, default INR | — | Create Invoice |
| Invoice | Linked sessions | relation[] | **Yes** | — | PHI (indirect) | Create Invoice |
| InvoiceLine | Description | string (searchable) | Yes | e.g. "50 Mins Therapy" | — | Create Invoice |
| InvoiceLine | Quantity / Tax % / Amount | number | Yes | — | — | Create Invoice |
| Invoice | Discount | enum + number | No | Fixed amount / percentage | — | Create Invoice |
| Bill | Status | enum | system | Draft, Pending, Client Owes | — | Billing |
| Claim | Claim #, Date, Client, Payer, Status, Amount | mixed | system | status enum not enumerable (empty) | **PHI** | Insurance > Claims |
| Prescription | Language | enum | Yes | multi-language | — | Rx record |
| Prescription | Chief complaints | text | No | — | **PHI** | Rx record |
| Prescription | Medical history | text | No | — | **PHI** | Rx record |
| Prescription | Allergies | text | No | — | **PHI (high)** | Rx record |
| Prescription | Provisional diagnosis | list | No | free-form | **PHI** | Rx record |
| Prescription | Diagnostic tests | list | No | free-form | **PHI** | Rx record |
| Prescription | Medicine | relation[] (formulary) | No | 51 entries, **mappings unreliable** | **PHI** | Rx record |
| Prescription | Notes | text | No | — | **PHI** | Rx record |
| Prescription | Status | enum | system | draft → submitted (amber dot observed) | — | Rx list |

---

## Additional integrations found

| Category | Function | Vendor | Direction | Where observed | Notes |
|---|---|---|---|---|---|
| Calendar | Two-way appointment sync | **Google Calendar** (OAuth) | both | Settings > Calendar | Free tier; "appointment times only" |
| Calendar | Two-way appointment sync | **Microsoft Outlook** | both | Growth plan feature list | Paywalled; not configurable on Free |
| Payments | Credit top-up purchase | not disclosed in UI | out | Buy More Credits | Provider not exercised |
| Insurance | Payer/claims rails | not disclosed (no clearinghouse named) | both | Billing > Insurance | Vendor unidentified — worth confirming |
| Insurance | Credentialing & enrolment | MantraCare-operated service | — | Basic plan feature | Sold as plan feature |
| Drug data | Medication formulary | **none — appears hand-seeded** | — | Rx > Medicine | See safety finding |

---

## Phase 2 (part 2) status block

- **Section / flow**: Forms · Appointments & scheduling · Settings (availability, subscription, pricing) · Billing, Insurance & Claims, Invoicing · Prescriptions
- **Screens captured**: 12 (part 1 + part 2 = 21 provider screens)
- **Features identified**: 47 rows this part (87 cumulative)
- **Integrations noted**: 6 new (18 cumulative)
- **Data fields catalogued**: 40 this part (76 cumulative)
- **Defects logged**: 9 — wrong drug formulary (critical) · transcript modal clipped and unsubmittable at ≤740px viewport height with no scroll · Escape does not close dropdowns and option lists swallow clicks aimed at the field below · record ID rendered twice on the client record · "View" opens an editable prescription form · modality called In-Person / In person / Offline in three places · session duration and billed line item unconnected · annual Free tier shows "0 credits" · per-tool credit cards scroll horizontally with no affordance
- **Not exercised (deliberate)**: Create-a-Form Continue (creates a record) · Save Invoice · Save & Apply on availability · Submit Prescription · Start Recording · Send (assessments and forms) · Google Calendar OAuth · Buy Now (credits) · Get Started (paid plans)

### Remaining for Phase 2
Client Leads/Requests · the "For Mantra Provider" submenu (Mantra Premium, Mantra Earnings, Bank & Tax, Tasks, Marketing) · Messages · Refer and Earn · the client-record Insurance/Claims tiles (need a payer on file)

# SwasthMind CRM — Phase 2 Module Scan: My Therapists
**Scanned:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin | **URL:** /my-therapists → /mytherapists/create

---

## SITEMAP

| Module | Sub-module | URL | Notes |
|---|---|---|---|
| My Therapists | Therapist List | /my-therapists | Empty state in current scan — "No Mytherapists yet." (distinct from booking therapist roster which has 10 active therapists) |
| My Therapists | Therapist Onboarding Form (Create) | /mytherapists/create | Full multi-section onboarding form |
| My Therapists | Therapist Detail/Edit | /mytherapists/{id}/show or /edit | Not navigated — inferred from create pattern |

---

## SCREENS

| Screen ID | Name | URL | Description | Screenshot Ref |
|---|---|---|---|---|
| THER-01 | My Therapists — List (Empty State) | /my-therapists | Empty state: "No Mytherapists yet. Do you want to add one?"; single "+ Create" button; no list/table visible | ss_8556bpma3 |
| THER-02 | Therapist Onboarding Form | /mytherapists/create | Multi-section accordion form; 3 collapsible sections: Personal Information, Professional Details, Practice Details; "Create" submit button | ss_85588wivs |
| THER-03 | Practice Details — Session Type Row | /mytherapists/create (Practice Details expanded) | Inline row for adding session type pricing: Session Type, Duration (min), Buffer (min), Price INR Domestic, Price INR International; × delete row | ss_8571ixf0m |

---

## FEATURES

| Feature ID | Name | Screen | Description | Trigger | Destructive? |
|---|---|---|---|---|---|
| THER-F01 | Therapist list | THER-01 | Paginated list of therapists (empty in scan; separate from the 10 therapists in booking system) | Nav click | No |
| THER-F02 | Create therapist | THER-01 → THER-02 | "+ Create" button navigates to full onboarding form | Click link | No |
| THER-F03 | Accordion form sections | THER-02 | Three collapsible accordion sections; can collapse/expand individually | Click section header | No |
| THER-F04 | Upload Profile Picture | THER-02 | File upload with drag & drop zone; image file | File upload | No |
| THER-F05 | Upload Letter Head | THER-02 | File upload for practice letterhead document | File upload | No |
| THER-F06 | Upload Signature | THER-02 | File upload for clinician signature (used in invoices/reports) | File upload | No |
| THER-F07 | Add Qualification (dynamic list) | THER-02 | "Add" button adds qualification entries to a dynamic list | Click Add | No |
| THER-F08 | Social Media Links | THER-02 | 6 URL fields for public profile links (LinkedIn, Instagram, YouTube, Facebook, Custom, X/Twitter) | Free text | No |
| THER-F09 | Add Session Type (inline row) | THER-02 → THER-03 | "+ Add Session Type" button adds inline configuration row; supports multiple session types | Click button | No |
| THER-F10 | Delete Session Type row | THER-03 | × button removes that session type row | Click × | No |
| THER-F11 | Create therapist profile | THER-02 | "Create" (with floppy disk icon) submit button creates the therapist record | Click submit | Creates record |
| THER-F12 | Non-editable field note | THER-02 | Warning banner: "Note: For non editable fields, please contact Swasth Mind." — some fields locked post-creation | Read-only notice | No |

---

## DATA-FIELDS

### Section 1: Personal Information

| Field ID | Name | Type | Required | Notes |
|---|---|---|---|---|
| THER-D01 | Therapist Name | Text | Yes (*) | Full display name |
| THER-D02 | Email | Text | Yes (*) | Login/contact email |
| THER-D03 | Phone Number | Text | Yes (*) | Contact phone |
| THER-D04 | Date of Birth | Date (dd/mm/yyyy) | No | — |
| THER-D05 | Gender | Dropdown (enum) | No | Options: (blank), Male, Female, Other |
| THER-D06 | Professional Summary | Textarea | No | Short summary; likely shown on public profile |
| THER-D07 | Personal Bio | Textarea | No | Longer bio for public landing page |
| THER-D08 | Profile Picture | File upload | No | Image file; drag & drop or click to upload |
| THER-D09 | Letter Head | File upload | No | Practice letterhead; used in document generation |
| THER-D10 | Signature | File upload | No | Digital signature image; used in invoices/reports |

### Section 2: Professional Details

| Field ID | Name | Type | Required | Notes |
|---|---|---|---|---|
| THER-D11 | Professional Title | Dropdown (enum) | No | 28+ options (see full list below) |
| THER-D12 | Qualifications | Dynamic list | No | "Add" button; each entry = one qualification credential |
| THER-D13 | Specializations | Multi-select dropdown | No | 20+ options (see partial list below) |
| THER-D14 | License/Registration No. | Text | No | Regulatory license number |
| THER-D15 | Years of Experience | Number | No | Integer |
| THER-D16 | Languages Spoken | Autocomplete multi-select | No | Free-text + suggestions |
| THER-D17 | Concerns Addressed | Multi-select dropdown | No | 18 options (see list below) |
| THER-D18 | LinkedIn URL | Text (URL) | No | e.g. https://linkedin.com/in/yourprofile |
| THER-D19 | Instagram URL | Text (URL) | No | e.g. https://instagram.com/yourprofile |
| THER-D20 | YouTube URL | Text (URL) | No | e.g. https://youtube.com/@yourchannel |
| THER-D21 | Facebook URL | Text (URL) | No | e.g. https://facebook.com/yourpage |
| THER-D22 | Custom URL | Text (URL) | No | Any custom website or profile link |
| THER-D23 | X (Twitter) URL | Text (URL) | No | e.g. https://x.com/yourprofile |

### Section 3: Practice Details — Session Type Configuration (per row)

| Field ID | Name | Type | Required | Notes |
|---|---|---|---|---|
| THER-D24 | Session Type | Dropdown | No | Links to system session types |
| THER-D25 | Duration (minutes) | Number | No | Session duration in minutes |
| THER-D26 | Buffer (minutes) | Number | No | Buffer time between sessions |
| THER-D27 | Price (₹ INR) (Domestic) | Number | No | INR price for domestic clients |
| THER-D28 | Price (₹ INR) (International) | Number | No | INR price for international clients (separate pricing tier) |

---

## DROPDOWN OPTION LISTS

### Professional Title (28+ options, full list observed):
Clinical Psychologist, Counseling Psychologist, Psychiatrist (MD/DO), Psychiatric Nurse Practitioner (PMHNP), Marriage and Family Therapist (LMFT), Child and Adolescent Therapist, Trauma Therapist, Addiction Counselor (CADC/LCADC/CCS), Grief Counselor, Sex Therapist, Geriatric Therapist, Military/Veteran Counselor, Cognitive Behavioral Therapist (CBT Practitioner), Dialectical Behavior Therapist (DBT Practitioner), Behavioral Therapist (BCBA – Board Certified Behavior Analyst), Mindfulness-Based Therapist, Art Therapist (ATR/ATR-BC), Music Therapist (MT-BC), Animal-Assisted Therapist, Hypnotherapist, Licensed Clinical Social Worker (LCSW/LICSW), Community Mental Health Counselor, Public Health Mental Health Professional, Employee Assistance Program (EAP) Counselor, Occupational Therapist (OT – Mental Health Focus), Industrial-Organizational Psychologist, Licensed Professional Counselor (LPC/LCSW/LMHC/LCPC), Early Childhood Neuro Coach for Moms, NLP Therapist

### Specializations (20+ options, partial list observed):
Cognitive Behavioral Therapy, Trauma-Informed Care, Family Therapy, Clinical Psychology, Psychiatry, Neuropsychology, Forensic Psychology, Counseling Psychology, Health Psychology, Marriage and Family Therapy (MFT), Child and Adolescent Psychology, School Psychology, Substance Abuse Counseling, Grief Counseling, Sex Therapy, Trauma and PTSD Therapy, Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), Acceptance and Commitment Therapy (ACT), Behavioral Analysis & Therapy, Clinical Social Work (LCSW), Community Mental Health Counseling, Public Mental Health, Mindfulness-Based Therapy, Art Therapy, Music Therapy, Animal-Assisted Therapy, Geriatric Psychology, Military and Veteran Psychology, Rehabilitation Psychology

### Concerns Addressed (18 options observed):
Anxiety, Depression, Stress, Burnout, Relationships, ADHD, Self-Esteem, Grief, Trauma, Anger Management, OCD, Phobias, Sleep Issues, Addiction, Eating Disorders, Parenting, Career Counseling, Life Transitions

### Gender (3 options + blank):
Male, Female, Other

---

## FLOWS

| Flow ID | Name | Steps | Notes |
|---|---|---|---|
| THER-FL01 | Onboard new therapist | 1. My Therapists list → click "+ Create". 2. Navigate to /mytherapists/create. 3. Fill Personal Information (Name*, Email*, Phone* required). 4. Expand Professional Details; fill title, qualifications, specializations, etc. 5. Expand Practice Details; click "+ Add Session Type" per session type; enter duration, buffer, prices (domestic + international). 6. Click "Create" to submit. | Multiple file uploads supported (photo, letterhead, signature) |
| THER-FL02 | Add multiple session types | 1. In Practice Details, click "+ Add Session Type" (can be clicked multiple times). 2. Each click adds a new inline row. 3. Fill Session Type, Duration, Buffer, Domestic Price, International Price per row. 4. × to delete a row. | Row-based inline editing; no modal |

---

## PERMISSIONS

| Role | Can View | Can Create | Can Edit | Can Delete | Notes |
|---|---|---|---|---|---|
| Admin | Yes | Yes | Yes (with note: some fields locked) | Unknown | Full access observed |
| Other roles | Unknown | Unknown | Unknown | Unknown | RBAC from Phase 1 includes My Therapists in module matrix |

---

## INTEGRATIONS

| Integration | Direction | Detail |
|---|---|---|
| Public landing page | Outbound | Social media links and profile data (bio, photo, specializations) feed public therapist profile; note in form: "These links will be displayed on your public profile (landing page)" |
| Invoice/document generation | Internal | Letter Head and Signature uploads used in generated invoices and session documents |

---

## COMPLIANCE

| Item | Detail |
|---|---|
| PHI / PII present | Therapist PII collected: name, email, phone, DOB; redacted in this report |
| License tracking | License/Registration No. field supports regulatory compliance documentation |
| Non-editable fields | Some fields become locked after creation — requires Swasth Mind support to change (noted in UI warning) |

---

## DATA-MODEL

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| Therapist (My Therapists) | name, email, phone, dob, gender, professional_summary, bio, profile_picture, letterhead, signature, professional_title (enum), qualifications (array), specializations (array), license_no, years_experience, languages (array), concerns (array), social_links (object with 6 URL fields) | Has many SessionTypePricings; linked to Schedule (My Schedule) | This entity appears to be the admin-managed therapist profile — distinct from the 10 booking-system therapists currently in prod. The booking system therapists may have been onboarded through a different path or the list may not yet show in My Therapists. |
| SessionTypePricing | session_type (FK), duration_minutes, buffer_minutes, price_domestic (INR), price_international (INR) | Belongs to Therapist | Per-therapist per-session-type pricing configuration; supports domestic vs international pricing tiers |

---

## KEY FINDINGS & ANOMALIES

| # | Finding | Implication |
|---|---|---|
| 1 | My Therapists list shows "No Mytherapists yet" even though 10 therapists exist in booking | Strong signal that the 10 booking therapists were onboarded via a different path (e.g., Admin/User Management → direct account creation) rather than the My Therapists onboarding form |
| 2 | International pricing tier (separate INR price for international clients) | Clinic serves international clients; pricing differentiation built into core data model |
| 3 | Buffer time per session type | Thoughtful scheduling design — buffer prevents back-to-back booking overruns |
| 4 | Signature upload for invoices | Paperless invoicing workflow with doctor's digital signature; medico-legal compliance signal |
| 5 | Letter Head upload | Branded clinic letterhead for patient-facing documents |
| 6 | Public landing page links | CRM connects to a patient-facing marketing/landing page showing therapist profiles with social links |
| 7 | "For non editable fields, contact Swasth Mind" | Some fields have admin/support locks — SaaS restriction pattern; operator cannot self-service all fields |
| 8 | Professional Title list includes non-clinical titles (NLP Therapist, Early Childhood Neuro Coach) | Platform supports diverse wellness practitioners beyond licensed clinicians |
| 9 | Typo in section header: "Personal Informationw" | Minor UI bug in the onboarding form section heading |

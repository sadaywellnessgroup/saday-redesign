# SwasthMind CRM — Phase 5: Data Model
**Generated:** 2026-04-19
**Source:** Synthesized from Phase 1–4 findings (12 MD files, no additional browsing)
**Tenant:** Production | **Role scanned as:** Admin

---

## 0. How to Read This Document

| Symbol | Meaning |
|--------|---------|
| PK | Primary key |
| FK | Foreign key |
| NN | Not null |
| UQ | Unique |
| ? | Inferred / not directly observed |
| ⚠ | Gap or design concern |
| ENUM | Closed value set — all known values listed |

All field names are **camelCase** approximations derived from DOM labels; actual DB column names may differ.

---

## 1. Entity Catalogue

### 1.1 Organisation

The top-level tenant. Every record in the system belongs to an Organisation.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | Internal tenant ID |
| name | VARCHAR(255) | NN | e.g., "Saday Wellness Group" |
| slug | VARCHAR(100) | UQ, NN | Used in subdomain routing |
| logoUrl | VARCHAR(512) | | Org branding |
| timezone | VARCHAR(64) | NN | e.g., "Asia/Kolkata" |
| currency | CHAR(3) | NN, default INR | ISO 4217 |
| whatsappNumber | VARCHAR(20) | | Linked to WhatsApp Business API |
| metaPageId | VARCHAR(100) | | Meta (FB) page integration |
| createdAt | TIMESTAMP | NN | |
| updatedAt | TIMESTAMP | NN | |

**Relationships:** 1 Organisation → many Therapists, Clients, Appointments, Conversations, Policies, Roles, FollowUpFlows.

---

### 1.2 UserRole

Defines the four named roles in the RBAC system.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | Tenant-scoped |
| name | ENUM | NN | Values: Admin, Manager, Receptionist, Therapist |
| isSystemRole | BOOL | NN, default true | All 4 observed are system roles |
| createdAt | TIMESTAMP | NN | |

**Relationships:** 1 UserRole → many RBACPermissions; many Users have one UserRole.

---

### 1.3 RBACPermission

One row per (Role × Module) pair representing the access grant.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| roleId | INT | FK → UserRole, NN | |
| moduleKey | VARCHAR(100) | NN | Slug of the CRM module |
| moduleName | VARCHAR(150) | NN | Human-readable label |
| hasAccess | BOOL | NN, default false | Checkbox state from /rbac-config |
| updatedAt | TIMESTAMP | NN | |

**Known moduleKey values (29 total from /rbac-config):**
my-clients, sessions, manual-booking, assessments, my-schedule, conversations, reports, my-therapists, cancellation-reschedule, session-followups, seminars, ecommerce, bulk-messages, internships, career, faq-tutorials, dashboard, calendar, billing, packages, discounts, prescriptions, tasks, notes, documents, audit-log, settings, integrations, rbac-config

**Access matrix summary (from Phase 4):**

| Module | Admin | Manager | Receptionist | Therapist |
|--------|-------|---------|--------------|-----------|
| My Clients | ✓ | ✓ | ✓ | ✗ |
| Sessions | ✓ | ✓ | ✓ | ✗ |
| Manual Booking | ✓ | ✓ | ✓ | ✗ |
| Assessments | ✓ | ✓ | ✗ | ✗ |
| My Schedule | ✓ | ✓ | ✓ | ✗ |
| Conversations | ✓ | ✓ | ✓ | ✗ |
| Reports | ✓ | ✓ | ✗ | ✗ |
| My Therapists | ✓ | ✓ | ✗ | ✗ |
| Cancellation & Reschedule | ✓ | ✓ | ✗ | ✗ |
| Session Follow-ups | ✓ | ✓ | ✓ | ✗ |
| All other modules | ✓ | varies | varies | ✗ |
| **Therapist role total** | — | — | — | **0/29** ⚠ |

⚠ **Critical gap P-01:** Therapist role has zero access to all 29 modules. Likely a configuration error or placeholder.

---

### 1.4 User (Staff/Provider)

CRM login accounts. Distinct from Client (patient-facing).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| roleId | INT | FK → UserRole, NN | |
| email | VARCHAR(255) | UQ, NN | Login identifier |
| firstName | VARCHAR(100) | NN | |
| lastName | VARCHAR(100) | NN | |
| phone | VARCHAR(20) | | |
| isActive | BOOL | NN, default true | |
| lastLoginAt | TIMESTAMP | | |
| createdAt | TIMESTAMP | NN | |

**Relationships:** A User may optionally be linked to a Therapist profile (1:1 or 1:0).

---

### 1.5 Therapist

Professional profile for clinical staff. Separate from the User login record.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| userId | INT | FK → User | Nullable — therapist may not have CRM login |
| firstName | VARCHAR(100) | NN | |
| lastName | VARCHAR(100) | NN | |
| gender | ENUM | | Values: Male, Female, Other |
| dateOfBirth | DATE | | |
| phone | VARCHAR(20) | | |
| email | VARCHAR(255) | | |
| address | TEXT | | |
| profilePhotoUrl | VARCHAR(512) | | |
| professionalTitle | ENUM(29) | | Full list: Psychologist, Psychiatrist, Counsellor, Therapist, Life Coach, Career Coach, Relationship Counsellor, CBT Specialist, DBT Therapist, Art Therapist, Play Therapist, Child Psychologist, Adolescent Therapist, Family Therapist, Couples Therapist, Trauma Therapist, EMDR Therapist, Neuropsychologist, Clinical Social Worker, Occupational Therapist, Speech Therapist, Nutritionist, Wellness Coach, Mindfulness Coach, Yoga Therapist, Sex Therapist, Addiction Counsellor, Grief Counsellor, Geriatric Specialist |
| specializations | VARCHAR[] / JSON | | Multi-select; 30+ values (anxiety, depression, OCD, PTSD, etc.) |
| concernsAddressed | VARCHAR[] / JSON | | Multi-select; 18 values observed |
| bio | TEXT | | |
| yearsOfExperience | INT | | |
| languagesSpoken | VARCHAR[] | | |
| isActive | BOOL | NN, default true | |
| createdAt | TIMESTAMP | NN | |
| updatedAt | TIMESTAMP | NN | |

**Relationships:** 1 Therapist → many SessionTypePricings; many Appointments; many FollowUpFlows; appears in 10 therapist dropdown options across modules.

---

### 1.6 SessionTypePricing

Defines what session formats and prices a Therapist offers. One row per session type per therapist.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| therapistId | INT | FK → Therapist, NN | |
| sessionType | ENUM | NN | Values: Individual, Couple, Family, Group, Child (inferred from booking form options) |
| durationMinutes | INT | NN | e.g., 30, 45, 60, 90 |
| bufferMinutes | INT | | Post-session buffer |
| priceDomesticINR | DECIMAL(10,2) | NN | |
| priceInternationalINR | DECIMAL(10,2) | | |
| isActive | BOOL | NN, default true | |

---

### 1.7 Client

Patient / end-user profile. Does NOT have a CRM login; interacts via WhatsApp or booking portal.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| firstName | VARCHAR(100) | NN | PHI |
| lastName | VARCHAR(100) | NN | PHI |
| email | VARCHAR(255) | | PHI |
| phone | VARCHAR(20) | | PHI — primary contact channel (WhatsApp) |
| dateOfBirth | DATE | | PHI |
| gender | ENUM | | Values: Male, Female, Other |
| address | TEXT | | PHI |
| emergencyContactName | VARCHAR(200) | | PHI |
| emergencyContactPhone | VARCHAR(20) | | PHI |
| source | VARCHAR(100) | | Referral source |
| tags | VARCHAR[] | | Searchable labels (from client list filter) |
| assignedTherapistId | INT | FK → Therapist | Primary therapist |
| isActive | BOOL | NN, default true | |
| createdAt | TIMESTAMP | NN | |
| updatedAt | TIMESTAMP | NN | |

**Relationships:** 1 Client → many Appointments, Conversations, Assessments, Submissions.

---

### 1.8 SessionPackage

Prepaid bundle of sessions. Purchased by a Client for a specific Therapist/type.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| clientId | INT | FK → Client, NN | |
| therapistId | INT | FK → Therapist | |
| sessionType | ENUM | | Same ENUM as SessionTypePricing |
| totalSessions | INT | NN | Sessions included in bundle |
| usedSessions | INT | NN, default 0 | |
| remainingSessions | INT | COMPUTED | totalSessions - usedSessions |
| pricePerSession | DECIMAL(10,2) | NN | Locked at time of purchase |
| totalPrice | DECIMAL(10,2) | NN | |
| validityDays | INT | | Expiry period |
| expiresAt | DATE | | |
| status | ENUM | NN | Values: Active, Exhausted, Expired, Cancelled |
| createdAt | TIMESTAMP | NN | |

---

### 1.9 Discount

Coupon or discount applied to a booking.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| code | VARCHAR(50) | UQ, NN | Coupon code string |
| discountType | ENUM | NN | Values: Percentage, Fixed Amount |
| discountValue | DECIMAL(10,2) | NN | % or INR amount |
| applicableTo | ENUM | | Values: All, Specific Therapist, Specific Session Type (?) |
| therapistId | INT | FK → Therapist | Nullable — if therapist-specific |
| maxUses | INT | | NULL = unlimited |
| usedCount | INT | NN, default 0 | |
| expiresAt | DATE | | |
| isActive | BOOL | NN, default true | |
| createdAt | TIMESTAMP | NN | |

---

### 1.10 Appointment (Session)

Core transactional entity. Represents a single booked therapy session.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| clientId | INT | FK → Client, NN | |
| therapistId | INT | FK → Therapist, NN | |
| sessionType | ENUM | NN | Individual / Couple / Family / Group / Child |
| scheduledDate | DATE | NN | |
| startTime | TIME | NN | |
| endTime | TIME | NN | |
| durationMinutes | INT | NN | |
| status | ENUM | NN | Values: Scheduled, Completed, Cancelled, No-show, Rescheduled |
| bookingChannel | ENUM | | Values: CRM (manual), WhatsApp Bot, Online Portal |
| packageId | INT | FK → SessionPackage | Nullable — if booked via package |
| discountId | INT | FK → Discount | Nullable |
| priceINR | DECIMAL(10,2) | NN | Gross price at time of booking |
| discountAmountINR | DECIMAL(10,2) | default 0 | |
| netAmountINR | DECIMAL(10,2) | NN | |
| paymentStatus | ENUM | NN | Values: Pending, Paid, Refunded, Waived |
| paymentMethod | ENUM | | Values: Cash, UPI, Card, Bank Transfer, Package |
| paymentLinkSent | BOOL | default false | |
| cancellationReason | TEXT | | Populated on cancel |
| cancelledByRole | ENUM | | Values: Admin, Client, Therapist |
| rescheduledFromId | INT | FK → Appointment | Self-ref — previous appointment |
| meetingLink | VARCHAR(512) | | Video call URL |
| notes | TEXT | | Internal admin notes |
| createdAt | TIMESTAMP | NN | |
| updatedAt | TIMESTAMP | NN | |

**Relationships:**
- 1 Appointment → 0..1 SessionInvoice
- 1 Appointment → 0..1 Submission (follow-up response)
- 1 Appointment → 0..1 Assessment (assigned post-session)

---

### 1.11 SessionInvoice (Report)

Financial ledger record linked to an Appointment. Observed in /my-report.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| appointmentId | INT | FK → Appointment, NN | |
| clientId | INT | FK → Client, NN | Denormalized for quick lookup |
| therapistId | INT | FK → Therapist, NN | Denormalized |
| clientEmail | VARCHAR(255) | | Snapshot at invoice time; PHI |
| clientPhone | VARCHAR(20) | | Snapshot at invoice time; PHI |
| sessionDate | DATE | NN | |
| startTime | TIME | NN | |
| endTime | TIME | NN | |
| durationMinutes | INT | NN | |
| grossAmountINR | DECIMAL(10,2) | NN | |
| discountAmountINR | DECIMAL(10,2) | default 0 | |
| netAmountINR | DECIMAL(10,2) | NN | |
| paymentStatus | ENUM | NN | Values: Paid, Pending, Refunded |
| invoiceNumber | VARCHAR(50) | UQ | Auto-generated |
| createdAt | TIMESTAMP | NN | |

⚠ **Gap R-01:** No KPI or aggregate metric fields visible — this is a per-row ledger only, not a reporting engine.

---

### 1.12 OrganisationPolicy (Cancellation & Reschedule)

Single policy record per Organisation (singleton-pattern table).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, UQ, NN | One policy per org |
| rescheduleWindowHours | INT | NN | Hours before session; observed value: 3 |
| cancellationWindowHours | INT | NN | Hours before session; observed value: 8 |
| refundPercentage | INT | NN | 0–100; observed value: 100 |
| refundProcessing | ENUM | NN | Values: Automatic, Manual; observed: Manual |
| cancellationFeeINR | DECIMAL(10,2) | default 0 | Flat fee if applicable |
| allowClientCancellation | BOOL | NN | Whether client can self-cancel |
| allowClientReschedule | BOOL | NN | Whether client can self-reschedule |
| updatedAt | TIMESTAMP | NN | |

---

### 1.13 Conversation

A WhatsApp conversation thread between the organisation's bot/team and a (prospective) client.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| clientId | INT | FK → Client | Nullable — prospect may not be a client yet |
| contactPhone | VARCHAR(20) | NN | PHI — WhatsApp number |
| contactName | VARCHAR(200) | | PHI |
| origin | ENUM | NN | Values: WhatsApp (only observed value) |
| status | ENUM | | Values: Open, Closed, Escalated (?) |
| firstInteractionAt | TIMESTAMP | NN | |
| lastInteractionAt | TIMESTAMP | NN | |
| totalMessages | INT | | |
| createdAt | TIMESTAMP | NN | |

**Relationships:** 1 Conversation → many Messages; 1 Conversation → 0..1 ConversationAnalysis.

---

### 1.14 Message

Individual message within a Conversation thread.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| conversationId | INT | FK → Conversation, NN | |
| senderType | ENUM | NN | Values: Client, Bot, Agent |
| senderName | VARCHAR(200) | | PHI if client |
| body | TEXT | NN | PHI — message content |
| messageType | ENUM | | Values: Text, Image, Audio, Document (?) |
| sentAt | TIMESTAMP | NN | |
| isRead | BOOL | default false | |
| botEventTag | VARCHAR(100) | | e.g., "Appointment flow initiated", "Main menu provided" |

---

### 1.15 ConversationAnalysis

AI-generated analysis record attached to a Conversation.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| conversationId | INT | FK → Conversation, UQ, NN | One analysis per conversation |
| category | ENUM | NN | Values: Therapy Potential, Emotional Distress, Information/Exploration, Transactional/Admin, SOS |
| urgencyScore | INT | NN | Range: 1–5 |
| aiSummary | TEXT | | AI-generated summary; PHI-sensitive |
| keyThemes | VARCHAR[] / JSON | | Array of theme chip strings |
| analysedAt | TIMESTAMP | NN | |
| modelVersion | VARCHAR(50) | ? | AI model version (inferred; not observed directly) |

⚠ **Gap C-01:** SOS category has urgency implications but no observed escalation automation (no alert, assignment, or notification flow tied to SOS flag).

---

### 1.16 Assessment

A questionnaire or psychometric instrument assigned to a Client.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| clientId | INT | FK → Client, NN | |
| therapistId | INT | FK → Therapist | Assigning clinician |
| appointmentId | INT | FK → Appointment | Nullable — may be standalone |
| assessmentType | VARCHAR(100) | NN | e.g., PHQ-9, GAD-7, custom name |
| status | ENUM | NN | Values: Assigned, Completed, Expired |
| assignedAt | TIMESTAMP | NN | |
| completedAt | TIMESTAMP | | |
| score | DECIMAL(6,2) | | Computed total score |
| interpretation | TEXT | | Clinician or system interpretation |
| responseData | JSON | | Raw question-answer pairs; PHI |

⚠ **Gap A-01:** No observed versioning of assessment templates; custom assessments may overwrite historical response schema.

---

### 1.17 FollowUpFlow

A configured sequence of check-in or feedback steps sent to clients post-session.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| therapistId | INT | FK → Therapist | Nullable — may be org-level |
| flowType | ENUM | NN | Values: CheckIn, Feedback |
| name | VARCHAR(200) | NN | |
| isActive | BOOL | NN, default true | |
| triggerType | ENUM | NN | Values: After Session (observed) |
| triggerOffsetHours | INT | NN | Hours after session to send; observed on Check-in tab only |
| deliveryChannel | ENUM | NN | Values: WhatsApp (observed) |
| totalSteps | INT | NN | Number of questions/steps |
| publishedToMeta | BOOL | NN, default false | Whether flow is live on WhatsApp |
| createdAt | TIMESTAMP | NN | |
| updatedAt | TIMESTAMP | NN | |

⚠ **Gap FU-01:** Feedback flow is missing the triggerOffsetHours field in the UI — it is present in Check-in but absent in Feedback tab.

---

### 1.18 FlowStep (FlowQuestion)

A single question or message step within a FollowUpFlow.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| flowId | INT | FK → FollowUpFlow, NN | |
| stepNumber | INT | NN | Display order |
| questionText | TEXT | NN | Prompt shown to client |
| questionType | ENUM | NN | Values: Single Choice, Multi Choice, Open Text, Scale/Rating, Section Header |
| isRequired | BOOL | NN, default true | |
| createdAt | TIMESTAMP | NN | |

---

### 1.19 FlowStepOption

Answer choices for Single Choice or Multi Choice FlowStep questions.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| flowStepId | INT | FK → FlowStep, NN | |
| optionText | VARCHAR(255) | NN | |
| sortOrder | INT | NN | |

---

### 1.20 Submission

A client's completed response to a FollowUpFlow, linked to an Appointment.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| organisationId | INT | FK → Organisation, NN | |
| flowId | INT | FK → FollowUpFlow, NN | |
| clientId | INT | FK → Client, NN | |
| appointmentId | INT | FK → Appointment | Nullable |
| therapistId | INT | FK → Therapist | |
| submittedAt | TIMESTAMP | NN | |
| completionStatus | ENUM | NN | Values: Complete, Partial, Skipped |
| deliveryChannel | ENUM | NN | Values: WhatsApp |

---

### 1.21 SubmissionResponse

Individual answer to a FlowStep question within a Submission.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INT | PK, NN | |
| submissionId | INT | FK → Submission, NN | |
| flowStepId | INT | FK → FlowStep, NN | |
| responseText | TEXT | | Open-text or selected option text; PHI |
| selectedOptionId | INT | FK → FlowStepOption | Nullable — for choice questions |
| responseNumeric | DECIMAL(6,2) | | For scale/rating questions |

---

## 2. Entity Relationship Summary

```
Organisation
├─── UserRole (1:many)
│    └─── RBACPermission (1:many, per module)
├─── User (1:many)
│    └─── UserRole (many:1)
├─── Therapist (1:many)
│    ├─── SessionTypePricing (1:many)
│    └─── User (0..1:1, optional login)
├─── Client (1:many)
│    ├─── SessionPackage (1:many)
│    └─── Conversation (1:many)
├─── Appointment (1:many)
│    ├─── Client (many:1)
│    ├─── Therapist (many:1)
│    ├─── SessionPackage (many:0..1)
│    ├─── Discount (many:0..1)
│    ├─── SessionInvoice (1:0..1)
│    ├─── Assessment (1:0..1)
│    └─── Submission (1:0..1)
├─── Conversation (1:many)
│    ├─── Message (1:many)
│    └─── ConversationAnalysis (1:0..1)
├─── FollowUpFlow (1:many)
│    ├─── FlowStep (1:many)
│    │    └─── FlowStepOption (1:many)
│    └─── Submission (1:many)
│         └─── SubmissionResponse (1:many)
├─── OrganisationPolicy (1:1 singleton)
└─── Discount (1:many)
```

---

## 3. Enumeration Master List

| Enum Name | Values |
|-----------|--------|
| Gender | Male, Female, Other |
| SessionType | Individual, Couple, Family, Group, Child |
| AppointmentStatus | Scheduled, Completed, Cancelled, No-show, Rescheduled |
| PaymentStatus | Pending, Paid, Refunded, Waived |
| PaymentMethod | Cash, UPI, Card, Bank Transfer, Package |
| BookingChannel | CRM (Manual), WhatsApp Bot, Online Portal |
| ConversationOrigin | WhatsApp |
| ConversationCategory | Therapy Potential, Emotional Distress, Information/Exploration, Transactional/Admin, SOS |
| UrgencyScore | 1, 2, 3, 4, 5 (integer) |
| FlowType | CheckIn, Feedback |
| FlowTrigger | After Session |
| QuestionType | Single Choice, Multi Choice, Open Text, Scale/Rating, Section Header |
| DeliveryChannel | WhatsApp |
| RoleName | Admin, Manager, Receptionist, Therapist |
| DiscountType | Percentage, Fixed Amount |
| PackageStatus | Active, Exhausted, Expired, Cancelled |
| RefundProcessing | Automatic, Manual |
| AssessmentStatus | Assigned, Completed, Expired |
| SubmissionStatus | Complete, Partial, Skipped |
| SenderType | Client, Bot, Agent |

---

## 4. Identified Data Gaps & Design Concerns

| ID | Entity | Severity | Description |
|----|--------|----------|-------------|
| DM-01 | Therapist ↔ User | HIGH | Therapist role has 0/29 module permissions — likely config error; therapists cannot access any CRM screen |
| DM-02 | Client | MED | No insurance/payer fields observed; not suitable for insurance-billed practices without extension |
| DM-03 | Appointment | MED | No ICD-10 / diagnosis code field observed; clinical documentation incomplete for psychiatry use |
| DM-04 | Appointment | MED | No prescription entity observed; psychiatry-prescribing workflow not modelled |
| DM-05 | SessionInvoice | MED | Ledger-only; no aggregate KPI entity (revenue by therapist, utilisation %, session volume) |
| DM-06 | FollowUpFlow | LOW | Feedback flow missing triggerOffsetHours — Check-in has it, Feedback does not; schema inconsistency |
| DM-07 | ConversationAnalysis | HIGH | SOS category (urgency 5) has no observed escalation automation — no alert or assignment entity |
| DM-08 | Assessment | MED | No assessment template versioning — schema changes could break historical response data |
| DM-09 | Therapist | MED | "My Therapists" list was empty despite 10 active therapists appearing in booking dropdowns — possible data-source split between Therapist and User tables |
| DM-10 | Client | LOW | No next-of-kin / guardian entity for child/adolescent clients (child therapy is a listed session type) |
| DM-11 | Conversation | MED | Conversation not formally linked to Client by FK in all cases — prospects may exist only as phone numbers |
| DM-12 | Appointment | LOW | Self-referencing rescheduledFromId allows chain tracking but no observed UI surfaces the rescheduling history |
| DM-13 | Organisation | MED | Single-currency (INR) — international pricing exists (therapist form has "Price International INR") but is stored in same currency, not multi-currency |
| DM-14 | FlowStep | LOW | No branching/conditional logic entity — all flows appear strictly linear |

---

## 5. PHI / Compliance Field Index

Fields containing Protected Health Information (PHI) or personally identifiable information (PII):

| Entity | Field(s) | Type |
|--------|----------|------|
| Client | firstName, lastName, email, phone, dateOfBirth, address, emergencyContactName, emergencyContactPhone | PHI/PII |
| User | email, phone | PII |
| Therapist | email, phone, dateOfBirth, address | PII |
| Conversation | contactPhone, contactName | PII |
| Message | body, senderName | PHI (clinical content) |
| ConversationAnalysis | aiSummary | PHI (clinical insight) |
| Assessment | responseData, interpretation | PHI (clinical) |
| SessionInvoice | clientEmail, clientPhone | PHI |
| Submission | (via SubmissionResponse) | PHI |
| SubmissionResponse | responseText | PHI |

**Compliance notes:**
- All PHI fields should be encrypted at rest (AES-256 or equivalent)
- WhatsApp as a delivery channel for clinical follow-ups raises HIPAA/DPDPA data-residency questions
- AI analysis (ConversationAnalysis) processes PHI — model vendor data processing agreements required
- No observed audit-log entity in scanned modules (audit-log exists as a module in RBAC but was not scanned)

---

## 6. Inferred Entities (Not Directly Observed)

These entities are strongly implied by the data model but were not confirmed via direct screen scan:

| Entity | Basis for Inference |
|--------|-------------------|
| AuditLog | RBAC module "audit-log" exists; not scanned |
| Prescription | RBAC module "prescriptions" exists; not scanned |
| Task | RBAC module "tasks" exists; not scanned |
| Note | RBAC module "notes" exists; not scanned |
| Document | RBAC module "documents" exists; not scanned |
| CalendarSlot / Availability | "My Schedule" scanned briefly; availability blocking not fully modelled |
| Notification / Alert | No notification entity observed; implied by WhatsApp delivery triggers |
| PaymentLink | "Send Payment Link" button observed in Manual Booking; entity not confirmed |
| BotFlowTemplate | WhatsApp bot uses named flows ("Appointment flow", "Main menu"); template entity not observed |

---

*End of Phase 5 Data Model*

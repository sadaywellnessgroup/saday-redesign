# Swasth-Mind CRM — Phase 1 Reconnaissance
**Scan date:** 2026-04-19
**CRM URL:** crm.swasthmind.com
**Tenant type:** PRODUCTION (PHI redaction active)
**Role scanned as:** Admin (Super Admin)
**Currency observed:** Rs (Indian Rupees) — India-based platform
**Version:** Not visible in UI
**CRM tab title:** Swasth-Mind CRM

---

## Sitemap

| # | Top nav / module | Submenu | Screen / page | Available to roles | Purpose (1 line) | Screenshot ref |
|---|---|---|---|---|---|---|
| 1 | Dashboard | — | Dashboard Overview | Admin, Branch Admin | KPI summary: session bookings, revenue, client count, assessments, conversations (with WhatsApp sub-breakdown); date-range filter + download icon | ss_8147kibiq |
| 2 | Conversations | — | Conversations list | Admin (configurable) | Messaging/chat inbox — likely WhatsApp integration hub | — |
| 3 | My Schedule | — | Schedule/calendar view | Admin (configurable) | Provider's personal appointment calendar | — |
| 4 | My Therapists | — | Therapist roster | Admin, Branch Admin | Manage and view therapist profiles linked to the org | — |
| 5 | Manual Booking | — | Manual booking form | Admin, Branch Admin, Receptionist | Create a session booking manually for a client | — |
| 6 | Sessions | Upcoming Sessions | Upcoming Sessions list | Admin, Branch Admin, Receptionist | View/manage future scheduled sessions | ss_81912o44d |
| 7 | Sessions | Completed Sessions | Completed Sessions list | Admin, Branch Admin | View past sessions | — |
| 8 | Sessions | Session Packages | Session Packages list | Admin | Define multi-session bundles for sale | — |
| 9 | Sessions | Session Discounts | Session Discounts list | Admin | Configure discount codes/rules for sessions | — |
| 10 | Sessions | Purchased Packages | Purchased Packages list | Admin | View client-purchased session packages | — |
| 11 | Assessments | Automated Reports | Automated Reports list | Admin (configurable) | View/manage auto-triggered assessment reports | ss_5625ic6nq |
| 12 | Assessments | Manual Assessments | Manual Assessments list | Admin (configurable) | Administer assessments manually to clients | — |
| 13 | My Clients | — | Client roster | Admin, Branch Admin, Receptionist | Full client/patient list; CRM contact management | — |
| 14 | Reports | — | Reports dashboard | Admin only (off for others by default) | Analytics and reporting across sessions, revenue, clients | — |
| 15 | Seminars | — | Seminars list | Admin, Receptionist | Manage group seminars/webinars offered by the practice | — |
| 16 | Internships/Career | Job Listings | Job Listings list | Admin (configurable) | Post and manage open positions | ss_2642t9kp8 |
| 17 | Internships/Career | Applications | Applications list | Admin (configurable) | Review incoming job/internship applications | — |
| 18 | Ecommerce | — | Ecommerce page | Admin, Receptionist | Sell digital products, courses, or packages | — |
| 19 | Cancellation & Reschedule Policy | — | Policy configuration | Admin | Define cancellation windows, fees, and reschedule rules | — |
| 20 | Session Follow-ups | Manage Flows | Flows builder | Admin (configurable) | Create automated follow-up messaging flows post-session | ss_2942acgrw |
| 21 | Session Follow-ups | Submissions | Submissions list | Admin (configurable) | View client responses to follow-up flows | — |
| 22 | FAQ & Tutorials | — | FAQ/Help page | Admin, Branch Admin, Receptionist | In-app help and tutorial content | — |
| 23 | Bulk Messages | Message Templates | Templates list | Admin (configurable) | Create/manage reusable message templates | ss_9059peoxx |
| 24 | Bulk Messages | Message Logs | Message Logs list | Admin (configurable) | Audit log of bulk messages sent | — |
| 25 | Bulk Messages | Bulk Message Plans | Plans list | Admin (configurable) | Configure scheduled/triggered bulk message campaigns | — |
| 26 | Profile (top-right) | Profile | Admin profile page | Admin | Edit org details, professional info, prescription settings, payment/banking details | ss_27583bvo5 |
| 27 | Profile (top-right) | Invoices | Invoices list | Admin | View billing invoices for CRM subscription | — |
| 28 | User Management (Dashboard button) | Receptionists | Receptionist user list | Admin | Add/manage receptionist-role staff | ss_5679u3fgi |
| 29 | User Management (Dashboard button) | Accountants | Accountant user list | Admin | Add/manage accountant-role staff | — |
| 30 | User Management (Dashboard button) | Co-Admins | Co-Admin user list | Admin | Add co-admin users with near-full access | — |
| 31 | User Management (Dashboard button) | Branch Admins | Branch Admin user list | Admin | Assign admin-level managers per branch | — |
| 32 | User Management (Dashboard button) | Address | Branches/address config | Admin | Manage physical branch locations | — |
| 33 | User Management (Dashboard button) | Access Control | RBAC configuration screen | Admin only | Configure module-level access per role via checkbox matrix | ss_0763ollq1 |

---

## User Roles Enumerated

| Role | Description |
|---|---|
| Admin (Super Admin) | Full access to all modules; manages subscription, billing, all users, RBAC; only role with access to Reports, Invoices, Accountants, Branch Admins screens |
| Co-Admin | Near-admin access; specific capabilities configurable via Access Control |
| Branch Admin | Manages a single branch; by default has Dashboard, My Therapists, Manual Booking, Upcoming/Completed Sessions, Receptionists, Organisation Policies, FAQ |
| Receptionist | Front-desk role; by default has Manual Booking, Upcoming Sessions, Seminars, Ecommerce, FAQ; cannot access Reports or financial data |
| Accountant | Finance-focused; by default has Upcoming Sessions, My Clients, Seminars, Ecommerce, FAQ; cannot access most clinical/admin screens |
| Therapist | Clinical provider; access configurable; scoped to own schedule, clients, sessions, assessments |

---

## RBAC Module List (from /rbac-config)

The following modules are registered in the Access Control configuration, grouped by category:

### GENERAL
- dashboard
- conversations
- my_schedule
- my_therapists
- manual_booking
- my_clients
- seminars
- ecommerce
- organisation_policies
- faq
- reports
- invoices

### USER MANAGEMENT
- receptionists
- accountants
- branch_admins
- branches

### SESSIONS
- upcoming_sessions
- completed_sessions
- session_packages
- session_discounts
- purchased_packages

### ASSESSMENTS
- automated_reports
- manual_assessments

### INTERNSHIPS / CAREER
- job_listings
- job_applications

### BULK MESSAGES
- message_templates
- message_logs
- bulk_message_plans

**Note:** Session Follow-ups (manage_flows, submissions) does NOT appear in the RBAC matrix — may be Admin-only or not yet role-gated.

---

## Dashboard KPI Widgets

| Widget | Metric shown | Sub-breakdown |
|---|---|---|
| Session Bookings | Count of bookings in date range | WhatsApp: count |
| Session Bookings Revenue | Revenue (Rs) in date range | WhatsApp: Rs amount |
| My Clients | Total client count | WhatsApp: count |
| Assessments Count | Total assessments in date range | WhatsApp: count |
| Conversations | Conversation count | WhatsApp: count |

Features: Date From / Date To filter, Download icon (export — not clicked).

---

## Admin Profile Page Fields (structure only — values REDACTED)

### Personal Details
- Name (string)
- Email (string)
- Contact Number (string)

### Professional Details
- Qualification detail (text/relation)
- Specializations (multi-select/relation)
- Years of Experience (int)
- Professional title (string)
- Certification Details (text)
- Languages Spoken (multi-select)
- License No (string)

### Practice Details
- Organisation Name (string)
- Session Types (multi-select — includes: Check-in Session, Child Therapy, +8 more types)
- Therapy Approaches (multi-select — includes: CBT, DBT, +4 more)
- Working Hours (per-day time range, Mon–Sat observed)

### Prescription Settings
- Letterhead (image upload)
- Signature (image upload)

### Payment Details
- Account Holder Name (string) — PHI/PII
- Branch Name (string)
- Bank Name (string)
- Address (text)
- Account Number (string) — SENSITIVE FINANCIAL
- IFSC Code (string) — SENSITIVE FINANCIAL
- Pan Number (string) — SENSITIVE FINANCIAL
- GST Number (string) — SENSITIVE FINANCIAL

---

## Integrations Observed (Phase 1)

| Category | Function | Vendor (if visible) | Direction | Protocol | BAA required? | Notes |
|---|---|---|---|---|---|---|
| Messaging | WhatsApp business messaging | WhatsApp / Meta | Both | API (assumed) | Unknown | Visible in all Dashboard KPIs; Conversations module likely WhatsApp inbox |
| Payments | Banking/payment receipt | HDFC Bank (admin's bank — not a CRM integration per se) | In | Unknown | No | Payment details stored in profile for client invoice generation |
| Prescription | Prescription letterhead + signature | — | Internal | — | Unknown | Prescription Settings in profile suggest e-prescription or PDF generation capability |

---

## Phase 1 Status Summary

- Modules at top-nav level: **16**
- Total distinct screens/pages identified: **33**
- User roles: **6**
- RBAC-registered modules: **29**
- Integrations noted: **3 (WhatsApp, Banking, Prescription/PDF)**
- Version number: **Not found in UI**
- PHI encountered: **Yes — profile page contains real org/financial data; all REDACTED in this file**
- Blocking questions at end of Phase 1: **None**

---

## Recommended Phase 2 Priority Order

1. My Clients — core patient record
2. Sessions (Upcoming + Completed) — appointment management
3. Manual Booking — booking flow
4. Assessments (Automated Reports + Manual) — clinical tools
5. Conversations — WhatsApp/messaging integration
6. Reports — analytics surface
7. Session Follow-ups (Manage Flows + Submissions) — automation engine
8. Bulk Messages (Templates + Logs + Plans) — outreach tools
9. My Therapists — provider management
10. Ecommerce / Seminars / Internships — lower clinical priority
11. Cancellation & Reschedule Policy — configuration
12. Profile / User Management / Access Control — admin/settings

---
*End of Phase 1 Reconnaissance*

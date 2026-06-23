# SwasthMind CRM — Phase 4: Permissions
**Compiled:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin (Super Admin)
**Source:** /rbac-config (Access Control Configuration) + Phase 2 module scan observations

---

## OVERVIEW

The CRM implements a **module-level RBAC (Role-Based Access Control)** system. Permissions are boolean per module per role — a role either has access to a module or it does not. There is no observed per-action granularity (view/create/edit/delete) at the RBAC config level; the checkbox appears to control full module access.

**Roles defined:** 5 total
| Role | Color Code | Scope |
|---|---|---|
| Admin (Super Admin) | — | Full access to all modules; not in RBAC matrix (always full) |
| Branch Admin | Blue | Branch-level administrative access |
| Receptionist | Green | Front-desk / booking operations |
| Accountant | Orange | Financial / reporting access |
| Therapist | Dark Green | Clinical practitioner access |

> **Note:** The Admin/Super Admin role is the logged-in session role used during this scan. It does not appear in the RBAC configuration matrix — Admin has implicit full access to everything and cannot be restricted via the RBAC screen.

---

## RBAC CONFIGURATION MATRIX

**Legend:** ✅ = Access granted (checkbox checked) | ☐ = No access (checkbox unchecked)
**Column order:** Branch Admin | Receptionist | Accountant | Therapist

### GENERAL

| Module | Key | Branch Admin | Receptionist | Accountant | Therapist | Notes |
|---|---|---|---|---|---|---|
| Dashboard | dashboard | ✅ | ☐ | ✅ | ☐ | KPI dashboard; Accountant has access (revenue data) |
| Conversations | conversations | ☐ | ☐ | ☐ | ☐ | All sub-roles locked out; Admin-only |
| My Schedule | my_schedule | ☐ | ☐ | ☐ | ☐ | All sub-roles locked out; Admin-only |
| My Therapists | my_therapists | ✅ | ☐ | ☐ | ☐ | Branch Admin can manage therapist profiles |
| Manual Booking | manual_booking | ✅ | ✅ | ☐ | ☐ | Branch Admin + Receptionist can book sessions |
| My Clients | my_clients | ✅ | ☐ | ☐ | ☐ | Branch Admin can manage client records |
| Seminars | seminars | ☐ | ☐ | ☐ | ☐ | All sub-roles locked out |
| Ecommerce | ecommerce | ☐ | ☐ | ☐ | ☐ | All sub-roles locked out |
| Organisation Policies | organisation_policies | ☐ | ☐ | ☐ | ☐ | All sub-roles locked out; Admin-only |
| FAQ & Tutorials | faq | ✅ | ✅ | ✅ | ☐ | All operational roles except Therapist |
| Reports | reports | ☐ | ☐ | ✅ | ☐ | Accountant-only for billing reports |
| Invoices | invoices | ☐ | ☐ | ✅ | ☐ | Accountant-only for invoices |

### USER MANAGEMENT

| Module | Key | Branch Admin | Receptionist | Accountant | Therapist | Notes |
|---|---|---|---|---|---|---|
| Receptionists | receptionists | ✅ | ☐ | ☐ | ☐ | Branch Admin can manage receptionist accounts |
| Accountants | accountants | ☐ | ☐ | ☐ | ☐ | All locked out (even Branch Admin) |
| Branch Admins | branch_admins | ☐ | ☐ | ☐ | ☐ | All locked out; Super Admin only |
| Branches | branches | ☐ | ☐ | ☐ | ☐ | All locked out; Super Admin only |

### SESSIONS

| Module | Key | Branch Admin | Receptionist | Accountant | Therapist | Notes |
|---|---|---|---|---|---|---|
| Upcoming Sessions | upcoming_sessions | ✅ | ✅ | ☐ | ☐ | Branch Admin + Receptionist see upcoming bookings |
| Completed Sessions | completed_sessions | ✅ | ☐ | ☐ | ☐ | Branch Admin only for completed session history |
| Session Packages | session_packages | ☐ | ☐ | ☐ | ☐ | All locked out |
| Session Discounts | session_discounts | ☐ | ☐ | ☐ | ☐ | All locked out |
| Purchased Packages | purchased_packages | ☐ | ☐ | ☐ | ☐ | All locked out |

### ASSESSMENTS

| Module | Key | Branch Admin | Receptionist | Accountant | Therapist | Notes |
|---|---|---|---|---|---|---|
| Automated Reports | automated_reports | ☐ | ☐ | ☐ | ☐ | All locked out |
| Manual Assessments | manual_assessments | ☐ | ☐ | ☐ | ☐ | All locked out |

### INTERNSHIPS / CAREER

| Module | Key | Branch Admin | Receptionist | Accountant | Therapist | Notes |
|---|---|---|---|---|---|---|
| Job Listings | job_listings | ☐ | ☐ | ☐ | ☐ | All locked out |
| Job Applications | job_applications | ☐ | ☐ | ☐ | ☐ | All locked out |

### BULK MESSAGES

| Module | Key | Branch Admin | Receptionist | Accountant | Therapist | Notes |
|---|---|---|---|---|---|---|
| Message Templates | message_templates | ☐ | ☐ | ☐ | ☐ | All locked out |
| Message Logs | message_logs | ☐ | ☐ | ☐ | ☐ | All locked out |
| Bulk Message Plans | bulk_message_plans | ☐ | ☐ | ☐ | ☐ | All locked out |

---

## ROLE PROFILES (Synthesized)

### Admin / Super Admin
- **Full access** to all 29 modules across all sections
- Only role that can access: Conversations, My Schedule, Organisation Policies, Seminars, Ecommerce, Session Packages, Session Discounts, Purchased Packages, Assessments, Internships/Career, Bulk Messages, Branch Admins, Branches
- Can configure RBAC for all other roles
- Cannot be restricted via RBAC config

### Branch Admin (Blue)
- **Operational management** role — broadest sub-admin access
- Can access: Dashboard, My Therapists, Manual Booking, My Clients, FAQ & Tutorials, Receptionists (User Mgmt), Upcoming Sessions, Completed Sessions
- Cannot access: Conversations, My Schedule, Org Policies, Reports, Invoices, Accountants, Branch Admins, Branches, Sessions (Packages/Discounts/Purchased), Assessments, Internships, Bulk Messages

### Receptionist (Green)
- **Front-desk booking** role — narrowest operational access
- Can access: Manual Booking, FAQ & Tutorials, Upcoming Sessions
- Cannot access: Dashboard, Client records, Therapist management, Reports, Invoices, or any admin/financial module

### Accountant (Orange)
- **Financial read-only** role
- Can access: Dashboard, FAQ & Tutorials, Reports, Invoices
- Cannot access: Any booking, client, therapist, session, or messaging module

### Therapist (Dark Green)
- **Currently no module access granted via RBAC**
- All 29 modules are unchecked for Therapist role
- Therapist login exists (role defined) but no CRM module access is enabled in current configuration

---

## PERMISSION MATRIX SUMMARY (Compact)

| Module | Admin | Branch Admin | Receptionist | Accountant | Therapist |
|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ☐ | ✅ | ☐ |
| Conversations | ✅ | ☐ | ☐ | ☐ | ☐ |
| My Schedule | ✅ | ☐ | ☐ | ☐ | ☐ |
| My Therapists | ✅ | ✅ | ☐ | ☐ | ☐ |
| Manual Booking | ✅ | ✅ | ✅ | ☐ | ☐ |
| My Clients | ✅ | ✅ | ☐ | ☐ | ☐ |
| Seminars | ✅ | ☐ | ☐ | ☐ | ☐ |
| Ecommerce | ✅ | ☐ | ☐ | ☐ | ☐ |
| Organisation Policies | ✅ | ☐ | ☐ | ☐ | ☐ |
| FAQ & Tutorials | ✅ | ✅ | ✅ | ✅ | ☐ |
| Reports | ✅ | ☐ | ☐ | ✅ | ☐ |
| Invoices | ✅ | ☐ | ☐ | ✅ | ☐ |
| Receptionists (User Mgmt) | ✅ | ✅ | ☐ | ☐ | ☐ |
| Accountants (User Mgmt) | ✅ | ☐ | ☐ | ☐ | ☐ |
| Branch Admins (User Mgmt) | ✅ | ☐ | ☐ | ☐ | ☐ |
| Branches (User Mgmt) | ✅ | ☐ | ☐ | ☐ | ☐ |
| Upcoming Sessions | ✅ | ✅ | ✅ | ☐ | ☐ |
| Completed Sessions | ✅ | ✅ | ☐ | ☐ | ☐ |
| Session Packages | ✅ | ☐ | ☐ | ☐ | ☐ |
| Session Discounts | ✅ | ☐ | ☐ | ☐ | ☐ |
| Purchased Packages | ✅ | ☐ | ☐ | ☐ | ☐ |
| Automated Reports | ✅ | ☐ | ☐ | ☐ | ☐ |
| Manual Assessments | ✅ | ☐ | ☐ | ☐ | ☐ |
| Job Listings | ✅ | ☐ | ☐ | ☐ | ☐ |
| Job Applications | ✅ | ☐ | ☐ | ☐ | ☐ |
| Message Templates | ✅ | ☐ | ☐ | ☐ | ☐ |
| Message Logs | ✅ | ☐ | ☐ | ☐ | ☐ |
| Bulk Message Plans | ✅ | ☐ | ☐ | ☐ | ☐ |
| **Checkin/Feedback Flows** | ✅ | ☐ | ☐ | ☐ | ☐ |
| **Checkin Submissions** | ✅ | ☐ | ☐ | ☐ | ☐ |

> Note: Session Follow-ups (Manage Flows + Submissions) and Cancellation & Reschedule Policy are not listed in the RBAC matrix UI — they appear to be Admin-only by default. Listed above for completeness based on Phase 2 observations.

---

## FIELD-LEVEL PERMISSION OBSERVATIONS

> The RBAC UI only controls module-level access (on/off per module). No field-level permission granularity was observed. The following field-level restrictions were noted from Phase 2 direct observation:

| Module | Field / Element | Restriction Observed |
|---|---|---|
| My Therapists — Onboarding Form | Some fields post-creation | Non-editable after creation; must contact Swasth Mind support to change |
| Cancellation & Reschedule Policy | All settings | Admin-only; no sub-role access |
| Manual Booking | "+ Create Booking & Send Payment Link" | Action-level restriction implied — Receptionist has module access but payment link sending implications unclear |
| RBAC Config screen | Role toggles | Admin can enable/disable access per module per role; changes take effect on save |

---

## PERMISSIONS GAPS & ANOMALIES

| # | Finding | Severity | Implication |
|---|---|---|---|
| P-01 | **Therapist role has ZERO module access** — all 29 modules unchecked | Critical | Therapist login accounts exist but cannot access any CRM screen. Therapist role appears unused / placeholder in current config. |
| P-02 | **Conversations locked to Admin only** — no sub-role can see WhatsApp inbox | High | Receptionists and Branch Admins cannot view client conversation history or AI triage; Admin bottleneck |
| P-03 | **My Schedule locked to Admin only** — no sub-role can configure therapist slots | High | Only Admin can add/modify booking slots; Branch Admin cannot perform this operational task |
| P-04 | **Receptionist cannot view Completed Sessions or Client records** | Medium | Receptionist can book sessions but cannot verify client history or review past sessions |
| P-05 | **Accountant has Dashboard + Reports + Invoices but no Clients or Sessions** | Medium | Accountant sees revenue figures but cannot cross-reference against client names or session details without Admin help |
| P-06 | **Branch Admin cannot manage Accountants, Branch Admins, or Branches** | Medium | Branch-level user management is very limited; only Receptionists can be managed by Branch Admin |
| P-07 | **Session Packages, Discounts, Purchased Packages locked to Admin only** | Low | Branch Admin and Receptionist cannot see or apply session packages/discounts at booking time |
| P-08 | **RBAC is module-level only** — no action-level control (view vs create vs edit vs delete) | Medium | A role either has full module access or none; cannot grant read-only access to a module without also granting write access |
| P-09 | **Session Follow-ups and Org Policies absent from RBAC matrix** | Low | These modules do not appear in the RBAC config table — their access is either hardcoded Admin-only or controlled separately |
| P-10 | **Checkin/Feedback Flows require Admin to configure per-therapist** | Medium | No delegation to therapists or Branch Admins for follow-up flow setup |

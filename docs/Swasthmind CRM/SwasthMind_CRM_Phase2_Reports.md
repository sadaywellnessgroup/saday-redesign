# SwasthMind CRM — Phase 2 Module Scan: Reports
**Scanned:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin | **URL:** /my-report

---

## SITEMAP

| Module | Sub-module | URL | Notes |
|---|---|---|---|
| Reports | Session Billing Report (list) | /my-report | Paginated billing ledger; 24 records (3 pages) |
| Reports | Session Details (record) | /my-report/{id}/show | Per-session detail: email, phone, price, booking time, session date, start/end time, duration |

---

## SCREENS

| Screen ID | Name | URL | Description | Screenshot Ref |
|---|---|---|---|---|
| REP-01 | Session Billing Report — List | /my-report | Paginated table of completed session billing records; filters for Therapist and Date range; export button; Invoice download per row; row detail link; 24 records total | ss_1574a1ol2 |
| REP-02 | Session Details — Record | /my-report/{id}/show | Read-only card; Email, Phone, Price (₹), Booking Time, Session Date, Start Time, End Time, Duration (minutes) | ss_1557hxywc |

---

## FEATURES

| Feature ID | Name | Screen | Description | Trigger | Destructive? |
|---|---|---|---|---|---|
| REP-F01 | Session billing list | REP-01 | Paginated table of all completed session billing records; default sort: most recent first (Sr No descending) | Nav click | No |
| REP-F02 | Filter by Therapist | REP-01 | Dropdown; filter report by therapist; 10 therapists + Saday Wellness Group + All | Dropdown select | No |
| REP-F03 | Filter by Date From | REP-01 | Date picker (dd/mm/yyyy) to set start of date range | Date input | No |
| REP-F04 | Filter by Date To | REP-01 | Date picker (dd/mm/yyyy) to set end of date range | Date input | No |
| REP-F05 | Export full report | REP-01 | ⬇ download icon at top right; likely exports filtered list as CSV/Excel | Click download icon | No (download) |
| REP-F06 | Download individual invoice | REP-01 | Per-row button showing invoice number (e.g., SS-4); downloads individual session invoice PDF | Click invoice button | No (download) |
| REP-F07 | View session detail | REP-01 → REP-02 | 👁 eye icon per row navigates to Session Details screen | Click eye icon | No |
| REP-F08 | Pagination | REP-01 | Rows per page (default 8); page nav; 24 total records / 3 pages | Pagination controls | No |
| REP-F09 | Sort by Sr No | REP-01 | Column header sort (ascending/descending) | Click sort button | No |
| REP-F10 | Session detail read-only | REP-02 | Displays all 8 session billing fields; no edit capability | Read-only | No |

---

## DATA-FIELDS

| Field ID | Name | Screen | Type | Required | Notes |
|---|---|---|---|---|---|
| REP-D01 | Sr No | REP-01 list | Integer (auto) | Auto | Sequential serial number; sortable |
| REP-D02 | Client Name | REP-01 list | Display text | — | [REDACTED in prod] |
| REP-D03 | Mode | REP-01 list | Enum display | — | Observed values: "Online"; likely also "Offline" |
| REP-D04 | Type | REP-01 list | Enum display | — | Observed values: "Psychiatric Consultation", "SwasthStart"; session type name from booking |
| REP-D05 | Date | REP-01 list | Date display | — | DD-MM-YYYY format; session date |
| REP-D06 | Price (Rs) | REP-01 list | Currency (integer) | — | Observed values: 500, 299; depends on session type/package |
| REP-D07 | Invoice | REP-01 list | Invoice ID (SS-{n}) | — | Download button; format SS-{sequential number}; e.g., SS-1 through SS-46 (highest observed) |
| REP-D08 | Email | REP-02 detail | Text | — | [REDACTED in prod] |
| REP-D09 | Phone | REP-02 detail | Text | — | [REDACTED in prod] |
| REP-D10 | Price | REP-02 detail | Currency with ₹ symbol | — | e.g., ₹500 |
| REP-D11 | Booking Time | REP-02 detail | Datetime | — | DD/MM/YYYY HH:MM AM/PM; when booking was made |
| REP-D12 | Session Date | REP-02 detail | Date | — | DD/MM/YYYY; actual session date |
| REP-D13 | Start Time | REP-02 detail | Time | — | HH:MM AM/PM |
| REP-D14 | End Time | REP-02 detail | Time | — | HH:MM AM/PM |
| REP-D15 | Duration | REP-02 detail | Text | — | Observed: "20 minutes"; derived from Start/End time |

---

## FLOWS

| Flow ID | Name | Steps | Notes |
|---|---|---|---|
| REP-FL01 | View session billing record | 1. List → click 👁 eye icon → Session Details screen. 2. Read session details. 3. Click ← back → return to list. | Read-only; no edit capability |
| REP-FL02 | Download individual invoice | 1. List → click SS-{n} invoice button → PDF downloads. | NOT CLICKED during scan — download action preserved per safety rules |
| REP-FL03 | Export full report | 1. Optionally set Therapist / Date filters. 2. Click ⬇ export button → file downloads. | NOT CLICKED during scan |
| REP-FL04 | Filter report | 1. Select Therapist and/or Date From + Date To. 2. Table updates. | Stateless filter; no save |

---

## PERMISSIONS

| Role | Can View List | Can View Detail | Can Download Invoice | Can Export | Notes |
|---|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes | Full access observed |
| Other roles | Unknown | Unknown | Unknown | Unknown | RBAC from Phase 1 lists Reports in module matrix |

---

## INTEGRATIONS

| Integration | Direction | Detail |
|---|---|---|
| Invoice PDF generator | Internal | Server-side PDF generation for individual invoices; triggered by SS-{n} download button |
| Export engine | Internal | Full report export (CSV/Excel likely); triggered by ⬇ icon |

---

## COMPLIANCE

| Item | Detail |
|---|---|
| PHI present | Yes — client names, emails, phone numbers visible in list and detail views; all redacted in this report |
| Financial data | Prices and invoice IDs present; currency ₹ (INR) |
| Invoice numbering | Sequential: SS-1 to SS-46 observed on first page scan; highest = SS-46 suggesting 46+ total sessions billed |
| Audit trail | Sr No provides sequential ordering; session-level records maintained permanently |

---

## DATA-MODEL

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| SessionReport | id, sr_no, client_name, email, phone, mode (enum), type (session type name), date, booking_time, start_time, end_time, duration, price, invoice_id | Belongs to Appointment/Session; Belongs to Therapist | Appears to be a billing record linked to a completed session |
| Invoice | id (SS-{n}), pdf_file | Belongs to SessionReport | Server-generated PDF; downloadable |

---

## KEY FINDINGS & ANOMALIES

| # | Finding | Implication |
|---|---|---|
| 1 | 24 total billing records in system; invoice numbers go up to SS-46 | Gap between 24 records visible and SS-46 invoice number suggests older records may be paginated/archived or some invoices were deleted |
| 2 | Session types observed: "Psychiatric Consultation" (₹500) and "SwasthStart" (₹299) | Multiple pricing tiers exist; SwasthStart appears to be a lower-cost introductory package |
| 3 | All sessions observed are "Online" mode | No offline sessions visible in first page; may exist in later pages |
| 4 | Session duration: 20 minutes for Psychiatric Consultation | Short session duration typical of psychiatry intake/follow-up |
| 5 | Therapist dropdown includes "Saday Wellness Group" as an option | Org-level therapist account for group sessions or unassigned bookings |
| 6 | No Total/Sum row visible in UI | No running total of revenue; admins must manually sum or export |
| 7 | Report is READ-ONLY — no create/edit/delete controls | Billing records appear auto-created from completed session bookings |
| 8 | Reports module = session billing ledger | NOT a general analytics/KPI dashboard (that is the Dashboard module); this is specifically an invoice/billing record view |

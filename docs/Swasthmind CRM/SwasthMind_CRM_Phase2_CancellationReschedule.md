# SwasthMind CRM — Phase 2 Module Scan: Cancellation & Reschedule Policy
**Scanned:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin | **URL:** /organisation-policies

---

## SITEMAP

| Module | Sub-module | URL | Notes |
|---|---|---|---|
| Cancellation & Reschedule Policy | Organisation Policy Config | /organisation-policies | Single-page settings screen; no sub-pages |

> **Note:** Nav sidebar label is "Cancellation & Reschedule Policy"; actual URL is /organisation-policies. Guessed URL /cancellation-policy returned 404.

---

## SCREENS

| Screen ID | Name | URL | Description | Screenshot Ref |
|---|---|---|---|---|
| CRP-01 | Cancellation & Reschedule Policy | /organisation-policies | Single configuration screen for org-wide reschedule and cancellation rules; two policy sections + summary; Reset + Save Changes | ss_1848o3p96 / ss_5847rdftt |

---

## FEATURES

| Feature ID | Name | Screen | Description | Trigger | Destructive? |
|---|---|---|---|---|---|
| CRP-F01 | Allow Session Rescheduling toggle | CRP-01 | Master on/off switch for client-initiated rescheduling; currently ON | Toggle switch | No (setting change) |
| CRP-F02 | Reschedule minimum notice window | CRP-01 | Number field (hours); sets how many hours before session start rescheduling is allowed; currently 3 hours | Edit number field | No |
| CRP-F03 | Max Reschedule Count | CRP-01 | Number field; limits how many times a single booking can be rescheduled; currently 1 | Edit number field | No |
| CRP-F04 | Allow Session Cancellation toggle | CRP-01 | Master on/off switch for client-initiated cancellations; currently ON | Toggle switch | No (setting change) |
| CRP-F05 | Cancellation minimum notice window | CRP-01 | Number field (hours); sets how many hours before session start cancellation is allowed; currently 8 hours | Edit number field | No |
| CRP-F06 | Refund Percentage | CRP-01 | Number field (% of session fee); percentage refunded when client cancels; currently 100% | Edit number field | No |
| CRP-F07 | Reset | CRP-01 | Reverts all fields to last saved values (not to system defaults) | Click Reset button | No |
| CRP-F08 | Save Changes | CRP-01 | Saves current field values as new org policy; updates Current Policy Summary | Click Save Changes (floppy disk icon) | Yes (persists setting) |
| CRP-F09 | Current Policy Summary | CRP-01 | Read-only live summary at bottom of page reflecting active saved policy values; auto-updates on save | Auto-rendered | No |
| CRP-F10 | Refund Responsibility Warning | CRP-01 | Orange alert banner: organisation is responsible for processing session fee refunds; clients informed at booking | Read-only | No |
| CRP-F11 | ⓘ Tooltip buttons | CRP-01 | Per-field info buttons providing full-text tooltip explanations of each setting | Hover/click | No |

---

## DATA-FIELDS

| Field ID | Name | Type | Current Value | Required | Tooltip / Helper Text |
|---|---|---|---|---|---|
| CRP-D01 | Allow Session Rescheduling | Toggle (boolean) | ON (enabled) | Yes | "Clients can reschedule their booked sessions" |
| CRP-D02 | Minimum Notice Required (Reschedule) | Number (hours) | 3 | Yes (when rescheduling enabled) | "Hours before session when reschedule is allowed"; tooltip: "Clients must reschedule at least this many hours before their session starts" |
| CRP-D03 | Max Reschedule Count | Number (integer) | 1 | Yes (when rescheduling enabled) | "How many times a session can be rescheduled"; tooltip: "Maximum number of times a client can reschedule a single booking" |
| CRP-D04 | Allow Session Cancellation | Toggle (boolean) | ON (enabled) | Yes | "Clients can cancel their booked sessions" |
| CRP-D05 | Minimum Notice Required (Cancellation) | Number (hours) | 8 | Yes (when cancellation enabled) | "Hours before session when cancellation is allowed"; tooltip: "Clients must cancel at least this many hours before their session starts" |
| CRP-D06 | Refund Percentage | Number (%) | 100 | Yes (when cancellation enabled) | "% of session fee refunded on cancellation"; tooltip: "Percentage of the session fee that will be refunded when a client cancels" |

---

## CURRENT ACTIVE POLICY (as observed in Current Policy Summary)

| Policy | Status | Notice Window | Additional Constraint |
|---|---|---|---|
| Session Rescheduling | Allowed | 3 hours minimum notice before session | Max 1 reschedule per booking |
| Session Cancellation | Allowed | 8 hours minimum notice before session | 100% refund on cancellation |

---

## FLOWS

| Flow ID | Name | Steps | Notes |
|---|---|---|---|
| CRP-FL01 | Update policy settings | 1. Navigate to /organisation-policies. 2. Toggle Allow Rescheduling and/or Allow Cancellation on/off. 3. Adjust notice windows (hours) and max reschedule count. 4. Set refund percentage (0–100). 5. Click "Save Changes". 6. Current Policy Summary updates to reflect new values. | Changes apply org-wide to all therapist bookings |
| CRP-FL02 | Reset policy | 1. Make changes to any fields. 2. Click "Reset". 3. Fields revert to last saved state. | Does not reset to system defaults — only to last saved org values |
| CRP-FL03 | Disable rescheduling | 1. Toggle "Allow Session Rescheduling" to OFF. 2. Save Changes. 3. Notice and max count fields become irrelevant (UI may hide/grey out). | Policy applies to all new bookings org-wide |
| CRP-FL04 | Disable cancellation | 1. Toggle "Allow Session Cancellation" to OFF. 2. Save Changes. 3. Clients cannot cancel sessions self-service; no refund triggered. | Org-wide; existing bookings may be grandfathered |

---

## PERMISSIONS

| Role | Can View | Can Edit | Notes |
|---|---|---|---|
| Admin | Yes | Yes | Full edit access; Save Changes and Reset buttons visible |
| Other roles | Unknown | Unknown | RBAC matrix from Phase 1 includes this module; per-role access not verified |

---

## INTEGRATIONS

| Integration | Direction | Detail |
|---|---|---|
| Client booking flow | Outbound | Policy values shown to clients at time of booking (per Refund Responsibility warning) |
| WhatsApp bot / Web bot | Outbound | Cancellation/reschedule policy communicated to clients; timing enforced by bot flows |
| Refund processing | Manual / Org-side | No automated refund gateway visible; organisation manually processes refunds per policy |

---

## COMPLIANCE

| Item | Detail |
|---|---|
| Refund responsibility | Explicitly noted in UI: organisation bears responsibility for refund processing; no payment gateway refund automation observed |
| Client disclosure | Policy displayed to clients at booking time |
| Policy scope | Org-wide; applies to ALL therapist sessions in the organisation; no per-therapist or per-session-type overrides observed |
| Audit trail | No visible audit log for policy changes; unknown if changes are logged server-side |

---

## DATA-MODEL

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| OrganisationPolicy | allow_rescheduling (bool), reschedule_min_notice_hours (int), max_reschedule_count (int), allow_cancellation (bool), cancellation_min_notice_hours (int), refund_percentage (int 0–100) | Belongs to Organisation (1:1) | Single record per organisation; edited in-place; no version history visible |

---

## KEY FINDINGS & ANOMALIES

| # | Finding | Implication |
|---|---|---|
| 1 | Single page, no sub-modules — pure settings/configuration screen | Design decision: policy is org-wide with no therapist-level or session-type-level overrides |
| 2 | Current policy: 3 hours reschedule notice, max 1 reschedule, 8 hours cancellation notice, 100% refund | Relatively client-friendly policy (full refund with 8hr notice) |
| 3 | Asymmetric notice windows: 3 hours reschedule vs 8 hours cancellation | Stricter cancellation window than reschedule — likely to protect revenue; rescheduling is preferred over cancelling |
| 4 | Max Reschedule Count = 1 | Clients can only reschedule once per booking; prevents abuse of rescheduling |
| 5 | Refund Responsibility warning explicitly states org manually processes refunds | No payment gateway refund automation; manual process required; operational risk |
| 6 | No per-therapist policy overrides | All therapists share the same cancellation/reschedule rules; no specialization possible |
| 7 | Nav label is "Cancellation & Reschedule Policy" but URL is /organisation-policies | URL mismatch suggests this screen may encompass more org-level policies in the future |
| 8 | URL /cancellation-policy returns 404 | Guessed URL failed; correct URL is /organisation-policies |

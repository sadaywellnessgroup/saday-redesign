# SwasthMind CRM — Phase 6: Integrations
**Generated:** 2026-04-19
**Source:** Live scan of /profile, /edit/profile, /branches, /receptionists, /accountants, /co-admins, /branch-admins, /invoices, /dashboard, /my-schedule, /rbac-config + synthesis from Phase 1–5 findings
**Tenant:** Production | **Role scanned as:** Admin

---

## 0. Scope & Methodology

This phase documents all external service integrations, embedded third-party dependencies, and internal API touchpoints visible within the CRM. The dedicated /integrations and /settings URLs both return 404 — integration configuration is distributed across Profile, User Management, and individual module settings rather than a single integration hub. Evidence is drawn from UI labels, field names, button text, API calls inferred from feature behaviour, and the subscription add-on list.

---

## 1. Integration Catalogue

### INT-01 — WhatsApp Business API (Meta)

| Attribute | Value |
|-----------|-------|
| Provider | Meta / WhatsApp Business Platform |
| Status | **Active** (confirmed: 67 conversations, 14 on dashboard) |
| Pricing model | Paid add-on — "Chatbot Configuration" feature (₹1,178.82, Payment Status: Success) |
| Entry point | Conversations module (/my-conversations) |
| Bot capabilities | Appointment booking flow, Main menu, Company information flow, Triage/categorisation, SOS detection |
| Delivery channels | WhatsApp (outbound): Session follow-up check-ins, Feedback flows, Bulk messages |
| AI layer | Conversation analysis (Category, Urgency 1–5, Key Themes) — likely an LLM overlay on top of WhatsApp messages |
| Meta Page ID | Stored in Organisation record (field: metaPageId) |
| WhatsApp number | Stored in Organisation record (field: whatsappNumber) |
| CRM-side actions | "Publish Check-in" / "Publish Feedback" buttons in FollowUpFlow → deploys flow to Meta WhatsApp; "Send check-in/feedback now" → triggers immediate WhatsApp send |
| Dashboard tracking | All 5 KPI cards show "WhatsApp: N" sub-metric, confirming WhatsApp as the primary inbound/outbound channel |
| Gaps | No observed webhook config screen; no observed failover channel; SOS flag has no automated escalation integration |

---

### INT-02 — Payment Gateway (Domestic — Razorpay / similar UPI-native)

| Attribute | Value |
|-----------|-------|
| Provider | Not named in UI — inferred from "Send Payment Link" button in Manual Booking, UPI as payment method, INR-only transactions |
| Status | **Active** (session payments occur; "Make Payment" buttons in subscription features) |
| Integration points | Manual Booking: "+ Create Booking & Send Payment Link" (generates and sends payment link to client) |
| Payment methods supported | Cash, UPI, Card, Bank Transfer, Package (observed in Sessions module) |
| Pricing data | Session prices in INR (domestic) and INR-labelled international prices — no multi-currency |
| Organisation banking details | Stored in Profile → Payment Information: Account Holder Name, Branch Name, Bank Name, Bank Address, Account Number, IFSC Code, PAN Number, GSTIN Number |
| Refund handling | Manual processing (per OrganisationPolicy: refundProcessing = Manual) |
| Subscription billing | Platform itself billed at ₹3,200/month; subscription invoices available as PDF download at /invoices |
| Gaps | No payment gateway name surfaced in UI; no webhook or API key configuration screen visible; no payment reconciliation dashboard |

---

### INT-03 — Google Maps

| Attribute | Value |
|-----------|-------|
| Provider | Google Maps Platform |
| Status | **Configured** (field present in Branch creation form) |
| Integration point | /branches (Address Master) → Add Branch form → "Google Maps Location URL" field |
| Field hint | "Paste the Google Maps share link for this branch location" |
| Use case | Stores a shareable Google Maps link per branch; likely rendered in client-facing booking page as "Get Directions" |
| Configuration | Simple URL storage — no Maps JavaScript API embed or geocoding API observed in CRM admin UI |
| Gaps | No in-app map preview; branch not yet configured (0 branches in production) |

---

### INT-04 — Email (Transactional)

| Attribute | Value |
|-----------|-------|
| Provider | Unknown — no email provider (SendGrid, SES, Mailgun, etc.) surfaced in admin UI |
| Status | **Active** (confirmed by user provisioning flow) |
| Trigger | "Add Receptionist" / "Add Accountant" / "Add Co-Admin" / "Add Branch Admin" forms: "A temporary password will be generated and emailed to the receptionist. They must change it on first login." |
| Use cases | Staff account creation (temporary password), likely also: appointment confirmation emails, assessment links, invoice PDFs |
| Configuration | No email template editor or SMTP config screen observed |
| Gaps | No email template management UI; no email delivery log visible; provider entirely opaque |

---

### INT-05 — Video Conferencing (Online Sessions)

| Attribute | Value |
|-----------|-------|
| Provider | Not specified — no Zoom/Google Meet/Teams branding observed |
| Status | **Supported** (My Schedule → Add Slots → Mode of Consultation: Offline / Online) |
| Integration point | Session slot configuration: Mode of Consultation dropdown with values "Offline" and "Online" |
| Meeting link storage | Appointment entity has a meetingLink field (inferred from Sessions module — "Join" button observed) |
| Configuration | No video platform picker or OAuth connection screen observed — meeting links appear to be manually entered or auto-generated by a backend service |
| Gaps | No native Zoom/Google Meet OAuth integration visible in admin UI; unclear whether links are auto-generated or manually pasted; no join-link automation visible |

---

### INT-06 — Prescription / Letterhead (Document Generation)

| Attribute | Value |
|-----------|-------|
| Provider | Internal PDF generation (no third-party e-signature or prescription platform named) |
| Status | **Configured** (Profile shows Letterhead image and Signature image both uploaded) |
| Integration point | Profile → Prescription Settings: Letterhead (image upload, max 10 MB), Signature (image upload, max 10 MB) |
| Use case | Overlaying org letterhead and clinician signature onto prescription PDFs generated by the RBAC "prescriptions" module (not yet scanned) |
| Configuration | Upload via profile; view via "View Letterhead" / "View Signature" buttons |
| RBAC module | "prescriptions" module exists in /rbac-config — Admin has access, others vary |
| Gaps | No e-prescribing integration (e.g., DRx, MocDoc); no digital signature verification; prescriptions module not scanned |

---

### INT-07 — Social Media / Public Profile Links

| Attribute | Value |
|-----------|-------|
| Provider | External platforms: LinkedIn, Instagram, YouTube, Facebook, X (Twitter), Custom URL |
| Status | **Configurable** (fields in /edit/profile → Social Media Links section) |
| Integration point | Edit Profile → Social Media Links (6 URL fields with example hints) |
| Use case | Displayed on the organisation's public landing/booking page for client discovery |
| Field list | LinkedIn URL, Instagram URL, YouTube URL, Facebook URL, X (Twitter) URL, Custom URL |
| Notes | These are outbound link stores only — no OAuth or social login integration observed |
| Gaps | No social media posting integration; no analytics from social referral |

---

### INT-08 — CRM Subscription Billing (Platform-to-Org)

| Attribute | Value |
|-----------|-------|
| Provider | SwasthMind platform (self-billed) |
| Status | **Active** (₹3,200/month subscription; 3 monthly invoices visible: Jan–Mar 2026) |
| Integration point | /invoices (Invoice Management) |
| Features | Monthly PDF invoices downloadable; filter by Organisation + Month |
| Add-ons | "Custom Feature" (₹1,178.82) + "Chatbot Configuration" (₹1,178.82) — both payment status: Success |
| Subscription management | My Subscription modal → Current Subscription Details: Title, Description, Start Date (11-04-2026), Renewal Date (11-04-2027), Amount (Rs 0 — possibly covered by add-ons) |
| Upgrade/Renew | "Upgrade Plan" and "Renew Plan" buttons in My Subscription modal |
| Gaps | No self-service plan comparison screen; no usage-based billing visibility; Amount shown as Rs 0 may indicate a misconfigured field |

---

### INT-09 — AI Conversation Analysis

| Attribute | Value |
|-----------|-------|
| Provider | Unknown LLM / NLP service — not named in UI |
| Status | **Active** (ConversationAnalysis records exist: Category, Urgency 1–5, AI Summary, Key Themes) |
| Integration point | My Conversations → ⓘ icon → Conversation Analysis modal |
| Outputs | Category (5-class ENUM), Urgency Score (1–5 integer), AI Summary (text), Key Themes (multi-chip array) |
| Trigger | Likely triggered asynchronously after each WhatsApp conversation update |
| Data sensitivity | AI model processes raw PHI (conversation content, client messages) — requires DPA with AI vendor |
| Gaps | Model vendor not disclosed in UI; no observed model version logging; no human-in-the-loop review for SOS (urgency 5) |

---

## 2. User Management & Identity

### Staff Role Provisioning

The CRM manages internal staff through a dedicated User Management section (accessible via Avatar → User Management) with five distinct user types:

| User Type | URL | Fields | Provisioning |
|-----------|-----|--------|-------------|
| Receptionists | /receptionists | Name*, Email*, Phone*, Branches* | Temp password emailed |
| Accountants | /accountants | Name*, Email*, Phone*, Branch | Temp password emailed (inferred) |
| Co-Admins | /co-admins | Name*, Email*, Phone*, Status | Temp password emailed (inferred) |
| Branch Admins | /branch-admins | Name*, Email*, Phone*, Branch | Temp password emailed (inferred) |
| Admin | /profile | Full org profile | Owner account |

⚠ **Gap UM-01:** The RBAC matrix at /rbac-config only shows 4 roles (Admin, Manager, Receptionist, Therapist). "Accountants", "Co-Admins", and "Branch Admins" appear in User Management but are NOT present in the RBAC matrix — either they map to hidden roles or the RBAC matrix is incomplete.

⚠ **Gap UM-02:** No SSO / OAuth / SAML login observed — all staff provisioned via email-with-temp-password. No Google Workspace or Microsoft 365 login integration.

⚠ **Gap UM-03:** Therapist role has 0/29 module permissions in RBAC, yet therapist names appear in session booking dropdowns — therapists may be stored separately from CRM login users.

---

## 3. Branch / Location Architecture

| Entity | URL | Key Fields |
|--------|-----|------------|
| Branch (Address Master) | /branches | Branch Name*, Address, State, City, Google Maps URL, Contact Number |

- Multi-branch architecture is designed but not yet used (0 branches configured).
- Receptionists and Branch Admins are scoped to one or more branches.
- Profile page banner: "Please add branches, assign therapists to branches, and complete branch details (including address) for proper in-person booking flow."
- Booking flow for in-person sessions depends on branch data being complete.

⚠ **Gap BR-01:** Branch entity not yet populated; in-person booking flow is incomplete until branches are configured.

---

## 4. Dashboard KPI Tracking

The Dashboard (/dashboard) aggregates cross-channel metrics:

| KPI Card | Metric | WhatsApp Sub-metric |
|----------|--------|---------------------|
| Session Bookings | Count of bookings in date range | WhatsApp-sourced bookings |
| Session Bookings Revenue | Total revenue (INR) in date range | WhatsApp-sourced revenue |
| My Clients | Total client count | WhatsApp-registered clients |
| Assessments Count | Total assessments completed | WhatsApp-triggered assessments |
| Conversations | Total conversation threads | WhatsApp conversations |

- Date range filter: Date From / Date To (dd/mm/yyyy format)
- Download icon: ↓ suggests dashboard data can be exported (not clicked — destructive if sends data)
- WhatsApp is the attributed acquisition/delivery channel across all 5 KPIs

---

## 5. Integration Gaps Summary

| ID | Integration Area | Severity | Gap Description |
|----|-----------------|----------|-----------------|
| INT-G01 | Dedicated integrations hub | MED | No /integrations page — integration settings scattered across Profile, module settings; no single place to see all connected services |
| INT-G02 | WhatsApp — SOS escalation | HIGH | SOS-categorised conversations (urgency 5) have no automated escalation: no alert webhook, no SMS, no email notification to on-call staff |
| INT-G03 | Video conferencing | MED | Mode of Consultation supports "Online" but no video platform picker; unclear if links are auto-generated or manually pasted |
| INT-G04 | Calendar sync | MED | No Google Calendar / Outlook calendar sync observed; schedule data stays inside CRM |
| INT-G05 | Payment gateway transparency | MED | Payment gateway vendor not surfaced in admin UI; no webhook configuration screen visible |
| INT-G06 | Email provider | LOW | Email transactional provider not disclosed; no email template editor or delivery log |
| INT-G07 | E-prescribing | HIGH | No e-prescribing integration for psychiatry; prescription is letterhead + signature overlay on PDF — not compliant with e-pharmacy or e-prescription regulations |
| INT-G08 | EHR / ABDM | HIGH | No Ayushman Bharat Digital Mission (ABDM) / Health ID integration observed — required for Indian digital health compliance |
| INT-G09 | AI vendor DPA | HIGH | AI conversation analysis processes PHI; vendor identity not disclosed; no data processing agreement visible in UI |
| INT-G10 | Multi-currency | LOW | International pricing stored in INR; no true multi-currency or FX conversion integration |
| INT-G11 | SSO / OAuth | MED | No SSO for staff login; all accounts use email + temp password; no Google/Microsoft workspace integration |
| INT-G12 | Audit trail | MED | "audit-log" module exists in RBAC but not scanned; no evidence of external SIEM or audit log export integration |

---

## 6. Technology Stack Signals (Observed)

| Signal | Evidence |
|--------|---------|
| Frontend framework | React SPA (page shows "You need to enable JavaScript to run this app." on raw load; react-router URL patterns) |
| API pattern | REST (XHR calls inferred from SPA behaviour; no GraphQL indicators observed) |
| Hosting | crm.swasthmind.com (custom subdomain; HTTPS confirmed) |
| Media storage | Images uploaded for Letterhead, Signature, Profile Photo — stored at a cloud URL (provider not observed) |
| PDF generation | Monthly subscription invoices as PDFs ("saday_wellness_subscription_invoice.pdf") |
| Currency | INR (₹) — Rupee symbol throughout; international pricing field also in INR |
| Date format | dd/mm/yyyy (Indian locale) |
| Chatbot feature | WhatsApp Business API + AI analysis — paid add-on (₹1,178.82/feature) |

---

*End of Phase 6 Integrations*

# SwasthMind CRM — Phase 7: Security & Compliance
**Generated:** 2026-04-19
**Source:** Live browser security analysis + synthesis from Phase 1–6 findings
**Tenant:** Production | **Role scanned as:** Admin
**Methodology:** Client-side observable signals only — no penetration testing, no backend code review, no server configuration access. All findings are inferences from browser behaviour, DOM inspection, JavaScript environment, and network request observation.

---

## 0. Scope & Limitations

This report documents security and compliance posture as observable from the authenticated admin browser session. It covers: transport security, authentication, session management, client-side vulnerabilities, data handling practices, PHI exposure surface, and regulatory compliance posture for Indian and international frameworks applicable to a mental-health group practice.

**Not in scope:** Server-side security (firewall, DB encryption at rest, server hardening), penetration testing, API fuzzing, source code review, cloud infrastructure audit.

---

## 1. Transport Security

| Control | Status | Evidence |
|---------|--------|---------|
| HTTPS (TLS) | ✅ Enforced | protocol = https:; all page loads over TLS |
| HTTP → HTTPS redirect | ✅ Assumed enforced | No HTTP downgrade observed; standard for Cloudflare-hosted sites |
| API backend TLS | ✅ Enforced | All API calls to mappapiprodv.swasthmind.com over HTTPS |
| External script TLS | ✅ All over HTTPS | Easebuzz (S3), Cloudflare Insights, Google GSI — all HTTPS |
| HTTP Strict Transport Security (HSTS) | ⚠ Not observable client-side | Cannot confirm HSTS header without server response header inspection |
| Certificate pinning | ⚠ Not observable | Browser-managed TLS; no explicit pinning observed |
| Mixed content | ✅ None observed | No HTTP resources loaded on HTTPS pages |

---

## 2. Authentication

### 2.1 Login Mechanism

| Attribute | Observed Value | Assessment |
|-----------|---------------|------------|
| Login URL | /login | Standard, no obscurity |
| Auth fields | Username (email) + Password | Basic credential auth |
| Username field type | input[type=text] autocomplete=username | Accepts email as username |
| Password field | input[type=password] autocomplete=current-password | Standard; show/hide toggle |
| Password recovery | "Forgot your password?" button → flow not fully traced | Standard reset flow present |
| MFA / 2FA | ❌ Not present | No OTP, TOTP, SMS, or authenticator app prompt observed |
| CAPTCHA | ❌ Not present | No reCAPTCHA, hCAPTCHA, or similar on login form |
| Social login | ❌ Not rendered (despite Google GSI script loaded) | Google Accounts GSI client is loaded but no "Sign in with Google" button rendered — may be unused or for client-facing portal only |
| Account lockout | ⚠ Not observable client-side | No lockout message observed; cannot confirm brute-force protection |
| "Remember Me" | ❌ Not present | Session token not persisted (sessionStorage only) |

⚠ **SEC-01 (HIGH):** No MFA for admin or any staff login. A mental-health CRM with PHI data should require MFA for all staff accounts, especially Admin.

⚠ **SEC-02 (MED):** No CAPTCHA on login page — vulnerable to credential stuffing and brute-force attacks unless rate-limiting is enforced server-side (not observable).

### 2.2 Staff Provisioning Security

| Attribute | Observed Value | Assessment |
|-----------|---------------|------------|
| Staff account creation | "A temporary password will be generated and emailed" | Temporary password sent by email |
| Password change on first login | "They must change it on first login" | Forced change indicated |
| Password policy | ⚠ Not visible in UI | No password complexity rules shown during provisioning |
| Password reset flow | Via email (inferred from "Forgot your password?") | Standard email-based reset |

⚠ **SEC-03 (MED):** Password sent via email is a weak provisioning pattern; email is not a secure channel. Prefer emailed links with time-limited tokens (not passwords themselves).

---

## 3. Session Management

| Attribute | Observed Value | Assessment |
|-----------|---------------|------------|
| Token storage | sessionStorage (key: "crm_token") | Token cleared on tab close — better than localStorage |
| Token format | JWT (Bearer) — confirmed by "ey" prefix, 351-char length | Standard JWT; cannot inspect claims without decoding |
| Token mechanism | Bearer token sent in API Authorization header (inferred from React Admin + API auth-check pattern) | Standard Bearer auth |
| Organisation context | sessionStorage key "organisation_id" = 46 | Tenant scoping stored client-side |
| Cookie usage | None visible to JS (HttpOnly likely set) | Good: session cookies HttpOnly if used |
| Session timeout | ⚠ Not observable | No visible inactivity timeout warning or auto-logout countdown |
| Concurrent sessions | ⚠ Not observable | Cannot confirm whether multiple simultaneous logins are detected/rejected |
| Logout | Avatar menu → Logout (not clicked per safety rules) | Explicit logout option present |

⚠ **SEC-04 (MED):** JWT stored in sessionStorage is vulnerable to XSS — any injected script on the domain can read sessionStorage. HttpOnly cookies are more secure for auth tokens in web apps.

⚠ **SEC-05 (LOW):** No visible session timeout / inactivity auto-logout. For a PHI-handling system, idle timeout (e.g., 15–30 min) is a best practice and HIPAA-equivalent recommendation.

---

## 4. Client-Side Security Signals

### 4.1 Content Security Policy

| Control | Status | Notes |
|---------|--------|-------|
| CSP via meta tag | ❌ Not set | No Content-Security-Policy meta tag in DOM |
| CSP via HTTP header | ⚠ Not observable client-side | May be set by Cloudflare or server; not verifiable without header inspection |
| X-Frame-Options | ⚠ Not observable | Cannot confirm clickjacking protection |

⚠ **SEC-06 (MED):** No CSP meta tag observed. If CSP is also absent from HTTP headers, the app is vulnerable to XSS and data injection attacks — critical for a PHI-containing application.

### 4.2 Third-Party Scripts

| Script | Source | Purpose | Risk |
|--------|--------|---------|------|
| easebuzz-checkout-v2.min.js | S3 ap-south-1 (Amazon AWS) | Payment gateway (Easebuzz) — **confirmed payment provider** | MED — payment script loaded from S3 (not a CDN); SRI hash not observable |
| beacon.min.js | cloudflareinsights.com | Cloudflare Web Analytics / RUM | LOW — analytics; data goes to Cloudflare |
| gsi/client | accounts.google.com | Google Sign-In JavaScript library | LOW — unused in current login UI but loaded; increases attack surface |
| react-admin-telemetry | react-admin-telemetry.marmelab.com | React-Admin open-source telemetry | LOW — sends domain name to marmelab; opt-out available but not confirmed |

⚠ **SEC-07 (MED):** Easebuzz payment script loaded from S3 bucket path — not a verified CDN with SRI (Subresource Integrity) hash. If the S3 bucket is misconfigured, a script substitution attack could compromise payment flows.

⚠ **SEC-08 (LOW):** React-Admin telemetry pings marmelab.com with the domain name (crm.swasthmind.com) — confirms the CRM is built on React-Admin framework. This telemetry should be evaluated for data minimisation compliance.

### 4.3 Technology Stack (Confirmed)

| Layer | Technology | Confidence |
|-------|-----------|------------|
| Frontend framework | React (SPA) | HIGH — React Router v6+; "You need to enable JavaScript" message |
| UI library | React-Admin (marmelab) | HIGH — "RaStore" localStorage keys; react-admin-telemetry beacon |
| State storage | sessionStorage (auth), localStorage (UI state) | HIGH — directly observed |
| API architecture | REST JSON API | HIGH — observed API calls to mappapiprodv.swasthmind.com/api/crm/ |
| Backend host | mappapiprodv.swasthmind.com | HIGH — confirmed in network requests |
| Frontend host | crm.swasthmind.com (Cloudflare) | HIGH — Cloudflare RUM endpoint /cdn-cgi/rum |
| CDN / WAF | Cloudflare | HIGH — /cdn-cgi/rum POST, beacon.min.js |
| Cloud region | AWS ap-south-1 (Mumbai) | MED — Easebuzz S3 bucket; likely backend also India-region |
| Payment gateway | **Easebuzz** | HIGH — script URL confirmed |
| Google integration | Google Accounts GSI | MED — script loaded; UI not rendered |
| Database | Unknown — not observable | N/A |

---

## 5. PHI Data Handling Assessment

### 5.1 PHI Exposure Surface

| PHI Category | Where Observed | Risk |
|-------------|---------------|------|
| Client name, email, phone | My Clients list, Reports, Conversations | HIGH — visible in list views; not masked |
| Clinical conversation content | Chat History modal (full transcript visible) | HIGH — raw WhatsApp messages with clinical content displayed |
| AI-generated clinical summaries | Conversation Analysis modal | HIGH — AI summary of client mental state displayed to any role with Conversations access |
| Assessment responses | Assessment module | HIGH — clinical questionnaire answers stored as responseData JSON |
| Session invoices | Reports module | MED — email + phone appear in per-row detail view |
| Banking details | Profile → Payment Information | HIGH — bank account number, IFSC, PAN, GST stored and displayed to Admin |
| Prescription data | Prescriptions module (not scanned) | HIGH (inferred) |

⚠ **SEC-09 (HIGH):** Clinical conversation transcripts are fully visible in the Chat History modal with no role-based redaction, masking, or "view-once" controls. Any Receptionist or Manager with Conversations access can read full client mental-health disclosures.

⚠ **SEC-10 (HIGH):** AI-generated clinical summaries (Urgency, Key Themes, AI Summary) are treated as operational metadata — not protected as clinical notes. These are as sensitive as formal assessment results.

### 5.2 Data Minimisation

| Area | Observation |
|------|-------------|
| PHI in API query string | therapist_id and organisation_id passed as URL query parameters (not body) — visible in server logs and browser history |
| PHI in session/local storage | JWT token + organisation_id in sessionStorage; therapistFilter in localStorage — token contains claims that may include user/org identity |
| PHI in network payloads | Cannot inspect API response bodies without deeper tooling |

⚠ **SEC-11 (MED):** organisation_id=46 and therapist_id=179 passed as URL query parameters. While not directly PHI, these tenant identifiers are logged in server access logs and browser history — a data minimisation concern.

---

## 6. Regulatory Compliance Assessment

### 6.1 India — Digital Personal Data Protection Act 2023 (DPDPA)

| Requirement | Status | Evidence / Gap |
|-------------|--------|---------------|
| Consent before data collection | ⚠ Not observed in CRM UI | No consent capture flow visible for client data entry in manual booking or client creation forms |
| Data Principal rights (access, correction, erasure, nomination) | ❌ Not observed | No client-facing rights portal or admin tool for data subject requests |
| Data Fiduciary obligations | ⚠ Partial | Org stores name, email, phone, DOB, clinical content — DPDPA "significant data fiduciary" criteria likely met |
| Data Localisation | ✅ Likely compliant | AWS ap-south-1 (Mumbai) inferred; Cloudflare India PoP likely |
| Breach notification | ⚠ Not observable | No breach notification workflow visible in CRM |
| Children's data (under 18) | ⚠ High risk | "Child Therapy" is a listed session type; no age-verification or parental consent mechanism observed |
| Data Processor agreements | ⚠ Unverified | Easebuzz, Cloudflare, Meta/WhatsApp, AI vendor — DPA status not observable in UI |

⚠ **SEC-12 (HIGH — DPDPA):** Child Therapy is a configured session type with no visible parental consent mechanism. DPDPA prohibits processing personal data of minors without verifiable parental consent.

⚠ **SEC-13 (HIGH — DPDPA):** No client-facing consent capture flow observed in the booking/client creation process. DPDPA requires explicit, informed, specific consent before processing personal data.

### 6.2 India — IT Act 2000 & SPDI Rules 2011

| Requirement | Status | Evidence / Gap |
|-------------|--------|---------------|
| Privacy policy publication | ⚠ Not visible in CRM | No privacy policy link on login page, profile, or any observed page |
| Security practices for SPDI | ⚠ Partial | HTTPS ✅; no MFA ❌; no visible encryption-at-rest policy |
| SPDI categories present | ✅ Identified | Medical records, financial information (bank), biometric (signature image) — all SPDI under IT Rules |
| Grievance officer details | ❌ Not observed | No grievance officer contact visible in CRM |

⚠ **SEC-14 (HIGH — IT Act/SPDI):** No privacy policy link visible anywhere in the CRM. IT Act SPDI Rules require a published privacy policy for organisations collecting sensitive personal data.

### 6.3 Mental Health — Clinical Data Standards

| Requirement | Status | Evidence / Gap |
|-------------|--------|---------------|
| Mental Healthcare Act 2017 (India) compliance | ⚠ Partial | Confidentiality of mental health records required; role-based access exists but Therapist has zero access |
| Duty of care for SOS/crisis cases | ❌ Gap | SOS-categorised conversations (urgency 5) have no automated escalation or alert — clinician may not be notified |
| Clinical record integrity | ⚠ No audit trail | Audit-log module exists in RBAC but URL returns 404; change history not visible |
| Informed consent for assessment | ⚠ Not observed | Assessment assignment form does not show consent capture step |
| Prescription standards | ⚠ Not scanned | Prescriptions module exists; letterhead + signature system is basic |

⚠ **SEC-15 (CRITICAL — Clinical):** SOS-categorised conversations (AI urgency = 5) trigger no automated alert, escalation, or duty-of-care response. This is a clinical governance failure for a mental health practice.

### 6.4 Payment — PCI DSS & RBI Guidelines

| Requirement | Status | Evidence / Gap |
|-------------|--------|---------------|
| Payment data not stored in CRM | ✅ Observed | Card/payment data not visible in any CRM field; handled by Easebuzz |
| PCI DSS scope reduction | ✅ Likely | Easebuzz integration offloads PCI scope |
| UPI / payment link compliance | ✅ Likely | Easebuzz is a PCI-compliant Indian payment aggregator |
| Bank account data storage | ⚠ Concern | Org bank account number, IFSC, PAN, GST stored in Profile — administrative, not transactional, but still sensitive |
| Refund processing | Manual | Per policy: Manual refund processing — no automated refund triggers |

### 6.5 HIPAA (Informational — if international clients served)

| Requirement | Status | Evidence / Gap |
|-------------|--------|---------------|
| BAA with vendors | ❌ Not observable | WhatsApp/Meta, AI analysis vendor — BAA required if US clients served |
| Minimum necessary principle | ⚠ Partial | Receptionist has access to full conversation transcripts; not clearly minimum necessary |
| Audit controls | ⚠ Incomplete | Audit-log RBAC module exists but is inaccessible via direct URL |
| Encryption at rest | ⚠ Not observable | Cannot confirm from browser |
| Breach notification (60-day) | ⚠ Not observable | No workflow visible |

---

## 7. Access Control Assessment

| Control | Status | Evidence |
|---------|--------|---------|
| Role-based access control | ✅ Present | /rbac-config matrix with 29 modules × 4 roles |
| Admin super-access | ✅ Confirmed | Admin has access to all 29 modules |
| Therapist access | ❌ Zero access | All 29 checkboxes unchecked for Therapist role |
| Principle of least privilege | ⚠ Partial | Manager has broad access; Receptionist has Conversations/Sessions/Booking but not Reports |
| Field-level access control | ❌ Not observed | No field-level PHI masking within modules (e.g., phone number masking) |
| IP allowlisting | ❌ Not observed | No IP restriction controls visible in admin UI |
| Device trust | ❌ Not observed | No device registration or trusted device management |

---

## 8. Audit & Monitoring

| Control | Status | Evidence |
|---------|--------|---------|
| Audit log module | ⚠ Exists but inaccessible | "audit-log" in RBAC matrix; /audit-log and /audit-logs return 404 |
| API access logging | ⚠ Server-side only | Cloudflare handles access logs (not observable) |
| Real User Monitoring | ✅ Present | Cloudflare RUM (/cdn-cgi/rum) active |
| Error monitoring | ⚠ Not observed | No Sentry or similar error tracking script observed |
| Failed login alerting | ⚠ Not observable | Server-side; cannot confirm |
| Data export logging | ⚠ Not observable | Download icons exist on Reports/Dashboard; no export audit visible |

⚠ **SEC-16 (MED):** Audit log module exists in RBAC but is not accessible via any observed URL. Audit trail may be implemented server-side but has no admin-facing UI — admins cannot self-serve compliance reports.

---

## 9. Summary Risk Register

| ID | Category | Severity | Finding |
|----|----------|----------|---------|
| SEC-01 | Authentication | 🔴 HIGH | No MFA for any staff role — critical for PHI-handling system |
| SEC-02 | Authentication | 🟠 MED | No CAPTCHA on login — brute-force risk without server-side rate limiting |
| SEC-03 | Provisioning | 🟠 MED | Temporary passwords sent via email — insecure provisioning channel |
| SEC-04 | Session | 🟠 MED | JWT stored in sessionStorage — XSS-extractable |
| SEC-05 | Session | 🟡 LOW | No visible session inactivity timeout / auto-logout |
| SEC-06 | Client-side | 🟠 MED | CSP not set via meta tag; server-side CSP unverified |
| SEC-07 | Third-party | 🟠 MED | Easebuzz script from S3 without confirmed SRI hash |
| SEC-08 | Third-party | 🟡 LOW | React-Admin telemetry beacon pings marmelab.com |
| SEC-09 | PHI | 🔴 HIGH | Full clinical conversation transcripts visible to all roles with Conversations access |
| SEC-10 | PHI | 🔴 HIGH | AI clinical summaries unprotected — treated as metadata |
| SEC-11 | Data minimisation | 🟠 MED | Tenant IDs in URL query params logged in server/browser history |
| SEC-12 | DPDPA | 🔴 HIGH | Child Therapy session type with no parental consent mechanism |
| SEC-13 | DPDPA | 🔴 HIGH | No client consent capture in booking/client creation flow |
| SEC-14 | IT Act/SPDI | 🔴 HIGH | No privacy policy link visible anywhere in the CRM |
| SEC-15 | Clinical | 🔴 CRITICAL | SOS/urgency-5 conversations have no automated escalation or alert |
| SEC-16 | Audit | 🟠 MED | Audit log module inaccessible; no admin-facing audit trail UI |

**Risk count by severity:**
- 🔴 CRITICAL: 1
- 🔴 HIGH: 5
- 🟠 MED: 7
- 🟡 LOW: 2
- ✅ Adequate: 4 (HTTPS, TLS, Cloudflare WAF, payment offload to Easebuzz)

---

## 10. Recommendations (Priority Order)

1. **Implement MFA immediately** (TOTP or SMS OTP) for all staff accounts, especially Admin — highest PHI risk reduction.
2. **Deploy SOS escalation automation** — when AI urgency = 5 or Category = SOS, fire an immediate push notification, SMS, or in-app alert to the on-call clinician.
3. **Publish a privacy policy** and link it from the login page and client-facing booking portal — DPDPA + IT Act mandatory.
4. **Add client consent capture** to the booking and client creation flow — DPDPA requires affirmative consent before processing personal data.
5. **Fix the Therapist RBAC configuration** — all 29 module permissions are off; therapists cannot access any CRM screen.
6. **Implement field-level PHI controls** — mask phone numbers for Receptionist role; restrict full conversation transcript to clinical roles only.
7. **Move JWT to HttpOnly cookie** to eliminate XSS-based token theft.
8. **Implement session idle timeout** (15–30 min) with a warning modal.
9. **Add parental consent mechanism** for Child Therapy session bookings (DPDPA requirement for minors).
10. **Surface audit log UI** — make /audit-log accessible to Admin for self-service compliance review.
11. **Add SRI hashes** to third-party scripts (Easebuzz, Google GSI) to prevent supply-chain script substitution.
12. **Disable or remove React-Admin telemetry** or confirm opt-out — data minimisation best practice.

---

*End of Phase 7 Security & Compliance*

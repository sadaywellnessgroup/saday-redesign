# MantraCare — Phase 1 Reconnaissance (Sitemap)

**Scanned**: 2026-09-12 · **Session role**: logged-in Therapist/Provider (own/test account, name [REDACTED])
**Method**: read-only. No account created, no login attempted, no form submitted, no booking, no payment.
**Properties in scope**: `mantracare.com` (public, WordPress 7.1 + Elementor) · `web.mantracare.com` (client app, Next.js) · `provider.mantracare.com` (provider portal, Next.js, build `U7gOfFeQqX9z-GWGed_b7`)

> **Note on completeness.** Both Next.js apps expose their full route manifest to the
> browser (`window.__BUILD_MANIFEST.sortedPages`). The page-type inventory below is
> therefore the *complete* declared route set — 104 provider routes and 109 client
> routes — not a sample inferred from clicking. Routes marked "gated (not visited)"
> were read from the manifest, not opened. Appendix A holds the verbatim lists.

---

## Sitemap

| # | Section / product line | Submenu | Screen / page-type | Public or gated | Purpose (1 line) | Screenshot ref |
|---|---|---|---|---|---|---|
| **A** | **PUBLIC MARKETING SITE — mantracare.com** | | | | | |
| A1 | Home / brand | — | `/` single-page landing (hero, program grid, B2B suites) | public | "One Place For Health and Care" — AI-first care across mental health, MSK, chronic conditions, wellness; claims 40–50% cost reduction | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A2 | Individuals › Mental Wellbeing | — | Program card cluster (4 cards) | public | Routes to Individual/Couple Therapy, Counseling (by Interns), Psychiatry, LGBTQ+ Counseling | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A3 | Individuals › Emotional Wellbeing | — | Program card cluster (4 cards) | public | Routes to Psychometric/Clinical Tests, Mindfulness/Yoga, OCD Care, Coaching | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A4 | Individuals › Physical Wellbeing | — | Program card cluster (4 cards) | public | Routes to Doctor Consultation (popup, not a page), Nutrition/Weight, Women's Wellness, Fitness | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A5 | Individuals › Specialized Care | — | Program card cluster (4 cards) | public | Routes to Diabetes, Physiotherapy, Hypertension, Substance Use | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A6 | Mantra EAP (B2B) | — | Homepage section | public | Employer EAP suite: Mental Health (EAP), Mindfulness/Yoga, Financial Wellbeing, Risk Assessment (CERA), Life Coaching | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A7 | Mantra Wellness (B2B) | — | Homepage section | public | Employer wellness suite: Virtual Care/Teleconsult, Health Screenings & Diagnostics, Nutrition, Weight/Fitness, Workplace Challenges | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A8 | Mantra Specialized Care (B2B) | — | Homepage section | public | Employer condition suite: Diabetes/Hypertension, Women Care, Physiotherapy/MSK, Substance Abuse, Maternity/Paternity | [ss_44733oc91](screenshots/public/home__landing__ss_44733oc91.png) |
| A9 | Lead capture | — | Elementor popups (ids 54, 94) | public | Two modal enquiry forms; "Doctor Consultation" opens popup 94 rather than a plan page | not yet opened |
| A10 | Legal / contact | — | `/contact-us/`, `/privacy-policy/`, `/terms/`, `/refund-policy/`, `/billing-policy/` | public | Entire footer is 5 links — no sitemap, no blog, no test hub linked from home | not yet opened |
| **B** | **CLIENT APP — web.mantracare.com** | | | | | |
| B1 | Auth / onboarding | — | `/`, `/get-started`, `/login`, `/login/magic-link`, `/login/oauth/[provider]`, `/login/auth-redirect`, `/login/forgot-pass` (+`/verify`, `/recover`), `/register`, `/register/partner-user`, `/saml/sso` | public (entry) | Email-first passwordless entry with phone alternative and Google OAuth; separate SAML SSO path and a "partner user" registration | [ss_4872rplt5](screenshots/public/client-login__ss_4872rplt5.png) |
| B2 | Plans / commerce | Plans | `/plans/all`, `/plans/[category]` | **public** | Full plan & price catalog, browsable with no login; geo + language selectors | [ss_5466a260j](screenshots/public/plans__catalog__ss_5466a260j.png) |
| B3 | Plans / commerce | Checkout | `/checkout`, `/checkout/processing`, `/checkout/failed`, `/payment-success`, `/subscription`, `/orders`, `/wallet` | gated (not visited) | Subscription purchase, order history, stored wallet balance | — |
| B4 | Care delivery | Sessions | `/session/all`, `/session/upcoming`, `/session/pending`, `/session/done`, `/session/rate`, `/session/appointment/[appointmentId]`, `/session/[uuid]`, `/appointments` | gated (not visited) | Session lifecycle from booking through post-session rating | — |
| B5 | Care delivery | Provider choice | `/provider/[slug]/[providerID]/[providerName]`, `/provider-products`, `/provider-trial`, `/switch-provider/[service_id]`, `/preference-form/[serviceId]` | partly public (not visited) | Provider directory profile, a trial mechanism, self-serve provider switching, and a preference form that drives matching | — |
| B6 | Clinical tools | Assessments | `/assessments/[activityID]/[assessment]`, `/assessments/entry/[entryID]/report/[reportID]`, `/assessments/insights` | gated (not visited) | Assessment delivery, per-entry report, and a cross-assessment insights view | — |
| B7 | Clinical tools | Journal | `/journal`, `/journal/add`, `/journal/[id]`, `/journal/suggestions` | gated (not visited) | Client journaling with a suggestions surface (likely AI-prompted) | — |
| B8 | Clinical tools | Pathway / documents | `/pathway`, `/documents`, `/documents/[documentId]`, `/documents/form/[assignmentId]` | gated (not visited) | Care pathway plus assigned documents/forms (homework, intake) | — |
| B9 | Content library | Mindfulness | `/mindfulness`, `/discover`, `/featured`, `/categories`, `/category/[categoryId]`, `/time/[time]`, `/media/[mediaId]/[isAudio]`, `/all-liked` | gated (not visited) | Audio/video meditation library faceted by category, duration and favourites | — |
| B10 | Physical health | Physio-AI | `/physio-ai/environment-check`, `/prepare-session`, `/[session_id]`, `/exercise-plan/all`, `/exercise-plan/details`, `/summary` | gated (not visited) | Camera-based guided exercise sessions — an environment check implies computer-vision form tracking | — |
| B11 | Physical health | Healthcare / diagnostics | `/healthcare`, `/health-checks`(+`/[slug]`,`/cart`), `/lab-test`(+`/[slug]`,`/cart`), `/payment-verification`, `/customer/addresses`, `/customer/members`, `/customer/orders`(+`/[orderid]`) | gated (not visited) | A full e-commerce lane for lab tests and health checks — cart, addresses, family "members" | — |
| B12 | Insurance | EHR / insurance | `/ehr/insurance`, `/ehr/insurance/client-info`, `/ehr/insurance/billing/[[...entryId]]`, `/ehr/invite/[[...params]]`, `/billing/insurance`, `/billing/add-insurance`, `/billing/claims` | gated (not visited) | Client-side insurance capture and claims — a US-payer lane alongside the INR retail lane | — |
| B13 | Billing | — | `/billing`, `/billing/orders`, `/billing/subscriptions`, `/billing/book-sessions` | gated (not visited) | Client billing hub | — |
| B14 | Community / engagement | — | `/community`, `/events`, `/events/[id]`, `/challenge/invite/[inviteID]`, `/refer-earn`, `/invite`, `/chat`, `/chat/invite/[token]` | gated (not visited) | Peer community, live events, invite-based challenges, referral loop, and chat | — |
| B15 | Corporate / EAP | — | `/corporate-invite`, `/healthcare/customer`, `/register/partner-user`, `/saml/sso` | gated (not visited) | Employer-sponsored enrolment: invite redemption, SSO, partner-user registration | — |
| B16 | Account & support | — | `/account`, `/account/delete`, `/profile`, `/support`, `/hotline`, `/troubleshoot`, `/alert`, `/redirect/[params]`, `/external`, `/internal` | gated (not visited) | Account settings, **self-serve account deletion**, support, a crisis `/hotline` route, and an `/internal` route | — |
| B17 | WordPress bridge | — | `/wp/[link]`, `/wp-redirect`, `/[slug]`, `/app/[...slug]`, `/app/content/[...slug]` | mixed | Catch-all routes that proxy or redirect into WordPress content — how legacy SEO pages are stitched to the app | — |
| **C** | **PROVIDER PORTAL — provider.mantracare.com** | | | | | |
| C1 | Home | — | `/` → `/get-started` (Dashboard) | gated (logged in) | Practice dashboard: Action Center (pending requests), profile-boost banner, 9 Quick Access tiles, insurance-credentialing banner | [ss_62924duj1](screenshots/provider/dashboard__home__ss_62924duj1.png) |
| C2 | Clients | — | `/clients` (list) | gated (logged in) | Caseload list | not yet opened |
| C3 | Clients | Client record | `/clients/[clientId]/` → `profile`, `client-info`, `session-notes`, `journal`(+`/[journalId]`), `insights`, `pathways`, `tools`, `orders`, `billing`, `client-billing`, `insurance`, `claims`(+`/new`, `/[claimId]/form`) | gated (logged in) | 13-tab client chart — the clinical core: notes, client journal visibility, insights, pathways, and a full insurance-claims sub-flow | not yet opened |
| C4 | Billing | — | `/billing`, `/billing/[state]`, `/invoices/create`, `/invoices/unbilled`, `/invoices/[invoiceId]`, `/invoices/[invoiceId]/add-payment` | gated (logged in) | Provider invoicing incl. an "unbilled" queue and manual payment recording | not yet opened |
| C5 | Messages | — | `/chat` | gated (logged in) | Provider↔client messaging | not yet opened |
| C6 | Appointments | — | `/appointments`, `/requests`, `/request/accepted`, `/request/invalid`, `/request/unavailable`, `/session/all`, `/session/upcoming`, `/session/pending`, `/session/done`, `/session/rate`, `/session/appointment/[appointmentId]`, `/session/[uuid]` | gated (logged in) | Appointment and session lifecycle, plus an inbound request accept/decline funnel with three terminal states | not yet opened |
| C7 | Scheduling | — | `/scheduling/calendar`, `/scheduling/timeslots`, `/scheduling/daysoff` | gated (logged in) | Availability: calendar, bookable timeslots, days off | not yet opened |
| C8 | For Mantra Provider | Client Leads | `/requests` (+`/mantra-provider`) | gated (logged in) | Marketplace lead acceptance — the supply side of MantraCare's matching | not yet opened |
| C9 | For Mantra Provider | Mantra Premium | `/premium` | gated (logged in) | Paid "preferred provider" tier that buys visibility | not yet opened |
| C10 | For Mantra Provider | Mantra Earnings | `/earnings`, `/payout`, `/wallet` | gated (logged in) | Earnings, payout and wallet | not yet opened |
| C11 | For Mantra Provider | Bank & Tax | `/bank-tax` | gated (logged in) | Payout bank details and tax identity | not yet opened |
| C12 | For Mantra Provider | Tasks | (in-app) | gated (logged in) | Provider task list | not yet opened |
| C13 | For Mantra Provider | Marketing | `/marketing` | gated (logged in) | Self-marketing tools for the provider's own profile | not yet opened |
| C14 | Refer and Earn | — | `/refer-earn` | gated (logged in) | Provider referral programme | not yet opened |
| C15 | Settings | — | `/settings`, `/profile`, `/profile-submitted`, `/profile-resubmitted`, `/verification`, `/verification-submitted` | gated (logged in) | Settings/profile plus a **profile-review submission workflow** (submit → resubmit → verified) | not yet opened |
| C16 | Forms | — | `/custom-forms`, `/custom-forms/builder/[[...id]]`, `/custom-forms/preview/[id]`, `/custom-forms/fill/[id]`, `/custom-forms/submissions/[id]`, `/forms/[type]/[name]` | gated (logged in) | **A form builder** with preview, fill, and per-form submissions — provider-authored intake/outcome instruments | not yet opened |
| C17 | Tools (Show more) | AI Transcriber | `/tools/ai-transcriber`, `/onboarding/ai-scribe` | gated (logged in) | AI scribe — ambient session transcription, with its own onboarding | not yet opened |
| C18 | Tools (Show more) | Session Notes | `/session/notes`, `/session/notes/view`, `/session/notes/[sessionId]`, `/session/notes/edit/[entryId]`, `/tools/session-notes` | gated (logged in) | Session note authoring/editing — the clinical documentation surface | not yet opened |
| C19 | Tools (Show more) | Prescriptions | `/prescriptions`, `/prescriptions/[prescriptionId]/edit`, `/tools/prescription` | gated (logged in) | E-prescribing (psychiatry) | not yet opened |
| C20 | Tools (Show more) | Resources | `/tools`, `/tools/canned-response`, `/pathway`, `/treatment-plans`, `/assessment/entry/[entryID]/report/[reportID]` | gated (logged in) | Canned responses, treatment plans, care pathways, assessment reports | not yet opened |
| C21 | Tools (Show more) | AI CRM | `/ai-crm` | gated (logged in) | AI-assisted CRM over the provider's client base | not yet opened |
| C22 | Physio module | — | `/physio/create-plan`, `/physio/[clientId]/allocate-plan`, `/physio/[clientId]/exercise-library`, `/physio/[clientId]/exercise-management`, `/physio/[clientId]/exercise-details/[allocationId]`, `/physio/[clientId]/summary` | gated (not in sidebar) | Physiotherapy exercise prescription — library, plan allocation, adherence summary. **Not exposed in this account's nav** (likely role/speciality-gated) | not yet opened |
| C23 | Insurance credentialing | — | `/ehr/credentialing`, `/ehr/credentialing/apply`, `/onboarding/ehr` | gated (not in sidebar) | Get credentialed with health plans — surfaced only as the dashboard's "Grow with insurance" banner | not yet opened |
| C24 | Community & support | — | `/community`, `/support`, `/help-center` | gated (not in sidebar) | Provider community, support, help centre | not yet opened |
| C25 | Auth / onboarding | — | `/login`, `/login/oauth/[provider]`, `/login/auth-redirect`, `/login/forgot-pass`(+`/verify`,`/recover`), `/register`, `/oauth`, `/onboarding` | public (entry) | Provider self-signup and onboarding | not yet opened |
| C26 | Payment | — | `/payment/success`, `/payment/cancel` | gated (not visited) | Provider-side payment outcomes (likely Premium subscription) | — |
| C27 | WordPress bridge | — | `/wp/[...params]`, `/wp-redirect` | mixed | Same WordPress proxy pattern as the client app | — |

---

## Phase 1 status block

- **Section / flow**: Phase 1 reconnaissance (all three properties)
- **Screens captured**: 5 screenshots; **213 routes inventoried** (104 provider + 109 client) + 6 WordPress pages
- **Features identified**: 27 sitemap sections; ~15 notable capabilities flagged for Phase 2 (AI scribe, AI CRM, form builder, physio-AI, claims, credentialing, lab-test commerce, community/events, hotline, referral, premium tier, wallet/payout, journal, pathways, assessments)
- **Integrations noted (preliminary)**: 4 — Google OAuth, SAML SSO, Cloudflare (insights/CDN), WordPress+Elementor. A chat widget is present on the public plan pages (vendor not yet identified).
- **Blocking questions**: which sections to prioritise for Phase 2 (see below)

## Roles the system implies

| Role | Evidence | Reachable this session |
|---|---|---|
| Anonymous public | mantracare.com; `web.mantracare.com/plans/*` renders with prices and no login | Yes |
| Client / patient | `web.mantracare.com` — 109 routes behind an email-first gate | No (would require login — not attempted) |
| Provider / therapist | `provider.mantracare.com` — current session | **Yes** |
| Corporate / HR | `/corporate-invite`, `/register/partner-user`, `/saml/sso`, `/healthcare/customer/members`, EAP suites | No |
| Internal / admin | `/internal` route in the client app | No |

## What I could not reach in Phase 1

- Every client-app screen behind the login gate (no login attempted, per constraints).
- Corporate/HR dashboard — no public entry point found; enrolment appears to be invite- or SSO-only.
- The two Elementor lead popups (not yet opened).
- `/physio/*` and `/ehr/credentialing` in the provider portal — present in the route table but absent from this account's sidebar, so possibly speciality- or eligibility-gated.
- Any legacy SEO/blog/free-test hub: **the public homepage links to none**. The old MantraCare content estate is either retired or reachable only via the `/wp/` bridge routes.

---

## Appendix A — verbatim route manifests

### A.1 provider.mantracare.com (104 routes)
```
/                                              /login/forgot-pass/verify
/_app                                          /login/oauth/[provider]
/_error                                        /mantra-provider
/ai-crm                                        /marketing
/app/content/[...slug]                         /oauth
/appointments                                  /onboarding
/assessment/entry/[entryID]/report/[reportID]  /onboarding/ai-scribe
/bank-tax                                      /onboarding/ehr
/billing                                       /pathway
/billing/[state]                               /payment/cancel
/chat                                          /payment/success
/clients                                       /payout
/clients/[clientId]/billing                    /physio/create-plan
/clients/[clientId]/claims                     /physio/[clientId]/allocate-plan
/clients/[clientId]/claims/new                 /physio/[clientId]/exercise-details/[allocationId]
/clients/[clientId]/claims/[claimId]/form      /physio/[clientId]/exercise-library
/clients/[clientId]/client-billing             /physio/[clientId]/exercise-management
/clients/[clientId]/client-info                /physio/[clientId]/summary
/clients/[clientId]/insights                   /premium
/clients/[clientId]/insurance                  /prescriptions
/clients/[clientId]/journal                    /prescriptions/[prescriptionId]/edit
/clients/[clientId]/journal/[journalId]        /profile
/clients/[clientId]/orders                     /profile-resubmitted
/clients/[clientId]/pathways                   /profile-submitted
/clients/[clientId]/profile                    /refer-earn
/clients/[clientId]/session-notes              /register
/clients/[clientId]/tools                      /request/accepted
/community                                     /request/invalid
/custom-forms                                  /request/unavailable
/custom-forms/builder/[[...id]]                /requests
/custom-forms/fill/[id]                        /scheduling/calendar
/custom-forms/preview/[id]                     /scheduling/daysoff
/custom-forms/submissions/[id]                 /scheduling/timeslots
/earnings                                      /session/all
/ehr/credentialing                             /session/appointment/[appointmentId]
/ehr/credentialing/apply                       /session/done
/forms/[type]/[name]                           /session/notes
/get-started                                   /session/notes/edit/[entryId]
/help-center                                   /session/notes/view
/invoices/create                               /session/notes/[sessionId]
/invoices/unbilled                             /session/pending
/invoices/[invoiceId]                          /session/rate
/invoices/[invoiceId]/add-payment              /session/upcoming
/login                                         /session/[uuid]
/login/auth-redirect                           /settings
/login/forgot-pass                             /support
/login/forgot-pass/recover                     /tools
                                               /tools/ai-transcriber
                                               /tools/canned-response
                                               /tools/prescription
                                               /tools/session-notes
                                               /treatment-plans
                                               /verification
                                               /verification-submitted
                                               /wallet
                                               /wp/[...params]
                                               /wp-redirect
```

### A.2 web.mantracare.com (109 routes)
```
/                                              /healthcare/customer/addresses
/_app                                          /healthcare/customer/members
/_error                                        /healthcare/customer/orders
/account                                       /healthcare/customer/orders/[orderid]
/account/delete                                /healthcare/health-checks
/alert                                         /healthcare/health-checks/cart
/app/content/[...slug]                         /healthcare/health-checks/[slug]
/app/[...slug]                                 /healthcare/lab-test
/appointments                                  /healthcare/lab-test/cart
/assessments/entry/[entryID]/report/[reportID] /healthcare/lab-test/[slug]
/assessments/insights                          /healthcare/payment-verification
/assessments/[activityID]/[assessment]         /hotline
/billing                                       /internal
/billing/add-insurance                         /invite
/billing/book-sessions                         /journal
/billing/claims                                /journal/add
/billing/insurance                             /journal/suggestions
/billing/orders                                /journal/[id]
/billing/subscriptions                         /login
/challenge/invite/[inviteID]                   /login/auth-redirect
/chat                                          /login/forgot-pass
/chat/invite/[token]                           /login/forgot-pass/recover
/checkout                                      /login/forgot-pass/verify
/checkout/failed                               /login/magic-link
/checkout/processing                           /login/oauth/[provider]
/community                                     /mindfulness
/corporate-invite                              /mindfulness/all-liked
/documents                                     /mindfulness/categories
/documents/form/[assignmentId]                 /mindfulness/category/[categoryId]
/documents/[documentId]                        /mindfulness/discover
/ehr/insurance                                 /mindfulness/featured
/ehr/insurance/billing/[[...entryId]]          /mindfulness/media/[mediaId]/[isAudio]
/ehr/insurance/client-info                     /mindfulness/time/[time]
/ehr/invite/[[...params]]                      /orders
/events                                        /pathway
/events/[id]                                   /payment-success
/external                                      /physio-ai/environment-check
/get-started                                   /physio-ai/exercise-plan/all
/healthcare                                    /physio-ai/exercise-plan/details
/healthcare/customer                           /physio-ai/prepare-session
                                               /physio-ai/summary
                                               /physio-ai/[session_id]
                                               /plans/all
                                               /plans/[category]
                                               /preference-form/[serviceId]
                                               /profile
                                               /provider/[slug]/[providerID]/[providerName]
                                               /provider-products
                                               /provider-trial
                                               /redirect/[params]
                                               /refer-earn
                                               /register
                                               /register/partner-user
                                               /saml/sso
                                               /session/all
                                               /session/appointment/[appointmentId]
                                               /session/done
                                               /session/pending
                                               /session/rate
                                               /session/upcoming
                                               /session/[uuid]
                                               /subscription
                                               /support
                                               /switch-provider/[service_id]
                                               /troubleshoot
                                               /wallet
                                               /wp/[link]
                                               /wp-redirect
                                               /[slug]
```

### A.3 mantracare.com public program links (WordPress)
```
Mental Wellbeing      Individual/Couple Therapy   web.mantracare.com/plans/therapy
                      Counseling (by Interns)     web.mantracare.com/plans/therapyintern
                      Psychiatry                  web.mantracare.com/plans/psychiatrist
                      LGBTQ+ Counseling           web.mantracare.com/plans/lgbtq-therapy
Emotional Wellbeing   Psychometric/Clinical Tests web.mantracare.com/plans/assessment
                      Mindfulness/Yoga            web.mantracare.com/plans/yoga
                      OCD Care                    web.mantracare.com/plans/ocdtherapy
                      Coaching                    web.mantracare.com/plans/coach
Physical Wellbeing    Doctor Consultation         (Elementor popup id 94 — no plan page)
                      Nutrition/Weight            web.mantracare.com/plans/dietitian
                      Women's Wellness            web.mantracare.com/plans/women-wellness
                      Fitness                     web.mantracare.com/plans/fitness
Specialized Care      Diabetes                    web.mantracare.com/plans/diabetes
                      Physiotherapy               web.mantracare.com/plans/physiotherapy
                      Hypertension                web.mantracare.com/plans/hypertension
                      Substance Use               web.mantracare.com/plans/substance-use
Footer                Contact Us / Privacy policy / Terms of use / Refund policy / Billing Policy
```

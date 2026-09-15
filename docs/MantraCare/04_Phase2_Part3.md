# MantraCare — Phase 2 Deep Capture (Provider Portal), Part 3 — FINAL
## The marketplace layer: dashboard, leads, the Preferred Provider gate, earnings, referrals

**Role**: Therapist/Provider (own/test account) · **Scanned**: 2026-09-12
**Sections**: Dashboard · Client Leads · Mantra Premium (Preferred Provider) · Tasks · Marketing · Earnings · Bank & Tax · Messages · Refer and Earn
**All names, emails, phone numbers, bank identifiers and record IDs are [REDACTED].**

> This part completes the provider portal. Parts 1 and 2 covered the clinical and billing surfaces; this is the layer that explains **why the product is shaped the way it is**.

---

## The headline: referral access is gated behind a score you cannot reach

**Mantra Premium** (`/premium`) states plainly:

> "Only preferred providers receive session requests from Mantra's network of **1M+ individuals and 20K+ corporate clients**."

Qualifying requires **500 points**. This account sits at **50 / 500**, with the page saying "450 more points needed to unlock preferred provider status". The page offers an "Apply as Preferred Provider" button and **no explanation of how points are earned** — the "500 points" text looks like a link but is inert.

The answer is in **Tasks** (`/tasks`): "Your profile rank on Mantra depends on your **provider score**. Only preferred providers (**500+ score**) get referrals to corporate and individual clients. Complete the quick tasks below to earn points."

**The arithmetic does not work.** Tasks shows "**1/12**" overall progress, and every task observed is worth **5 points**:

| Task | Type | Time | Points |
|---|---|---|---|
| Introduction to Mantra Platform | Video | 4 mins | 5 |
| Getting Clients from Mantra – Understand the Provider Score | Video | 3 mins | 5 |
| Using Mantra for Your Clients **(old)** | Video | 4 mins | 5 |
| What is a Premium Provider? **(Old)** | To do | 0 mins | 5 |
| Complete your Profile Verification | To do | 10 mins | 5 |
| …7 more behind "View More" | | | 5 each |

**12 tasks × 5 points = 60 points maximum.** Starting from 50, a provider who completes every disclosed task reaches roughly **110 of the 500** required. The remaining ~78% of the score comes from undisclosed inputs. Marketing copy elsewhere ("Share your profile… to **boost your listing rank**") implies promotional activity feeds it, but nothing states the formula.

**Interpretation**: the demand side (1M+ individuals, 20K+ corporates) is the platform's principal asset, and access to it is rationed by an opaque score. A provider is invited to do unpaid onboarding, verification and social-media promotion work toward a threshold that the visible path cannot reach. Two of the five visible tasks are explicitly marked "(old)"/"(Old)" — stale content shipped in production.

**For your build**: this is the single clearest strategic gap. A provider who signs up for MantraCare to get clients discovers the clients are behind a wall; what they actually receive is practice software with a caseload cap. If your CRM serves clinicians who already have referral sources, you are competing only with the software — and the software has the defects catalogued in Parts 1 and 2.

---

## Screen

### Dashboard
- **Path**: `/` (note: `/dashboard` returns 404)
- **Primary purpose**: "Here's what's happening with your practice today."
- **Key UI elements**: **Action Center** (collapsible, "Your pending tasks and appointments"); promo banner "**Boost Your Profile. Get More Clients**" `NEW` → "Steps to increase visibility & unlock premium access" + "Learn More"; **Quick Access** grid — user-editable (pencil icon) — with "How it works"
- **Quick Access tiles**: Clients ("Manage your client list") · **Client Leads ("Accept new clients")** · Appointments ("View upcoming appointments") · Profile ("Edit your information") · Billing ("View earnings & invoices") · Availability ("Set your schedule")
- **Notes**: the dashboard shows no clinical or financial numbers at all — no today's-sessions list, no revenue figure, no outstanding-balance total, no risk flags. It is a launcher plus an upsell. The customisable Quick Access grid is a nice touch, but it is customising shortcuts rather than surfacing information.
- **Screenshot ref**: [ss_8819tl7wu](screenshots/provider/dashboard__alt__ss_8819tl7wu.png)

### Client Leads
- **Path**: Client Leads (`/requests`)
- **Primary purpose**: "Accept new client session requests"
- **Key UI elements**: search by client or service; Filter; status tabs **Pending (0) · Accepted (0) · Declined (0) · All (0)**; "Requests awaiting your response"; pagination
- **Notes / pain points**: empty on this account (as expected — the account is not a Preferred Provider), so **what a lead actually contains could not be observed**: unknown whether a provider sees presenting problem, urgency, fee, or risk indicators before accepting. There is no visible response-time SLA, no lead expiry, and no way to set acceptance criteria — a provider must manually watch this queue.
- **Screenshot ref**: [ss_8391n7cy7](screenshots/provider/leads__client-leads__ss_8391n7cy7.png)

### Mantra Premium / Preferred Provider
- **Path**: Mantra Premium (`/premium`)
- **Benefits stated**: **Access 2000+ Organizations** ("reach employees across leading organizations") · **Work on Your Terms** — "Offer services at **listed rates** — accept requests and **get paid monthly**" · **Premium Listing** ("featured as a verified preferred provider above basic members")
- **Gate**: 500-point provider score; this account 50/500; "Apply as Preferred Provider"
- **Notes / pain points**:
  - "Work on Your Terms" is the opposite of what it describes — services are offered **at listed rates** (platform-set), with **monthly** payment. The provider sets neither price nor payment cadence.
  - Payment monthly-in-arrears is a meaningful cash-flow term for a solo practitioner and is stated only in passing.
  - No rate card is visible anywhere in the portal, so a provider cannot see what the listed rates *are* before qualifying.
- **Screenshot ref**: [ss_4031whj60](screenshots/provider/premium__preferred-1__ss_4031whj60.png), [ss_2115au8kb](screenshots/provider/premium__preferred-2__ss_2115au8kb.png)

### Tasks
- **Path**: Tasks (`/tasks`) — "Track your daily wellness tasks & earn points"
- **Key UI elements**: service filter (All Services / Psychiatrist / OCD / General Physician); **Activity Stats** (1 Completed · 1/12 Overall · 50 Points); "Tasks to Boost Your Score" list with type/duration/points; "View More"; **"Your journey so far"** — a pathway log ("Mantra Growth Journey — Sep 9 2026 — 50 Points"); a modal on entry ("Complete Profile Verification", **MantraPartner** branding, "Start Activity")
- **Notes**: task items are videos and to-dos — i.e. **platform education and self-promotion, not clinical development**. No CE/CPD credit, no clinical competency, no supervision. The scoring rewards learning to sell on Mantra.
- **Screenshot ref**: [ss_3331g6bq8](screenshots/provider/tasks__ss_3331g6bq8.png)

### Marketing
- **Path**: Marketing (`/marketing`) — "Share your profile on your blog, website and social media to **boost your listing rank** and attract more clients."
- **Assets offered**: share profile on social media · **"Add certification from Mantra on your LinkedIn profile"** ("Build credibility with professional certifications") · **"Answer questions on Reddit and Quora"** · social icon for website/blog/portfolio · embeddable banner linking to the profile
- **Notes / pain points**:
  - The platform **enlists clinicians as its distribution channel** — asking them to seed Reddit and Quora and to embed banners, in exchange for listing rank.
  - "Add certification from Mantra on your LinkedIn profile… professional certifications" is worth flagging: a marketplace listing status is being presented as a professional credential. That is misleading on a clinician's public profile, and the phrasing invites it.
- **Screenshot ref**: (captured in text dump)

### Earnings
- **Path**: Mantra Earnings (`/earnings`) — "Track session earnings and payouts from Mantra clients."
- **Empty state**: "Start Your Earning Journey" with two doors — **Invite your Clients** ("Add your existing clients to manage appointments and track sessions on our platform" → Add Client) and **Get Clients from Mantra** ("Join our preferred provider network to receive client referrals from MantraCare" → Become a Preferred Provider); Pro Tip nudging bank & tax setup
- **Notes**: this screen is the clearest statement of the **dual business model** — bring your own book and pay for software, or take platform referrals at platform rates. Earnings only tracks the latter ("payouts from **Mantra** clients"), so a provider's own self-pay revenue lives in Billing while marketplace revenue lives here — two separate money surfaces with no consolidated view.
- **Screenshot ref**: [ss_0066i24h5](screenshots/provider/earnings__ss_0066i24h5.png)

### Bank & Tax
- **Path**: Bank & Tax (`/bank-tax`) — "Manage bank and tax details for Mantra payouts."
- **Tabs**: **Bank Info** (one account on file — an **Indian bank**, masked account number plus an **IFSC code**; identifiers [REDACTED]) · **Tax Info** ("No tax details added yet. Please add your tax details to proceed.")
- **Notes / pain points**: payouts settle to an **Indian bank account via IFSC**, and the referral rewards are denominated in **₹**, while the provider subscription is priced in **USD** and the invoice module defaults to **INR** with a ~150-currency picker. A single account therefore straddles three currency assumptions with no visible FX handling, and tax collection is India-shaped (IFSC/PAN-style) while the commercial packaging (claims, credentialing, CPT-less insurance billing) is US-shaped.
- **Screenshot ref**: (captured in text dump)

### Messages
- **Path**: Messages (`/chat`) — "Chats"
- **Key UI elements**: two-pane layout; conversation search; **Active | Inactive** tabs; empty state "Welcome to Chats — Select a conversation from the sidebar to start chatting, or wait for new messages to appear."
- **Notes / pain points**: no visible compose-new-conversation control — threads appear to be initiated from the client row's message icon or by the client. No templates/canned responses surfaced here (despite a `canned-response` route existing, which renders Resources instead). No file sharing, read receipts, or async-message SLA visible. "Wait for new messages to appear" suggests no push/notification path — consistent with Notifications being unbuilt.
- **Screenshot ref**: [ss_9513itupa](screenshots/provider/messages__ss_9513itupa.png)

### Refer and Earn
- **Path**: Refer and Earn (`/refer-earn`) — "Invite a Friend — Refer providers & clients to MantraCare"
- **Three referral programmes**:

| Tab | Offer | Mechanic | Payout form |
|---|---|---|---|
| **Refer a Client** | "**Give 5% off, Get ₹476**" | Invite → they complete first session → both earn → auto-credited to Mantra wallet | **Wallet credit only** — "Use wallet balance to buy any Mantra program" |
| **Refer a Provider** | "**Give ₹210, Get ₹210**" | Share code → they onboard and complete first session → both earn | **"Cash out instantly** or use credits" |
| **Refer a Corporate** | "**15–20% of the total contract value**" | Share an HR/stakeholder lead seeking EAP, emotional wellbeing, coaching or wellness → "Our team supports you in pitching and closing" | not stated; contact `provider@mantra.care` |

- **Refer-a-Client fields**: Refer Existing Client / Share Referral Link · Select Client (search name, email, phone) · **Recommend Program** (select a program) · **Send Recommendation** · "Your Referral Reward … INR 0"
- **Notes / pain points**:
  - **A clinician is offered a personal financial reward for recommending additional paid programmes to their own patients**, via a "Select Client → Recommend Program → Send Recommendation" flow built directly into the clinical portal. That is a straightforward conflict of interest: therapeutic recommendation and personal commission are the same button. Most professional codes (APA, BACP, NASW) treat undisclosed financial interest in a referral as an ethics breach. **Do not replicate this pattern.**
  - Client-referral rewards are **locked to the platform's own store**, while provider-referral rewards can be cashed out — the closed loop applies specifically to money earned off patients.
  - The corporate tab is a **15–20% sales commission** offered to clinicians, with MantraCare's team co-selling. This reveals the corporate/EAP channel as the commercially important one.
  - A fourth domain surfaces here: **`mantra.care`** (alongside `mantracare.com`, `mantracare.org`, and the MantraAssist / MantraPartner brands).
- **Screenshot ref**: [ss_47123uh6x](screenshots/provider/refer-earn__ss_47123uh6x.png)

---

## The full service taxonomy — 58 types

Captured from the Refer-a-Provider service selector. This is the platform's entire provider-type list, and it reframes what MantraCare is:

**Mental health & behavioural (12)**: Therapist/Psychologist · Psychiatrist · Addiction Specialist · OCD therapist · LGBTQ Therapist · Listener/Counsellor · Coach · Health Coach · Women Wellness Coach · Meditation/Mindfulness · Therapist Intern · ABA/Special Needs Child Therapist

**Physical medicine & allied (10)**: Physical Therapist · Physio Assistants · Nutritionist/Dietician · Yoga Instructor · Fitness Instructor · Speech Therapist · Occupational Therapist · Clinical Assessment · Seminar/Workshop/Training · General

**Medical specialties (21)**: Doctors · Endocrinologist · Gynecologist · Cardiologists · Orthopedician · ENT Specialist · Gastroenterologist · Pediatric · Sexologist · Dermatologist · Dentist · Neurologist · Oncologist · Ophthalmologist · Eye Specialist · Urologist · Nephrologist · Pulmonologist · Rheumatologist · Infertility Specialist · General Surgeon

**Non-clinical (3)**: **Legal Counsellor** · **Financial Wellbeing Advisor** · Corporate

**"AI" provider types (12)**: **AI Therapist** · AI OCD Coach · AI Diabetes Care Coach · AI Wellness Coach · AI Physio Coach · AI Addiction Recovery Coach · AI Fitness Coach · AI Women's Health Coach · **AI Doctor Assistant** · AI Nutrition Coach · AI Blood Pressure Coach · AI LGBTQ+ Support Coach

**Why this matters**
1. **MantraCare is a generalist whole-health marketplace wearing a mental-health face.** Oncology, dentistry, urology and cardiology sit in the same taxonomy as therapy. Depth in any one vertical is unlikely — and the clinical gaps found in Parts 1–2 (no structured risk assessment, no problem list, a broken formulary) are what that breadth costs.
2. **"AI Therapist" is a provider type in the same list as human clinicians** — twelve AI roles, including "AI Doctor Assistant". Presenting an AI as a bookable care provider alongside licensed professionals is a significant regulatory and ethical exposure, and it is the opposite of the careful framing in their own AI Consent Form ("AI is used only to support your provider — it does not make clinical decisions").
3. Legal Counsellor and Financial Wellbeing Advisor confirm the **EAP** orientation — employee assistance programmes bundle legal and financial support with counselling, which fits the 20K+ corporate clients and the 15–20% corporate commission.

---

## Features (part 3)

| Section | Feature | Sub-capability | Present? | Quality (1-5) | Notes |
|---|---|---|---|---|---|
| Dashboard | Home | Customisable quick-access grid | Yes | 4 | Editable shortcut tiles |
| Dashboard | Home | Action Center (pending items) | Yes | 3 | Collapsible; empty here |
| Dashboard | Home | Clinical or financial KPIs | **No** | 1 | No numbers at all — launcher + upsell |
| Leads | Queue | Accept / decline session requests | Yes | Unknown | Empty — gated by Preferred Provider status |
| Leads | Queue | Lead content (problem, urgency, fee) | Unknown | — | Not observable on a non-preferred account |
| Leads | Queue | Acceptance criteria / auto-rules / SLA / expiry | **No** | 1 | Manual queue watching |
| Marketplace | Preferred Provider | Referral access to 1M+ / 20K+ corporate | Yes | — | **Gated at 500 points** |
| Marketplace | Preferred Provider | Transparent scoring | **No** | **1** | Formula undisclosed; visible tasks cap at ~110 pts |
| Marketplace | Preferred Provider | Provider-set rates | **No** | 1 | "Listed rates", monthly payment |
| Marketplace | Preferred Provider | Visible rate card | **No** | 1 | Rates not shown pre-qualification |
| Marketplace | Tasks | Gamified onboarding + pathway log | Yes | 3 | Well built; content partly stale "(old)" |
| Marketplace | Tasks | Clinical CE/CPD or competency | **No** | 1 | Platform education only |
| Marketplace | Marketing | Shareable assets, badges, embeds | Yes | 3 | Providers as distribution channel |
| Marketplace | Marketing | "Certification" framing on LinkedIn | Yes | **1** | Listing status presented as a credential |
| Money | Earnings | Marketplace payout tracking | Yes | Unknown | Empty; separate from Billing |
| Money | Earnings | Consolidated view of all revenue | **No** | 1 | Self-pay in Billing, platform in Earnings |
| Money | Bank & Tax | Bank account for payouts | Yes | 3 | India-shaped (IFSC) |
| Money | Bank & Tax | Tax details | Yes | 3 | Empty on this account |
| Money | Currency | Coherent single currency model | **No** | 1 | USD plans · INR invoices · ₹ rewards |
| Comms | Messages | 1:1 client chat, active/inactive | Yes | 2 | No compose, no templates, no attachments seen |
| Comms | Messages | Notifications / push | **No** | 1 | "Wait for new messages to appear" |
| Referral | Refer a Client | 5% off / ₹476 reward | Yes | **1** | **Clinician commissioned on own patients** |
| Referral | Refer a Provider | ₹210 / ₹210, cash-out | Yes | 3 | Standard two-sided referral |
| Referral | Refer a Corporate | 15–20% of contract value | Yes | 3 | Clinicians as enterprise sales channel |
| Referral | Wallet | Closed-loop store credit | Yes | 2 | Client-referral rewards spendable only on Mantra |

---

## Business-model synthesis

MantraCare runs **three businesses through one provider portal**:

1. **Practice software (SaaS)** — USD $0/$49/$99/$149 per month, credit-metered EHR tools, caseload caps of 10/50/unlimited. This is what a provider actually gets on signing up.
2. **A referral marketplace** — demand from 1M+ individuals and 20K+ corporate clients, rationed by an opaque 500-point provider score, sold at platform-set rates with monthly payout. This is what providers sign up *for*.
3. **A corporate/EAP sales channel** — 2000+ organisations, 15–20% contract commissions paid to whoever brings a lead, with 58 service types spanning legal and financial advice as well as medicine.

The provider is simultaneously the customer (paying subscription), the supply (accepting platform-rate work), and the sales force (Reddit/Quora posts, LinkedIn badges, corporate lead-gen, client and provider referrals). The clinical tooling quality documented in Parts 1–2 is consistent with a company whose engineering attention is on the marketplace and the meter rather than the chart.

**What to take for your own build**
- **Copy**: the 26-template note library, the credit-metering model with per-tool caps, the consent copy, the unbilled-sessions work queue, the enforced session↔invoice linkage, retroactive session logging, ~108-language notes.
- **Fix**: structured risk assessment with enforced follow-up, a real problem/medication list on the client record, licensed drug data, CPT/ICD on the billing path, note sign/lock/amendment trail, no-show state, notification preferences.
- **Avoid**: commissioning clinicians on their own patients' purchases, opaque access scoring, "AI Therapist" as a peer provider type, listing status framed as certification, and caseload caps as the primary monetisation lever.

---

## Phase 2 FINAL status block

- **Sections complete**: Clients · client record · Session Notes + editor · AI Transcriber · AI CRM · Resources · Forms · Appointments · Scheduling/Settings · Subscription & pricing · Billing/Insurance/Claims/Invoicing · Prescriptions · Dashboard · Client Leads · Premium · Tasks · Marketing · Earnings · Bank & Tax · Messages · Refer and Earn
- **Screens captured**: 30 provider screens across 3 parts
- **Features identified**: 112 cumulative
- **Integrations noted**: 18
- **Data fields catalogued**: 76+
- **Defects logged**: 12 — the critical drug-formulary error, plus the unreachable point gate, `/dashboard` 404, stale "(old)" production tasks, clipped unsubmittable modal, Escape-doesn't-close dropdowns, duplicate record ID, "View" opening an editor, three names for one modality, session/line-item duration mismatch, annual-Free "0 credits", horizontally-hidden credit cards
- **Route/label mismatches found**: `/tools/canned-response` → Resources · `/tools/prescription` (singular) · `/schedule` 404 · `/custom-forms/create` 404 · `/dashboard` 404
- **Brands/domains in play**: mantracare.com · **mantracare.org** · **mantra.care** · MantraAssist · MantraPartner
- **Blocking questions**: none

### Next
Phase 8's assessment estate on `app.mantracare.org` (you approved this), then Phases 3–7 on the client-side app, booking funnel, pricing and corporate lane.

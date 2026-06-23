# Vendor Mockup Audit — `sadaywellness.salmanarshad321.workers.dev`

**Scanned:** 2026-06-12 · **Type:** Live, clickable HTML/Vue prototype (not a flat mockup)
**Files pulled locally:** `home.html`, `client.html` + `client.js`, `admin.html` + `admin.js`, `styles.css` (+ `icons.js` referenced)
**Build:** Vue 3.4.27 (prod CDN), no build step, simulated data, hosted on Cloudflare Workers
**Tagline:** *"Two surfaces. One quiet system."*

> **Headline finding:** This is the most blueprint-aligned artifact any vendor has produced — it adopts our exact stack and most of our architecture. But it is a mockup of the **full V1-complete / V1.5 vision**, not the ₹1L descoped MVP brief, and it diverges from three *locked* spec decisions (5 tracks, C-SSRS, 18+-self-only) and abandons the Saday brand colour entirely.

---

## 1. Screen inventory & flows

**Landing → entry split (`home.html`):** two cards → `client.html` (patient) and `admin.html` (clinician/admin).

### Patient app (`client.js`)
- **Landing:** hero → *Seven care tracks* grid → *four-part approach* → *For family* → *trust strip* → footer (with always-visible crisis line).
- **7-step adaptive intake** (modal): (1) language → (2) who is this for [self / proxy] → (3) age band + gender → (4) symptom clusters (adaptive: 16 self vs 15 proxy) → (5) PHQ-9 (gated on "sad") → (6) **ASQ 4-item safety screen** → (7) contact + preferred professional.
- **Triage result:** human-readable "you're a fit for Track N", provisional, clinician-confirmed, episode id assigned, reassessment cadence shown.
- **Booking:** MHP cards (price/tags/bio) → day picker → slot grid → fee summary → consent checkbox → "Confirm with Razorpay".
- **Patient portal** (sidebar): Overview (KPIs, next session, recent activity, mood, assessments, materials, crisis card) · Sessions (upcoming/past/packs) · Assessments (immutable history table) · Mood log · Materials · Safety plan · Family access (3-tier) · Messages (WhatsApp) · Billing (GST invoices) · Settings (incl. export/delete data, 2FA).

### Admin console (`admin.js`)
- **Dashboard:** KPIs (142 active episodes, sessions today, triage queue, ₹2.14L revenue), triage top-4, week sessions chart, today's schedule, care-track mix, **platform health** (Razorpay/MSG91/Daily.co/Supabase-Mumbai uptime).
- **Triage queue:** SLA timers per row, critical/urgent/normal filters.
- **Calendar:** week grid, 4 clinicians, colour-coded by track.
- **Messages:** WhatsApp inbox + template compose (MSG91).
- **Patients list → detail:** Overview · **SOAP notes (Sign & lock + version history)** · Assessments (trajectory + item-level) · Safety plan · Informants (3-tier) · **Audit** (per-patient).
- **Assessment library:** 16 versioned tools.
- **Outcomes:** cohort PHQ-9 change ("the moat").
- **Safety log:** every flag/escalation/SLA.
- **Clinicians, Earnings ledger, Materials, Audit log, Settings** (org, cancellation policy, integrations, compliance).

---

## 2. Design system — exact tokens (`styles.css`)

> **Major brand departure:** the vendor dropped Saday's purple entirely for a **sage-green + warm-paper + serif** identity. Calm, premium, almost literary. This is a deliberate rebrand, not a refinement of the current site.

```css
/* Neutrals / paper */
--ink:#0f1410; --ink-2:#2a322d; --muted:#6b7570; --muted-2:#9aa19c;
--paper:#fbfaf6; --paper-2:#f3f1ea; --paper-3:#eeeae0;
--line:#e5e2d8; --line-2:#d8d3c5;
/* Brand accent — forest/sage green */
--accent:#2d4a3e; --accent-2:#3d6452; --accent-soft:#e7ede9;
/* Warm + semantic */
--warm:#c9b489; --warm-soft:#f3ecdb;
--rose:#a85a4a; --rose-soft:#f4e3df;   /* danger/crisis */
--amber:#b88634; --amber-soft:#f6ead2; /* caution */
--blue:#37618a; --blue-soft:#e3ecf3;
/* Radius + shadow */
--r-sm:6px; --r:10px; --r-lg:16px; --r-xl:22px;
--shadow-sm/-/-lg defined; pill = 999px
```

**Care-track colours (7):** T1 blue `#37618a` · T2 green `#2d4a3e` · T3 amber `#b88634` · T4 orange `#ea580c` · T5 violet `#7c3aed` · T6 cyan `#0891b2` · T7 rose `#a85a4a`.

**Typography:** Fraunces (serif display, 400/500/600 — all headings, prices, numerals) + Inter (body/UI) + JetBrains Mono (timestamps, ids). Base `14.5px / 1.55`. Display hero `64px`, section titles `38px`, all serif with `-.02em` tracking. Buttons are pill-shaped, `14px`, weight 500.

**Layout:** container `1280px`, `28px` gutters. Consistent `80px` section padding (disciplined — unlike the current Odoo site). Mobile-first with thorough breakpoints (360/760/900/1100/1200).

**Components:** buttons (primary/ghost/soft/link/danger, 3 sizes) · fields/inputs with focus ring · cards/tiles · pills (accent/warm/rose/blue/amber + dot) · track-pills · avatars · gauges (conic-gradient) · mood bar chart · KPI tiles · SOAP editor · calendar grid · WhatsApp bubbles · tables. Subtle `fade` transitions only — no gratuitous motion (lives up to "quiet system").

---

## 3. Clinical content (verbatim highlights)

**Symptom clusters — self (16):** sad, anxiety, mood swings (bipolar), focus/ADHD, substance, trauma, OCD, psychosis `[red flag]`, cognitive/memory, eating, relationship/identity (BPD), burnout, sleep, sexual `[private]`, "something else", "not sure". **Proxy (15):** memory loss, delirium `[red flag]`, focus, autism, dev-delay, behaviour, psychosis `[red flag]`, mania, severe depression, BPD traits, substance, OCD, dissociative, "something else", "not sure".

**Safety screen = ASQ (4 items, never skippable), verbatim:**
1. "In the past few weeks, have you wished you were dead?"
2. "In the past few weeks, have you felt that you or your family would be better off if you were dead?"
3. "In the past week, have you been having thoughts of killing yourself?"
4. "Have you ever tried to kill yourself?" (No / Yes / Rather not say)
→ Any yes on Q1–3 fires a crisis banner + helplines and routes to **Track 7 (not for online)**.

**Assessment library (16, with versions):** PHQ-9 v2.1, PHQ-2, GAD-7 v1.3, GAD-2, GDS-15 (60+), MDQ, ASRS-v1.1, AUDIT, PCL-5, **ASQ v1.0**, PSS-10, ISI, SCOFF, AD8 informant (beta), IIEF-5 (pending), FSFI (pending). Marketed as "30 validated tools, free."

**Crisis lines (used throughout):** iCall/TISS `9152987821` · Vandrevala `1860-2662-345` (24×7) · India emergency `112`.

**Triage logic (from code):** red-flag clusters or ASQ-positive → T7; substance → T4; sexual → T5; proxy → T6; mood/BPD → T3; else mild → T1/T2. Explicitly **"provisional suggestion — clinician confirms at/after first session."** Reassessment at **weeks 0/2/4/8/12**. Red-flag SLA shown as **2h**.

**Pricing (display):** psychiatrist ₹1,800 · psychologist ₹1,400 · geriatric ₹1,600 · counsellor 30-min ₹600 (all "/50-min session"). 8-session pack ₹13,200. Ledger shows gross / PG / GST+TDS / net.

---

## 4. Tech & compliance signals

Named in the prototype (matches our blueprint stack 1:1): **Supabase ap-south-1 (Mumbai)**, **Razorpay** (webhook-reconciled, GST), **MSG91 WhatsApp** (12 templates), **Daily.co** video, **Sentry**. Compliance surfaces: append-only **audit log "DPDP §8(5)"**, **2FA enforced** for staff, **data residency Mumbai**, **DPA — Anthropic: Signed**, export/delete-my-data (DSR), SOAP **Sign & lock + version history**, episode-of-care ids (`EOC-####`). Whoever built this has read the master blueprint closely.

---

## 5. Map to our locked plan — alignments vs divergences

### ✅ Aligns with our specs
- **Stack** — Supabase Mumbai, Razorpay, MSG91, Daily.co, Sentry: exact match.
- **Episode-of-care** model, **SOAP sign-lock + versioning** (MHA §24 addendum posture), **append-only audit**, **2FA**, **DPDP framing**, **data residency**, **vendor DPA registry** (B10).
- **Provisional triage, clinician-confirmed** — matches our routing philosophy.
- **2h red-flag SLA** — matches intake-spec **D5**.
- **Mood log: "therapist sees the trend, never the day-by-day"** — privacy-thoughtful.
- Reassessment cadence, immutable assessment history, outcomes-as-moat.

### ⚠️ Diverges from *locked* decisions — decisions required
| # | Mockup | Our locked spec | Note |
|---|---|---|---|
| 1 | **7 care tracks** (adds Sexual health, Proxy/Caregiver, Not-for-online as separate tracks) | **5 tracks T1–T5** (T5 = crisis) | The mockup even **contradicts itself** — the trust strip reads "5 care tracks, honestly defined" while the page renders 7. Pick one. |
| 2 | **ASQ** 4-item safety screen; C-SSRS absent | **C-SSRS** items 1–2 universal + 3–6 gated (**D2**) | Same ASQ swap as the ₹1L dev brief. Clinically defensible — but two+ docs now disagree. Lock it. |
| 3 | **Full proxy + paediatric/geriatric** incl. a "14yo, proxy consent flow needed" queue item and guardian-consent copy | **18+ self-only; proxy + minors deferred to V1.5+** (**D6**) | Biggest scope/compliance divergence. The mockup ships the exact pathway we deferred. |
| 4 | **Sage-green + Fraunces serif**, no purple | Current brand = purple `#8C68CD` + tree + Darker Grotesque | A full rebrand. Premium and calm, but discards existing brand equity. Pure product decision. |
| 5 | **Full feature set** — earnings ledger, outcomes, 16-tool library, 3-tier informants, messages, materials | ₹1L dev brief **descoped all of these** | This is a **V1-complete / V1.5 vision**, not the ₹1L MVP. Mismatch in scope, cost, and timeline. |

---

## 6. Verdict

**Carry over / steal:**
- The **information architecture** of both apps is excellent and closely matches our entity model — triage queue, episode-of-care, SOAP sign-lock, audit tab, outcomes, safety log. This is a strong reference build for the admin console specifically.
- **Disciplined design system** — one spacing scale, restrained motion, consistent components. Far ahead of the current Odoo site's execution.
- The **"quiet" editorial tone** (Fraunces serif, sage green, lots of paper) is genuinely well-suited to mental health and worth serious consideration as the rebrand direction.
- Human-readable triage result, mood-trend-not-day-by-day, always-on crisis line — thoughtful clinical UX.

**Reject / fix before treating as the build target:**
- It is **not scoped to ₹1L.** Taking this as the spec re-inflates to the full blueprint (ledger, outcomes, informant tiers, 16 tools, messaging). Decide explicitly whether you're buying the *vision* or the *MVP*.
- **Resolve the three locked-spec conflicts** (7-vs-5 tracks, ASQ-vs-C-SSRS, proxy/minors-vs-18+-self-only) before any developer treats this as truth — and fix the mockup's internal 5-vs-7 contradiction.
- The **brand pivot** (purple → sage) needs a conscious yes/no; don't let it happen by default just because the mockup is polished.

**Bottom line:** the strongest vendor artifact so far and a near-perfect *reference* for the admin/clinician surface — but it depicts the full-vision product on a rebranded palette, so it must be reconciled against both the ₹1L scope and the locked clinical decisions before it can drive a build.

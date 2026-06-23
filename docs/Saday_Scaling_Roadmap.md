# Saday Wellness — Scaling Roadmap

**From a thin, verifiable core → the ₹1L product → the full OG blueprint.**
Author context: solo build, agentic codegen, founder is a **psychiatrist-CTO + frontend dev**.
Dated 2026-06-12. Effort is in **calendar weeks at ~20–25 hrs/week part-time**. v0.1 — living doc.

---

## 0. How to read this

The build is staged **risk-ascending**, not feature-descending. The rule is simple:

> **Build only what you can personally verify is safe. Prove it with real patients. Then let agents expand the surface — fastest where it's lowest-risk.**

That gives three stages on top of a foundation:

| Stage | Name | One-line goal | Patients? |
|---|---|---|---|
| **M** | **Marketing Site** | Get off Odoo — content-complete static landing | No (info only) |
| **P0** | Foundation | Decisions locked + infra + auth skeleton | No |
| **P1** | **Thin Safe Core** | Smallest surface a real patient can safely use | **Yes — pilot** |
| **P2** | **Product MVP (≈₹1L scope)** | A sellable product with differentiators | Yes — paid |
| **P3** | **Full OG Blueprint** | The V1.5/V2 vision + the data moat | Yes — at scale |

> **Phase M runs first and is fully decoupled from P0–P3.** It's pure 🟢 frontend (no PHI, no auth, no RLS) — your wheelhouse — so it can ship while the app decisions are still being locked. The Odoo expiry sets its deadline.

Each stage has a **hard exit gate**. You do not start the next stage until the gate passes. The gate is what keeps a solo build from quietly shipping an unsafe PHI surface.

---

## 1. Founder-leverage map (who does what)

Be honest about where your hands help and where they don't.

| Lane | What | Your role | Agentic leverage |
|---|---|---|---|
| 🟢 **You own it** | Frontend, component system, intake UX, accessibility, EN/HI i18n, design system, patient-app polish, clinical-logic *correctness* (you're the psychiatrist) | **Lead.** This is your edge. | High — agents scaffold, you direct & finish |
| 🟡 **Agents draft, you verify carefully** | RLS policies, auth, payments/webhooks, audit log, SOAP record integrity, API routes, migrations | **Reviewer-in-chief.** Read every line of the security-critical code. Ideally buy one external security review at the P1 and P3 gates. | High to write, **but verification is the bottleneck** |
| 🔴 **Uncompressible — calendar, not code** | Meta/MSG91 WhatsApp template approval, Razorpay live KYC, pen-test, clinical sign-off, DPDP/medico-legal review | **Start early, run in parallel** (see §6). Agents give ~0 leverage here. | None |

**Key consequence:** your scarce resource is not typing (agents cover that) — it's *review time on 🟡 code* and *wall-clock on 🔴 items*. Stage the build so you never have more unverified security surface than you can personally hold in your head at once.

---

## M. Marketing Site & Content Migration  ·  ~1–2 weeks  ·  **do this first**

**Goal:** a content-complete, on-brand **static** marketing site live on `sadaywellness.com` **before the Odoo subscription lapses**, so no content or SEO is lost in the gap. No accounts, no database, no PHI — it's brochure-ware. This de-risks the deadline and gives you a real domain presence while the app is built behind it.

**Why first:** urgent (Odoo clock), **zero security surface** (nothing to verify — pure 🟢), ships independently of every app decision, and you already have the inputs.

**Inputs already in hand:**
- `vendor-mockup-scan/` is the *app* reference — **not** used here.
- The **sadaywellness.com content audit** (home sections, 8 team bios, services copy, testimonial, stats, contact, pricing) — verbatim, ready to drop in.
- `mockups/saday-home.html` — a **modernized homepage already built** from that content. Extend its design system to the rest of the pages.

**Pages to ship (content carried from the live site):**
- **Home** — hero, intro, "Why?" (1-in-10 stat), "What sets us apart", services preview, stats band (8 pros · 12+ workshops · 15,000+ consultations · 10,000+ hrs), testimonial, CTA, footer. *(done in mockup — needs real photos)*
- **About / Team** — 8 real bios (Dr. Aditya Agrawal, Mr. Vikrant Patel, Dr. Kritika Chawla, Dr. Shivangini Singh, Ms. Haifa Ainbosi, Mr. Vinayak Katyayan, Ms. Manjishtha Datta, +1).
- **Services** — 8 services + 2 programs. ⚠️ The **Support Groups** card on the live site is still Odoo lorem-ipsum — write real copy.
- **Contact** — phone `+91 92352 93990`, email, Lucknow address, + a contact form (use a no-backend form service: Formspree/Web3Forms/Cloudflare Pages Forms).
- **Privacy + Terms** — ⚠️ **must be written from scratch.** The live `/terms` is the raw Odoo placeholder and `/privacy` 404s. A mental-health brand cannot ship lorem-ipsum legal pages — get real ones before cutover.

**⚠️ The hard part — what dies with Odoo:** the live site's **shop / course sales / membership subscriptions** (Psycho Silver/Gold/Platinum, course purchases) run on Odoo's **eCommerce + eLearning + Appointments** modules. A static landing rebuilds in days; an online store + recurring billing does **not**. **This is a decision, not a default** — see open question below.

**Booking CTA during the gap:** the site's "Consult Now" should keep pointing to your **existing external booking** (Tealfeed / Swasthmind) until P1's native booking exists. Swap the link later — no rebuild.

**Hosting/cutover:** deploy to **Cloudflare Pages** (aligns with the blueprint's Cloudflare edge; you already use `workers.dev`). Point `sadaywellness.com` DNS at it. Export any Odoo data you want to keep (course PDFs, images, customer/contact lists) **before** the subscription lapses — that export is itself an uncompressible deadline item.

**🟢 You own:** all of it. This is the phase where your frontend skills are the *whole* job.

**Exit gate M → P0:**
- ✅ All pages live on the real domain, content migrated, **real Privacy + Terms** published.
- ✅ Contact form delivering; booking CTA pointing somewhere valid.
- ✅ Odoo data exported and archived.
- ✅ Odoo subscription can be safely cancelled.

---

## 2. P0 — Foundation  ·  ~1 week

**Goal:** every downstream decision is locked and the infra exists. No product yet.

**Decisions to lock first (baked into the schema — can't be changed cheaply later):**
1. Safety screen — ASQ vs C-SSRS (intake-spec D2)
2. Proxy/age — 18+ self-only for P1 (proxy returns in P2)
3. Admin vs clinical notes — B6 RLS-deny (yes/no)
4. Audit — append-only + DB-revoke UPDATE/DELETE (Merkle deferred to P3)
5. PHI encryption — disk+RLS for P1, pgcrypto/Vault deferred to P3
6. **Brand — purple (current) vs sage (vendor mockup)** — gates all frontend (see §7)

**Build:**
- Supabase project in `ap-south-1 (Mumbai)`, RLS-default-deny on
- GitHub repo, Next.js 14 + TS + Tailwind scaffold, CI
- Auth skeleton: Supabase Auth + `auth_user_id` bridge + `current_user_id()` helper
- The design-token layer (from whichever brand you pick) + base component library

**🟢 You:** scaffold, tokens, component primitives (buttons, inputs, card, modal, nav).
**🟡 Verify:** the auth bridge + the RLS-default posture.

**Exit gate P0 → P1:** repo runs, a logged-in test user resolves through `current_user_id()`, and a non-owner SELECT returns **zero rows** (default-deny proven).

---

## 3. P1 — Thin Safe Core  ·  ~3–5 weeks  ·  **the verification floor**

**Goal:** the smallest possible app a real patient can use **safely**. Pilot with a handful of consenting patients (free or token fee). This is where you spend most of your review budget.

**Ships (patient can do end-to-end):**
- Sign up (patient email-OTP) with a **hard 18+ gate**; doctor/admin sign in with **TOTP**
- Short **self-only** adaptive intake
- **Safety screen** (ASQ/C-SSRS) → never skippable → positive routes to **crisis resources + helplines + a flag** (no auto-book)
- **PHQ-9 + GAD-7** (gated by intake), versioned, **immutable submissions**
- Book a doctor → slot → **Razorpay** → confirmation
- **Jitsi** video consult (**lobby + password**)
- Doctor writes a **SOAP note → sign & lock**, with **B6 (admin cannot read note body, RLS-enforced)**
- **Signed-PDF prescription** (letterhead + signature image; not IT-Act e-sign)
- **Append-only audit log** (UPDATE/DELETE revoked at DB grant level)
- DSR: **export / delete my data**
- WhatsApp/SMS appointment confirmations (or email fallback until templates clear — see §6)
- EN + HI, mobile-first

**Explicitly NOT in P1:** tracks/routing engine · proxy/caregiver · care-plan PDF · mood logs · any tool beyond PHQ-9/GAD-7 · ledger · outcomes · messaging · materials · Vault column-crypto · Merkle audit.

**🟢 You own:** the entire patient app + intake UX + SOAP editor UI + i18n + the design system in anger. This is ~60% of P1 and it's your wheelhouse.
**🟡 Agents draft, you verify line-by-line:** RLS across every table, auth/TOTP, Razorpay order+webhook, audit grants, the immutable-submission + sign-lock invariants, B6 deny.

**Exit gate P1 → P2 (the big one):**
- ✅ **RLS attack-test suite passes** — cross-patient read/write blocked; admin SELECT on `session_notes` body = 0 rows; signed note is immutable; audit row UPDATE/DELETE rejected.
- ✅ A **real Razorpay payment** flows test→live and reconciles.
- ✅ Safety-screen positive path reviewed by you (clinical) end-to-end.
- ✅ **One external security review** of the 🟡 surface (worth the spend here).
- ✅ 3–5 pilot patients complete a full intake→booking→consult→note→prescription loop without a safety or privacy defect.

**If this gate doesn't pass, nothing else matters.** Do not build P2 on an unverified core.

---

## 4. P2 — Product MVP (≈ ₹1L scope)  ·  ~3–4 weeks on top

**Goal:** turn the safe core into a *sellable product* by adding the differentiators the ₹1L brief carried — but now on a foundation you've already proven safe.

**Adds:**
- **Care-plan PDF** (the ₹1L differentiator)
- **Proxy / caregiver — adult-for-adult only** (18+ patient; minors still excluded). Consent-capture flow. *This is the one re-expansion of liability — gate it with its own consent + RLS review.*
- Richer intake (more of the 8 clusters; still severity-aware but no full track engine)
- Cancellation/refund policy surfaced (manual refund via Razorpay dashboard)
- Basic patient portal: upcoming/past sessions, receipts, their assessment history
- WhatsApp **two-way** (if templates approved) or richer notifications
- Consent ledger (granular, versioned) — DPDP B2
- Light admin: patient list, today's schedule, triage flag review queue

**Still NOT in P2:** 5/7-track routing engine · full 12-tool library · earnings ledger/payouts · outcomes dashboard · 3-tier informant system · in-app messaging at scale · Vault column-crypto · Merkle audit.

**🟢 You own:** care-plan PDF UI, portal screens, proxy consent UX, admin list views — heavily frontend, high agentic leverage.
**🟡 Verify:** the proxy consent + access-control rules (new liability), refund handling, consent-ledger integrity.

**Exit gate P2 → P3:**
- ✅ Proxy access-control attack-tested (a proxy cannot exceed granted scope; cannot act for a minor).
- ✅ Paying patients running through it; refund + cancellation working manually.
- ✅ DPDP posture reviewed (consent ledger + DSR) — informal legal read at minimum.
- ✅ Demand signal real (you're acquiring patients, not just shipping features).

---

## 5. P3 — Full OG Blueprint  ·  ~3–4 months on top  ·  the moat

**Goal:** the V1.5/V2 system — the 34-table model, the data moat, multi-clinician operations. Built surface-by-surface because each addition is now low-risk on a proven base, and these are the parts agents do *best*.

**Adds, in roughly this order (each its own mini-gate):**
1. **Full 12-tool assessment library** — versioned per (tool, version, language), scoring as pure functions. *Highest agentic leverage, lowest risk — great momentum builder.*
2. **Care-track engine** — 5 tracks T1–T5, severity-wins routing, primary-concern tiebreak (intake-spec D1/D4). Decide 5 vs the vendor's 7 first.
3. **Outcomes dashboard** — longitudinal cohort change, episode-of-care linked. The moat.
4. **Earnings ledger + payouts** — Razorpay-reconciled, GST/TDS, per-clinician.
5. **3-tier informant system** (observation / collateral / caregiver) — supersedes the P2 adult-proxy with the full model; **re-opens the paediatric/minor question — only with ML + parental-consent artifact (per CLAUDE.md)**.
6. **Hardened compliance:** pgcrypto/Vault column encryption (DM5), per-row sha256 + **weekly Merkle anchor to S3** (B4), pg_partman audit partitioning, pg_cron jobs.
7. **Ops surface:** clinician onboarding/KYC, materials library, in-app + WhatsApp messaging at scale, calendar, platform-health monitoring.
8. **Daily.co** video (upgrade from Jitsi) with server-minted signed URLs.

**🟢 You own:** every dashboard, the admin console (the vendor mockup is your reference IA), the materials/messaging UI, the outcomes visualizations.
**🟡 Verify:** the crypto/Vault migration, Merkle audit, payout money-movement, informant access tiers. **Buy a second external security/pen-test at the P3 gate.**

**Exit gate (launch-grade):** pen-test passed · clinical sign-off · DPDP/medico-legal review complete · MSG91/Meta templates live · backup/restore verified · Merkle anchor verifiable.

---

## 6. The parallel track — start these on Day 1 (§ uncompressibles)

These run *alongside* P0–P3 because they're calendar, not code. Starting them late is the most common way a solo build slips months.

| Item | Start | Lead time | Blocks |
|---|---|---|---|
| MSG91 + Meta WhatsApp template approval | P0 | weeks | rich notifications (P1/P2) |
| Razorpay live KYC + activation | P0 | days–weeks | live payments (P1 gate) |
| Clinical sign-off on intake + safety copy | P0 | ongoing | P1 gate |
| DPDP / medico-legal review | P2 | weeks | P2/P3 gates |
| External security review #1 | end of P1 | ~1–2 wks | P1 gate |
| Pen-test #2 | end of P3 | ~2 wks | launch |

---

## 7. Open decision that gates frontend: brand

You have two real directions on the table and frontend can't truly start until this is picked:
- **Purple (current Saday)** — `#8C68CD` family + tree logo + Darker Grotesque. Existing equity; warm. (See `mockups/saday-home.html`.)
- **Sage + serif (vendor mockup)** — forest green `#2d4a3e` + Fraunces serif + warm paper. More premium/clinical-calm; discards equity. (See `vendor-mockup-scan/`.)

Pick one (or a synthesis) before P0 closes. Everything in 🟢 inherits from it.

---

## 8. Timeline at a glance

```
M  Marketing Site    ~1–2 wks  ██    ← DO FIRST · off Odoo · deadline-driven · pure frontend
P0 Foundation        ~1 wk     [decisions + infra + auth]
P1 Thin Safe Core    ~3–5 wks  ████  ← pilot patients, security review #1   ← THE gate
P2 Product MVP       ~3–4 wks  ███   ← paying patients, ≈₹1L scope
P3 OG Blueprint      ~3–4 mo   ████████████  ← moat, hardening, pen-test
                               ─────────────────────────────────────
Phase M is independent — it can finish before P0 even starts.
Total to OG-complete ≈ 5–7 months part-time (agentic, solo) + Phase M up front
```

Agentic speed moves you toward the *fast* end of each band and lets a solo dev attempt the whole arc — it does **not** break the floor set by the 🔴 uncompressibles. "Two weeks" is a prototype slice (mock data, no compliance), not this.

---

## 9. Success metric per stage (so you know you're done, not just busy)

- **P1:** a stranger can go intake → consult → signed note → prescription, and you can *prove* no cross-patient leak. *Safety, demonstrated.*
- **P2:** patients pay, come back, and refer. *Product-market fit signal.*
- **P3:** you can show outcome data (e.g. mean PHQ-9 drop over an episode) across a cohort. *The moat exists.*

---

### Source anchors
`docs/intake-spec.md` (D1–D8) · `docs/data-model.md` (DM/B-series) · `Saday_MVP_Developer_Brief_v1.1.md` (₹1L scope) · `docs/Saday_Solo_Agentic_Build_Estimate.html` (effort basis) · `vendor-mockup-scan/AUDIT.md` (admin-IA reference) · `mockups/saday-home.html` (purple brand option).

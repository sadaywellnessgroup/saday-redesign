# MantraCare — Phases 4–5: consumer pricing & the funnel

**Scanned**: 2026-09-13 · **Source**: `web.mantracare.com/plans/*` (client-rendered SPA — requires a real browser)
**Currencies captured**: India (₹) and United States ($), via the page's own country selector

> Note on method: these pages serve an empty "Please wait.." shell to any non-JavaScript fetcher. Everything below was read from the rendered page.

---

## Headline: the same product is priced ~4× to ~8× higher in the US

The plan pages carry a **country selector** that re-prices everything. Defaults come from geo-IP and **reset on every navigation** — the selection does not persist page to page (a UX defect, and a reason a user can see different prices than they expect).

| Service | India | United States | Approx. US multiple* |
|---|---|---|---|
| Therapy — list per session | ₹1,470 | **$70** | ~4× |
| Therapy — first-week trial | ₹740 | **$35** | ~4× |
| Couples therapy — list | ₹2,210 | not captured | — |
| Couples therapy — trial | ₹1,100 | not captured | — |
| Therapy (chat) — list / trial | ₹860 / ₹430 | not captured | — |
| Psychiatry — initial evaluation | ₹2,090 | **$199** | **~8×** |
| Psychological assessment (each) | ₹6,280 | not captured | — |
| Therapy Intern — list / trial | ₹530 / ₹260 | not captured | — |

\* Using a rough ₹85–90/USD; treat as indicative, not exact.

Psychiatry carries roughly double the geo-multiple of therapy. Worth noting that the supply is explicitly shared — both pages say "Choose from **15000+** / **5000+** Providers **from India & the world**" — so a US buyer at $199 and an Indian buyer at ₹2,090 may be matched from overlapping provider pools.

---

## Therapy — full price ladder (US, Individual, Live)

| Term | Price | Sessions | Per session | Discount | Billing |
|---|---|---|---|---|---|
| **Trial offer** | **$35** | 1 video session | $35 (list $70) | intro | first week only |
| **1 Month** | **$252** | 4 video sessions | **$63** | Save 10% | Monthly — cancel anytime |
| **3 Months** ★ *Most chosen* | **$672** | 12 video sessions | **$56** | Save 20% | Quarterly |
| **6 Months** | **$1,277** | 24 video sessions | **$53.20** | Save 24% | Half-yearly |

**What's included** (1 Month tier and above):
4 Therapy Video/Audio Sessions (60 mins) · Daily Chat Responses by Therapist · **1 Mind Body Yoga Session** · 4 Listener Sessions · **Group Sessions & Classes** · Personalized Recovery Pathway · **40+ Psychological Assessments** · Unlimited Guided Meditations & Self Care Tools · Switch Providers if the fit isn't right · Pay Every Month – Cancel Anytime

The trial tier drops the yoga session, group classes and the 40+ assessments — so the weekly trial is deliberately thinner than the plan it converts into.

### Variants (India prices, showing the product matrix)
| Variant | List | Trial | Notes |
|---|---|---|---|
| Individual · **Live** | ₹1,470 | ₹740 | 60-min video/audio + daily chat + 1 listener session |
| Individual · **Chat** | ₹860 | ₹430 | 60-min *chat* session; otherwise same bundle |
| Couple · **Live** | ₹2,210 | ₹1,100 | Couples session + **group and personal chat with the couples therapist** + relationship pathway |

Note the **"Listener Session"** appearing in every bundle — an unlicensed peer-support tier bundled alongside licensed therapy, corresponding to "Listener/Counselor" in the 58-type provider taxonomy.

---

## Psychiatry — package ladder (US)

| Package | Sessions | Per session | Package total |
|---|---|---|---|
| Initial Evaluation | 1 | **$199** | $199 |
| Initial Evaluation **+ 1 Follow Up** | 2 | **$178.50** | $357 |
| Initial Evaluation **+ 3 Follow Ups** | 4 | **$169** | $676 |

Inclusions escalate: comprehensive psychiatric evaluation · follow-up consultations · detailed diagnosis and treatment plan · **"Medication review and prescription (if needed)"** · personalised care recommendations · confidential video sessions.

**This connects directly to the Part 2 safety finding.** MantraCare sells prescribing as a paid, packaged service at $169–199 a session — and the prescribing tool its psychiatrists use contains a **systematically incorrect drug formulary**. The commercial promise and the clinical tooling are badly out of step.

---

## Psychological Assessment — the paid instruments, priced

**₹6,280 per assessment**, each delivered as **1 video session**. Two tabs: **Clinical | Psychometric**.

Clinical instruments offered: **HAM-A · HAM-D · YBOCS · TAT · MCMI · ADHD · DAPT · Gender Dysphoria · PANSS** — exactly matching the 12 paid assessments in the provider portal's Resources library.

Each carries a written description. The HAM-A copy is accurate and, tellingly, states it **"is a clinician-administered scale"**.

**That confirms a Part 1 finding.** On the consumer side these are correctly sold as clinician-administered video sessions. But inside the provider portal the *same* instruments sit behind a **"Send"** button that dispatches them to a client to complete alone. The consumer funnel understands what these instruments are; the clinical tool does not.

---

## Therapy Intern — the affordability tier

> "**Guided Support by Psychology Trainee** — Can't afford therapy? Access high-quality Support & Counseling from a supervised master's-level psychology trainee for only a fraction of the cost"

**₹260/session trial (list ₹530)** — about **35%** of the licensed-therapist price (₹740 / ₹1,470). Identical feature bundle, delivered by "Psychology Interns". Terms: 1 Month Save 11% · 3 Months Save 21% · 6 Months Save 25%. The page offers an escape hatch: "Prefer a Licensed Therapist? … we can connect you instantly with a certified professional."

**The supply ladder is therefore**: Intern → Licensed Therapist → Psychiatrist → Assessment, at roughly **₹260 → ₹740 → ₹2,090 → ₹6,280** in India. A clean four-rung price ladder over one matching engine.

---

## Funnel mechanics worth copying (or avoiding)

**Conversion devices observed**
- **Anchored trial pricing** — every therapy tier shows a struck-through list price and a ~50%-off first week, labelled "Introductory price for your first session".
- **"Most Popular" / "Most chosen"** on the 3-month tier — the middle-anchor default.
- **Trust bar** on every plan: Licensed Therapist · Confidential & Secure · **Start Within 24 Hours** · **Therapist Match Guarantee**.
- **Provider directory embedded in the pricing page** — real named providers with photo, discipline, years of experience, next availability, specialty tags, city, and a rating count ("58 users"). Buying the plan comes *before* choosing the expert: "Buy a plan, choose an expert, and switch until you find the right fit."
- **Switching as a feature** — "Switch Providers if the fit isn't right" appears in every bundle and in the hero ("Switch or cancel anytime!"). Reframes churn risk as a benefit.
- **Live chat launcher** bottom-right on every plan page.

**The two down-sell paths** (rather than losing the sale):
1. **"Can't Afford"** — *"With our financial aid, **you set the price** — and we'll connect you to a certified therapist who matches your budget and provides professional, evidence-based care."* Two buttons: **Try Therapy Intern** and **Request Financial Aid**.
2. **Therapy Intern** as a permanent ~65%-cheaper tier.

Name-your-own-price financial aid alongside a trainee tier is a genuinely thoughtful accessibility structure — and simultaneously a margin-preserving down-sell. It is the most copyable idea on these pages.

**US-only: "Pay with Insurance"**
A second CTA button, **"Pay with Insurance"**, sits beside "Proceed to Pay" **only in the US view** — absent entirely under India. This aligns the whole insurance stack seen provider-side (payer field, claims queue, credentialing, per-tier claim meters) as a **US-market feature**, while payouts settle to an Indian bank via IFSC and invoices default to INR.

---

## Data-fields (consumer plans)

| Entity | Field | Type | Enum / values | Source |
|---|---|---|---|---|
| Plan | Service line | enum | 24 `/plans/` slugs (therapy, therapyintern, psychiatrist, assessment, lgbtq-therapy, ocdtherapy, coach, yoga, dietitian, women-wellness, fitness, diabetes, physiotherapy, hypertension, substance-use, general-physician, cardiologist, orthopaedician, ent-specialist, gastroenterologist, paediatrician, sexologist, dermatologist, …) | site nav |
| Plan | Audience | enum | Individual, Couple | therapy |
| Plan | Modality | enum | Live (video/audio), Chat | therapy |
| Plan | Term | enum | Trial (weekly), 1 Month, 3 Months, 6 Months | therapy |
| Plan | Package shape (psychiatry) | enum | Initial Evaluation, +1 Follow Up, +3 Follow Ups | psychiatrist |
| Plan | Assessment type | enum | Clinical, Psychometric | assessment |
| Plan | Country | enum | full country list; geo-IP default; **resets per page** | all |
| Plan | Language | enum | ~108 languages | all |
| Plan | List price / discounted price / per-session price | currency | ₹ or $ | all |
| Plan | Discount | percent | 10 / 11 / 20 / 21 / 24 / 25% | all |
| Payment | Method | enum | Proceed to Pay · **Pay with Insurance (US only)** · Request Financial Aid | all |
| Provider card | name, discipline, years experience, next availability, specialty tags, city, rating count | mixed | — | all |

---

## Phase 4–5 status block

- **Pages captured**: 4 plan pages (therapy, psychiatrist, assessment, therapyintern) × 2 currencies where captured
- **Price points recorded**: 22
- **New findings**: geo-pricing multiple (4×–8×) · US-only insurance payment · four-rung supply ladder · name-your-price financial aid · country selector not persisted · consumer copy correctly describes instruments the provider tool mishandles
- **Not yet captured**: US prices for couples/chat/intern/assessment · the remaining 20 `/plans/` slugs · the checkout flow itself (**not entered — payment**) · the "Pay with Insurance" flow · "Request Financial Aid" form

### Remaining for the full brief
- **Phase 3** — the client-side app behind login (`web.mantracare.com`): client dashboard, session join, journal, pathways, messaging
- **Phase 6** — booking funnel end-to-end (stopping short of payment)
- **Phase 7** — the corporate/EAP lane
- 4 remaining free-assessment app slugs

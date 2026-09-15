# MantraCare — Phase 8 (partial): the assessment estate & the brand network

**Scanned**: 2026-09-12 · **Method**: direct page fetch (browser extension unavailable — see note at end)
**Scope**: `app.mantracare.org` assessment apps · `mantracare.org` content estate · sibling brands

---

## ⚠️ SECOND CLINICAL FINDING — the depression screener is a PHQ-9 with a cardinal symptom removed

**Where**: `app.mantracare.org/en/therapyapp/depression-check/` — the app behind the provider portal's **Free Assessments → Depression → View**, i.e. the instrument a MantraCare provider sends to a client.

The screener presents **8 items** on the standard PHQ-9 four-point scale (Not At All / Several Days / More Than Half the days / Nearly Everyday). Every item is lifted verbatim from the PHQ-9 — except that **PHQ-9 item 1 is absent**:

> **"Little interest or pleasure in doing things"** — not present on the page (verified by targeted re-fetch).

That item is **anhedonia**, which together with depressed mood is one of the **two DSM-5 cardinal ("gateway") symptoms** of major depressive disorder. A DSM-5 diagnosis requires at least one of the two to be present.

**Items actually asked** (in order): depressed/hopeless · sleep · fatigue · appetite · worthlessness/failure · concentration · **thoughts of being better off dead or hurting yourself** · psychomotor change.

**Why this is a real problem**
1. **It is no longer the PHQ-9**, so PHQ-9's validated severity cut-offs (5 / 10 / 15 / 20 on a 0–27 range) do not apply. With 8 items the maximum is 24, so any PHQ-9-derived banding systematically **under-classifies severity**.
2. The page nonetheless reports **PHQ-9-style severity labels** — "Perfectly fine", "Mild Depression", "Moderate Depression", "Moderately Severe Depression", "Severe Depression" — which are the PHQ-9's own band names. Borrowed bands on a modified scale produce scores that look validated and are not.
3. A client whose depression presents **predominantly as anhedonia** — a very common presentation, and the one most associated with treatment resistance — can screen materially lower than they should, potentially as "Perfectly fine".
4. No instrument name, author, or copyright is cited anywhere, so a clinician receiving the result cannot tell what was administered or that it was altered.

**Also notable**: **every single severity band, including "Perfectly fine", ends with a recommendation to "schedule an appointment with a therapist."** The result is a conversion step rather than a triage output — the recommendation does not vary with the score.

---

## The anxiety screener is the GAD-7 verbatim — and unattributed

`app.mantracare.org/en/therapyapp/anxiety-check/` is, item for item, the **GAD-7**:

1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it's hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid as if something awful might happen

…on the exact GAD-7 response scale (Not At All / Several Days / More Than Half the days / Nearly Everyday), with a "Your Test Score" field.

**The page never names the GAD-7** and carries no attribution. This corrects my Part 1 note that PHQ-9/GAD-7 were absent from the catalogue: **they are the catalogue's backbone — just unlabelled.** GAD-7 and PHQ-9 are free to use for clinical practice, so this is not primarily a licensing problem; it is a **provenance** problem. A provider sending "Anxiety" to a client, and a client receiving a score, have no way to know which instrument produced it, what the cut-offs mean, or (per the finding above) whether it has been modified.

The app pages also offer a **~108-language selector**, matching the session-note language list — so the same translation layer spans notes and assessments.

---

## Two different funnels wear the same test name

The same "anxiety test" exists in two places with **materially different data practices**:

| | `app.mantracare.org/en/therapyapp/anxiety-check/` | `mantracare.org/counseling/anxiety-test/` |
|---|---|---|
| Role | The app a **provider sends to a client** | Public **SEO landing page** |
| Gate | None observed — questions shown directly | **"Begin Test" form captures nickname, email, phone, and condition selection before the test** |
| Instrument | GAD-7 verbatim, unnamed | Not administered inline; name-drops instruments in prose |
| Result | "Your Test Score" | "Professionals here will analyze your result and provide a personalized **Report**" |
| Purpose | Clinical screening | **Lead capture** |

The content-estate version **collects PII up front as the price of taking a mental-health test**, and promises human analysis of the result. It name-drops **Hamilton Anxiety Rating Scale, Beck Anxiety Inventory, Generalized Anxiety Disorder Scale, and Penn State Worry Questionnaire** in prose — **with no citation or copyright attribution**, and without administering any of them. The Beck Anxiety Inventory in particular is a **commercially licensed instrument** (Pearson), so naming it as part of an offering is worth noting.

That page also links onward to nine other assessments and to therapy, nutrition, physiotherapy and condition pages, with client and provider login portals in the nav — a conversion funnel, not a screening tool.

---

## The brand & domain network

The estate is far larger than one product. Confirmed properties and their roles:

| Domain / brand | Role | Evidence |
|---|---|---|
| **mantracare.com** | Corporate/marketing site (WordPress 7.1 + Elementor) | Phase 1 |
| **web.mantracare.com** | Client app + **plan/pricing pages** (`/plans/<slug>`, ~24 slugs) | Phase 1; nav links |
| **provider.mantracare.com** | Provider portal (Next.js) | Phase 2 |
| **app.mantracare.org** | Interactive assessment apps (`/en/therapyapp/<slug>/`) | Resources → View |
| **mantracare.org** | **SEO content estate** — condition and test landing pages (`/counseling/<x>-test/`) with lead-capture | this phase |
| **mantra.care** | Corporate/EAP contact (`provider@mantra.care`) | Refer a Corporate |
| **therapymantra.co** | **Sibling brand** — assessments funnelling to MantraCare for therapist matching; promotes its own app | this phase |
| **onlinetherapymantra.com** | **Sibling brand** — "50+ self-tests", all free, using **mantracare.com login portals** | this phase |
| **MantraAssist** | Third-party-presented "AI CRM" upsell | Phase 2 |
| **MantraPartner** | Provider onboarding/verification brand | Phase 2 (Tasks modal) |

**Reading**: a multi-domain SEO funnel network. Independent-looking brands (TherapyMantra, OnlineTherapyMantra) run large free-assessment libraries that route users to the same booking and login infrastructure on mantracare.com. `onlinetherapymantra.com` alone advertises **50+ free self-tests** covering ADHD, PTSD, bipolar, OCD, social anxiety, eating disorders and narcissistic personality disorder — i.e. the assessment surface area is an order of magnitude larger than the 6 free + 12 paid items visible inside the provider portal.

**An instructive inconsistency**: the sibling brand does it properly. `therapymantra.co/assessments/depression/` administers a **10-step assessment, explicitly names the PHQ-9, and cites DSM-5 criteria**. The same organisation therefore attributes the instrument correctly on its consumer SEO property while shipping an **unnamed, 8-item modified version** through the clinical provider portal. The clinical surface is the less rigorous one.

---

## Assessment-catalogue (updated)

| Test name | Screens for | Maps to instrument? | # questions | Result format | Login/PII? | Upsell after result | Source |
|---|---|---|---|---|---|---|---|
| Anxiety (app) | Anxiety | **GAD-7 verbatim — unattributed** | **7** | "Your Test Score" | No | not observed | app.mantracare.org/en/therapyapp/anxiety-check/ |
| Depression (app) | Depression | **PHQ-9 minus item 1 (anhedonia) — unattributed** | **8** (PHQ-9 has 9) | 5 bands: Perfectly fine / Mild / Moderate / Moderately Severe / Severe | No | **Every band → "schedule an appointment with a therapist"** | app.mantracare.org/en/therapyapp/depression-check/ |
| Stress, Addiction, Relationship, Anger (app) | — | unknown | not captured | not captured | — | — | slugs not discoverable without the browser |
| Anxiety Test (content) | Anxiety | none administered; HAM-A, BAI, GAD, PSWQ **name-dropped unattributed** | n/a | "personalized Report" analysed by professionals | **Yes — nickname, email, phone** | therapy booking funnel | mantracare.org/counseling/anxiety-test/ |
| Depression (TherapyMantra) | Depression | **PHQ-9, named, DSM-5 cited** | 10 steps | not captured | No | connect with a therapist via MantraCare; app download | therapymantra.co/assessments/depression/ |
| 50+ tests (OnlineTherapyMantra) | ADHD, PTSD, bipolar, OCD, social anxiety, eating disorder, NPD, … | mostly unnamed | varies | varies | No | TherapyMantra therapists | onlinetherapymantra.com/assessments/ |
| HAM-A, HAM-D, YBOCS, TAT, MCMI, ADHD, DAPT, PANSS, Gender Dysphoria, MBTI, Big Five, Career Profiler | see Part 1 | named, clinician-administered scales | not captured | not captured | paid | Refer to Self / Refer Outside | provider portal Resources |

---

## Company positioning (from the corporate site)

MantraCare self-describes as "**a leading AI-powered digital health platform**" spanning mental health, physical wellness and chronic-condition management, serving individuals and employers (EAP) across **30+ countries**, and claims it reduces healthcare costs "**by 40–50%**".

Its plan taxonomy (24 public `/plans/` slugs) confirms the Part 3 finding that this is a whole-health marketplace: therapy, **counselling by interns**, psychiatry, LGBTQ+ counselling, psychometric/clinical tests, yoga, OCD care, coaching, nutrition, women's wellness, fitness, diabetes, physiotherapy, hypertension, substance use, plus general physician, cardiologist, orthopaedician, ENT, gastroenterologist, paediatrician, sexologist and dermatologist.

Note **"Counseling (by Interns)"** as a distinct, separately-priced tier — consistent with "Therapist Intern" in the 58-type provider taxonomy. A tiered-supply model worth understanding when you price your own offering.

---

## Phase 8 (partial) status block

- **Screens/pages captured**: 7 (2 assessment apps, 1 content test page, 2 sibling-brand properties, corporate site, plan taxonomy)
- **New findings**: 2 clinical (PHQ-9 item removal; GAD-7 unattributed) · 1 privacy (PII-gated test on the content estate) · 1 structural (multi-domain funnel network) · 1 positioning
- **Integrations/brands added**: 4 domains + 2 brands
- **Blocked**: the remaining 4 free-assessment app slugs (stress, addiction, relationship, anger) could not be discovered — they are not uniform (`-check` and `-test` both 404) and the provider portal's Resources page holds the real hrefs, which needs the browser.

### Blocked on the browser extension
The Claude-in-Chrome extension stopped responding partway through this phase (repeated 180s timeouts on every call, including a bare tab-context request). Public, server-rendered pages were reachable by direct fetch, which is how this file was produced. **Still blocked and requiring the browser:**
- **Phase 3** — the client-side app (`web.mantracare.com`), which is gated
- **Phases 4–5** — pricing: every `/plans/<slug>` page is a client-rendered SPA that serves only "Please wait.." to a fetcher
- **Phase 6–7** — the booking funnel and the corporate/EAP lane
- The 4 remaining assessment slugs, and the client-record Insurance/Claims tiles

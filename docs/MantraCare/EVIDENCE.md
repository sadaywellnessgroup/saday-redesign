# MantraCare — evidence index

Maps each finding in the 2026-09-12 scan to the images that prove it.
Re-capture pass: **2026-09-15** · **82 images** · 48 of the 53 cited `ss_…` IDs.
Checklist: [`10_Screenshot_Recapture_Checklist.md`](./10_Screenshot_Recapture_Checklist.md).

Capture tool: [`scanner/mantracare-capture.mjs`](../../scanner/mantracare-capture.mjs)
(Playwright driving system Chrome, 1440×900 at 2× — every image is 2880px wide).
Every **captured** `ss_…` reference in reports 01–04 is now a working relative link;
the six that could not be re-captured are marked in place and explained at the end.

---

## Integrity notes — read before citing these images

All shots are of MantraCare's own pages, taken read-only. **Nothing was submitted, booked,
paid for, prescribed, sent or changed.** Forms were opened to reveal their fields and then
dismissed. Authentication was performed by the account holder in a browser window the tool
opened; no credential was read or stored by the tooling.

**Redaction.** The provider's name and the test client's name are blurred in every
provider-portal shot (`data-redacted` attribute applied in-page before capture). The account
carried no other personal data — a route sweep across 26 screens found zero email addresses
and zero phone numbers.

**Where the DOM was touched**, and only to make already-delivered markup visible — no text
was edited, inserted or rewritten:

| Image | What was done |
|---|---|
| `assessments/depression__all-8-items__EXTRA.png` | The screener is a Swiper carousel, one item per slide. Slides were stacked vertically (CSS only) so the whole item list fits one frame. `_extra/depression__native-step-view__EXTRA.png` is the untouched first view. |
| `assessments/anxiety__gad7-verbatim__EXTRA.png` | Same slide-stacking. |
| `_extra/band__*__EXTRA.png` | Each severity-band block is a Gravity Forms conditional field shipped in the page and hidden off-screen (`left:-9999px`). One band at a time was returned to normal flow and photographed in place. |
| `assessments/depression__severity-bands__EXTRA.png` | A montage of those five native panels plus a caption strip. Each panel is unmodified; only the stacking is ours. The five also exist separately in `_extra/`. |
| everything else | Straight full-page, viewport or clipped captures, no DOM changes. |

**Deliberately not captured:** the post-submission screener result screen. Reaching it means
submitting the questionnaire, which this pass declined to do — and it proved unnecessary,
since the band text and the scoring gauge ship in the page source.

Every image was checked for byte-identical twins, so no frame is counted twice under two
names. The one intentional duplicate is noted below.

---

## ⚠️ Finding 1 — the prescribing formulary is systematically wrong

Report: [`03_Phase2_Part2.md`](./03_Phase2_Part2.md) ·
Path: Tools → Prescriptions → open a prescription → Medicine → **+ Add**
Machine-readable record: [`formulary-dump.json`](./formulary-dump.json) (68 rows)

**Confirmed, and worse than the report stated.** Of 49 rows whose brand maps to a known
molecule, **43 carry the wrong active ingredient — 88%**. Only the first four rows are right.

| Proof | Image |
|---|---|
| The live prescribing surface, pre-picker | [`prescriptions__screen-1__ss_005701oz7`](./screenshots/provider/prescriptions__screen-1__ss_005701oz7.png) |
| An open prescription, Medicine section visible | [`prescriptions__screen-2__ss_6251fwnct`](./screenshots/provider/prescriptions__screen-2__ss_6251fwnct.png) |
| **The open medicine picker** | [`prescriptions__formulary-picker__ss_4316fhwg5`](./screenshots/provider/prescriptions__formulary-picker__ss_4316fhwg5.png) |
| The 4 correct rows at the top — proves the offset starts after row 4 | [`rx__list-top-scroll`](./screenshots/_extra/rx__list-top-scroll__EXTRA.png) |
| **Cymbalta → Escitalopram 30 mg** (wrong drug; also a supratherapeutic escitalopram dose) | [`rx__mispair-cymbalta`](./screenshots/_extra/rx__mispair-cymbalta__EXTRA.png) |
| **Effexor → Fluoxetine** (should be venlafaxine) | [`rx__mispair-effexor`](./screenshots/_extra/rx__mispair-effexor__EXTRA.png) |
| **Wellbutrin → Mirtazapine** (should be bupropion) | [`rx__mispair-wellbutrin`](./screenshots/_extra/rx__mispair-wellbutrin__EXTRA.png) |
| One brand against four different ingredients | [`rx__same-brand-many-ingredients`](./screenshots/_extra/rx__same-brand-many-ingredients__EXTRA.png) |
| Mid-list, the same brands reappearing | [`rx__list-mid-scroll`](./screenshots/_extra/rx__list-mid-scroll__EXTRA.png) |
| "Submit Prescription" in frame — a live prescribing surface, not a sandbox | [`rx__submit-button-context`](./screenshots/_extra/rx__submit-button-context__EXTRA.png) |

### New in this pass — three things the text record missed

**1. Antidepressant brands are mapped to diabetes drugs, including insulin.**
[`rx__mispair-insulin`](./screenshots/_extra/rx__mispair-insulin__EXTRA.png)

| Picker row | Would actually dispense | Correct molecule |
|---|---|---|
| **Celexa** — Insulin Glargine (20 mg) tablet | long-acting insulin | citalopram |
| **Valdoxan** — Insulin Aspart (25 mg) tablet | rapid-acting insulin | agomelatine |
| **Wellbutrin** — Glibenclamide (150 mg) | sulfonylurea | bupropion |
| **Paxil** — Metformin (20 mg) | biguanide | paroxetine |
| **Luvox** — Gliclazide · **Remeron** — Pioglitazone · **Desyrel** — Repaglinide · **Trintellix** — Acarbose · **Elavil** — Dapagliflozin · **Zoloft** — Empagliflozin · **Effexor** — Sitagliptin | oral hypoglycaemics | — |

Selecting an antidepressant by its brand name can put a **hypoglycaemic agent, or insulin, on
a prescription for a psychiatric patient**. Insulin is not an oral tablet and is not dosed in
milligrams, so these rows are incoherent at the level of units as well as identity — evidence
the list was generated, not curated.

**2. The formulary is provider-writable free text.** The picker ends in a
`+ Create "<whatever you typed>"` action (visible in the Cymbalta shot). There is no
controlled drug dictionary behind this field, which is the likely mechanism for the
corruption and means the list can drift further at any time.

**3. The offset is not a single shift.** The same brand recurs 3–4 times against different
molecules (Cymbalta ×3, Zoloft ×4), so this is not one off-by-four join that could be
repaired by re-aligning two columns — the brand and ingredient columns were combined
repeatedly and independently.

> Anyone opening these images can confirm the mispairing without trusting the report.
> If MantraCare corrects the list, this is the only record.

---

## ⚠️ Finding 2 — the depression screener is a PHQ-9 with anhedonia removed

Report: [`05_Phase8_AssessmentEstate.md`](./05_Phase8_AssessmentEstate.md) ·
Page: `app.mantracare.org/en/therapyapp/depression-check/`

| Claim | Proof |
|---|---|
| 8 items, and **PHQ-9 item 1 "Little interest or pleasure in doing things" is absent** | [`depression__all-8-items`](./screenshots/assessments/depression__all-8-items__EXTRA.png) — all 8 in one frame, "Step 1 of 9" visible |
| Presented one item at a time, unnamed and unattributed | [`depression__native-step-view`](./screenshots/_extra/depression__native-step-view__EXTRA.png) |
| PHQ-9 band names applied to the shortened scale | [`depression__severity-bands`](./screenshots/assessments/depression__severity-bands__EXTRA.png) |
| **Every band, "Perfectly fine" included, ends in "schedule an appointment with a therapist"** | [`depression__every-band-books`](./screenshots/assessments/depression__every-band-books__EXTRA.png) |

Per-band originals: [`perfectly-fine`](./screenshots/_extra/band__perfectly-fine__EXTRA.png) ·
[`mild`](./screenshots/_extra/band__mild-depression__EXTRA.png) ·
[`moderate`](./screenshots/_extra/band__moderate-depression__EXTRA.png) ·
[`moderately-severe`](./screenshots/_extra/band__moderately-severe-depression__EXTRA.png) ·
[`severe`](./screenshots/_extra/band__severe-depression__EXTRA.png)
*(`depression__every-band-books` is an intentional copy of the `perfectly-fine` panel — the
one duplicate in the set.)*

### New in this pass — the gauge bands against 0–27

Each band panel carries a gauge whose printed cut-offs are the **canonical PHQ-9 bands on the
canonical PHQ-9 range**: `0–4 none-low · 5–9 mild · 10–14 moderate · 15–19 moderately severe ·
20–27 severe`. The administered instrument is **8 items × max 3 = maximum score 24**. So:

- the **20–27 "severe" band is only partly reachable** — no score can reach its top three points;
- every cut-off sits at its PHQ-9 position while the scale beneath it is one item shorter, so
  severity is **systematically under-read**;
- a presentation dominated by anhedonia — the removed item — reads lower still.

Visible in the image itself; it does not depend on the report's prose.

---

## Unattributed instruments

| Claim | Proof |
|---|---|
| `…/anxiety-check/` is the **GAD-7 item for item**, no instrument name or attribution | [`anxiety__gad7-verbatim`](./screenshots/assessments/anxiety__gad7-verbatim__EXTRA.png) |
| Public content name-drops **HAM-A, BAI, GAD, PSWQ** with no attribution | [`content__instrument-namedrop`](./screenshots/public/content__instrument-namedrop__EXTRA.png) |
| The anxiety test is **gated on nickname + email + phone** | [`content__anxiety-test-gate`](./screenshots/public/content__anxiety-test-gate__EXTRA.png) |
| Sibling brand does attribute — PHQ-9 named, DSM-5 cited | [`sibling__therapymantra-phq9`](./screenshots/public/sibling__therapymantra-phq9__EXTRA.png) |
| Scale of the free-test funnel | [`sibling__onlinetherapymantra-50tests`](./screenshots/public/sibling__onlinetherapymantra-50tests__EXTRA.png) |

## Pricing — the geo multiplier

[`therapy-US`](./screenshots/public/plans__therapy-US__EXTRA.png) ·
[`therapy-IN`](./screenshots/public/plans__therapy-IN__EXTRA.png) ·
[`psychiatry-US`](./screenshots/public/plans__psychiatry-US__EXTRA.png) ·
[`assessment-paid`](./screenshots/public/plans__assessment-paid__EXTRA.png) ·
[`therapyintern`](./screenshots/public/plans__therapyintern__EXTRA.png) ·
[`catalog`](./screenshots/public/plans__catalog__ss_5466a260j.png)
· Report: [`06_Phase4-5_Pricing.md`](./06_Phase4-5_Pricing.md)

## Provider portal

45 images in [`screenshots/provider/`](./screenshots/provider/) covering the dashboard,
the clients list, session notes, AI transcriber, AI-CRM, forms, appointments, availability,
billing, prescriptions, client leads, premium, tasks, earnings, messaging, referrals and the
full Settings tree including the subscription tiers and per-tool credit caps. Plus
[`screenshots/_extra/`](./screenshots/_extra/) for marketing, bank & tax, treatment plans,
wallet, community and credentialing, which the original scan had only as text dumps.

---

## Coverage

| Tier | Required | Captured |
|---|---|---|
| Priority 1 — finding 1 (formulary) | 7 | **10** ✅ (3 beyond the list) |
| Priority 1 — finding 2 (screeners) | 4 | **4** ✅ |
| Priority 2 — provider portal cited IDs | 47 | **43** |
| Priority 2 extra — text-dump screens | 3 | **3** ✅ |
| Priority 3 — public site | 12 | **12** ✅ |
| Supporting panels added this pass | — | 11 |
| **Total images** | ≥ 76 | **82** |
| **Cited `ss_…` IDs** | 53 | **48** |

### The 5 cited IDs that could not be re-captured

This pass was asked to match or exceed the cited set. It falls five short, and those five are
listed rather than padded — **a frame that does not show what its ID refers to is worse than
a gap**, because it looks like proof.

| ID | Why |
|---|---|
| `ss_0479w1zro` · `ss_7529oo2l4` · `ss_826318mhj` | **The Resources catalog no longer exists in the portal.** The sidebar "Resources" button carries no handler and opens nothing (checked in the DOM: a `<button>` with no navigation, no popup, no new tab); `/tools` redirects to the dashboard. The 6-free/12-paid assessment catalogue the 2026-09-12 scan documented has been removed or disabled since. |
| `ss_6691gvev7` (13-tab client chart) | The account's only client is status **"Invite Sent / Prospective"** — never onboarded, so no chart exists to open. Reaching one would mean creating a real client relationship, which is outside a read-only pass. |
| `ss_8937zzwoq` (invoice step 2) | "Create Bill" opens a **single-step** modal on `/billing`; there is no second step. `/invoices/create` redirects to `/billing`. |

All three Priority-2 extras are captured. `_extra/service-taxonomy__EXTRA.png` shows the
full **58-option** provider-type list from the Refer-a-Provider selector, rendered inline so
every option is legible in one frame — including **"AI Therapist"**, **"AI Doctor
Assistant"**, "Therapist Intern", "Legal Counsellor" and "Financial Wellbeing Advisor".

**That the Resources surface vanished within three days is itself the argument for this pass.**
The text record now cites a screen nobody can re-open — exactly the position the two clinical
findings were in this morning.

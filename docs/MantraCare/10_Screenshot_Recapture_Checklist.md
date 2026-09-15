# MantraCare — Provider-Portal Screenshot Re-Capture Checklist

**Why this exists**: the 2026-09-12 scan produced text reports that reference 53
screenshot IDs (`ss_…`), but the images were never exported to disk — the Chrome
extension died partway and the later phases fell back to text-only server fetches.
The two clinical safety findings (drug formulary, modified PHQ-9) currently rest on
text alone with no visual proof. This checklist re-captures the evidence.

**Rule for this pass** (per the request): capture **at least** every `ss_…` the
reports cite, matched to the exact screen it was cited on — **coincide with the
fetches, or take extra, never less.** The ⚠️ EXTRA rows are additional shots the two
findings need to stand on their own.

---

## Setup

1. Log into **`provider.mantracare.com`** as the same Therapist/Provider account used
   on 2026-09-12 (own/test account — do not use a real patient's data).
2. Save every capture into `docs/MantraCare/screenshots/` using the **Save-as** name in
   the tables below. The name embeds the original `ss_…` ID so each image resolves the
   reference in the reports (e.g. `03_Phase2_Part2.md` cites `ss_4316fhwg5`).
3. **Read-only, same constraints as the scan**: no submit, no booking, no payment, no
   sending a prescription, no account changes. Open forms to reveal fields, then Cancel.
4. **Redaction**: if any real name / email / phone / DOB / clinical content is on
   screen, blur or crop it before saving. These are evidence shots of *structure and
   defects*, not of people. Filenames and this doc must stay PII-free.
5. Full-page capture where a screen scrolls (the formulary and pricing especially).

**Naming convention**: `<module>__<screen>[__<detail>]__<ss_id>.png`
Save under the subfolder named in each section. Extra shots with no original ID use
`__EXTRA` in place of the ID and go under `screenshots/_extra/`.

---

## ⚠️ PRIORITY 1 — the two clinical findings (do these first; they're the whole point)

### Finding 1 — prescription formulary is systematically wrong
Source: `03_Phase2_Part2.md:9`. Path: **Tools → Prescriptions (`/tools/prescription`)
→ open a prescription → Medicine → "+ Add" → medicine picker.** Do **not** press
"Submit Prescription".

| Save-as (folder: `_extra/` unless noted) | Must show | Original ID |
|---|---|---|
| `provider/prescriptions__formulary-picker__ss_4316fhwg5.png` | The open medicine picker with the searchable list visible | **ss_4316fhwg5** |
| `_extra/rx__mispair-cymbalta__EXTRA.png` | ⚠️ Search "Cymbalta" → the row stating *Escitalopram … 30 mg* (wrong drug + supratherapeutic dose) | — |
| `_extra/rx__mispair-effexor__EXTRA.png` | ⚠️ Search "Effexor" → row stating *Fluoxetine* (should be venlafaxine) | — |
| `_extra/rx__mispair-wellbutrin__EXTRA.png` | ⚠️ Search "Wellbutrin" → row stating *Mirtazapine* (should be bupropion) | — |
| `_extra/rx__list-top-scroll__EXTRA.png` | ⚠️ Top of the list (the 4 correct rows: Prozac/Zoloft/Cipralex/Elavil) — proves the offset starts after row 4 | — |
| `_extra/rx__list-mid-scroll__EXTRA.png` | ⚠️ Mid-scroll showing the same brand (e.g. Zoloft) reappearing against a *different* ingredient | — |
| `_extra/rx__submit-button-context__EXTRA.png` | ⚠️ The "Submit Prescription" button in frame with the picker — proves it's a live prescribing surface, not a demo sandbox | — |

> Aim: anyone opening these can independently confirm the wrong-drug mapping without
> trusting the report. If MantraCare later fixes the list, these are the only record.

### Finding 2 — depression screener is a PHQ-9 with the anhedonia item removed
Source: `05_Phase8_AssessmentEstate.md:8`. Reached via **provider Resources → Free
Assessments → Depression → View**, which opens
`app.mantracare.org/en/therapyapp/depression-check/`.

| Save-as (folder: `assessments/`) | Must show | Original ID |
|---|---|---|
| `assessments/depression__all-8-items__EXTRA.png` | ⚠️ The full item list — 8 items, with **"Little interest or pleasure in doing things" absent** (scroll/stitch if needed) | — |
| `assessments/depression__severity-bands__EXTRA.png` | ⚠️ The result screen showing PHQ-9 band names ("Perfectly fine"…"Severe") on the 8-item scale | — |
| `assessments/depression__every-band-books__EXTRA.png` | ⚠️ Any band's "schedule an appointment with a therapist" recommendation | — |
| `assessments/anxiety__gad7-verbatim__EXTRA.png` | ⚠️ `…/anxiety-check/` — the 7 GAD-7 items with **no instrument name/attribution** | — |

---

## PRIORITY 2 — provider-portal screens (every cited ss_, matched to its screen)

All under `screenshots/provider/`. Log in first. One row = one required capture.

### Dashboard & clients
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `dashboard__home__ss_62924duj1.png` | `/get-started` | Action Center, profile-boost banner, 9 Quick Access tiles, credentialing banner | ss_62924duj1 |
| `dashboard__alt__ss_8819tl7wu.png` | `/get-started` | The dashboard variant referenced in Part 3 | ss_8819tl7wu |
| `clients__list__ss_0378c3i4v.png` | `/clients` | Caseload list with columns/filters | ss_0378c3i4v |
| `clients__list-2__ss_4691tnjie.png` | `/clients` | Second clients-list view | ss_4691tnjie |
| `clients__add-modal-1__ss_7610g8s9f.png` | `/clients` → Add New Client | Add-client modal, full field set | ss_7610g8s9f |
| `clients__add-modal-2__ss_2529q65q8.png` | same modal | Additional fields / step | ss_2529q65q8 |
| `clients__add-modal-3__ss_7051i3mjf.png` | same modal | Additional fields / step | ss_7051i3mjf |
| `clients__record-13tab__ss_6691gvev7.png` | `/clients/[id]/profile` | The 13-tab client chart (tab bar visible) | ss_6691gvev7 |

### Session notes (the clinical documentation core)
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `notes__list__ss_4107by1qp.png` | `/session/notes` | Notes list | ss_4107by1qp |
| `notes__add-wizard__ss_7174hz6i8.png` | Add Session Notes | Template chooser (leads to the 26 templates) | ss_7174hz6i8 |
| `notes__editor-1__ss_8379pptyy.png` | note editor | Editor main view | ss_8379pptyy |
| `notes__editor-2__ss_1652tjxyf.png` | note editor | Editor detail | ss_1652tjxyf |
| `notes__editor-3__ss_5049qxpm4.png` | note editor / form | Form template shell | ss_5049qxpm4 |
| `notes__editor-4__ss_0983h5c2z.png` | note editor | Editor detail | ss_0983h5c2z |
| `notes__editor-5__ss_0135cjoov.png` | note editor | Editor detail (no sign/lock control — worth showing) | ss_0135cjoov |

### AI tools, resources
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `ai-transcriber__ss_71281wk9q.png` | `/tools/ai-transcriber` | AI scribe screen | ss_71281wk9q |
| `ai-crm__mantraassist__ss_1580l635c.png` | `/ai-crm` | MantraAssist AI-CRM upsell | ss_1580l635c |
| `resources__catalog-1__ss_0479w1zro.png` | `/tools` (Resources) | Assessment & tool catalog (6 free + 12 paid) | ss_0479w1zro |
| `resources__catalog-2__ss_7529oo2l4.png` | Resources | Catalog continued | ss_7529oo2l4 |
| `resources__catalog-3__ss_826318mhj.png` | Resources | Catalog continued / Refer options | ss_826318mhj |

### Forms, appointments, scheduling
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `forms__list__ss_75686oskf.png` | `/custom-forms` | Form list | ss_75686oskf |
| `forms__preview__ss_093481hlx.png` | `/custom-forms/preview/[id]` | Read-only form preview | ss_093481hlx |
| `appointments__list__ss_0777ququo.png` | `/appointments` | Appointment list | ss_0777ququo |
| `appointments__add-1__ss_34846ve4t.png` | Add appointment | Chooser/wizard | ss_34846ve4t |
| `appointments__add-2__ss_0209nk2wk.png` | Add appointment | Wizard step 2 | ss_0209nk2wk |
| `availability__1__ss_94277qsmz.png` | `/scheduling/*` | Availability / calendar | ss_94277qsmz |
| `availability__2__ss_7667fngvf.png` | `/scheduling/timeslots` | Timeslots | ss_7667fngvf |
| `availability__3__ss_0882usf05.png` | `/scheduling/daysoff` | Days off | ss_0882usf05 |

### Settings & monetization
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `settings__practice__ss_5614cd3dg.png` | Settings → Practice Details | Practice details | ss_5614cd3dg |
| `settings__team__ss_9198b781s.png` | Settings → Team/Providers | Team/providers | ss_9198b781s |
| `settings__notifications__ss_1749aweo6.png` | Settings → Notifications | Notification prefs | ss_1749aweo6 |
| `settings__subscription-1__ss_5551vq4xv.png` | Settings → Subscription | Plan tiers ($0/$49/$99/$149) | ss_5551vq4xv |
| `settings__subscription-2__ss_5932h9j12.png` | Subscription | Credit meter / caps | ss_5932h9j12 |
| `settings__subscription-3__ss_84147ubmo.png` | Subscription | Per-tool caps / "Edit Cap" | ss_84147ubmo |
| `settings__subscription-4__ss_4714fevoq.png` | Subscription | Caseload caps (10/50/unlimited) | ss_4714fevoq |

### Billing, invoicing, prescriptions (non-formulary)
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `billing__hub-1__ss_464949uq8.png` | `/billing` | Billing hub | ss_464949uq8 |
| `billing__hub-2__ss_1116zyhr3.png` | `/billing` | Unbilled queue | ss_1116zyhr3 |
| `invoice__create-1__ss_9651ivljv.png` | `/invoices/create` | Create-invoice form | ss_9651ivljv |
| `invoice__create-2__ss_8937zzwoq.png` | Create invoice | Session↔invoice linkage | ss_8937zzwoq |
| `prescriptions__screen-1__ss_005701oz7.png` | `/tools/prescription` | Prescription screen (pre-picker) | ss_005701oz7 |
| `prescriptions__screen-2__ss_6251fwnct.png` | prescriptions | Prescription detail | ss_6251fwnct |
| `prescriptions__screen-3__ss_483158fwu.png` | prescriptions | Prescription detail | ss_483158fwu |

### Marketplace layer (leads, premium, earnings, referrals)
| Save-as | Screen / URL | Must show | Original ID(s) |
|---|---|---|---|
| `leads__client-leads__ss_8391n7cy7.png` | `/requests` | Client leads / accept-decline | ss_8391n7cy7 |
| `premium__preferred-1__ss_4031whj60.png` | `/premium` | Preferred-provider tier | ss_4031whj60 |
| `premium__preferred-2__ss_2115au8kb.png` | `/premium` | The 500-point score gate | ss_2115au8kb |
| `tasks__ss_3331g6bq8.png` | Tasks modal | Provider task list (incl. stale "(old)" tasks) | ss_3331g6bq8 |
| `earnings__ss_0066i24h5.png` | `/earnings` | Earnings/payout | ss_0066i24h5 |
| `messages__ss_9513itupa.png` | `/chat` | Provider↔client messaging | ss_9513itupa |
| `refer-earn__ss_47123uh6x.png` | `/refer-earn` | Provider referral programme | ss_47123uh6x |

### ⚠️ EXTRA — text-dump screens that never had a screenshot (capture new)
| Save-as (folder `_extra/`) | Screen / URL | Must show |
|---|---|---|
| `_extra/marketing__EXTRA.png` | `/marketing` | Self-marketing tools (was text-dump only) |
| `_extra/bank-tax__EXTRA.png` | `/bank-tax` | Bank & tax identity fields (was text-dump only) |
| `_extra/service-taxonomy__EXTRA.png` | wherever the 58 service types list | The service-type list incl. "AI Therapist" / "Therapist Intern" |

---

## PRIORITY 3 — public-site shots (no login needed)

The 3 public IDs the reports cite, plus the pricing/content surfaces the last scan was
**blocked** on (client-rendered SPAs that served only "Please wait.." to a fetcher — a
real browser renders them fine). Save under `screenshots/public/`.

> Create the folder first: `mkdir -p docs/MantraCare/screenshots/public`

### Cited public IDs
| Save-as (folder `public/`) | Screen / URL | Must show | Original ID |
|---|---|---|---|
| `home__landing__ss_44733oc91.png` | `mantracare.com/` | Hero "One Place For Health and Care", program grid, the 3 B2B suites, 40–50% cost claim (full-page) | ss_44733oc91 |
| `client-login__ss_4872rplt5.png` | `web.mantracare.com/login` | Email-first passwordless entry, phone alt, Google OAuth, SAML path | ss_4872rplt5 |
| `plans__catalog__ss_5466a260j.png` | `web.mantracare.com/plans/all` | Full plan catalog with geo + language selectors | ss_5466a260j |

### ⚠️ EXTRA — pricing SPAs the fetcher couldn't read (Phase 4–5 evidence)
Capture each with the **US** geo selected, then repeat with **India** — the finding is
that the same product is priced ~4×–8× higher in the US (`06_Phase4-5_Pricing.md:10`).
| Save-as (folder `public/`) | URL | Must show |
|---|---|---|
| `plans__therapy-US__EXTRA.png` | `/plans/therapy` (geo=US) | Therapy price ladder, USD |
| `plans__therapy-IN__EXTRA.png` | `/plans/therapy` (geo=India) | Same ladder, INR — side-by-side proof of the multiplier |
| `plans__psychiatry-US__EXTRA.png` | `/plans/psychiatrist` (geo=US) | Psychiatry package ladder |
| `plans__assessment-paid__EXTRA.png` | `/plans/assessment` | The paid psychometric instruments, priced |
| `plans__therapyintern__EXTRA.png` | `/plans/therapyintern` | The "Counseling by Interns" affordability tier |

### ⚠️ EXTRA — content estate & PII-gated test (Phase 8 evidence)
| Save-as (folder `public/`) | URL | Must show |
|---|---|---|
| `content__anxiety-test-gate__EXTRA.png` | `mantracare.org/counseling/anxiety-test/` | The "Begin Test" form capturing **nickname, email, phone** before the test (PII-as-price finding) |
| `content__instrument-namedrop__EXTRA.png` | same page | The prose name-dropping HAM-A, BAI, GAD, PSWQ with no attribution |
| `sibling__therapymantra-phq9__EXTRA.png` | `therapymantra.co/assessments/depression/` | The sibling brand doing it right — PHQ-9 named, DSM-5 cited (the contrast shot) |
| `sibling__onlinetherapymantra-50tests__EXTRA.png` | `onlinetherapymantra.com/assessments/` | The "50+ free self-tests" library (scale of the funnel) |

---

## Coverage ledger — completed 2026-09-15

- [x] **Priority 1 finding 1** (formulary): 1 cited + **9** extra = **10 shots** (3 more than planned)
- [x] **Priority 1 finding 2** (screeners): **4 shots** — plus 6 supporting band panels
- [x] **Priority 2** provider screens: **43 of 47** cited `ss_…` IDs
- [x] **Priority 3** public site: **12 shots** (3 cited + 9 extra)
- [x] **Extra** provider text-dump screens: **3 shots** ✅
- [x] **Total this pass: 82 images**, **48 of the 53 cited `ss_…` IDs**

**The 5 that could not be re-captured**, with reasons, are in
[`EVIDENCE.md`](./EVIDENCE.md#the-5-cited-ids-that-could-not-be-re-captured).
Short version: the **Resources catalog has been removed from the portal** since 2026-09-12
(the sidebar button is inert, `/tools` redirects away) — three of them; and the 13-tab client
chart has no client to open, since the only one on the account never accepted its invite;
the fifth is an invoice wizard step that does not exist — "Create Bill" is single-step.
None were padded with a look-alike frame.

> Both clinical findings now stand on images. The formulary finding came back **worse than
> documented**: 43 of 49 brand rows carry the wrong molecule, including antidepressant brands
> mapped to **insulin and oral hypoglycaemics**, and the drug list turned out to be
> provider-writable free text.

---

## How this pass was run

Tooling: [`scanner/mantracare-capture.mjs`](../../scanner/mantracare-capture.mjs) — Playwright
driving system Chrome at 1440×900, deviceScaleFactor 2.

```bash
node scanner/mantracare-capture.mjs --assessments    # public screeners, no login
node scanner/mantracare-capture.mjs --public-extra   # public content estate
node scanner/mantracare-capture.mjs --auth           # opens Chrome; YOU sign in
node scanner/mantracare-capture.mjs --probe          # route + PII survey, no images
node scanner/mantracare-capture.mjs --formulary      # ⚠️ finding 1
node scanner/mantracare-capture.mjs --provider       # URL-addressable screens
node scanner/mantracare-capture.mjs --interactive    # tabs, modals, wizards
```

`--auth` never handles a credential: it opens a real Chrome window, waits for NextAuth's
`session-token` cookie to appear, re-checks a protected route, and only then saves the
session to `scanner/.session_mantracare` (gitignored).

Read-only throughout: no submit, no booking, no payment, no prescription sent, no account
change. Provider and test-client names are blurred in every portal shot. Each save is
hashed and compared, so a view that did not change cannot be filed as a distinct shot.

---

## After capturing

1. ✅ Count: 82 images (`find docs/MantraCare/screenshots -iname '*.png' | wc -l`).
2. ✅ ⚠️ shots spot-checked for legibility; PII redacted.
3. ✅ Every captured `ss_…` in reports 01–04 is now a working relative link, and
   [`EVIDENCE.md`](./EVIDENCE.md) maps each finding to its proof images.

# MantraCare — Phase 3 (blocked at login) + the complete free-screener audit

**Scanned**: 2026-09-13
**Contents**: what the client app gate reveals · where the booking paywall sits · **all six free screeners fully documented**

---

## Phase 3: the client app is behind a hard login wall

`web.mantracare.com` redirects every interior route to **`/get-started`**. Confirmed by direct test: `/journal` → `/get-started`. There is no read-only or demo mode.

**I did not proceed** — creating an account, entering an email or phone number, or granting Google OAuth are all actions I won't take on your behalf. **To map the client interior I need you to sign in yourself** (see the ask at the end).

### What the gate itself tells us

The login screen is a two-panel design: value propositions left, auth right.

**Auth methods**: email address · **"Use phone number instead"** · **Continue with Google**. One combined sign-in/sign-up field — "Enter your email address to sign in or create your account" — so there is no separate registration flow; identity is resolved by whether the address is known. No password field at this step, which implies an OTP/magic-link pattern.

**Claims made on the login screen** (worth recording, since several are checkable against what we found provider-side):

| Claim | Note |
|---|---|
| "One of the World's largest team of verified providers/experts" | Plan pages say 15,000+ therapy / 5,000+ psychiatry |
| "Personalized care plans tailored to your needs" | "Personalized Recovery Pathway" in every plan bundle |
| "24/7 care support whenever you need help" | Not evidenced provider-side; Notifications is "Coming Soon" |
| "Confidential, Secure Platform" | — |
| "Affordable sessions" | Supported by the intern tier and financial aid |
| "Available in 40+ countries" | Corporate site says 30+ countries — **the two figures disagree** |
| **"Secure & Private — Your data is encrypted and HIPAA-compliant"** | See below |

**On the HIPAA claim.** It is asserted prominently at the point of sign-up. I can't verify it from outside, and it isn't my place to adjudicate — but it's worth holding alongside what the provider portal actually shows: consent forms that exist but are wired into nothing (0 entries, no required forms), AI transcription that can be switched on without a recorded consent, a prescribing formulary with wrong drug data, a client record with no audit trail or note-locking, payouts routing to an Indian bank, and no BAA or subprocessor disclosure surfaced anywhere in the product. **If you are benchmarking compliance posture for your own build, this is the gap to examine properly** — the claim is made at the front door, and the back office doesn't visibly implement the controls that usually accompany it.

---

## Phase 6 (partial): the paywall sits *before* checkout

Clicking **"Proceed to Pay"** on `/plans/therapy` redirects to **`/get-started`**. You cannot see the checkout, the payment methods, the provider-selection step, or the "Pay with Insurance" flow without an account.

So the funnel order is: **browse plans → (account wall) → pay → choose expert.** The plan page even shows a browsable directory of named providers with photos, experience and availability — but the page states outright: *"Buy a plan, choose an expert, and switch until you find the right fit."* You commit money before you pick a person.

That is a deliberate and aggressive choice. It maximises conversion on the price anchor but inverts what most people want from therapy — choosing the human first. For your own build this is a clear differentiation opportunity.

---

## The six free screeners — complete audit

These are the instruments a MantraCare provider sends to a client from **Resources → Free Assessments → Send**. All six live on `app.mantracare.org/en/therapyapp/<slug>/`.

| Label in portal | Actual slug | Items | Response scale | Underlying instrument | Attributed? |
|---|---|---|---|---|---|
| Anxiety | `anxiety-check` | 7 | PHQ/GAD 4-point | **GAD-7 — verbatim** | ❌ |
| Depression | `depression-check` | **8** | PHQ/GAD 4-point | **PHQ-9 with item 1 (anhedonia) removed** | ❌ |
| Stress | `stress-assessment-quiz` | 7 | PHQ/GAD 4-point | **DASS items — anxiety and stress subscales mixed** | ❌ |
| Addiction | `am-i-an-addict` | 15 | Yes/No | Closely mirrors **Narcotics Anonymous' "Am I an Addict?"** self-questionnaire | ❌ |
| Relationship | `measuring-your-satisfaction-reationship-quiz` | 7 | 5-point ordinal | **Relationship Assessment Scale (Hendrick) — item-for-item** | ❌ |
| Anger | `anger-quiz` | 26 | True/False | unidentified | ❌ |

**Not one of the six names its source instrument.** A provider sending "Stress" and a client receiving "Moderately Severe Stress Issues" have no way to know what was administered.

### New finding — the Stress screener splices two instruments and bolts on a third's scale

Its seven items are distinctive DASS wording:
1. "I found myself getting upset by quite trivial things" · 2. "I tended to overreact to situations" · 4. "I found myself getting upset rather easily" → these are **DASS *stress*** subscale items.
3. "I had a feeling of shakiness, like my legs were going to give way" · 5. "I perspired noticeably… even when I wasn't doing anything physical" · 6. "I felt scared without any good reason" · 7. "I was aware of my heart rate, even when I wasn't doing anything physical" → these are **DASS *anxiety*** subscale items.

So a "stress" score is computed from a **4:3 mix of anxiety and stress items**. Then the response scale is wrong on top of that: DASS asks how much each statement applied **over the past week** ("Did not apply to me at all" → "Applied to me very much"); this page substitutes the **PHQ-9/GAD-7 frequency scale** ("Not At All / Several Days / More Than Half the days / Nearly Everyday"). Neither instrument's scoring survives that.

The result bands then borrow PHQ-9's naming again — Low, Mild, Moderate, **"Moderately Severe"**, Severe — a band label that exists specifically in PHQ-9's validated scheme.

**The pattern across all six is now unmistakable**: real instrument items, detached from their source, recombined, re-scaled, and reported under PHQ-9's severity vocabulary. The numbers look clinical and mean nothing defensible.

### New finding — the addiction screener labels people "an addict"

`am-i-an-addict` asks 15 yes/no questions on dishonesty, shame, solitary use, use when depressed or angry, legal consequences, relationship and family conflict, work and education impact, lost jobs and relationships, abandoned hobbies, blackouts, theft to fund use, failed quit attempts, withdrawal symptoms, and continued use despite consequences. The themes and the title track **Narcotics Anonymous' long-standing "Am I an Addict?" self-questionnaire** — a peer-fellowship self-reflection tool, not a clinical screener, and used here without attribution.

Its result bands are: **"Not An Addict" · "A Mild Addict" · "Moderately Addicted" · "Highly Addicted"** — with **"Moderately Addicted" appearing twice in the result set**, which is a scoring bug.

Two problems worth stating plainly:
1. **It assigns an identity, not a severity.** Contemporary practice (DSM-5, AUDIT, DAST) describes *substance use disorder severity*; "you are a mild addict" is a stigmatising label that the evidence base moved away from deliberately, because it worsens help-seeking. Delivering it automatically, from an unvalidated 15-item quiz, to someone who just disclosed blackouts and theft, is the opposite of what a screening result should do.
2. NA's questionnaire is designed for self-reflection *within a fellowship*, explicitly not for anyone else to grade you with. Repurposing it as a provider-sent clinical screener changes its meaning entirely.

### New finding — the relationship quiz is the RAS, verbatim and untitled

All seven items match the **Relationship Assessment Scale** (Hendrick, 1988) stem for stem — partner meeting needs, overall satisfaction, comparison to most relationships, wishing you hadn't entered it, expectations met, how much you love your partner, how many problems. It is reproduced without naming the scale or its author.

It also ships with a grammatical error in item 1 ("How well does your partner **meets** your needs") and a **typo baked into the production URL and page title** — `...reationship-quiz` / "Measuring Your Satisfaction **Reationship** Quiz".

### The anger quiz makes quasi-diagnostic statements

26 true/false items ("I fly off the handle easily", "I've gotten so angry at times that I've become physically violent, hitting other people or breaking things") with no identified source and undisclosed thresholds. Results are phrased as **"you are suffering from Severe Anger Issues"** — diagnostic-sounding language from an unvalidated instrument. Notably, an item disclosing **physical violence toward others** produces no risk-specific response or safety signposting; it just contributes to a band.

### Every result is the same funnel

Across all six, effectively every outcome ends with a variant of:

> "It is important that you schedule an appointment with a therapist. **MantraCare can help you connect with a therapist based on your needs.**"

In the depression screener this includes the **"Perfectly fine"** band. The recommendation does not vary with the score, which means the instrument is functioning as a conversion step wearing the costume of triage.

---

## Consolidated view: what this means for your build

The screener layer is the sharpest illustration of the whole product's pattern — **clinically-shaped surfaces with the clinical substance removed**:

| Layer | Looks like | Actually is |
|---|---|---|
| Free screeners | Validated instruments | Unattributed items, recombined, wrong scales, PHQ-9 bands borrowed |
| Session notes | 26-template clinical library | No risk severity, no sign/lock, meds as free text |
| Prescribing | Structured formulary | Brand→ingredient mappings systematically wrong |
| Insurance | Payer, claims, credentialing | No CPT/ICD on the invoice |
| Marketplace | "Get clients from Mantra" | 500-point gate, ~110 points reachable |
| Compliance | "HIPAA-compliant" at signup | Consent forms wired into nothing |

**The competitive opening is not features — it is integrity of execution.** Everything MantraCare advertises, it has *some* of. What it lacks is the last mile that makes each thing trustworthy: attribution on instruments, validation on scales, licensed drug data, coding on claims, enforcement on consent, a lock on the note. A clinical CRM that does the last mile properly doesn't need a bigger feature list to win the clinicians who notice.

**Concretely, for your assessment module**: license or use properly-attributed public-domain instruments (PHQ-9, GAD-7 and DASS-21 are all free to use with attribution), render the full item set unmodified, display the instrument name and version with every score, store the scale version on the result record, and make the recommendation depend on the score — including a genuine "no action needed" path.

---

## Phase 3 status block

- **Captured**: login/onboarding screen and its claims · route-gating behaviour · booking paywall position · all 6 free screeners in full
- **Blocked**: the entire client interior (dashboard, journal, pathways, sessions, messaging, insights, orders) and the checkout/provider-selection flow
- **New findings this pass**: 6 (stress-screener splice · addiction identity labelling + duplicate band · RAS unattributed + production typo · anger quasi-diagnosis with no violence-risk handling · uniform conversion CTA · account wall before checkout)
- **Defects logged**: 15 cumulative
- **Housekeeping**: a few assessment tabs were left open in your browser — the extension stopped responding mid-cleanup, so you may want to close them.

### What I need from you to finish Phase 3
Sign in to `web.mantracare.com` yourself with a **client** account — ideally a throwaway one rather than a real patient record — and tell me when you're in. I'll then map the client interior read-only: dashboard, journal, pathways, session join, messaging, insights and orders, recording structure and fields only, with any personal content redacted. I won't enter credentials, make a purchase, or send anything from the account.

If you'd rather not, Phase 7 (the corporate/EAP lane) is public and I can do that next without any access.

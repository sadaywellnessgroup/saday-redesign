# Saday Wellness — Intake Specification

> **File:** `docs/intake-spec.md`
> **Version:** 1.0 (Phase 0 · Week 1 · Tuesday)
> **Status:** DRAFT — pending CF clinical review (W2 Mon) and 5-tester revalidation (W3)
> **Companion to:** `Saday_Master_Blueprint.html` §5/§6/§7/§10 · `docs/Saday_Action_Plan_by_Claude.md` Phase 1 DoD
> **Implements:** the 7-screen adaptive intake that routes a new patient into Tracks T1–T5 and produces a JSON payload consumed by the W4–W5 backend (`intake_submissions`, `assessment_tool_versions`, `episode_of_care`).
> **Audience:** CTO/Dev (W2 build), DES (W2 high-fi mocks), CF (W2 clinical sign-off), backend engineer (W5 port to Next.js).

---

## 0 · How to use this document

1. **W2 Mon**, the build engineer reads §3 (state machine), §4 (per-screen spec), §6 (routing engine), §8 (JSON export). That's enough to scaffold the prototype.
2. **W2 Wed**, CF reads §5 (cluster taxonomy) and §6 (routing) and signs off on the 10 synthetic cases in §10. If a case routes wrong, fix the routing table, not the test.
3. **W3 Fri**, the spec is bumped to v2 with findings from the 5-tester study. Re-run §10 cases against v2.
4. **W5**, the backend port persists the same JSON shape from §8 into the `intake_submissions` table; routing logic moves *server-side* (anti-scrape — see §9).
5. **When unsure:** the **why** lives in `Saday_Master_Blueprint.html` §5 and §7. The **what** is here. The **when** is in the Action Plan.

---

## 1 · Purpose & scope

### 1.1 Purpose

The intake is a 7-screen adaptive flow that:

- Captures enough clinical signal in ≤ 4 minutes to assign a patient to one of five care tracks.
- Universally screens for suicide risk via C-SSRS items 1–2 (items 3–6 if positive).
- Produces a deterministic, auditable routing decision plus a recommended tool list.
- Operates in EN + HI without a backend (Phase 1 prototype), then is ported into Supabase (Phase 2).
- Is the V1 differentiator — Swasthmind has none, Tealfeed has none.

### 1.2 In-scope (V1)

- 7 screens; adult self-presenting only; EN + HI strings; localStorage draft persistence; JSON export to intake-submissions endpoint; deterministic cluster→track routing; C-SSRS short-circuit; consent + account creation bundled at S6.

### 1.3 Out of scope (deferred to V1.5+ unless flagged)

- Proxy / family-led intake (parent-for-child, partner-for-partner). Soft-exit with waitlist on S1 / S2.
- Adolescent (16–17) intake with guardian consent. Soft-exit on S2.
- Non-IST timezones at booking.
- Voice / non-text intake.
- Resumed intake from cross-device link (only same-browser localStorage in V1).
- Branching by gender, occupation, religion. (We collect none of these in intake; CF can extend on the bio screen post-booking.)

---

## 2 · Authoritative decisions log

Every decision below was made on 2026-04-25 by CTO. Reopen any of these only with a written rationale in `docs/scope-exceptions.md`.

| # | Decision | Locked value | Source |
|---|----------|--------------|--------|
| **D1** | Cluster taxonomy | 8 clusters: mood, anxiety, trauma, focus, sleep, substance, eating, stress (see §5) | CTO 2026-04-25 |
| **D2** | C-SSRS placement | Items 1–2 universal on S5; items 3–6 gated to positive screen | CTO 2026-04-25 |
| **D3** | Account creation timing | Post-intake at S6 consent; **anonymous draft persistence + opt-in lead capture** between S3↔S4. IP protection moved to server-side routing + Cloudflare bot challenge + per-IP rate limits (see §9). | CTO 2026-04-25 (debated) |
| **D4** | Multi-cluster routing tiebreak | Severity-wins (T4>T3>T2>T1) → tied tiers ask "primary concern" on S5 | CTO 2026-04-25 |
| **D5** | T5 crisis policy | Crisis resources only (Vandrevala, iCall); no booking offered; JC WhatsApp safety-net within 2h SLA | CTO 2026-04-25 |
| **D6** | Age & "who-for" gate | 18+ self-presenting only; minors and proxy → soft-exit with waitlist email capture | CTO 2026-04-25 |
| **D7** | Locale picker placement | Top-right of S0 only; selection persists in localStorage; never re-asked | CTO 2026-04-25 |
| **D8** | Default locale | EN. HI keys present from W2 Mon with English-fallback until CF translates Mon W2. | Action Plan W2 Mon |

---

## 3 · State machine

### 3.1 Screen sequence (happy path)

```
            ┌──────────────────────────────────────────────────────────────┐
            │   anonymous draft (localStorage, server-issued draftId)      │
            └──────────────────────────────────────────────────────────────┘
            S0 Welcome ──▶ S1 Who-for ──▶ S2 Age ──▶ S3 Clusters
                                                           │
                              (optional save-progress) ◀───┤
                                                           ▼
                                                S4 Duration / Impact
                                                           │
                                                           ▼
                                              S5 Contextual + C-SSRS
                                                           │
                                          ┌────────────────┼─────────────────┐
                                          ▼                ▼                 ▼
                                      T5 short-circuit  S5 disambiguate  S6 Consent
                                          │                │                 │
                                  Crisis Resources    "primary concern"      ▼
                                  (no booking)             │           Account create
                                  JC alert (2h SLA)        ▼            (email + OTP)
                                                       S6 Consent            │
                                                                             ▼
                                                                    POST /api/intake/submit
                                                                             │
                                                                             ▼
                                                                       Pick MHP screen
                                                                       (out of intake scope)
```

### 3.2 Soft-exit branches

| Trigger screen | Condition | Behaviour |
|---|---|---|
| S1 | User picks "for someone else" | Soft-exit screen: "Saday currently supports adults seeking care for themselves. Family-led care is coming soon — leave your email for a waitlist invite." Email field optional. No PHI persisted. |
| S2 | User picks "Under 18" | Soft-exit screen: "Saday currently supports adults 18+. We're building safe pathways for younger users. Leave your email for a waitlist invite." Email optional. No PHI persisted. |
| S5 | C-SSRS item 3+ positive (active ideation, plan, intent, behaviour) | Hard short-circuit to crisis screen (T5). No booking offered. JC alert dispatched. |
| S6 | User declines either consent (privacy or telemed) | Exit screen: "We can't continue without these consents. Saday's safety policy requires both." Drafted answers discarded; only an audit log row `intake_consent_declined` retained (no PHI). |

### 3.3 Resume rules

- A draft survives same-browser refresh / close via `localStorage["saday.intake.draft.v1"]`.
- A draft is server-mirrored only if user opts in to "save my progress" between S3↔S4 (provides email; server issues a magic-link to resume on a different device — V1.5; V1 only persists locally).
- Drafts auto-expire from localStorage after 7 days (timestamp check on next mount).
- Successful submission clears the draft.

---

## 4 · Per-screen specification

Convention: `id` = stable identifier the engineer uses in code; `key` = i18n string key. Validation rules are server-mirrored at submit (anti-tamper).

### S0 · Welcome

- **Purpose:** Establish trust, set expectation ("≈4 minutes, private, free"), let the user pick language, surface bot challenge silently.
- **Layout:** Saday logo, hero heading, sub-copy, "Begin" primary CTA, EN/हिंदी toggle top-right, footer micro-link "Crisis? Tap here for help" → static crisis-resources page (does not enter intake state machine).
- **Fields:** none persisted from this screen except `locale`.
- **i18n keys:** `s0.heading`, `s0.subcopy`, `s0.cta_begin`, `s0.crisis_link`, `s0.duration_estimate`, `s0.privacy_note`.
- **Accessibility:** language toggle is a `<button>` pair with `aria-pressed`; CTA `min-height: 48px`; visible focus outline.
- **Anti-scrape:** Cloudflare Turnstile widget mounted (invisible mode). Failed challenge ⇒ block transition to S1 with neutral copy "Please try again."
- **Exit condition:** click "Begin" + Turnstile pass ⇒ S1.

### S1 · Who is this for?

- **Purpose:** Filter to self-presenting adult (D6).
- **Fields:**
  | id | type | required | options |
  |---|---|---|---|
  | `who_for` | radio | yes | `self`, `other` |
- **i18n keys:** `s1.heading`, `s1.option_self`, `s1.option_other`, `s1.helper`.
- **Validation:** required.
- **Exit:**
  - `self` ⇒ S2.
  - `other` ⇒ soft-exit "for-someone-else" waitlist screen (see §3.2).

### S2 · Age band

- **Purpose:** Filter minors (D6); inform contextual question phrasing (60+ surfaces gentler register, geriatric-friendly MHP filter post-routing).
- **Fields:**
  | id | type | required | options |
  |---|---|---|---|
  | `age_band` | radio | yes | `under_18`, `18_24`, `25_34`, `35_44`, `45_59`, `60_plus` |
- **i18n keys:** `s2.heading`, `s2.option_<band>`, `s2.helper_privacy`.
- **Validation:** required.
- **Exit:**
  - `under_18` ⇒ soft-exit "under-18" waitlist screen.
  - any other ⇒ S3.

### S3 · Symptom clusters

- **Purpose:** Capture the patient's primary signal — what they came here to address.
- **Pattern:** multi-select chips (1–4 max selectable; 5+ is a red-flag of indecision and we ask them to pick the top 4).
- **Fields:**
  | id | type | required | options |
  |---|---|---|---|
  | `clusters` | checkbox group | yes (1–4) | the 8 cluster ids in §5 |
- **i18n keys:** `s3.heading`, `s3.helper`, `s3.cluster.<id>.label`, `s3.cluster.<id>.example`, `s3.error_max`.
- **Visual:** each chip shows label + a one-line conversational example so the user recognises themselves without clinical jargon. Example for `mood`: EN "Feeling down, hopeless, or numb most days." HI (CF to refine) "ज़्यादातर दिन उदास, खाली या बेबस लगना।"
- **Adaptive behaviour:** between S3 and S4, show an **opt-in interstitial** "Want us to save your progress? Drop your email — we'll send a link." (lead capture, see §9; non-blocking).
- **Validation:** ≥ 1, ≤ 4. Server enforces same.
- **Exit:** ≥ 1 cluster selected ⇒ S4.

### S4 · Duration & impact

- **Purpose:** Refine track severity (acute vs chronic; impact on work/relationships informs PHQ-9 functional-impairment scoring later).
- **Fields:**
  | id | type | required | options |
  |---|---|---|---|
  | `duration` | radio | yes | `lt_2w`, `2_4w`, `1_3m`, `3_6m`, `gt_6m` |
  | `impact_areas` | checkbox group | yes (≥ 1, allow `none`) | `work_study`, `relationships`, `sleep_appetite`, `physical_health`, `none` |
- **i18n keys:** `s4.heading`, `s4.duration_helper`, `s4.option_duration_<value>`, `s4.impact_helper`, `s4.option_impact_<value>`.
- **Validation:** both fields required.
- **Exit:** ⇒ S5.

### S5 · Contextual + safety

- **Purpose:** (a) Per-cluster bridging items that pre-score the assigned tools; (b) **universal C-SSRS items 1–2**; (c) C-SSRS items 3–6 only if 1 or 2 positive; (d) primary-concern disambiguation if multi-cluster tied (D4).
- **Layout:** vertical stack, sectioned. Each section header shows its cluster chip. C-SSRS section is *unsectioned and unlabelled as such* — the items appear as "two more questions about your safety" with neutral framing per published CT-SSRS adolescent / lifetime / past-month variants.
- **Per-cluster question packs:**
  | Cluster | Items asked here (V1) | Notes |
  |---|---|---|
  | mood | PHQ-2 (items 1+2 of PHQ-9), one-item mania screen ("Has there been a period when you felt unusually high-energy, needed less sleep, or couldn't slow down?") | Mania-positive ⇒ MDQ flag stored |
  | anxiety | GAD-2 (items 1+2 of GAD-7) | Triggers full GAD-7 post-booking |
  | trauma | one-item PCL-5 bridge ("Have you experienced or witnessed something so frightening or disturbing that it still affects you?") + one-item intrusion ("Bothered by repeated, disturbing memories of it?") | Triggers full PCL-5 post-booking |
  | focus | ASRS-v1.1 Part A 6 items (the validated screener) | If ≥ 4 positive ⇒ ASRS+ flag |
  | sleep | ISI item 1 ("difficulty falling asleep, staying asleep, or early waking — past 2 weeks?") on a 0–4 Likert | Triggers full ISI post-booking |
  | substance | AUDIT-C 3 items (frequency, typical drinks, ≥ 6 occasions) | Triggers full AUDIT only if AUDIT-C ≥ 4 |
  | eating | SCOFF 5 items (verbatim) | If ≥ 2 ⇒ SCOFF+ flag |
  | stress | PSS-4 (the brief 4-item version) | Triggers PSS-10 post-booking only if other clusters absent |
- **Universal safety items (always asked, after the cluster pack(s)):**
  - `cssrs_1`: "In the past month, have you wished you were dead or wished you could go to sleep and not wake up?"
  - `cssrs_2`: "Have you actually had any thoughts of killing yourself?"
- **Conditional safety items (only if cssrs_1 OR cssrs_2 = yes):**
  - `cssrs_3`: "Have you been thinking about how you might do this?"
  - `cssrs_4`: "Have you had these thoughts and had some intention of acting on them?"
  - `cssrs_5`: "Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?"
  - `cssrs_6`: "Have you ever done anything, started to do anything, or prepared to do anything to end your life?"
- **Disambiguation item (only if §6 routing engine produces a tie at the highest tier):**
  - `primary_concern`: radio of the tied clusters with copy "Of these, which feels most pressing right now?"
- **i18n keys:** `s5.section_<cluster_id>.heading`, `s5.q.<id>`, `s5.option.<id>.<value>`, `s5.cssrs.heading`, `s5.cssrs.<n>`, `s5.cssrs.helper`, `s5.primary_concern.heading`.
- **Validation:** every visible item required; C-SSRS items 3–6 only validated when shown.
- **Exit:**
  - `cssrs_3` OR `cssrs_4` OR `cssrs_5` OR `cssrs_6` = yes ⇒ T5 short-circuit (skip S6 normal flow; enter Crisis Resources screen; submit a *truncated* intake JSON with `routing.track="T5"` so backend can dispatch JC alert).
  - else ⇒ S6.

### S6 · Consent + account + summary

- **Purpose:** Show assigned track + plan, capture consents, create account.
- **Layout:**
  1. **Summary card:** "Based on what you shared, we recommend **Track {N} — {label}**." One-paragraph plain-language description of the track. Recommended next step ("book a 50-min session with a {role}").
  2. **Consent block:** two checkboxes, each with inline link to the full document opening in a modal (not a new tab).
  3. **Account block:** email + phone (E.164 IN). Submit triggers OTP send to email; OTP entered inline; success creates session.
- **Fields:**
  | id | type | required | constraints |
  |---|---|---|---|
  | `consent_privacy` | checkbox | yes | must be `true` to submit |
  | `consent_telemed` | checkbox | yes | must be `true` to submit |
  | `email` | email | yes | RFC 5322 + DNS MX hint server-side |
  | `phone` | tel | yes | E.164, India `^\+91[6-9]\d{9}$` V1 |
  | `otp` | text | yes | 6 digits, 5-min TTL, 3-attempt lockout |
- **Versioning:** `consentVersionPrivacy` and `consentVersionTelemed` are read from server config at submission; the version + sha256 of the rendered legal text are baked into the audit transcript.
- **i18n keys:** `s6.heading`, `s6.summary_track_<n>`, `s6.consent_privacy_label`, `s6.consent_telemed_label`, `s6.email_label`, `s6.phone_label`, `s6.otp_label`, `s6.cta_create`, `s6.error_consent`, `s6.error_otp`.
- **Validation:** all required; consents must be checked; OTP must verify.
- **Exit:**
  - Both consents + OTP verified ⇒ POST `/api/intake/submit` ⇒ Pick-MHP screen (out of intake scope).
  - Either consent declined ⇒ exit screen (see §3.2).

---

## 5 · Cluster taxonomy

> Locked per **D1**. Eight clusters; each maps to a default care track and a pre-configured assessment-tool set. CF reviews HI labels W2 Mon — column reflects current placeholder.

| id | EN label | EN one-line example | HI placeholder (CF refines) | Tools triggered post-intake | Default track | Severity overrides (see §6.2) |
|---|---|---|---|---|---|---|
| `mood` | Low mood, sadness, hopelessness | "Feeling down, hopeless, or numb most days." | "ज़्यादातर दिन उदास, खाली या बेबस लगना।" | PHQ-9 (always), MDQ (only if mania-screen positive) | T2 | PHQ-9 ≥ 15 ⇒ T4; MDQ+ ⇒ T4 |
| `anxiety` | Worry, panic, fear | "Constant worry, racing heart, or sudden panic." | "लगातार चिंता, घबराहट या डर।" | GAD-7 | T2 | GAD-7 ≥ 15 ⇒ T4 (rare; usually comorbid w/ mood) |
| `trauma` | Past events that still affect you | "Flashbacks, nightmares, or feeling on-edge." | "पुरानी घटनाओं की यादें जो परेशान करती हैं।" | PCL-5 | T3 | PCL-5 ≥ 33 (already T3); + dissociation ⇒ T4 |
| `focus` | Attention, concentration, restlessness | "Hard to focus, finish tasks, or sit still." | "ध्यान केंद्रित करने या काम पूरा करने में मुश्किल।" | ASRS-v1.1 (full) | T4 | ASRS Part A ≥ 4 ⇒ T4 (default); else T2 |
| `sleep` | Sleep problems | "Trouble falling asleep, staying asleep, or waking too early." | "सोने या सोते रहने में परेशानी।" | ISI | T1 | If only cluster: T1; if comorbid: rolls into primary track; never overrides upward |
| `substance` | Alcohol or substance use | "Drinking or using more than you'd like." | "शराब या नशे का बढ़ता उपयोग।" | AUDIT (full) | T4 | AUDIT-C ≥ 4 ⇒ T4 (default); AUDIT-C ≥ 6 ⇒ T4 + addiction-trained MHP filter |
| `eating` | Eating, body image | "Worries about eating, weight, or body shape." | "खानपान या शरीर की छवि की चिंता।" | SCOFF | T3 | SCOFF ≥ 2 ⇒ T3 (default); ≥ 4 ⇒ T3 + ED-trained filter |
| `stress` | Daily stress, work, relationships | "Burnt out, overwhelmed by work or relationships." | "काम या रिश्तों से थकान, बोझ।" | PSS-10 | T1 | None |

**Reserved for V1.5+ (NOT exposed in S3):** OCD-cluster (OCI-R), personality-features cluster (MSI-BPD), psychosis-screen cluster. Reasoning: V1 MHP cohort isn't trained to treat these as primary concerns; they're surfaced via MHP-assigned post-booking when clinically indicated.

---

## 6 · Routing engine

### 6.1 Algorithm (deterministic, evaluated server-side at /api/intake/route)

```
input  = { age_band, clusters[], duration, impact_areas[], contextual{}, cssrs{} }
output = { track: "T1"|"T2"|"T3"|"T4"|"T5",
           primary_concern: cluster_id,
           recommended_tools: [tool_id...],
           overrides_applied: [{cluster, reason, upgraded_to}],
           safety_flags: { cssrs_item_1, cssrs_item_2, cssrs_item_3_plus, mania_screen_positive } }

1. SAFETY SHORT-CIRCUIT
   if cssrs.item3 OR cssrs.item4 OR cssrs.item5 OR cssrs.item6 = true:
       return { track: "T5", recommended_tools: ["C-SSRS-full"], primary_concern: null,
                safety_flags: { ...all cssrs flags... } }

2. PER-CLUSTER INITIAL TRACK
   for each cluster c in input.clusters:
       initial[c] = default_track(c)                  # from §5 table
       apply severity_overrides(c, contextual)        # may upgrade initial[c] (e.g., PHQ-9>=15 ⇒ T4)
       record any override into overrides_applied[]

3. MULTI-CLUSTER RESOLUTION
   highest_tier = max(rank(initial[c]) for c in clusters)
                  # rank: T4=4, T3=3, T2=2, T1=1, T5 handled in step 1
   tied_clusters = [c for c in clusters where rank(initial[c]) == highest_tier]

4. TIEBREAK
   if len(tied_clusters) == 1:
       primary_concern = tied_clusters[0]
   elif input.primary_concern set (user disambiguated on S5):
       primary_concern = input.primary_concern
   else:
       # Server returns 'needs_disambiguation' to client; client renders the primary_concern radio
       # and re-posts. Server never decides arbitrarily.
       return { needs_disambiguation: true, options: tied_clusters }

5. FINAL TRACK
   track = initial[primary_concern]

6. RECOMMENDED TOOLS
   tools = union(default_tools(c) for c in clusters)  # de-duplicated, ordered by primary_concern first

7. RETURN
   return { track, primary_concern, recommended_tools: tools,
            overrides_applied, safety_flags }
```

### 6.2 Severity-override table

Each row evaluated against `contextual` answers from S5.

| Cluster | Trigger (computed from S5 contextual) | Effect |
|---|---|---|
| mood | PHQ-2 sum ≥ 5 (severe) AND duration ≥ 1_3m AND impact_areas ≠ [`none`] | mood ⇒ T3 (severe non-psychotic depression; psychologist-led with psychiatry consult flag) |
| mood | mania_screen_positive (S5 mania item) | mood ⇒ T4 (psychiatrist primary; bipolarity workup) |
| mood | PHQ-2 sum ≥ 5 AND mania_screen_positive | mood ⇒ T4 + safety_plan_required flag |
| anxiety | GAD-2 sum ≥ 5 AND impact_areas includes `physical_health` | anxiety ⇒ T3 (panic/somatic features) |
| trauma | trauma+intrusion both yes AND duration ≥ 3_6m | trauma stays T3; tools += PCL-5 + dissociation-screen flag |
| focus | ASRS Part A ≥ 4 of 6 | focus stays T4 (psychiatrist primary; ADHD med eval) |
| focus | ASRS Part A < 4 AND age_band ≥ 35_44 | focus ⇒ T2 (more likely depressive cognitive symptom; psychologist first) |
| sleep | ISI item 1 ≥ 3 AND only cluster | sleep stays T1; tools += ISI; psychoeducation pack |
| substance | AUDIT-C ≥ 4 | substance stays T4; tools += AUDIT-full + addiction-trained MHP filter |
| eating | SCOFF ≥ 2 | eating stays T3; tools += SCOFF-full + ED-trained MHP filter |
| eating | SCOFF ≥ 3 AND age_band == 18_24 | eating ⇒ T3 + medical-monitoring flag (BMI/labs needed before psychotherapy) |
| stress | none | stress stays T1 |

**Tracks defined:**

- **T1** — Mild / wellbeing — counsellor-led, psychoeducation-heavy, 4-session pack default.
- **T2** — Moderate mood/anxiety — RCI-licensed psychologist, weekly cadence, 8-session pack default.
- **T3** — Complex / trauma / OCD / ED — senior psychologist with relevant specialty, 8-session + safety-plan default.
- **T4** — Psychiatric — NMC-licensed psychiatrist primary; psychotherapy adjunct via T2 psychologist if requested.
- **T5** — Crisis — JC outreach within 2h SLA + Vandrevala/iCall presented immediately; no booking surface.

### 6.3 Worked routing examples

See §10 for the 10 normative test cases the routing engine must pass.

---

## 7 · Safety path (C-SSRS short-circuit)

### 7.1 Trigger conditions

Any of the following on S5:

- `cssrs_3` = yes (ideation with method)
- `cssrs_4` = yes (intent)
- `cssrs_5` = yes (plan)
- `cssrs_6` = yes (preparatory behaviour or attempt — past month)

**Items 1 + 2 alone:** do **not** trigger short-circuit in V1; instead set `safety_flags.cssrs_item1` / `cssrs_item2` true, proceed to S6 normally, and surface the flag to the assigned MHP on their session-prep screen. See §13 Q6 — CF may overrule.

### 7.2 Behaviour

1. **Immediate UI transition** to the Crisis Resources screen (no consent required to view).
2. **No booking offered.** S6 is skipped entirely.
3. **JSON submission still happens** — server endpoint is `/api/intake/submit-crisis` (separate from the normal submit), which:
   - Persists a minimal `intake_submissions` row with `track=T5`, `safety_flags`, the user's locale and (if collected) email/phone from any earlier opt-in lead capture.
   - Inserts a row into `safety_alerts` with SLA timer.
   - Dispatches MSG91 WhatsApp template `safety_net` to the JC on-call number.
   - Inserts an `audit_log` row with `event=cssrs_positive_intake`.
4. **Crisis Resources screen content:**
   - Vandrevala Foundation 24/7: **1860-2662-345** + **+91 9999666555** (WhatsApp).
   - iCall (TISS): **+91 9152987821** (Mon–Sat 8a–8p).
   - AASRA: **+91 9820466726** (24/7).
   - Emergency: **112**.
   - One sentence: "A counsellor from our team will reach out within 2 hours via WhatsApp." (Only shown if user provided contact via opt-in lead capture; otherwise omitted.)
   - "If you can stay safe right now, please call one of the numbers above."
- All numbers are tap-to-dial on mobile.
- HI translations of all labels (Vandrevala etc keep their EN names; the surrounding copy is HI).

### 7.3 SLA

- Per Action Plan W5 Fri: alert delivers within 2h to JC. JC follows up via WhatsApp `safety_net` template.
- Per Action Plan W10 Fri: dry-run simulates a C-SSRS positive *outside MHP hours* and verifies SLA met.

### 7.4 What the patient does NOT see

- Their assigned MHP (because none yet).
- A booking CTA.
- Any payment screen.
- Any reference to "Track 5" — the screen is framed in safety language only.

---

## 8 · Data shapes

### 8.1 localStorage draft schema (V1)

Stored under key `saday.intake.draft.v1`. Single string (JSON.stringify).

```json
{
  "version": "intake.v1.0.0",
  "draftId": "uuid-v4",
  "createdAt": "2026-04-25T18:30:11.000Z",
  "updatedAt": "2026-04-25T18:34:02.000Z",
  "expiresAt": "2026-05-02T18:30:11.000Z",
  "locale": "en",
  "screen": 4,
  "answers": {
    "S1": { "who_for": "self" },
    "S2": { "age_band": "25_34" },
    "S3": { "clusters": ["mood", "anxiety"] },
    "S4": { "duration": "1_3m", "impact_areas": ["work_study", "relationships"] },
    "S5": {
      "contextual": {
        "mood": { "phq2_1": 2, "phq2_2": 2, "mania_screen": false },
        "anxiety": { "gad2_1": 2, "gad2_2": 2 }
      },
      "cssrs": { "item1": false, "item2": false }
    },
    "S6": null
  },
  "leadCapture": { "email": null, "consentToReengage": false }
}
```

**Forward-compat rule:** if `version` mismatches the current build's `INTAKE_VERSION`, drop the draft silently and reload S0. (No migration logic in V1.)

### 8.2 JSON export shape (POST `/api/intake/submit` in W5; "Download JSON" button in W2 prototype)

> **Phase distinction:** In W2 prototype this exact shape is what the "Download JSON" button produces (everything generated client-side; ipHash/userAgentHash null). In W5 backend port, the client posts a subset (`answers`, `account`, `consent`, `audit.draftDurationSec`, `audit.turnstileToken`); the server adds `submissionId`, `submittedAt`, `routing` (from §6), `audit.consentTranscriptHash`, `audit.ipHash`, `audit.userAgentHash` server-side and persists the augmented record.

```json
{
  "intakeVersion": "v1.0.0",
  "submissionId": "uuid-v4",
  "submittedAt": "2026-04-25T18:38:14.000Z",
  "locale": "en",
  "ageBand": "25_34",
  "answers": {
    "clusters": ["mood", "anxiety"],
    "primaryConcern": "mood",
    "duration": "1_3m",
    "impactAreas": ["work_study", "relationships"],
    "contextual": {
      "mood": { "phq2_1": 2, "phq2_2": 2, "mania_screen": false },
      "anxiety": { "gad2_1": 2, "gad2_2": 2 }
    },
    "cssrs": { "item1": false, "item2": false }
  },
  "routing": {
    "track": "T2",
    "primaryConcern": "mood",
    "recommendedTools": ["PHQ-9", "GAD-7"],
    "overridesApplied": [],
    "safetyFlags": {
      "cssrs_item1": false,
      "cssrs_item2": false,
      "cssrs_item3_plus": false,
      "mania_screen_positive": false
    }
  },
  "account": {
    "email": "user@example.com",
    "phone": "+919876543210"
  },
  "consent": {
    "privacyVersion": "1.0",
    "telemedVersion": "1.0",
    "consentTimestamp": "2026-04-25T18:38:09.000Z"
  },
  "audit": {
    "consentTranscriptHash": "sha256:f3c2…",
    "ipHash": "sha256:9a1b…",
    "userAgentHash": "sha256:cc40…",
    "draftDurationSec": 213,
    "turnstileToken": "<opaque>"
  }
}
```

### 8.3 JSON export shape (POST `/api/intake/submit-crisis`)

```json
{
  "intakeVersion": "v1.0.0",
  "submissionId": "uuid-v4",
  "submittedAt": "2026-04-25T18:33:01.000Z",
  "locale": "en",
  "ageBand": "25_34",
  "answers": {
    "clusters": ["mood"],
    "duration": "3_6m",
    "impactAreas": ["work_study", "sleep_appetite", "physical_health"],
    "cssrs": { "item1": true, "item2": true, "item3": true }
  },
  "routing": {
    "track": "T5",
    "safetyFlags": {
      "cssrs_item1": true,
      "cssrs_item2": true,
      "cssrs_item3_plus": true
    }
  },
  "leadCapture": { "email": "user@example.com" },
  "audit": { "consentTranscriptHash": null, "ipHash": "sha256:…", "draftDurationSec": 145 }
}
```

Note: no `consent` block; no `account`; minimal answers (no contextual data outside cssrs); a `leadCapture` block only if user opted in earlier. The server still inserts a row but with `consent_status='not_required_crisis_path'`.

### 8.4 Database mapping (preview — full DDL in `data-model.md` W1 Wed)

```
intake_submissions
  id              uuid pk
  patient_id      uuid fk → patients(id)        nullable for crisis-path pre-account
  submitted_at    timestamptz  not null
  locale          char(2)      not null
  intake_version  text         not null
  age_band        text         not null
  clusters        text[]       not null
  primary_concern text
  duration        text
  impact_areas    text[]
  contextual      jsonb        not null
  cssrs           jsonb        not null
  track           text         not null         -- T1..T5
  recommended_tools text[]     not null
  overrides_applied jsonb      not null default '[]'
  safety_flags    jsonb        not null
  consent_privacy_version  text
  consent_telemed_version  text
  consent_transcript_hash  text
  draft_duration_sec       int
  -- RLS: patient sees own row; MHP sees if assigned to patient; admin: see §architecture.md
```

---

## 9 · Anti-scrape & IP protection

Replaces the "signup wall" pattern (D3) with defenses that protect routing IP without sacrificing intake conversion.

| # | Control | Where | What it stops |
|---|---|---|---|
| C1 | **Server-side routing.** Cluster→track mapping (§6) lives only in the `/api/intake/route` and `/api/intake/submit` server code. Client never imports the routing table; client posts answers, server returns `{track, recommendedTools}`. | Backend (W5) | Reverse-engineering routing logic from client JS. |
| C2 | **Cloudflare Turnstile** invisible challenge mounted on S0; token revalidated server-side at every state transition. | S0 + every POST | Headless-browser scraping. |
| C3 | **Per-IP rate limit:** 20 draft creates / 24h, 5 submits / 24h. Returns HTTP 429 with neutral copy. | API gateway | Bulk crawl. |
| C4 | **Consent transcript hashing.** Server computes `sha256(normalized_answers + tool_versions + consent_versions + submitted_at)` and stores it; the patient's downloadable PDF receipt embeds this hash. | Submit endpoint | Tampering / impersonation; provides audit-grade provenance. |
| C5 | **Opt-in lead capture between S3↔S4** is the *only* identity touchpoint pre-S6. Email-only, no OTP, non-blocking. Captures engaged-user emails for re-engagement without gating anyone. | S3↔S4 interstitial | Loss of funnel telemetry; abandoned-intake recovery. |
| C6 | **No exposed cluster→tool mapping in client.** S5 contextual question packs come from `/api/intake/contextual?clusters=mood,anxiety` (server returns the right items). Client never sees the full taxonomy. | Backend (W5) | Reverse-engineering tool selection logic. |

For Phase 1 prototype (W2, no backend): all routing runs client-side. C1 + C6 are deferred to W5 port. The prototype documents the controls so the backend port doesn't drop them.

---

## 10 · Synthetic test cases (intake-test-cases.md draft)

These 10 cases are the W2 Fri DoD — the routing engine must produce the expected track for each. CF signs off W2 Wed; if any case routes wrong, change the routing table (§6), not the case.

> Notation: `phq2_1`/`phq2_2` etc are 0–3 Likert answers. `cssrs_n` is yes/no.

| # | Patient sketch | Inputs (S1–S5) | Expected track | Expected primary concern | Expected tools | Expected overrides |
|---|---|---|---|---|---|---|
| TC-01 | 28F, mild mood+sleep | clusters=[mood,sleep], duration=2_4w, impact=[work_study], mood{phq2_1=1, phq2_2=2, mania=no}, sleep{isi_1=2}, cssrs{1=no,2=no} | **T2** | mood | PHQ-9, ISI | none |
| TC-02 | 35M, severe mood alone | clusters=[mood], duration=3_6m, impact=[work_study,relationships,physical_health], mood{phq2_1=3, phq2_2=3, mania=no}, cssrs{1=no,2=no} | **T3** | mood | PHQ-9 | mood T2→T3 (PHQ-2≥5 + chronic + impaired) |
| TC-03 | 22F, anxiety+stress | clusters=[anxiety,stress], duration=1_3m, impact=[work_study], anx{gad2_1=2,gad2_2=2}, stress{pss4=8}, cssrs{1=no,2=no} | **T2** | anxiety | GAD-7, PSS-10 | none |
| TC-04 | 40F, trauma+mood | clusters=[trauma,mood], duration=gt_6m, impact=[relationships,sleep_appetite], mood{phq2_1=2,phq2_2=2,mania=no}, trauma{event=yes,intrusion=yes}, cssrs{1=no,2=no} | **T3** | trauma | PCL-5, PHQ-9 | trauma stays T3 (severity-wins over mood T2) |
| TC-05 | 30M, focus only, ASRS+ | clusters=[focus], duration=gt_6m, impact=[work_study], focus{asrs_part_a=5/6}, cssrs{1=no,2=no} | **T4** | focus | ASRS-v1.1 | focus default T4 (ASRS+) |
| TC-06 | 29F, substance+stress | clusters=[substance,stress], duration=3_6m, impact=[relationships,physical_health], substance{auditc=7}, stress{pss4=10}, cssrs{1=no,2=no} | **T4** | substance | AUDIT-full, PSS-10 | substance stays T4 (AUDIT-C≥4); +addiction-trained filter (≥6) |
| TC-07 | 19F, eating | clusters=[eating], duration=2_4w, impact=[physical_health], eating{scoff=4}, cssrs{1=no,2=no} | **T3** | eating | SCOFF-full | eating T3 + ED-trained filter + medical-monitoring flag (SCOFF≥3 + young) |
| TC-08 | 33M, stress+sleep, no severity | clusters=[stress,sleep], duration=2_4w, impact=[none], stress{pss4=6}, sleep{isi_1=2}, cssrs{1=no,2=no} | **T1** | stress | PSS-10, ISI | sleep rolls into T1 (no upward override) |
| TC-09 | 27F, mood+anxiety+trauma all moderate | clusters=[mood,anxiety,trauma], duration=3_6m, impact=[relationships], mood{phq2=4,mania=no}, anx{gad2=3}, trauma{event=yes,intrusion=yes}, cssrs{1=no,2=no} | **T3 after disambiguation** (trauma highest tier alone — actually trauma=T3, mood=T2, anxiety=T2; trauma wins outright, no tie). | trauma | PCL-5, PHQ-9, GAD-7 | none. Server returns track without disambiguation. |
| TC-10 | 25M, mood + active SI | clusters=[mood], duration=1_3m, impact=[work_study,sleep_appetite], mood{phq2=4,mania=no}, cssrs{1=yes,2=yes,3=yes,4=no,5=no,6=no} | **T5 short-circuit** | n/a | C-SSRS-full | safety_flags.cssrs_item3_plus=true; JC alert dispatched; no booking offered |

**Edge case TC-09 note:** the original case design intended a tied-tier scenario. Because the §5 default-track table assigns trauma=T3 and mood/anxiety=T2, this case resolves cleanly without disambiguation. **A true tied case** (for the test suite) is:
- TC-09b: clusters=[trauma,eating], both default T3, neither overridden → server must return `needs_disambiguation: true, options: [trauma, eating]` and require client to re-post with `primary_concern` set.

CF: if you want a *third* class of test (deliberately asking the engine to fail safely), add TC-11: malformed input (e.g., `clusters=[]`). Expected: 400 with `error.code = 'intake.invalid_clusters'`.

---

## 11 · Locale strategy

### 11.1 File layout (W2 Mon)

```
docs/intake-locale.en.json
docs/intake-locale.hi.json
```

Both files are flat key-value JSON with the same key set. HI file ships W2 Mon with EN values as fallback; CF replaces with culturally-adapted phrasings (NOT direct translations) by W2 Wed.

### 11.2 Key naming

`{screen}.{element}.{detail}` — examples: `s3.cluster.mood.label`, `s5.cssrs.1`, `s6.error_consent`.

### 11.3 Locale picker

Per **D7**: top-right of S0 only, two buttons "EN | हिंदी", `aria-pressed` state. Selection persists in `saday.intake.draft.v1.locale`. Never re-prompted within an intake. Footer of every screen has a tiny static "Switched to wrong language? [Restart]" link that wipes the draft and reloads S0.

### 11.4 Anti-direct-translation rule

CF must replace, not translate, clinical phrasings — especially: "depression" (not "अवसाद"; use "लगातार उदास / खाली महसूस होना"), "anxiety" (not "चिंता" alone; use "बेचैनी, लगातार चिंता"), "self-harm" (use full descriptor, not the loanword).

---

## 12 · Accessibility & UX rules (anti-Tealfeed posture)

Every input is labelled. Tealfeed had 102 unlabelled inputs (see Action Plan R-16). We do not.

- Every `<input>`, `<select>`, `<textarea>` has a programmatic `<label for=…>` or `aria-label`.
- Every error is announced via `role="alert"` and visible inline below the field.
- Tap targets ≥ 48×48 px.
- Contrast ≥ 4.5:1 normal, 3:1 large; verified with axe-core in CI.
- Keyboard: full traversal, visible focus, no traps. Modal close on Esc.
- Screen-reader: progress is announced ("Step 3 of 7"). Cluster chips are a `role="group"` of checkboxes with `aria-label` summarising the group purpose.
- Reduced motion: any transition > 200ms is disabled when `prefers-reduced-motion: reduce`.
- Lighthouse target: ≥ 90 mobile (Action Plan W10 Thu).

---

## 13 · Open questions (pre-CF review)

These are intentionally unresolved; CF gives the call W2 Wed. Each has a default I'll ship if no decision arrives by W2 Tue EOD.

| # | Question | My default if CF silent |
|---|---|---|
| Q1 | Should the mania-screen item appear under `mood` or as a separate universal item? | Under mood. Reduces friction; rare false-negatives from non-mood patients with bipolar are caught by post-booking MDQ if T2 MHP suspects. |
| Q2 | Cluster-chip example copy — does CF want a longer descriptor or one-liner? | One-liner per §5. Matches mobile-first compactness. |
| Q3 | Order of contextual sections on S5 when multiple clusters | Order = order of selection on S3 (user-defined). |
| Q4 | Should the "primary concern" disambiguation appear on S5 inline or as a dedicated S5b? | Inline at bottom of S5, only when triggered (no extra screen). |
| Q5 | Wording of T5 crisis screen — do we name the platform's role or stay neutral? | Neutral, third-party-resource-forward. We say "If you'd like, our team can also reach out within 2h" only if a contact was captured. |
| Q6 | **Should `cssrs_2` positive alone (yes ideation, no method/intent/plan/prep) trigger T5 short-circuit, or proceed to S6 with a flag the assigned MHP sees pre-session?** Current spec: proceed to S6, store `safety_flags.cssrs_item2=true`, MHP sees it on session-prep screen. | Proceed to S6 with flag. CF can argue for short-circuit; if so, change §7.1 trigger to "any cssrs item ≥ 2 = yes". Trade-off: short-circuit is safer but costs ~5–10% of legitimate bookings (per published ED-screening literature). |
| Q7 | **AUDIT-C cutoff is sex-specific in the literature (≥3 women, ≥4 men).** V1 doesn't capture sex on intake. Single threshold of ≥4 = conservative for women, standard for men. Do we want to capture sex on S2? | No — keep single ≥4 threshold; capture sex on the post-intake bio screen. Avoid demographic questions in intake itself (friction + DPDP minimisation). |

---

## 14 · V1.5+ deferrals

Recorded so they don't become V1 scope creep (Action Plan R-15).

- Proxy / family-led intake (S1 "for someone else").
- 16–17 with guardian consent flow.
- Cross-device draft resume via magic-link.
- Voice-driven intake (accessibility win + Tier 3 reach).
- Additional clusters: OCD (OCI-R), personality features (MSI-BPD), psychosis screen.
- More than 4 cluster selections; alternative interaction patterns (free-text triage with LLM categorisation).
- Multilingual beyond EN/HI (Marathi, Tamil, Bengali — V2).
- Adaptive question reduction (skip questions if highly correlated answer already given).
- Symptom-trajectory follow-up at 7d / 30d to recompute track.

---

## 15 · Definition of Done — intake-spec.md

- [x] 7 screens specified end-to-end with fields, validation, i18n keys, accessibility, exits.
- [x] 8-cluster taxonomy with EN labels, HI placeholders, default tools, default tracks.
- [x] Routing engine algorithm + severity-override table.
- [x] Safety path (C-SSRS) with trigger conditions, behaviour, content, SLA.
- [x] localStorage schema + JSON export shape (normal + crisis).
- [x] Anti-scrape controls documented.
- [x] 10 synthetic test cases for routing.
- [x] Locale strategy + anti-direct-translation rule.
- [x] Accessibility rules referencing Tealfeed gap.
- [x] Open questions + V1.5 deferrals captured.
- [ ] **CF clinical sign-off** (W2 Wed) — pending.
- [ ] **DES low-fi sketches** (W2 Tue) — pending; uses this spec as the truth.
- [ ] **5-tester revalidation** (W3) — bumps spec to v2.

---

## 16 · References

- `docs/Saday_Action_Plan_by_Claude.md` — Phase 0 W1 Tue + Phase 1 W2 (intake prototype DoD).
- `docs/Saday_Master_Blueprint.html` — §5 (intake), §6 (tool library), §7 (routing), §10 (safety), §14 (compliance).
- `docs/user-flows.html` — patient-facing narrative; **note:** that doc currently shows a Screen 5b for C-SSRS and a guardian-consent path on S2 — both supersede by **D2** and **D6** here. Update user-flows.html accordingly W2 Mon.
- `docs/Swasthmind CRM/SwasthMind_CRM_Phase3_Flows.md` — confirms Swasthmind has no structured intake (validates the moat).
- `docs/Swasthmind CRM/SwasthMind_CRM_Phase2_Assessments_MySchedule.md` — confirms manual-assessments is broken in Swasthmind (validates our tool-library + version-locked approach).
- C-SSRS standard: Posner et al. 2011, Columbia Lighthouse Project (public domain).
- PHQ-9, GAD-7, AUDIT-C, MDQ, ASRS-v1.1, PCL-5, OCI-R, MSI-BPD, SCOFF, PSS-10, ISI: respective publishing institutions; all in 12-tool library (`docs/tool-library.json` W1 Thu).

---

**Maintainer:** CTO · drafted by Claude (AI) on 2026-04-25.
**Next revision:** v2 after W3 5-tester findings.
**Supersedes:** none (first version).

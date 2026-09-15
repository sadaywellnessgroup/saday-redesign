# Clinical core — data model & rules

**A build spec derived from the MantraCare teardown.** Opinionated, and yours to cut. Every rule here exists because the scan found a specific failure; each one cites what it fixes so you can argue with it on the merits.

Scope: the clinical record, risk, assessments and note lifecycle. Deliberately excludes scheduling, billing and marketplace — those were sound enough at MantraCare to borrow rather than redesign.

---

## The core problem this fixes

MantraCare has **no longitudinal clinical record.** Clinical facts are scattered across three surfaces that never reconcile:

| Clinical fact | Where it lives at MantraCare | Consequence |
|---|---|---|
| Chief complaint, history, allergies | Only inside a **prescription** document | A therapist who never prescribes has nowhere to record any of it |
| Diagnosis | Prescription, or a separate note template | No diagnosis on the record; none on the invoice |
| Medications | **Free text** on the session note **and** structured on the prescription | Two stores, never reconciled, no single current list |
| Risk | A 4-option enum on one note | No history, no severity, no follow-through |
| Client status | "Active / Inactive" meaning *order active* | Commercial state standing in for clinical state |

So the first design commitment: **the client record is the clinical record.** Notes, prescriptions and assessments write *into* it; none of them own a fact exclusively.

---

## Entities

### `Client`
Identity and demographics only. No clinical data, no commercial state.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | Never displayed twice on one screen *(MantraCare renders its record ID twice)* |
| `given_name`, `family_name` | string | ✓ / — | |
| `preferred_name` | string | — | Use it everywhere the client is addressed |
| `pronouns` | string | — | Free text, not an enum |
| `date_of_birth` | date | ✓ | **Absent at MantraCare.** Required: dosing, risk stratification, safeguarding, insurance all need it |
| `sex_at_birth` | enum | — | Clinically distinct from gender; needed for some dosing and screening |
| `gender_identity` | string | — | |
| `email`, `phone` | string | ≥1 | |
| `address` | struct | — | Required *before* an insurance claim or lab order, not at creation |
| `emergency_contact` | struct | — | name, relationship, phone. **Absent at MantraCare.** Prompt at first clinical encounter |
| `gp_or_pcp` | struct | — | For escalation and duty-of-care correspondence |
| `referral_source` | enum + free text | — | Absent at MantraCare; you need it for channel economics |
| `created_by`, `created_at` | — | ✓ | |

**Rule — one human, one record.** MantraCare requires a separate client record per service line, because `service` is a required field on creation. Model service as a property of the *episode*, not the person.

### `Episode`
A course of care. One client may have several over time, and more than one open at once (therapy + psychiatry).

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | fk | ✓ | |
| `service_line` | enum | ✓ | therapy, psychiatry, … |
| `clinician_id` | fk | ✓ | |
| `clinical_status` | enum | ✓ | `intake` · `in_treatment` · `on_hold` · `discharged` · `transferred` — **separate from any billing status** |
| `opened_at`, `closed_at` | datetime | ✓ / — | |
| `discharge_reason` | enum | — | completed, disengaged, referred out, transferred, deceased |
| `consent_ids` | fk[] | ✓ | See the consent rule below |

**Rule — clinical status is never derived from payment.** A client whose subscription lapsed is not clinically "Inactive". These are orthogonal; store both, never conflate.

### `ProblemListEntry`
The client's active clinical picture. Absent entirely at MantraCare.

| Field | Type | Req | Notes |
|---|---|---|---|
| `episode_id` | fk | ✓ | |
| `code_system` | enum | ✓ | `icd10` · `icd11` · `dsm5tr` · `free_text` |
| `code`, `label` | string | ✓ | `free_text` permitted, but flagged as uncoded in billing |
| `status` | enum | ✓ | `active` · `in_remission` · `resolved` · `ruled_out` |
| `onset`, `resolved_at` | date | — | |
| `recorded_by`, `recorded_at` | — | ✓ | |

This is what populates the diagnosis field on a claim. **MantraCare's invoice has no ICD or CPT field at all despite offering an Insurance bill type** — an unadjudicable claim.

### `MedicationEntry`
**One list per client.** Not per prescription, not per note.

| Field | Type | Req | Notes |
|---|---|---|---|
| `client_id` | fk | ✓ | Client-scoped, not episode-scoped — drugs interact across episodes |
| `drug_id` | fk → drug database | ✓ | See the drug-data rule |
| `dose_amount`, `dose_unit`, `route`, `frequency` | structured | ✓ | Never a single free-text string |
| `status` | enum | ✓ | `active` · `stopped` · `held` · `historical` |
| `prescriber` | enum | ✓ | `internal` · `external` — you must record drugs you didn't prescribe |
| `started_at`, `stopped_at`, `stop_reason` | — | — | |
| `source_prescription_id` | fk | — | Null for externally-prescribed |

**Rule — never store a medication as prose.** MantraCare's session note has a free-text `Medications` box alongside a structured prescription module. The two cannot reconcile, so neither can be trusted.

**Rule — drug data is licensed, never hand-seeded.** MantraCare's formulary pairs brand names with the wrong active ingredients across 51 entries (Cymbalta → escitalopram, Wellbutrin → mirtazapine, Paxil → sertraline). Use First Databank or Medi-Span commercially; **RxNorm + DailyMed** as a free baseline. The drug table is a synced external dataset with a version stamp — never a table anyone on your team edits by hand.

**Required checks at prescribe time**, none of which MantraCare performs:
- drug–drug interaction against the full active list
- drug–allergy against `AllergyEntry`
- duplicate-therapy within class
- dose range validation by age and indication *(MantraCare offers escitalopram at 30 mg, above its usual 20 mg maximum)*

### `AllergyEntry`
`substance` · `reaction` · `severity` (mild / moderate / severe / anaphylaxis) · `status` · `recorded_by`. Blocks prescribing on match.

---

## Risk assessment

MantraCare's entire risk model is one optional enum on one note template: `None / Suicidal Ideation / Homicidal Ideation / Other`. No severity, no history, no required action. A dedicated "Suicide Risk Assessment" template exists separately, so the assessment is something you must remember to choose rather than something the system ensures.

### `RiskAssessment`
A first-class record with its own history — not a field on a note.

| Field | Type | Req | Notes |
|---|---|---|---|
| `episode_id`, `encounter_id` | fk | ✓ | |
| `domain` | enum | ✓ | `self_harm` · `suicide` · `harm_to_others` · `neglect` · `safeguarding_child` · `safeguarding_adult` |
| `ideation` | enum | ✓ | `none` · `passive` · `active` |
| `intent` | enum | cond | required when ideation is active |
| `plan` | enum | cond | `none` · `vague` · `specific` |
| `means_access` | enum | cond | `none` · `possible` · `ready_access` |
| `timeframe` | enum | cond | |
| `protective_factors` | text | — | Required when any risk is recorded — genuinely changes disposition |
| `history_of_attempts` | bool + detail | ✓ | |
| `overall_level` | enum | ✓ | `none` · `low` · `moderate` · `high` · `imminent` — derived, clinician-overridable, override requires a reason |
| `actions_taken` | enum[] | cond | **required when level ≥ moderate** |
| `safety_plan_id` | fk | cond | **required when level ≥ moderate** |
| `review_due` | date | cond | required when level ≥ moderate |

**Rule — risk ≥ moderate blocks note sign-off** until `actions_taken` and a safety plan are present. This is the single most important rule in this document. A system that lets a clinician record active suicidal ideation and close the note with nothing else required is not a clinical system.

**Rule — surface risk on the caseload list.** MantraCare's client table shows name, onboarding state and commercial status — nothing triageable. Your list needs a risk indicator, last contact, next appointment and overdue review, so a caseload can be scanned in ten seconds.

**Rule — never let a disclosure fall into a score.** MantraCare's anger quiz has an item disclosing physical violence toward others; it contributes to a band and triggers nothing. Any instrument item touching self-harm, harm to others or safeguarding raises a flag on submission, independent of total score.

---

## Assessments

The failure mode to design against: MantraCare's six free screeners are real instruments — GAD-7 verbatim, PHQ-9 minus its anhedonia item, DASS items with the anxiety and stress subscales mixed and a foreign response scale bolted on, the Relationship Assessment Scale item-for-item — none named, none attributed, all reported under borrowed PHQ-9 severity bands.

### `Instrument` (registry, versioned, read-only to clinicians)

| Field | Notes |
|---|---|
| `key`, `name`, `version` | e.g. `phq9` / "Patient Health Questionnaire-9" / `v1` |
| `attribution` | Author, year, and licence terms. **Rendered with every administration and every result.** |
| `licence` | `public_domain` · `free_with_attribution` · `licensed` · `proprietary` |
| `items[]` | Full item set, verbatim, ordered |
| `response_scale` | The instrument's own scale — never substituted |
| `scoring` | Algorithm + the score range it produces |
| `bands[]` | Cut-offs **belonging to this instrument at this version** |
| `flag_items[]` | Items that raise a risk flag regardless of score (PHQ-9 item 9) |

**Rule — an instrument is rendered whole or not at all.** No dropping items, no mixing subscales, no substituting response scales. If you need a shorter screener, use one that was validated short (PHQ-2, GAD-2) rather than truncating a longer one.

**Rule — bands travel with the instrument version.** Never apply one instrument's severity labels to another's score. "Moderately Severe" is PHQ-9's word for a specific range on a specific scale.

**Rule — administration mode is enforced.** HAM-A, HAM-D, Y-BOCS, PANSS and MCMI are **clinician-administered**. MantraCare's consumer site states this correctly and its provider portal still puts a **Send** button on them. Store `administration_mode` on the instrument and let the UI offer only what the mode permits.

### `AssessmentResult`
`instrument_key` + `instrument_version` (both stored, never just the name) · `raw_responses[]` · `score` · `band` · `administered_by` · `mode` · `completed_at` · `flags_raised[]`

**Rule — the recommendation depends on the score.** Every MantraCare band, including "Perfectly fine", ends with "schedule an appointment with a therapist". A screening result that recommends the same action at every level is a conversion step wearing a triage costume. Include a genuine no-action-needed path.

---

## Note lifecycle

MantraCare's note editor has two buttons: Cancel and Save Note. No draft state, no autosave indicator, no signature, no lock, no amendment trail — on a legal clinical document.

### `Note` states
`draft` → `signed` → (`amended`*) · optional `cosign_pending` → `cosigned`

| Rule | Why |
|---|---|
| Autosave drafts continuously, with a visible "saved at" indicator | |
| **Signing locks content.** Post-signature changes create an `Amendment` with author, timestamp and reason; the original stays retrievable | This is the audit trail MantraCare has no visible equivalent of |
| Supervisee notes route to `cosign_pending` | MantraCare sells a **Therapy Intern** tier with no supervision workflow anywhere in the portal |
| A note may be standalone, but an unattached note warns and requires a service date | MantraCare permits "Add Note Without Session" silently |
| Structured fields write through to the record | Diagnosis → problem list; meds → medication list; risk → RiskAssessment. The note is a *view*, not the store |

**Worth copying from them:** the 26-template modality-specific library (ACT, CBT, DBT, EMDR, IFS, Gottman, TF-CBT, SOAP), the 15-item structured intervention enum, file attachments on notes, and notes in ~108 languages. Their template *library* is genuinely good — it's the lifecycle around it that's missing.

---

## Consent

MantraCare's consent copy is the best-written thing in the product — the AI consent form names human review, denies AI clinical decision-making and grants a deletion right. It is also wired into nothing: three templates, zero entries, "no required forms found".

### `ConsentRecord`
`client_id` · `consent_type` · `template_version` · `granted` (bool) · `granted_at` · `signature` · `withdrawn_at`

**Rules**
- **Consent gates the capability, not the paperwork.** No AI transcription without a current `ai_transcription` consent on that client. No telehealth session without telehealth consent. Enforced server-side, not by reminding the clinician.
- **Consent is versioned.** A material change to the AI consent text re-requests it.
- **Withdrawal is one click and takes effect immediately** — including stopping transcript retention.
- **Required forms are configurable by the practice**, not only by the platform.

---

## Metering — worth borrowing wholesale

MantraCare's credit model is the best-engineered thing in their product, and it transfers directly: a shared org wallet, per-tool spend caps with an "Edit Cap" control, a usage ledger recording tool / activity / credits / timestamp, and self-serve top-ups.

Two things to do differently:
- **Don't meter safety-critical actions.** Notes, prescriptions and risk assessments must never fail or be capped for want of credits. Meter the expensive optional things — transcription minutes, AI generation, outbound messaging.
- **Don't cap caseload.** MantraCare's Free tier stops at 10 client profiles and Basic at 50, which makes a clinician's patient list the lever. Price on usage or seats; a therapist should never face "upgrade to add your 11th client".

---

## Open questions for you

1. **Jurisdiction first.** Nearly every ambiguity above resolves differently for US (HIPAA, CPT/ICD-10-CM, 42 CFR Part 2 for substance use) versus UK/EU (UK GDPR, ICO, NHS DCB0129). MantraCare's incoherence — USD pricing, INR invoices, Indian bank payouts, US insurance vocabulary, "HIPAA-compliant" at signup — is what happens when this isn't decided. Pick one first market and build to its rules.
2. **Prescribing at all?** It carries the heaviest regulatory load (e-prescribing certification, controlled substances, drug data licensing). Excluding it at v1 and recording externally-prescribed medications only is a defensible, much cheaper position.
3. **Supervision model.** If you serve trainees or group practices, co-signature is architectural, not a later feature.
4. **Who owns the record** when a client switches clinician within the practice, and what transfers.

---

## What I'd build first

1. `Client` + `Episode` + `ProblemList` + `MedicationEntry` + `AllergyEntry` — the record everything else writes into
2. `RiskAssessment` with the sign-off block at moderate and above
3. Note lifecycle with sign and lock
4. The instrument registry, seeded with properly-attributed PHQ-9, GAD-7 and DASS-21

That is the whole competitive gap. Items 2, 3 and 4 are each a few days' work, and none of them exist in the product you're measuring against.

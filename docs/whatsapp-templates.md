# Saday Wellness — WhatsApp Templates (V1)

> **File:** `docs/whatsapp-templates.md`
> **Version:** 1.0 (Phase 0 · Week 1 · Friday — slipped to Saturday)
> **Status:** DRAFT — pending CF clinical sign-off (W2 Wed) and Meta Business approval (T+24–48h after submission via MSG91)
> **Submitter:** CTO via MSG91 console after CF sign-off.
> **Audience:** CF (clinical phrasing review), CTO (submission), MSG91 admin (entry).
> **Companion to:** `docs/data-model.md` §6.7 `messages` / `conversations` / `follow_up_flows`, §6.5 `appointments`, §6.8 `safety_alerts`, `consents` (`marketing_whatsapp` vs transactional UTILITY).

---

## 0 · How to use this document

1. **W2 Wed** — CF reads §3 templates and signs off on EN copy + flags HI placeholder for translator.
2. **W2 Wed (after CF sign-off)** — CTO submits all 4 templates to MSG91 console under namespace `saday_v1`, copy-paste each block in §3.
3. **T+24–48h** — Meta approval status surfaces in MSG91. If rejected, modify per Meta's reason and resubmit. Common rejection causes documented in §5.
4. **W3 Mon** — once approved, app team wires up triggers per §4 (which app event fires which template, with which variables).

---

## 1 · Decisions log

| # | Decision | Locked value |
|---|---|---|
| **WT1** | Template categories | All 4 = **UTILITY** (transactional). Not MARKETING — none require `marketing_whatsapp` consent. Each is tied to a discrete care event the patient initiated (booking, attended session, completed an assessment). |
| **WT2** | Languages submitted at V1 | EN + HI. HI cells in §3 are translator placeholders; CF nominates a translator W2 Wed; HI submitted W3. |
| **WT3** | Header strategy | Text-only headers V1 (no media). Reduces approval friction and avoids multilingual image asset management until V1.5. |
| **WT4** | Brand presence | Footer line `— Saday Wellness · This message is confidential.` on every template. Matches Telemedicine Practice Guidelines 2020 §3.3 identity-of-sender requirement. |
| **WT5** | Button strategy | Quick-reply + URL buttons only. No phone-call buttons (we want patients to use in-app routing, not direct dial of MHPs). Safety-net is the exception — phone CTA permitted to crisis lines. |
| **WT6** | Variable safety | No diagnosis, no symptom names, no clinical jargon in body text. Recipient may not be the patient's exclusive phone holder (family-shared device cohort, ~5% per intake-spec D3). Stigma + privacy. |
| **WT7** | Consent precondition | UTILITY templates do **not** require `marketing_whatsapp = true`. They require `telemed_consent` (collected at intake S6) — without it, no transactional WhatsApp at all. Codify in app-layer dispatcher. |
| **WT8** | Rate cap | `organization_policies.whatsapp_per_patient_per_day = 3` is the global cap. Safety-net bypasses the cap (clinical override). Documented in dispatcher. |

---

## 2 · Template envelope conventions

All 4 templates share these conventions so MSG91/Meta entry is mechanical:

- **Namespace:** `saday_v1`
- **Language code:** `en` for English templates, `hi` for Hindi (submitted as separate template entries with same name; MSG91 picks by `users.preferred_language`).
- **Variable shape:** WhatsApp uses `{{1}}, {{2}}, ...` ordered. Do not reuse a number for two values.
- **Body length:** ≤ 1024 chars. All 4 below are well under.
- **Header text length:** ≤ 60 chars.
- **Footer length:** ≤ 60 chars. Same footer everywhere: `— Saday Wellness · This message is confidential.`
- **Button label length:** ≤ 25 chars.
- **URL buttons:** dynamic URL allowed via `{{1}}` style suffix; the app appends a one-shot signed token at send time (never store the public URL — see `data-model.md` A11).
- **Date/time format:** `Tue, 12 May · 4:30 PM IST`. Dispatcher formats from `appointments.scheduled_at` in `Asia/Kolkata`.
- **Patient name:** use `patients.display_name` (which may be a pseudonym — that's fine, it's the patient's choice).
- **MHP name:** `Dr <last>` for psychiatrists/clinical psychologists; `<first> <last>, <title>` for counsellors. Dispatcher pulls from `mhps.display_name` + `mhps.professional_title`.

---

## 3 · The 4 templates

### 3.1 `saday_booking_confirmation`

**Purpose:** Sent immediately after `appointments.status = 'scheduled'` and `payment_status = 'paid'` (or `complimentary` / `package_consumed`). Confirms the booking and gives a join handle.

**Category:** UTILITY  
**Language entries:** `en`, `hi`

#### EN body

```
Header:  Your Saday session is confirmed
Body:    Hi {{1}},

         Your session with {{2}} is booked for {{3}}.

         Mode: {{4}}. We'll send a join link 1 hour before the session.

         Need to reschedule or cancel? You can do it from your portal up to {{5}} hours before the session.
Footer:  — Saday Wellness · This message is confidential.
Buttons: [URL] Open my portal → {{6}}
         [QUICK_REPLY] Reschedule
         [QUICK_REPLY] Cancel
```

#### HI placeholder (CF — assign translator W2 Wed)

```
Header:  आपका Saday सेशन पक्का हो गया है
Body:    नमस्ते {{1}},

         {{2}} के साथ आपका सेशन {{3}} के लिए बुक हो गया है।

         माध्यम: {{4}}। सेशन से 1 घंटा पहले हम जॉइन लिंक भेज देंगे।

         री-शेड्यूल या रद्द करना है? सेशन से {{5}} घंटे पहले तक आप अपने पोर्टल से ख़ुद कर सकते हैं।
Footer:  — Saday Wellness · यह संदेश गोपनीय है।
Buttons: [URL] मेरा पोर्टल खोलें → {{6}}
         [QUICK_REPLY] री-शेड्यूल
         [QUICK_REPLY] रद्द करें
```

#### Variables

| # | Source | Example |
|---|---|---|
| {{1}} | `patients.display_name` | Aanya |
| {{2}} | `mhps.display_name` + title | Dr Mehta |
| {{3}} | `appointments.scheduled_at` (IST) | Tue, 12 May · 4:30 PM IST |
| {{4}} | `appointments.mode` localized | Online / Online (वीडियो) |
| {{5}} | `organization_policies.cancellation_min_notice_hours` | 8 |
| {{6}} | Signed portal URL with token | https://saday.in/p/{{token}} |

#### Rationale (for CF + Meta)

- Pure transactional UTILITY — no promotion, no opt-in dependency beyond `telemed_consent`.
- Defers the join URL to a separate 1-hour-before message. Booking-confirmation URLs sit in WhatsApp history for days, which would let anyone with the phone join the room. We mint the join URL just-in-time.
- Reschedule/cancel quick-replies route to a deep-link in the portal, not a direct API call from WhatsApp — keeps the audit trail server-side.

---

### 3.2 `saday_session_reminder_24h`

**Purpose:** Sent 24h before `appointments.scheduled_at`. Confirms upcoming session and prompts patient to confirm attendance. A second reminder fires at T-1h with the join link (separate template — V1.5 unless CTO calls for V1).

**Category:** UTILITY  
**Language entries:** `en`, `hi`

#### EN body

```
Header:  Your session is tomorrow
Body:    Hi {{1}},

         Reminder — your session with {{2}} is tomorrow at {{3}}.

         Mode: {{4}}. We'll send your join link 1 hour before the session starts.

         Can you make it?
Footer:  — Saday Wellness · This message is confidential.
Buttons: [QUICK_REPLY] Yes, I'll be there
         [QUICK_REPLY] I need to reschedule
         [URL] Open my portal → {{5}}
```

#### HI placeholder

```
Header:  आपका सेशन कल है
Body:    नमस्ते {{1}},

         याद दिलाना — {{2}} के साथ आपका सेशन कल {{3}} पर है।

         माध्यम: {{4}}। सेशन शुरू होने से 1 घंटा पहले जॉइन लिंक भेजेंगे।

         क्या आप आ पाएँगे?
Footer:  — Saday Wellness · यह संदेश गोपनीय है।
Buttons: [QUICK_REPLY] हाँ, मैं रहूँगा/रहूँगी
         [QUICK_REPLY] री-शेड्यूल चाहिए
         [URL] मेरा पोर्टल खोलें → {{5}}
```

#### Variables

| # | Source | Example |
|---|---|---|
| {{1}} | `patients.display_name` | Aanya |
| {{2}} | `mhps.display_name` + title | Dr Mehta |
| {{3}} | `appointments.scheduled_at` (IST, time only — "4:30 PM IST") | 4:30 PM IST |
| {{4}} | `appointments.mode` localized | Online |
| {{5}} | Signed portal URL | https://saday.in/p/{{token}} |

#### Dispatcher rules

- Fires from a `pg_cron` daily-or-hourly job that selects `appointments WHERE status = 'scheduled' AND scheduled_at BETWEEN now() + INTERVAL '23 hours' AND now() + INTERVAL '25 hours'` and the patient hasn't already received this template for this appointment.
- Tracked via `messages.template_id = 'saday_session_reminder_24h'` + appointment id correlation.
- Counts toward `whatsapp_per_patient_per_day` cap.

#### Rationale

- Deliberately omits the join URL — same JIT principle as booking-confirmation.
- Quick-reply confirm/reschedule reduces no-shows (Tealfeed cancellation pattern: most reschedules happen on the day before).
- Hindi quick-reply text uses gender-flexible verb form `रहूँगा/रहूँगी` — CF translator should confirm this is the right pattern or substitute.

---

### 3.3 `saday_post_session_check_in`

**Purpose:** Fires per `follow_up_flows` (`flow_kind = 'check_in'`, `trigger_offset_hours` MHP-configurable, default 48h post-session-completion). Solicits a brief structured check-in. Submission lands in `follow_up_submissions`; high-distress responses set `high_distress_flag` and surface in MHP queue.

**Category:** UTILITY  
**Language entries:** `en`, `hi`

#### EN body

```
Header:  How are you doing?
Body:    Hi {{1}},

         It's been a couple of days since your session with {{2}}. We'd love to know how you're feeling.

         Tap below to share a quick check-in — takes less than a minute.

         If you'd rather not, that's okay too. Your next session is on {{3}}.
Footer:  — Saday Wellness · This message is confidential.
Buttons: [URL] Share my check-in → {{4}}
         [QUICK_REPLY] Maybe later
```

#### HI placeholder

```
Header:  आप कैसा महसूस कर रहे/रही हैं?
Body:    नमस्ते {{1}},

         {{2}} के साथ आपके सेशन को कुछ दिन हो गए हैं। हम जानना चाहेंगे कि आप कैसा महसूस कर रहे/रही हैं।

         नीचे टैप करके एक छोटा सा चेक-इन साझा करें — एक मिनट से भी कम लगेगा।

         अगर अभी नहीं भेजना तो कोई बात नहीं। आपका अगला सेशन {{3}} को है।
Footer:  — Saday Wellness · यह संदेश गोपनीय है।
Buttons: [URL] मेरा चेक-इन भेजें → {{4}}
         [QUICK_REPLY] बाद में
```

#### Variables

| # | Source | Example |
|---|---|---|
| {{1}} | `patients.display_name` | Aanya |
| {{2}} | `mhps.display_name` + title | Dr Mehta |
| {{3}} | Next `appointments.scheduled_at` if exists, else "to be scheduled" | Tue, 26 May |
| {{4}} | Signed check-in URL (one-shot, includes `follow_up_flows.id` + `appointments.id` token) | https://saday.in/c/{{token}} |

#### Dispatcher rules

- Fires when `follow_up_flows.flow_kind = 'check_in'` matches and `trigger_offset_hours` has elapsed since `appointments.status = 'completed'`.
- Patient response routes via WhatsApp **only if** the response is one of the configured quick-replies. Free-text responses route into `conversations` and trigger AI categorisation per `data-model.md` §6.7.
- Counts toward daily cap.

#### Rationale

- Deliberately gentle / opt-out — high-distress users may experience even a check-in nudge as pressure. CF will weigh in W2 Wed.
- "Couple of days" is intentional vagueness so the same template works across `trigger_offset_hours` 24–96. CF call: do we want a more specific time mention?
- Variable {{3}} branches on next-appointment existence — dispatcher handles the empty-string vs "to be scheduled" string substitution before send.

---

### 3.4 `saday_safety_resources`

**Purpose:** Fires on a `safety_alerts` row creation (positive C-SSRS items 3–6 at intake or in-session; informant urgent-concern submission; follow-up `high_distress_flag = true`). Bypasses the daily cap (WT8). The point is to put resources in the patient's hand within minutes, not to escalate or diagnose. The justice-coordinator path runs **in parallel** server-side per intake-spec §7 — this template is the patient-facing arm only.

**Category:** UTILITY  
**Language entries:** `en`, `hi`

#### EN body

```
Header:  We're here for you
Body:    Hi {{1}},

         Thank you for sharing how you're feeling — that took courage.

         Right now, support is one tap away. Please save these numbers — they're available in many languages, free, and confidential:

         • iCall: 9152987821
         • Vandrevala Foundation: 1860-2662-345
         • AASRA: 9820466726
         • National helpline: 112

         Someone from our team will reach out within {{2}} hours. If you need to talk to someone right now, please call one of the numbers above.
Footer:  — Saday Wellness · You are not alone.
Buttons: [URL] Open my safety plan → {{3}}
         [QUICK_REPLY] I'd like a callback
```

#### HI placeholder

```
Header:  हम आपके साथ हैं
Body:    नमस्ते {{1}},

         अपनी भावनाएँ साझा करने के लिए धन्यवाद — यह एक हिम्मत भरा कदम है।

         अभी, मदद बस एक टैप दूर है। कृपया ये नंबर सेव कर लें — कई भाषाओं में, मुफ़्त और गोपनीय:

         • iCall: 9152987821
         • Vandrevala Foundation: 1860-2662-345
         • AASRA: 9820466726
         • राष्ट्रीय हेल्पलाइन: 112

         हमारी टीम से कोई आपसे {{2}} घंटों के भीतर संपर्क करेगा। अगर आपको अभी किसी से बात करनी है, तो कृपया ऊपर दिए नंबरों में से किसी को कॉल करें।
Footer:  — Saday Wellness · आप अकेले/अकेली नहीं हैं।
Buttons: [URL] मेरा सेफ्टी प्लान खोलें → {{3}}
         [QUICK_REPLY] कॉलबैक चाहिए
```

#### Variables

| # | Source | Example |
|---|---|---|
| {{1}} | `patients.display_name` | Aanya |
| {{2}} | `safety_alerts.sla_deadline` − `now()` rounded up, integer hours | 2 |
| {{3}} | Signed safety-plan URL (deep-link to `safety_plans.is_current` row, scoped to patient) | https://saday.in/s/{{token}} |

#### Dispatcher rules

- Fires from a server-side handler on `INSERT INTO safety_alerts ...`. Synchronous send (not queued) so latency is minimised.
- Bypasses `whatsapp_per_patient_per_day` cap (WT8).
- Sends regardless of `marketing_whatsapp` consent (this is care, not marketing). `telemed_consent` is sufficient — and since safety_alerts only fire post-intake-S6, that consent is always present.
- After send, `safety_alerts.whatsapp_dispatched_at = now()` and `whatsapp_template_id = 'saday_safety_resources'`. Audit log captures the send event.
- The "callback" quick-reply creates a row in `clinician_review_queue` priority `urgent` with SLA = 30 min.

#### Rationale (extended — CF please scrutinize)

- **No clinical labels.** The body never says "we're concerned about your safety" or "your screening showed". Recipient may not be the patient's exclusive phone holder. Stigma + privacy + the practical risk of a family member intercepting the message and reacting badly.
- **Helpline list is hard-coded into the template** (not variabilised) so Meta can review the resources at approval time and we don't risk a future variable injection.
- **Justice coordinator outreach is server-side, not in this template.** Per intake-spec §7.2 the JC reaches the patient within 2h via call. The WhatsApp template only puts immediate resources in hand and signals "someone will be in touch." This separation matters: WhatsApp delivery is best-effort; the JC call is the actual SLA.
- **No `[PHONE_NUMBER]` button to a crisis line** despite WT5's exception clause. Reason: the helpline numbers are inline so the patient can save/share them. A single button forces the choice — and on Android, tapping a phone button can dial without confirm. Inline numbers preserve agency.
- **"You are not alone." footer** — replaces the standard confidentiality footer for this template only. CF: keep or revert?

---

## 4 · Trigger map (which app event fires which template)

| Event (server-side) | Template | Variables source | Cap | Pre-conditions |
|---|---|---|---|---|
| `appointments.status` transitions to `'scheduled'` AND `payment_status` ∈ `('paid','complimentary','package_consumed')` | `saday_booking_confirmation` | appointment row + patient + mhp + org_policies | counts | `telemed_consent` present |
| `pg_cron` daily 09:00 IST: `appointments WHERE scheduled_at BETWEEN now() + 23h AND now() + 25h AND status='scheduled'` AND no prior reminder send for this appt | `saday_session_reminder_24h` | appointment + patient + mhp | counts | `telemed_consent` present |
| `follow_up_flows.flow_kind='check_in'` AND `appointments.status='completed'` AND `now() >= appointment.completed_at + flow.trigger_offset_hours` | `saday_post_session_check_in` | appointment + patient + mhp + next-appointment lookup | counts | `telemed_consent` present |
| `INSERT INTO safety_alerts` (any trigger_kind) | `saday_safety_resources` | patient + safety_alert.sla_deadline | **bypass cap** | `telemed_consent` (always present post-S6) |

---

## 5 · Common Meta rejection causes (anticipate)

| Cause | Mitigation in our drafts |
|---|---|
| Promotional language in UTILITY template | None of our 4 use promotional language. No discounts, no upsells, no "book again" CTAs. |
| Template-language mismatch (body says one language, header in another) | Submitted as separate `en` and `hi` entries, never mixed. |
| Variables not in sequential order | All `{{n}}` are sequential 1..N within each template. |
| URL button without {{1}} suffix when URL is dynamic | All our URL buttons use `{{N}}` suffix; static base + dynamic token at send. |
| Medical advice / diagnostic content | Safety-net deliberately does not diagnose or label. CF: confirm. |
| Generic / spammy header | Every header is specific to the template purpose. |
| Footer used for sender disclosure that doesn't match WhatsApp Business display name | Footer brand string `Saday Wellness` must match WhatsApp Business display name exactly. |

---

## 6 · App-layer safeguards (codified in `src/lib/whatsapp.ts` — W4 deliverable)

```ts
// Pseudocode — actual file lands W4 with the messaging client
async function dispatch(template: TemplateName, ctx: DispatchContext) {
  // 1. Consent gate
  const consent = await getActiveConsent(ctx.userId, 'telemed_consent');
  if (!consent) throw new ConsentMissingError(ctx.userId, 'telemed_consent');

  // 2. Daily cap (skipped for safety_resources)
  if (template !== 'saday_safety_resources') {
    const sent = await countMessagesToday(ctx.patientId);
    if (sent >= ctx.orgPolicy.whatsapp_per_patient_per_day) {
      throw new RateCapReached(ctx.patientId);
    }
  }

  // 3. Dedupe (don't send same template for same correlation key twice)
  if (await alreadySent(template, ctx.correlationId)) return;

  // 4. Mint variables — no PHI in audit
  const vars = await resolveVariables(template, ctx);

  // 5. Send via MSG91; on success persist to `messages` + `audit_log` (redacted body)
  const res = await msg91.send({ template, vars, to: ctx.phoneE164 });
  await persistMessage(res, ctx);
}
```

---

## 7 · Open questions (CF, please answer W2 Wed)

| # | Question | Default if no decision |
|---|---|---|
| Q1 | Post-session check-in default `trigger_offset_hours` per track? Same 48h for all tracks, or shorter for T3+? | 48h all tracks V1; per-track tuning V1.5 after the first 200 sessions of data. |
| Q2 | Is the gender-flexible Hindi verb form (`रहूँगा/रहूँगी`) acceptable, or should we add a separate gender-aware variable? | Use `रहूँगा/रहूँगी` form V1; separate-by-gender V1.5 once `patients.gender` coverage is high. |
| Q3 | "You are not alone." HI translation `आप अकेले/अकेली नहीं हैं।` — is this clinically appropriate, or too informal? | Keep V1; CF translator finalises W2 Wed. |
| Q4 | Should `saday_safety_resources` body include the patient's primary safety contact name (from `patients.safety_contact_*`) as an additional resource? | **No** for V1 — the safety contact's name landing in the patient's WhatsApp could escalate household tension. Surface only in the in-app safety-plan view (which is user-initiated). Reopen V1.5 if CF disagrees. |
| Q5 | Add a 5th template: T-1h join-link delivery? | Recommend yes for V1, very simple shape: header + URL button + 1-line body. Drafted in §8 below if CF/CTO concur. |
| Q6 | Sender display name on WhatsApp Business — `Saday Wellness` or `Saday`? Footer must match. | `Saday Wellness` (matches every brand surface). |

---

## 8 · Optional V1 fifth template — `saday_session_join_t1h` (PROPOSED — Q5)

> If CF/CTO say yes to Q5, add this. Submission flow same as the other 4. Drafting now to keep parity.

**Category:** UTILITY  
**Language entries:** `en`, `hi`

```
EN Header: Your session starts soon
EN Body:   Hi {{1}}, your session with {{2}} starts at {{3}}.
           Tap below to join — the link is valid for the next 90 minutes.
EN Footer: — Saday Wellness · This message is confidential.
EN Buttons:
  [URL] Join session → {{4}}
  [QUICK_REPLY] I can't make it
```

```
HI Header: आपका सेशन जल्द शुरू होगा
HI Body:   नमस्ते {{1}}, {{3}} पर {{2}} के साथ आपका सेशन है।
           जॉइन करने के लिए नीचे टैप करें — यह लिंक अगले 90 मिनट तक मान्य है।
HI Footer: — Saday Wellness · यह संदेश गोपनीय है।
HI Buttons:
  [URL] सेशन जॉइन करें → {{4}}
  [QUICK_REPLY] मैं नहीं आ पाऊँगा/पाऊँगी
```

| Var | Source |
|---|---|
| {{1}} | `patients.display_name` |
| {{2}} | `mhps.display_name` + title |
| {{3}} | Time HH:MM IST |
| {{4}} | Signed Daily.co join URL (90-min TTL) |

---

## 9 · Definition of Done — whatsapp-templates.md

- [x] 4 templates × 2 languages = 8 entries drafted with header/body/footer/buttons.
- [x] Decisions WT1–WT8 locked.
- [x] Trigger map showing app event → template → cap behaviour.
- [x] Rejection-cause anticipation table.
- [x] Open questions for CF + 1 proposed fifth template.
- [ ] **CF clinical sign-off (W2 Wed)** — phrasing, helpline list, gender-flexibility, safety-template tone.
- [ ] **HI translation by CF-nominated translator (W2 Thu)** — placeholders replaced.
- [ ] **MSG91 submission (W2 Thu/Fri)** — entries created in console, screenshots saved to `docs/_evidence/whatsapp-submissions/`.
- [ ] **Meta approval (T+24–48h)** — track in MSG91 console; document rejections + resubmission diffs.
- [ ] **App dispatcher (W4)** — `src/lib/whatsapp.ts` implements §6 safeguards and §4 trigger map.

---

## 10 · References

- `docs/Saday_Action_Plan_by_Claude.md` — Phase 0 W1 Fri deliverable.
- `docs/intake-spec.md` — §7 safety path, §6 routing, S6 consent capture.
- `docs/data-model.md` — §6.5 appointments, §6.7 conversations/messages, §6.8 safety_alerts, §6.9 organization_policies (`whatsapp_per_patient_per_day`).
- Telemedicine Practice Guidelines 2020 (MoHFW) — §3.3 sender identity in patient communications.
- DPDP 2023 §7 — purposes and notice; UTILITY templates fall under necessary processing for the requested service.
- Meta WhatsApp Business Platform — Template Categorization Guidelines (2024 update separating UTILITY / MARKETING / AUTHENTICATION).
- Indian crisis helplines: iCall (9152987821), Vandrevala Foundation (1860-2662-345), AASRA (9820466726), National helpline 112.

---

**Maintainer:** CTO · drafted by Claude on 2026-04-26.
**Next revision:** v1.1 after CF sign-off (W2 Wed). v1.2 after HI translation (W2 Thu). v2.0 after Meta approval (W3).
**Supersedes:** none.

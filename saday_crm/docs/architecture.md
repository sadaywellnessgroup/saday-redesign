# Saday Consultation CRM — Architecture (P0.1, v1.0, 2026-09-17)

Binding on P1–P6. Every statement here traces to a LOCKED row in `DECISION_LOG.md` or to `BUILD_PLAN.md` §2/§3. Anything genuinely Saday's to choose sits in §14, not decided here. Companion: `supabase/migrations/0001_schema.sql`.

---

## 1 · Stack & topology

| Layer | Choice | Notes |
|---|---|---|
| App | Next.js 15 App Router, TypeScript, Tailwind | Design tokens ported from main site (D-002) |
| Runtime | Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`) | `app.sadaywellness.com` (D-010) |
| Data / Auth / Storage | Supabase, project region **ap-south-1 (Mumbai)** | RLS is the primary PHI gate (D-010) |
| Payments | Razorpay (adapter) | D-012 |
| Video | 100ms, Mumbai region, no recording (adapter) | D-013 |
| WhatsApp | BSP TBD (adapter) | D-015 open |
| Email | Resend or SES (adapter) | §14 Q2 |
| Errors | Sentry, PHI scrubber before transport | §7 |
| i18n | `next-intl` | EN/HI patient surfaces, EN console (D-019) |

Topology: browser → Cloudflare Worker (SSR + route handlers) → Supabase and adapter targets. **No direct browser→Postgres writes for clinical data**: every mutation goes through a route handler holding the user's cookie session, so RLS applies as the user. `service_role` is used only in webhook handlers, the cron worker, and migrations. Main site (`sadaywellness.com`) is untouched (D-010); design tokens are copied, not imported.

---

## 2 · Roles & auth

Three roles: `patient`, `provider`, `admin` (BUILD_PLAN §2).

| Role | Factor 1 | Factor 2 | Session |
|---|---|---|---|
| patient | Phone OTP (Supabase Auth phone provider, delivery behind `OtpSender`: WhatsApp first, SMS fallback) | — | HttpOnly cookie |
| provider | Email + password (Supabase Auth) | **TOTP mandatory** (Supabase MFA `aal2`) | HttpOnly cookie |
| admin | Email + password | **TOTP mandatory** (`aal2`) | HttpOnly cookie |

- Cookies are written and refreshed by `@supabase/ssr` (`createServerClient` in middleware + route handlers). No token ever touches `localStorage`/`sessionStorage`.
- **JWT custom claim `user_role`** is injected by a Supabase `custom_access_token_hook` copying `public.users.role` into the access token; `current_user_role()` reads it. If the hook is not enabled the claim is NULL and **every policy denies** — the intended failure mode, asserted by the P1 RLS suite.
- **Identity bridge:** `auth.users.id` ≠ `public.users.id`. Policies resolve through `public.users.auth_user_id` via `current_user_id()`. Never compare `users.id = auth.uid()`.
- Staff step-up: middleware rejects any `/provider/*` or `/admin/*` request whose JWT `aal` is not `aal2`. Idle timeout is enforced server-side: 15 min staff, 30 min patient.
- Supabase phone OTP handles *verification*; delivery is proxied through `OtpSender`, so the BSP can change without touching auth (D-025).

---

## 3 · RLS policy map

**Rule: default deny.** Every table gets `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY` (so the table owner is subject too). There is no `USING (true)` fallback anywhere except `audit_log` INSERT. `service_role` bypasses RLS by role attribute and is confined to the three call sites in §1.

Shorthand: **own** = row belongs to the calling patient; **assigned** = the calling provider has ≥1 appointment with that patient (`app_provider_treats()`); **meta** = admin sees the row but the table carries no clinical body; **—** = no policy, i.e. invisible.

| Table | patient | provider | admin |
|---|---|---|---|
| organizations | S | S | S |
| organization_policies | S | S | S,U |
| users | S own | S own | S,I,U |
| user_roles | S | S | S |
| patients | S,U own | S assigned | S,I,U (meta) |
| providers | S (active only) | S,U own | S,I,U |
| provider_session_types | S (active) | S,I,U own | S,U |
| provider_availability_rules | S (active) | S,I,U own | S |
| provider_blockouts | — | S,I,U own | S |
| appointments | S,I own | S,U own | S,U (meta) |
| payments | S own | — | S,U |
| refunds | S own | — | S,I,U |
| earnings_ledger | — | S own | S,I,U |
| payouts | — | S own | S,I,U |
| **session_notes** | — | S,I,U assigned | **—** |
| **assessment_proformas** | — | S,I,U assigned | **—** |
| psychometric_tools | S (active) | S | S,I,U |
| **psychometric_submissions** | S,I own | S,I assigned | **—** |
| mood_logs | S,I,U own | S assigned | — |
| sleep_logs | S,I,U own | S assigned | — |
| files | S own (if `'patient' = ANY(shared_with)`) | S,I assigned | S (meta) |
| materials_library | S (active) | S | S,I,U |
| material_dispatches | S own | S,I assigned | S |
| message_threads | S own | S own | — |
| messages | S,I in own thread | S,I in own thread | — |
| follow_up_flows | S (active) | S | S,I,U |
| follow_up_submissions | S,I own | S assigned | — |
| whatsapp_templates | — | S | S,I,U |
| notification_log | — | — | S |
| consents | S,I own | — | S (meta) |
| audit_log | I only | I only | I only |

Notes:
- **Admin is metadata-only on clinical bodies** (D-020): admin has *no* policy on `session_notes`, `assessment_proformas`, `psychometric_submissions`, `mood_logs`, `sleep_logs`, `messages`. Admin sees that a session happened, that it was paid, and that a note exists (`appointments.has_signed_note`) — never the body.
- Providers see **only assigned patients** — those they hold at least one appointment with. There is no org-wide clinician view.
- Nobody can `SELECT` `audit_log` through RLS; the append-only INSERT policy exists so the audit trigger can write as the calling user. Reads are `service_role` / SQL console only (D-008: no UI).
- `DELETE` is granted to no role on any table; all FKs are `ON DELETE RESTRICT`.

---

## 4 · Adapter interfaces (D-025)

All live in `src/lib/adapters/`. Each exports an interface, a `Stub*` implementation used when `ADAPTER_MODE=stub`, and a real implementation. Stubs write to `notification_log` / a local `.dev-outbox/` and never make network calls, so P1–P4 proceed with no third-party keys.

```ts
// money is always integer paise; timestamps always ISO-8601 UTC
export interface WhatsAppSender {
  sendTemplate(a: { toPhoneE164: string; templateCode: string; language: 'en'|'hi';
    variables: Record<string, string>; }): Promise<{ providerMessageId: string }>;
  sendFlow(a: { toPhoneE164: string; flowId: string; templateCode: string;
    variables: Record<string, string>; }): Promise<{ providerMessageId: string }>;
}
export class StubWhatsAppSender implements WhatsAppSender { /* logs, returns uuid */ }

export interface OtpSender {
  send(a: { toPhoneE164: string; code: string; language: 'en'|'hi';
    channel: 'whatsapp'|'sms'; }): Promise<{ providerMessageId: string; channel: 'whatsapp'|'sms' }>;
}
export class StubOtpSender implements OtpSender { /* fixed code 000000 in dev */ }

export interface PaymentGateway {
  createOrder(a: { amountPaise: number; currency: 'INR'; receipt: string;
    notes?: Record<string, string>; }): Promise<{ orderId: string; amountPaise: number }>;
  verifyWebhook(a: { rawBody: string; signature: string }):
    Promise<{ ok: boolean; eventId: string; event: string;
      orderId?: string; paymentId?: string; refundId?: string; amountPaise?: number }>;
  refund(a: { paymentId: string; amountPaise: number; idempotencyKey: string;
    reason?: string; }): Promise<{ refundId: string; status: 'pending'|'processed'|'failed' }>;
}
export class StubPaymentGateway implements PaymentGateway { /* auto-captures */ }

export interface VideoRooms {
  createRoom(a: { appointmentId: string; startsAt: string;
    durationMinutes: number; }): Promise<{ roomId: string }>;
  mintJoinToken(a: { roomId: string; userId: string; role: 'patient'|'provider';
    ttlSeconds: number; }): Promise<{ token: string; expiresAt: string }>;
}
export class StubVideoRooms implements VideoRooms { /* returns a local echo room */ }

export interface EmailSender {
  send(a: { to: string; templateCode: string; language: 'en'|'hi';
    variables: Record<string, string>; attachments?: { path: string }[]; })
    : Promise<{ providerMessageId: string }>;
}
export class StubEmailSender implements EmailSender { /* writes .dev-outbox/*.eml */ }

export const MAX_UPLOAD_BYTES = 26_214_400; // 25 MiB (D-007)
export const ALLOWED_MIME = [
  'application/pdf','image/jpeg','image/png','image/webp','image/heic',
  'video/mp4','video/quicktime','audio/mpeg','audio/mp4',
  'text/plain','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

export interface FileStorage {
  createUploadUrl(a: { bucket: 'phi'|'materials'; path: string; mime: string;
    bytes: number; }): Promise<{ uploadUrl: string; path: string }>;   // rejects >25 MiB or bad MIME
  createSignedDownloadUrl(a: { bucket: 'phi'|'materials'; path: string;
    ttlSeconds: number; }): Promise<{ url: string; expiresAt: string }>;
  remove(a: { bucket: 'phi'|'materials'; path: string }): Promise<void>;
}
export class StubFileStorage implements FileStorage { /* local fs under .dev-storage/ */ }
```

Storage: two private buckets — `phi` (patient/provider exchange, prescriptions, reports) and `materials` (brochures/worksheets). No public bucket. Download is always a 5-minute signed URL minted after an RLS-checked read of `files`; the storage path never reaches the HTML. MIME is validated server-side by sniffing the first bytes, not by trusting the client header.

---

## 5 · Data-access layer (mock-first)

One repository interface per aggregate, in `src/lib/repos/`. Two implementations: `MockRepository` (typed fixtures in `src/lib/repos/fixtures/*.ts`, deterministic, seeded IST dates) and `SupabaseRepository`. A single env flag selects them, so every screen in P1–P4 is buildable and demoable before Supabase is wired.

```ts
// src/lib/repos/index.ts
export const repos = process.env.DATA_SOURCE === 'mock' ? mockRepos : supabaseRepos;
```

Aggregates: `OrganizationRepo`, `UserRepo`, `PatientRepo`, `ProviderRepo` (profile + session types + availability + blockouts), `BookingRepo` (appointments + slot search), `PaymentRepo` (payments + refunds), `EarningsRepo` (ledger + payouts), `ClinicalRepo` (notes + proformas), `PsychometricsRepo`, `SelfTrackingRepo` (mood + sleep), `FileRepo`, `MaterialsRepo`, `MessagingRepo`, `FollowUpRepo`, `NotificationRepo`, `ConsentRepo`.

Rules: repositories return plain domain types, never raw Supabase rows; money is `number` paise; timestamps are ISO UTC strings; no method accepts a raw SQL fragment. Both implementations share one Vitest contract suite, so a screen built on mocks cannot silently drift.

---

## 6 · Error-response shape

Every route handler returns, on failure:

```json
{ "error": { "code": "APPOINTMENT_SLOT_TAKEN", "message": "That slot was just booked.",
             "messageKey": "errors.slot_taken", "requestId": "01J…", "details": {} } }
```

`code` is a stable SCREAMING_SNAKE enum; `messageKey` is the next-intl key the client renders (EN/HI comes free); `message` is an EN fallback; `details` never contains PHI. Status: 400 validation, 401 unauthenticated, 403 RLS/role, 404 not-found-or-not-yours (403 and 404 are deliberately indistinguishable, to block row-existence probing), 409 conflict (double-book, idempotency replay), 422 business rule, 429 rate limit, 500 unknown. `requestId` is logged and shown to the user for support.

---

## 7 · PHI redaction, money, time, i18n

**PHI redaction (logs & Sentry).** Never logged, at any level: `display_name`, `phone`, `email`, age, any column of `session_notes` / `assessment_proformas` / `psychometric_submissions` / `messages` / `mood_logs` / `sleep_logs`, `files.original_name`, `files.storage_path`. Logs carry IDs only. Enforced by (a) a `redact()` helper every logger passes through — key deny-list plus regexes for E.164 phone, email and 12-digit sequences; (b) Sentry `beforeSend` dropping `request.data` and `extra` wholesale, keeping `requestId`, `userId`, `route`, `code`; (c) a lint rule banning `console.log` outside `src/lib/log.ts`. Adapter stubs log template *codes*, never rendered bodies.

**Money.** Integer paise everywhere (`BIGINT` in DB, `number` in TS, `_paise` suffix). No floats, no rupee strings stored. Formatting is display-only via `Intl.NumberFormat('en-IN', {style:'currency',currency:'INR'})`. Razorpay is paise-native, so nothing converts at the boundary.

**Time.** All `TIMESTAMPTZ`, stored UTC, displayed `Asia/Kolkata`. Availability rules are stored as local wall-clock `TIME` + weekday and expanded to UTC at query time (`AT TIME ZONE 'Asia/Kolkata'`) — India has no DST, but keeping rules in local time makes a future tz change a config edit, not a migration. The server never trusts a client-sent timestamp.

**i18n.** `next-intl`; catalogues `messages/en.json` + `messages/hi.json`; locale prefix `/(en|hi)/…` on patient routes only, console EN-only (D-019). Every user-visible string is a key from the first commit; HI falls back to EN key-by-key (`getMessageFallback`), so a missing translation renders English, never a raw key. Provider-authored clinical content is **not** translated. Fonts: Mukta / Tiro Devanagari Hindi for HI, Fraunces display (D-002).

---

## 8 · Environment & secrets

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker secret | webhooks + cron only |
| `SUPABASE_DB_URL` | CI only | migrations |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Worker secret | |
| `HMS_ACCESS_KEY`, `HMS_SECRET`, `HMS_TEMPLATE_ID` | Worker secret | 100ms |
| `WHATSAPP_*` (BSP-dependent, D-015) | Worker secret | shape fixed once BSP known |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Worker secret | |
| `SENTRY_DSN` | Worker secret | |
| `ADAPTER_MODE` = `stub` \| `live` | env | |
| `DATA_SOURCE` = `mock` \| `supabase` | env | |
| `CRON_SHARED_SECRET` | Worker secret | cron worker → app route auth |

Secrets live in `wrangler secret put` (Workers) and GitHub Actions encrypted secrets. Never in the repo, never in chat, never in `NEXT_PUBLIC_*`. `.env.example` is committed with empty values only.

## 9 · Deploy pipeline & backups

`local → preview → prod`.

| Stage | Trigger | App | Database |
|---|---|---|---|
| local | `pnpm dev` | Next dev | `supabase start` (local CLI), `ADAPTER_MODE=stub`, `DATA_SOURCE=mock` |
| preview | PR opened | Workers preview alias `pr-<n>.app-preview…` | dedicated **staging** Supabase project (synthetic data only, never a prod copy), `ADAPTER_MODE=stub` except the adapter under test |
| prod | merge to `main`, manual approval | `app.sadaywellness.com` | prod Supabase (ap-south-1), `ADAPTER_MODE=live` |

CI per PR: typecheck → lint → unit → repository contract suite → `supabase db reset` + migration apply → RLS attack tests → build. Migrations are forward-only and numbered; no manual dashboard schema edits — a drift check fails the build.

**Backups.** Supabase daily automated backup + PITR (paid tier — §14 Q3). Weekly `pg_dump` to an object-locked, encrypted bucket in ap-south-1, 90-day retention. **The restore drill is a P6 acceptance item, not a promise**: restore into a scratch project, run the RLS suite against it, record the wall-clock RTO in the runbook. Storage buckets are versioned; `files` rows are never hard-deleted.

---

## 10 · Booking engine

| Rule | Where stored | Semantics |
|---|---|---|
| Weekly availability | `provider_availability_rules(weekday, start_time, end_time, valid_from, valid_until)` | Local IST wall clock; a rule may be scoped to one session type or apply to all |
| Duration | `provider_session_types.duration_minutes` | Per session type (D-018 pricing sits here too) |
| Buffer | `provider_session_types.buffer_minutes` | Appended *after* the session; occupies the provider's calendar, is not billed |
| Min notice | `provider_session_types.min_notice_hours`, default from `organization_policies.booking_min_notice_hours` | Slot must start ≥ now + notice |
| Max advance | `provider_session_types.max_advance_days`, default `organization_policies.booking_window_days_max` | Slot must start ≤ now + window |
| Block-outs | `provider_blockouts(starts_at, ends_at)` | Absolute UTC range; subtracts from generated slots |

**Slot generation.** Expand matching weekly rules into IST wall-clock intervals → convert to UTC → slice into `duration + buffer` steps on a 15-minute grid → subtract live appointments and block-outs → apply min-notice and max-advance. A pure, unit-tested function in the Worker; one DB round trip for appointments + blockouts.

**Double-booking prevention — exclusion constraint.** `appointments` carries `booked_range TSTZRANGE` (maintained by a `BEFORE INSERT/UPDATE` trigger as `[scheduled_at, scheduled_at + duration + buffer)`), with

```sql
EXCLUDE USING gist (provider_id WITH =, booked_range WITH &&)
  WHERE (status IN ('scheduled','in_progress'))
```

Chosen over an advisory lock because it is **declarative and unforgettable**: it holds for every writer — the patient booking flow, an admin rebooking, a reschedule, a data fix, a future import script — without each one remembering to take a lock first, and it survives connection pooling (Supabase pgbouncer transaction mode silently breaks session-scoped advisory locks). Cost: the app must translate SQLSTATE `23P01` into `APPOINTMENT_SLOT_TAKEN` (409) and re-render the slot picker. Block-out collisions are a different table and stay an application-level check.

**Earliest available across all providers.** One query, ordered, limited:

```sql
-- inputs: _org, _session_type_key, _from (now + min_notice), _to (now + max_advance)
WITH cand AS (
  SELECT p.id AS provider_id, st.id AS session_type_id,
         st.duration_minutes, st.buffer_minutes,
         gs.slot_start
  FROM providers p
  JOIN provider_session_types st ON st.provider_id = p.id AND st.is_active
  JOIN provider_availability_rules r ON r.provider_id = p.id AND r.is_active
       AND (r.session_type_id IS NULL OR r.session_type_id = st.id)
  CROSS JOIN LATERAL generate_series(
        date_trunc('day', _from AT TIME ZONE 'Asia/Kolkata'),
        date_trunc('day', _to   AT TIME ZONE 'Asia/Kolkata'), INTERVAL '1 day') AS d(day)
  CROSS JOIN LATERAL generate_series(
        ((d.day::date + r.start_time) AT TIME ZONE 'Asia/Kolkata'),
        ((d.day::date + r.end_time)   AT TIME ZONE 'Asia/Kolkata')
          - make_interval(mins => st.duration_minutes + st.buffer_minutes),
        INTERVAL '15 minutes') AS gs(slot_start)
  WHERE p.organization_id = _org AND p.is_active AND p.is_accepting_patients
    AND st.key = _session_type_key
    AND EXTRACT(dow FROM d.day) = r.weekday
    AND d.day::date BETWEEN r.valid_from AND COALESCE(r.valid_until, 'infinity'::date)
    AND gs.slot_start BETWEEN _from AND _to
)
SELECT c.* FROM cand c
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a
  WHERE a.provider_id = c.provider_id
    AND a.status IN ('scheduled','in_progress')
    AND a.booked_range && tstzrange(c.slot_start,
          c.slot_start + make_interval(mins => c.duration_minutes + c.buffer_minutes), '[)'))
AND NOT EXISTS (
  SELECT 1 FROM provider_blockouts b
  WHERE b.provider_id = c.provider_id
    AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(c.slot_start,
          c.slot_start + make_interval(mins => c.duration_minutes + c.buffer_minutes), '[)'))
ORDER BY c.slot_start, c.provider_id
LIMIT 1;
```

Ships in P2 as a `STABLE SECURITY INVOKER` SQL function `earliest_available(...)` (not in `0001_schema.sql`) so RLS on `providers` still applies. Backs the "assign earliest available consultation" path of the 3-field intake (D-004).

**Status machine.** `scheduled → in_progress → completed`; `scheduled → cancelled_by_patient | cancelled_by_provider | rescheduled`; `scheduled|in_progress → no_show`. A reschedule creates a new row and sets the old row's `rescheduled_to_id`. Terminal statuses are enforced by a `BEFORE UPDATE` trigger. `video_room_id` is stored; **join tokens are never stored** — minted per participant per click with a short TTL (D-013).

---

## 11 · Note & proforma immutability

Applies identically to `session_notes` and `assessment_proformas`:

1. While `signed_at IS NULL` the author (assigned provider) edits freely.
2. Signing sets `signed_at` + `signed_by_user_id`; `is_locked` is generated from `signed_at IS NOT NULL`.
3. A locked row is immutable: a `BEFORE UPDATE` trigger compares `to_jsonb(OLD)` and `to_jsonb(NEW)` minus `superseded_at`, `updated_at` and generated columns, and raises on any difference.
4. A correction is a **new row** — `version = old.version + 1`, `supersedes_id = old.id` — and the old row gets `superseded_at = now()`, the only mutation the trigger permits. The original is never altered or deleted.
5. `UNIQUE (appointment_id) WHERE superseded_at IS NULL`: one live note per appointment, whole chain readable.
6. `DELETE` is blocked by trigger on both tables for every role.
7. `psychometric_submissions` is immutable from INSERT (no draft state) — a re-administration is a new row, which is what the serial-monitoring chart plots.

Note fields follow the Swasthmind 4-section layout (D-005): *Session details* (date, duration, mode) · *Clinical assessment* (presenting concern, mood, affect, risk chips, behavioural observation) · *Session narrative* (narrative, intervention chips) · *Plan & next steps* (homework, goals, next focus, progress 0–10, follow-up date).

---

## 12 · Follow-up flows

Org-level only (D-023) — `follow_up_flows` has no `provider_id`; one `check_in` and one `feedback` flow for the whole organisation, configured in the admin console (D-020).

| Piece | Design |
|---|---|
| Trigger | `check_in` fires `offset_hours` after appointment end (admin-set, default 24); `feedback` fires `offset_hours` after the check-in was **sent** (default 24) |
| Queue | On `appointments.status → completed`, the app inserts `notification_log` rows with `status='pending'` and `due_at` computed from the flows |
| Scheduler | **Cloudflare Cron Trigger**, every 5 minutes, hitting an internal route authenticated by `CRON_SHARED_SECRET` |
| Send | Route claims due rows (`UPDATE … SET status='sending' … RETURNING`, so concurrent runs cannot double-send), renders the `whatsapp_templates` row in the patient's language, calls `WhatsAppSender`, writes `provider_message_id` / `error` |
| Responses | Patient's answers land in `follow_up_submissions` (immutable), shown on the patient panel; no automated escalation in V1 (D-009) |

**pg_cron vs Cloudflare Cron Trigger.** Cloudflare, because the work is not SQL: it renders localised templates, calls the WhatsApp adapter, and needs the adapter secrets and the stub/live switch. Driving it from `pg_cron` would mean `pg_net` HTTP calls out of the database, putting BSP credentials and retry logic in Postgres — harder to test, harder to redact, invisible to Sentry. `pg_cron` stays available for in-database housekeeping. Timing is therefore guaranteed only to ±5 minutes, which the admin UI copy states.

---

## 13 · Naming & conventions (inherited from prior `data-model.md` §3)

snake_case, plural tables / singular columns · `TEXT` + `CHECK` instead of `ENUM` (adding a value is a one-line migration) · all timestamps `TIMESTAMPTZ` UTC, `_at` suffix · money `BIGINT`, `_paise` suffix · encrypted columns `_encrypted` (BYTEA, pgcrypto key from Supabase Vault) · positive-verb booleans (`is_active`, `is_locked`) · every PHI table carries `organization_id` · all FKs `ON DELETE RESTRICT` · `updated_at` maintained by trigger on every table except `audit_log`.

---

## 14 · Open questions for Saday

1. **WhatsApp BSP (D-015, still open).** Which partner owns the Saday number in Meta Business Manager? Templates and OTP-over-WhatsApp stay stubbed until this is answered — the only item that can delay P2's confirmations.
2. **Transactional email — Resend or AWS SES?** Resend is faster to set up; SES is cheaper at volume. Either works behind `EmailSender`.
3. **Supabase plan.** PITR and daily backups need Pro. Confirm the spend, or V1 launches with 7-day automated backups only.
4. **Cancellation / reschedule numbers** — `cancellation_min_notice_hours`, `cancellation_refund_pct`, `reschedule_min_notice_hours`, `reschedule_max_count`. Whatever goes in must match the main-site refund page.
5. **Default commission %** to seed per provider (D-018), and whether the Razorpay gateway fee comes off before or after commission in the earnings ledger.
6. **Telemedicine consent text + version string**, and whether privacy/terms acceptance is re-prompted on a version change.
7. **Patient identity on phone change.** If a patient changes their number, do we migrate the account (needs an admin flow) or start a new one? Decides whether `phone` is identity or attribute.
8. **Provider registration numbers** — shown publicly on profile cards, or held internally only?

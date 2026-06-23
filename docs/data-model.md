# Saday Wellness — Data Model

> **File:** `docs/data-model.md`
> **Version:** 1.1 (Phase 0 · Week 1 · Saturday — internal audit pass)
> **Status:** DRAFT — pending CTO security review (W2 Mon) and CF clinical review (W2 Wed)
> **Companion to:** `Saday_Master_Blueprint.html` §11 (entity catalogue) + §12 (CTO non-negotiables) · `docs/intake-spec.md` §8.4 · `docs/Saday_Action_Plan_by_Claude.md` Phase 0 W1 Wed
> **Implements:** the V1 Postgres schema migrated to Supabase ap-south-1 in W4 Mon. Targets a measurable privacy/security benchmark *beyond* Swasthmind (16 findings: 1 CRITICAL + 5 HIGH) and Tealfeed (no MFA, no consent capture, no DSR portal).
> **Audience:** CTO/Dev (W4 migration), backend engineers, security reviewer (W10 Tue).

### Changelog

- **v1.1 (2026-04-26)** — internal audit pass. Fixes 11 issues that would have failed migration or silently broken security commitments. No scope changes; all decisions DM1–DM5 / B1–B11 / α intact. See §16.
  - A1 `users.phone_last4` no longer GENERATED (would not compile); app writes plain text + CHECK.
  - A2 cross-domain FKs deferred to migration `0010b_cross_domain_fks.sql` so domain migrations don't fail on forward references.
  - A3 identity bridge: `users.auth_user_id REFERENCES auth.users(id)` added; `current_user_id()` resolves through it (was returning `auth.uid()` and matching against the wrong column).
  - A4 `audit_log` INSERT restricted to service_role; `authenticated` revoked. Closes actor-forgery.
  - A5/A16 `audit_log.before_row` / `after_row` JSONB redaction rule for `session_notes` (S/O/A/P) and `conversations` (`ai_summary`) so admin's audit read does not leak SOAP / AI summaries.
  - A7 framing: "per-row content hash + weekly Merkle anchor" replaces "hash-chain" everywhere. Real prev-row chain deferred to V1.5.
  - A8 `patients.age_band` is now GENERATED from `dob`; `dob` required; CHECK 18+.
  - A9 `session_notes` UNIQUE on `appointment_id` dropped; addendum pattern (`is_addendum` + `addendum_to_id`) added.
  - A10 pgcrypto key custody: Supabase Vault (`vault.decrypted_secrets`); no GUC keys; helper function `app_secret(key_name)` documented.
  - A11 `appointments.meeting_url` → `meeting_room_id` (Daily.co room) + signed-URL minted at join; `materials.file_url` → `file_path` + signed-URL on demand.
  - A12 `data_subject_requests.sla_deadline`, `vendor_dpas.renewal_alert_at`, `incident_log.dpb_notification_sla_deadline` are GENERATED.
  - A14 RLS policy template formalised in §7.3.0; per-table tagging in §7.3.1; the four worked examples remain spelled out in §7.3.2.
  - A15 trigger blocking patient-assignment of clinician-only assessment tools.
  - A17 V1 `users.email` is global UNIQUE only; per-org UNIQUE introduced in V2 migration when multi-tenant ships.
  - A18 messages-encryption row added to §4 privacy posture (honest parity disclosure).
  - A19 `vendor_dpas` UNIQUE on (org, vendor, contract_signed_at).
  - A21 `safety_plans` co-authoring rule documented (V1: patient-write, MHP-review).
  - A22 V1.5 plan: mirror Merkle root to a second cloud (R2) — hash only, no PHI.

---

## 0 · How to use this document

1. **W2 Mon** — CTO reads §3 (decisions), §4 (conventions), §5 (privacy benchmark). Confirms the 5 DM-decisions + 11 B-decisions + safety-contact α model.
2. **W2 Wed** — CF reads §6 domain blocks for clinical entities (patients, episodes_of_care, session_notes, safety_plans, mood_logs, informant_observations, assessment_*) and signs off on field semantics.
3. **W4 Mon** — engineer runs the migrations in §6 against the Supabase Mumbai project. RLS policies in §7 enabled in the same migration.
4. **W4 Wed** — engineer runs the RLS attack tests in §7.4 (cross-patient, cross-MHP, role-escalation). Must fail.
5. **W10 Tue** — security review walks §5 (benchmark), §7 (RLS), §8 (audit hash-chain), §9 (DSR workflow). Findings update this doc to v2.

---

## 1 · Purpose & scope

The V1 schema models **34 tables across 9 domains** in Supabase Postgres, single-tenant at launch but multi-tenant-ready (every PHI row carries `organization_id`). Every table is RLS-protected. Every PHI write fires an audit row. The audit log is hash-evident with weekly externalised Merkle roots. Patients can query their own access log.

### 1.1 In scope (V1)

- DDL for 34 tables.
- Row-level security policies (per-table template + 6 worked examples).
- Audit log shape with hash-per-row + weekly Merkle externalisation.
- Data Subject Rights workflow (DPDP §11–§17).
- Consent ledger with versioned transcripts.
- Field-level encryption for `users.phone` + MHP bank fields (DM5).
- Idle session timeout per role.
- Vendor DPA registry.

### 1.2 Out of scope (V1.5+)

- E2E message encryption (blocks AI triage; V2).
- WebAuthn / passkeys (V1.5).
- "Data Trustee" admin-isolation role with own UI (modeled in `user_roles` V1, no UI until V1.5).
- Email-only registration fallback for shared-device households (V1.5; V1 carries the residual edge).
- Patient-facing audit dashboard UI (schema V1; UI V1.5).
- Assessment-result aggregations / outcome dashboards (V1.5).
- ABDM/ABHA Health ID linkage (V2).
- Group sessions, lab orders, prescriptions (V2; reserved fields noted in §12).

---

## 2 · Decisions log

All decisions made on 2026-04-25 by CTO. Reopen only via `docs/scope-exceptions.md` entry.

### 2.1 Schema decisions (DM-series)

| # | Decision | Locked value |
|---|---|---|
| **DM1** | Primary key strategy | `UUID v4` via `pgcrypto.gen_random_uuid()`. Opaque, no enumeration. |
| **DM2** | Money columns | `BIGINT` paise. Column suffix `_paise`. Display formatter required at every UI surface (see §4.5). |
| **DM3** | Phone uniqueness on `users` | `UNIQUE NOT NULL`. Plus separate `patients.safety_contact_phone_encrypted` (not unique, can be shared, patient-changeable). Family-shared-device gap is V1.5. |
| **DM4** | Episode-of-care lifecycle | MHP manually closes; system surfaces "inactive 90d, review?" admin widget. No auto-close. |
| **DM5** | PHI column encryption (V1) | pgcrypto column-level on `users.phone_encrypted` + `mhps.bank_account_no_encrypted` + `mhps.bank_ifsc_encrypted` + `patients.safety_contact_phone_encrypted`. Wider scope V1.5 with KMS. |

### 2.2 Privacy benchmark commitments (B-series, all V1)

| # | Commitment | Schema artifact |
|---|---|---|
| **B1** | TOTP mandatory for MHP/admin/counsellor | `users.totp_secret_encrypted`, `users.totp_enrolled_at`, `users.totp_required` |
| **B2** | Granular consent ledger | `consents` table |
| **B3** | DPDP Data Subject Rights workflow | `data_subject_requests` table |
| **B4** | Tamper-evident audit log (per-row content hash + weekly Merkle anchor) | `audit_log.row_hash` per-row + `audit_merkle_roots` weekly S3 anchor with object-lock |
| **B5** | Patient-queryable PHI-access view | `phi_access_events` view (filtered subset of `audit_log`) |
| **B6** | SOAP body invisible to admin | RLS on `session_notes.subjective/objective/assessment/plan` (treating MHP only); admin sees only metadata |
| **B7** | Field-level encryption (DM5) | pgcrypto |
| **B8** | Per-role idle timeout | `users.idle_timeout_minutes` (15 MHP/admin, 30 patient) |
| **B9** | Breach notification workflow | `incident_log` table |
| **B10** | Vendor DPA registry | `vendor_dpas` table |
| **B11** | Patient-facing audit dashboard | Schema in V1 (`phi_access_events` view); UI V1.5 |

### 2.3 Safety contact consent model

- **(α) locked for V1** — patient-attested at the moment of safety-contact assignment (`patients.safety_contact_consent_attested_at`). Trust-the-patient model. CF will weigh in W2 Wed.
- **(γ) committed for V1.5** — bidirectional confirmation: patient attests + WhatsApp confirmation from contact themselves with opt-in.

### 2.4 Auto-locked Postgres conventions

snake_case · single `public` schema · text + CHECK over Postgres enums · universal `created_at + updated_at` (trigger) · TIMESTAMPTZ everywhere, IST display layer · `organization_id NOT NULL` on every PHI table · hard delete + audit_log snapshot of before-row · audit_log partitioned monthly · session_notes immutability via DB trigger when `signed_at IS NOT NULL` · linked_accounts revocation = `revoked_at SET`, never hard-delete · all FKs `ON DELETE RESTRICT` (force explicit handling) · pgcrypto enabled day 1 · `gen_random_uuid()` for all PKs.

---

## 3 · Conventions

### 3.1 Required columns on every table

```sql
id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

The `organizations` table itself has no `organization_id` column (it is the tenant root). The `audit_log` and partitioned children are exempt from the `updated_at` trigger (append-only).

### 3.2 Updated-at trigger

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied per table: `CREATE TRIGGER trg_set_updated_at_<table> BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION set_updated_at();`.

### 3.3 Enum-as-text-with-check pattern

```sql
track TEXT NOT NULL CHECK (track IN ('T1','T2','T3','T4','T5'))
```

Adding a value = single migration that updates the CHECK clause; no `ALTER TYPE` rewrite. Domain values are documented inline at first use in §6.

### 3.4 Money — BIGINT paise

All monetary columns are `BIGINT NOT NULL` paise (1 INR = 100 paise). Suffix `_paise`. Razorpay returns paise; matching = no conversion bugs. Display layer formats:

```ts
// src/lib/money.ts (W4 deliverable)
export function paiseToInr(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return rupees.toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2
  });  // "₹1,500.00"
}
```

DB never stores rupee strings. Reports view `vw_earnings_inr` exposes a `(amount_paise / 100.0)::numeric(12,2) AS amount_inr` for analyst querying — view, not column.

### 3.5 Timestamps

All `TIMESTAMPTZ` stored UTC. Display layer formats Asia/Kolkata. Column names that represent **server-attested** moments use the bare verb (`signed_at`, `submitted_at`, `attested_at`); columns that represent client-claimed moments are forbidden — always use server time per BP CTO #3.

### 3.6 Foreign keys

All FKs `REFERENCES <parent>(id) ON DELETE RESTRICT`. Forces deletion to be deliberate (cascade behaviour written explicitly in the deletion API path, not implicit at schema level).

### 3.7 Naming

- Tables: plural snake_case (`patients`, `session_notes`, `audit_log`).
- Columns: singular snake_case (`patient_id`, `submitted_at`).
- Booleans: positive verb (`is_active`, `is_signed_off`, `consent_attested`). Avoid `not_archived`-style negations.
- Encrypted columns: `_encrypted` suffix (`phone_encrypted`, `bank_account_no_encrypted`).
- Hash columns: `_hash` suffix (`row_hash`, `consent_transcript_hash`).
- Money: `_paise` suffix.
- Timestamps: `_at` suffix.

### 3.8 RLS default-deny

Every PHI table has RLS `ENABLE`d **and** a `FORCE` directive so even table owner is subject. No fallback "allow all" policy. If no policy matches, the row is invisible. See §7.

### 3.9 pgcrypto key custody — Supabase Vault (A10)

**No keys live in GUCs or `current_setting`.** Symmetric keys for column-level encryption are stored in `vault.secrets` (Supabase-managed, encrypted at rest with the project's master key, RLS-protected). The application server resolves them per-call.

```sql
-- Resolve a vault secret by name (returns NULL if not present or not granted).
-- Wrap inside SECURITY DEFINER so the calling role doesn't need vault grants.
CREATE OR REPLACE FUNCTION app_secret(_key_name TEXT) RETURNS TEXT AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = _key_name
  LIMIT 1
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

REVOKE EXECUTE ON FUNCTION app_secret(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_secret(TEXT) TO service_role;
-- Patient/MHP/admin roles never call app_secret directly.
```

Encrypt/decrypt pattern at the application boundary (TypeScript, server-side only):

```ts
// Encrypt before INSERT
const { data } = await supabase.rpc('encrypt_phone', { plain: e164 });
// Server-side SQL (SECURITY DEFINER):
//   pgp_sym_encrypt(_plain, app_secret('phone_key_v1'))
// Decrypt for narrow purposes only:
//   pgp_sym_decrypt(phone_encrypted, app_secret('phone_key_v1'))
```

**Key rotation:** key names are versioned (`phone_key_v1`, `phone_key_v2`). When rotating, both keys live in vault during a backfill window; the column gains a sibling `phone_key_version SMALLINT`; the decrypt function picks the matching key. V1 ships with `_v1` only; rotation runbook is V1.5.

**What this gets us vs the alternatives:**
- vs GUC (`current_setting('app.phone_key')`) — vault.secrets is RLS-protected; GUCs are visible to anyone with `pg_read_all_settings`, including service_role by default.
- vs per-row data keys (envelope) — we lose key-per-row blast-radius isolation. V1.5 candidate; V1 ships single-key per column-class for migration simplicity.

---

## 4 · Privacy benchmark posture

A summary of what we measurably exceed Swasthmind/Tealfeed on. Cited in the BAA conversation, the ML review (W13), and the public privacy policy.

| # | Posture | Swasthmind (Phase 7) | Tealfeed (discovery) | Saday V1 |
|---|---|---|---|---|
| MFA | None for any role (SEC-01 HIGH) | None observed | TOTP **mandatory** for MHP/admin/counsellor; email-OTP for patient (no password to leak) |
| Consent | Silent collection (SEC-13 HIGH) | Silent | Versioned consents in `consents` table; transcript hashed per submission; granular per (user, consent_type) |
| DSR | None (DPDP §11–§17 missing) | None | `data_subject_requests` workflow with SLA; admin-side resolution UI in V1 |
| Audit log | Module exists, route 404s (SEC-16 MED) | None observed | `audit_log` with per-row content `row_hash` + weekly Merkle root externally anchored to S3 ap-south-1 (object-locked); V1.5 mirror to a second cloud (R2) — hash only, no PHI; patient-queryable view |
| PHI in lists | Plaintext to all roles incl. Receptionist (SEC-09 HIGH) | Plaintext | RLS scoped per role; SOAP body invisible to admin (B6); list views show role-appropriate masked PHI |
| AI clinical content | Treated as metadata (SEC-10 HIGH) | N/A | AI-generated summaries treated as PHI; redacted from logs; bounded to `episode_of_care` RLS |
| Idle timeout | None observable (SEC-05 LOW) | None observed | `users.idle_timeout_minutes` enforced server-side; 15 min MHP/admin, 30 min patient |
| At-rest encryption | Standard cloud (unverifiable) | Standard cloud | Standard cloud + pgcrypto column-level on phone + MHP bank fields (DM5/B7) |
| Session token | sessionStorage / JWT (SEC-04 MED) | Unknown | HttpOnly cookies (BP CTO #6); CSRF token on mutations |
| Breach workflow | None (no DPDP §8(6) workflow) | None | `incident_log` table; DPO notified; SLA timer; templated communications |
| Vendor DPAs | Not surfaced | Not surfaced | `vendor_dpas` registry with renewal tracking; admin alert at T-30d |
| Children's data | Child Therapy with no parental consent (SEC-12 HIGH) | N/A | Hard 18+ in V1 (`intake-spec.md` D6); minor pathway requires legal artifact + ML sign-off before any V1.5 release |
| Patient↔MHP message body (A18) | Plaintext at rest | Plaintext at rest | **Parity at rest in V1** (plaintext, TLS in transit, RLS to participants only); field-level encryption on `messages.body` ships V1.5. Honest disclosure — we do not exceed Tealfeed/Swasthmind on chat encryption in V1. |

---

## 5 · Schema overview — 9 domains

```
┌──────────────────── 1. Tenancy & Identity ───────────────────┐
│  organizations · users · user_roles · vendor_dpas            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 2. People ───────────────────────────────┐
│  patients · linked_accounts · mhps · mhp_availability        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 3. Intake & Assessment ──────────────────┐
│  intake_submissions · assessment_tool_versions ·             │
│  assessment_submissions                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 4. Episode & Treatment (clinical) ───────┐
│  episodes_of_care · session_notes · safety_plans ·           │
│  mood_logs · informant_observations                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 5. Booking & Sessions ───────────────────┐
│  appointments · session_packages · follow_up_flows ·         │
│  follow_up_submissions                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 6. Money ────────────────────────────────┐
│  payments · earnings_ledger · deductions · payouts           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 7. Communications ───────────────────────┐
│  conversations · messages · materials · material_dispatches  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 8. Privacy & Audit (the differentiator) ─┐
│  consents · data_subject_requests · incident_log ·           │
│  audit_log (partitioned) · audit_merkle_roots ·              │
│  safety_alerts · clinician_review_queue                      │
│  + view: phi_access_events                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────── 9. Org config ───────────────────────────┐
│  organization_policies                                       │
└──────────────────────────────────────────────────────────────┘
```

Total: **34 tables** + 1 view + 1 partitioning scheme on `audit_log`.

---

## 6 · Per-domain DDL

> All DDL targets Postgres 15+ on Supabase. Extensions required (run once per project): `pgcrypto`, `pg_partman` (for audit_log monthly partitioning), `citext` (for case-insensitive email).

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_partman;
CREATE EXTENSION IF NOT EXISTS citext;
```

### 6.1 Domain 1 — Tenancy & Identity

#### `organizations`

Tenant root. Single tenant in V1; field set ready for multi-tenant in V2.

```sql
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT,                                 -- E.164
  msg91_template_ns TEXT,                               -- MSG91 namespace
  razorpay_account_id TEXT,
  timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency        CHAR(3) NOT NULL DEFAULT 'INR',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `users`

The single account table for every human role. Profile extension tables (`patients`, `mhps`, `linked_accounts`) reference this via `user_id`.

```sql
CREATE TABLE users (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  -- Identity bridge to Supabase Auth (A3 — option b):
  auth_user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
                                                        -- ↑ stable internal PK (`id`) decoupled from auth provider; one-row-per-auth-user
  email                    CITEXT NOT NULL UNIQUE,      -- A17: V1 global UNIQUE only; V2 migration moves to per-org
  phone_encrypted          BYTEA,                       -- DM5/B7: pgcrypto sym_encrypt via vault key (see §3.9); raw never stored
  phone_last4              TEXT CHECK (phone_last4 IS NULL OR phone_last4 ~ '^[0-9]{4}$'),
                                                        -- A1: app writes plain TEXT alongside phone_encrypted on INSERT/UPDATE
  role                     TEXT NOT NULL CHECK (role IN ('patient','mhp','admin','counsellor','linked_account')),
  is_active                BOOLEAN NOT NULL DEFAULT true,
  totp_secret_encrypted    BYTEA,                       -- B1; required for mhp/admin/counsellor (app-layer enforced)
  totp_enrolled_at         TIMESTAMPTZ,
  totp_required            BOOLEAN GENERATED ALWAYS AS (role IN ('mhp','admin','counsellor')) STORED,
  idle_timeout_minutes     INTEGER NOT NULL DEFAULT 30 CHECK (idle_timeout_minutes BETWEEN 5 AND 120),
                                                        -- B8; app sets 15 for mhp/admin on insert via trigger
  failed_login_count       INTEGER NOT NULL DEFAULT 0,
  locked_until             TIMESTAMPTZ,
  last_login_at            TIMESTAMPTZ,
  email_verified_at        TIMESTAMPTZ,
  phone_verified_at        TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role_active ON users(organization_id, role) WHERE is_active = true;
CREATE INDEX idx_users_phone_last4 ON users(organization_id, phone_last4) WHERE phone_last4 IS NOT NULL;
CREATE INDEX idx_users_auth ON users(auth_user_id);
```

> **Note on `phone_last4` (A1):** plain TEXT, written by the app on the same INSERT/UPDATE that writes `phone_encrypted`. The CHECK enforces shape. We chose this over `GENERATED ALWAYS AS (... pgp_sym_decrypt ...) STORED` because that expression is not IMMUTABLE — Postgres rejects it, and even when patched it depended on a per-connection GUC that does not propagate reliably under Supabase pgbouncer transaction-pool mode.

> **Note on `auth_user_id` (A3):** every `public.users` row points to exactly one `auth.users` row. Inserts happen via a Supabase trigger `on_auth_user_created` that mints the `public.users` row at sign-up and copies email/phone. The internal PK `users.id` stays stable even if we migrate auth providers later. **All RLS helpers in §7.2 resolve through this column** — never compare `users.id = auth.uid()` directly.

#### `user_roles`

Lookup of role permissions (informational; actual access is enforced by RLS, not by this table). Useful for the admin UI to render role descriptions.

```sql
CREATE TABLE user_roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL CHECK (name IN ('patient','mhp','admin','counsellor','linked_account')),
  description     TEXT NOT NULL,
  permissions     JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);
```

#### `vendor_dpas` (B10)

Registry of every third-party data processing agreement.

```sql
CREATE TABLE vendor_dpas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  vendor_name         TEXT NOT NULL,                    -- 'Razorpay', 'MSG91', 'Daily.co', 'Sentry', 'Cloudflare', 'Supabase'
  vendor_role         TEXT NOT NULL CHECK (vendor_role IN ('processor','sub_processor','controller_joint')),
  data_categories     TEXT[] NOT NULL,                  -- e.g. {'payment_pii','contact_info','session_metadata'}
  jurisdiction        TEXT NOT NULL,                    -- 'IN','US','EU' etc
  data_residency      TEXT NOT NULL,                    -- 'IN-Mumbai','US-East-1', etc
  contract_url        TEXT NOT NULL,                    -- S3 link (object-locked)
  contract_signed_at  TIMESTAMPTZ NOT NULL,
  contract_expires_at TIMESTAMPTZ NOT NULL,
  renewal_alert_at    TIMESTAMPTZ NOT NULL GENERATED ALWAYS AS (contract_expires_at - INTERVAL '30 days') STORED,  -- A12: T-30d
  is_active           BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, vendor_name, contract_signed_at)        -- A19
);
CREATE INDEX idx_vendor_dpas_active_renewal ON vendor_dpas(renewal_alert_at) WHERE is_active = true;
```

### 6.2 Domain 2 — People

#### `patients`

```sql
CREATE TABLE patients (
  id                                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                        UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id                                UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  display_name                           TEXT NOT NULL,         -- patient-controlled, may be pseudonym
  -- A8: dob is the source of truth; age_band trigger-derived; CHECK enforces 18+
  dob                                    DATE NOT NULL CHECK (dob <= (CURRENT_DATE - INTERVAL '18 years')::date),
  age_band                               TEXT NOT NULL CHECK (age_band IN ('18_24','25_34','35_44','45_59','60_plus')),
                                         -- ↑ derived by trg_patients_derive_age_band on INSERT/UPDATE OF dob; nightly cron re-derives for all rows to handle birthday crossings (see §6.2.1)
  gender                                 TEXT CHECK (gender IN ('female','male','non_binary','prefer_not','self_describe')),
  gender_self_describe                   TEXT,
  preferred_language                     CHAR(2) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','hi')),
  source                                 TEXT NOT NULL CHECK (source IN ('intake_web','referral_mhp','referral_partner','organic')),
  assigned_mhp_id                        UUID,                  -- FK added in 0010b_cross_domain_fks.sql (forward ref to mhps)
  -- Safety contact (DM3 + α model, B-series patient-attested):
  safety_contact_phone_encrypted         BYTEA,                 -- DM5/B7
  safety_contact_relationship            TEXT CHECK (safety_contact_relationship IN ('parent','sibling','spouse','partner','child','friend','other')),
  safety_contact_consent_attested_at     TIMESTAMPTZ,           -- α: patient ticked "I have informed this person"
  safety_contact_updated_at              TIMESTAMPTZ,
  -- Profile metadata patient may add:
  city                                   TEXT,
  occupation                             TEXT,
  notes_for_mhp                          TEXT,                  -- patient-authored; visible only to assigned MHP
  created_at                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_assigned_mhp ON patients(assigned_mhp_id) WHERE assigned_mhp_id IS NOT NULL;

-- A8: age_band trigger (CURRENT_DATE is STABLE, not IMMUTABLE, so GENERATED won't accept it)
CREATE OR REPLACE FUNCTION derive_patient_age_band()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age_band := CASE
    WHEN NEW.dob > (CURRENT_DATE - INTERVAL '25 years')::date THEN '18_24'
    WHEN NEW.dob > (CURRENT_DATE - INTERVAL '35 years')::date THEN '25_34'
    WHEN NEW.dob > (CURRENT_DATE - INTERVAL '45 years')::date THEN '35_44'
    WHEN NEW.dob > (CURRENT_DATE - INTERVAL '60 years')::date THEN '45_59'
    ELSE '60_plus'
  END;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_patients_derive_age_band
  BEFORE INSERT OR UPDATE OF dob ON patients
  FOR EACH ROW EXECUTE FUNCTION derive_patient_age_band();
```

> **§6.2.1 Nightly age_band re-derivation (cron)** — INSERT/UPDATE triggers handle the day a row changes, but a patient who turns 25/35/45/60 needs their `age_band` updated by a daily job. Add a Supabase scheduled function (`pg_cron` extension or Edge Function): `UPDATE patients SET dob = dob WHERE date_trunc('day', now()) = (date_trunc('day', dob + INTERVAL '25 years')) OR ... ;` — re-firing the trigger via a no-op `dob=dob` write. Acceptable performance because at most ~1/365 of patients fire on any given day. Cron is a W4 deliverable, runbook in `architecture.md`.

#### `linked_accounts`

Informant / guardian / caregiver — L1 read-only observations, L2 read summaries, L3 read summaries + flagged events.

```sql
CREATE TABLE linked_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  linked_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  access_level        TEXT NOT NULL CHECK (access_level IN ('L1','L2','L3')),
  relationship        TEXT NOT NULL CHECK (relationship IN ('parent','sibling','spouse','partner','child','friend','caregiver','other')),
  scoped_episode_id   UUID,                            -- FK added in 0010b_cross_domain_fks.sql (forward ref to episodes_of_care)
                                                        -- NULL = whole-patient scope; non-NULL = scoped to one episode
  invited_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at         TIMESTAMPTZ,
  revoked_at          TIMESTAMPTZ,                     -- never hard-delete; soft-revoke for compliance
  revoked_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, linked_user_id, scoped_episode_id)
);
CREATE INDEX idx_linked_accounts_active ON linked_accounts(patient_id) WHERE revoked_at IS NULL AND accepted_at IS NOT NULL;
```

#### `mhps`

```sql
CREATE TABLE mhps (
  id                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id                           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  display_name                      TEXT NOT NULL,
  professional_title                TEXT NOT NULL CHECK (professional_title IN ('psychiatrist','clinical_psychologist','counselling_psychologist','psychotherapist','counsellor')),
  -- License / regulatory:
  license_council                   TEXT NOT NULL CHECK (license_council IN ('NMC','RCI','none')),  -- NMC for psychiatrist, RCI for psychologist
  license_number                    TEXT NOT NULL,
  license_verified_at               TIMESTAMPTZ,
  license_expires_at                TIMESTAMPTZ,
  -- Practice metadata:
  specializations                   TEXT[] NOT NULL DEFAULT '{}',  -- e.g. {'depression','anxiety','trauma','CBT','DBT','EMDR'}
  languages_spoken                  CHAR(2)[] NOT NULL DEFAULT '{en}',  -- ISO 639-1
  years_experience                  INTEGER NOT NULL CHECK (years_experience >= 0),
  tracks_eligible                   TEXT[] NOT NULL CHECK (array_length(tracks_eligible,1) >= 1),  -- subset of {T1,T2,T3,T4,T5}
  tags                              TEXT[] NOT NULL DEFAULT '{}',  -- e.g. {'paediatric','geriatric','LGBTQ_affirmative'}
  -- Commercial:
  commission_pct                    NUMERIC(5,2) NOT NULL CHECK (commission_pct BETWEEN 0 AND 100),  -- platform's cut
  subscription_tier                 TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free','pro','enterprise')),
  -- KYC:
  kyc_status                        TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','verified','rejected')),
  kyc_verified_at                   TIMESTAMPTZ,
  -- Bank (DM5/B7 — encrypted):
  bank_account_no_encrypted         BYTEA,
  bank_ifsc_encrypted               BYTEA,
  bank_account_holder_name          TEXT,
  pan_encrypted                     BYTEA,
  -- Profile (patient-visible):
  bio_short                         TEXT,
  bio_long                          TEXT,
  profile_image_url                 TEXT,
  consult_modes                     TEXT[] NOT NULL DEFAULT '{online}' CHECK (consult_modes <@ ARRAY['online','offline']::TEXT[]),
  is_accepting_patients             BOOLEAN NOT NULL DEFAULT true,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (professional_title = 'psychiatrist' AND license_council = 'NMC')
    OR (professional_title IN ('clinical_psychologist','counselling_psychologist','psychotherapist') AND license_council = 'RCI')
    OR (professional_title = 'counsellor' AND license_council = 'none')
  )
);
CREATE INDEX idx_mhps_accepting ON mhps(organization_id) WHERE is_accepting_patients = true AND kyc_status = 'verified';
```

#### `mhp_availability`

Rule-based recurring availability + one-off overrides. Replaces Swasthmind's hand-built slot-row pattern (FL-08 / G-03).

```sql
CREATE TABLE mhp_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mhp_id          UUID NOT NULL REFERENCES mhps(id) ON DELETE RESTRICT,
  rule_kind       TEXT NOT NULL CHECK (rule_kind IN ('recurring','one_off_open','one_off_block')),
  weekday         INTEGER CHECK (weekday BETWEEN 0 AND 6),  -- 0=Sun, recurring only
  start_time      TIME,                                     -- recurring & one_off_open
  end_time        TIME,
  one_off_date    DATE,                                     -- one_off_* only
  session_type    TEXT NOT NULL CHECK (session_type IN ('intake_50','followup_50','psychiatric_30','psychiatric_60')),
  mode            TEXT NOT NULL CHECK (mode IN ('online','offline','either')),
  valid_from      DATE NOT NULL,
  valid_until     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (rule_kind = 'recurring' AND weekday IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL)
    OR (rule_kind IN ('one_off_open','one_off_block') AND one_off_date IS NOT NULL)
  )
);
CREATE INDEX idx_mhp_availability_lookup ON mhp_availability(mhp_id, valid_from, COALESCE(valid_until, '9999-12-31'::date));
```

### 6.3 Domain 3 — Intake & Assessment

#### `intake_submissions` — implements `intake-spec.md` §8.4

```sql
CREATE TABLE intake_submissions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id                  UUID REFERENCES patients(id) ON DELETE RESTRICT,
                              -- ↑ NULL allowed for crisis-path pre-account submissions (intake-spec §8.3)
  submitted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  intake_version              TEXT NOT NULL,                  -- e.g. 'v1.0.0'
  locale                      CHAR(2) NOT NULL CHECK (locale IN ('en','hi')),
  age_band                    TEXT NOT NULL CHECK (age_band IN ('18_24','25_34','35_44','45_59','60_plus')),
  clusters                    TEXT[] NOT NULL CHECK (array_length(clusters,1) BETWEEN 1 AND 4),
  primary_concern             TEXT,
  duration                    TEXT NOT NULL CHECK (duration IN ('lt_2w','2_4w','1_3m','3_6m','gt_6m')),
  impact_areas                TEXT[] NOT NULL,
  contextual                  JSONB NOT NULL,                 -- per-cluster bridging item answers
  cssrs                       JSONB NOT NULL,                 -- universal items 1-2 + gated 3-6
  track                       TEXT NOT NULL CHECK (track IN ('T1','T2','T3','T4','T5')),
  recommended_tools           TEXT[] NOT NULL,
  overrides_applied           JSONB NOT NULL DEFAULT '[]',
  safety_flags                JSONB NOT NULL,
  consent_status              TEXT NOT NULL DEFAULT 'collected' CHECK (consent_status IN ('collected','declined','not_required_crisis_path')),
  consent_privacy_version     TEXT,
  consent_telemed_version     TEXT,
  consent_transcript_hash     TEXT,
  ip_hash                     TEXT,
  user_agent_hash             TEXT,
  draft_duration_sec          INTEGER,
  turnstile_token_validated   BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_intake_patient ON intake_submissions(patient_id);
CREATE INDEX idx_intake_track ON intake_submissions(organization_id, track, submitted_at DESC);
CREATE INDEX idx_intake_safety_open ON intake_submissions(organization_id) WHERE track = 'T5';
```

#### `assessment_tool_versions`

Every tool (PHQ-9, GAD-7, etc.) is version-locked. Submissions FK to a specific (tool, version, language) so reanalysis later doesn't shift under us. Fixes Swasthmind DM-08.

```sql
CREATE TABLE assessment_tool_versions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  tool_key            TEXT NOT NULL,                          -- 'PHQ-9','GAD-7','C-SSRS','MDQ',etc
  version             TEXT NOT NULL,                          -- '1.0.0','1.0.0-hi'
  language            CHAR(2) NOT NULL CHECK (language IN ('en','hi')),
  display_name        TEXT NOT NULL,
  items               JSONB NOT NULL,                         -- [{id,prompt,response_type,options}]
  scoring_logic       JSONB NOT NULL,                         -- {algorithm, params, subscales}
  thresholds          JSONB NOT NULL,                         -- {minimal:0-4, mild:5-9, moderate:10-14, ...}
  is_clinician_only   BOOLEAN NOT NULL DEFAULT false,
  min_age             INTEGER,
  max_age             INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  source_citation     TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tool_key, version, language)
);
```

#### `assessment_submissions`

Patient-completed assessment. Immutable after `is_signed_off`. Score columns persisted for query speed; `responses` retained for full audit.

```sql
CREATE TABLE assessment_submissions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id               UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  episode_id               UUID REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  tool_version_id          UUID NOT NULL REFERENCES assessment_tool_versions(id) ON DELETE RESTRICT,
  assigned_by_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at              TIMESTAMPTZ,
  responses                JSONB NOT NULL,                    -- {item_id: response}
  total_score              NUMERIC(8,2),
  subscale_scores          JSONB,                             -- {subscale_id: score}
  severity_label           TEXT,
  flags                    JSONB NOT NULL DEFAULT '{}',       -- e.g. {cssrs_item3_plus: true}
  submitted_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_signed_off            BOOLEAN NOT NULL DEFAULT false,
  signed_off_by_user_id    UUID REFERENCES users(id) ON DELETE RESTRICT,
  signed_off_at            TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assess_patient_tool ON assessment_submissions(patient_id, tool_version_id, submitted_at DESC);
CREATE INDEX idx_assess_episode ON assessment_submissions(episode_id) WHERE episode_id IS NOT NULL;

-- Immutability after sign-off:
CREATE OR REPLACE FUNCTION prevent_signed_off_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_signed_off = true THEN
    RAISE EXCEPTION 'assessment_submissions row % is signed-off and immutable', OLD.id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_immutable_signed_off
  BEFORE UPDATE ON assessment_submissions
  FOR EACH ROW EXECUTE FUNCTION prevent_signed_off_update();

-- A15: prevent patient self-assignment of clinician-only tools (e.g. MDQ, C-SSRS interview).
CREATE OR REPLACE FUNCTION enforce_clinician_only_tools()
RETURNS TRIGGER AS $$
DECLARE
  _is_clinician_only BOOLEAN;
  _assigner_role     TEXT;
BEGIN
  SELECT is_clinician_only INTO _is_clinician_only
    FROM assessment_tool_versions WHERE id = NEW.tool_version_id;
  IF _is_clinician_only IS TRUE THEN
    SELECT role INTO _assigner_role
      FROM users WHERE id = NEW.assigned_by_user_id;
    IF _assigner_role IS NULL OR _assigner_role NOT IN ('mhp','admin','counsellor') THEN
      RAISE EXCEPTION 'tool % is clinician-only and cannot be assigned by role %',
        NEW.tool_version_id, COALESCE(_assigner_role,'<null>')
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_enforce_clinician_only_tools
  BEFORE INSERT ON assessment_submissions
  FOR EACH ROW EXECUTE FUNCTION enforce_clinician_only_tools();
```

### 6.4 Domain 4 — Episode & Treatment

#### `episodes_of_care`

The clinical container for a treatment episode. Sessions, notes, assessments, plans all FK to one episode.

```sql
CREATE TABLE episodes_of_care (
  id                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id                        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  primary_mhp_id                    UUID NOT NULL REFERENCES mhps(id) ON DELETE RESTRICT,
  intake_submission_id              UUID REFERENCES intake_submissions(id) ON DELETE RESTRICT,
  track                             TEXT NOT NULL CHECK (track IN ('T1','T2','T3','T4','T5')),
  start_date                        DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date                          DATE,
  reason_for_closure                TEXT CHECK (reason_for_closure IN ('completed_treatment','patient_request','transferred','non_attendance','crisis_referred_out','other')),
  closure_notes                     TEXT,
  closed_by_user_id                 UUID REFERENCES users(id) ON DELETE RESTRICT,
  closed_at                         TIMESTAMPTZ,
  -- DM4: surface-only auto-suggest at 90d inactivity; not auto-close
  last_session_at                   TIMESTAMPTZ,
  inactive_review_suggested_at      TIMESTAMPTZ,             -- set by daily cron when last_session_at + 90d passes
  -- Track 4 cross-reference (psychiatric):
  primary_treating_physician_external TEXT,                  -- if patient also under non-Saday psychiatrist
  -- Diagnosis (psychologist may not enter ICD; psychiatrist may; app-layer enforced):
  icd_dx_codes                      TEXT[] NOT NULL DEFAULT '{}',
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_episodes_patient ON episodes_of_care(patient_id, start_date DESC);
CREATE INDEX idx_episodes_mhp_open ON episodes_of_care(primary_mhp_id) WHERE end_date IS NULL;
CREATE INDEX idx_episodes_inactive_review ON episodes_of_care(organization_id, inactive_review_suggested_at) WHERE end_date IS NULL AND inactive_review_suggested_at IS NOT NULL;
```

#### `session_notes`

SOAP. Immutable after `signed_at` is set. **B6 critical:** RLS allows only the treating MHP to read S/O/A/P body; admin sees only metadata.

```sql
CREATE TABLE session_notes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  appointment_id      UUID NOT NULL,                          -- FK added in 0010b_cross_domain_fks.sql (forward ref to appointments)
  episode_id          UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  mhp_id              UUID NOT NULL,                          -- FK added in 0010b_cross_domain_fks.sql (forward ref to mhps)
  -- SOAP body (B6: admin RLS denies these):
  subjective          TEXT,
  objective           TEXT,
  assessment          TEXT,
  plan                TEXT,
  -- Patient-visible summary (MHP curates separately from full SOAP):
  patient_summary     TEXT,
  next_steps_summary  TEXT,
  -- Metadata (admin-visible):
  duration_minutes    INTEGER NOT NULL CHECK (duration_minutes BETWEEN 5 AND 240),
  -- A9: addendum pattern instead of UNIQUE(appointment_id) + version-in-place
  is_addendum         BOOLEAN NOT NULL DEFAULT false,
  addendum_to_id      UUID REFERENCES session_notes(id) ON DELETE RESTRICT
                       CHECK ((is_addendum = true AND addendum_to_id IS NOT NULL)
                              OR (is_addendum = false AND addendum_to_id IS NULL)),
  signed_at           TIMESTAMPTZ,
  signed_by_user_id   UUID REFERENCES users(id) ON DELETE RESTRICT,
  edit_history        JSONB NOT NULL DEFAULT '[]',          -- pre-sign edits only; post-sign blocks (A18 follow-up: V1.5 moves to a session_note_revisions table)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_notes_episode ON session_notes(episode_id);
CREATE INDEX idx_session_notes_mhp_open ON session_notes(mhp_id) WHERE signed_at IS NULL;
-- Exactly one primary (non-addendum) note per appointment; addenda are unbounded
CREATE UNIQUE INDEX uq_session_notes_primary_per_appt ON session_notes(appointment_id) WHERE is_addendum = false;

-- Immutability after sign:
CREATE OR REPLACE FUNCTION prevent_signed_session_note_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL THEN
    -- Allow ONLY metadata-irrelevant fields if any; default deny everything
    RAISE EXCEPTION 'session_notes row % is signed and immutable', OLD.id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_immutable_signed_note
  BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION prevent_signed_session_note_update();
```

#### `safety_plans`

Patient-editable Stanley-Brown Safety Plan, MHP-reviewed. Versioned.

> **A21 — co-authoring (V1):** patient is the sole writer in V1. `created_by_user_id` is patient. MHP reads the current row + signs off via `reviewed_by_mhp_at`. If clinical reality requires MHP edits (Stanley-Brown is collaborative in person), V1 workflow is "MHP types in session → patient submits." V1.5 adds true co-authorship via a `proposed_by_mhp` flag + patient-confirm step.

```sql
CREATE TABLE safety_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  episode_id          UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  warning_signs       TEXT,
  coping_strategies   TEXT,
  social_distractions TEXT,
  trusted_people      TEXT,
  professionals       TEXT,
  means_restriction   TEXT,
  version             INTEGER NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT true,        -- only one current per (patient, episode)
  created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by_mhp_at  TIMESTAMPTZ,
  reviewed_by_mhp_id  UUID REFERENCES mhps(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_safety_plan_current ON safety_plans(patient_id, episode_id) WHERE is_current = true;
```

#### `mood_logs`

Daily mood + sleep, primarily for bipolar/T4 tracking but available to all patients.

```sql
CREATE TABLE mood_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  log_date        DATE NOT NULL,
  mood_1_10       INTEGER NOT NULL CHECK (mood_1_10 BETWEEN 1 AND 10),
  sleep_hours     NUMERIC(3,1) CHECK (sleep_hours BETWEEN 0 AND 24),
  energy_1_10     INTEGER CHECK (energy_1_10 BETWEEN 1 AND 10),
  note            TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, log_date)
);
CREATE INDEX idx_mood_patient_date ON mood_logs(patient_id, log_date DESC);
```

#### `informant_observations`

L1+ caregiver submissions (e.g., spouse reports patient's sleep pattern shifted).

```sql
CREATE TABLE informant_observations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  linked_account_id   UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE RESTRICT,
  episode_id          UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  observation_type    TEXT NOT NULL CHECK (observation_type IN ('mood_shift','sleep_change','medication_adherence','crisis_concern','functional_change','other')),
  response_json       JSONB NOT NULL,
  free_text           TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by_mhp_at  TIMESTAMPTZ,
  reviewed_by_mhp_id  UUID REFERENCES mhps(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_informant_episode_unreviewed ON informant_observations(episode_id) WHERE reviewed_by_mhp_at IS NULL;
```

### 6.5 Domain 5 — Booking & Sessions

#### `appointments`

```sql
CREATE TABLE appointments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id               UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  mhp_id                   UUID NOT NULL REFERENCES mhps(id) ON DELETE RESTRICT,
  episode_id               UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  session_package_id       UUID,                              -- FK added in 0010b_cross_domain_fks.sql (forward ref to session_packages)
  scheduled_at             TIMESTAMPTZ NOT NULL,
  duration_minutes         INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  session_type             TEXT NOT NULL CHECK (session_type IN ('intake_50','followup_50','psychiatric_30','psychiatric_60')),
  mode                     TEXT NOT NULL CHECK (mode IN ('online','offline')),
  status                   TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','no_show','cancelled_by_patient','cancelled_by_mhp','rescheduled')),
  booking_channel          TEXT NOT NULL CHECK (booking_channel IN ('patient_self','mhp_admin','partner_referral')),
  price_paise              BIGINT NOT NULL CHECK (price_paise >= 0),
  payment_status           TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded','failed','package_consumed','complimentary')),
  -- A11: store room handle, not the URL. Server mints a signed join URL per participant per appointment with a short TTL.
  meeting_room_id          TEXT,                              -- Daily.co room name (e.g. 'apt-{appointment_id}')
  meeting_room_provider    TEXT CHECK (meeting_room_provider IN ('daily','jitsi')),
  meeting_room_fallback_id TEXT,                              -- Jitsi room name as fallback
  collateral_interview     BOOLEAN NOT NULL DEFAULT false,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,
  rescheduled_to_id        UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_mhp_upcoming ON appointments(mhp_id, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_appointments_patient ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX idx_appointments_episode ON appointments(episode_id);
```

#### `session_packages`

4-pack / 8-pack consumed across multiple appointments. Tealfeed pattern.

```sql
CREATE TABLE session_packages (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id               UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  episode_id               UUID NOT NULL REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  package_type             TEXT NOT NULL CHECK (package_type IN ('pack_4','pack_8')),
  total_sessions           INTEGER NOT NULL CHECK (total_sessions IN (4,8)),
  consumed_sessions        INTEGER NOT NULL DEFAULT 0 CHECK (consumed_sessions >= 0),
  price_paise              BIGINT NOT NULL CHECK (price_paise >= 0),
  payment_id               UUID,                              -- FK added in 0010b_cross_domain_fks.sql (forward ref to payments)
  purchased_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at               TIMESTAMPTZ,                       -- e.g. 6 months from purchase
  status                   TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','exhausted','expired','refunded')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (consumed_sessions <= total_sessions)
);
CREATE INDEX idx_packages_patient_active ON session_packages(patient_id) WHERE status = 'active';
```

#### `follow_up_flows`

Single-table flow definition (BP DM-06 — no CheckIn/Feedback fork; one schema, one `trigger_offset_hours`).

```sql
CREATE TABLE follow_up_flows (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mhp_id                UUID REFERENCES mhps(id) ON DELETE RESTRICT,  -- NULL = org-wide default
  flow_kind             TEXT NOT NULL CHECK (flow_kind IN ('check_in','feedback','custom')),
  title                 TEXT NOT NULL,
  trigger_offset_hours  INTEGER NOT NULL CHECK (trigger_offset_hours BETWEEN 1 AND 720),
  whatsapp_template_id  TEXT NOT NULL,                       -- MSG91/Meta template ID
  questions             JSONB NOT NULL,                      -- [{id,prompt,response_type,options}]
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `follow_up_submissions`

```sql
CREATE TABLE follow_up_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  flow_id               UUID NOT NULL REFERENCES follow_up_flows(id) ON DELETE RESTRICT,
  appointment_id        UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  responses             JSONB NOT NULL,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_via         TEXT NOT NULL CHECK (delivered_via IN ('whatsapp','sms','portal','email')),
  reviewed_by_mhp_at    TIMESTAMPTZ,
  reviewed_by_mhp_id    UUID REFERENCES mhps(id) ON DELETE RESTRICT,
  high_distress_flag    BOOLEAN NOT NULL DEFAULT false,      -- set by app-layer parser when response indicates SOS
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_followup_appointment ON follow_up_submissions(appointment_id);
CREATE INDEX idx_followup_distress ON follow_up_submissions(organization_id) WHERE high_distress_flag = true AND reviewed_by_mhp_at IS NULL;
```

### 6.6 Domain 6 — Money

#### `payments`

Razorpay transaction log. Webhook-reconciled (BP CTO #9).

```sql
CREATE TABLE payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  appointment_id           UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  session_package_id       UUID REFERENCES session_packages(id) ON DELETE RESTRICT,
  patient_id               UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  razorpay_order_id        TEXT NOT NULL UNIQUE,
  razorpay_payment_id      TEXT UNIQUE,
  amount_paise             BIGINT NOT NULL CHECK (amount_paise > 0),
  currency                 CHAR(3) NOT NULL DEFAULT 'INR',
  status                   TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','attempted','captured','failed','refunded','partial_refund')),
  webhook_received_at      TIMESTAMPTZ,
  webhook_event_id         TEXT UNIQUE,                       -- idempotency key
  refund_id                TEXT,
  refund_amount_paise      BIGINT CHECK (refund_amount_paise >= 0),
  refunded_at              TIMESTAMPTZ,
  failure_reason           TEXT,
  raw_webhook_payload      JSONB,                             -- audit
  reconciled_at            TIMESTAMPTZ,                       -- daily admin reconciliation
  reconciled_by_user_id    UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((appointment_id IS NOT NULL) OR (session_package_id IS NOT NULL))
);
CREATE INDEX idx_payments_unreconciled ON payments(organization_id, created_at) WHERE reconciled_at IS NULL AND status IN ('captured','refunded','partial_refund');
CREATE INDEX idx_payments_patient ON payments(patient_id);

-- Dead-letter for webhook retries (R-07):
CREATE TABLE payment_webhook_dlq (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  webhook_event_id    TEXT NOT NULL,
  raw_payload         JSONB NOT NULL,
  failure_reason      TEXT NOT NULL,
  attempts            INTEGER NOT NULL DEFAULT 0,
  last_attempt_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `earnings_ledger`

Tealfeed-derived (BP §2A). One row per session/package realising MHP earnings.

```sql
CREATE TABLE earnings_ledger (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mhp_id                   UUID NOT NULL REFERENCES mhps(id) ON DELETE RESTRICT,
  appointment_id           UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  session_package_id       UUID REFERENCES session_packages(id) ON DELETE RESTRICT,
  payment_id               UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  patient_id               UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  service_label            TEXT NOT NULL,                     -- 'Followup 50min','Pack-4 (1 of 4)'
  gross_amount_paise       BIGINT NOT NULL CHECK (gross_amount_paise >= 0),
  pg_charges_paise         BIGINT NOT NULL DEFAULT 0,         -- Razorpay fee
  net_amount_paise         BIGINT NOT NULL,                   -- gross - pg_charges
  total_deductions_paise   BIGINT NOT NULL DEFAULT 0,
  payable_amount_paise     BIGINT NOT NULL,                   -- net - total_deductions
  coupon_id                UUID,                              -- V1.5 reserved
  is_no_show               BOOLEAN NOT NULL DEFAULT false,
  refund_status            TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none','partial','full')),
  payout_id                UUID,                              -- FK added in 0010b_cross_domain_fks.sql (forward ref to payouts)
  payout_status            TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','batched','paid','on_hold')),
  realised_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((appointment_id IS NOT NULL) OR (session_package_id IS NOT NULL))
);
CREATE INDEX idx_earnings_mhp_pending ON earnings_ledger(mhp_id) WHERE payout_status = 'pending';
CREATE INDEX idx_earnings_payout ON earnings_ledger(payout_id) WHERE payout_id IS NOT NULL;
```

#### `deductions`

V1: single deduction kind (platform commission) + GST visible row.

```sql
CREATE TABLE deductions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  earnings_ledger_id  UUID NOT NULL REFERENCES earnings_ledger(id) ON DELETE RESTRICT,
  deduction_kind      TEXT NOT NULL CHECK (deduction_kind IN ('platform_commission','gst','tds','other')),
  amount_paise        BIGINT NOT NULL CHECK (amount_paise >= 0),
  rate_pct            NUMERIC(5,2),
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deductions_ledger ON deductions(earnings_ledger_id);
```

#### `payouts`

Batched MHP payout. One payout = one bank transfer.

```sql
CREATE TABLE payouts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mhp_id                   UUID NOT NULL REFERENCES mhps(id) ON DELETE RESTRICT,
  total_amount_paise       BIGINT NOT NULL CHECK (total_amount_paise > 0),
  payout_method            TEXT NOT NULL CHECK (payout_method IN ('razorpayx_neft','manual_neft','manual_imps')),
  bank_reference_id        TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','initiated','paid','failed','reversed')),
  initiated_at             TIMESTAMPTZ,
  paid_at                  TIMESTAMPTZ,
  failure_reason           TEXT,
  initiated_by_user_id     UUID REFERENCES users(id) ON DELETE RESTRICT,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_mhp_status ON payouts(mhp_id, status);
```

### 6.7 Domain 7 — Communications

#### `conversations`

Two-way agent reply enabled (fixes Swasthmind FL-Conv read-only gap G-01).

```sql
CREATE TABLE conversations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id               UUID REFERENCES patients(id) ON DELETE RESTRICT,
  channel                  TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','in_app')),
  channel_thread_id        TEXT,                              -- WhatsApp wa_id; null for in_app
  agent_reply_enabled      BOOLEAN NOT NULL DEFAULT true,
  ai_category              TEXT CHECK (ai_category IN ('therapy_potential','emotional_distress','information','exploration','transactional','admin','sos')),
  ai_urgency_1_5           INTEGER CHECK (ai_urgency_1_5 BETWEEN 1 AND 5),
  ai_summary               TEXT,                              -- redacted from logs (B-series PHI handling)
  ai_key_themes            TEXT[],
  ai_analyzed_at           TIMESTAMPTZ,
  status                   TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','handled','escalated','closed')),
  assigned_to_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conv_open ON conversations(organization_id) WHERE status = 'open';
CREATE INDEX idx_conv_sos ON conversations(organization_id) WHERE ai_category = 'sos' OR ai_urgency_1_5 = 5;
```

#### `messages`

```sql
CREATE TABLE messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE RESTRICT,
  direction           TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender_role         TEXT NOT NULL CHECK (sender_role IN ('patient','mhp','admin','counsellor','system_bot')),
  sender_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  body                TEXT NOT NULL,
  media_urls          TEXT[],
  channel_message_id  TEXT,                                  -- WhatsApp wamid
  template_id         TEXT,                                  -- if outbound MSG91/Meta template
  delivered_at        TIMESTAMPTZ,
  read_at             TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  failure_reason      TEXT,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, sent_at DESC);
```

#### `materials`

Psychoeducation library.

```sql
CREATE TABLE materials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  title           TEXT NOT NULL,
  language        CHAR(2) NOT NULL CHECK (language IN ('en','hi')),
  category        TEXT NOT NULL,                            -- 'sleep_hygiene','cbt_thought_record','grounding'
  tags            TEXT[] NOT NULL DEFAULT '{}',
  -- A11: store storage path, not a public URL. App mints a 5-min signed URL on download request via Supabase Storage SDK.
  file_path       TEXT NOT NULL,                            -- Supabase Storage object path, e.g. 'materials/sleep/2026-04-grounding.pdf'
  file_kind       TEXT NOT NULL CHECK (file_kind IN ('pdf','video','audio','article')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `material_dispatches`

```sql
CREATE TABLE material_dispatches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  material_id         UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  episode_id          UUID REFERENCES episodes_of_care(id) ON DELETE RESTRICT,
  assigned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_channel   TEXT NOT NULL CHECK (delivered_channel IN ('whatsapp','portal','email')),
  delivered_at        TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_material_patient ON material_dispatches(patient_id, assigned_at DESC);
```

### 6.8 Domain 8 — Privacy & Audit (the differentiator)

#### `consents` (B2)

Granular per (user, consent_type, version) ledger. Replaces the silent-collection anti-pattern.

```sql
CREATE TABLE consents (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consent_type             TEXT NOT NULL CHECK (consent_type IN (
    'privacy_policy','telemed_consent','data_processing','marketing_email','marketing_whatsapp',
    'safety_contact_attestation','informant_share','assessment_processing','ai_analysis',
    'session_recording','research_participation'
  )),
  version                  TEXT NOT NULL,                    -- e.g. 'pp-1.0','telemed-1.2'
  document_hash            TEXT NOT NULL,                    -- sha256 of the rendered legal text shown
  granted_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_via              TEXT NOT NULL CHECK (granted_via IN ('intake','portal','session','phone_attested','migration')),
  revoked_at               TIMESTAMPTZ,
  revoked_via              TEXT,
  ip_hash                  TEXT,
  user_agent_hash          TEXT,
  transcript_hash          TEXT NOT NULL,                    -- sha256 of (user_id||consent_type||version||granted_at||document_hash)
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type, version, granted_at)
);
CREATE INDEX idx_consents_user_type_active ON consents(user_id, consent_type) WHERE revoked_at IS NULL;
```

#### `data_subject_requests` (B3)

DPDP §11–§17: access · correction · erasure · nomination of legal heir.

```sql
CREATE TABLE data_subject_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_kind             TEXT NOT NULL CHECK (request_kind IN ('access','correction','erasure','nomination','withdraw_consent','grievance')),
  request_details          JSONB NOT NULL,
  requested_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_deadline             TIMESTAMPTZ NOT NULL GENERATED ALWAYS AS (requested_at + INTERVAL '30 days') STORED,  -- A12: DPDP §11–§17
  status                   TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_progress','fulfilled','denied','escalated')),
  resolution_notes         TEXT,
  resolved_at              TIMESTAMPTZ,
  resolved_by_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  data_export_url          TEXT,                              -- for access requests; signed Supabase storage URL
  data_export_expires_at   TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsr_open_sla ON data_subject_requests(sla_deadline) WHERE status NOT IN ('fulfilled','denied');
```

#### `incident_log` (B9)

Breach notification workflow. DPDP §8(6) requires demonstrable processing of incidents.

```sql
CREATE TABLE incident_log (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  incident_kind            TEXT NOT NULL CHECK (incident_kind IN ('phi_breach','phi_unauthorized_access','data_loss','vendor_breach','availability_outage','clinical_safety')),
  severity                 TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  detected_at              TIMESTAMPTZ NOT NULL,
  reported_by_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  affected_user_count      INTEGER,
  affected_data_categories TEXT[] NOT NULL,
  description              TEXT NOT NULL,
  containment_actions      TEXT,
  notification_required    BOOLEAN NOT NULL DEFAULT false,
  -- A13: DPDP §8(6) — 72h notification SLA from detection
  dpb_notification_sla_deadline TIMESTAMPTZ NOT NULL GENERATED ALWAYS AS (detected_at + INTERVAL '72 hours') STORED,
  dpb_notified_at          TIMESTAMPTZ,                       -- Data Protection Board notification
  users_notification_sla_deadline TIMESTAMPTZ NOT NULL GENERATED ALWAYS AS (detected_at + INTERVAL '72 hours') STORED,
  users_notified_at        TIMESTAMPTZ,
  status                   TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','contained','investigating','closed','postmortem')),
  closed_at                TIMESTAMPTZ,
  postmortem_url           TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_open ON incident_log(severity, detected_at DESC) WHERE status NOT IN ('closed','postmortem');
CREATE INDEX idx_incidents_dpb_overdue ON incident_log(dpb_notification_sla_deadline) WHERE notification_required = true AND dpb_notified_at IS NULL;
```

#### `audit_log` (B4) — partitioned monthly, hash-evident

```sql
CREATE TABLE audit_log (
  id                  UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  actor_user_id       UUID REFERENCES users(id) ON DELETE RESTRICT,    -- NULL for system events
  actor_role          TEXT NOT NULL CHECK (actor_role IN ('patient','mhp','admin','counsellor','linked_account','system')),
  action              TEXT NOT NULL,                                   -- 'insert','update','delete','read','login','logout','export'
  resource_type       TEXT NOT NULL,                                   -- table name or logical resource
  resource_id         UUID,
  before_row          JSONB,                                           -- previous state on update/delete
  after_row           JSONB,                                           -- new state on insert/update
  ip_hash             TEXT,
  user_agent_hash     TEXT,
  request_id          TEXT,                                            -- correlation across services
  row_hash            TEXT NOT NULL,                                   -- sha256 of canonical row
  at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, at)                                                  -- composite for partitioning
) PARTITION BY RANGE (at);

-- Initial monthly partitions; pg_partman maintains forward.
CREATE TABLE audit_log_2026_04 PARTITION OF audit_log FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_log_2026_05 PARTITION OF audit_log FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
-- ... pg_partman.create_parent('public.audit_log','at','range','monthly')

CREATE INDEX idx_audit_actor ON audit_log(actor_user_id, at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id, at DESC);
CREATE INDEX idx_audit_org_at ON audit_log(organization_id, at DESC);

-- Insert trigger that computes row_hash:
CREATE OR REPLACE FUNCTION compute_audit_row_hash()
RETURNS TRIGGER AS $$
DECLARE
  canonical TEXT;
BEGIN
  canonical := COALESCE(NEW.actor_user_id::text,'') || '|' ||
               NEW.actor_role || '|' ||
               NEW.action || '|' ||
               NEW.resource_type || '|' ||
               COALESCE(NEW.resource_id::text,'') || '|' ||
               COALESCE(NEW.before_row::text,'') || '|' ||
               COALESCE(NEW.after_row::text,'') || '|' ||
               NEW.at::text;
  NEW.row_hash := encode(digest(canonical, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_compute_audit_row_hash BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION compute_audit_row_hash();

-- Block UPDATE / DELETE entirely (append-only):
CREATE OR REPLACE FUNCTION block_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_block_audit_update BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION block_audit_mutation();
CREATE TRIGGER trg_block_audit_delete BEFORE DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION block_audit_mutation();
```

#### `audit_merkle_roots` (B4)

Weekly cron computes Merkle root over the prior week's `audit_log.row_hash` values, stores it here, and pushes a copy to S3 with object lock. External anchor proves no row was retroactively inserted.

```sql
CREATE TABLE audit_merkle_roots (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  week_starting            DATE NOT NULL,                    -- ISO week Monday
  week_ending              DATE NOT NULL,
  row_count                BIGINT NOT NULL,
  merkle_root              TEXT NOT NULL,                    -- hex sha256
  computed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  s3_object_url            TEXT NOT NULL,
  s3_object_locked_until   TIMESTAMPTZ NOT NULL,             -- compliance hold
  computed_by_job_id       TEXT NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, week_starting)
);
```

#### `phi_access_events` view (B5/B11)

Patient-queryable subset of `audit_log` showing reads of their PHI.

```sql
CREATE VIEW phi_access_events AS
SELECT
  al.id,
  al.organization_id,
  al.actor_user_id,
  al.actor_role,
  al.action,
  al.resource_type,
  al.resource_id,
  al.at,
  -- the patient_id this PHI row belongs to (joined per resource_type):
  CASE
    WHEN al.resource_type = 'patients' THEN al.resource_id
    WHEN al.resource_type IN ('intake_submissions','assessment_submissions','session_notes','safety_plans','mood_logs','informant_observations','appointments','session_packages','consents','data_subject_requests')
      THEN (al.after_row ->> 'patient_id')::UUID
    ELSE NULL
  END AS subject_patient_id
FROM audit_log al
WHERE al.action = 'read'
  AND al.resource_type IN (
    'patients','intake_submissions','assessment_submissions','session_notes',
    'safety_plans','mood_logs','informant_observations','appointments',
    'session_packages','consents','data_subject_requests'
  );
```

> **Patient query pattern (V1.5 UI):** `SELECT * FROM phi_access_events WHERE subject_patient_id = (SELECT id FROM patients WHERE user_id = auth.uid()) ORDER BY at DESC LIMIT 100;`

#### `safety_alerts` (intake-spec §7.2)

Crisis-path dispatch tracking with SLA timer.

```sql
CREATE TABLE safety_alerts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  intake_submission_id     UUID REFERENCES intake_submissions(id) ON DELETE RESTRICT,
  patient_id               UUID REFERENCES patients(id) ON DELETE RESTRICT,
  trigger_kind             TEXT NOT NULL CHECK (trigger_kind IN ('cssrs_intake','cssrs_assessment','followup_distress','informant_concern','manual_admin')),
  severity                 TEXT NOT NULL DEFAULT 'urgent' CHECK (severity IN ('urgent','critical')),
  detected_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_deadline             TIMESTAMPTZ NOT NULL,             -- detected + 2h
  whatsapp_dispatched_at   TIMESTAMPTZ,
  whatsapp_template_id     TEXT,
  assigned_to_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
  acknowledged_at          TIMESTAMPTZ,
  acknowledged_by_user_id  UUID REFERENCES users(id) ON DELETE RESTRICT,
  resolution_notes         TEXT,
  resolved_at              TIMESTAMPTZ,
  status                   TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dispatched','acknowledged','resolved','escalated')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_safety_alerts_open_sla ON safety_alerts(sla_deadline) WHERE status NOT IN ('resolved','escalated');
```

#### `clinician_review_queue`

```sql
CREATE TABLE clinician_review_queue (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  intake_submission_id     UUID REFERENCES intake_submissions(id) ON DELETE RESTRICT,
  assessment_submission_id UUID REFERENCES assessment_submissions(id) ON DELETE RESTRICT,
  reason                   TEXT NOT NULL,
  priority                 TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','normal')),
  sla_deadline             TIMESTAMPTZ NOT NULL,
  assigned_to_mhp_id       UUID REFERENCES mhps(id) ON DELETE RESTRICT,
  resolved_at              TIMESTAMPTZ,
  resolved_by_mhp_id       UUID REFERENCES mhps(id) ON DELETE RESTRICT,
  outcome                  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_queue_open ON clinician_review_queue(priority, sla_deadline) WHERE resolved_at IS NULL;
```

### 6.9 Domain 9 — Org config

#### `organization_policies`

Tealfeed-derived org-wide cancellation/reschedule.

```sql
CREATE TABLE organization_policies (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE RESTRICT,
  -- Cancellation:
  cancellation_allowed          BOOLEAN NOT NULL DEFAULT true,
  cancellation_min_notice_hours INTEGER NOT NULL DEFAULT 8,
  cancellation_refund_pct       NUMERIC(5,2) NOT NULL DEFAULT 100,
  -- Reschedule:
  reschedule_allowed            BOOLEAN NOT NULL DEFAULT true,
  reschedule_min_notice_hours   INTEGER NOT NULL DEFAULT 3,
  reschedule_max_count          INTEGER NOT NULL DEFAULT 1,
  -- Booking window:
  booking_window_days_max       INTEGER NOT NULL DEFAULT 30,
  booking_min_notice_hours      INTEGER NOT NULL DEFAULT 2,
  -- Messaging caps (BP CTO #10):
  whatsapp_per_patient_per_day  INTEGER NOT NULL DEFAULT 3,
  -- Privacy:
  privacy_policy_current_version TEXT NOT NULL,
  telemed_consent_current_version TEXT NOT NULL,
  grievance_officer_email       CITEXT NOT NULL,
  grievance_officer_phone       TEXT NOT NULL,
  -- Misc:
  timezone                      TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7 · Row-Level Security

### 7.1 Default-deny enforcement

```sql
-- Enable RLS on every PHI table; example pattern:
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;
-- repeat for: users, intake_submissions, assessment_submissions, episodes_of_care,
--   session_notes, safety_plans, mood_logs, informant_observations, appointments,
--   session_packages, payments, earnings_ledger, deductions, payouts, conversations,
--   messages, material_dispatches, consents, data_subject_requests, audit_log,
--   safety_alerts, clinician_review_queue, linked_accounts, mhps, mhp_availability,
--   follow_up_submissions
```

### 7.2 RLS helper functions (A3)

> **Identity bridge:** `auth.uid()` returns the Supabase Auth row id (`auth.users.id`). Our internal PK is `public.users.id`. **Never compare `users.id = auth.uid()` directly** — they're different columns. All helpers below resolve through `users.auth_user_id`.

```sql
-- Resolve the public.users.id for the currently-authenticated request.
-- Returns NULL for anon / service_role / unmatched JWTs.
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
-- SECURITY DEFINER + revoke from PUBLIC so the lookup always succeeds even
-- before the caller has any other grants on `users`.
REVOKE EXECUTE ON FUNCTION current_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated, anon;

-- Current user role (read from JWT custom claim 'user_role').
-- The claim is populated by a Supabase custom_access_token_hook at sign-in
-- which copies users.role into the JWT. Without the hook this returns NULL
-- and every policy denies — verified in §7.4 Test 6.
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT (auth.jwt() ->> 'user_role')::TEXT
$$ LANGUAGE SQL STABLE;

-- Is the current user a treating MHP for this patient?
CREATE OR REPLACE FUNCTION is_treating_mhp_for(_patient_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM episodes_of_care e
    JOIN mhps m ON m.id = e.primary_mhp_id
    WHERE e.patient_id = _patient_id AND m.user_id = current_user_id()
      AND e.end_date IS NULL
  )
$$ LANGUAGE SQL STABLE;

-- Is the current user a linked account with active access to this patient?
CREATE OR REPLACE FUNCTION has_linked_access(_patient_id UUID, _required_level TEXT DEFAULT 'L1') RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM linked_accounts la
    WHERE la.patient_id = _patient_id
      AND la.linked_user_id = current_user_id()
      AND la.accepted_at IS NOT NULL
      AND la.revoked_at IS NULL
      AND la.access_level >= _required_level
  )
$$ LANGUAGE SQL STABLE;
```

### 7.3 Per-table policies

#### 7.3.0 Policy templates (A14)

Every PHI table gets a policy set drawn from one of four templates below. The W4 Mon engineer applies the template named in §7.3.1 verbatim, replacing `<TBL>` and `<patient_id_expr>` with the table-specific values. This keeps 30 tables consistent.

**Template P (patient-owned):** `patients`, `intake_submissions`, `assessment_submissions`, `safety_plans`, `mood_logs`, `appointments`, `session_packages`, `payments`, `consents`, `data_subject_requests`, `material_dispatches`, `follow_up_submissions`.

```sql
ALTER TABLE <TBL> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <TBL> FORCE  ROW LEVEL SECURITY;
-- Patient self-read & self-write
CREATE POLICY p_<tbl>_self_rw ON <TBL> FOR ALL
  USING (<patient_id_expr> IN (SELECT id FROM patients WHERE user_id = current_user_id()))
  WITH CHECK (<patient_id_expr> IN (SELECT id FROM patients WHERE user_id = current_user_id()));
-- Treating MHP read+write
CREATE POLICY p_<tbl>_mhp_rw ON <TBL> FOR ALL
  USING (is_treating_mhp_for(<patient_id_expr>))
  WITH CHECK (is_treating_mhp_for(<patient_id_expr>));
-- Linked account L1+ read-only (app-layer narrows columns per access_level)
CREATE POLICY p_<tbl>_linked_read ON <TBL> FOR SELECT
  USING (has_linked_access(<patient_id_expr>));
-- Admin read (operational queue, billing, reconciliation)
CREATE POLICY p_<tbl>_admin_read ON <TBL> FOR SELECT
  USING (current_user_role() = 'admin');
```

**Template C (clinician-private):** `session_notes`, `informant_observations`. Admin denied SELECT entirely; admin uses metadata view.

```sql
-- See §7.3.2 worked example for session_notes; informant_observations follows the same shape
-- but with `linked_account_id` joined back to a patient through linked_accounts.
```

**Template M (MHP-owned):** `mhps`, `mhp_availability`, `earnings_ledger`, `deductions`, `payouts`.

```sql
-- MHP self-read/write own row
CREATE POLICY p_<tbl>_mhp_self ON <TBL> FOR ALL
  USING (mhp_id IN (SELECT id FROM mhps WHERE user_id = current_user_id()))
  WITH CHECK (mhp_id IN (SELECT id FROM mhps WHERE user_id = current_user_id()));
-- Admin full read (commercial), no write of clinical fields
CREATE POLICY p_<tbl>_admin_read ON <TBL> FOR SELECT
  USING (current_user_role() = 'admin');
-- Patients see their assigned/treating MHP's listing-fields via a view (not the table)
```

**Template S (system / org-wide):** `organizations`, `user_roles`, `vendor_dpas`, `assessment_tool_versions`, `materials`, `follow_up_flows`, `organization_policies`. Read by all authenticated users in the org; writes admin-only.

```sql
CREATE POLICY p_<tbl>_org_read ON <TBL> FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = current_user_id()));
CREATE POLICY p_<tbl>_admin_write ON <TBL> FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
```

**Template A (audit / privacy infra):** `audit_log`, `audit_merkle_roots`, `incident_log`, `safety_alerts`, `clinician_review_queue`. Admin/counsellor read; service_role write only (see audit_log block in §7.3.2 below).

#### 7.3.1 Per-table template assignment

| Table | Template | `<patient_id_expr>` |
|---|---|---|
| `patients` | P (with `id` as patient ref) | `id` |
| `intake_submissions` | P | `patient_id` |
| `assessment_submissions` | P | `patient_id` |
| `episodes_of_care` | P | `patient_id` |
| `session_notes` | **C** (worked below) | `patient_id` |
| `safety_plans` | P | `patient_id` |
| `mood_logs` | P | `patient_id` |
| `informant_observations` | C | resolves via `linked_accounts.patient_id` |
| `appointments` | P | `patient_id` |
| `session_packages` | P | `patient_id` |
| `payments` | P | `patient_id` |
| `earnings_ledger` | M | n/a (mhp_id) |
| `deductions` | M (joined via earnings_ledger) | n/a |
| `payouts` | M | n/a (mhp_id) |
| `conversations` | P | `patient_id` |
| `messages` | P (joined via conversations.patient_id) | resolves via `conversations` |
| `materials` | S | n/a |
| `material_dispatches` | P | `patient_id` |
| `follow_up_flows` | S | n/a |
| `follow_up_submissions` | P | `patient_id` |
| `consents` | P (with `user_id` as patient owner via `patients.user_id`) | resolved via `patients.user_id` |
| `data_subject_requests` | P (same) | resolved via `patients.user_id` |
| `audit_log` | **A** (worked below) | n/a |
| `audit_merkle_roots` | A | n/a |
| `safety_alerts` | A + patient self-read | `patient_id` |
| `clinician_review_queue` | A | n/a |
| `incident_log` | A | n/a |
| `linked_accounts` | P + linked-self-read | `patient_id` |
| `users` | special — self-read, admin-read, no patient access | n/a |
| `mhps` | M + patients-read-listing-fields-via-view | n/a |
| `mhp_availability` | M + org-read | n/a |
| `vendor_dpas` | S | n/a |
| `organizations` | S | n/a |
| `user_roles` | S | n/a |
| `organization_policies` | S | n/a |
| `assessment_tool_versions` | S | n/a |

#### 7.3.2 Worked examples

##### `patients`

```sql
-- Patient sees own row
CREATE POLICY p_patients_self_read ON patients FOR SELECT
  USING (user_id = current_user_id());
-- Treating MHP sees patient
CREATE POLICY p_patients_mhp_read ON patients FOR SELECT
  USING (current_user_role() = 'mhp' AND assigned_mhp_id IN (SELECT id FROM mhps WHERE user_id = current_user_id()));
-- Linked account L1+ sees patient (limited view enforced at app layer)
CREATE POLICY p_patients_linked_read ON patients FOR SELECT
  USING (has_linked_access(id));
-- Admin sees patient (without bank/health detail expansion — admin app must request only allowed cols)
CREATE POLICY p_patients_admin_read ON patients FOR SELECT
  USING (current_user_role() = 'admin');
-- Patient updates own profile
CREATE POLICY p_patients_self_update ON patients FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());
```

##### `session_notes` (B6 — admin denied SOAP body)

The simplest enforcement: deny admin from SELECT entirely on this table; admin uses a metadata-only view.

```sql
-- Treating MHP read+write (pre-sign)
CREATE POLICY p_notes_mhp_full ON session_notes FOR ALL
  USING (mhp_id IN (SELECT id FROM mhps WHERE user_id = current_user_id()))
  WITH CHECK (mhp_id IN (SELECT id FROM mhps WHERE user_id = current_user_id()));
-- Patient reads only the patient_summary / next_steps_summary fields — enforced via VIEW
-- (RLS controls row visibility; column projection controlled by view privileges)
CREATE VIEW patient_session_summaries AS
  SELECT id, organization_id, appointment_id, episode_id, patient_id, mhp_id,
         patient_summary, next_steps_summary, signed_at
  FROM session_notes WHERE signed_at IS NOT NULL;
GRANT SELECT ON patient_session_summaries TO authenticated;
CREATE POLICY p_summaries_patient ON patient_session_summaries FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = current_user_id()));
-- ADMIN: no policy on session_notes → admin cannot SELECT this table at all.
-- Admin uses the metadata-only view:
CREATE VIEW session_notes_metadata AS
  SELECT id, organization_id, appointment_id, episode_id, patient_id, mhp_id,
         duration_minutes, version, signed_at, created_at, updated_at
  FROM session_notes;
GRANT SELECT ON session_notes_metadata TO authenticated;
CREATE POLICY p_notes_meta_admin ON session_notes_metadata FOR SELECT
  USING (current_user_role() = 'admin');
```

##### `audit_log` (A4 + A5/A16)

```sql
-- READ: admins see all audit rows in their org. The `before_row` / `after_row` JSONB
-- for sensitive resource_types is already redacted at write time (see app-layer rule below),
-- so admin reading audit_log cannot recover SOAP body or AI summaries.
CREATE POLICY p_audit_admin_read ON audit_log FOR SELECT
  USING (current_user_role() IN ('admin','counsellor'));

-- INSERT: service_role only. Authenticated end-user roles cannot write audit_log directly.
-- This closes actor-forgery (e.g., a patient inserting actor_role='admin' rows).
REVOKE INSERT ON audit_log FROM authenticated, anon;
GRANT INSERT ON audit_log TO service_role;
-- No INSERT policy is created for end-user roles. Service_role bypasses RLS.

-- (Patients see audit rows where they are the subject via the phi_access_events view, not the table directly.)
```

> **A5/A16 — app-layer redaction rule (authoritative; codified in `src/lib/audit.ts` W4 deliverable):**
> Before INSERTing into `audit_log`, the writer must redact PHI from `before_row` / `after_row` JSONB based on `resource_type`:
>
> | resource_type | Strip these keys from before_row & after_row |
> |---|---|
> | `session_notes` | `subjective`, `objective`, `assessment`, `plan`, `edit_history` |
> | `conversations` | `ai_summary`, `ai_key_themes` |
> | `messages` | `body` (V1 — V1.5 once messages are E2E we can drop this) |
> | `assessment_submissions` | `responses` (keep score columns) |
> | `safety_plans` | `warning_signs`, `coping_strategies`, `social_distractions`, `trusted_people`, `professionals`, `means_restriction` |
> | `informant_observations` | `response_json`, `free_text` |
> | `intake_submissions` | `contextual`, `cssrs` (keep `track`, `clusters`, `safety_flags`) |
>
> The redacted keys are replaced with the literal string `"[REDACTED]"` so diff inspection still shows whether the field changed without revealing content. Audit_log does not need PHI to satisfy "who did what when"; the surviving columns are sufficient.
>
> **Validation:** W4 Wed attack tests (§7.4) include "admin SELECTs audit_log WHERE resource_type='session_notes' and asserts no SOAP keywords appear in JSONB."

### 7.4 RLS attack tests (W4 Wed DoD)

```sql
-- Test 1: Patient A cannot read Patient B's intake
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"<patient_A_user_id>","user_role":"patient"}';
SELECT * FROM intake_submissions WHERE patient_id = '<patient_B_id>';
-- Expected: 0 rows

-- Test 2: MHP A cannot read MHP B's session notes
SET LOCAL request.jwt.claims TO '{"sub":"<mhp_A_user_id>","user_role":"mhp"}';
SELECT subjective FROM session_notes WHERE mhp_id = '<mhp_B_id>';
-- Expected: 0 rows OR error

-- Test 3: Admin cannot read SOAP body
SET LOCAL request.jwt.claims TO '{"sub":"<admin_user_id>","user_role":"admin"}';
SELECT subjective FROM session_notes LIMIT 1;
-- Expected: 0 rows (no policy grants admin read on this table)
SELECT * FROM session_notes_metadata LIMIT 1;
-- Expected: 1 row (metadata view ungranted SOAP cols)

-- Test 4: Linked account L1 cannot escalate to L3-only data
-- (informant_observations vs. assessment_submissions detail)
SET LOCAL request.jwt.claims TO '{"sub":"<linked_user_id>","user_role":"linked_account"}';
SELECT responses FROM assessment_submissions WHERE patient_id = '<patient_id>';
-- Expected: 0 rows (no linked_account policy on this table)

-- Test 5: Role spoofing in JWT — server must reject mismatched JWT vs DB role
-- (App-layer test, not pure SQL.)

-- Test 6 (A3): identity bridge correctness — current_user_id() resolves through users.auth_user_id
SET LOCAL request.jwt.claims TO '{"sub":"<auth.users.id of patient_A>","user_role":"patient"}';
SELECT current_user_id() = (SELECT id FROM users WHERE auth_user_id = '<auth.users.id of patient_A>');
-- Expected: true. If false, no policy will ever match for legitimate users.

-- Test 7 (A4): patient cannot forge audit_log row
SET LOCAL request.jwt.claims TO '{"sub":"<auth.users.id of patient_A>","user_role":"patient"}';
INSERT INTO audit_log (organization_id, actor_user_id, actor_role, action, resource_type, at)
VALUES ('<org_id>', '<some_admin_user_id>', 'admin', 'read', 'session_notes', now());
-- Expected: ERROR — INSERT denied (REVOKEd from authenticated role)

-- Test 8 (A5/A16): admin reads audit_log for session_notes — no SOAP keywords appear
SET LOCAL request.jwt.claims TO '{"sub":"<auth.users.id of admin>","user_role":"admin"}';
SELECT before_row, after_row FROM audit_log
  WHERE resource_type = 'session_notes' LIMIT 100;
-- Expected: every (before_row||after_row)::text contains the literal '[REDACTED]' for keys
--   subjective/objective/assessment/plan/edit_history; the underlying SOAP text never appears.
-- Programmatic assertion (psql):
--   SELECT count(*) FROM audit_log
--    WHERE resource_type = 'session_notes'
--      AND (after_row::text ~* '(subjective|objective|assessment|plan)' )
--      AND after_row::text NOT LIKE '%[REDACTED]%';
--   Expected: 0

-- Test 9 (A11): meeting_url leak — verify column does not exist on appointments
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'appointments' AND column_name LIKE 'meeting_url%';
-- Expected: 0 rows (only meeting_room_id / meeting_room_provider / meeting_room_fallback_id exist)

-- Test 10 (A15): patient cannot self-assign clinician-only tool
SET LOCAL request.jwt.claims TO '{"sub":"<auth.users.id of patient_A>","user_role":"patient"}';
INSERT INTO assessment_submissions
  (organization_id, patient_id, tool_version_id, assigned_by_user_id, responses)
VALUES ('<org_id>', '<patient_id>',
        (SELECT id FROM assessment_tool_versions WHERE tool_key = 'MDQ' LIMIT 1),
        (SELECT id FROM users WHERE auth_user_id = '<auth.users.id of patient_A>'),
        '{}'::jsonb);
-- Expected: ERROR from trg_enforce_clinician_only_tools

-- Test 11 (A8): under-18 dob rejected
INSERT INTO patients (organization_id, user_id, display_name, dob)
VALUES ('<org_id>','<user_id>','Test', CURRENT_DATE - INTERVAL '17 years');
-- Expected: ERROR — CHECK constraint on dob (>= 18 years)
```

---

## 8 · Audit log mechanics

### 8.1 What gets logged

Every INSERT/UPDATE/DELETE on PHI tables (patients, episodes_of_care, session_notes, intake_submissions, assessment_submissions, safety_plans, mood_logs, informant_observations, appointments, payments, consents, data_subject_requests, linked_accounts, conversations, messages). Triggered server-side in the app layer, not via DB triggers (so we capture actor context from the request).

For READs: only PHI tables with `phi_access_events` view membership are logged. Bulk reads (e.g., admin listing 100 patients) log one row per row read with the same `request_id` for grouping.

### 8.2 Per-row content hash + weekly Merkle anchor (A7)

> **Honest framing:** this is **not** a per-row prev-pointer hash chain. Each `row_hash` is independent (sha256 of the canonical row's own content). A within-week single-row tamper is detectable only after the Sunday Merkle is computed for that week. We chose this trade-off because per-row prev-pointer chains serialise audit inserts (one `SELECT` of the previous row's hash before each `INSERT`), and audit volume on a hot path makes that contention real. V1.5 candidate: add a real chain (`prev_row_hash` column populated by trigger) once we measure write-path headroom.

Mechanics:
- Every row gets `row_hash` (sha256 of canonical content) at insert via the `compute_audit_row_hash` trigger.
- A weekly cron at Sunday 02:00 IST runs `cron.compute_audit_merkle(week_starting)` which:
  1. SELECTs all `row_hash` from `audit_log` WHERE `at >= week_starting AND at < week_ending`.
  2. Builds a Merkle tree, computes root hash.
  3. INSERTs into `audit_merkle_roots`.
  4. PUTs the root hash + row count into S3 ap-south-1 bucket `saday-audit-roots` with object lock retention until detected_at + 7 years.
  5. **(V1.5)** mirror the same root hash to a second cloud — Cloudflare R2 — for shared-fate isolation. Hash only, no PHI, DPDP-safe.
- Tamper detection: at any point, anyone with the audit_log can recompute the Merkle root for a past week and compare to the externally-anchored value.

### 8.3 Retention

DPDP and clinical record-keeping conventions (Mental Healthcare Act 2017): minimum 7 years post episode closure. Audit_log: 7 years. After retention, partitions are exported to cold storage and dropped.

---

## 9 · Data Subject Rights workflow (B3)

| Right | DPDP § | Workflow | SLA |
|---|---|---|---|
| Right to access | §11 | Patient submits via portal → admin sees in queue → admin approves → cron generates JSON+PDF export to signed Supabase URL → email to patient | 30 days |
| Right to correction | §12 | Patient submits with field+correction → admin reviews → if approved, update + audit_log entry "correction" with before/after | 30 days |
| Right to erasure | §13 | Patient submits → admin reviews legal-hold status (clinical record retention may override; documented refusal sent if so) → if approved, hard-delete patient row + cascade per `data_model.md §3.6` exceptions + audit_log captures redacted summary | 30 days |
| Right to nominate | §14 | Patient designates an heir for posthumous data control → stored in `data_subject_requests` with `request_kind='nomination'` + nominee details in `request_details` JSONB | n/a |
| Withdraw consent | §6(4) | Patient via portal toggles a granular consent → INSERT into `consents` with `revoked_at` set → downstream processing checks `consents.revoked_at IS NULL` filter | Immediate |
| Grievance | §13(3) | Patient submits → goes to grievance officer email + admin queue → response logged | 30 days |

All right-types: an `audit_log` entry per state change. Refusal to fulfil = legal-justification text required + ML reviewable.

---

## 10 · Migration strategy (W4 Mon)

1. Create Supabase project ap-south-1.
2. Run `supabase/migrations/0001_extensions.sql` (pgcrypto, pg_partman, citext, supabase_vault, pg_cron).
3. Run `0002_organizations_and_users.sql` (Domain 1) — including `users.auth_user_id REFERENCES auth.users(id)` (A3) and the `on_auth_user_created` trigger that mints public.users rows.
4. Run `0003_people.sql` (Domain 2) — `patients.assigned_mhp_id` and `linked_accounts.scoped_episode_id` declared **without FK** (column only); FK added in 0010b.
5. Run `0004_intake_assessment.sql` (Domain 3).
6. Run `0005_episode_treatment.sql` (Domain 4) — `session_notes.appointment_id` and `session_notes.mhp_id` declared **without FK**; FK added in 0010b.
7. Run `0006_booking.sql` (Domain 5) — `appointments.session_package_id` and `session_packages.payment_id` declared **without FK**; FK added in 0010b.
8. Run `0007_money.sql` (Domain 6) — `earnings_ledger.payout_id` declared **without FK**; FK added in 0010b.
9. Run `0008_communications.sql` (Domain 7).
10. Run `0009_privacy_audit.sql` (Domain 8) — including pg_partman setup for audit_log monthly partitioning.
11. Run `0010_org_config.sql` (Domain 9).
12. **Run `0010b_cross_domain_fks.sql`** (A2) — adds the deferred FKs as `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ... ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED`. Specifically:
    - `patients.assigned_mhp_id → mhps(id)`
    - `linked_accounts.scoped_episode_id → episodes_of_care(id)`
    - `session_notes.appointment_id → appointments(id)`
    - `session_notes.mhp_id → mhps(id)`
    - `appointments.session_package_id → session_packages(id)`
    - `session_packages.payment_id → payments(id)`
    - `earnings_ledger.payout_id → payouts(id)`
13. Run `0011_vault_secrets.sql` (A10) — vault entries `phone_key_v1`, `bank_key_v1`, `safety_contact_key_v1`, `pan_key_v1`; grants on `app_secret`.
14. Run `0012_rls_policies.sql` (all RLS enables + helper functions + per-table policies per §7.3.0/7.3.1, worked examples spelled in §7.3.2).
15. Run `0013_views.sql` (`patient_session_summaries`, `session_notes_metadata`, `phi_access_events`, `vw_earnings_inr`).
16. Run `0014_triggers.sql` (immutability triggers; audit row_hash trigger; age_band trigger; clinician-only enforcement).
17. Run `0015_seed_org_and_policies.sql` (one row in `organizations`, one row in `organization_policies`, role seed, JWT custom_access_token_hook config).
18. Run `0016_rls_attack_tests.sql` from §7.4 — must all pass.

Rollback: every migration has a paired `down` migration. Audit_log partitions are detached, not dropped, on rollback. Vault secrets remain (manual rotation only).

---

## 11 · Indexes summary

Beyond the per-table indexes shown above, post-migration we add these **partial / composite** indexes when query patterns settle (W6):

- `appointments(patient_id, scheduled_at) WHERE status IN ('scheduled','completed')` — patient timeline
- `payments(patient_id, status, created_at DESC)` — patient billing history
- `audit_log(resource_type, resource_id, at DESC)` — already indexed; verify selectivity
- `messages(conversation_id, sent_at DESC)` — chat scroll
- `mood_logs(patient_id, log_date DESC)` — mood chart

---

## 12 · V2 reservations (do NOT add columns now)

Per BP §11, the following V2 entities are reserved as concepts. **Do not** scaffold their tables in V1 — adding empty tables we don't write to creates RLS holes and audit confusion. We add them via a real migration when V2 starts.

- `prescriptions` (IT Act §5 digital signature; Track 4)
- `lab_orders` + `lab_results` (Thyrocare / Dr Lal partner APIs)
- `referrals` (V2 partner network)
- `abha_links` (ABDM Health ID)
- `group_sessions` (DBT skills, peer-support)

---

## 13 · Open questions

| # | Question | Default if no decision by W2 Tue |
|---|---|---|
| Q1 | Should `users.email` be globally unique or per-org unique? V1 single-tenant → either works. V2 multi-tenant → per-org is correct. | **Locked v1.1 (A17): V1 = global `UNIQUE` on `users.email` only.** V2 migration drops global UNIQUE and adds `UNIQUE (organization_id, email)`. Both-at-once was redundant and confusing. |
| Q2 | Is `mhps.commission_pct` org-default with per-MHP override, or always per-MHP? | Per-MHP (locked). Override-on-appointment in V1.5 if commercial demands. |
| Q3 | `patient_summary` and `next_steps_summary` on `session_notes` — are these MHP-edited *separately* from SOAP, or generated by AI from SOAP? | MHP-edited separately V1; AI-suggest V1.5. |
| Q4 | Should `assessment_submissions.responses` be encrypted at rest (pgcrypto) like phone? Costly for query but maximises B7 scope. | No. RLS + at-rest cloud encryption sufficient for V1. Add for assessments containing PHI text fields (e.g., free-text PCL-5 follow-ups) in V1.5. |
| Q5 | `audit_log` partition retention beyond 7 years — drop or archive? | Archive (export to encrypted S3, drop partition). Document in incident-response SOP. |
| Q6 | `patients.notes_for_mhp` — patient-authored, MHP-only-read. Should this be encrypted and only decryptable with MHP session key? | Plain text + RLS V1. Encryption V1.5 with key-management. |
| Q7 | Should the safety-contact attestation also produce a `consents` row of type `safety_contact_attestation`? | Yes. Lock: every safety-contact assignment writes both `patients.safety_contact_consent_attested_at` AND a `consents` row of type `safety_contact_attestation`. Deduplication via UNIQUE (user, type, version, granted_at). |

---

## 14 · References

- `Saday_Master_Blueprint.html` — §11 (entity catalogue), §12 (CTO non-negotiables), §13 (stack), §14 (compliance).
- `Saday_Action_Plan_by_Claude.md` — Phase 0 W1 Wed, Phase 2 W4 Mon (Supabase migration), W4 Wed (RLS tests).
- `docs/intake-spec.md` — §8 (data shapes), §7 (safety path → safety_alerts).
- `docs/Swasthmind CRM/SwasthMind_CRM_Phase5_DataModel.md` — comparator (camelCase, no PHI separation, no audit log, no version locking).
- `docs/Swasthmind CRM/SwasthMind_CRM_Phase7_SecurityCompliance.md` — 16 findings (1 CRITICAL + 5 HIGH); we measurably exceed all of them.
- `docs/Tealfeed/Tealfeed Scanner output/` — earnings ledger / payouts / deductions column shape; cancellation/reschedule policy primitives.
- DPDP 2023 §6 (consent), §8(5)(6) (processing records, breach), §11–§17 (rights), §17 (erasure), §27–§37 (Data Protection Board).
- Mental Healthcare Act 2017 — §23 (confidentiality), §24 (right to access medical records).
- Telemedicine Practice Guidelines 2020 (MoHFW) — record-keeping minima.

---

## 15 · Definition of Done — data-model.md

- [x] DDL for all 34 tables across 9 domains.
- [x] DM1–DM5 + B1–B11 + α safety-contact decisions reflected in schema.
- [x] Identity bridge to Supabase Auth (A3) — `users.auth_user_id` + helper resolution.
- [x] RLS enable + helper functions + 4-template policy pattern + per-table tagging + 3 worked examples.
- [x] RLS attack-test SQL (W4 Wed prep) — 11 tests including identity bridge, audit-forgery, PHI redaction, clinician-only enforcement, 18+ check.
- [x] Per-row content hash + weekly Merkle anchor (no overclaim of "hash-chain"; real chain V1.5).
- [x] App-layer audit redaction rule for SOAP / ai_summary / messages / safety_plans / informant_observations / intake_submissions.
- [x] DSR workflow mapped to DPDP §11–§17 with GENERATED SLA.
- [x] DPDP §8(6) 72h breach notification SLA generated on `incident_log`.
- [x] pgcrypto via Supabase Vault (no GUC keys); key rotation runbook deferred to V1.5.
- [x] Migration order with explicit `0010b_cross_domain_fks.sql` step that resolves all forward FKs.
- [x] Open questions captured with defaults; A17 (email uniqueness) re-locked in v1.1.
- [ ] **CTO security review** — pending W2 Mon. v1.1 closes A1–A22; reviewer should focus on A10 vault scoping, A4 service_role boundaries, A5/A16 redaction completeness.
- [ ] **CF clinical review** — pending W2 Wed (clinical entities only); see Q2/Q3/Q6 of §13 + A21 safety_plans co-authoring.
- [ ] **ML review** — Phase 3 W13.
- [ ] **W4 RLS attack test pass** — gating Phase 2 W4 DoD.

---

## 16 · v1.1 audit log

11 issues from internal audit on 2026-04-26 patched into v1.1. Categorised:

**Blockers (would not migrate):** A1 (GENERATED expression non-IMMUTABLE), A2 (cross-domain FK forward references — 7 columns), A3 (auth.uid vs users.id mismatch — every RLS policy broken).

**Silent security holes:** A4 (audit_log INSERT actor-forgery), A5/A16 (audit JSONB re-leaked SOAP / ai_summary), A10 (pgcrypto key custody unspecified — B7 untestable), A11 (meeting_url / file_url stored as capabilities).

**Honest framing:** A7 ("hash-chain" → "per-row hash + weekly Merkle anchor"), A18 (messages encryption parity disclosed in privacy posture).

**Logic / consistency:** A8 (dob/age_band drift + 18+ unenforced), A9 (session_notes UNIQUE vs version contradiction), A12/A13 (SLA columns now GENERATED), A14 (RLS template formalised), A15 (clinician-only tool trigger), A17 (email UNIQUE Q1 self-contradiction), A19 (vendor_dpas dedup), A21 (safety_plans co-authoring rule), A22 (V1.5 cross-cloud Merkle mirror).

A6 (JWT custom claim) and A20 (track enum atomic-migration discipline) are documentation/process notes, not schema changes — captured inline in §7.2 and §3.3 respectively.

---

**Maintainer:** CTO · drafted by Claude on 2026-04-25, audited and patched 2026-04-26.
**Next revision:** v2 after CTO + CF review (W2 Wed). v3 after RLS attack-test pass (W4 Wed). v4 after ML review (W13).
**Supersedes:** v1.0 (2026-04-25).

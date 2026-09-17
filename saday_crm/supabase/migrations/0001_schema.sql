-- =====================================================================
-- Saday Wellness — Consultation CRM
-- 0001_schema.sql  ·  v1  ·  2026-09-17
--
-- Targets a fresh Supabase project (Postgres 15+), region ap-south-1.
-- Conventions inherited from the prior data-model.md §3:
--   snake_case · TEXT+CHECK instead of ENUM · TIMESTAMPTZ (UTC) with _at
--   suffix · BIGINT paise with _paise suffix · BYTEA with _encrypted suffix
--   · positive-verb booleans · organization_id on every PHI table
--   · all FKs ON DELETE RESTRICT · updated_at by trigger.
--
-- Everything is default-deny: RLS is ENABLEd *and* FORCEd on every table.
-- Companion: docs/architecture.md (§3 RLS map, §10 booking, §11 immutability).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0 · Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid(), pgp_sym_*
CREATE EXTENSION IF NOT EXISTS citext;        -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS btree_gist;    -- uuid WITH = in EXCLUDE constraints


-- ---------------------------------------------------------------------
-- 1 · Generic trigger functions
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Blanket DELETE block (clinical + ledger + audit tables).
CREATE OR REPLACE FUNCTION forbid_delete() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'rows in % are never deleted', TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

-- Blanket UPDATE block (append-only tables).
CREATE OR REPLACE FUNCTION forbid_update() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'rows in % are append-only and cannot be updated', TG_TABLE_NAME
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

-- Sign -> lock. A locked row may only receive superseded_at (once).
-- TG_ARGV[0] = name of the column whose non-NULL value means "signed".
--
-- Note: STORED GENERATED columns (is_locked) are not yet computed on NEW inside
-- a BEFORE trigger, so they always read NULL and must be excluded from the
-- comparison — they are derived from real columns anyway and cannot be tampered
-- with independently.
CREATE OR REPLACE FUNCTION enforce_versioned_immutability() RETURNS TRIGGER AS $$
DECLARE
  _old      JSONB := to_jsonb(OLD);
  _new      JSONB := to_jsonb(NEW);
  _col      TEXT  := TG_ARGV[0];
  _ignore   TEXT[];
BEGIN
  IF (_old ->> _col) IS NULL THEN
    RETURN NEW;                                  -- still a draft: freely editable
  END IF;

  SELECT ARRAY['superseded_at','updated_at'] || COALESCE(array_agg(a.attname), '{}')
    INTO _ignore
  FROM pg_attribute a
  WHERE a.attrelid = TG_RELID AND a.attnum > 0 AND NOT a.attisdropped
    AND a.attgenerated <> '';

  _old := _old - _ignore;
  _new := _new - _ignore;

  IF _old IS DISTINCT FROM _new THEN
    RAISE EXCEPTION
      '% row % is signed and immutable; insert a new version (supersedes_id = %) instead',
      TG_TABLE_NAME, OLD.id, OLD.id USING ERRCODE = 'check_violation';
  END IF;

  IF (_old ->> 'superseded_at') IS NOT NULL THEN
    RAISE EXCEPTION '% row % is already superseded', TG_TABLE_NAME, OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------
-- 2 · Tenancy & identity
-- ---------------------------------------------------------------------

CREATE TABLE organizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  whatsapp_number     TEXT,                               -- E.164
  support_email       CITEXT,
  razorpay_account_id TEXT,
  timezone            TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency            CHAR(3) NOT NULL DEFAULT 'INR',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  auth_user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  role                  TEXT NOT NULL CHECK (role IN ('patient','provider','admin')),
  email                 CITEXT UNIQUE,                    -- staff identity; NULL for phone-only patients
  phone_encrypted       BYTEA,                            -- pgcrypto; raw never stored
  phone_last4           TEXT CHECK (phone_last4 IS NULL OR phone_last4 ~ '^[0-9]{4}$'),
  preferred_language    CHAR(2) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','hi')),
  totp_enrolled_at      TIMESTAMPTZ,
  totp_required         BOOLEAN GENERATED ALWAYS AS (role IN ('provider','admin')) STORED,
  idle_timeout_minutes  INTEGER NOT NULL DEFAULT 30 CHECK (idle_timeout_minutes BETWEEN 5 AND 120),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  last_login_at         TIMESTAMPTZ,
  email_verified_at     TIMESTAMPTZ,
  phone_verified_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (role = 'patient' OR email IS NOT NULL)
);
CREATE INDEX idx_users_auth           ON users(auth_user_id);
CREATE INDEX idx_users_org_role       ON users(organization_id, role) WHERE is_active;
CREATE INDEX idx_users_phone_last4    ON users(organization_id, phone_last4) WHERE phone_last4 IS NOT NULL;

-- Informational only; access is enforced by RLS, not by this table.
CREATE TABLE user_roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL CHECK (name IN ('patient','provider','admin')),
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);


-- ---------------------------------------------------------------------
-- 3 · People
-- ---------------------------------------------------------------------

-- Intake is three fields only (D-004): name, age, sex.
CREATE TABLE patients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  display_name          TEXT NOT NULL,
  age_years             INTEGER NOT NULL CHECK (age_years BETWEEN 0 AND 120),
  sex                   TEXT NOT NULL CHECK (sex IN ('female','male','other','prefer_not')),
  preferred_language    CHAR(2) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','hi')),
  assigned_provider_id  UUID,                             -- FK added after providers exists
  city                  TEXT,
  notes_for_provider    TEXT,                             -- patient-authored
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_org      ON patients(organization_id);
CREATE INDEX idx_patients_assigned ON patients(assigned_provider_id) WHERE assigned_provider_id IS NOT NULL;

-- Public profile fields per BUILD_PLAN §2 (Swasthmind pattern) + commission (D-018).
CREATE TABLE providers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id                   UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  slug                      TEXT NOT NULL,
  display_name              TEXT NOT NULL,
  professional_title        TEXT NOT NULL CHECK (professional_title IN (
                              'psychiatrist','clinical_psychologist','counselling_psychologist',
                              'psychotherapist','counsellor')),
  qualifications            TEXT[] NOT NULL DEFAULT '{}',
  specialisations           TEXT[] NOT NULL DEFAULT '{}',
  concerns_addressed        TEXT[] NOT NULL DEFAULT '{}',
  languages_spoken          TEXT[] NOT NULL DEFAULT '{en}',
  registration_council      TEXT NOT NULL CHECK (registration_council IN ('NMC','RCI','none')),
  registration_number       TEXT,
  registration_verified_at  TIMESTAMPTZ,
  years_experience          INTEGER NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
  bio_short                 TEXT,
  bio_long                  TEXT,
  photo_path                TEXT,                         -- storage path, never a public URL
  commission_pct            NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (commission_pct BETWEEN 0 AND 100),
  bank_account_no_encrypted BYTEA,
  bank_ifsc_encrypted       BYTEA,
  bank_account_holder_name  TEXT,
  pan_encrypted             BYTEA,
  is_accepting_patients     BOOLEAN NOT NULL DEFAULT true,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug),
  CHECK (
       (professional_title = 'psychiatrist' AND registration_council = 'NMC')
    OR (professional_title IN ('clinical_psychologist','counselling_psychologist','psychotherapist')
        AND registration_council = 'RCI')
    OR (professional_title = 'counsellor' AND registration_council = 'none')
  )
);
CREATE INDEX idx_providers_bookable ON providers(organization_id)
  WHERE is_active AND is_accepting_patients;

ALTER TABLE patients
  ADD CONSTRAINT patients_assigned_provider_fkey
  FOREIGN KEY (assigned_provider_id) REFERENCES providers(id) ON DELETE RESTRICT;


-- ---------------------------------------------------------------------
-- 4 · Booking configuration
-- ---------------------------------------------------------------------

CREATE TABLE provider_session_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider_id       UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  key               TEXT NOT NULL,                        -- 'consultation_first','followup','therapy_50'
  name_en           TEXT NOT NULL,
  name_hi           TEXT,
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes BETWEEN 10 AND 240),
  buffer_minutes    INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 120),
  price_paise       BIGINT  NOT NULL CHECK (price_paise >= 0),
  mode              TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online','in_person','either')),
  min_notice_hours  INTEGER CHECK (min_notice_hours BETWEEN 0 AND 720),   -- NULL -> org policy
  max_advance_days  INTEGER CHECK (max_advance_days BETWEEN 1 AND 365),   -- NULL -> org policy
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, key)
);
CREATE INDEX idx_session_types_provider ON provider_session_types(provider_id) WHERE is_active;

-- Weekly recurring availability, stored as IST wall clock (see architecture.md §10).
CREATE TABLE provider_availability_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider_id      UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  session_type_id  UUID REFERENCES provider_session_types(id) ON DELETE RESTRICT, -- NULL = all types
  weekday          SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),             -- 0 = Sunday
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  valid_from       DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until      DATE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  CHECK (valid_until IS NULL OR valid_until >= valid_from)
);
CREATE INDEX idx_avail_provider_day ON provider_availability_rules(provider_id, weekday) WHERE is_active;

CREATE TABLE provider_blockouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider_id      UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_blockouts_provider ON provider_blockouts(provider_id, starts_at);


-- ---------------------------------------------------------------------
-- 5 · Appointments
-- ---------------------------------------------------------------------

CREATE TABLE appointments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id             UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id            UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  session_type_id        UUID NOT NULL REFERENCES provider_session_types(id) ON DELETE RESTRICT,
  scheduled_at           TIMESTAMPTZ NOT NULL,
  duration_minutes       INTEGER NOT NULL CHECK (duration_minutes BETWEEN 10 AND 240),
  buffer_minutes         INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 120),
  booked_range           TSTZRANGE,                       -- maintained by trigger, see below
  mode                   TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online','in_person')),
  status                 TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
                           'scheduled','in_progress','completed','no_show',
                           'cancelled_by_patient','cancelled_by_provider','rescheduled')),
  booking_channel        TEXT NOT NULL DEFAULT 'patient_self'
                           CHECK (booking_channel IN ('patient_self','earliest_available','admin')),
  price_paise            BIGINT NOT NULL CHECK (price_paise >= 0),
  payment_status         TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
                           'pending','paid','failed','refunded','partially_refunded','complimentary')),
  -- D-013: the room handle is stored; join tokens are minted per click and NEVER stored.
  video_room_id          TEXT,
  video_provider         TEXT CHECK (video_provider IN ('100ms')),
  started_at             TIMESTAMPTZ,
  ended_at               TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  cancellation_reason    TEXT,
  rescheduled_to_id      UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  has_signed_note        BOOLEAN NOT NULL DEFAULT false,  -- metadata surface for admin (no body)
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appt_provider_upcoming ON appointments(provider_id, scheduled_at)
  WHERE status IN ('scheduled','in_progress');
CREATE INDEX idx_appt_patient  ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX idx_appt_org_day  ON appointments(organization_id, scheduled_at);

-- booked_range = [scheduled_at, scheduled_at + duration + buffer)
CREATE OR REPLACE FUNCTION set_appointment_booked_range() RETURNS TRIGGER AS $$
BEGIN
  NEW.booked_range := tstzrange(
    NEW.scheduled_at,
    NEW.scheduled_at + make_interval(mins => NEW.duration_minutes + NEW.buffer_minutes),
    '[)');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appt_booked_range
  BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes, buffer_minutes
  ON appointments FOR EACH ROW EXECUTE FUNCTION set_appointment_booked_range();

-- Double-booking prevention (architecture.md §10): declarative, holds for every
-- writer including admin flows and import scripts, and survives pgbouncer
-- transaction pooling (which silently breaks session-scoped advisory locks).
-- App translates SQLSTATE 23P01 -> APPOINTMENT_SLOT_TAKEN (HTTP 409).
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_double_booking
  EXCLUDE USING gist (provider_id WITH =, booked_range WITH &&)
  WHERE (status IN ('scheduled','in_progress'));

-- Status machine.
CREATE OR REPLACE FUNCTION enforce_appointment_status() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status IN ('completed','no_show','cancelled_by_patient',
                    'cancelled_by_provider','rescheduled') THEN
    RAISE EXCEPTION 'appointment % is in terminal status %', OLD.id, OLD.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (
       (OLD.status = 'scheduled'   AND NEW.status IN ('in_progress','no_show','rescheduled',
                                                      'cancelled_by_patient','cancelled_by_provider'))
    OR (OLD.status = 'in_progress' AND NEW.status IN ('completed','no_show'))
  ) THEN
    RAISE EXCEPTION 'illegal appointment status transition % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appt_status
  BEFORE UPDATE OF status ON appointments
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_status();


-- ---------------------------------------------------------------------
-- 6 · Money (D-012, D-018)
-- ---------------------------------------------------------------------

CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id        UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  razorpay_order_id     TEXT NOT NULL UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  amount_paise          BIGINT NOT NULL CHECK (amount_paise > 0),
  currency              CHAR(3) NOT NULL DEFAULT 'INR',
  status                TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
                          'created','attempted','captured','failed','refunded','partially_refunded')),
  webhook_event_id      TEXT UNIQUE,                     -- idempotency key (Razorpay x-razorpay-event-id)
  webhook_received_at   TIMESTAMPTZ,
  raw_webhook_payload   JSONB,                           -- gateway metadata only; no clinical data
  failure_reason        TEXT,
  reconciled_at         TIMESTAMPTZ,
  reconciled_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_appt    ON payments(appointment_id);
CREATE INDEX idx_payments_patient ON payments(patient_id, created_at DESC);
CREATE INDEX idx_payments_unrecon ON payments(organization_id, created_at)
  WHERE reconciled_at IS NULL AND status IN ('captured','refunded','partially_refunded');

CREATE TABLE refunds (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  payment_id           UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  razorpay_refund_id   TEXT UNIQUE,
  amount_paise         BIGINT NOT NULL CHECK (amount_paise > 0),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','processed','failed')),
  reason               TEXT,
  idempotency_key      TEXT NOT NULL UNIQUE,
  webhook_event_id     TEXT UNIQUE,
  initiated_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  processed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);

CREATE TABLE payouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider_id          UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  period_start         DATE NOT NULL,
  period_end           DATE NOT NULL,
  total_amount_paise   BIGINT NOT NULL CHECK (total_amount_paise >= 0),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','paid','failed')),   -- marked manually (D-018)
  bank_reference_id    TEXT,
  paid_at              TIMESTAMPTZ,
  marked_by_user_id    UUID REFERENCES users(id) ON DELETE RESTRICT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
CREATE INDEX idx_payouts_provider ON payouts(provider_id, status);

-- One row per paid session (D-018): gross, commission, net.
CREATE TABLE earnings_ledger (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider_id          UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  patient_id           UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id       UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,
  payment_id           UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  service_label        TEXT NOT NULL,
  gross_amount_paise   BIGINT NOT NULL CHECK (gross_amount_paise >= 0),
  commission_pct       NUMERIC(5,2) NOT NULL CHECK (commission_pct BETWEEN 0 AND 100),
  commission_paise     BIGINT NOT NULL CHECK (commission_paise >= 0),
  net_amount_paise     BIGINT NOT NULL CHECK (net_amount_paise >= 0),
  refunded_paise       BIGINT NOT NULL DEFAULT 0 CHECK (refunded_paise >= 0),
  payout_id            UUID REFERENCES payouts(id) ON DELETE RESTRICT,
  payout_status        TEXT NOT NULL DEFAULT 'pending'
                         CHECK (payout_status IN ('pending','batched','paid','on_hold')),
  realised_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (commission_paise + net_amount_paise = gross_amount_paise)
);
CREATE INDEX idx_earnings_provider_pending ON earnings_ledger(provider_id) WHERE payout_status = 'pending';
CREATE INDEX idx_earnings_payout ON earnings_ledger(payout_id) WHERE payout_id IS NOT NULL;


-- ---------------------------------------------------------------------
-- 7 · Clinical record
-- ---------------------------------------------------------------------

-- Swasthmind 4-section structure (D-005):
--   Session details · Clinical assessment · Session narrative · Plan & next steps
CREATE TABLE session_notes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  appointment_id           UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  patient_id               UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id              UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  -- 1 · Session details
  session_date             DATE NOT NULL,
  duration_minutes         INTEGER NOT NULL CHECK (duration_minutes BETWEEN 5 AND 240),
  mode                     TEXT NOT NULL CHECK (mode IN ('online','in_person','telephonic')),
  -- 2 · Clinical assessment
  presenting_concern       TEXT,
  mood                     TEXT,
  affect                   TEXT,
  risk                     TEXT[] NOT NULL DEFAULT '{}'
                             CHECK (risk <@ ARRAY['no_risk','self_harm','suicide',
                                                  'violence','substance']::TEXT[]),
  behavioural_observation  TEXT,
  -- 3 · Session narrative
  narrative                TEXT,
  interventions            TEXT[] NOT NULL DEFAULT '{}',
  -- 4 · Plan & next steps
  homework                 TEXT,
  goals                    TEXT,
  next_focus               TEXT,
  progress_score           SMALLINT CHECK (progress_score BETWEEN 0 AND 10),
  follow_up_date           DATE,
  -- Sign / lock / version (architecture.md §11)
  signed_at                TIMESTAMPTZ,
  signed_by_user_id        UUID REFERENCES users(id) ON DELETE RESTRICT,
  is_locked                BOOLEAN GENERATED ALWAYS AS (signed_at IS NOT NULL) STORED,
  version                  INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  supersedes_id            UUID REFERENCES session_notes(id) ON DELETE RESTRICT,
  superseded_at            TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((signed_at IS NULL) = (signed_by_user_id IS NULL)),
  CHECK (version = 1 OR supersedes_id IS NOT NULL)
);
-- Exactly one live note per appointment; superseded versions stay readable.
CREATE UNIQUE INDEX uq_session_notes_live ON session_notes(appointment_id)
  WHERE superseded_at IS NULL;
CREATE INDEX idx_session_notes_patient ON session_notes(patient_id, session_date DESC);
CREATE INDEX idx_session_notes_draft   ON session_notes(provider_id) WHERE signed_at IS NULL;

-- Assessment proforma (BUILD_PLAN §3, D-016). Sections held as JSONB so the
-- field-by-field spec (P0.3) can evolve without a schema migration; the
-- clinician-facing shape is validated app-side against proforma-spec.md.
CREATE TABLE assessment_proformas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id         UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  appointment_id      UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  spec_version        TEXT NOT NULL DEFAULT 'proforma-1.0',
  sociodemographic    JSONB NOT NULL DEFAULT '{}',
  informant           JSONB NOT NULL DEFAULT '{}',
  present_illness     JSONB NOT NULL DEFAULT '{}',   -- complaints, duration, HOPI, 3P factors
  biological_functions JSONB NOT NULL DEFAULT '{}',  -- appetite, libido, sleep chips
  substance_use       JSONB NOT NULL DEFAULT '{}',   -- 8 classes x age-first/frequency/quantity/route/last-use
  past_history        JSONB NOT NULL DEFAULT '{}',   -- psychiatric + medical
  family_history      JSONB NOT NULL DEFAULT '{}',
  personal_history    JSONB NOT NULL DEFAULT '{}',
  premorbid_personality JSONB NOT NULL DEFAULT '{}',
  mse                 JSONB NOT NULL DEFAULT '{}',   -- full MSE incl. insight 1-6 (D-016)
  diagnosis_icd11     TEXT[] NOT NULL DEFAULT '{}',  -- ICD-11 codes, e.g. {'6A70.1'}
  formulation         TEXT,
  plan                TEXT,
  signed_at           TIMESTAMPTZ,
  signed_by_user_id   UUID REFERENCES users(id) ON DELETE RESTRICT,
  is_locked           BOOLEAN GENERATED ALWAYS AS (signed_at IS NOT NULL) STORED,
  version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  supersedes_id       UUID REFERENCES assessment_proformas(id) ON DELETE RESTRICT,
  superseded_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((signed_at IS NULL) = (signed_by_user_id IS NULL)),
  CHECK (version = 1 OR supersedes_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_proforma_live ON assessment_proformas(patient_id)
  WHERE superseded_at IS NULL;
CREATE INDEX idx_proforma_provider ON assessment_proformas(provider_id, created_at DESC);


-- ---------------------------------------------------------------------
-- 8 · Psychometrics (D-024 — free / public-domain tools only)
-- ---------------------------------------------------------------------

CREATE TABLE psychometric_tools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code             TEXT NOT NULL,                  -- 'PHQ9','GAD7','HAMD17','HAMA','BPRS18','YMRS','ASRS_V1_1'
  name             TEXT NOT NULL,
  version          TEXT NOT NULL DEFAULT '1.0',
  language         CHAR(2) NOT NULL CHECK (language IN ('en','hi')),
  items            JSONB NOT NULL DEFAULT '[]',    -- [{id,prompt,options:[{label,value}]}]
  scoring          JSONB NOT NULL DEFAULT '{}',    -- {method,total:{min,max},subscales:[],reverse:[]}
  bands            JSONB NOT NULL DEFAULT '[]',    -- [{label,min,max,severity}]
  administered_by  TEXT NOT NULL CHECK (administered_by IN ('self','clinician','either')),
  source_citation  TEXT,
  licence_note     TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code, version, language)
);
CREATE INDEX idx_tools_active ON psychometric_tools(organization_id, code) WHERE is_active;

-- Immutable from INSERT: a re-administration is a new row (that is the serial chart).
CREATE TABLE psychometric_submissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id           UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  tool_id              UUID NOT NULL REFERENCES psychometric_tools(id) ON DELETE RESTRICT,
  appointment_id       UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  assigned_by_user_id  UUID REFERENCES users(id) ON DELETE RESTRICT,
  answers              JSONB NOT NULL,             -- {item_id: value}
  total                NUMERIC(8,2),
  subscale_totals      JSONB,
  band                 TEXT,
  administered_by      TEXT NOT NULL CHECK (administered_by IN ('self','clinician')),
  at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_psy_sub_patient ON psychometric_submissions(patient_id, tool_id, at DESC);

-- A clinician-rated instrument may not be self-administered (the MantraCare
-- anti-pattern in the competitor digest §3).
CREATE OR REPLACE FUNCTION enforce_tool_administration_mode() RETURNS TRIGGER AS $$
DECLARE _allowed TEXT;
BEGIN
  SELECT administered_by INTO _allowed FROM psychometric_tools WHERE id = NEW.tool_id;
  IF _allowed IS NULL THEN
    RAISE EXCEPTION 'unknown psychometric tool %', NEW.tool_id USING ERRCODE = 'check_violation';
  END IF;
  IF _allowed <> 'either' AND _allowed <> NEW.administered_by THEN
    RAISE EXCEPTION 'tool % must be administered by %, not %', NEW.tool_id, _allowed, NEW.administered_by
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_psy_admin_mode
  BEFORE INSERT ON psychometric_submissions
  FOR EACH ROW EXECUTE FUNCTION enforce_tool_administration_mode();


-- ---------------------------------------------------------------------
-- 9 · Self-tracking (D-021 — in-app only, no WhatsApp nudges in V1)
-- ---------------------------------------------------------------------

CREATE TABLE mood_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  log_date         DATE NOT NULL,
  mood_1_10        SMALLINT NOT NULL CHECK (mood_1_10 BETWEEN 1 AND 10),
  energy_1_10      SMALLINT CHECK (energy_1_10 BETWEEN 1 AND 10),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, log_date)
);
CREATE INDEX idx_mood_patient ON mood_logs(patient_id, log_date DESC);

CREATE TABLE sleep_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  log_date         DATE NOT NULL,                  -- the date the patient woke
  hours_slept      NUMERIC(3,1) CHECK (hours_slept BETWEEN 0 AND 24),
  bed_time         TIME,
  wake_time        TIME,
  quality_1_5      SMALLINT CHECK (quality_1_5 BETWEEN 1 AND 5),
  awakenings       SMALLINT CHECK (awakenings >= 0),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, log_date)
);
CREATE INDEX idx_sleep_patient ON sleep_logs(patient_id, log_date DESC);


-- ---------------------------------------------------------------------
-- 10 · Files, materials (D-006, D-007, D-017)
-- ---------------------------------------------------------------------

CREATE TABLE files (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  owner_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_by_role  TEXT NOT NULL CHECK (uploaded_by_role IN ('patient','provider','admin')),
  appointment_id    UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  storage_path      TEXT NOT NULL UNIQUE,           -- Supabase Storage object path, bucket 'phi'
  original_name     TEXT,
  mime              TEXT NOT NULL,
  bytes             BIGINT NOT NULL CHECK (bytes > 0 AND bytes <= 26214400),   -- 25 MiB (D-007)
  kind              TEXT NOT NULL CHECK (kind IN ('report','prescription','brochure','worksheet','other')),
  shared_with       TEXT[] NOT NULL DEFAULT '{}'
                      CHECK (shared_with <@ ARRAY['patient','provider','admin']::TEXT[]),
  external_url      TEXT,                            -- when the "file" is a link (D-007)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (mime IN (
    'application/pdf','image/jpeg','image/png','image/webp','image/heic',
    'video/mp4','video/quicktime','audio/mpeg','audio/mp4','text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
);
CREATE INDEX idx_files_patient ON files(patient_id, created_at DESC);
CREATE INDEX idx_files_appt    ON files(appointment_id) WHERE appointment_id IS NOT NULL;

-- Saday-branded catalogue: brochures + therapy worksheets (D-006).
CREATE TABLE materials_library (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  language         CHAR(2) NOT NULL CHECK (language IN ('en','hi')),
  category         TEXT NOT NULL,                   -- 'sleep_hygiene','cbt_worksheet','psychoeducation'
  tags             TEXT[] NOT NULL DEFAULT '{}',
  kind             TEXT NOT NULL CHECK (kind IN ('brochure','worksheet','article','video','link')),
  storage_path     TEXT,                            -- bucket 'materials'
  external_url     TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code, language),
  CHECK (storage_path IS NOT NULL OR external_url IS NOT NULL)
);
CREATE INDEX idx_materials_active ON materials_library(organization_id, category) WHERE is_active;

CREATE TABLE material_dispatches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  material_id       UUID NOT NULL REFERENCES materials_library(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  sent_by_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  channel           TEXT NOT NULL CHECK (channel IN ('portal','whatsapp','email')),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispatch_patient ON material_dispatches(patient_id, sent_at DESC);


-- ---------------------------------------------------------------------
-- 11 · Async messaging (D-006 brief: two-way, no contact details revealed)
-- ---------------------------------------------------------------------

CREATE TABLE message_threads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id      UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  last_message_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, provider_id)
);
CREATE INDEX idx_threads_provider ON message_threads(provider_id, last_message_at DESC);
CREATE INDEX idx_threads_patient  ON message_threads(patient_id,  last_message_at DESC);

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  thread_id        UUID NOT NULL REFERENCES message_threads(id) ON DELETE RESTRICT,
  sender_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  sender_role      TEXT NOT NULL CHECK (sender_role IN ('patient','provider')),
  body             TEXT,
  file_id          UUID REFERENCES files(id) ON DELETE RESTRICT,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (body IS NOT NULL OR file_id IS NOT NULL)
);
CREATE INDEX idx_messages_thread ON messages(thread_id, sent_at DESC);


-- ---------------------------------------------------------------------
-- 12 · Follow-up flows (D-023 — org-wide, not per provider)
-- ---------------------------------------------------------------------

CREATE TABLE whatsapp_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code                TEXT NOT NULL,                -- 'booking_confirmed','session_reminder','join_link',...
  language            CHAR(2) NOT NULL CHECK (language IN ('en','hi')),
  category            TEXT NOT NULL CHECK (category IN ('utility','marketing','authentication')),
  meta_template_name  TEXT,                         -- name registered with the BSP (D-015)
  body_text           TEXT NOT NULL,                -- {{1}} placeholders
  variables           TEXT[] NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','submitted','approved','rejected','paused')),
  approved_at         TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code, language)
);

CREATE TABLE follow_up_flows (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  flow_kind            TEXT NOT NULL CHECK (flow_kind IN ('check_in','feedback')),
  title                TEXT NOT NULL,
  trigger_source       TEXT NOT NULL CHECK (trigger_source IN ('session_end','check_in_sent')),
  offset_hours         INTEGER NOT NULL DEFAULT 24 CHECK (offset_hours BETWEEN 1 AND 720),
  channel              TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','portal','email')),
  whatsapp_template_id UUID REFERENCES whatsapp_templates(id) ON DELETE RESTRICT,
  questions            JSONB NOT NULL DEFAULT '[]',  -- [{id,prompt_en,prompt_hi,response_type,options}]
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, flow_kind)              -- org-wide: exactly one of each kind
);

CREATE TABLE follow_up_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  flow_id          UUID NOT NULL REFERENCES follow_up_flows(id) ON DELETE RESTRICT,
  appointment_id   UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  responses        JSONB NOT NULL,
  delivered_via    TEXT NOT NULL CHECK (delivered_via IN ('whatsapp','portal','email')),
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flow_id, appointment_id)
);
CREATE INDEX idx_followup_appt    ON follow_up_submissions(appointment_id);
CREATE INDEX idx_followup_patient ON follow_up_submissions(patient_id, submitted_at DESC);

-- Outbound queue + delivery record. Polled every 5 min by the Cloudflare Cron
-- Trigger (architecture.md §12). Carries NO message body and no PHI.
CREATE TABLE notification_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  to_user_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  channel              TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email','push')),
  purpose              TEXT NOT NULL CHECK (purpose IN (
                         'otp','booking_confirmed','session_reminder','join_link',
                         'cancellation','refund','follow_up_check_in','follow_up_feedback',
                         'material_dispatch','other')),
  template_code        TEXT,
  language             CHAR(2) NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi')),
  appointment_id       UUID REFERENCES appointments(id) ON DELETE RESTRICT,
  follow_up_flow_id    UUID REFERENCES follow_up_flows(id) ON DELETE RESTRICT,
  due_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                         'pending','sending','sent','delivered','failed','skipped')),
  attempts             SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_message_id  TEXT,
  error_code           TEXT,
  sent_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_due ON notification_log(due_at) WHERE status = 'pending';
CREATE INDEX idx_notif_appt ON notification_log(appointment_id) WHERE appointment_id IS NOT NULL;


-- ---------------------------------------------------------------------
-- 13 · Consents & org config
-- ---------------------------------------------------------------------

CREATE TABLE consents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consent_type     TEXT NOT NULL CHECK (consent_type IN (
                     'telemedicine','privacy_policy','terms_of_service')),
  version          TEXT NOT NULL,                  -- 'telemed-1.0', 'pp-1.0'
  document_hash    TEXT NOT NULL,                  -- sha256 of the exact text shown
  accepted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_via     TEXT NOT NULL DEFAULT 'portal'
                     CHECK (accepted_via IN ('portal','intake','migration')),
  ip_hash          TEXT,
  user_agent_hash  TEXT,
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type, version)
);
CREATE INDEX idx_consents_active ON consents(user_id, consent_type) WHERE revoked_at IS NULL;

CREATE TABLE organization_policies (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                 UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE RESTRICT,
  cancellation_allowed            BOOLEAN NOT NULL DEFAULT true,
  cancellation_min_notice_hours   INTEGER NOT NULL DEFAULT 12,
  cancellation_refund_pct         NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (cancellation_refund_pct BETWEEN 0 AND 100),
  reschedule_allowed              BOOLEAN NOT NULL DEFAULT true,
  reschedule_min_notice_hours     INTEGER NOT NULL DEFAULT 6,
  reschedule_max_count            INTEGER NOT NULL DEFAULT 1,
  booking_min_notice_hours        INTEGER NOT NULL DEFAULT 2,
  booking_window_days_max         INTEGER NOT NULL DEFAULT 30,
  default_commission_pct          NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (default_commission_pct BETWEEN 0 AND 100),
  follow_up_check_in_hours        INTEGER NOT NULL DEFAULT 24,
  follow_up_feedback_hours        INTEGER NOT NULL DEFAULT 24,
  whatsapp_per_patient_per_day    INTEGER NOT NULL DEFAULT 3,
  privacy_policy_version          TEXT NOT NULL DEFAULT 'pp-1.0',
  telemedicine_consent_version    TEXT NOT NULL DEFAULT 'telemed-1.0',
  terms_version                   TEXT NOT NULL DEFAULT 'tos-1.0',
  grievance_officer_email         CITEXT,
  grievance_officer_phone         TEXT,
  timezone                        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------
-- 14 · Audit log (D-008 — minimal, append-only, NO PHI, no UI)
-- ---------------------------------------------------------------------

CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    UUID REFERENCES users(id) ON DELETE RESTRICT,  -- NULL for service_role / system
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  table_name  TEXT NOT NULL,
  row_id      UUID,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_row   ON audit_log(table_name, row_id, at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_id, at DESC);


-- ---------------------------------------------------------------------
-- 15 · RLS helper functions
--      All SECURITY DEFINER + STABLE so a policy that calls them does not
--      re-enter RLS on the tables they read.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, auth;

-- Role comes from the JWT custom claim 'user_role', populated by the Supabase
-- custom_access_token_hook below. If the hook is not enabled this returns NULL
-- and every policy denies — the intended failure mode.
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT nullif(auth.jwt() ->> 'user_role', '')
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'admin'
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_is_provider() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'provider'
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_is_patient() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'patient'
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_current_patient_id() RETURNS UUID AS $$
  SELECT p.id FROM public.patients p WHERE p.user_id = current_user_id() LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION app_current_provider_id() RETURNS UUID AS $$
  SELECT pr.id FROM public.providers pr WHERE pr.user_id = current_user_id() LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- "Assigned": the calling provider holds at least one appointment with this
-- patient (any status), or is the patient's assigned_provider_id.
CREATE OR REPLACE FUNCTION app_provider_treats(_patient_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.patient_id = _patient_id
      AND a.provider_id = app_current_provider_id()
  ) OR EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = _patient_id
      AND p.assigned_provider_id = app_current_provider_id()
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION app_in_thread(_thread_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_threads t
    WHERE t.id = _thread_id
      AND (t.patient_id = app_current_patient_id()
           OR t.provider_id = app_current_provider_id())
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION
  current_user_id(), app_current_patient_id(), app_current_provider_id(),
  app_provider_treats(UUID), app_in_thread(UUID)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  current_user_id(), app_current_patient_id(), app_current_provider_id(),
  app_provider_treats(UUID), app_in_thread(UUID)
TO authenticated, service_role;

-- Supabase Auth hook: copies public.users.role into the access token as
-- 'user_role'. Enable in Dashboard → Authentication → Hooks (Customize Access Token),
-- or in config.toml: [auth.hook.custom_access_token].
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB) RETURNS JSONB AS $$
DECLARE
  _claims JSONB;
  _role   TEXT;
BEGIN
  SELECT u.role INTO _role
  FROM public.users u
  WHERE u.auth_user_id = (event ->> 'user_id')::UUID AND u.is_active;

  _claims := COALESCE(event -> 'claims', '{}'::JSONB);
  IF _role IS NOT NULL THEN
    _claims := jsonb_set(_claims, '{user_role}', to_jsonb(_role));
  END IF;
  RETURN jsonb_set(event, '{claims}', _claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION custom_access_token_hook(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook(JSONB) FROM authenticated, anon, public;


-- ---------------------------------------------------------------------
-- 16 · Audit trigger (D-008 — actor, action, table, row id, timestamp only)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION write_audit_log() RETURNS TRIGGER AS $$
DECLARE _row_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _row_id := (to_jsonb(OLD) ->> 'id')::UUID;
  ELSE
    _row_id := (to_jsonb(NEW) ->> 'id')::UUID;
  END IF;

  -- No payload, no column values: nothing here can carry PHI.
  INSERT INTO public.audit_log (actor_id, action, table_name, row_id)
  VALUES (current_user_id(), TG_OP, TG_TABLE_NAME, _row_id);

  RETURN NULL;  -- AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Applied to PHI-bearing and money-bearing tables.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients','providers','appointments','payments','refunds','earnings_ledger',
    'payouts','session_notes','assessment_proformas','psychometric_submissions',
    'mood_logs','sleep_logs','files','material_dispatches','messages',
    'follow_up_submissions','consents','users'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON %1$I
         FOR EACH ROW EXECUTE FUNCTION write_audit_log()', t);
  END LOOP;
END $$;

-- audit_log itself is append-only.
CREATE TRIGGER trg_audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION forbid_update();
CREATE TRIGGER trg_audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();


-- ---------------------------------------------------------------------
-- 17 · Immutability triggers (architecture.md §11)
-- ---------------------------------------------------------------------

CREATE TRIGGER trg_session_notes_immutable
  BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION enforce_versioned_immutability('signed_at');
CREATE TRIGGER trg_session_notes_no_delete
  BEFORE DELETE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();

CREATE TRIGGER trg_proformas_immutable
  BEFORE UPDATE ON assessment_proformas
  FOR EACH ROW EXECUTE FUNCTION enforce_versioned_immutability('signed_at');
CREATE TRIGGER trg_proformas_no_delete
  BEFORE DELETE ON assessment_proformas
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();

-- Submissions have no draft state: immutable from INSERT.
CREATE TRIGGER trg_psy_sub_no_update
  BEFORE UPDATE ON psychometric_submissions
  FOR EACH ROW EXECUTE FUNCTION forbid_update();
CREATE TRIGGER trg_psy_sub_no_delete
  BEFORE DELETE ON psychometric_submissions
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();

CREATE TRIGGER trg_followup_sub_no_update
  BEFORE UPDATE ON follow_up_submissions
  FOR EACH ROW EXECUTE FUNCTION forbid_update();
CREATE TRIGGER trg_followup_sub_no_delete
  BEFORE DELETE ON follow_up_submissions
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();

CREATE TRIGGER trg_earnings_no_delete
  BEFORE DELETE ON earnings_ledger
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();
CREATE TRIGGER trg_payments_no_delete
  BEFORE DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();
CREATE TRIGGER trg_consents_no_delete
  BEFORE DELETE ON consents
  FOR EACH ROW EXECUTE FUNCTION forbid_delete();


-- ---------------------------------------------------------------------
-- 18 · updated_at triggers (every table except audit_log)
-- ---------------------------------------------------------------------

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'updated_at' AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at_%1$s BEFORE UPDATE ON %1$I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- 19 · RLS — enable + FORCE on every table, then policies.
--      Default deny: a table with no matching policy returns nothing.
--      service_role bypasses RLS by role attribute (webhooks, cron, migrations).
-- ---------------------------------------------------------------------

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- No DELETE grant anywhere: deletion is a deliberate service_role operation.

-- ---- organizations / policies / roles --------------------------------
CREATE POLICY org_read_all ON organizations FOR SELECT TO authenticated
  USING (current_user_role() IS NOT NULL);

CREATE POLICY orgpol_read ON organization_policies FOR SELECT TO authenticated
  USING (current_user_role() IS NOT NULL);
CREATE POLICY orgpol_admin_write ON organization_policies FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY roles_read ON user_roles FOR SELECT TO authenticated
  USING (current_user_role() IS NOT NULL);

-- ---- users -----------------------------------------------------------
CREATE POLICY users_self_read ON users FOR SELECT TO authenticated
  USING (id = current_user_id() OR app_is_admin());
CREATE POLICY users_self_update ON users FOR UPDATE TO authenticated
  USING (id = current_user_id() OR app_is_admin())
  WITH CHECK (id = current_user_id() OR app_is_admin());
CREATE POLICY users_admin_insert ON users FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());

-- ---- patients --------------------------------------------------------
CREATE POLICY patients_self_read ON patients FOR SELECT TO authenticated
  USING (id = app_current_patient_id()
         OR (app_is_provider() AND app_provider_treats(id))
         OR app_is_admin());
CREATE POLICY patients_self_update ON patients FOR UPDATE TO authenticated
  USING (id = app_current_patient_id() OR app_is_admin())
  WITH CHECK (id = app_current_patient_id() OR app_is_admin());
CREATE POLICY patients_insert ON patients FOR INSERT TO authenticated
  WITH CHECK (user_id = current_user_id() OR app_is_admin());

-- ---- providers -------------------------------------------------------
CREATE POLICY providers_public_read ON providers FOR SELECT TO authenticated
  USING (is_active OR id = app_current_provider_id() OR app_is_admin());
CREATE POLICY providers_self_update ON providers FOR UPDATE TO authenticated
  USING (id = app_current_provider_id() OR app_is_admin())
  WITH CHECK (id = app_current_provider_id() OR app_is_admin());
CREATE POLICY providers_admin_insert ON providers FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());

-- ---- booking configuration ------------------------------------------
CREATE POLICY pst_read ON provider_session_types FOR SELECT TO authenticated
  USING (is_active OR provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY pst_write ON provider_session_types FOR INSERT TO authenticated
  WITH CHECK (provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY pst_update ON provider_session_types FOR UPDATE TO authenticated
  USING (provider_id = app_current_provider_id() OR app_is_admin())
  WITH CHECK (provider_id = app_current_provider_id() OR app_is_admin());

CREATE POLICY avail_read ON provider_availability_rules FOR SELECT TO authenticated
  USING (is_active OR provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY avail_insert ON provider_availability_rules FOR INSERT TO authenticated
  WITH CHECK (provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY avail_update ON provider_availability_rules FOR UPDATE TO authenticated
  USING (provider_id = app_current_provider_id() OR app_is_admin())
  WITH CHECK (provider_id = app_current_provider_id() OR app_is_admin());

CREATE POLICY blockout_read ON provider_blockouts FOR SELECT TO authenticated
  USING (provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY blockout_insert ON provider_blockouts FOR INSERT TO authenticated
  WITH CHECK (provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY blockout_update ON provider_blockouts FOR UPDATE TO authenticated
  USING (provider_id = app_current_provider_id() OR app_is_admin())
  WITH CHECK (provider_id = app_current_provider_id() OR app_is_admin());

-- ---- appointments ----------------------------------------------------
CREATE POLICY appt_read ON appointments FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id()
         OR provider_id = app_current_provider_id()
         OR app_is_admin());
CREATE POLICY appt_insert ON appointments FOR INSERT TO authenticated
  WITH CHECK (patient_id = app_current_patient_id() OR app_is_admin());
CREATE POLICY appt_update ON appointments FOR UPDATE TO authenticated
  USING (patient_id = app_current_patient_id()
         OR provider_id = app_current_provider_id()
         OR app_is_admin())
  WITH CHECK (patient_id = app_current_patient_id()
         OR provider_id = app_current_provider_id()
         OR app_is_admin());

-- ---- money -----------------------------------------------------------
CREATE POLICY payments_read ON payments FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id() OR app_is_admin());
CREATE POLICY payments_admin_update ON payments FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY refunds_read ON refunds FOR SELECT TO authenticated
  USING (app_is_admin()
         OR EXISTS (SELECT 1 FROM payments p
                    WHERE p.id = refunds.payment_id
                      AND p.patient_id = app_current_patient_id()));
CREATE POLICY refunds_admin_insert ON refunds FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY refunds_admin_update ON refunds FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY earnings_read ON earnings_ledger FOR SELECT TO authenticated
  USING (provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY earnings_admin_insert ON earnings_ledger FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY earnings_admin_update ON earnings_ledger FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY payouts_read ON payouts FOR SELECT TO authenticated
  USING (provider_id = app_current_provider_id() OR app_is_admin());
CREATE POLICY payouts_admin_insert ON payouts FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY payouts_admin_update ON payouts FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ---- clinical bodies: assigned provider only; admin has NO policy ----
CREATE POLICY notes_provider_read ON session_notes FOR SELECT TO authenticated
  USING (app_is_provider() AND provider_id = app_current_provider_id());
CREATE POLICY notes_provider_insert ON session_notes FOR INSERT TO authenticated
  WITH CHECK (app_is_provider()
              AND provider_id = app_current_provider_id()
              AND app_provider_treats(patient_id));
CREATE POLICY notes_provider_update ON session_notes FOR UPDATE TO authenticated
  USING (app_is_provider() AND provider_id = app_current_provider_id())
  WITH CHECK (app_is_provider() AND provider_id = app_current_provider_id());

CREATE POLICY proforma_provider_read ON assessment_proformas FOR SELECT TO authenticated
  USING (app_is_provider() AND provider_id = app_current_provider_id());
CREATE POLICY proforma_provider_insert ON assessment_proformas FOR INSERT TO authenticated
  WITH CHECK (app_is_provider()
              AND provider_id = app_current_provider_id()
              AND app_provider_treats(patient_id));
CREATE POLICY proforma_provider_update ON assessment_proformas FOR UPDATE TO authenticated
  USING (app_is_provider() AND provider_id = app_current_provider_id())
  WITH CHECK (app_is_provider() AND provider_id = app_current_provider_id());

-- ---- psychometrics ---------------------------------------------------
CREATE POLICY tools_read ON psychometric_tools FOR SELECT TO authenticated
  USING (is_active OR app_is_admin());
CREATE POLICY tools_admin_insert ON psychometric_tools FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY tools_admin_update ON psychometric_tools FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY psy_sub_read ON psychometric_submissions FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id()
         OR (app_is_provider() AND app_provider_treats(patient_id)));
CREATE POLICY psy_sub_insert ON psychometric_submissions FOR INSERT TO authenticated
  WITH CHECK ((patient_id = app_current_patient_id() AND administered_by = 'self')
              OR (app_is_provider() AND app_provider_treats(patient_id)
                  AND administered_by = 'clinician'));

-- ---- self-tracking ---------------------------------------------------
CREATE POLICY mood_read ON mood_logs FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id()
         OR (app_is_provider() AND app_provider_treats(patient_id)));
CREATE POLICY mood_insert ON mood_logs FOR INSERT TO authenticated
  WITH CHECK (patient_id = app_current_patient_id());
CREATE POLICY mood_update ON mood_logs FOR UPDATE TO authenticated
  USING (patient_id = app_current_patient_id())
  WITH CHECK (patient_id = app_current_patient_id());

CREATE POLICY sleep_read ON sleep_logs FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id()
         OR (app_is_provider() AND app_provider_treats(patient_id)));
CREATE POLICY sleep_insert ON sleep_logs FOR INSERT TO authenticated
  WITH CHECK (patient_id = app_current_patient_id());
CREATE POLICY sleep_update ON sleep_logs FOR UPDATE TO authenticated
  USING (patient_id = app_current_patient_id())
  WITH CHECK (patient_id = app_current_patient_id());

-- ---- files & materials ----------------------------------------------
CREATE POLICY files_read ON files FOR SELECT TO authenticated
  USING ((patient_id = app_current_patient_id() AND 'patient' = ANY(shared_with))
         OR (app_is_provider() AND app_provider_treats(patient_id))
         OR app_is_admin());
CREATE POLICY files_insert ON files FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = current_user_id()
              AND (patient_id = app_current_patient_id()
                   OR (app_is_provider() AND app_provider_treats(patient_id))));
CREATE POLICY files_update ON files FOR UPDATE TO authenticated
  USING (app_is_provider() AND app_provider_treats(patient_id))
  WITH CHECK (app_is_provider() AND app_provider_treats(patient_id));

CREATE POLICY materials_read ON materials_library FOR SELECT TO authenticated
  USING (is_active OR app_is_admin());
CREATE POLICY materials_admin_insert ON materials_library FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY materials_admin_update ON materials_library FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY dispatch_read ON material_dispatches FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id()
         OR (app_is_provider() AND app_provider_treats(patient_id))
         OR app_is_admin());
CREATE POLICY dispatch_insert ON material_dispatches FOR INSERT TO authenticated
  WITH CHECK ((app_is_provider() AND app_provider_treats(patient_id)) OR app_is_admin());

-- ---- messaging (participants only; admin excluded) -------------------
CREATE POLICY threads_read ON message_threads FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id() OR provider_id = app_current_provider_id());
CREATE POLICY threads_insert ON message_threads FOR INSERT TO authenticated
  WITH CHECK (patient_id = app_current_patient_id() OR provider_id = app_current_provider_id());
CREATE POLICY threads_update ON message_threads FOR UPDATE TO authenticated
  USING (patient_id = app_current_patient_id() OR provider_id = app_current_provider_id())
  WITH CHECK (patient_id = app_current_patient_id() OR provider_id = app_current_provider_id());

CREATE POLICY messages_read ON messages FOR SELECT TO authenticated
  USING (app_in_thread(thread_id));
CREATE POLICY messages_insert ON messages FOR INSERT TO authenticated
  WITH CHECK (app_in_thread(thread_id) AND sender_user_id = current_user_id());
CREATE POLICY messages_update ON messages FOR UPDATE TO authenticated
  USING (app_in_thread(thread_id)) WITH CHECK (app_in_thread(thread_id));

-- ---- follow-up flows -------------------------------------------------
CREATE POLICY flows_read ON follow_up_flows FOR SELECT TO authenticated
  USING (is_active OR app_is_admin());
CREATE POLICY flows_admin_insert ON follow_up_flows FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY flows_admin_update ON follow_up_flows FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY followup_sub_read ON follow_up_submissions FOR SELECT TO authenticated
  USING (patient_id = app_current_patient_id()
         OR (app_is_provider() AND app_provider_treats(patient_id)));
CREATE POLICY followup_sub_insert ON follow_up_submissions FOR INSERT TO authenticated
  WITH CHECK (patient_id = app_current_patient_id());

-- ---- templates & notifications --------------------------------------
CREATE POLICY wa_templates_read ON whatsapp_templates FOR SELECT TO authenticated
  USING (app_is_provider() OR app_is_admin());
CREATE POLICY wa_templates_admin_insert ON whatsapp_templates FOR INSERT TO authenticated
  WITH CHECK (app_is_admin());
CREATE POLICY wa_templates_admin_update ON whatsapp_templates FOR UPDATE TO authenticated
  USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY notif_admin_read ON notification_log FOR SELECT TO authenticated
  USING (app_is_admin());

-- ---- consents --------------------------------------------------------
CREATE POLICY consents_read ON consents FOR SELECT TO authenticated
  USING (user_id = current_user_id() OR app_is_admin());
CREATE POLICY consents_insert ON consents FOR INSERT TO authenticated
  WITH CHECK (user_id = current_user_id());

-- ---- audit log: append-only, unreadable through RLS (D-008) ----------
CREATE POLICY audit_append_only ON audit_log FOR INSERT TO authenticated
  WITH CHECK (true);
-- No SELECT/UPDATE/DELETE policy: reads are service_role / SQL console only.


-- ---------------------------------------------------------------------
-- 20 · Seed — one organization + psychometric_tools skeletons (D-024).
--      Items / scoring / bands are filled in P0.4 (psychometrics-spec.md).
-- ---------------------------------------------------------------------

INSERT INTO organizations (id, name, slug, timezone, currency)
VALUES ('00000000-0000-0000-0000-000000000001',
        'Saday Wellness Group', 'saday', 'Asia/Kolkata', 'INR');

INSERT INTO organization_policies (organization_id)
VALUES ('00000000-0000-0000-0000-000000000001');

INSERT INTO user_roles (organization_id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001','patient','Client booking and attending consultations'),
  ('00000000-0000-0000-0000-000000000001','provider','Psychiatrist / psychologist / therapist'),
  ('00000000-0000-0000-0000-000000000001','admin','Saday operations — metadata only, no clinical bodies');

-- Free / public-domain instruments only (D-024). Licensed tools (Y-BOCS,
-- MSI-BPD, ZAN-BPD, WURS) and MDQ are deliberately absent.
INSERT INTO psychometric_tools
  (organization_id, code, name, version, language, administered_by, source_citation, licence_note)
VALUES
  ('00000000-0000-0000-0000-000000000001','PHQ9','Patient Health Questionnaire-9','1.0','en','either',
   'Kroenke, Spitzer & Williams (2001)','Public domain — free to reproduce'),
  ('00000000-0000-0000-0000-000000000001','PHQ9','रोगी स्वास्थ्य प्रश्नावली-9','1.0','hi','either',
   'Kroenke, Spitzer & Williams (2001)','Public domain — free to reproduce'),
  ('00000000-0000-0000-0000-000000000001','GAD7','Generalised Anxiety Disorder-7','1.0','en','either',
   'Spitzer, Kroenke, Williams & Löwe (2006)','Public domain — free to reproduce'),
  ('00000000-0000-0000-0000-000000000001','GAD7','सामान्यीकृत चिंता विकार-7','1.0','hi','either',
   'Spitzer, Kroenke, Williams & Löwe (2006)','Public domain — free to reproduce'),
  ('00000000-0000-0000-0000-000000000001','HAMD17','Hamilton Depression Rating Scale (17-item)','1.0','en','clinician',
   'Hamilton (1960)','Public domain'),
  ('00000000-0000-0000-0000-000000000001','HAMA','Hamilton Anxiety Rating Scale','1.0','en','clinician',
   'Hamilton (1959)','Public domain'),
  ('00000000-0000-0000-0000-000000000001','BPRS18','Brief Psychiatric Rating Scale (18-item)','1.0','en','clinician',
   'Overall & Gorham (1962)','Public domain'),
  ('00000000-0000-0000-0000-000000000001','YMRS','Young Mania Rating Scale','1.0','en','clinician',
   'Young, Biggs, Ziegler & Meyer (1978)','Free for clinical use'),
  ('00000000-0000-0000-0000-000000000001','ASRS_V1_1','Adult ADHD Self-Report Scale v1.1','1.0','en','either',
   'Kessler et al. / WHO (2005)','Free to reproduce for clinical use');

-- =====================================================================
-- End of 0001_schema.sql
-- =====================================================================

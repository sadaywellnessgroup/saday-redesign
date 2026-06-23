# Saday Wellness — Stack Decision: Next.js + Supabase vs PHP + Laravel

> **File:** `docs/stack-decision.md`
> **Version:** 1.0 (Phase 0 · Week 1 · Saturday)
> **Status:** OPEN — pending Akash answers to S1/S2/S3 in §7
> **Companion to:** `Saday_Master_Blueprint.html` §13 (stack), `docs/data-model.md` §3.9 / §6.1 / §7 (Supabase-shaped), `docs/CLAUDE.md` (current planned stack)
> **Window:** decide before `architecture.md` is drafted. Pivot cost is ~1.5 days of re-spec now; ~10× that two weeks from now after architecture.md and the W2 prototype.

---

## 1 · Short answer

Technically yes, you can build Saday on PHP + Laravel. **But the pivot is a real architectural reset** because the V1 spec we just locked is Supabase-shaped in several non-trivial places, and Laravel's natural posture is to be the security boundary itself rather than push security into Postgres RLS.

The pivot cost at this exact moment is low (1.5 days re-spec, zero code to throw away) — which is precisely why the question is well-timed.

---

## 2 · What carries over unchanged (stack-agnostic)

| Item | Notes |
|---|---|
| The 34-table Postgres schema | Eloquent maps fine; column types / CHECKs / triggers are pure SQL |
| pgcrypto column-level encryption | Stack-agnostic (key custody changes — see §3.C) |
| Audit log per-row hash + weekly Merkle externalisation | DB-level triggers + cron; agnostic |
| Append-only audit / SOAP immutability triggers | DB-level; agnostic |
| pg_partman audit_log monthly partitioning | DB-level; agnostic |
| 7-screen adaptive intake state machine, routing engine, C-SSRS short-circuit | Server-side logic; runs in either |
| All 12 assessment tools' scoring rules | Pure functions; trivial port |
| Razorpay paise integration + webhook reconciliation | Both have mature SDKs |
| MSG91 WhatsApp dispatcher | HTTP API; both have packages |
| Daily.co room minting + signed-URL JIT pattern | HTTP API; agnostic |
| DPDP / MHA / Telemed compliance posture | All architectural — not language-specific |
| Cloudflare Turnstile + per-IP rate limits | Edge layer; agnostic |
| EN + HI i18n | Both have solid stories (`__()` in Laravel, `next-intl` in Next.js) |

**Roughly 70% of `data-model.md` and ~50% of `intake-spec.md` are unchanged.**

---

## 3 · What materially changes

### A. The Supabase-shaped parts of the spec break

| Currently in spec | Lives in V1 because of Supabase | What it becomes on Laravel |
|---|---|---|
| `users.auth_user_id REFERENCES auth.users(id)` | Supabase Auth schema | Drop the bridge; `users` IS the auth table (Sanctum / Passport pattern) |
| `current_user_id() = (SELECT id FROM users WHERE auth_user_id = auth.uid())` | Supabase Auth function | `auth()->id()` in app code; RLS helpers either drop or change to read from a session-set GUC |
| `auth.jwt() ->> 'user_role'` for RLS | Supabase JWT custom_access_token_hook | Not used — RLS would receive role via `SET LOCAL` per request, OR (more typical) **RLS becomes defense-in-depth, not the primary gate** |
| `vault.decrypted_secrets` for pgcrypto keys | Supabase Vault | AWS KMS / HashiCorp Vault / Laravel `config('app.key')` envelope (which is weaker — see C) |
| Supabase Storage for materials/exports | Supabase | S3 ap-south-1 directly (`league/flysystem-aws-s3`) |
| Supabase Edge Functions | Supabase | Laravel queue workers + scheduler |
| Supabase Realtime (V2 candidate) | Supabase | Laravel Echo + Reverb (PHP-native) or Pusher |

**Re-spec needed:** ~1.5 days editing `data-model.md` §3.9 (key custody), §6.1 (users table), §7 (RLS helpers), §10 (migration plan). Plus `architecture.md` (not yet written) reflects the new stack from the start.

### B. The security model philosophy shifts

This is the deepest impact. **Supabase pushes you toward "RLS is the security boundary."** Even if your app server bug exposes data, RLS catches it. We leaned hard into this in `data-model.md` §7.

**Laravel pushes you toward "the app is the security boundary."** Eloquent policies + Form Requests + middleware. RLS becomes belt-and-braces, not the primary gate. This is fine — it's the dominant industry pattern — but it means:

- Every query path has to be policy-checked in PHP. Forget one and the data leaks.
- The "patient cannot read another patient's intake" guarantee moves from a single SQL policy to a discipline applied across N controllers/actions/jobs.
- Our W4 RLS attack tests still pass (you keep the policies as defense-in-depth) but they're no longer load-bearing.

**For a clinical/PHI product run by a small team, the Supabase RLS-first posture is genuinely safer-by-default.** The downside is operational: RLS debugging is famously irritating; "why did this query return nothing" eats hours.

### C. Encryption key custody gets weaker by default

- Supabase Vault is purpose-built and DPDP-friendly.
- Laravel default is `APP_KEY` in `.env` — a single symmetric key on the app server. Fine for sessions, **inappropriate for PHI at rest**.
- To match what we spec'd, you'd need AWS KMS or HashiCorp Vault integration — doable, ~1 day of plumbing, but it's now your responsibility, not Supabase's.

### D. Frontend topology — the place to push back hardest

The 7-screen intake is the **front door of the entire product** for distressed first-time users. It needs:

- Anonymous draft persistence in `localStorage`
- Per-screen progress without page reloads (preserves emotional flow, doesn't reset state on a network hiccup)
- HI/EN switch without losing answers
- Adaptive bridging items appearing in real time based on cluster selection
- Client-side C-SSRS short-circuit before server roundtrip (UX-critical for crisis moments)

Laravel options:

| Option | Verdict for the intake |
|---|---|
| **Livewire** (PHP-driven UI, server roundtrip per interaction) | ❌ Wrong tool. Every screen change = HTTP roundtrip. Distress-bad UX. localStorage draft is awkward to integrate. |
| **Inertia.js + React** (Laravel routing/auth, React frontend) | ✅ Works. You end up with React for the patient surface anyway — same as Next.js — but with PHP behind it instead of TS. Two languages to maintain. |
| **Laravel API + separate Next.js frontend** | ⚠️ Defeats much of the point of going Laravel. You now run two stacks. |

**The patient-facing intake genuinely wants client-rich React.** Going Laravel and then putting Inertia+React on top is sensible, but it doesn't save you the React expertise — it just adds PHP to the mix.

**Where Laravel actually shines for Saday:** the admin / MHP dashboard. **Filament or Nova would let you ship a credible internal dashboard in days, vs weeks of hand-built React.** This is real and significant.

### E. Hosting topology

| Aspect | Current (Next.js + Supabase) | Pivot (Laravel) |
|---|---|---|
| Compute | Vercel / Cloudflare Pages (serverless) | Laravel Forge / Ploi → VPS (DigitalOcean BLR / Hetzner / AWS Lightsail) → PHP-FPM + Nginx + Redis + supervisor + cron |
| DB | Supabase Postgres ap-south-1 (managed) | Either keep Supabase as raw Postgres (unusual) OR move to AWS RDS Mumbai / DigitalOcean Managed Postgres BLR |
| Storage | Supabase Storage | S3 ap-south-1 |
| Background jobs | Supabase Edge / Vercel Cron | Laravel Queue (Redis) + Scheduler (cron) |
| Realtime (V2) | Supabase Realtime | Reverb (PHP) or Pusher |
| Ops surface | Low (managed everything) | Medium (managed DB + Forge handles most of the rest, but still your VPS) |

**Laravel adds ~1 hour/week of ops** vs Supabase's "almost zero." Not deal-breaker, but real for a Akash/psychiatrist.

### F. Type safety

- TypeScript end-to-end (current plan): tight, refaAkashr-safe, IDE-loved.
- PHP 8.3 with strict types + Larastan level 8 + Pest + Eloquent's lack-of-static-typing on `$model->whatever` access: noticeably looser. For a clinical product handling PHI/scoring, **TS is the better hand to be holding**.

### G. Hiring & longevity

| | Current (Next.js + Supabase) | Pivot (Laravel) |
|---|---|---|
| Indian PHP/Laravel dev pool | Smaller relevance | **Very large**, lower median rates |
| Indian Next.js/TS pool | Significant, higher rates | Smaller relevance |
| Future hire ramp time | ~1–2 weeks for a senior dev | ~1 week for a senior PHP dev |
| Bus faAkashr (you alone leaves) | Harder to backfill | Easier to backfill |

**This is the single strongest argument for Laravel for an Indian-market clinical product run by a small team.**

---

## 4 · Side-by-side decision matrix

| Decision dimension | Edge |
|---|---|
| Patient-facing intake UX | **Next.js** (client-rich React, no roundtrip cost, distress-safe) |
| Admin/MHP dashboard speed | **Laravel** (Filament/Nova; days vs weeks) |
| Security defaults (PHI, RLS-first) | **Next.js + Supabase** (RLS as primary gate is safer-by-default) |
| Encryption key custody | **Next.js + Supabase** (Vault built-in) |
| Type safety end-to-end | **Next.js + TS** |
| Indian hiring pool / bus faAkashr | **Laravel** |
| Ops overhead | **Next.js + Supabase** |
| Speed to V1 | Roughly **wash** |
| Speed to V2 (admin tooling) | **Laravel** |
| Vendor lock-in | Slight edge **Laravel** (DB is portable Postgres; Supabase is sticky on Auth/Vault/Storage) |
| DPDP / MHA / Telemed compliance | **Wash** — both can satisfy; the compliance is in the architecture, not the language |
| Cost / infra spend at V1 scale (≤10k MAU) | **Wash** — Supabase free tier vs DO/Hetzner ~$20–40/mo VPS |

---

## 5 · Net verdict

**Stay on Next.js + Supabase for V1**, unless one or more of these is true:

1. **You're materially more PHP-fluent than JS-fluent** and will be writing the code yourself for the first 3–6 months.
2. **You expect to hire 2+ engineers within 90 days** and want the larger Indian PHP pool.
3. **The admin/MHP dashboard is the core product surface** rather than the patient experience.

If any one of those is `true` → **Laravel + Inertia/React + AWS RDS Mumbai + KMS** is a credible, defensible alternative, and the right time to switch is now (not after architecture.md).

If all three are `false` → the Supabase RLS-first posture and TS end-to-end are real safety/correctness wins for a small-team clinical product, and the patient-facing intake is materially better in client-rich React.

---

## 6 · Hybrid path (only if you want to think about it)

Worth flagging as an option, though I don't recommend it for V1:

- **Next.js for patient surfaces** + **Laravel + Filament for the internal admin/MHP dashboard**, sharing the same Supabase Postgres.
- Pros: Best-of-both. Patient gets React; ops gets Filament.
- Cons: Two stacks, two deploy pipelines, two auth integrations, two i18n setups, two test suites. For a small team this is **2× the maintenance cost for ~1.3× the capability**. Reconsider at V1.5 if admin tooling becomes a bottleneck.

---

## 7 · Open decisions — Akash to answer

| # | Question | Options |
|---|---|---|
| **S1** | Your fluency: which stack are you faster in *today*? | (a) PHP/Laravel · (b) TS/Next.js · (c) roughly equal · (d) neither, will hire/learn |
| **S2** | Team plan for first 6 months | (a) solo · (b) 1 contraAkashr + you · (c) 2–3 hires · (d) >3 hires |
| **S3** | If you had to pick one surface to be a wow-moment, which? | (a) the patient intake & treatment journey · (b) the MHP/admin operational dashboard |

**Decision rule (informal):**

- S1=a OR S2≥c OR S3=b → **Laravel pivot is credible**; we re-spec.
- S1=b AND S2≤b AND S3=a → **stay Next.js + Supabase**; proceed to architecture.md.
- Mixed signals → ask a follow-up before locking.

---

## 8 · If we pivot — concrete next steps (not yet authorised)

1. Update `CLAUDE.md` stack section: Laravel 11 + Inertia/React + AWS RDS Mumbai + KMS + Forge.
2. Edit `data-model.md`:
   - §3.9 — replace Supabase Vault with KMS/HashiCorp Vault custody.
   - §6.1 `users` — drop `auth_user_id`; users IS the auth table.
   - §7.2 RLS helpers — drop `auth.uid()` / `auth.jwt()`; either remove or recast as defense-in-depth with `current_setting('app.user_id')` set per request via a Laravel middleware.
   - §10 migrations — replace `0011_vault_secrets.sql` with KMS bootstrap + DB user with `pgcrypto` grant.
   - §16 changelog — add v1.2 entry "Supabase → Laravel pivot."
3. Re-issue `intake-spec.md` §8 Phase 1 vs W5 distinction with React + Inertia framing.
4. Draft `architecture.md` from the Laravel baseline.
5. Memory: save a project memory entry locking the pivot date and reasons.

**Total spec churn:** 1.5 days. No code thrown away (we have none).

---

## 9 · If we stay (recommended default) — next steps

1. Keep `CLAUDE.md` stack section as-is.
2. Keep `data-model.md` v1.1 unchanged.
3. Draft `architecture.md` from the Next.js + Supabase baseline next session.

---

**Maintainer:** Akash · drafted by Claude on 2026-04-26.
**Decision deadline:** before `architecture.md` is drafted (next session).
**Supersedes:** none.

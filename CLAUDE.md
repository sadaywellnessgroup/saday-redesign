# CLAUDE.md — Saday Wellness

> Project-local guidance. **Supersedes** the global `~/CLAUDE.md` (which describes a different Next.js+Drupal project — ignore it for Saday work).

## What this project is

**Saday Wellness** — Indian mental-health telemedicine platform. Phase 0–4 over 24 weeks. Currently in **Phase 0 (W1: foundation specs)** — no application code exists yet. The repo holds inherited prototype HTML (Tealfeed / Graphy / Swasthmind redesigns) used as research input, plus the Saday spec docs we are actively authoring.

**User:** CTO + practicing psychiatrist. Wears both hats. Will make clinical, UX, and architectural calls. Treat as senior peer.

## Repo orientation

- `docs/Saday_Master_Blueprint.html` (and `_v2.html`) — full product blueprint. §11 entity catalogue, §12 CTO non-negotiables, §13 stack, §14 compliance.
- `docs/Saday_Action_Plan_by_Claude.md` — week-by-week deliverables. Phase 0 W1 schedule.
- `docs/intake-spec.md` — 7-screen adaptive intake spec. D1–D8 locked. Pending CF review W2 Wed.
- `docs/data-model.md` — 34-table Postgres schema across 9 domains. v1.1. Pending CTO security review W2 Mon, CF clinical review W2 Wed.
- `docs/Tealfeed/` and `docs/Swasthmind CRM/` — competitive scans. Read only when answering a specific question.
- `docs/user-flows.html` — flow diagrams.
- `*.html` in repo root — **inherited prototypes for unrelated platforms** (Graphy course pages, Tealfeed CRM, Swasthmind CRM). Do not treat as Saday application code.

## Stack (planned, not built)

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind. Server Components by default.
- **Backend / DB:** Supabase Postgres in **ap-south-1 (Mumbai)** with RLS-default-deny + FORCE. pgcrypto column-level encryption via Supabase Vault (no GUC keys). pg_partman for monthly audit_log partitioning. pg_cron for scheduled jobs.
- **Auth:** Supabase Auth + custom_access_token_hook to inject `user_role` into JWT. TOTP mandatory for MHP/admin/counsellor. Email-OTP for patients (no password). HttpOnly cookies, not localStorage. Identity bridge: `public.users.auth_user_id` → `auth.users.id`.
- **Payments:** Razorpay. **All money in `BIGINT` paise**, column suffix `_paise`. Display formatter at every UI surface. Never store rupee strings.
- **Messaging:** MSG91 WhatsApp (templates), SMS fallback.
- **Video:** Daily.co primary, Jitsi fallback. Store `meeting_room_id`, mint signed join URLs server-side.
- **Observability:** Sentry with PHI redaction.
- **Edge:** Cloudflare. Turnstile + per-IP rate limits as anti-scrape (in lieu of pre-intake signup wall).

## Domain non-negotiables

- **5 care tracks:** T1 (mild) → T5 (crisis).
- **Languages:** **EN + HI only** (not 14 — that's the global CLAUDE.md's other project). RTL: none.
- **Adaptive intake:** 7 screens, 8 symptom clusters (mood, anxiety, trauma, focus, sleep, substance, eating, stress), C-SSRS items 1–2 universal + 3–6 gated, severity-wins routing with primary-concern tiebreak.
- **12 V1 assessment tools:** PHQ-9, GAD-7, MDQ, ASRS-v1.1, AUDIT-C, PCL-5, OCI-R, MSI-BPD, SCOFF, PSS-10, ISI, C-SSRS. Version-locked per (tool, version, language) — see `data-model.md` `assessment_tool_versions`.
- **18+ self-only in V1.** No minor pathway until ML sign-off + parental-consent artifact (V1.5+).
- **T5 = resources only + 2h justice-coordinator SLA.** Do not auto-book. See intake-spec §7.
- **SOAP body invisible to admin** (B6) — RLS denies admin SELECT on `session_notes` body columns; admin uses metadata-only view.
- **Audit log = append-only**, per-row sha256 content hash + weekly Merkle root externalised to S3 ap-south-1 (V1.5: mirror to R2). **Do not call this a "hash chain"** — it isn't (no prev-row pointer in V1).

## Compliance frame

- **DPDP 2023** §6, §8(5)(6), §11–§17. Granular consent ledger, DSR workflow with 30-day SLA, breach notification 72h.
- **Mental Healthcare Act 2017** §23 (confidentiality), §24 (record access). Min 7 years retention.
- **Telemedicine Practice Guidelines 2020** (MoHFW) — record-keeping minima.
- **Privacy posture commitment:** must measurably exceed Tealfeed (no MFA, no consent capture, no DSR portal) AND Swasthmind (16 findings: 1 CRITICAL + 5 HIGH). See `data-model.md` §4 benchmark table.

## How to work in this repo

- **No application code yet.** Do not generate code unless explicitly asked. Phase 0 is specs.
- **Decisions are tracked in-doc.** Each spec has a §2 Decisions log (D-series for intake, DM-series + B-series for data-model). Lock with a row, mark proposed with `// PROPOSED`, never silently change.
- **Work decision-by-decision when drafting specs.** Surface 5–8 high-leverage decisions per doc, auto-lock the rest. Match the user's compact "1a 2a..." style for menus.
- **Cite sources** when claiming compliance, prevalence, or comparator behaviour. The Saday_Master_Blueprint, intake-spec, and data-model are first-party; Tealfeed and Swasthmind scans are second-party; legal text is primary.
- **Conventions** (already locked in `data-model.md` §3): snake_case, text + CHECK over enums, TIMESTAMPTZ everywhere with IST display layer, FK `ON DELETE RESTRICT`, every PHI table has `organization_id`, `_encrypted` / `_hash` / `_paise` / `_at` column suffixes.

## Working style with this user

- **Push back with data when you disagree** on clinical / UX / architectural calls. The user explicitly prefers reasoned dissent over compliance — see `~/.claude/projects/-Users-akash-Downloads-saday-redesign/memory/feedback_pushback_welcome.md`. Yes-anding gets corrected.
- **Don't speculatively read large files** to "be thorough." Reach for a file only when you can name the question it answers. The user has called this out before.
- **Keep menus compact.** "1a 2a 3b" style. Don't bury options in caveats.
- **Time is precious.** Bring judgment, not motion.

## Things NOT to do

- Don't assume Next.js+Drupal stack — the global `~/CLAUDE.md` is for an unrelated project.
- Don't read `*.html` in repo root expecting Saday application code — those are inherited prototypes.
- Don't auto-decide on safety, consent, clinical, or routing matters. Surface to user.
- Don't store rupees. Always paise.
- Don't store plaintext PHI in audit_log JSONB without applying the redaction rule (`data-model.md` §7.3.2 audit_log block).
- Don't compare `users.id = auth.uid()` directly. Use the `current_user_id()` helper that resolves through `auth_user_id`.
- Don't overclaim "hash chain" — it's per-row content hash + weekly Merkle anchor.
- Don't introduce new dependencies, frameworks, or patterns without checking the blueprint §13 stack first.

## Open Phase 0 W1 deliverables (as of 2026-04-26)

| Deliverable | Status | Owner mode |
|---|---|---|
| `docs/intake-spec.md` | ✅ v1.0 (2026-04-25) | Pending CF W2 Wed |
| `docs/data-model.md` | ✅ v1.1 (2026-04-26) | Pending CTO W2 Mon + CF W2 Wed |
| `CLAUDE.md` (this file) | ✅ (2026-04-26) | — |
| `docs/architecture.md` | ⏳ overdue (W1 Mon) | Keep-with-user, decision-by-decision |
| `docs/tool-library.json` | ⏳ W1 Thu | Delegate-to-agent (after architecture.md locks naming) |
| `docs/assessment-scoring.md` | ⏳ W1 Sat | Delegate-to-agent (after tool-library locks ids) |
| 4 WhatsApp templates → MSG91/Meta | ⏳ W1 Fri | Keep-with-user (CF clinical sign-off) |
| `docs/agents-brief.md` | ⏳ before first delegation | Keep-with-user |

## Reference

- Memory index: `~/.claude/projects/-Users-akash-Downloads-saday-redesign/memory/MEMORY.md`
- Active memories: user profile, intake-spec D1–D8, pushback-welcome feedback

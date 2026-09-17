# saday_crm — guidance for Claude sessions

## What this is
Saday Wellness Group's online consultation/therapy CRM for India, EN+HI.
This folder is **P1: UI on mock data only** — patient app (`/app`),
provider console (`/pro`), admin console (`/admin`), built on Next.js
(App Router, TS, Tailwind), all three roles complete, no Supabase/
Razorpay/100ms/WhatsApp wiring yet. Full V1 scope is `docs/BUILD_PLAN.md`
§2 (client, provider, admin, shared infra); §0 and §6 ("Explicitly out")
say what V1 deliberately does not do.

## How to run
- Node 22 (see `app/.nvmrc`).
- `cd app && npm install`
- `cp .env.example .env.local` (mock mode needs no real keys —
  `DATA_SOURCE=mock`, `ADAPTER_MODE=stub` by default)
- `npm run dev`, open `http://localhost:3000`
- Go to `/dev/switch-role`, pick patient/provider/admin.
- Login is phone + OTP, code is **always `000000`** in dev (stub OTP
  sender, `src/lib/adapters/otp-code.ts`) — no real SMS/WhatsApp sent.

## Model routing (D-000, token-frugal — follow it here too)
- **Fable** (planning model) — plans and supervises only. Never writes
  app code directly.
- **Opus** — heavy builds: new modules, architecture-shaped work,
  anything touching the booking engine, clinical note/proforma
  immutability, or RLS.
- **Sonnet** — the mundane bulk: routine coding, reading/tracing code,
  fixing tests, most day-to-day changes in this repo.
- **Haiku** — copy only: UI strings, HI translations for review, no
  logic.

## Every decision goes through Saday
`docs/DECISION_LOG.md` is the record. Every non-trivial choice — schema,
UX pattern, scope cut, vendor pick — gets a row: `D-xxx | date | status |
decision | rationale | trace`. Status is `PROPOSED` (awaiting Saday),
`LOCKED` (Saday confirmed), or `SUPERSEDED`. **Never reinterpret or
quietly change a LOCKED row.** If new information conflicts with one,
stop, add a new `PROPOSED` row explaining the conflict and surface it —
don't edit the LOCKED row in place. Facing a decision the log doesn't
cover? Flag it for Saday instead of picking a default.

## Design-language non-negotiables (D-002)
- Tokens come from the **main site** (indigo / terracotta / cream /
  turmeric / ink), fonts Fraunces (display) + Mukta (body) + Tiro
  Devanagari Hindi (Hindi body). The vendor demo's sage-green palette is
  rejected — do not reintroduce it.
- **No borders**; use feather/soft shadows for separation.
- Indian motifs (`lib/motifs.ts` + the motif SVG set) appear **only** on
  welcome/landing, resource/materials, and empty states — **never** on
  clinical screens (notes, proforma, session detail, patient records).
  Keep those clean and clinical.
- Mobile-first: every screen is designed and verified at 360px width
  first, then ≥md/1280. Verify visually with a screenshot before calling
  a screen done, not just by reading the JSX.
- Use `Sheet` (bottom sheet) for mobile overlays — filters, attachments,
  date pickers, confirmations — never a centered `Dialog` on mobile.

## Architecture pointers (`docs/architecture.md`)
- §3 — RLS policy map (Supabase row-level security is the primary PHI
  gate; read before touching any table access).
- §4 — Adapter interfaces (D-025): OTP, payments, video, notifications,
  each with a `Stub*` (used when `ADAPTER_MODE=stub`) and a real
  implementation. Stubs never make network calls.
- §5 — Data-access layer (mock-first): `repos = DATA_SOURCE === 'mock'
  ? mockRepos : supabaseRepos`. This folder runs mock-only; don't wire
  live Supabase calls without a decision-log entry.
- `DATA_SOURCE` (`mock`|`supabase`) and `ADAPTER_MODE` (`stub`|`live`)
  are the env flags gating all of the above — see `.env.example`.

## Conventions
- Money: integer **paise**, never rupee decimal strings or floats.
- Time: stored **ISO 8601 UTC**, displayed in **IST** — never store
  local time.
- DB: `snake_case` column/table names.
- i18n: **no hardcoded strings** in patient-facing UI — everything keyed
  through `next-intl` (`app/messages/`), EN authored first, HI drafted
  by Haiku, proofread by Saday/team before it ships. Provider/admin
  console is EN-only by decision (D-019).
- Mobile overlays are `Sheet`, not `Dialog` (see design section above).

## Verification ritual before calling anything done
```
npm run build && npm run lint && npm test && npm run screens
```
`npm run screens` needs `npm run build` first, then `next start` +
Playwright screenshots every route at 360×780 and 1280×800. **In a
sandbox that blocks Google endpoints, `npm run screens` can hang** —
use `node scripts/probe.mjs <path> <role|-> <width>` instead, which
shoots a single route against an already-running `next start` and does
not touch those endpoints. Always eyeball the resulting screenshots
before calling a screen finished, especially at 360px.

## What NOT to do (locked decisions — don't reopen without Saday)
- No care tracks / track-based segregation (D-003).
- No intake safety/screening step and no helpline module beyond the
  static urgent-help footer line; risk is captured only via the
  session-note risk chips (D-009).
- No AI-generated note drafting — the 4-section note editor is manual
  entry, sign & lock, supersede-to-v2 only.
- No licensed psychometric tools beyond what's already scoped (PHQ-9
  etc. per the assessment spec) — don't add new proprietary instruments.
- No rupee (₹) decimal strings anywhere in code or DB — paise integers
  only.
- Don't read `_refs/` (sibling to `docs/`/`app/`/`supabase/` in the
  source repo, **not included in this export**) unless a specific
  question needs the original vendor reference material — it's
  reference-only and never ships.
- Don't touch main-site design tokens/repo — this CRM consumes them,
  it doesn't own or modify them.

## Status & open questions
- Current status: see `docs/BUILD_PLAN.md` §6a (status log) — as of the
  last entry, P1 (UI on mock data) is complete across all three roles,
  pending Saday's walkthrough before P2 (Supabase wiring, real auth,
  Razorpay test mode, 100ms).
- Anything not yet decided: scan `docs/DECISION_LOG.md` for rows with
  status `PROPOSED` — those are open questions waiting on Saday, not
  settled defaults to build against.

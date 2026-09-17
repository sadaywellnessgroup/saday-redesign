# Saday Wellness CRM — app

P1 foundation + the patient app + the **provider console**: shells, design
tokens, domain types, mock repository layer, stub adapters, dev-only role
switching, EN/HI i18n. See `/home/claude/saday-crm/docs/`
(architecture.md, DECISION_LOG.md, BUILD_PLAN.md) for the decisions this
code traces to.

### Provider console (`/pro`, role cookie `provider`)

| Route | What it is |
|---|---|
| `/pro` | Today: date header, today's sessions, "Unwritten notes" strip (MantraCare's unbilled-sessions pattern pointed at notes), week earnings, follow-up replies, Edit-availability shortcut (D-035) |
| `/pro/calendar` | Week view (Mon–Sun ≥md, single day + day strip at 360), status-tinted blocks, hatched buffers/days off, month mini-picker in a Popover, tap → detail Sheet |
| `/pro/availability` | Weekly recurring rules, session settings (buffer / min notice / max advance), separate Days-off table (MantraCare digest §11) |
| `/pro/patients` | Search + status filter; cards at 360, table ≥md. Onboarding status kept separate from clinical status |
| `/pro/patients/[id]` | Sticky tabs — Overview · Notes · Proforma · Assessments · Files · Messages |
| `/pro/patients/[id]/notes/new`, `/notes/[noteId]` | The D-005 four-section note editor; autosaving draft, Sign & lock, signed notes read-only with Supersede → v2 (architecture.md §11) |
| `/pro/patients/[id]/proforma/new`, `/proforma/[id]` | The 15-section online assessment proforma (D-016) with per-section completion %, ICD-11 picker, same sign/lock rules |
| `/pro/earnings` | Period selector, gross / commission / net / pending tiles, per-session ledger (patient initials only), payouts |
| `/pro/more` | Availability · Materials library (browse-only) · Profile & settings · Notifications · Sign out |

Clinical modules live in `src/lib/clinical/` (note spec, proforma spec +
completion maths, ICD-11 seed list, immutability rules) and provider
helpers in `src/lib/provider/` (availability validation, earnings totals,
patient status derivation, console data access).

## Run it (Windows)

```
node -v        # must be 22.x (see .nvmrc) — install from nodejs.org if not
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, then go to `/dev/switch-role` and pick a role
to preview the patient (`/app`), provider (`/pro`) or admin (`/admin`)
shell. Everything runs on mock data — no Supabase project, no Razorpay/
100ms/WhatsApp keys, no `npm install`-time network calls beyond the
registry itself.

Same commands work on macOS/Linux, just `cp` instead of `copy`.

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server (`next dev`). |
| `npm run build` | Production build (`next build`). Also the fastest way to catch a broken type or import. |
| `npm run start` | Serves the production build (`next start`) — used by `npm run screens`. |
| `npm run lint` | `next lint` (ESLint, `next/core-web-vitals`). |
| `npm run test` | `vitest run` — BookingRepo slot search, booking logic, note/proforma immutability, proforma completion %, earnings totals in paise, availability overlap validation, D-034. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run screens` | Builds nothing itself — run `npm run build` first. Starts `next start` on a free port, screenshots every route in `scripts/screens.mjs` (public, patient, provider, admin) at 360×780 and 1280×800 into `/home/claude/saday-crm/_screens/`, then exits. Uses the pre-installed Chromium under `/opt/pw-browsers` — never calls `playwright install`. In a sandbox where Chromium's Google calls are proxy-blocked this can hang; `node scripts/probe.mjs <path> <role\|-> <width>` shoots one route against an already-running `next start` and does not. |

Typical verification pass:

```
npm run build && npm run lint && npm test && npm run screens
```

## Folder map

```
src/
  app/                    Next.js App Router
    layout.tsx            Root layout: fonts, NextIntlClientProvider, Toaster
    globals.css           Design tokens (see below)
    (public)/              No-auth-chrome group — "/", "/intake"
    (client)/app/           Patient shell — bottom tabs <md, sidebar >=md
    (provider)/pro/         Provider console shell
    (admin)/admin/          Admin console shell (sidebar-only, still 360px-safe)
    dev/switch-role/        DEV ONLY — sets the saday_dev_role cookie
  components/
    ui/                    shadcn/ui primitives, re-themed to the brand tokens
    shell/                 TopBar, SidebarNav, BottomTabBar, the 3 *Shell wrappers, nav-config
    motif/                 <Motif name="lotus" /> — wraps public/motifs/*.svg
    lang/                  <LanguageToggle />
    page-heading.tsx       PageHeader-style banner + motif, used by every demo route
  i18n/                    next-intl config (locale cookie, not a URL prefix — see below), server action for the toggle
  lib/
    domain/                TypeScript types derived 1:1 from supabase/migrations/0001_schema.sql
    repos/                 One interface + MockRepository per aggregate (architecture.md §5)
      fixtures/            Deterministic seed data (org, 8 providers, 6 patients, ~20 appointments, ...)
    adapters/               WhatsApp/OTP/Payment/Video/Email/FileStorage — Stub* only (architecture.md §4)
    auth/session.ts        DEV ONLY mock session, reads the role cookie
    utils.ts                cn() + formatPaise()
messages/en.json, hi.json   Every UI string goes through a key — see i18n note below
scripts/screens.mjs         The `npm run screens` script
tests/                      Vitest contract test(s)
public/motifs/*.svg         Copied from _refs/motifs/
```

## Where the design tokens live — do not change the design language

`tailwind.config.ts` + `src/app/globals.css` are a superset of
`_refs/main-site/tailwind.config.ts` / `app/globals.css`: same colour
tokens (indigo/terracotta/cream/turmeric/ink), same fonts (Fraunces
display, Mukta body, Tiro Devanagari Hindi), same `rounded-soft`/
`rounded-softer`, same `shadow-feather`, same "no 1px grey borders —
structure from tone and shadow" rule. `globals.css` additionally maps
shadcn/ui's CSS variables (`--background`, `--primary`, `--radius`, …)
onto those brand tokens, so every shadcn component (button, card, input,
dialog, …) is on-brand the moment it's dropped in — no per-component
re-theming needed.

**Per DECISION_LOG D-002 / D-028: this design language is locked.** If a
new screen needs something the tokens don't cover, extend
`tailwind.config.ts` in the same spirit (soft radius, feathered shadow, no
hard borders) rather than inventing a new visual system, and flag it for
Saday's sign-off if it's a real departure.

## i18n

`next-intl` is wired to a **locale cookie** (`saday_locale`), not a URL
path prefix — `/app` stays `/app` in both languages. The language toggle
in every shell calls a server action (`src/i18n/actions.ts`) that sets the
cookie and revalidates. `messages/en.json` / `messages/hi.json` hold every
UI string used by the shells; nav labels have real Hindi
(होम/सत्र/ट्रैक/फ़ाइलें/संदेश, …). Some non-nav strings still have an
English placeholder under the Hindi key — search `messages/hi.json` for
lines identical to `en.json` if proofreading is needed. Provider/admin
console strings may stay EN-only per D-019, but still go through keys.

(architecture.md §7 describes a future path-prefixed `/(en|hi)/…` scheme
for patient routes — P1 uses the simpler cookie approach called for in the
P1 build plan; migrating later is a routing change, not a string-key
change, since every string is already keyed.)

## Data & adapters — everything is mocked/stubbed in P1

- `DATA_SOURCE=mock` (the only implemented mode) routes every repo call in
  `src/lib/repos/index.ts` to `MockRepository` implementations reading
  `src/lib/repos/fixtures/*.ts`. Setting `DATA_SOURCE=supabase` throws a
  clear "not implemented yet" error — P2's job.
- `ADAPTER_MODE=stub` (the only implemented mode) routes every adapter in
  `src/lib/adapters/index.ts` to a `Stub*` implementation. Stub OTP is
  always code `000000`. Stubs write to `.dev-outbox/<kind>/*.json` (and
  `.dev-storage/` for file uploads) instead of calling a real vendor —
  nothing leaves the machine. Both folders are gitignored.
- Fixture values invented for the demo (session prices, availability
  windows, registration numbers, etc.) are marked `// FIXTURE` in the
  source so a screens-phase agent or reviewer can tell "real content
  from `_refs/main-site/lib/content.ts`" apart from "made up to have
  something to render".

## Auth — DEV ONLY placeholder

`src/lib/auth/session.ts`'s `getSession()` reads the `saday_dev_role`
cookie (patient/provider/admin) and returns a fixed mock session for that
role — always the same patient/provider id, so every screenshot is
reproducible. `/dev/switch-role` sets the cookie. **This is not a security
boundary of any kind** and is fully replaced by Supabase Auth (phone OTP
for patients, email + mandatory TOTP for staff) in P2, per
architecture.md §2.

## What was not built in P1

- No real Supabase/Razorpay/100ms/WhatsApp integration (by design — D-025).
- No feature screens beyond the four shells' single demo route each.
- No route-level RBAC beyond "wrong dev role → redirect to /dev/switch-role".
- Provider prices/durations are read-only in the console (admin edits them
  in P5); video "Join" is a placeholder until 100ms is wired (D-013).

## Two fields that need a migration before P2

Both are used by the console today against the mock repo and are **not** in
`supabase/migrations/0001_schema.sql`:

- `provider_blockouts.repeats_yearly BOOLEAN NOT NULL DEFAULT false` — the
  Days-off table's "Repeats yearly" toggle.
- a `psychometric_assignments` table (patient, tool, assigned_by,
  administered_by, assigned_at, completed_submission_id) — "Assign a tool"
  currently records assignments in memory.

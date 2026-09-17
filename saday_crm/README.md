# saday_crm

Saday Wellness Group's online consultation/therapy CRM (India, EN+HI).
P1: patient app, provider console, admin console — UI complete on mock
data, no live Supabase/Razorpay/100ms/WhatsApp wiring yet.

## Run it
```
cd app && npm install && cp .env.example .env.local && npm run dev
```
Open `http://localhost:3000`, then `/dev/switch-role` to preview
patient (`/app`), provider (`/pro`), or admin (`/admin`). Login OTP is
always `000000` in dev.

## Docs
`docs/` — architecture.md, DECISION_LOG.md, BUILD_PLAN.md,
ui-references.md, mantracare-feature-digest.md. `CLAUDE.md` (this
folder's root) — Claude-session working rules. `screens/` — reference
PNGs. `supabase/migrations/` — schema.

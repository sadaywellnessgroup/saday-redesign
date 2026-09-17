# UI Reference Guide — Saday Consultation CRM (Patient App + Provider Console)

Sources: Saday's inspiration notes/images; main-site `tailwind.config.ts` + `globals.css`; DECISION_LOG D-002/D-028/D-033; BetterHelp, Headspace, Practo, Amaha (live fetch); Calm/Daylio/Bearable/Apple Health/Alma/SimplePractice (from knowledge). Mobbin unavailable (D-032). Amaha's booking/dashboard screens weren't reachable past its homepage — homepage structure used instead.

## A. Non-negotiables inherited from the main site

| Token / rule | Value | Note |
|---|---|---|
| Colour | `indigo #3E2A78` / `indigo-deep #2B1D57` / `terracotta #B0522E` / `cream #FAF5EC` (ground) / `card #FFFDF6` / `turmeric #D69A3C` (accent only) / `lilac-tint #F1ECF9` (soft fills) | No sage green (vendor demo rejected, D-002) |
| Type | Serif display (Fraunces) for headings; sans body (Mukta) for UI text; Hindi in `font-hindi` (Tiro), never faux-bolded Latin | `.display`, `.sec-title`, `.hindi-accent` |
| Borders | **None.** `borderWidth` 2/3/5 zeroed site-wide | Structure = tone + radius + shadow |
| Radius | `rounded-soft` 18px (inputs/chips) / `rounded-softer` 28px (cards) | |
| Shadow | `shadow-feather` resting / `shadow-feather-lg` hover — soft, never hard-edged | |
| Buttons | Pill (`rounded-full`); primary = solid indigo, ghost = card + inset hairline, terracotta = secondary CTA | Hover lifts 2px, no scale |
| Motif placement | Tree/lotus/mandala line-art (`lib/motifs.ts`) **only** on resources, toolkits, empty states, onboarding welcome | Never on consultation, provider list/profile, calendar, notes, proforma, or any clinical/data screen |
| Figurine rule (bird/puppy) | Only inside member-only toolkit PDFs and resources/blog; e.g. sleeping bird on a sleep resource | Never on consultation, provider, or clinical screens — same boundary as motifs, stricter |
| Indianization | Warm terracotta/cream grounds, real photography (no stock cartoons), Devanagari accent lines above key headings — Kama-Ayurveda restraint | No bright yellow/cyan (heartitout.in flagged as anti-pattern) |

## B. Per-screen pattern spec (design at 360px first — D-033)

| Screen | Layout @360px | Key components (shadcn) | Reference pattern | Saday twist |
|---|---|---|---|---|
| Intake (3 fields) | Single column, one field per scroll-stop, progress dots top | `Input`, `Select`, `Progress` | BetterHelp opening split, simplified to 3 fields (D-004) | Hindi sub-label per field; faint tree-line watermark only |
| Provider list | Card stack, sticky filter-chip row above | `Card`, `Badge`, `Avatar`, `Sheet` | Practo doctor-card (photo, specialty, experience, fee, "View Profile") + BetterHelp tone | NMC/RCI reg. no. (D-030), language chips, "Earliest: Today 4 PM" — **never list a provider with zero slots** |
| Provider profile | Photo/credentials block → sticky Book bar → About → Specialisations → Session types/price | `Tabs`, `Accordion`, `Card` | BetterHelp profile (About/Experience/License anchors) | Terracotta credential strip; real/professional photo only, no cartoon art |
| Slot picker | Horizontal 7-day strip + vertical time list | `ToggleGroup`, `ScrollArea` | Practo/BetterHelp slot grid | IST times explicit; grey out (not hide) full days |
| Booking summary / pay | Provider mini-card → session details → price breakdown → Razorpay CTA | `Separator`, `Card`, sticky CTA | Standard checkout (Amaha/Practo) | Commission-transparent price line |
| Client home | Greeting + next-session card → mood/sleep/score mini-charts → quick actions | `Card`, `Carousel` | Headspace needs-nav + Apple Health today-view | Hindi greeting toggle; figurine only in empty-state art |
| Mood log entry | One emoji/scale row + optional note + Save | `ToggleGroup`, `Textarea` | Daylio one-tap grid; Bearable simplicity | 5-point face scale in warm palette |
| Sleep log entry | Duration stepper + quality scale | `Slider`, `ToggleGroup` | Bearable/Apple Health sleep entry | Bedtime/wake as two compact steppers, IST |
| Trend chart | Single line, 8-week default, band toggle below | `Chart` (recharts) | Apple Health trend, Calm streak view | See Section D |
| Files/materials | List grouped by type, tap to preview/download | `Accordion`, `Badge` | Amaha knowledge-centre grouping | Therapy-sheet cards may carry a resource figurine icon |
| Messages thread | Chat bubbles, sticky composer, attachment clip | `ScrollArea`, `Input`, `Sheet` | SimplePractice/Alma messaging | No provider phone/email shown; async-notice banner top |
| Provider today | Card list, status pill, join/note actions | `Card`, `Badge` | SimplePractice day view | Compact, EN-only, no motif |
| Provider calendar | Week view, tap slot to expand | `Tabs`, custom grid | SimplePractice/Alma calendar | Buffer/block-out muted tone, not red |
| Availability editor | Recurring grid + separate "day off" exceptions | `Switch`, `Checkbox`, list | MantraCare: recurring kept separate from exceptions | — |
| Patient list | Table (desktop) / card-list (360px), search + status filter | `Table`/`Card`, `Input`, `Badge` | SimplePractice client list | Onboarding status kept separate from clinical status |
| Patient detail tabs | Sticky tabs: Overview / Notes / Proforma / Files / Messages | `Tabs` | SimplePractice/Alma client chart | Scores-over-time chart pinned to Overview |
| Session-note editor (Swasthmind 4-section) | Accordion: Session details → Clinical assessment → Narrative → Plan & next steps; risk/intervention chips, progress slider | `Accordion`, `ToggleGroup`, `Slider`, `Textarea` | Swasthmind screenshots (D-005) | **Lock/sign after finalize, visibly non-editable** — unlike MantraCare's forever-editable notes |
| Proforma | Collapsible sections per D-016 map; dropdowns/chips over free text | `Accordion`, `Select`, `RadioGroup` | Nischay IPD form digitised | Full MSE section (not the light version) |
| Assessment runner | One question/screen, progress bar, back allowed | `Progress`, `RadioGroup` | Classic self-rated screener pattern | EN/HI toggle per question; contact capture at the end |
| Scores-over-time | Multi-series line (one per tool), chip legend, severity bands | `Chart`, `ToggleGroup` | ABC360-style serial monitoring | See Section D |

## C. Mobile rules

- Bottom tab bar (patient: Home / Sessions / Log / Messages / Profile), fixed, 5 items max, safe-area padding.
- Primary actions sit in the thumb zone; sticky action-bar pattern from `MobileBookBar.tsx` — full-width pill CTA + optional icon button, `shadow-feather`, appears after scroll, respects `prefers-reduced-motion`.
- Minimum 44×44px tap targets everywhere, including chart legend toggles.
- Forms strictly one column below 640px; two-column only at `md:` (matches globals.css `.contact-form .row2`).
- Use `Sheet` (bottom sheet), not `Dialog`, for mobile overlays — filters, attachments, date pickers, confirmations.

## D. Chart rules (mood / sleep / scores)

- Line colour: indigo (`#3E2A78`); ground: cream/card, never white or dark mode.
- No gridlines; soft axis labels only, IST dates (`DD MMM`) on x-axis.
- Severity bands (e.g. PHQ-9 minimal/mild/moderate/severe) as tinted horizontal bands, not hard reference lines.
- Default window: last 8 weeks; expand to "All time" via ghost-button toggle, not a dropdown.
- Single metric per chart on patient screens; provider's scores-over-time may overlay tools as toggleable lines with a chip legend.
- Tooltip on tap/hover shows exact value + date, warm card background, feather shadow — no browser-default styling.

## E. Do-not list

1. Never show a provider card for someone with zero available slots (Lissun anti-pattern).
2. Never fire the same booking CTA regardless of severity band (MantraCare) — gate to real clinical thresholds.
3. Never leave a session note editable forever — require an explicit finalize/lock state.
4. No cartoon/anonymous stock testimonial art on provider or booking screens.
5. No template-generated look — every screen uses Saday tokens, not default shadcn colours.
6. No motifs or figurines on clinical, provider, or booking screens.
7. No hard borders anywhere — tone/shadow only, per main-site system.
8. No bright/neon accents (yellow-cyan combos) — stay within indigo/terracotta/turmeric/cream.
9. No centered `Dialog` for mobile filters/attachments — use bottom `Sheet`.
10. No provider contact details (phone/email) surfaced in messaging UI.

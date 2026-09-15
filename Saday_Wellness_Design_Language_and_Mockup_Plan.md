# Saday Wellness — Design Language + Mockup Plan

Scope of this document: lock the design language, list everything that must be decided or produced before building, and give the exact step-by-step path (design → mockup → AI tools) to a working homepage mockup **in the real Next.js repo** so it becomes the foundation, not a throwaway.

Out of scope for now (later phases, but the system is built to accept them): assessments engine, therapist booking, member toolkits/auth, college dashboard.

Confirmed decisions this plan is built on:
- **Showpiece = homepage hero** (About-us scrolling tree is the phase-2 showpiece).
- **Anchor colour = indigo-violet** (serves both "neural/psychiatry" and "Indian" at once).

---

## Part 1 — Design language (lock this before anything is written or built)

This is the single most important artifact. Once locked, every section inherits it and the site stays coherent. Do not start sections until this is signed off.

### 1.1 The anti-generic guardrail (read first)
The look that currently screams "AI-generated" is: cream background + high-contrast serif + clay-orange accent. Your brief legitimately asks for a warm Kama-Ayurveda ground, so you are close to that cluster on purpose. It only reads as *distinctive* if:
1. The **indigo neural-tree is the bold, memorable element** — spend your boldness there and keep everything else quiet.
2. Terracotta is a **deep Indian tone**, not the clay-orange near `#D97757`.
3. The **bilingual Devanagari + Latin typography** and **block-print/jali motifs** carry the Indian identity — these are specific to you and cannot be mistaken for a template.

If those three hold, the palette is a choice. If they don't, it drifts generic.

### 1.2 Palette — 5 roles, no more
| Role | Colour | Hex (starting point) | Use |
|---|---|---|---|
| Anchor | Deep indigo-violet | `#3E2A78` | Logo, headings, tree line-art, primary CTAs |
| Warm block | Deep Indian terracotta | `#B0522E` (not clay-orange) | Solid section bands only: comparison table, urgent-help footer, one CTA band |
| Ground | Warm cream | `#FAF5EC` | Page background (warmth vs. clinical white) |
| Ink | Warm near-black | `#2A2320` | Body text |
| Highlight | Muted turmeric/ochre | `#D69A3C` | Small emphasis only, sparingly |

Rule: terracotta and turmeric appear as **blocks and small accents**, never as scattered text colour. Five roles is the ceiling — more and it drifts.

### 1.3 Typography — bilingual from day one
Design for Devanagari + Latin together now, so Hindi is never bolted on later.
- **Display / headings:** Tiro Devanagari Hindi (free, Google Fonts; has matching Latin; editorial warmth).
- **Body / UI:** Mukta (Ek Type; Devanagari + Latin; clean, web-ready, free).
- **Later upgrade (optional, paid):** Indian Type Foundry (Begum / Brahmos) if you want something more own-able in the display slot.
- **Do not** distort Latin letterforms to look "Indian." Pair authentic Devanagari instead.

### 1.4 The tree as a system, not just a logo
This is your signature and the thing the site is remembered by. Decision: make it **line-based, single-weight, indigo**. One line quality then reads three ways at once — axon/dendrite (neural), tree (life), block-print line-work (Indian). Recurring uses so it is *felt, not stated*:
- Roots as the footer / About-us device (team sits *in* the roots).
- Branch lines as connectors between service cards.
- Dendrite-branching as the visual for the Individuals / Institutions / Professionals split.
- One low-opacity tree behind the hero.

Action: from the "Motif options" sheet, pick **one** version as the primitive. Do not carry several weights/styles.

### 1.5 Figurines / iconography
- **Now:** Lucide line icons recoloured indigo to match the tree line-work + your existing bird/puppy PNGs as placeholders.
- **Rule that protects clinical credibility:** figurines appear **only** at human/support touchpoints — resources, toolkits, empty states, member content. **Never** on consultation, therapist, or institution pages. This boundary is what lets you borrow Paper-Boat warmth without undercutting the professional outlook you flagged as a risk.

### 1.6 Motion
- Base: slow, calm easing everywhere (fade / blur / scroll reveals). Prefer subtle Magic UI micro-interactions over heavy Aceternity effects.
- Boldness goes big in **one** place only: the hero.

### 1.7 Hero (the showpiece) — direction
Every visitor sees it and it is on the money path, so this is where the risk is spent.
- Three-way split — **Individuals / Institutions / Professionals** — as the primary choice (BetterHelp's opening division is the *structure* reference only; the *look* comes from Headspace warmth + your indigo tree).
- Low-opacity indigo tree behind, with a slow ambient movement (gentle blur/drift, not busy).
- One mission line + three short split labels + a "not sure? — know more" scroll cue.
- Warm cream ground, indigo type, one terracotta or turmeric accent — restrained.

---

## Part 2 — What else needs to be done (before the mockup can be built)

Grouped by owner. Nothing here is the day-by-day build; it is the set of gates.

### 2.1 Decisions you (founder) must make
1. Sign off the palette hexes in 1.2 (adjust tones if you want, but keep to 5 roles).
2. Confirm the type pairing in 1.3 (Tiro + Mukta) or ask for alternatives.
3. Pick the **one** tree motif from the "Motif options" sheet.
4. Confirm the figurine placement rule in 1.5.
5. Confirm hero copy direction (mission line + three labels) — see 2.3.

### 2.2 Assets that must exist (or be generated)
1. **Logo:** final tree lockup (you noted trademark in progress — a working export is enough to design against; final file swaps in later).
2. **Tree line-art primitive** as an SVG (single weight) — generated in Recraft (see Part 4).
3. **Motif accents:** jali/block-print SVG dividers, low-opacity — Recraft.
4. **Figurines:** current bird/puppy as placeholders now; regenerate on-brand later.
5. **Real photography plan:** the site looks generic the moment it uses stock. Decide whether the team/professional shoot (your Trijog reference) happens before or after mockup. Mockup can use tasteful placeholders, but launch needs real images.

### 2.3 Content (this is the real bottleneck, not design)
Designing around lorem ipsum is what produces the AI-generated feel you are rejecting. Write to fixed slots so length is controlled. Voice by zone:
- **Base voice:** warm, plain-spoken, conversational-credible. Indian-ness via bilingual headings and resonant phrasing, not slang.
- **Founder story / About:** most personal — real, first-person, vulnerable (your BetterLYF reference is the right model).
- **Services / consultation:** warm but confident and specific; credibility carries conversion here.
- **Urgent help / legal:** plain and formal, no personality.

Homepage text slots (write to these exact sizes):
- Hero: one mission line (~15–20 words) + three split labels + one sub-line each (~8 words) + "not sure? — know more".
- Services carousel: per card = 2–4 bold words + one sentence (~15 words).
- Comparison table (Indianised): each cell 3–5 words.
- FAQ: 6–8 Q&A, each answer 2–3 sentences.
- Urgent-help band: heading + contacts, minimal.

### 2.4 Technical setup (CTO)
1. Confirm the repo is clean on a feature branch (not `main`), dev server runs from the `main-site` subfolder.
2. Install shadcn/ui in the existing Next.js repo.
3. Wire Google Fonts (Tiro Devanagari Hindi, Mukta).
4. Be ready to paste v0 output and run the theme tokens (Part 4).

---

## Part 3 — The build order (design → mockup, one step at a time)

Ordered so the mockup lands as editable React/Tailwind in your repo. This is the "how", not a calendar.

**Step 1 — Lock the design language.** Sign off Part 1. Nothing proceeds until this is done.

**Step 2 — Produce the token file.** Turn the palette + type into shadcn CSS variables using tweakcn (Part 4). This is the act that technically "finalises" the language — every future section inherits it.

**Step 3 — Produce the tree + motif SVGs.** Recraft, brand-style locked, so all accents share one look (Part 4).

**Step 4 — Write homepage copy** to the slots in 2.3. Do this *before* generating sections so v0 has real words.

**Step 5 — Generate the homepage in v0**, section by section, from a tight prompt that references the locked tokens + pasted reference screenshots. Order: hero → services carousel → comparison table → FAQ → urgent-help band → footer (roots).

**Step 6 — Assemble in the repo (me / Claude Code).** Paste v0 sections in, wire the tokens and fonts, drop in the SVGs, refine spacing/motion, one section at a time with a browser check and a commit after each. This becomes your working foundation.

**Step 7 — Review the assembled homepage**, then decide the next page (I'd argue the online consultation page next, since it drives bookings).

Later pages (consultation, therapist profile, resources, About-us tree showpiece, college program) attach as new routes on the **same tokens and layout system** — that is the future-proofing at the design layer, and why the mockup is not throwaway.

---

## Part 4 — Using the AI tools to finalise the design language + produce the mockup

You don't need to operate tweakcn/React yourself — the steps below say who does what. Each step is non-destructive to the repo.

### Tool 1 — tweakcn (finalises the tokens) — *CTO, ~30 min*
- Go to tweakcn.com.
- Enter the 5 palette hexes (1.2) and set the type pairing to Tiro Devanagari Hindi (display) + Mukta (body).
- Set corner radius and spacing to taste (soft, not sharp — matches the calm direction).
- Export as Tailwind CSS variables.
- CTO commits these variables into the repo's global stylesheet. **Outcome: the whole site now has one coherent base before any section exists.**

### Tool 2 — Recraft (produces the on-brand SVGs) — *you or CTO, ~1–2 hrs*
- Go to recraft.ai, create a **brand style** locked to indigo `#3E2A78` on cream, single-weight line-art.
- Generate: (a) the tree primitive (roots + branches, one line weight), (b) 2–3 jali/block-print divider strips at low opacity, (c) optional Warli/Madhubani-style single hero accent.
- Export as **SVG** (not PNG) so they scale and recolour cleanly.
- Keep them minimal — accents with generous whitespace, never dense ornament.there 

### Tool 3 — v0 (generates the homepage sections) — *you can drive this; CTO reviews code*
- Go to v0.app.
- Prompt per section, and in each prompt: (1) state it must use the shadcn tokens already defined, (2) paste the matching reference screenshot from your Drive folder, (3) give the real copy from Step 4, (4) name the warm-Indian direction explicitly (indigo tree, cream ground, calm motion, Devanagari headings).
- Example hero prompt shape: *"A calm wellness hero, cream `#FAF5EC` ground, deep indigo `#3E2A78` type, a low-opacity single-line indigo tree behind. A three-way choice: Individuals / Institutions / Professionals as three quiet cards. Slow fade-in on load. Devanagari + Latin heading. Use existing shadcn theme tokens. [paste reference + copy]"*
- v0 outputs React + Tailwind + shadcn — the same system as your repo — so it drops in without a rewrite.

### Tool 4 — Claude Code (assembles + refines in the repo) — *me*
- I paste each v0 section into the Next.js repo, wire tokens/fonts, insert the Recraft SVGs, tune motion and spacing, and commit one section at a time with a browser check after each.
- Output: a working, coherent homepage mockup in your real codebase, ready to extend to the next page.

### What NOT to do with the tools
- Don't use hosted no-code builders (Framer/Webflow) for the site itself — lock-in, and it defeats "mockup becomes foundation."
- Don't let v0 output ship un-themed — it looks generic until the tokens and SVGs are applied.
- Don't scatter Recraft motifs everywhere — dividers and one hero accent only.

---

## One-line summary of the critical path
Lock design language (Part 1) → tweakcn tokens (CTO) → Recraft tree/motif SVGs → write homepage copy → v0 sections → I assemble in the repo. The tokens step is the moment the design language is "finalised"; everything after inherits it.

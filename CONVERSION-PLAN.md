# Graphy Course Page Conversion Plan

## Overview

Convert the custom `saday-course-detail.html` design into Graphy-compatible sections using **AI chat prompts only** (the Code editor tab crashes on custom sections — this is a known Graphy limitation).

### Current Graphy page structure (graphy-turd.html):
```
sec-topbar     → Header (already styled, KEEP AS-IS)
sec-crsh10     → Course Hero (AI-generated, REPLACE with our design)
sec-p9k2m4x7   → Main content: Learn + Curriculum + Instructors + Pricing sidebar (AI-generated, REPLACE)
sec-foot1      → Footer (already styled, KEEP AS-IS — repeated 6x in DOM, Graphy quirk)
sec-graphy-footer → Graphy branding footer (KEEP AS-IS)
```

### Target page structure (matching saday-course-detail.html):
```
sec-topbar        → Header (KEEP)
sec-crsh10        → Course Hero — redesigned (DONE ✅ — prompt already worked)
sec-p9k2m4x7      → What You'll Learn + Curriculum + Instructors + Pricing Sidebar (REPLACE)
sec-foot1         → Footer (KEEP)
sec-graphy-footer → Graphy footer (KEEP)
```

---

## Key Rules Learned from Previous Attempts

1. **Section comes first, `<style>` comes AFTER `</section>`** — Graphy's `m.qF` function scans forward and breaks if reversed.
2. **Style tag MUST have `id="stl-{X}"` and `data-ai-id="stl-{X}"`** where `{X}` matches the section's ID suffix (e.g., section `sec-crsh10` → style `stl-crsh10`).
3. **Code editor tab will crash ("something went wrong")** on custom HTML — use only the **AI chat** to make edits.
4. **No Tailwind, no Alpine.js (except Graphy-native sections), no Material Icons** — all icons must be inline SVGs.
5. **All CSS must be scoped** under the section ID (e.g., `#sec-p9k2m4x7 .class-name`) to prevent collisions.
6. **`data-type="text"`** on any text node you want editable in Graphy's visual editor.
7. **`data-type="image"`** on any `<img>` you want swappable.
8. **`data-cta-type="plan_buy_now"`** + `id="plan-buy-button"` on the buy button — Graphy's `coursePage.js` hooks into this.
9. **Every element that Graphy should recognize** needs a unique `data-ai-id` and `id`.
10. **Class names must not collide with Graphy's own classes** — prefix with something unique (e.g., `cd-`, `crsh-`).

---

## Section-by-Section Conversion

### Section 1: Course Hero (sec-crsh10) — ✅ DONE

Already converted via prompt. Uses `sec-crsh10` / `stl-crsh10`.

---

### Section 2: Main Content Area (sec-p9k2m4x7)

This is one giant section in both the original Graphy page and our design. It contains 3 sub-areas in a 2-column grid (content left, pricing sidebar right):

**Left column:**
- What You Will Learn (4-card grid)
- 10-Day Curriculum (accordion using `<details>`/`<summary>` — pure HTML, no JS)
- Meet Your Instructors (2-column cards)

**Right column:**
- Sticky pricing card with buy button

#### Prompt for Section 2:

```
Redesign the sec-p9k2m4x7 section completely. Keep the existing section id="sec-p9k2m4x7" data-ai-id="sec-p9k2m4x7" and style tag id="stl-p9k2m4x7" data-ai-id="stl-p9k2m4x7" placed AFTER the closing </section> tag.

LAYOUT: Two-column grid on desktop (max-width: 1100px centered). Left column ~68% for course content, right column ~320px for sticky pricing sidebar. On tablet (below 992px), single column with sidebar stacking to top (order: -1). All CSS scoped under #sec-p9k2m4x7.

=== LEFT COLUMN: COURSE CONTENT ===

--- SUB-SECTION 1: What You Will Learn ---

Section heading with icon-circle (32px round, #f3f0ff background, #5e2dc6 color) containing an open-book SVG icon, then text "What You Will Learn" — 24px, font-weight 700, #1a1a1a. The heading element: data-ai-id="el-learn-title", data-type="text".

2x2 grid of learning cards (gap: 20px, single column below 640px). Each card: background #f8f9fa, padding 24px, border-radius 12px, translateY(-2px) on hover. Each card has:
- Icon container (40x40px, border-radius 8px) with an inline SVG (24x24)
- Title (h3, 16px, font-weight 700, #1a1a1a) — data-type="text"
- Description (p, 14px, #666, line-height 1.5) — data-type="text"

Card 1: Purple icon container (#f3f0ff bg, #5e2dc6 color), cross/compass SVG. data-ai-id="el-learn-card-1". Title: "Physiology of Trauma" (el-learn-h-1). Desc: "Understand nervous system dysregulation, survival responses, and polyvagal theory." (el-learn-p-1)

Card 2: Indigo icon container (#eef2ff bg, #4f46e5 color), shield SVG. data-ai-id="el-learn-card-2". Title: "Somatic Tracking" (el-learn-h-2). Desc: "Learn techniques to help clients safely track and discharge trapped survival energy." (el-learn-p-2)

Card 3: Green icon container (#ecfdf5 bg, #10b981 color), medical-cross SVG. data-ai-id="el-learn-card-3". Title: "Resourcing Skills" (el-learn-h-3). Desc: "Build client capacity and resilience before attempting trauma reprocessing." (el-learn-p-3)

Card 4: Teal icon container (#f0fdfa bg, #0d9488 color), people/users SVG. data-ai-id="el-learn-card-4". Title: "Clinical Integration" (el-learn-h-4). Desc: "Seamlessly blend somatic approaches into your existing therapeutic modality." (el-learn-p-4)

--- SUB-SECTION 2: 10-Day Curriculum ---

Use native HTML <details>/<summary> elements for the accordion (no JS, no Alpine). CSS-only open/close with chevron rotation.

Outer container: class "curriculum-list", flex column, gap 12px, max-width 780px.

Each day is a <details class="curr-item"> element. First day has open attribute. Each contains:
- <summary class="curr-header">: flex row with:
  - Day badge (span, 10px font, 800 weight, uppercase, #5e2dc6 on rgba(94,45,198,0.1) bg, 4px border-radius, switches to white-on-purple when [open])
  - Title (span, 15px, 600 weight, #1a1a1a, switches to #5e2dc6 when [open])
  - Chevron SVG (rotates 180deg when [open], transitions 0.3s)
- <div class="curr-body">: border-top #f3f4f6, padding 0 20px 18px, bg rgba(249,250,251,0.6)
  - Description paragraph (14px, #6b7280)
  - Meta row: flex, space-between. Left: play-circle SVG (#8b5cf6) + "Video Modules & Readings" (13px, 700 weight). Right: clock SVG + duration in a pill (12px, 600 weight, #6b7280, white bg, 1px #e5e7eb border, border-radius 999px)

The 10 days with their data:
Day 1: "Foundations of Somatic Experiencing" — "Introduction to the core principles of somatic therapy, history, and neurobiology." — 2 Hrs
Day 2: "The Polyvagal Theory in Practice" — "Deep dive into the autonomic nervous system and its role in trauma recovery." — 2.5 Hrs
Day 3: "Building Safety & Resourcing" — "Establishing internal and external resources for stabilization." — 3 Hrs
Day 4: "Tracking the Nervous System" — "Developing somatic awareness and identifying activation patterns." — 2 Hrs
Day 5: "Titration & Pendulation" — "Mastering the core SE techniques for safe trauma processing." — 3 Hrs
Day 6: "Working with the Fight/Flight Response" — "Techniques for discharging high-intensity survival energy." — 2.5 Hrs
Day 7: "Thawing the Freeze Response" — "Safely navigating the dorsal vagal state and immobilization." — 3.5 Hrs
Day 8: "Attachment and Developmental Trauma" — "Integrating somatic work with relational and early-life trauma." — 2 Hrs
Day 9: "Touch and Boundaries in Practice" — "Ethical considerations and somatic boundary-building techniques." — 2 Hrs
Day 10: "Clinical Integration & Case Studies" — "Applying SE principles to complex clinical cases and final review." — 1.5 Hrs

--- SUB-SECTION 3: Meet Your Instructors ---

Section heading with icon-circle containing a users/people SVG, then text "Meet Your Instructors" — same style as learn heading. data-ai-id="el-inst-title", data-type="text".

2-column grid (gap 30px, single column below 640px). Each instructor card: background #f8f9fa, padding 32px 24px, border-radius 16px, text-align center, flex column.

Each card has:
- Circular image wrapper (100px, border-radius 50%, 4px white border, box-shadow). Image inside: object-fit cover. Image gets data-type="image".
- Name: h3, 18px, 700 weight, #1a1a1a — data-type="text"
- Credential: p, 11px, 800 weight, uppercase, #5e2dc6, letter-spacing 1px — data-type="text"
- Bio: p, 13px, #666, line-height 1.6, margin-bottom 24px — data-type="text"
- Quote card: white bg, 16px padding, 12px border-radius. Italic quote, 13px, #1a1a1a — data-type="text"

Instructor 1 (data-ai-id="el-inst-card-1"):
- Image: el-img-1, src="https://images.unsplash.com/photo-1742436707321-33fed05590bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjAyNzJ8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdCUyMHNtaWxpbmd8ZW58MHwyfHx8MTc3MzY3OTU3MHww&ixlib=rb-4.1.0&q=80&w=1080"
- Name (el-inst-name-1): "Dr. Sarah Jenks"
- Credential (el-inst-t-1): "PH.D., SEP, LPC"
- Bio (el-inst-b-1): "Dr. Jenks is a leading expert in somatic experiencing and trauma resolution with over 15 years of clinical practice. She has trained thousands of professionals worldwide to safely work with the autonomic nervous system."
- Quote (el-inst-qt-1): "My goal is to bridge the gap between cognitive understanding and bodily experience for profound, lasting holistic healing."

Instructor 2 (data-ai-id="el-inst-card-2"):
- Image: el-img-2, src="https://images.unsplash.com/photo-1752070339136-ee8d6559e698?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjAyNzJ8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDB8Mnx8fDE3NzM2Nzk1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
- Name (el-inst-name-2): "Dr. James Okafor"
- Credential (el-inst-t-2): "M.D., PSYCHIATRIST"
- Bio (el-inst-b-2): "Dual-board certified in psychiatry and addiction medicine, Dr. Okafor specializes in the physiological manifestations of complex PTSD and treatment-resistant mood disorders."
- Quote (el-inst-qt-2): "We must look beyond the symptom to the system. Understanding neurobiology is the key to unlocking true resilience."

=== RIGHT COLUMN: PRICING SIDEBAR ===

Outer aside: class "sidebar", data-ai-id="el-sidebar". position: sticky; top: 40px on desktop. On tablet/mobile (below 992px): order: -1, position: static.

Pricing card (data-ai-id="el-pricing-card"): white bg, 16px border-radius, 32px padding, box-shadow 0 10px 40px rgba(0,0,0,0.08), border 1px solid #f0f0f0, text-align center.

Inside the card:
- Price row: flex, center, gap 8px. Current price "$999" (36px, 800 weight, #1a1a1a, data-ai-id="el-curr-p") + original price "$1000" (18px, #999, line-through, data-ai-id="el-orig-p")
- Offer badge "LIMITED TIME OFFER" (10px, 800 weight, #10b981, letter-spacing 1px, data-ai-id="el-offer-b", data-type="text")
- Buy button: full width, #5e2dc6 bg, white text, 16px padding, 8px border-radius, 16px font, 700 weight. Text: "Buy now for $999". Attributes: data-ai-id="el-enroll-btn", data-cta-type="plan_buy_now", id="plan-buy-button". Hover: #4a20a1.
- Guarantee text: "30-Day Money-Back Guarantee" (11px, #666, data-ai-id="el-guarantee", data-type="text")
- "THIS COURSE INCLUDES:" header (11px, 800 weight, #1a1a1a, data-ai-id="el-inc-title", data-type="text")
- 5 list items, each with an inline SVG icon (16px, #5e2dc6) + text (13px, #444). Items:
  1. Monitor SVG — "24 hours on-demand video" (el-li-1)
  2. Document SVG — "15 downloadable resources" (el-li-2)
  3. Shield SVG — "Full lifetime access" (el-li-3)
  4. Smartphone SVG — "Access on mobile and TV" (el-li-4)
  5. Trophy SVG — "Certificate of completion" (el-li-5)

=== RESPONSIVE BREAKPOINTS ===
- Desktop (992px+): 2-column grid, sidebar sticky
- Tablet (below 992px): single column, sidebar stacks to top (order: -1), position static
- Mobile (below 640px): learning grid + instructor grid collapse to single column, block-title shrinks to 20px

=== TECHNICAL REQUIREMENTS ===
- Section: <section data-ai-id="sec-p9k2m4x7" id="sec-p9k2m4x7">
- Style tag AFTER </section>: <style data-ai-id="stl-p9k2m4x7" id="stl-p9k2m4x7">
- All CSS scoped under #sec-p9k2m4x7
- Zero Tailwind, zero Alpine.js, zero Material Icons
- All icons are inline SVGs
- <details>/<summary> for curriculum accordion (pure HTML)
- The curriculum <style> for .curr-* classes must be INSIDE the main <style data-ai-id="stl-p9k2m4x7"> tag, NOT in a separate embedded <style>
- The broken ".pricing-card sticky { position: fixed }" rule must NOT be included — use proper ".pricing-card.sticky" if needed
```

---

## Sections NOT Being Converted (Keep As-Is)

| Section | Why |
|---------|-----|
| `sec-topbar` (Header) | Already customized with logo fix. Works. |
| `sec-foot1` (Footer) | Already styled. No changes needed. |
| `sec-graphy-footer` | Graphy branding. Cannot be removed. |

---

## Execution Checklist

- [x] **Step 1**: Convert Course Hero (`sec-crsh10`) — ✅ Done via AI prompt
- [ ] **Step 2**: Convert Main Content (`sec-p9k2m4x7`) — Use prompt above in Graphy's AI chat
- [ ] **Step 3**: Verify pricing button works — click "Buy now" and confirm Graphy's checkout flow triggers
- [ ] **Step 4**: Test responsiveness — check mobile, tablet, desktop
- [ ] **Step 5**: Swap placeholder images for real ones via Graphy's visual editor (click image → upload)

---

## How to Use These Prompts

1. Open the course page in Graphy's editor
2. Click on the section you want to replace (e.g., click anywhere in the content area)
3. Open the **AI chat** (not the Code editor tab!)
4. Paste the full prompt
5. Wait for generation
6. Preview the result
7. If you need tweaks, type them in the AI chat (e.g., "make the heading font larger", "change the card background color")

**DO NOT use the Code editor tab** — it will crash with "something went wrong" on custom sections. This is a Graphy platform limitation, not a bug in our code.

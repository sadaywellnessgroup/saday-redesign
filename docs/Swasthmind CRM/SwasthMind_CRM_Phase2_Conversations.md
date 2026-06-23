# SwasthMind CRM — Phase 2 Module Scan: Conversations
**Scanned:** 2026-04-19 | **Tenant:** Production (Saday Wellness Group) | **Role:** Admin | **URL:** /my-conversations

---

## SITEMAP

| Module | Sub-module | URL | Notes |
|---|---|---|---|
| Conversations | Users Chats (list) | /my-conversations | Primary view; 67 total records |
| Conversations | Conversation Details | /conversations/{phone}/show | Per-record detail: Id, Origin, First/Last Interaction |
| Conversations | Chat History | /conversations/{phone}/show → View Conversation | Modal overlay; full WhatsApp bot transcript |
| Conversations | Conversation Analysis | /my-conversations → ⓘ icon | Modal overlay; AI-generated analysis per conversation |

---

## SCREENS

| Screen ID | Name | URL | Description | Screenshot Ref |
|---|---|---|---|---|
| CONV-01 | Users Chats — List | /my-conversations | Paginated table of all WhatsApp bot conversations; 67 records, 8/page (9 pages); Analysis Category filter; download export; sortable columns | ss_76635q6q0 |
| CONV-02 | Conversation Details | /conversations/{phone}/show | Read-only card; Id (phone number), Origin (WhatsApp), First Interaction datetime, Last Interaction datetime; "View Conversation" button | ss_4614ggs6l |
| CONV-03 | Chat History | /conversations/{phone}/show → View Conversation | Full WhatsApp transcript modal; user messages on right (dark green), bot system events on left (light grey); date dividers; no reply / compose capability for admin | ss_3635gwsl9 |
| CONV-04 | Conversation Analysis | /my-conversations → ⓘ icon per row | AI analysis modal; Category badge, Urgency Level (1–5 scale), AI-generated Summary text, Key Themes (tag chips) | ss_35921jwav |

---

## FEATURES

| Feature ID | Name | Screen | Description | Trigger | Destructive? |
|---|---|---|---|---|---|
| CONV-F01 | Conversations list | CONV-01 | Paginated table listing all WhatsApp bot conversations sorted by Last Interaction descending by default | Nav click | No |
| CONV-F02 | Sort by Name | CONV-01 | Click column header to sort ascending | Click sort button | No |
| CONV-F03 | Sort by Phone Number | CONV-01 | Click column header to sort; current default sort | Click sort button | No |
| CONV-F04 | Sort by Last Interaction | CONV-01 | Click column header to sort ascending | Click sort button | No |
| CONV-F05 | Sort by Show | CONV-01 | Click column header to sort ascending | Click sort button | No |
| CONV-F06 | Analysis Category filter | CONV-01 | Dropdown filter to narrow list by AI-assigned category; 5 options + All | Dropdown select | No |
| CONV-F07 | Export conversations | CONV-01 | Download icon (⬇) in top-right of table; likely CSV/Excel export of filtered list | Click download icon | No (download) |
| CONV-F08 | Conversation rows pagination | CONV-01 | Rows-per-page selector (default 8); next/prev page buttons; page number jump | Pagination controls | No |
| CONV-F09 | View Conversation Details | CONV-01 → CONV-02 | Eye icon (👁) on each row navigates to Conversation Details screen | Click eye icon | No |
| CONV-F10 | View Chat History | CONV-02 → CONV-03 | "View Conversation" button on detail screen opens Chat History modal | Click button | No |
| CONV-F11 | Chat transcript read-only | CONV-03 | Full scrollable WhatsApp message thread; admin view only; no compose / reply capability | Read-only | No |
| CONV-F12 | Bot event system messages | CONV-03 | Inline system event labels appear in chat (e.g., "Appointment flow initiated", "Main menu provided", "Company information flow sent") | Auto-rendered | No |
| CONV-F13 | Conversational Tag badge | CONV-01 | Per-row AI-assigned category badge with color coding; reflects AI analysis result | Auto-assigned | No |
| CONV-F14 | Summarise button | CONV-01 | Per-row "Summarise" button; likely triggers or refreshes AI analysis for that conversation | Click button | No (AI trigger) |
| CONV-F15 | Conversation Analysis modal | CONV-01 → CONV-04 | ⓘ info icon per row opens detailed AI analysis popup | Click ⓘ icon | No |
| CONV-F16 | AI Category assignment | CONV-04 | Displays auto-assigned conversation category with color-coded dot | Auto-assigned | No |
| CONV-F17 | Urgency Level scoring | CONV-04 | 5-point urgency scale (shown as progress bar + numeric e.g. "1/5") | Auto-assigned | No |
| CONV-F18 | AI Summary | CONV-04 | Paragraph-form AI-generated summary of conversation content | Auto-generated | No |
| CONV-F19 | Key Themes tags | CONV-04 | Multiple chip tags extracted by AI (e.g., "appointment booking", "platform inquiry", "information request") | Auto-generated | No |

---

## DATA-FIELDS

| Field ID | Name | Screen | Type | Required | Notes |
|---|---|---|---|---|---|
| CONV-D01 | Name | CONV-01 list | Display text | — | [REDACTED in prod] — user's display name; "Unknown" if not identified |
| CONV-D02 | Phone Number | CONV-01 list | Display text | — | [REDACTED in prod] — format: country code + number (e.g., 91XXXXXXXXXX) |
| CONV-D03 | Last Interaction | CONV-01 list | Datetime display | — | DD-MM-YYYY HH:MM AM/PM format |
| CONV-D04 | Conversational Tag | CONV-01 list | Badge / enum | — | AI-assigned category; 5 possible values (see dropdown options below) |
| CONV-D05 | Analysis Category | CONV-01 filter | Dropdown enum | No | Filter only; values: All Categories, 🔴 Therapy Potential, 🟠 Emotional Distress, 🔵 Information / Exploration, ⚪ Transactional / Admin, 🟣 SOS |
| CONV-D06 | Id | CONV-02 | Display text | — | Phone number used as conversation identifier |
| CONV-D07 | Origin | CONV-02 | Display text | — | Channel of origin; observed value: "WhatsApp" (possibly others) |
| CONV-D08 | First Interaction | CONV-02 | Datetime display | — | Timestamp of first message in conversation; DD-Mon-YYYY HH:MM PM format |
| CONV-D09 | Last Interaction | CONV-02 | Datetime display | — | Timestamp of most recent message |
| CONV-D10 | Message (user) | CONV-03 | Chat bubble (right, dark green) | — | [REDACTED in prod] — user's WhatsApp message text |
| CONV-D11 | Bot event label | CONV-03 | Chat bubble (left, light grey) | — | System event strings; observed: "Appointment flow initiated", "Main menu provided", "Company information flow sent" |
| CONV-D12 | Chat date divider | CONV-03 | Date label | — | DD-MM-YYYY format; groups messages by calendar day |
| CONV-D13 | Category (Analysis) | CONV-04 | Badge / enum | — | Matches Conversational Tag; color-coded dot + text |
| CONV-D14 | Urgency Level | CONV-04 | Numeric + progress bar | — | Scale 1–5; visualized as filled dots/segments |
| CONV-D15 | Summary (Analysis) | CONV-04 | Long text / paragraph | — | [REDACTED in prod — PHI may appear] — AI-written summary of conversation intent and emotional state |
| CONV-D16 | Key Themes | CONV-04 | Tag chips (array of strings) | — | AI-extracted themes; e.g., "appointment booking", "platform inquiry", "information request" |

---

## FLOWS

| Flow ID | Name | Steps | Notes |
|---|---|---|---|
| CONV-FL01 | View conversation transcript | 1. List → click 👁 eye icon → Conversation Details. 2. Click "View Conversation" → Chat History modal. 3. Scroll transcript. 4. Close modal → back to Details. 5. Click ← back → return to list. | Read-only; no admin reply/compose capability observed |
| CONV-FL02 | Analyse conversation | 1. List → click ⓘ icon → Conversation Analysis modal. 2. Review Category, Urgency Level, Summary, Key Themes. 3. Click Close. | Triggered by per-row ⓘ icon; "Summarise" button appears to refresh/trigger analysis |
| CONV-FL03 | Filter by category | 1. Click Analysis Category dropdown. 2. Select category (e.g., "SOS"). 3. Table refilters to matching conversations. | Stateless filter; no save |

---

## PERMISSIONS

| Role | Can View List | Can View Transcript | Can View Analysis | Can Export | Notes |
|---|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes (download icon) | Full access observed |
| Other roles | Unknown | Unknown | Unknown | Unknown | RBAC from Phase 1 shows Conversations in module matrix; per-role detail not verified in this scan |

---

## INTEGRATIONS

| Integration | Direction | Detail |
|---|---|---|
| WhatsApp Business API | Inbound | Conversations originate from WhatsApp bot; all observed conversations have Origin = "WhatsApp" |
| AI / LLM Analysis Engine | Internal | Automated per-conversation: category classification (5 categories), urgency scoring (1–5), natural-language summary, key theme extraction; "Summarise" button likely triggers re-analysis on demand |

---

## COMPLIANCE

| Item | Detail |
|---|---|
| PHI present | Yes — phone numbers, names, and chat content are visible in production; prod tenant confirmed; all values redacted in this report |
| Data retention | Not visible in UI; conversations stored indefinitely as observed |
| Export capability | CSV/Excel download available via ⬇ icon (confirmation needed) |
| No send/compose capability | Admins cannot reply to WhatsApp conversations from this screen — read-only view only |

---

## DATA-MODEL

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| Conversation | id (phone), origin, first_interaction, last_interaction, name | Has many Messages; has one ConversationAnalysis | Indexed/identified by phone number |
| Message | direction (inbound/outbound), content, timestamp, type (user_message / bot_event) | Belongs to Conversation | Bot events are a distinct message type |
| ConversationAnalysis | category (enum 5 values), urgency_level (int 1–5), summary (text), key_themes (array) | Belongs to Conversation (1:1) | AI-generated; updatable via "Summarise" button |

---

## KEY FINDINGS & ANOMALIES

| # | Finding | Implication |
|---|---|---|
| 1 | 67 total conversations in production as of scan date | Active WhatsApp bot with real user traffic |
| 2 | All observed conversations have Origin = "WhatsApp"; web bot origin not confirmed in this screen | Web bot conversations may exist or may use same channel ID |
| 3 | AI analysis includes urgency scoring (SOS category + 1–5 scale) — strong triage capability | Clinically significant: SOS conversations can be surfaced for immediate intervention |
| 4 | Admin cannot reply to conversations from CRM — read-only view only | Gap: No agent-to-user WhatsApp messaging from CRM; all responses handled by bot |
| 5 | "Summarise" button visible per row — appears to trigger on-demand AI re-analysis | Suggests AI analysis may not auto-run on all conversations, or admins can refresh stale analyses |
| 6 | Duplicate-name rows visible (same name, same number, different rows) | Possible multi-session grouping issue or contact identification bug |
| 7 | "Unknown" name for some contacts | Bot captures phone but may not have collected name yet (early funnel stage) |

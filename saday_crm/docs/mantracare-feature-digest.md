# MantraCare Provider Portal — Feature Digest
Planning input only. Visual/design details ignored.

## 1. Appointments
- Add flow: launcher modal "What do you want to do?" → **Appointments** (book future) or **Log past session**; then a "Choose Client" search-select modal, "Continue" disabled until picked.
- List page: search by client/service, "Filter" button, "All Clients" scope dropdown.
- Status tabs with live counts: **Upcoming / Done / Pending / All**, plus a collapsible "Past Appointments" section. No populated row/column layout captured (list was empty in all screenshots).

## 2. Availability
- Weekly recurring grid: one row per weekday (Mon–Sat seen), each row holds one or more time ranges (e.g. 9–1 PM) with per-range delete; "Add Time Slots" appends more.
- Exceptions live in a separate "Day Off" table: **Date / Duration / Repeat Every Year**, "Add Day Off" — one-off or annually-recurring, independent of the weekly grid.
- A third screen offers Google Calendar sync (OAuth) with an explicit privacy line ("we'll only sync appointment times").
- No buffer-time-between-sessions field observed.

## 3. Clients
- Add Client fields: **Service*** (dropdown), **First/Last Name**, **Contact** (Email or Phone, at least one required; phone has country-code selector, default +91), a **"Detailed view"** toggle, and "add Multiple?" link for bulk add.
- List columns: Client Name (avatar), **Onboarding** (Joined/Expired/Invite Sent/Not Sent, resend icon), **Status** (Active/Inactive/Archived/Switched/Prospective, inline dropdown), Actions (view/message/edit).
- Filters: search by name/email, Onboarding dropdown, Status dropdown; pagination with rows-per-page.

## 4. Notes
- "Session Note" wizard: Language + Template selectors. Template fields: Cognitive Functioning, Affect, Functioning Status/Symptoms/Impairments, **Risk Factors** (all dropdowns/text), Medications (textarea), Interventions, Treatment Plan, Attachments (file upload, 10MB), Recommendation. Cancel / Save Note.
- Side panel "AI Assistance — Transcript & Note Generator" (Transcript/Noteworthy tabs, "Add Transcript") generates notes from a session transcript.
- Session detail view: client, role, date/time, duration, delivery-mode badge; tabs **Session Notes (count) / Transcripts**, each with empty state + add action.
- A "Sessions" list (same status tabs) shows per-session cards linking to "manage session," plus "Create Offline Session."
- No sign-off/lock state or note-type selector beyond template choice was observed.

## 5. Forms
- A "Form" is a reusable questionnaire scoped to a provider/service type, with tabs **Forms / Archived / Entries / Required Forms**.
- List columns: ID, Title, Services, Type (TEMPLATE), Entries (submission count), Actions (share/preview/email/duplicate). "Create a New Form" button.
- Preview example ("Insurance info"): Insurance Company*, Member ID*, Group/Plan ID, Policy Holder Name, Relationship to Policy Holder, Insurance Card Front*/Back* (uploads), required consent checkbox, Signature*, Date.
- No direct client-assignment UI captured; share/email icons imply forms are sent out rather than assigned in-app.

## 6. Billing / Invoice / Earnings
- **Billing** hub: Bills / Insurance tabs. Bills tab: "Create Bill," search, "Unbilled Sessions" shortcut, status chips **All / Client Owes / Pending / Draft** with counts.
- **Unbilled Sessions**: checkbox list of completed-but-uninvoiced sessions (Date of Service / Client / Service), "Create Bill."
- **Invoice creation** starts with a "Select Client" modal.
- **Earnings** (separate nav item): tracks session earnings/payouts; empty state pushes "Invite your Clients" or "Become a Preferred Provider," plus a prompt to add Bank & Tax details for payouts.
- No populated invoice with line items, totals, or tax breakdown was captured.

## 7. Messages
- Simple 1:1 chat list, **Active / Inactive** tabs, conversation search. Empty state only ("No chats yet"); no visible provider-side "start new chat" or attachment control.

## 8. Settings
- Sidebar: Availability, Practice Details, Team/Providers, Notifications, Subscription. **Practice Details, Team/Providers, and Notifications are all "Coming Soon" placeholders** — no toggles implemented yet.

## 9. Tasks
- A gamified, platform-authored checklist ("track daily wellness tasks & earn points"), not authored by provider or client. Shows Activity Stats (done count, progress like "1/12," points total), a mixed list of clinical-onboarding and growth/upsell items (profile verification, "What is a Premium Provider?," marketing videos) each tagged Video/To-do with duration + points, and a completed-items log.

## 10. Assessments
- **GAD-7 (verbatim)**: supportive intro copy, 7 required items, each scored **Not At All / Several Days / More Than Half the Days / Nearly Everyday**.
- **PHQ-style screener**: 5-band gauge — 0–4 none-low, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe. Every band, including "none-low," returns identical templated copy ending in a therapist-booking CTA — the CTA does not vary by severity.

## 11. Worth adopting for Saday
- Two-path launcher ("Book" vs "Log past session") keeps the add-appointment form short — `appointments__add-1__ss_34846ve4t.png`
- Client-picker as its own modal step before appointment details — `appointments__add-2__ss_0209nk2wk.png`
- Weekly recurring slots kept separate from a one-off/annual "Day Off" exceptions table — `availability__3__ss_0882usf05.png`
- Calendar sync screen states a plain-language privacy scope ("only sync appointment times") — `availability__2__ss_7667fngvf.png`
- Client contact requires only email OR phone, not both — `clients__add-modal-1__ss_7610g8s9f.png`
- Onboarding status (Joined/Invite Sent/etc.) tracked separately from clinical Status (Active/Prospective/etc.) — `clients__list__ss_0378c3i4v.png`
- Session-note template fields sit beside an AI transcript-to-note assist panel — `notes__add-wizard__ss_7174hz6i8.png`
- "Unbilled Sessions" view catches completed sessions before they're invoiced — `billing__hub-2__ss_1116zyhr3.png`
- Forms library separates reusable Templates from per-client Entries with share/preview/duplicate actions — `forms__list__ss_75686oskf.png`
- Earnings empty-state nudges bank/tax setup before the provider's first payout — `earnings__ss_0066i24h5.png`

## 12. Do not copy
- Same "schedule an appointment" CTA fires for every PHQ severity band, even "none-low" — clinically misleading; gate the therapist-referral CTA to real thresholds — `depression__every-band-books__EXTRA.png`
- Practice Details, Team/Providers, and Notifications settings shipped as empty "Coming Soon" stubs — `settings__practice__ss_5614cd3dg.png`
- Messages has no visible provider-initiated "new conversation" path — `messages__ss_9513itupa.png`
- Clinical onboarding tasks and monetization upsells (Premium, Marketing) are mixed into one points-based task queue — `tasks__ss_3331g6bq8.png`
- No visible finalize/lock state on session notes — they appear indefinitely editable — `notes__editor-2__ss_1652tjxyf.png`

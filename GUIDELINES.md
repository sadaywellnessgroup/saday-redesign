# Saday Wellness — Master Operational Guidelines (v2.0)

## 1. Project Vision & Workflow
Saday is a **clinical-grade** mental health ecosystem. The workflow is divided into four distinct loops:
1. **The Intake Loop:** Language Selection → Proxy/Self Branch → Symptom Clusters → Adaptive Tools → Safety Screen → Junior Counsellor Triage.
2. **The Consultation Loop:** MHP Dashboard → Informant Linking → Session Notes (SOAP) → Material Dispatch.
3. **The Data Loop:** Longitudinal Assessments (Weeks 0, 2, 4, 8, 12) → Outcome Visualization.
4. **The Informant Loop:** Caregiver Invitation → Weekly Observation Submissions (L1) → Collateral Attendance (L2).

---

## 2. Developer Guidelines (CTO/Backend)
### Tech Stack
- **Database:** PostgreSQL (Supabase) with RLS.
- **Video:** Daily.co.
- **Messaging:** MSG91 (WhatsApp Business API).
- **Hosting:** Mumbai Region (Data Residency).

### Database Schema Requirements (P0)
- **`linked_accounts`**: Must support L1 (read-only observer) and L2 (session participant) permissions.
- **`material_vault`**: Centralized storage with a `material_access_logs` table to track patient engagement.
- **`episodes_of_care`**: All clinical records must be grouped by an "Episode," not just a patient ID, to allow for treatment-history clarity.

### Security Non-Negotiables
- **RLS (Row Level Security):** Ensure an Informant's `UserID` can never query `clinical_notes` table unless the session is flagged as `collateral`.
- **Audit Logging:** Every read of a patient's note must log the `ActorID` and `Timestamp`.

---

## 3. Designer Guidelines (UX/UI)
### The "Adaptive Intake"
- **Mobile-First:** Target 360px width.
- **One Question at a Time:** Minimize cognitive load.
- **Escalation UI:** If a "Red Flag" is selected (Psychosis/Withdrawal), the UI must instantly change to a "Safety Resource" screen with a "Call Me Now" button.

### Material Vault UI
- **Patient Side:** A "Toolkit" tab where assigned PDFs are displayed with "Mark as Read" functionality.
- **MHP Side:** A "Dispatch" interface with a searchable list of PDFs (e.g., "CBT Thought Record", "Deep Breathing Guide").

---

## 4. Clinical Guidelines (Psychologists/Psychiatrists)
### The 5-Track Model
1. **Wellness:** Low-intensity, Master's level counsellors.
2. **Standard:** Clinical Psychologists, PHQ/GAD focused.
3. **Complex:** BPD/Bipolar, Informant-heavy, DBT protocols.
4. **Supported:** Schizophrenia/Dementia, L3 Caregiver management.
5. **Referral:** Acute risk, hard-redirect to in-person hospitals.

### Tool Library Management
- **Source of Truth:** Use only validated Hindi/English versions from `docs/assessment_tools`.
- **Informant Assessment:** L1 Observers should only be asked about **observable behaviors** (e.g., "Did they sleep more than 6 hours?"), not internal states (e.g., "How sad were they?").

---

## 5. AI Agent Prompting Guidelines
### For Intake Analysis Agent
"You are a Clinical Triage Agent. Analyze the following Symptom Clusters and Assessment Scores. Recommend one of the 5 Saday Care Tracks. If any safety flags are present, prioritize 'Track 5' or 'Immediate Senior Review'."

### For Note Drafting Agent
"You are a Clinical Scribe. Summarize this patient's intake submission into a 'Chief Complaint' and 'History of Presenting Illness' section for the MHP. Maintain clinical neutrality."

---

## 6. Improvisations from Competitive Scan
- **From Swasthmind:** Adopt the "WhatsApp AI Triage" but improve it by allowing the Admin to **reply from the CRM**.
- **From Tealfeed:** Adopt the "Form Builder" logic to allow MHPs to create custom homework/materials, but store them in the **Centralized Vault** rather than ad-hoc uploads.

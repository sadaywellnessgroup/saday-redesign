# Saday Wellness: Comprehensive Deep Audit & Action Plan

## 1. Deep Audit & Critique of Internal Data

### 1.1 Swasthmind CRM Audit (The Clinical Baseline)
**Analysis:** Swasthmind was built to be a clinical CRM but failed on execution basics. It successfully maps out necessary modules (My Schedule, Upcoming Sessions, Manual Bookings, AI WhatsApp Triage) but fails to secure or interlink them properly.
- **Strengths:** Established WhatsApp conversational log with AI urgency scoring. Recognizes the need for distinct user roles (Branch Admin, Receptionist, Accountant).
- **Critical Failures:**
  - *Security Vulnerabilities:* JWT tokens stored in `sessionStorage` (XSS vulnerability), zero Multi-Factor Authentication (MFA) for admins/MHPs. For a PHI-handling system, this is catastrophic.
  - *Clinical Flow Blindspots:* Completely static "Notes" tab. No embedded session history, no treatment plan versions. The SOS urgency category (Level 5) lacks automated on-call escalation, relying on human oversight.
  - *Data Architecture Bugs:* "My Therapists" list was observed to be empty despite therapists appearing in booking dropdowns, indicating a fractured `User` vs. `Therapist` table relationship.

### 1.2 Tealfeed Scanner Audit (The Marketplace Engine)
**Analysis:** Tealfeed is an operationally heavy, highly scalable e-commerce infrastructure disguised as a booking system. 
- **Strengths:** Phenomenal infrastructure for Bundles, Event Management, Coupon/Discount tracking, Withdrawals history, and Segment Analysis. Its "Form Builder" library is incredibly robust, allowing custom form generation dynamically.
- **Critical Failures:**
  - *Accessibility Disaster:* Across the 45 screens audited, almost all failed WCAG AA body text contrast ratios. Hundreds of missing input labels were flagged.
  - *Clinical Mismatch:* Tealfeed treats all services as "products." It lacks the nuanced clinical depth required for mental health—there is no longitudinal outcome tracking, no informant/collateral loop, and no adaptive clinical triage.

### 1.3 Critique of Our Previous Strategy vs. Real Data
- **The Missing UI Standard:** Our previous blueprint missed a crucial finding from the Tealfeed audit: **accessibility**. Our target demographic includes geriatric patients (Track 4) and highly stressed individuals. Poor contrast and missing labels are industry standards of failure; Saday must enforce strict WCAG AA compliance natively.
- **Underutilizing Tealfeed's Form Builder:** While we rightly discarded Tealfeed's pure marketplace elements, we overlooked its dynamic **Form Builder**. Instead of just a "Material Vault" with static PDFs, Saday should adopt a dynamic Form Builder allowing MHPs to create custom Cognitive Behavioral Therapy (CBT) check-ins or symptom logs that map directly into our database.
- **The AI Triage Gap:** Swasthmind's AI categorization processes raw PHI without a clear Data Processing Agreement (DPA). Our plan must enforce that any LLM interaction (e.g., Anthropic/Claude) only processes de-identified cluster data, never direct PII.

---

## 2. Layered Plan of Action

We are shifting from a static feature list to a layered, chronological execution plan. Each layer builds the prerequisite trust and infrastructure for the next.

### Layer 1: The Trust Foundation (Security, Compliance & Accessibility)
*Before writing clinical logic, the system must be impenetrable and accessible.*
- **Action 1.1 [Security]:** Implement Supabase Auth enforcing HttpOnly cookies. Mandate TOTP 2FA for all MHP and Admin roles. (Mitigates Swasthmind SEC-01 & SEC-04).
- **Action 1.2 [Compliance]:** Enforce DPDP-compliant data residency (AWS/Supabase Mumbai `ap-south-1`). Implement an immutable `audit_log` table that records every read/write of a patient record.
- **Action 1.3 [Accessibility]:** Enforce a strict design system passing WCAG AA (4.5:1) contrast ratios. All form inputs must have semantic HTML labels. Build for 360px mobile width first.

### Layer 2: Core Architecture & Data Schema
*Fixing the fractured schemas seen in competitor platforms.*
- **Action 2.1 [Single Source of Truth]:** Unify User & MHP schemas utilizing proper Foreign Keys. Ensure no duplicate identities exist (Fixes Swasthmind DM-09).
- **Action 2.2 [The Informant Matrix]:** Build the `linked_accounts` architecture. Implement strict PostgreSQL Row Level Security (RLS) ensuring L1 (Observer), L2 (Collateral), and L3 (Guardian) roles can only access data explicitly linked via `episode_of_care_id`.
- **Action 2.3 [Financial Resilience]:** Implement Webhook retry queues and manual daily reconciliation views for Razorpay to prevent dropped payment confirmations.

### Layer 3: Adaptive Intake & The Clinical Front Door
*Replacing the static form with a conversational state machine.*
- **Action 3.1 [Symptom Clustering]:** Build the 7-screen intake UI using plain-language clusters ("I've been having memory problems") instead of clinical terms ("Dementia screen").
- **Action 3.2 [Red Flag Escalation]:** Develop the automated safety intercept. If Psychosis, Suicide risk, or active substance withdrawal is selected, the system bypasses booking, hard-redirects to a "Safety Resource" screen, and fires a WhatsApp alert to the On-Call Senior Clinician.
- **Action 3.3 [Dynamic Tool Routing]:** Integrate the 30-tool validated library (PHQ-9, GAD-7, MoCA, etc.). The backend routing engine dictates which tool fires based on the user's age, proxy status, and symptom clusters.

### Layer 4: The Consultation Engine & Dynamic Forms
*Empowering the MHP.*
- **Action 4.1 [Expert Dashboards]:** Develop the MHP Dashboard focusing on clinical utilization, upcoming collateral interviews, and revenue tracking (leveraging Tealfeed's UX flow for Expert Analytics).
- **Action 4.2 [MHP Form Builder]:** Adapt Tealfeed's Form Builder concept. Allow psychologists to drag-and-drop custom CBT thought records or daily mood logs, dispatching them dynamically to the patient's portal.
- **Action 4.3 [Clinical Documentation]:** Build the SOAP notes module. Notes must be digitally signed, version-controlled, and tied to an `episode_of_care` to ensure historical accuracy.

### Layer 5: The Clinical Moat (Longitudinal Tracking & The Informant Loop)
*Where Saday outpaces the market.*
- **Action 5.1 [Material & Homework Vault]:** Launch the centralized Patient Vault. Track `view_events` to give MHPs insight into patient compliance with assigned reading/exercises.
- **Action 5.2 [Outcome Visualization]:** Implement longitudinal charting in the MHP view. MHPs must see a visual graph of a patient's assessment scores (e.g., PHQ-9) across weeks 0, 2, 4, 8, and 12 to objectively measure treatment efficacy.
- **Action 5.3 [Informant Activation]:** Launch the L1 Informant passive tracking loop. Caregivers receive automated weekly WhatsApp prompts to submit structured observation data (e.g., sleep hours, mood volatility), which directly feeds into the MHP's pre-session dashboard.

---
**Verdict:** By mapping Swasthmind’s clinical failures and Tealfeed’s infrastructural strengths, Saday Wellness avoids the pitfalls of a standard booking app. This layered plan ensures we launch a clinically defensible, highly accessible, and secure digital ecosystem within the 6-month target window.
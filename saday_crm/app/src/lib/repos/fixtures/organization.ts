import type { Organization, OrganizationPolicies } from '@/lib/domain';
import { FIXTURE_NOW } from './time';

const NOW = FIXTURE_NOW.toISOString();

export const ORG_ID = 'org_saday';

export const organization: Organization = {
  id: ORG_ID,
  name: 'Saday Wellness',
  slug: 'saday-wellness',
  whatsappNumber: '+919235293990',
  supportEmail: 'sadaywellnessgroup@gmail.com',
  razorpayAccountId: null, // FIXTURE — Razorpay behind adapter, no real account in P1
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
};

export const organizationPolicies: OrganizationPolicies = {
  id: 'org_policy_saday',
  organizationId: ORG_ID,
  cancellationAllowed: true,
  cancellationMinNoticeHours: 24, // FIXTURE — architecture.md §14 Q4 placeholder default, admin-editable
  cancellationRefundPct: 100, // FIXTURE — §14 Q4 placeholder default, admin-editable
  rescheduleAllowed: true,
  rescheduleMinNoticeHours: 24, // FIXTURE — §14 Q4 placeholder default, admin-editable
  rescheduleMaxCount: 2, // FIXTURE — §14 Q4 placeholder default, admin-editable
  bookingMinNoticeHours: 2,
  bookingWindowDaysMax: 30,
  defaultCommissionPct: 20, // FIXTURE — real default per D-018 §14 Q5, unconfirmed
  followUpCheckInHours: 24,
  followUpFeedbackHours: 24,
  whatsappPerPatientPerDay: 3,
  privacyPolicyVersion: 'pp-1.0',
  telemedicineConsentVersion: 'telemed-1.0',
  termsVersion: 'tos-1.0',
  grievanceOfficerEmail: 'sadaywellnessgroup@gmail.com',
  grievanceOfficerPhone: '+919235293990',
  timezone: 'Asia/Kolkata',
  createdAt: NOW,
  updatedAt: NOW,
};

import type { ISODateTime, UUID } from './common';

/** organizations */
export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  whatsappNumber: string | null;
  supportEmail: string | null;
  razorpayAccountId: string | null;
  timezone: string;
  currency: string;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** organization_policies (architecture.md §14 open questions live here) */
export interface OrganizationPolicies {
  id: UUID;
  organizationId: UUID;
  cancellationAllowed: boolean;
  cancellationMinNoticeHours: number;
  cancellationRefundPct: number;
  rescheduleAllowed: boolean;
  rescheduleMinNoticeHours: number;
  rescheduleMaxCount: number;
  bookingMinNoticeHours: number;
  bookingWindowDaysMax: number;
  defaultCommissionPct: number;
  followUpCheckInHours: number;
  followUpFeedbackHours: number;
  whatsappPerPatientPerDay: number;
  privacyPolicyVersion: string;
  telemedicineConsentVersion: string;
  termsVersion: string;
  grievanceOfficerEmail: string | null;
  grievanceOfficerPhone: string | null;
  timezone: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/* Data-access layer entry point (architecture.md §5). One repository
 * interface per aggregate; `repos` picks the implementation by env flag so
 * every P1-P4 screen is buildable against mocks before Supabase is wired. */

import { MockOrganizationRepo } from './organization.repo';
import { MockUserRepo } from './user.repo';
import { MockPatientRepo } from './patient.repo';
import { MockProviderRepo } from './provider.repo';
import { MockBookingRepo } from './booking.repo';
import { MockPaymentRepo } from './payment.repo';
import { MockEarningsRepo } from './earnings.repo';
import { MockClinicalRepo } from './clinical.repo';
import { MockPsychometricsRepo } from './psychometrics.repo';
import { MockSelfTrackingRepo } from './self-tracking.repo';
import { MockFileRepo } from './file.repo';
import { MockMaterialsRepo } from './materials.repo';
import { MockMessagingRepo } from './messaging.repo';
import { MockFollowUpRepo } from './followup.repo';
import { MockNotificationRepo } from './notification.repo';
import { MockConsentRepo } from './consent.repo';

export type { OrganizationRepo, OrganizationPatch, OrganizationPoliciesPatch } from './organization.repo';
export type { UserRepo } from './user.repo';
export type { PatientRepo } from './patient.repo';
export type {
  ProviderRepo,
  AvailabilityRuleInput,
  DayOffInput,
  SessionSettingsInput,
  SessionTypePatch,
} from './provider.repo';
export type { BookingRepo, SlotSearchQuery } from './booking.repo';
export type { PaymentRepo } from './payment.repo';
export type { EarningsRepo } from './earnings.repo';
export type { ClinicalRepo, SessionNoteDraftPatch, ProformaPatch } from './clinical.repo';
export type { PsychometricsRepo, PsychometricAssignment } from './psychometrics.repo';
export type { SelfTrackingRepo } from './self-tracking.repo';
export type { FileRepo } from './file.repo';
export type { MaterialsRepo } from './materials.repo';
export type { MessagingRepo } from './messaging.repo';
export type { FollowUpRepo, FollowUpFlowPatch } from './followup.repo';
export type { NotificationRepo } from './notification.repo';
export type { ConsentRepo } from './consent.repo';

export interface Repos {
  organization: import('./organization.repo').OrganizationRepo;
  user: import('./user.repo').UserRepo;
  patient: import('./patient.repo').PatientRepo;
  provider: import('./provider.repo').ProviderRepo;
  booking: import('./booking.repo').BookingRepo;
  payment: import('./payment.repo').PaymentRepo;
  earnings: import('./earnings.repo').EarningsRepo;
  clinical: import('./clinical.repo').ClinicalRepo;
  psychometrics: import('./psychometrics.repo').PsychometricsRepo;
  selfTracking: import('./self-tracking.repo').SelfTrackingRepo;
  file: import('./file.repo').FileRepo;
  materials: import('./materials.repo').MaterialsRepo;
  messaging: import('./messaging.repo').MessagingRepo;
  followUp: import('./followup.repo').FollowUpRepo;
  notification: import('./notification.repo').NotificationRepo;
  consent: import('./consent.repo').ConsentRepo;
}

const mockRepos: Repos = {
  organization: new MockOrganizationRepo(),
  user: new MockUserRepo(),
  patient: new MockPatientRepo(),
  provider: new MockProviderRepo(),
  booking: new MockBookingRepo(),
  payment: new MockPaymentRepo(),
  earnings: new MockEarningsRepo(),
  clinical: new MockClinicalRepo(),
  psychometrics: new MockPsychometricsRepo(),
  selfTracking: new MockSelfTrackingRepo(),
  file: new MockFileRepo(),
  materials: new MockMaterialsRepo(),
  messaging: new MockMessagingRepo(),
  followUp: new MockFollowUpRepo(),
  notification: new MockNotificationRepo(),
  consent: new MockConsentRepo(),
};

/* TODO(P2): real Supabase-backed implementations. Throws loudly rather than
 * silently falling back to mocks if DATA_SOURCE is misconfigured in an
 * environment that isn't ready for it. */
const supabaseRepos: Repos = new Proxy({} as Repos, {
  get() {
    throw new Error(
      'SupabaseRepository is not implemented yet (P1 foundation). Set DATA_SOURCE=mock, or wire the real ' +
        'repository implementations in P2 per architecture.md §5.',
    );
  },
});

export const repos: Repos = process.env.DATA_SOURCE === 'supabase' ? supabaseRepos : mockRepos;

export { ORG_ID } from './fixtures';

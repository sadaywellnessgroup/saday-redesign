import { redirect } from 'next/navigation';
import { getSession, type DevSession } from '@/lib/auth/session';
import type { Provider } from '@/lib/domain';

/* Server-side helpers shared by every /admin route — the admin
 * equivalent of src/lib/provider/console-data.ts's requireProvider(). The
 * date-key helpers there (istDateKey/weekStartKey/addDaysKey/
 * formatDayHeading) are generic IST-calendar math, not provider-specific,
 * so this module re-exports them instead of duplicating the logic. */
export {
  istDateKey,
  weekStartKey,
  addDaysKey,
  formatDayHeading,
  formatDayShort,
  IST_OFFSET_MIN,
} from '@/lib/provider/console-data';

export async function requireAdmin(): Promise<DevSession> {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/dev/switch-role');
  return session;
}

export type ProviderOnboardingStatus = 'verified' | 'pending_verification';

/** Derived, never stored: a provider whose registration number has been
 * checked (`registrationVerifiedAt` set) is Verified; everyone else is
 * still Pending. Mirrors the patient list's onboarding/clinical-status
 * split (src/lib/provider/patient-status.ts) — kept separate from
 * active/inactive, which is a deliberate admin toggle, not a derived
 * state. */
export function providerOnboardingStatus(provider: Pick<Provider, 'registrationVerifiedAt'>): ProviderOnboardingStatus {
  return provider.registrationVerifiedAt ? 'verified' : 'pending_verification';
}

export const PROVIDER_ONBOARDING_LABEL: Record<ProviderOnboardingStatus, string> = {
  verified: 'Verified',
  pending_verification: 'Pending verification',
};

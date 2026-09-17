import type { Appointment } from '@/lib/domain';

/* Clinical status and onboarding status are two different things and are
 * kept apart on the patient list (MantraCare digest §11 — the one pattern
 * worth adopting from their client list). */

export type ClinicalStatus = 'active' | 'new' | 'inactive';
export type OnboardingStatus = 'joined' | 'invite_sent' | 'not_sent';

export const CLINICAL_STATUS_LABEL: Record<ClinicalStatus, string> = {
  active: 'Active',
  new: 'New',
  inactive: 'Inactive',
};

export const ONBOARDING_STATUS_LABEL: Record<OnboardingStatus, string> = {
  joined: 'Joined',
  invite_sent: 'Invite sent',
  not_sent: 'Not sent',
};

const INACTIVE_AFTER_DAYS = 60;

/** Derived, never stored: a patient with no completed session yet is New;
 * one with a session or an upcoming booking in the window is Active;
 * everyone else has gone quiet. */
export function clinicalStatus(appointments: Appointment[], now: Date): ClinicalStatus {
  const completed = appointments.filter((a) => a.status === 'completed');
  const upcoming = appointments.filter((a) => a.status === 'scheduled' && new Date(a.scheduledAt) >= now);
  if (completed.length === 0) return 'new';
  if (upcoming.length > 0) return 'active';
  const last = completed.map((a) => new Date(a.scheduledAt).getTime()).sort((a, b) => b - a)[0]!;
  const days = (now.getTime() - last) / 86_400_000;
  return days <= INACTIVE_AFTER_DAYS ? 'active' : 'inactive';
}

export function lastSession(appointments: Appointment[], now: Date): Appointment | null {
  return (
    appointments
      .filter((a) => a.status === 'completed' && new Date(a.scheduledAt) <= now)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0] ?? null
  );
}

export function nextSession(appointments: Appointment[], now: Date): Appointment | null {
  return (
    appointments
      .filter((a) => a.status === 'scheduled' && new Date(a.scheduledAt) >= now)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0] ?? null
  );
}

/** +91 98765 43210 is never stored in the mock — the user row keeps only
 * the last four digits, which is all the console ever shows. */
export function maskedPhone(phoneLast4: string | null): string {
  return phoneLast4 ? `+91 •••• ${phoneLast4}` : '—';
}

export function sexLabel(sex: string): string {
  switch (sex) {
    case 'female':
      return 'F';
    case 'male':
      return 'M';
    case 'other':
      return 'Other';
    default:
      return '—';
  }
}

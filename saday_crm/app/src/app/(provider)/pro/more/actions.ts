'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';

export interface ProfileFormInput {
  professionalTitle: string;
  qualifications: string;
  specialisations: string;
  languagesSpoken: string;
  registrationNumber: string;
  bioShort: string;
  bioLong: string;
  isAcceptingPatients: boolean;
}

const TITLES = [
  'psychiatrist',
  'clinical_psychologist',
  'counselling_psychologist',
  'psychotherapist',
  'counsellor',
] as const;

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Public profile fields (D-030: the registration number is shown to
 * patients, so it is edited here and displayed on the provider card). */
export async function saveProfileAction(input: ProfileFormInput): Promise<{ ok: boolean; error?: string }> {
  const { providerId } = await requireProvider();
  const title = TITLES.find((t) => t === input.professionalTitle);
  if (!title) return { ok: false, error: 'bad_title' };

  await repos.provider.updateProfile(providerId, {
    professionalTitle: title,
    qualifications: splitList(input.qualifications),
    specialisations: splitList(input.specialisations),
    languagesSpoken: splitList(input.languagesSpoken),
    registrationNumber: input.registrationNumber.trim() || null,
    bioShort: input.bioShort.trim() || null,
    bioLong: input.bioLong.trim() || null,
    isAcceptingPatients: input.isAcceptingPatients,
  });

  revalidatePath('/pro/more/profile');
  revalidatePath('/providers');
  return { ok: true };
}

/** Notification preferences are per-user in the schema's `users` row set
 * only from P5 — this build keeps the toggles in memory so the screen is
 * real, and flags the missing column set to Saday. */
const notificationPrefs = new Map<string, Record<string, boolean>>();

const DEFAULT_NOTIFICATION_PREFS: Record<string, boolean> = {
  newBooking: true,
  cancellation: true,
  sessionReminder: true,
  newMessage: true,
  followUpResponse: false,
  payoutMarked: true,
};

export async function getNotificationPrefsAction(): Promise<Record<string, boolean>> {
  const { userId } = await requireProvider();
  return notificationPrefs.get(userId) ?? DEFAULT_NOTIFICATION_PREFS;
}

export async function saveNotificationPrefsAction(prefs: Record<string, boolean>): Promise<{ ok: boolean }> {
  const { userId } = await requireProvider();
  notificationPrefs.set(userId, prefs);
  revalidatePath('/pro/more/notifications');
  return { ok: true };
}

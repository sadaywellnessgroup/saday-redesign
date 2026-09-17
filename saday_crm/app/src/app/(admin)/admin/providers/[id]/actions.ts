'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { validateCommissionPct } from '@/lib/admin/validation';
import type { ProfessionalTitle } from '@/lib/domain';

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface AdminProviderFormInput {
  professionalTitle: string;
  qualifications: string;
  specialisations: string;
  languagesSpoken: string;
  registrationNumber: string;
  bioShort: string;
  bioLong: string;
  isAcceptingPatients: boolean;
  isActive: boolean;
  commissionPct: number;
}

const TITLES: ProfessionalTitle[] = [
  'psychiatrist',
  'clinical_psychologist',
  'counselling_psychologist',
  'psychotherapist',
  'counsellor',
];

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** /admin/providers/[id] — the one place D-020 puts admin controls
 * (commission %, active) alongside the same profile fields /pro/more
 * /profile edits, so an admin can fix a provider's listing without
 * needing the provider's own login. */
export async function saveProviderAction(providerId: string, input: AdminProviderFormInput): Promise<ActionResult> {
  await requireAdmin();
  const title = TITLES.find((t) => t === input.professionalTitle);
  if (!title) return { ok: false, error: 'Pick a professional title first.' };
  const commissionError = validateCommissionPct(input.commissionPct);
  if (commissionError) return { ok: false, error: commissionError };

  await repos.provider.updateProfile(providerId, {
    professionalTitle: title,
    qualifications: splitList(input.qualifications),
    specialisations: splitList(input.specialisations),
    languagesSpoken: splitList(input.languagesSpoken),
    registrationNumber: input.registrationNumber.trim() || null,
    bioShort: input.bioShort.trim() || null,
    bioLong: input.bioLong.trim() || null,
    isAcceptingPatients: input.isAcceptingPatients,
    isActive: input.isActive,
    commissionPct: input.commissionPct,
  });

  revalidatePath(`/admin/providers/${providerId}`);
  revalidatePath('/admin/providers');
  revalidatePath('/providers');
  revalidatePath('/pro/more/profile');
  revalidatePath('/pro/earnings');
  return { ok: true };
}

export interface SessionTypeFormInput {
  id: string;
  nameEn: string;
  pricePaise: number;
  isActive: boolean;
}

/** This is the one place D-020 says session-type prices are actually set
 * (the provider console shows them read-only — see README "What was not
 * built in P1"). */
export async function saveSessionTypeAction(
  providerId: string,
  input: SessionTypeFormInput,
): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isFinite(input.pricePaise) || input.pricePaise < 0) {
    return { ok: false, error: 'Enter a price of ₹0 or more.' };
  }
  if (!input.nameEn.trim()) return { ok: false, error: 'Session type needs a name.' };

  await repos.provider.updateSessionType(providerId, input.id, {
    nameEn: input.nameEn.trim(),
    pricePaise: Math.round(input.pricePaise),
    isActive: input.isActive,
  });

  revalidatePath(`/admin/providers/${providerId}`);
  revalidatePath('/admin/providers');
  revalidatePath('/providers');
  return { ok: true };
}

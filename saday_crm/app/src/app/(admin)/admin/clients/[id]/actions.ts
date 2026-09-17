'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';

export type ActionResult = { ok: true } | { ok: false; error: string };

/** D-031: phone is an attribute, not identity — admin can migrate a
 * client's phone number after an identity check, behind a confirm Sheet.
 * Only the last 4 digits are ever stored; the new number starts
 * unverified. */
export async function changeClientPhoneAction(patientId: string, newPhone: string): Promise<ActionResult> {
  await requireAdmin();
  const digits = newPhone.replace(/\D/g, '');
  if (digits.length < 10) return { ok: false, error: 'Enter a valid 10-digit mobile number.' };

  const patient = await repos.patient.getById(patientId);
  if (!patient) return { ok: false, error: 'Client not found.' };

  await repos.user.changePhone(patient.userId, digits);
  revalidatePath(`/admin/clients/${patientId}`);
  revalidatePath('/admin/clients');
  return { ok: true };
}

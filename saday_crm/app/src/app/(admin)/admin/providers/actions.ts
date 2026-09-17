'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { validateCommissionPct } from '@/lib/admin/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

/** /admin/providers inline edit — commission % (D-018). */
export async function updateCommissionAction(providerId: string, pct: number): Promise<ActionResult> {
  await requireAdmin();
  const error = validateCommissionPct(pct);
  if (error) return { ok: false, error };

  await repos.provider.updateProfile(providerId, { commissionPct: pct });
  revalidatePath('/admin/providers');
  revalidatePath(`/admin/providers/${providerId}`);
  revalidatePath('/pro/earnings');
  revalidatePath('/pro/more/profile');
  return { ok: true };
}

/** /admin/providers inline edit — active on/off. Inactive providers are
 * hidden from `listBookable` everywhere (booking, provider list). */
export async function toggleProviderActiveAction(providerId: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await repos.provider.updateProfile(providerId, { isActive });
  revalidatePath('/admin/providers');
  revalidatePath(`/admin/providers/${providerId}`);
  revalidatePath('/providers');
  return { ok: true };
}

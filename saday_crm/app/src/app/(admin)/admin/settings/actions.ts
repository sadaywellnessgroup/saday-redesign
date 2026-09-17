'use server';

import { revalidatePath } from 'next/cache';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { validateCommissionPct, validateFollowUpHours } from '@/lib/admin/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface SettingsFormInput {
  orgName: string;
  whatsappNumber: string;
  supportEmail: string;
  cancellationMinNoticeHours: number;
  cancellationRefundPct: number;
  rescheduleMinNoticeHours: number;
  rescheduleMaxCount: number;
  telemedicineConsentVersion: string;
}

/** /admin/settings — org name/contacts, the four §14 Q4 policy numbers,
 * and the consent text version (D-020). The WhatsApp template list is
 * read-only on this route — templates are approved with the BSP (D-015). */
export async function saveSettingsAction(input: SettingsFormInput): Promise<ActionResult> {
  await requireAdmin();

  if (!input.orgName.trim()) return { ok: false, error: 'Organisation name is required.' };

  const noticeError = validateFollowUpHours(input.cancellationMinNoticeHours);
  if (noticeError) return { ok: false, error: `Cancellation notice: ${noticeError}` };
  const rescheduleNoticeError = validateFollowUpHours(input.rescheduleMinNoticeHours);
  if (rescheduleNoticeError) return { ok: false, error: `Reschedule notice: ${rescheduleNoticeError}` };
  const refundError = validateCommissionPct(input.cancellationRefundPct);
  if (refundError) return { ok: false, error: `Refund %: ${refundError}` };
  if (!Number.isFinite(input.rescheduleMaxCount) || input.rescheduleMaxCount < 0) {
    return { ok: false, error: 'Max reschedules must be 0 or more.' };
  }
  if (!input.telemedicineConsentVersion.trim()) return { ok: false, error: 'Consent version is required.' };

  await repos.organization.updateOrganization(ORG_ID, {
    name: input.orgName.trim(),
    whatsappNumber: input.whatsappNumber.trim() || null,
    supportEmail: input.supportEmail.trim() || null,
  });
  await repos.organization.updatePolicies(ORG_ID, {
    cancellationMinNoticeHours: Math.round(input.cancellationMinNoticeHours),
    cancellationRefundPct: input.cancellationRefundPct,
    rescheduleMinNoticeHours: Math.round(input.rescheduleMinNoticeHours),
    rescheduleMaxCount: Math.round(input.rescheduleMaxCount),
    telemedicineConsentVersion: input.telemedicineConsentVersion.trim(),
  });

  revalidatePath('/admin/settings');
  revalidatePath('/admin');
  revalidatePath('/app/sessions');
  return { ok: true };
}

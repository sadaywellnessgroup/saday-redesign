'use server';

import { revalidatePath } from 'next/cache';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';

export type ActionResult = { ok: true } | { ok: false; error: string };

/** D-020: refunds are manual — "Mark processed" records who (the admin
 * session) and when. Idempotent (src/lib/admin/refunds.ts). */
export async function markRefundProcessedAction(refundId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  await repos.payment.markRefundProcessed(refundId, session.userId);
  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  return { ok: true };
}

/** D-018: payouts are marked manually by admin. Rolls up this provider's
 * pending ledger rows into one payout and requires a bank reference. */
export async function markPayoutPaidAction(providerId: string, bankReferenceId: string): Promise<ActionResult> {
  await requireAdmin();
  const ref = bankReferenceId.trim();
  if (!ref) return { ok: false, error: 'Enter a bank reference number.' };

  const payout = await repos.earnings.createPayoutForPendingLedger(ORG_ID, providerId, ref);
  if (!payout) return { ok: false, error: 'Nothing pending for this provider.' };

  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  revalidatePath('/pro/earnings');
  return { ok: true };
}

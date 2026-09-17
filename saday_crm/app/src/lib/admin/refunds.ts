import type { Refund } from '@/lib/domain';

/* Pure function so the idempotency rule is unit-testable without spinning
 * up a repo (mirrors src/lib/provider/availability-rules.ts's pattern —
 * validation/business logic as plain functions, called from both the
 * server action and the mock repo). D-020: refunds are marked manually by
 * admin, "Mark processed" records who and when. */

/** Marks a refund processed at `now`, recording `processedByUserId`.
 * Idempotent: calling this again on an already-processed refund is a
 * no-op — the original `processedAt` / `processedByUserId` are kept, not
 * overwritten by a second click, a retried request, or two admins acting
 * on the same row. */
export function markRefundProcessed(refund: Refund, processedByUserId: string, now: string): Refund {
  if (refund.status === 'processed') return refund;
  return {
    ...refund,
    status: 'processed',
    processedAt: now,
    processedByUserId,
    updatedAt: now,
  };
}

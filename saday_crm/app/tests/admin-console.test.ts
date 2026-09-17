import { describe, expect, it } from 'vitest';
import { validateCommissionPct, validateFollowUpHours } from '@/lib/admin/validation';
import { markRefundProcessed } from '@/lib/admin/refunds';
import type { Refund } from '@/lib/domain';

/* D-020 minimal admin console — pure validation/business logic, unit
 * tested independent of the repo layer (mirrors
 * tests/availability-rules.test.ts's pattern for /pro/availability). */

function refund(overrides: Partial<Refund> = {}): Refund {
  return {
    id: 'refund_1',
    organizationId: 'org_saday',
    paymentId: 'pay_1',
    razorpayRefundId: null,
    amountPaise: 90000,
    status: 'pending',
    reason: 'Provider cancelled the session.',
    idempotencyKey: 'refund_key_1',
    processedAt: null,
    processedByUserId: null,
    createdAt: '2026-09-10T05:30:00.000Z',
    updatedAt: '2026-09-10T05:30:00.000Z',
    ...overrides,
  };
}

describe('commission % validation (D-018, 0-100 inclusive)', () => {
  it('accepts the boundary values and typical percentages', () => {
    expect(validateCommissionPct(0)).toBeNull();
    expect(validateCommissionPct(100)).toBeNull();
    expect(validateCommissionPct(20)).toBeNull();
    expect(validateCommissionPct(17.5)).toBeNull();
  });

  it('rejects out-of-range and non-numeric values', () => {
    expect(validateCommissionPct(-1)).not.toBeNull();
    expect(validateCommissionPct(101)).not.toBeNull();
    expect(validateCommissionPct(Number.NaN)).not.toBeNull();
    expect(validateCommissionPct(Number.POSITIVE_INFINITY)).not.toBeNull();
  });
});

describe('follow-up flow hours validation (D-023)', () => {
  it('accepts whole-hour offsets within the allowed window', () => {
    expect(validateFollowUpHours(1)).toBeNull();
    expect(validateFollowUpHours(24)).toBeNull();
    expect(validateFollowUpHours(720)).toBeNull();
  });

  it('rejects zero, negative, fractional and out-of-range offsets', () => {
    expect(validateFollowUpHours(0)).not.toBeNull();
    expect(validateFollowUpHours(-5)).not.toBeNull();
    expect(validateFollowUpHours(2.5)).not.toBeNull();
    expect(validateFollowUpHours(721)).not.toBeNull();
    expect(validateFollowUpHours(Number.NaN)).not.toBeNull();
  });
});

describe('refund marking is idempotent (D-020: manual, records who/when)', () => {
  it('marks a pending refund processed, recording the actor and timestamp', () => {
    const result = markRefundProcessed(refund(), 'usr_admin_1', '2026-09-17T06:00:00.000Z');
    expect(result.status).toBe('processed');
    expect(result.processedByUserId).toBe('usr_admin_1');
    expect(result.processedAt).toBe('2026-09-17T06:00:00.000Z');
  });

  it('is a no-op on a refund that is already processed', () => {
    const already = refund({
      status: 'processed',
      processedAt: '2026-09-11T00:00:00.000Z',
      processedByUserId: 'usr_admin_1',
    });
    const result = markRefundProcessed(already, 'usr_admin_2', '2026-09-17T06:00:00.000Z');
    // second admin, later timestamp — none of it sticks, original wins
    expect(result.processedByUserId).toBe('usr_admin_1');
    expect(result.processedAt).toBe('2026-09-11T00:00:00.000Z');
    expect(result).toEqual(already);
  });

  it('marking twice in a row yields the same result both times', () => {
    const first = markRefundProcessed(refund(), 'usr_admin_1', '2026-09-17T06:00:00.000Z');
    const second = markRefundProcessed(first, 'usr_admin_1', '2026-09-17T06:05:00.000Z');
    expect(second).toEqual(first);
  });
});

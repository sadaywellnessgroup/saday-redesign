import { randomUUID } from 'node:crypto';
import type { EarningsLedgerEntry, ISODate, Payout, UUID } from '@/lib/domain';
import { earningsLedger, payouts } from './fixtures';

export interface EarningsRepo {
  listLedgerForProvider(providerId: UUID): Promise<EarningsLedgerEntry[]>;
  listPendingForProvider(providerId: UUID): Promise<EarningsLedgerEntry[]>;
  listPayoutsForProvider(providerId: UUID): Promise<Payout[]>;
  /** Admin /admin/payments Payouts tab — every payout ever recorded, across
   * providers (D-018: payouts are marked manually by admin). */
  listPayoutsForOrganization(organizationId: UUID): Promise<Payout[]>;
  /** Admin action: rolls up this provider's currently-pending ledger rows
   * into one new Payout, marks each of them paid, and returns it. */
  createPayoutForPendingLedger(
    organizationId: UUID,
    providerId: UUID,
    bankReferenceId: string,
  ): Promise<Payout | null>;
}

export class MockEarningsRepo implements EarningsRepo {
  async listLedgerForProvider(providerId: UUID): Promise<EarningsLedgerEntry[]> {
    return earningsLedger
      .filter((e) => e.providerId === providerId)
      .sort((a, b) => b.realisedAt.localeCompare(a.realisedAt));
  }
  async listPendingForProvider(providerId: UUID): Promise<EarningsLedgerEntry[]> {
    return earningsLedger.filter((e) => e.providerId === providerId && e.payoutStatus === 'pending');
  }
  async listPayoutsForProvider(providerId: UUID): Promise<Payout[]> {
    return payouts.filter((p) => p.providerId === providerId);
  }
  async listPayoutsForOrganization(organizationId: UUID): Promise<Payout[]> {
    return payouts
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createPayoutForPendingLedger(
    organizationId: UUID,
    providerId: UUID,
    bankReferenceId: string,
  ): Promise<Payout | null> {
    const pending = earningsLedger.filter((e) => e.providerId === providerId && e.payoutStatus === 'pending');
    if (pending.length === 0) return null;

    const totalAmountPaise = pending.reduce((sum, e) => sum + (e.netAmountPaise - e.refundedPaise), 0);
    const dates = pending.map((e) => e.realisedAt.slice(0, 10)).sort();
    const now = new Date().toISOString();
    const payout: Payout = {
      id: `payout_${randomUUID()}`,
      organizationId,
      providerId,
      periodStart: dates[0] as ISODate,
      periodEnd: dates[dates.length - 1] as ISODate,
      totalAmountPaise,
      status: 'paid',
      bankReferenceId,
      paidAt: now,
      notes: null,
      createdAt: now,
      updatedAt: now,
    };
    payouts.push(payout);
    for (const entry of pending) {
      entry.payoutId = payout.id;
      entry.payoutStatus = 'paid';
      entry.updatedAt = now;
    }
    return payout;
  }
}

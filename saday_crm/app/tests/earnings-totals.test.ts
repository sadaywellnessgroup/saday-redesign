import { describe, expect, it } from 'vitest';
import { filterByPeriod, patientInitials, standardPeriods, sumLedger } from '@/lib/provider/earnings-totals';
import { formatPaise } from '@/lib/utils';
import type { EarningsLedgerEntry } from '@/lib/domain';

/* D-012/D-018: money is an integer number of paise everywhere; only the
 * display formatter divides by 100, and it groups the Indian way. */

function entry(overrides: Partial<EarningsLedgerEntry>): EarningsLedgerEntry {
  const gross = overrides.grossAmountPaise ?? 150000;
  const pct = overrides.commissionPct ?? 20;
  const commission = overrides.commissionPaise ?? Math.round((gross * pct) / 100);
  return {
    id: 'earn_x',
    organizationId: 'org_saday',
    providerId: 'prov_aditya',
    patientId: 'pat_2',
    appointmentId: 'appt_x',
    paymentId: 'pay_x',
    serviceLabel: 'First consultation',
    grossAmountPaise: gross,
    commissionPct: pct,
    commissionPaise: commission,
    netAmountPaise: gross - commission,
    refundedPaise: 0,
    payoutId: null,
    payoutStatus: 'pending',
    realisedAt: '2026-09-10T05:30:00.000Z',
    createdAt: '2026-09-10T05:30:00.000Z',
    updatedAt: '2026-09-10T05:30:00.000Z',
    ...overrides,
  };
}

describe('earnings totals (integer paise)', () => {
  it('sums gross, commission and net without floating point', () => {
    const totals = sumLedger([
      entry({ id: 'a', grossAmountPaise: 150000 }), // ₹1,500 · 20% → ₹300 / ₹1,200
      entry({ id: 'b', grossAmountPaise: 90000 }), //  ₹900   · 20% → ₹180 / ₹720
      entry({ id: 'c', grossAmountPaise: 120000, commissionPct: 15 }), // ₹1,200 · 15% → ₹180 / ₹1,020
    ]);

    expect(totals.sessions).toBe(3);
    expect(totals.grossPaise).toBe(360000);
    expect(totals.commissionPaise).toBe(66000);
    expect(totals.netPaise).toBe(294000);
    expect(Number.isInteger(totals.grossPaise)).toBe(true);
    expect(Number.isInteger(totals.commissionPaise)).toBe(true);
    expect(Number.isInteger(totals.netPaise)).toBe(true);
    expect(totals.grossPaise - totals.commissionPaise).toBe(totals.netPaise);
  });

  it('subtracts refunds from net and from pending payout', () => {
    const totals = sumLedger([
      entry({ id: 'a', grossAmountPaise: 150000, refundedPaise: 120000 }),
      entry({ id: 'b', grossAmountPaise: 90000 }),
    ]);
    // 120000 + 72000 - 120000 refunded
    expect(totals.netPaise).toBe(72000);
    expect(totals.refundedPaise).toBe(120000);
    expect(totals.pendingPayoutPaise).toBe(72000);
  });

  it('splits pending from paid-out', () => {
    const totals = sumLedger([
      entry({ id: 'a', grossAmountPaise: 150000, payoutStatus: 'paid' }),
      entry({ id: 'b', grossAmountPaise: 90000, payoutStatus: 'pending' }),
    ]);
    expect(totals.paidOutPaise).toBe(120000);
    expect(totals.pendingPayoutPaise).toBe(72000);
    expect(totals.paidOutPaise + totals.pendingPayoutPaise).toBe(totals.netPaise);
  });

  it('is zero for an empty ledger', () => {
    const totals = sumLedger([]);
    expect(totals).toMatchObject({ sessions: 0, grossPaise: 0, commissionPaise: 0, netPaise: 0 });
  });

  it('filters by IST calendar period, including the boundary days', () => {
    const rows = [
      entry({ id: 'before', realisedAt: '2026-08-31T18:00:00.000Z' }), // 31 Aug 23:30 IST
      entry({ id: 'first', realisedAt: '2026-08-31T18:35:00.000Z' }), // 1 Sep 00:05 IST
      entry({ id: 'last', realisedAt: '2026-09-30T18:25:00.000Z' }), // 30 Sep 23:55 IST
      entry({ id: 'after', realisedAt: '2026-09-30T18:35:00.000Z' }), // 1 Oct 00:05 IST
    ];
    const september = { fromDate: '2026-09-01', toDate: '2026-09-30' };
    expect(filterByPeriod(rows, september).map((r) => r.id)).toEqual(['first', 'last']);
  });

  it('builds this-month and last-month periods in IST', () => {
    const [thisMonth, lastMonth] = standardPeriods(new Date('2026-01-01T00:30:00.000Z')); // 1 Jan 06:00 IST
    expect(thisMonth!.fromDate).toBe('2026-01-01');
    expect(thisMonth!.toDate).toBe('2026-01-31');
    expect(lastMonth!.fromDate).toBe('2025-12-01');
    expect(lastMonth!.toDate).toBe('2025-12-31');
  });

  it('formats paise with Indian grouping and shows patients as initials only', () => {
    expect(formatPaise(12345600)).toBe('₹1,23,456');
    expect(formatPaise(150000)).toBe('₹1,500');
    expect(patientInitials('Ananya Verma')).toBe('A.V.');
    expect(patientInitials('')).toBe('—');
  });
});

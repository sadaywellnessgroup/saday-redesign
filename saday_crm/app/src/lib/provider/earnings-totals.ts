import type { EarningsLedgerEntry, Paise } from '@/lib/domain';

/* Earnings totals (D-018: fixed % commission per provider, ledger row per
 * paid session, payouts marked manually by admin). Money is integer paise
 * everywhere in this module — no division, no floats, no rupee strings
 * until the display formatter (`formatPaise`). */

export interface EarningsTotals {
  sessions: number;
  grossPaise: Paise;
  commissionPaise: Paise;
  netPaise: Paise;
  pendingPayoutPaise: Paise;
  paidOutPaise: Paise;
  refundedPaise: Paise;
}

export const EMPTY_TOTALS: EarningsTotals = {
  sessions: 0,
  grossPaise: 0,
  commissionPaise: 0,
  netPaise: 0,
  pendingPayoutPaise: 0,
  paidOutPaise: 0,
  refundedPaise: 0,
};

/** Sums a ledger slice. `netPaise` is gross − commission − refunds so a
 * refunded session cannot inflate a payout. */
export function sumLedger(entries: EarningsLedgerEntry[]): EarningsTotals {
  return entries.reduce<EarningsTotals>((acc, e) => {
    const net = e.netAmountPaise - e.refundedPaise;
    return {
      sessions: acc.sessions + 1,
      grossPaise: acc.grossPaise + e.grossAmountPaise,
      commissionPaise: acc.commissionPaise + e.commissionPaise,
      netPaise: acc.netPaise + net,
      pendingPayoutPaise:
        acc.pendingPayoutPaise + (e.payoutStatus === 'paid' ? 0 : net),
      paidOutPaise: acc.paidOutPaise + (e.payoutStatus === 'paid' ? net : 0),
      refundedPaise: acc.refundedPaise + e.refundedPaise,
    };
  }, { ...EMPTY_TOTALS });
}

export interface Period {
  key: string;
  label: string;
  /** Inclusive ISO date "YYYY-MM-DD" (IST calendar days). */
  fromDate: string;
  /** Inclusive. */
  toDate: string;
}

const IST_OFFSET_MIN = 330;

function istDateParts(at: Date): { y: number; m: number; d: number } {
  const ist = new Date(at.getTime() + IST_OFFSET_MIN * 60_000);
  return { y: ist.getUTCFullYear(), m: ist.getUTCMonth(), d: ist.getUTCDate() };
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function monthLabel(y: number, m: number): string {
  return new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** "This month" / "Last month" as IST calendar months. */
export function standardPeriods(now: Date): Period[] {
  const { y, m } = istDateParts(now);
  const prevY = m === 0 ? y - 1 : y;
  const prevM = m === 0 ? 11 : m - 1;
  return [
    {
      key: 'this_month',
      label: `This month · ${monthLabel(y, m)}`,
      fromDate: isoDate(y, m, 1),
      toDate: isoDate(y, m, new Date(Date.UTC(y, m + 1, 0)).getUTCDate()),
    },
    {
      key: 'last_month',
      label: `Last month · ${monthLabel(prevY, prevM)}`,
      fromDate: isoDate(prevY, prevM, 1),
      toDate: isoDate(prevY, prevM, new Date(Date.UTC(prevY, prevM + 1, 0)).getUTCDate()),
    },
  ];
}

/** Filters ledger rows to an inclusive IST calendar-date range. */
export function filterByPeriod(entries: EarningsLedgerEntry[], period: Pick<Period, 'fromDate' | 'toDate'>): EarningsLedgerEntry[] {
  return entries.filter((e) => {
    const { y, m, d } = istDateParts(new Date(e.realisedAt));
    const date = isoDate(y, m, d);
    return date >= period.fromDate && date <= period.toDate;
  });
}

/** "Ananya Verma" -> "A.V." — the ledger table never shows a patient name
 * (§E-10 spirit: the money view is not a clinical view). */
export function patientInitials(displayName: string): string {
  return (
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => `${w[0]!.toUpperCase()}.`)
      .join('') || '—'
  );
}

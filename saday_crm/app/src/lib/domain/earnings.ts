import type { ISODate, ISODateTime, Paise, UUID } from './common';

export type PayoutStatus = 'pending' | 'paid' | 'failed';

/** payouts — marked manually by admin (D-018). */
export interface Payout {
  id: UUID;
  organizationId: UUID;
  providerId: UUID;
  periodStart: ISODate;
  periodEnd: ISODate;
  totalAmountPaise: Paise;
  status: PayoutStatus;
  bankReferenceId: string | null;
  paidAt: ISODateTime | null;
  notes: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type EarningsPayoutStatus = 'pending' | 'batched' | 'paid' | 'on_hold';

/** earnings_ledger — one row per paid session (D-018). */
export interface EarningsLedgerEntry {
  id: UUID;
  organizationId: UUID;
  providerId: UUID;
  patientId: UUID;
  appointmentId: UUID;
  paymentId: UUID;
  serviceLabel: string;
  grossAmountPaise: Paise;
  commissionPct: number;
  commissionPaise: Paise;
  netAmountPaise: Paise;
  refundedPaise: Paise;
  payoutId: UUID | null;
  payoutStatus: EarningsPayoutStatus;
  realisedAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

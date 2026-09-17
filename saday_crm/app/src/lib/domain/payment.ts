import type { ISODateTime, Paise, UUID } from './common';

export type PaymentStatus = 'created' | 'attempted' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';

/** payments */
export interface Payment {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  appointmentId: UUID;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: Paise;
  currency: string;
  status: PaymentStatus;
  failureReason: string | null;
  reconciledAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type RefundStatus = 'pending' | 'processed' | 'failed';

/** refunds */
export interface Refund {
  id: UUID;
  organizationId: UUID;
  paymentId: UUID;
  razorpayRefundId: string | null;
  amountPaise: Paise;
  status: RefundStatus;
  reason: string | null;
  idempotencyKey: string;
  processedAt: ISODateTime | null;
  /** Who marked it processed (D-020: refunds are manual, admin-recorded).
   * NOT yet a column in `0001_schema.sql` — needs `processed_by_user_id
   * uuid references users(id)` in a follow-up migration, same pattern as
   * `provider_blockouts.repeats_yearly`. Flagged for Saday. */
  processedByUserId: UUID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

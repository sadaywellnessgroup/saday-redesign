import type { EarningsLedgerEntry, Payment, Payout, Refund } from '@/lib/domain';
import { ORG_ID } from './organization';
import { appointments } from './appointments';
import { providers } from './providers';
import { FIXTURE_NOW, dayOffset } from './time';

const NOW = FIXTURE_NOW.toISOString();

const PAID_COMPLETED_IDS = [
  'appt_1', 'appt_2', 'appt_3', 'appt_5', 'appt_6',
  'appt_9', 'appt_10', 'appt_12', 'appt_13', 'appt_15', 'appt_17',
  // prov_aditya's own completed-and-paid sessions (provider console)
  'appt_21', 'appt_25', 'appt_26', 'appt_31',
];

const paidAppointments = appointments.filter((a) => PAID_COMPLETED_IDS.includes(a.id));
const refundedAppointment = appointments.find((a) => a.id === 'appt_14')!; // cancelled_by_patient, refunded
const pendingRefundAppointment = appointments.find((a) => a.id === 'appt_32')!; // cancelled_by_provider, refunded

/* FIXTURE — one captured payment per paid appointment (+ appt_14's refund),
 * Razorpay ids are made up. */
export const payments: Payment[] = [
  ...paidAppointments.map(
    (a, i): Payment => ({
      id: `pay_${a.id}`,
      organizationId: ORG_ID,
      patientId: a.patientId,
      appointmentId: a.id,
      razorpayOrderId: `order_FIXTURE${100 + i}`,
      razorpayPaymentId: `pay_FIXTURE${100 + i}`,
      amountPaise: a.pricePaise,
      currency: 'INR',
      status: 'captured',
      failureReason: null,
      reconciledAt: NOW,
      createdAt: a.scheduledAt,
      updatedAt: a.scheduledAt,
    }),
  ),
  {
    id: `pay_${refundedAppointment.id}`,
    organizationId: ORG_ID,
    patientId: refundedAppointment.patientId,
    appointmentId: refundedAppointment.id,
    razorpayOrderId: 'order_FIXTURE200',
    razorpayPaymentId: 'pay_FIXTURE200',
    amountPaise: refundedAppointment.pricePaise,
    currency: 'INR',
    status: 'refunded',
    failureReason: null,
    reconciledAt: NOW,
    createdAt: refundedAppointment.scheduledAt,
    updatedAt: refundedAppointment.scheduledAt,
  },
  {
    id: `pay_${pendingRefundAppointment.id}`,
    organizationId: ORG_ID,
    patientId: pendingRefundAppointment.patientId,
    appointmentId: pendingRefundAppointment.id,
    razorpayOrderId: 'order_FIXTURE201',
    razorpayPaymentId: 'pay_FIXTURE201',
    amountPaise: pendingRefundAppointment.pricePaise,
    currency: 'INR',
    status: 'refunded',
    failureReason: null,
    reconciledAt: NOW,
    createdAt: pendingRefundAppointment.scheduledAt,
    updatedAt: pendingRefundAppointment.scheduledAt,
  },
];

export const refunds: Refund[] = [
  {
    id: `refund_${refundedAppointment.id}`,
    organizationId: ORG_ID,
    paymentId: `pay_${refundedAppointment.id}`,
    razorpayRefundId: 'rfnd_FIXTURE1',
    amountPaise: refundedAppointment.pricePaise,
    status: 'processed',
    reason: 'Patient cancelled with sufficient notice (FIXTURE).',
    idempotencyKey: `refund_key_${refundedAppointment.id}`,
    processedAt: NOW,
    processedByUserId: 'usr_admin_1',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: `refund_${pendingRefundAppointment.id}`,
    organizationId: ORG_ID,
    paymentId: `pay_${pendingRefundAppointment.id}`,
    razorpayRefundId: null,
    amountPaise: pendingRefundAppointment.pricePaise,
    status: 'pending',
    reason: 'Provider cancelled the session (FIXTURE).',
    idempotencyKey: `refund_key_${pendingRefundAppointment.id}`,
    processedAt: null,
    processedByUserId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

function commissionFor(providerId: string): number {
  return providers.find((p) => p.id === providerId)?.commissionPct ?? 20;
}

export const earningsLedger: EarningsLedgerEntry[] = paidAppointments.map((a) => {
  const commissionPct = commissionFor(a.providerId);
  const commissionPaise = Math.round((a.pricePaise * commissionPct) / 100);
  const netAmountPaise = a.pricePaise - commissionPaise;
  return {
    id: `earn_${a.id}`,
    organizationId: ORG_ID,
    providerId: a.providerId,
    patientId: a.patientId,
    appointmentId: a.id,
    paymentId: `pay_${a.id}`,
    serviceLabel: a.sessionTypeId.includes('first') ? 'First consultation' : 'Follow-up',
    grossAmountPaise: a.pricePaise,
    commissionPct,
    commissionPaise,
    netAmountPaise,
    refundedPaise: 0,
    payoutId: null, // set below for the one entry payout_1 already covers
    payoutStatus: 'pending',
    realisedAt: a.scheduledAt,
    createdAt: a.scheduledAt,
    updatedAt: a.scheduledAt,
  };
});

/* One payout already made to Dr. Aditya covering his oldest earnings row. */
export const payouts: Payout[] = [
  {
    id: 'payout_1',
    organizationId: ORG_ID,
    providerId: 'prov_aditya',
    periodStart: dayOffset(-45),
    periodEnd: dayOffset(-31),
    totalAmountPaise: earningsLedger.find((e) => e.id === 'earn_appt_5')?.netAmountPaise ?? 0,
    status: 'paid',
    bankReferenceId: 'UTR-FIXTURE-0001',
    paidAt: dayOffset(-25) + 'T10:00:00.000Z',
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// Mark appt_5's earnings row as paid out via payout_1 (kept as a second pass
// so the payout id above can reference the entry it pays).
const paidEntry = earningsLedger.find((e) => e.id === 'earn_appt_5');
if (paidEntry) {
  paidEntry.payoutId = 'payout_1';
  paidEntry.payoutStatus = 'paid';
}

import { randomUUID } from 'node:crypto';
import { writeOutbox } from './dev-outbox';

export interface PaymentGateway {
  createOrder(a: {
    amountPaise: number;
    currency: 'INR';
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ orderId: string; amountPaise: number }>;
  verifyWebhook(a: { rawBody: string; signature: string }): Promise<{
    ok: boolean;
    eventId: string;
    event: string;
    orderId?: string;
    paymentId?: string;
    refundId?: string;
    amountPaise?: number;
  }>;
  refund(a: {
    paymentId: string;
    amountPaise: number;
    idempotencyKey: string;
    reason?: string;
  }): Promise<{ refundId: string; status: 'pending' | 'processed' | 'failed' }>;
}

/** Auto-captures every order (architecture.md §4) — good enough to build and
 * demo the booking → payment → confirmation flow without Razorpay keys. */
export class StubPaymentGateway implements PaymentGateway {
  async createOrder(a: { amountPaise: number; currency: 'INR'; receipt: string; notes?: Record<string, string> }) {
    const orderId = `stub_order_${randomUUID()}`;
    await writeOutbox('payment', { kind: 'order_created', orderId, amountPaise: a.amountPaise, receipt: a.receipt });
    return { orderId, amountPaise: a.amountPaise };
  }

  async verifyWebhook(a: { rawBody: string; signature: string }) {
    // stub mode never receives a real webhook; treat every call as valid so
    // integration code exercising this path still runs end to end.
    const eventId = `stub_evt_${randomUUID()}`;
    await writeOutbox('payment', { kind: 'webhook_verified', eventId, signaturePresent: !!a.signature });
    return { ok: true, eventId, event: 'payment.captured' };
  }

  async refund(a: { paymentId: string; amountPaise: number; idempotencyKey: string; reason?: string }) {
    const refundId = `stub_refund_${randomUUID()}`;
    await writeOutbox('payment', {
      kind: 'refund',
      refundId,
      paymentId: a.paymentId,
      amountPaise: a.amountPaise,
      idempotencyKey: a.idempotencyKey,
    });
    return { refundId, status: 'processed' as const };
  }
}

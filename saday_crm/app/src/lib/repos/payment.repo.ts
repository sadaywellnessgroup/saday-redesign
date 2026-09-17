import type { Payment, Refund, UUID } from '@/lib/domain';
import { payments, refunds } from './fixtures';
import { markRefundProcessed } from '@/lib/admin/refunds';

export interface PaymentRepo {
  getById(id: UUID): Promise<Payment | null>;
  getByAppointmentId(appointmentId: UUID): Promise<Payment | null>;
  listForPatient(patientId: UUID): Promise<Payment[]>;
  listRefundsForPayment(paymentId: UUID): Promise<Refund[]>;
  /** Admin /admin/payments — every payment in the org, newest first. */
  listForOrganization(organizationId: UUID): Promise<Payment[]>;
  /** Admin /admin/payments Refunds tab. */
  listRefundsForOrganization(organizationId: UUID): Promise<Refund[]>;
  /** Manual refund marking (D-020) — records who/when, idempotent: marking
   * an already-processed refund again is a no-op that keeps the original
   * `processedAt`. */
  markRefundProcessed(refundId: UUID, processedByUserId: UUID): Promise<Refund>;
}

export class MockPaymentRepo implements PaymentRepo {
  async getById(id: UUID): Promise<Payment | null> {
    return payments.find((p) => p.id === id) ?? null;
  }
  async getByAppointmentId(appointmentId: UUID): Promise<Payment | null> {
    return payments.find((p) => p.appointmentId === appointmentId) ?? null;
  }
  async listForPatient(patientId: UUID): Promise<Payment[]> {
    return payments
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listRefundsForPayment(paymentId: UUID): Promise<Refund[]> {
    return refunds.filter((r) => r.paymentId === paymentId);
  }
  async listForOrganization(organizationId: UUID): Promise<Payment[]> {
    return payments
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listRefundsForOrganization(organizationId: UUID): Promise<Refund[]> {
    return refunds
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async markRefundProcessed(refundId: UUID, processedByUserId: UUID): Promise<Refund> {
    const index = refunds.findIndex((r) => r.id === refundId);
    if (index === -1) throw new Error(`unknown refund: ${refundId}`);
    const updated = markRefundProcessed(refunds[index]!, processedByUserId, new Date().toISOString());
    refunds[index] = updated;
    return updated;
  }
}

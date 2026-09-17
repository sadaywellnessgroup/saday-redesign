'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { repos, ORG_ID } from '@/lib/repos';
import { adapters } from '@/lib/adapters';
import { DEV_ROLE_COOKIE } from '@/lib/auth/session';
import { getIntake } from '@/lib/intake/cookie';

/** DEV ONLY — every anonymous booking in this P1 mock resolves to the
 * fixed dev patient (`pat_1`), the same id `getSession()` uses once the
 * `patient` role cookie is set. There is no patient-signup path yet
 * (PatientRepo has no `create` — real account creation is P2 auth work,
 * D-014); the intake cookie's name/age/sex is used for display only. */
const DEV_PATIENT_ID = 'pat_1';

export interface CreateBookingInput {
  providerId: string;
  sessionTypeId: string;
  slotStartISO: string;
  durationMinutes: number;
  bufferMinutes: number;
  pricePaise: number;
  bookingChannel: 'patient_self' | 'earliest_available';
  rescheduleFromId?: string;
}

/** Booking → payment → confirmation (routes 5/6, D-012). Calls the stub
 * Razorpay gateway (auto-captures in dev), creates the appointment against
 * the mock BookingRepo, "logs the patient in" (sets the dev role cookie —
 * see book/[providerId]/actions.ts's DEV ONLY note above), and redirects
 * to the confirmation screen. */
export async function createBookingAction(input: CreateBookingInput) {
  const intake = await getIntake();

  const order = await adapters.payment.createOrder({
    amountPaise: input.pricePaise,
    currency: 'INR',
    receipt: `intake_${DEV_PATIENT_ID}_${Date.now()}`,
    notes: { providerId: input.providerId, sessionTypeId: input.sessionTypeId, patientName: intake?.name ?? '' },
  });

  const appointment = await repos.booking.create({
    organizationId: ORG_ID,
    patientId: DEV_PATIENT_ID,
    providerId: input.providerId,
    sessionTypeId: input.sessionTypeId,
    scheduledAt: input.slotStartISO,
    durationMinutes: input.durationMinutes,
    bufferMinutes: input.bufferMinutes,
    pricePaise: order.amountPaise,
    bookingChannel: input.bookingChannel,
  });

  if (input.rescheduleFromId) {
    await repos.booking.markRescheduled(input.rescheduleFromId, appointment.id);
  }

  const store = await cookies();
  store.set(DEV_ROLE_COOKIE, 'patient', { path: '/', maxAge: 60 * 60 * 24 * 7 });

  redirect(`/booking/${appointment.id}/confirmed`);
}

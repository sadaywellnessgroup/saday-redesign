'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { repos } from '@/lib/repos';

export type ActionResult = { ok: true } | { ok: false; error: string };

async function ownAppointment(appointmentId: string) {
  const session = await getSession();
  if (!session?.providerId) return null;
  const appointment = await repos.booking.getById(appointmentId);
  if (!appointment || appointment.providerId !== session.providerId) return null;
  return { session, appointment };
}

function revalidateConsole(patientId?: string) {
  revalidatePath('/pro');
  revalidatePath('/pro/calendar');
  revalidatePath('/pro/patients');
  if (patientId) revalidatePath(`/pro/patients/${patientId}`);
}

/** `scheduled|in_progress -> no_show` (architecture.md §10 status machine). */
export async function markNoShowAction(appointmentId: string): Promise<ActionResult> {
  const found = await ownAppointment(appointmentId);
  if (!found) return { ok: false, error: 'not_found' };
  await repos.booking.markNoShow(appointmentId);
  revalidateConsole(found.appointment.patientId);
  return { ok: true };
}

/** `scheduled -> cancelled_by_provider`; the reason is shown to the patient. */
export async function cancelByProviderAction(appointmentId: string, reason: string): Promise<ActionResult> {
  const found = await ownAppointment(appointmentId);
  if (!found) return { ok: false, error: 'not_found' };
  if (!reason.trim()) return { ok: false, error: 'reason_required' };
  await repos.booking.cancelByProvider(appointmentId, reason.trim());
  revalidateConsole(found.appointment.patientId);
  return { ok: true };
}

/** Marks a past session completed so its note can be written. */
export async function markCompletedAction(appointmentId: string): Promise<ActionResult> {
  const found = await ownAppointment(appointmentId);
  if (!found) return { ok: false, error: 'not_found' };
  await repos.booking.markCompleted(appointmentId);
  revalidateConsole(found.appointment.patientId);
  return { ok: true };
}

/** Clears the Today screen's "new follow-up responses" count. */
export async function markFollowUpsSeenAction(): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.providerId) return { ok: false, error: 'no_session' };
  const submissions = await repos.followUp.listSubmissionsForProvider(session.providerId);
  await repos.followUp.markSubmissionsSeen(submissions.map((s) => s.id));
  revalidatePath('/pro');
  return { ok: true };
}

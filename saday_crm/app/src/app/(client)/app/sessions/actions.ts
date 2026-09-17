'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { getSession } from '@/lib/auth/session';

export async function cancelAppointmentAction(appointmentId: string, reason: string) {
  const session = await getSession();
  if (!session?.patientId) return { ok: false as const };
  const appointment = await repos.booking.getById(appointmentId);
  if (!appointment || appointment.patientId !== session.patientId) return { ok: false as const };
  await repos.booking.cancel(appointmentId, reason || null);
  revalidatePath('/app/sessions');
  revalidatePath('/app');
  return { ok: true as const };
}

import { NextResponse } from 'next/server';
import { repos } from '@/lib/repos';
import { buildAppointmentICS } from '@/lib/booking/ics';

/** ICS download for the confirmation screen's "add to calendar" (route 7). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await repos.booking.getById(id);
  if (!appointment) return new NextResponse('Not found', { status: 404 });

  const provider = await repos.provider.getById(appointment.providerId);
  const endISO = new Date(
    new Date(appointment.scheduledAt).getTime() + appointment.durationMinutes * 60_000,
  ).toISOString();

  const ics = buildAppointmentICS({
    uid: appointment.id,
    title: `Saday Wellness — session with ${provider?.displayName ?? 'your provider'}`,
    description: 'Online consultation. Join link will be available 10 minutes before the session.',
    startISO: appointment.scheduledAt,
    endISO,
  });

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="saday-session-${appointment.id}.ics"`,
    },
  });
}

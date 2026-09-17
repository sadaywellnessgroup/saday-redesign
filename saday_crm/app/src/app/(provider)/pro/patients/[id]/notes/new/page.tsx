import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPill } from '@/components/provider/status-pill';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { createNoteForAppointmentAction } from '@/app/(provider)/pro/patients/[id]/notes/actions';
import { formatISTDate, formatISTTime } from '@/lib/utils';

/** Route /pro/patients/[id]/notes/new — with `?appointment=` it creates
 * the draft and hands over to the editor; without one it asks which
 * session the note belongs to (a note always hangs off an appointment,
 * 0001_schema.sql §7). */
export default async function NewNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ appointment?: string }>;
}) {
  const { id } = await params;
  const { appointment: appointmentId } = await searchParams;
  const { providerId } = await requireProvider();

  const patient = await repos.patient.getById(id);
  if (!patient) notFound();

  if (appointmentId) {
    const result = await createNoteForAppointmentAction(appointmentId);
    if (result.ok) redirect(`/pro/patients/${id}/notes/${result.noteId}`);
    notFound();
  }

  const appointments = (await repos.booking.listForPatient(id))
    .filter((a) => a.providerId === providerId && (a.status === 'completed' || a.status === 'scheduled'))
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const notes = await repos.clinical.listSessionNotesForPatient(id);
  const noteByAppointment = new Map(notes.map((n) => [n.appointmentId, n]));

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading
        kicker={`${patient.displayName} · new note`}
        title="Which session is this note for?"
        sub="Every note belongs to one session, so the record and the calendar never drift apart."
        actions={
          <Link
            href={`/pro/patients/${id}?tab=notes`}
            className="inline-flex min-h-11 items-center rounded-full bg-card px-4 text-[13.5px] font-semibold text-indigo no-underline shadow-feather"
          >
            All notes
          </Link>
        }
      />

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">No sessions to write about yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((appointment) => {
            const existing = noteByAppointment.get(appointment.id);
            const href = existing
              ? `/pro/patients/${id}/notes/${existing.id}`
              : `/pro/patients/${id}/notes/new?appointment=${appointment.id}`;
            return (
              <Link key={appointment.id} href={href} className="no-underline">
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-3 pt-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[17px] text-indigo-deep">
                        {formatISTDate(appointment.scheduledAt)} · {formatISTTime(appointment.scheduledAt)}
                      </p>
                      <p className="text-sm text-ink-soft">{appointment.durationMinutes} min</p>
                    </div>
                    <StatusPill status={appointment.status} />
                    <span className="text-[13.5px] font-semibold text-indigo">
                      {existing ? (existing.signedAt ? 'View note' : 'Continue draft') : 'Write note'}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

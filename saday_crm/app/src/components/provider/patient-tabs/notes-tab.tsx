import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos } from '@/lib/repos';
import { progressLabel } from '@/lib/clinical/note-spec';
import type { Appointment, Patient } from '@/lib/domain';
import { formatISTDate } from '@/lib/utils';

const MODE_LABEL: Record<string, string> = {
  online: 'Online',
  in_person: 'In person',
  telephonic: 'Telephonic',
};

/** Notes tab — every live note for this patient, newest first, plus the
 * completed sessions that still have none. */
export async function NotesTab({ patient, appointments }: { patient: Patient; appointments: Appointment[] }) {
  const notes = await repos.clinical.listSessionNotesForPatient(patient.id);
  const noteByAppointment = new Map(notes.map((n) => [n.appointmentId, n]));
  const awaiting = appointments.filter((a) => a.status === 'completed' && !noteByAppointment.get(a.id)?.signedAt);

  const nextAppointment = [...appointments]
    .filter((a) => a.status === 'completed' || a.status === 'scheduled')
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="sec-title">Session notes</h2>
        <Link
          href={`/pro/patients/${patient.id}/notes/new${nextAppointment ? `?appointment=${nextAppointment.id}` : ''}`}
          className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream no-underline"
        >
          New note
        </Link>
      </div>

      {awaiting.length > 0 ? (
        <div className="rounded-softer bg-lilac-tint p-4">
          <p className="pb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-indigo-deep">
            Sessions awaiting a signed note
          </p>
          <div className="flex flex-wrap gap-2">
            {awaiting.map((a) => {
              const draft = noteByAppointment.get(a.id);
              return (
                <Link
                  key={a.id}
                  href={
                    draft
                      ? `/pro/patients/${patient.id}/notes/${draft.id}`
                      : `/pro/patients/${patient.id}/notes/new?appointment=${a.id}`
                  }
                  className="inline-flex min-h-11 items-center rounded-full bg-card px-4 text-[13.5px] font-semibold text-indigo no-underline shadow-feather"
                >
                  {formatISTDate(a.scheduledAt)} · {draft ? 'Continue draft' : 'Write note'}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">No notes written yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <Link key={note.id} href={`/pro/patients/${patient.id}/notes/${note.id}`} className="no-underline">
              <Card>
                <CardContent className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-[17px] text-indigo-deep">{formatISTDate(`${note.sessionDate}T06:00:00.000Z`)}</p>
                      <Badge variant={note.signedAt ? 'default' : 'turmeric'}>{note.signedAt ? 'Signed' : 'Draft'}</Badge>
                      {note.version > 1 ? <Badge variant="secondary">v{note.version}</Badge> : null}
                    </div>
                    <p className="truncate text-sm text-ink-soft">
                      {note.durationMinutes} min · {MODE_LABEL[note.mode] ?? note.mode}
                      {note.presentingConcern ? ` · ${note.presentingConcern}` : ''}
                    </p>
                  </div>
                  <div className="flex-none text-right">
                    <p className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">Progress</p>
                    <p className="font-display text-[17px] text-indigo-deep">
                      {note.progressScore ?? '—'}
                      <span className="pl-1 text-xs font-normal text-ink-soft">{progressLabel(note.progressScore)}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

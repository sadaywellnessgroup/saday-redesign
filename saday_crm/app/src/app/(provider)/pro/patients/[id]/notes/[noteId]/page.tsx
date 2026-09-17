import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Lock } from 'lucide-react';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NoteEditor, type NoteDraft } from '@/components/provider/note-editor';
import { SupersedeButton } from '@/components/provider/signed-note-view';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { NOTE_MODES, interventionLabel, progressLabel, riskLabel } from '@/lib/clinical/note-spec';
import { formatISTDate, formatISTDateTime } from '@/lib/utils';
import type { RiskChip } from '@/lib/domain';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-4">
      <span className="w-52 flex-none text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-soft">{label}</span>
      <span className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-ink">{value || '—'}</span>
    </div>
  );
}

/** Route /pro/patients/[id]/notes/[noteId] — draft opens the editor, a
 * signed note renders read-only with a Supersede action and its version
 * chain below (ui-references §E-3). */
export default async function NotePage({ params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { id, noteId } = await params;
  const { providerId, displayName } = await requireProvider();

  const note = await repos.clinical.getSessionNote(noteId);
  if (!note || note.providerId !== providerId || note.patientId !== id) notFound();
  const patient = await repos.patient.getById(id);
  if (!patient) notFound();

  const versions = await repos.clinical.listNoteVersions(note.appointmentId);

  if (!note.signedAt) {
    const draft: NoteDraft = {
      id: note.id,
      patientId: note.patientId,
      sessionDate: note.sessionDate,
      durationMinutes: note.durationMinutes,
      mode: note.mode,
      presentingConcern: note.presentingConcern ?? '',
      mood: note.mood ?? '',
      affect: note.affect ?? '',
      risk: note.risk,
      behaviouralObservation: note.behaviouralObservation ?? '',
      narrative: note.narrative ?? '',
      interventions: note.interventions,
      homework: note.homework ?? '',
      goals: note.goals ?? '',
      nextFocus: note.nextFocus ?? '',
      progressScore: note.progressScore,
      followUpDate: note.followUpDate ?? '',
    };

    return (
      <div className="flex flex-col gap-4">
        <ConsoleHeading
          kicker={`${patient.displayName} · session note`}
          title={note.version > 1 ? `Draft · version ${note.version}` : 'Session note'}
          sub={`${formatISTDate(`${note.sessionDate}T06:00:00.000Z`)} · autosaves as you type`}
          actions={
            <Link
              href={`/pro/patients/${id}?tab=notes`}
              className="inline-flex min-h-11 items-center rounded-full bg-card px-4 text-[13.5px] font-semibold text-indigo no-underline shadow-feather"
            >
              All notes
            </Link>
          }
        />
        <NoteEditor initial={draft} therapistName={displayName} patientName={patient.displayName} />
      </div>
    );
  }

  const modeLabel = NOTE_MODES.find((m) => m.value === note.mode)?.label ?? note.mode;

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading
        kicker={`${patient.displayName} · session note`}
        title={`Signed note${note.version > 1 ? ` · version ${note.version}` : ''}`}
        sub={`Signed ${formatISTDateTime(note.signedAt)} — locked`}
        actions={
          <>
            <Link
              href={`/pro/patients/${id}?tab=notes`}
              className="inline-flex min-h-11 items-center rounded-full bg-card px-4 text-[13.5px] font-semibold text-indigo no-underline shadow-feather"
            >
              All notes
            </Link>
            {!note.supersededAt ? <SupersedeButton noteId={note.id} patientId={id} version={note.version} /> : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-soft bg-lilac-tint px-4 py-3 text-[13.5px] text-indigo-deep">
        <Lock className="h-4 w-4" />
        This note is signed and cannot be edited. A correction creates a new version; this one stays visible.
        {note.supersededAt ? <Badge variant="secondary">Superseded {formatISTDate(note.supersededAt)}</Badge> : null}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-5">
          <section>
            <h2 className="sec-title pb-1">Session details</h2>
            <Row label="Date" value={formatISTDate(`${note.sessionDate}T06:00:00.000Z`)} />
            <Row label="Duration" value={`${note.durationMinutes} minutes`} />
            <Row label="Mode" value={modeLabel} />
            <Row label="Therapist" value={displayName} />
          </section>

          <section>
            <h2 className="sec-title pb-1">Clinical assessment</h2>
            <Row label="Presenting concern" value={note.presentingConcern} />
            <Row label="Mood" value={note.mood} />
            <Row label="Affect" value={note.affect} />
            <Row
              label="Risk"
              value={
                <span className="flex flex-wrap gap-1.5">
                  {(note.risk as RiskChip[]).map((r) => (
                    <Badge key={r} variant={r === 'no_risk' ? 'secondary' : 'turmeric'}>
                      {riskLabel(r)}
                    </Badge>
                  ))}
                </span>
              }
            />
          </section>

          <section>
            <h2 className="sec-title pb-1">Session narrative</h2>
            <Row label="Behavioural observation" value={note.behaviouralObservation} />
            <Row label="Narrative" value={note.narrative} />
            <Row
              label="Interventions"
              value={
                <span className="flex flex-wrap gap-1.5">
                  {note.interventions.map((i) => (
                    <Badge key={i} variant="default">
                      {interventionLabel(i)}
                    </Badge>
                  ))}
                </span>
              }
            />
          </section>

          <section>
            <h2 className="sec-title pb-1">Plan &amp; next steps</h2>
            <Row label="Homework" value={note.homework} />
            <Row label="Goals" value={note.goals} />
            <Row label="Next session focus" value={note.nextFocus} />
            <Row
              label="Progress"
              value={`${note.progressScore ?? '—'} · ${progressLabel(note.progressScore)}`}
            />
            <Row
              label="Follow-up date"
              value={note.followUpDate ? formatISTDate(`${note.followUpDate}T06:00:00.000Z`) : '—'}
            />
          </section>
        </CardContent>
      </Card>

      {versions.length > 1 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">Version history</h2>
            {versions.map((v) => (
              <Link
                key={v.id}
                href={`/pro/patients/${id}/notes/${v.id}`}
                className="flex flex-wrap items-center gap-3 rounded-soft bg-cream px-4 py-2.5 text-[14px] no-underline"
              >
                <span className="font-semibold text-indigo-deep">v{v.version}</span>
                <span className="text-ink-soft">{v.signedAt ? formatISTDateTime(v.signedAt) : 'Draft'}</span>
                <span className="ml-auto text-ink-soft">
                  {v.supersededAt ? 'Superseded' : v.signedAt ? 'Live' : 'In progress'}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

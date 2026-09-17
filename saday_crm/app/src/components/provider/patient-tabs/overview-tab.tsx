import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ScoresOverTimeChart, type ScoreSeries } from '@/components/charts/scores-chart';
import { TrendChart } from '@/components/charts/trend-chart';
import { StatusPill } from '@/components/provider/status-pill';
import { repos } from '@/lib/repos';
import { SEVERITY_COLORS } from '@/lib/provider/console-data';
import type { Appointment, Patient } from '@/lib/domain';
import { formatISTDate, formatISTTime, formatISTWeekdayShort } from '@/lib/utils';

function since8WeeksKey(): string {
  return new Date(Date.now() - 56 * 86_400_000).toISOString().slice(0, 10);
}

/** Overview: scores-over-time (multi-tool overlay, ui-references §D),
 * 8-week mood + sleep mini charts, and the session timeline. */
export async function OverviewTab({ patient, appointments }: { patient: Patient; appointments: Appointment[] }) {
  const [submissions, tools, moodLogs, sleepLogs, followUps] = await Promise.all([
    repos.psychometrics.listSubmissionsForPatient(patient.id),
    repos.psychometrics.listTools(patient.organizationId),
    repos.selfTracking.listMoodLogs(patient.id, since8WeeksKey()),
    repos.selfTracking.listSleepLogs(patient.id, since8WeeksKey()),
    repos.followUp.listSubmissionsForPatient(patient.id),
  ]);

  const series: ScoreSeries[] = tools
    .map((tool) => {
      const points = submissions
        .filter((s) => s.toolId === tool.id)
        .map((s) => ({ dateISO: s.at.slice(0, 10), label: formatISTDate(s.at), value: s.total }));
      if (points.length === 0) return null;
      const totals = tool.scoring.total as { min: number; max: number } | undefined;
      return {
        toolId: tool.id,
        code: tool.code,
        name: tool.name,
        max: totals?.max ?? 27,
        bands: tool.bands.map((b) => ({
          label: b.label,
          min: b.min,
          max: b.max,
          color: SEVERITY_COLORS[b.severity] ?? '#F1ECF9',
        })),
        points,
      } satisfies ScoreSeries;
    })
    .filter((s): s is ScoreSeries => s !== null);

  const moodData = moodLogs.map((m) => ({
    dateISO: m.logDate,
    label: formatISTWeekdayShort(`${m.logDate}T12:00:00.000Z`),
    value: m.mood1to10,
  }));
  const sleepData = sleepLogs.map((s) => ({
    dateISO: s.logDate,
    label: formatISTWeekdayShort(`${s.logDate}T12:00:00.000Z`),
    value: s.hoursSlept,
  }));

  const timeline = [...appointments].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h2 className="sec-title">Scores over time</h2>
          <ScoresOverTimeChart series={series} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="sec-title">Mood · 8 weeks</h2>
            {moodData.length > 0 ? (
              <TrendChart data={moodData} domain={[1, 10]} height={150} />
            ) : (
              <p className="py-6 text-sm text-ink-soft">No mood logs yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="sec-title">Sleep · 8 weeks</h2>
            {sleepData.length > 0 ? (
              <TrendChart data={sleepData} domain={[0, 10]} unit="h" height={150} />
            ) : (
              <p className="py-6 text-sm text-ink-soft">No sleep logs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {followUps.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <h2 className="sec-title">Follow-up responses</h2>
            <div className="flex flex-col gap-2">
              {followUps.slice(0, 4).map((submission) => (
                <div key={submission.id} className="rounded-soft bg-cream px-4 py-3">
                  <p className="text-xs text-ink-soft">{formatISTDate(submission.submittedAt)}</p>
                  <p className="text-[14.5px] text-ink">
                    {typeof submission.responses.note === 'string' ? submission.responses.note : '—'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h2 className="sec-title">Sessions</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-soft">No sessions yet.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {timeline.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex flex-wrap items-center gap-2 rounded-soft bg-cream px-4 py-3"
                >
                  <span className="w-[112px] flex-none text-[14px] font-semibold text-indigo-deep">
                    {formatISTDate(appointment.scheduledAt)}
                  </span>
                  <span className="text-sm text-ink-soft">{formatISTTime(appointment.scheduledAt)}</span>
                  <StatusPill status={appointment.status} className="ml-auto" />
                </li>
              ))}
            </ol>
          )}
          <Link href={`/pro/patients/${patient.id}?tab=notes`} className="text-[13.5px] font-semibold text-indigo no-underline">
            View session notes →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

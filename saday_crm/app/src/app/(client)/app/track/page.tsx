import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoodEntryForm } from '@/components/patient/mood-entry-form';
import { SleepEntryForm } from '@/components/patient/sleep-entry-form';
import { TrendChart, Legend } from '@/components/charts/trend-chart';
import { getSession } from '@/lib/auth/session';
import { repos, ORG_ID } from '@/lib/repos';
import { formatISTDate, formatISTWeekdayShort } from '@/lib/utils';

const SEVERITY_COLORS: Record<string, string> = {
  minimal: '#F1ECF9',
  mild: '#D69A3C',
  moderate: '#B0522E',
  moderately_severe: '#8E4225',
  severe: '#8E4225',
};

function since8Weeks(): string {
  return new Date(Date.now() - 56 * 86_400_000).toISOString().slice(0, 10);
}

/** Route 10 — Mood / Sleep / Assessments tabs. Chart styling follows
 * ui-references §D: indigo line, no gridlines, severity bands as tinted
 * areas, IST dates, 8-week default window. */
export default async function TrackPage() {
  const t = await getTranslations('appTrack');
  const session = await getSession();
  const patientId = session?.patientId;

  const [moodLogs, sleepLogs, tools, allSubmissions] = await Promise.all([
    patientId ? repos.selfTracking.listMoodLogs(patientId, since8Weeks()) : Promise.resolve([]),
    patientId ? repos.selfTracking.listSleepLogs(patientId, since8Weeks()) : Promise.resolve([]),
    repos.psychometrics.listTools(ORG_ID),
    patientId ? repos.psychometrics.listSubmissionsForPatient(patientId) : Promise.resolve([]),
  ]);

  const moodData = moodLogs.map((m) => ({ dateISO: m.logDate, label: formatISTWeekdayShort(`${m.logDate}T12:00:00.000Z`), value: m.mood1to10 }));
  const sleepData = sleepLogs.map((s) => ({ dateISO: s.logDate, label: formatISTWeekdayShort(`${s.logDate}T12:00:00.000Z`), value: s.hoursSlept }));

  const todayISO = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  const oneWeekAgoISO = new Date(Date.now() - 7 * 86_400_000).toISOString();

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="waves" />

      <Tabs defaultValue="mood">
        <TabsList>
          <TabsTrigger value="mood">{t('tabMood')}</TabsTrigger>
          <TabsTrigger value="sleep">{t('tabSleep')}</TabsTrigger>
          <TabsTrigger value="assessments">{t('tabAssessments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="mood" className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="sec-title pb-3">{t('todaysEntry')}</h2>
              <MoodEntryForm />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h2 className="sec-title pb-2">{t('mood8Weeks')}</h2>
              {moodData.length > 0 ? <TrendChart data={moodData} domain={[1, 10]} /> : <p className="text-sm text-ink-soft">{t('noHistory')}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep" className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="sec-title pb-3">{t('todaysEntry')}</h2>
              <SleepEntryForm />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h2 className="sec-title pb-2">{t('sleepHoursChart')}</h2>
              {sleepData.length > 0 ? <TrendChart data={sleepData} domain={[0, 10]} unit="h" /> : <p className="text-sm text-ink-soft">{t('noHistory')}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <h2 className="sec-title">{t('assessmentsAssigned')}</h2>
              {tools.map((tool) => {
                const submissionsForTool = allSubmissions.filter((s) => s.toolId === tool.id);
                const latest = submissionsForTool.at(-1);
                const doneThisWeek = latest ? latest.at >= oneWeekAgoISO : false;
                return (
                  <div key={tool.id} className="flex items-center justify-between rounded-soft bg-cream px-4 py-3">
                    <div>
                      <p className="text-[14.5px] font-semibold text-ink">{tool.code}</p>
                      <Badge variant={doneThisWeek ? 'secondary' : 'turmeric'} className="mt-1">
                        {doneThisWeek ? t('statusDone') : t('statusDue')}
                      </Badge>
                    </div>
                    <Link href={`/app/track/assess/${tool.id}`} className="btn btn-ghost !px-5 !py-2 text-[13px]">
                      {doneThisWeek ? t('retake') : t('start')}
                    </Link>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {tools.map((tool) => {
            const submissionsForTool = allSubmissions.filter((s) => s.toolId === tool.id);
            if (submissionsForTool.length === 0) return null;
            const chartData = submissionsForTool.map((s) => ({
              dateISO: s.at.slice(0, 10),
              label: formatISTDate(s.at),
              value: s.total,
            }));
            const domain: [number, number] = [tool.bands[0]?.min ?? 0, tool.bands.at(-1)?.max ?? 27];
            const bands = tool.bands.map((b) => ({ label: b.label, min: b.min, max: b.max, color: SEVERITY_COLORS[b.severity] ?? '#F1ECF9' }));
            return (
              <Card key={tool.id}>
                <CardContent className="flex flex-col gap-2 pt-6">
                  <h2 className="sec-title">{tool.code} — {t('assessmentsHistory')}</h2>
                  <TrendChart data={chartData} bands={bands} domain={domain} />
                  <Legend bands={bands} />
                  <table className="mt-2 w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-ink-soft">
                        <th className="py-1 font-semibold">{t('dateCol')}</th>
                        <th className="py-1 font-semibold">{t('scoreCol')}</th>
                        <th className="py-1 font-semibold">{t('bandCol')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...submissionsForTool].reverse().map((s) => (
                        <tr key={s.id}>
                          <td className="py-1 text-ink-soft">{formatISTDate(s.at)}</td>
                          <td className="py-1 font-semibold text-ink">{s.total}</td>
                          <td className="py-1 text-ink-soft">{s.band}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

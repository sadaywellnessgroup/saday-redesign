import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuickLogSheets } from '@/components/patient/quick-log-sheets';
import { TrendChart } from '@/components/charts/trend-chart';
import { getSession } from '@/lib/auth/session';
import { repos } from '@/lib/repos';
import { formatISTDateTime, formatISTWeekdayShort, formatPaise } from '@/lib/utils';

const JOIN_OPENS_BEFORE_MIN = 10;

/** Route 8 — client home. Upgrades the P1 demo route: greeting,
 * next-session card with a Join button gated to 10 min before start,
 * quick-log row (Sheets), 8-week mood sparkline, latest scores tile,
 * recent files, unread-messages count. Motif is allowed here (welcome
 * surface, ui-references §A). */
export default async function ClientHomePage() {
  const t = await getTranslations('appHome');
  const session = await getSession();
  const patientId = session?.patientId;
  const now = new Date();

  const [appointments, moodLogs, submissions, files, threads] = await Promise.all([
    patientId ? repos.booking.listForPatient(patientId) : Promise.resolve([]),
    patientId ? repos.selfTracking.listMoodLogs(patientId) : Promise.resolve([]),
    patientId ? repos.psychometrics.listSubmissionsForPatient(patientId) : Promise.resolve([]),
    patientId ? repos.file.listForPatient(patientId) : Promise.resolve([]),
    patientId ? repos.messaging.listThreadsForPatient(patientId) : Promise.resolve([]),
  ]);

  const upcoming = appointments
    .filter((a) => a.status === 'scheduled' && a.scheduledAt >= now.toISOString())
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  const upcomingProvider = upcoming ? await repos.provider.getById(upcoming.providerId) : null;
  const canJoin = upcoming ? new Date(upcoming.scheduledAt).getTime() - now.getTime() <= JOIN_OPENS_BEFORE_MIN * 60_000 : false;

  const last8Weeks = moodLogs.slice(-56);
  const sparkData = last8Weeks.map((m) => ({ dateISO: m.logDate, label: formatISTWeekdayShort(`${m.logDate}T12:00:00.000Z`), value: m.mood1to10 }));

  const latestByTool = new Map<string, (typeof submissions)[number]>();
  for (const s of submissions) latestByTool.set(s.toolId, s); // list is ascending, so later writes win = latest

  const allThreadIds = new Set(threads.map((t2) => t2.id));
  const allMessages = patientId ? await Promise.all(threads.map((th) => repos.messaging.listMessages(th.id))) : [];
  const unreadCount = allMessages.flat().filter((m) => allThreadIds.has(m.threadId) && m.senderRole === 'provider' && !m.readAt).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading kicker="Saday" title={t('greeting', { name: session?.displayName ?? '' })} motif="lotus" />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="sec-title">{t('nextSessionTitle')}</h2>
          {upcoming && upcomingProvider ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg text-indigo-deep">{upcomingProvider.displayName}</p>
                <Badge variant="outline">{formatPaise(upcoming.pricePaise)}</Badge>
              </div>
              <p className="text-sm text-ink-soft">{formatISTDateTime(upcoming.scheduledAt)} IST</p>
              <Button disabled={!canJoin} size="lg" className="h-12 self-start px-8">
                {canJoin ? t('join') : `${t('join')} · ${t('joinOpensIn')}`}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-ink-soft">{t('noNextSession')}</p>
              <Button asChild size="lg" className="h-11">
                <Link href="/providers">{t('bookOne')}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <QuickLogSheets />

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="sec-title">{t('moodTrendTitle')}</h2>
            <Link href="/app/track" className="text-xs font-semibold text-indigo">
              {t('viewAll')}
            </Link>
          </div>
          {sparkData.length > 0 ? <TrendChart data={sparkData} domain={[1, 10]} height={140} /> : <p className="text-sm text-ink-soft">{t('noMoodYet')}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <h2 className="sec-title">{t('scoresTitle')}</h2>
            {latestByTool.size > 0 ? (
              <div className="flex flex-col gap-2">
                {[...latestByTool.values()].map((s) => (
                  <div key={s.toolId} className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{s.toolId.includes('phq9') ? 'PHQ-9' : s.toolId.includes('gad7') ? 'GAD-7' : s.toolId}</span>
                    <Badge>{s.band ?? s.total}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">{t('noScoresYet')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <h2 className="sec-title">{t('filesTitle')}</h2>
            {files.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {files.slice(0, 3).map((f) => (
                  <p key={f.id} className="truncate text-sm text-ink-soft">
                    {f.originalName ?? f.storagePath}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">{t('noFilesYet')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Link href="/app/messages" className="no-underline">
        <Card className="transition-transform hover:-translate-y-0.5">
          <CardContent className="flex items-center justify-between pt-6">
            <h2 className="sec-title">{t('messagesTitle')}</h2>
            {unreadCount > 0 ? <Badge variant="turmeric">{t('unreadCount', { count: unreadCount })}</Badge> : <span className="text-sm text-ink-soft">{t('noUnread')}</span>}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

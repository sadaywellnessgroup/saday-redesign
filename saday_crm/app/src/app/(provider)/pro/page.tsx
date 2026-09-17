import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CalendarClock, ChevronRight, FileText, MessageSquareText, Wallet } from 'lucide-react';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPill } from '@/components/provider/status-pill';
import { AppointmentSheet } from '@/components/provider/appointment-sheet';
import { repos } from '@/lib/repos';
import {
  enrich,
  formatDayHeading,
  istDateKey,
  requireProvider,
  toSummary,
} from '@/lib/provider/console-data';
import { filterByPeriod, sumLedger } from '@/lib/provider/earnings-totals';
import { formatISTDate, formatISTTime, formatPaise } from '@/lib/utils';

/** Route /pro — Today. The "Unwritten notes" strip is MantraCare's
 * "Unbilled sessions" pattern (digest §11) pointed at notes instead of
 * invoices: completed sessions that have no signed note yet. */
export default async function ProviderTodayPage() {
  const t = await getTranslations('pro.today');
  const { providerId } = await requireProvider();
  const now = new Date();
  const todayKey = istDateKey(now);

  const [allAppointments, ledger, pendingFollowUps, unreadByPatient] = await Promise.all([
    repos.booking.listForProvider(providerId),
    repos.earnings.listLedgerForProvider(providerId),
    repos.followUp.countPendingForProvider(providerId),
    repos.messaging.countUnreadForProvider(providerId),
  ]);

  const todays = allAppointments.filter((a) => istDateKey(a.scheduledAt) === todayKey);
  const todayRows = await enrich(todays);

  const completedWithoutSignedNote = allAppointments.filter(
    (a) => a.status === 'completed' && !a.hasSignedNote,
  );
  const unwrittenRows = await enrich(completedWithoutSignedNote.slice(0, 6));

  // Week earnings: the last 7 IST days including today.
  const weekFrom = new Date(now.getTime() - 6 * 86_400_000);
  const weekEntries = filterByPeriod(ledger, { fromDate: istDateKey(weekFrom), toDate: todayKey });
  const weekTotals = sumLedger(weekEntries);

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={formatDayHeading(todayKey)} motif="mandala" />

      {/* tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 pt-5">
            <span className="kicker"><span className="sq" /> {t('weekEarnings')}</span>
            <p className="font-display text-2xl text-indigo-deep">{formatPaise(weekTotals.netPaise)}</p>
            <p className="text-xs text-ink-soft">{t('weekEarningsSub', { count: weekTotals.sessions })}</p>
            <Link href="/pro/earnings" className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo no-underline">
              <Wallet className="h-3.5 w-3.5" /> {t('openEarnings')}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 pt-5">
            <span className="kicker"><span className="sq" /> {t('unwrittenTile')}</span>
            <p className="font-display text-2xl text-indigo-deep">{completedWithoutSignedNote.length}</p>
            <p className="text-xs text-ink-soft">{t('unwrittenTileSub')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 pt-5">
            <span className="kicker"><span className="sq" /> {t('followUpsTile')}</span>
            <p className="font-display text-2xl text-indigo-deep">{pendingFollowUps}</p>
            <p className="text-xs text-ink-soft">{t('followUpsTileSub')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1 pt-5">
            <span className="kicker"><span className="sq" /> {t('availabilityTile')}</span>
            <p className="text-sm text-ink-soft">{t('availabilityTileSub')}</p>
            <Link
              href="/pro/availability"
              className="mt-2 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-indigo px-4 text-[13.5px] font-semibold text-cream no-underline"
            >
              <CalendarClock className="h-4 w-4" /> {t('editAvailability')}
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* unwritten notes strip */}
      {unwrittenRows.length > 0 ? (
        <section className="rounded-softer bg-lilac-tint p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <FileText className="h-4 w-4 text-indigo" />
            <h2 className="font-display text-[17px] font-semibold text-indigo-deep">{t('unwrittenTitle')}</h2>
            <span className="text-xs text-ink-soft">{t('unwrittenSub')}</span>
          </div>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {unwrittenRows.map((row) => (
              <Link
                key={row.appointment.id}
                href={
                  row.noteId
                    ? `/pro/patients/${row.appointment.patientId}/notes/${row.noteId}`
                    : `/pro/patients/${row.appointment.patientId}/notes/new?appointment=${row.appointment.id}`
                }
                className="flex min-h-[92px] w-[230px] flex-none flex-col justify-between rounded-soft bg-card p-3 no-underline shadow-feather"
              >
                <div>
                  <p className="text-[14.5px] font-semibold text-indigo-deep">{row.patient?.displayName ?? '—'}</p>
                  <p className="text-xs text-ink-soft">
                    {formatISTDate(row.appointment.scheduledAt)} · {row.sessionType?.nameEn ?? 'Session'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo">
                  {row.noteId ? t('continueDraft') : t('writeNote')} <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* today's appointments */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className="sec-title min-w-0">{t('scheduleTitle')}</h2>
          <Link href="/pro/calendar" className="flex-none text-[13.5px] font-semibold text-indigo no-underline">
            {t('openCalendar')}
          </Link>
        </div>

        {todayRows.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-ink-soft">{t('noSessions')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {todayRows.map((row) => {
              const summary = toSummary(row, now);
              const noteHref = row.noteId
                ? `/pro/patients/${row.appointment.patientId}/notes/${row.noteId}`
                : `/pro/patients/${row.appointment.patientId}/notes/new?appointment=${row.appointment.id}`;
              const unread = unreadByPatient.get(row.appointment.patientId) ?? 0;
              return (
                <Card key={row.appointment.id}>
                  <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex w-full items-start gap-4 sm:w-auto sm:flex-1">
                      <div className="flex w-[74px] flex-none flex-col rounded-soft bg-cream px-2 py-2 text-center">
                        <span className="font-display text-[15px] font-semibold text-indigo-deep">
                          {formatISTTime(row.appointment.scheduledAt)}
                        </span>
                        <span className="text-[11px] text-ink-soft">{row.appointment.durationMinutes} min</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/pro/patients/${row.appointment.patientId}`}
                            className="font-display text-[17px] text-indigo-deep no-underline"
                          >
                            {row.patient?.displayName ?? 'Patient'}
                          </Link>
                          <StatusPill status={row.appointment.status} />
                          {unread > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta">
                              <MessageSquareText className="h-3.5 w-3.5" /> {unread}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-ink-soft">
                          {row.sessionType?.nameEn ?? 'Session'} · {row.appointment.mode === 'online' ? t('modeOnline') : t('modeInPerson')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={noteHref} className="no-underline">
                        <span className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-[13.5px] font-semibold text-indigo shadow-[inset_0_0_0_1.5px_var(--line)]">
                          {row.noteSigned ? t('viewNote') : row.noteId ? t('continueDraft') : t('writeNote')}
                        </span>
                      </Link>
                      <AppointmentSheet
                        appointment={summary}
                        triggerClassName="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream"
                        triggerLabel={t('details')}
                      >
                        {t('details')}
                      </AppointmentSheet>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

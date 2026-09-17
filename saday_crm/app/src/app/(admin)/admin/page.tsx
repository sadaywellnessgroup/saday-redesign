import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin, istDateKey, weekStartKey, addDaysKey } from '@/lib/admin/console-data';
import { formatISTDate, formatISTTime, formatPaise } from '@/lib/utils';
import { patientInitials } from '@/lib/provider/earnings-totals';

const PAYMENT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'turmeric'> = {
  captured: 'default',
  refunded: 'secondary',
  partially_refunded: 'turmeric',
  failed: 'destructive',
  attempted: 'turmeric',
  created: 'secondary',
};

/** Route /admin — the console's home: organisation-wide tiles, today's
 * cross-provider schedule and recent payments. Admin is metadata-only on
 * clinical bodies (D-020/D-029) — nothing here touches a note, proforma,
 * score or message body. */
export default async function AdminDashboardPage() {
  const t = await getTranslations('shell.admin');
  await requireAdmin();

  const now = new Date();
  const today = istDateKey(now);
  const weekStart = weekStartKey(today);
  const weekEnd = addDaysKey(weekStart, 7);
  const monthPrefix = today.slice(0, 7); // "YYYY-MM"

  const providers = await repos.provider.listAll(ORG_ID);
  const [patients, allLedgers, refunds, payments] = await Promise.all([
    repos.patient.listForOrganization(ORG_ID),
    Promise.all(providers.map((p) => repos.earnings.listLedgerForProvider(p.id))),
    repos.payment.listRefundsForOrganization(ORG_ID),
    repos.payment.listForOrganization(ORG_ID),
  ]);
  const appointmentsByProvider = await Promise.all(providers.map((p) => repos.booking.listForProvider(p.id)));
  const allAppointments = appointmentsByProvider.flat();
  const ledger = allLedgers.flat();

  const isLive = (status: string) => !status.startsWith('cancelled');
  const sessionsToday = allAppointments.filter((a) => isLive(a.status) && istDateKey(a.scheduledAt) === today);
  const sessionsThisWeek = allAppointments.filter(
    (a) => isLive(a.status) && istDateKey(a.scheduledAt) >= weekStart && istDateKey(a.scheduledAt) < weekEnd,
  );
  const revenueThisMonthPaise = ledger
    .filter((e) => e.realisedAt.slice(0, 10) >= `${monthPrefix}-01` && istDateKey(e.realisedAt).startsWith(monthPrefix))
    .reduce((sum, e) => sum + e.grossAmountPaise, 0);
  const pendingPayoutPaise = ledger
    .filter((e) => e.payoutStatus === 'pending')
    .reduce((sum, e) => sum + (e.netAmountPaise - e.refundedPaise), 0);
  const pendingRefunds = refunds.filter((r) => r.status === 'pending');
  const pendingFollowUps = await repos.notification.listPending(now.toISOString());
  const unansweredFollowUps = pendingFollowUps.filter(
    (n) => n.purpose === 'follow_up_check_in' || n.purpose === 'follow_up_feedback',
  );

  const providerById = new Map(providers.map((p) => [p.id, p]));
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const todaysSchedule = sessionsToday
    .slice()
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .map((a) => ({
      id: a.id,
      time: formatISTTime(a.scheduledAt),
      patient: patientById.get(a.patientId)?.displayName ?? 'Patient',
      provider: providerById.get(a.providerId)?.displayName ?? 'Provider',
      status: a.status,
    }));

  const recentPayments = payments.slice(0, 6).map((p) => ({
    id: p.id,
    date: formatISTDate(p.createdAt),
    patientInitials: patientInitials(patientById.get(p.patientId)?.displayName ?? ''),
    provider: providerById.get(allAppointments.find((a) => a.id === p.appointmentId)?.providerId ?? '')?.displayName ?? '—',
    amount: formatPaise(p.amountPaise),
    status: p.status,
  }));

  const tiles = [
    { label: t('tileSessionsToday'), value: String(sessionsToday.length) },
    { label: t('tileSessionsWeek'), value: String(sessionsThisWeek.length) },
    { label: t('tileRevenueMonth'), value: formatPaise(revenueThisMonthPaise) },
    { label: t('tilePendingPayouts'), value: formatPaise(pendingPayoutPaise) },
    { label: t('tilePendingRefunds'), value: String(pendingRefunds.length) },
    { label: t('tileUnansweredFollowUps'), value: String(unansweredFollowUps.length) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="tree-circle" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="kicker">
                <span className="sq" /> {tile.label}
              </span>
              <p className="font-display text-2xl text-indigo-deep">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <h2 className="sec-title">{t('todaysSchedule')}</h2>
            {todaysSchedule.length === 0 ? (
              <p className="text-sm text-ink-soft">{t('todaysScheduleEmpty')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {todaysSchedule.map((row) => (
                  <div key={row.id} className="flex items-center gap-3 rounded-soft bg-cream px-4 py-3">
                    <span className="w-16 flex-none text-[13px] font-semibold text-indigo-deep">{row.time}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">{row.patient}</p>
                      <p className="truncate text-xs text-ink-soft">{row.provider}</p>
                    </div>
                    <Badge variant={row.status === 'completed' ? 'default' : 'secondary'}>{row.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="sec-title">{t('recentPayments')}</h2>
              <Link href="/admin/payments" className="text-[13px] font-semibold text-indigo no-underline hover:underline">
                {t('viewAll')}
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-ink-soft">{t('recentPaymentsEmpty')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentPayments.map((row) => (
                  <div key={row.id} className="flex items-center gap-3 rounded-soft bg-cream px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink">
                        {row.patientInitials} <span className="text-ink-soft">· {row.provider}</span>
                      </p>
                      <p className="text-xs text-ink-soft">{row.date}</p>
                    </div>
                    <span className="text-[14px] font-semibold text-indigo-deep">{row.amount}</span>
                    <Badge variant={PAYMENT_STATUS_VARIANT[row.status] ?? 'secondary'}>{row.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

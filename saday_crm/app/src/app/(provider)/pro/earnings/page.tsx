import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import {
  filterByPeriod,
  patientInitials,
  standardPeriods,
  sumLedger,
  type Period,
} from '@/lib/provider/earnings-totals';
import { cn, formatISTDate, formatPaise } from '@/lib/utils';

const PAYOUT_LABEL: Record<string, string> = {
  pending: 'Pending',
  batched: 'Batched',
  paid: 'Paid',
  on_hold: 'On hold',
};

/** Route /pro/earnings — period tiles, the per-session ledger and the
 * payouts list. Money is integer paise throughout (D-012); only the
 * formatter turns it into ₹1,23,456. Patients appear as initials only. */
export default async function ProviderEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const t = await getTranslations('pro.earnings');
  const { providerId } = await requireProvider();
  const params = await searchParams;
  const now = new Date();

  const [ledger, payouts, provider, patients] = await Promise.all([
    repos.earnings.listLedgerForProvider(providerId),
    repos.earnings.listPayoutsForProvider(providerId),
    repos.provider.getById(providerId),
    repos.patient.listForProviderCaseload(providerId),
  ]);

  const periods = standardPeriods(now);
  const isCustom = params.period === 'custom' && params.from && params.to;
  const custom: Period | null = isCustom
    ? { key: 'custom', label: `${params.from} → ${params.to}`, fromDate: params.from!, toDate: params.to! }
    : null;
  const active = custom ?? periods.find((p) => p.key === params.period) ?? periods[0]!;

  const entries = filterByPeriod(ledger, active);
  const totals = sumLedger(entries);
  const allPending = sumLedger(ledger.filter((e) => e.payoutStatus !== 'paid'));
  const nameOf = (patientId: string) =>
    patientInitials(patients.find((p) => p.id === patientId)?.displayName ?? '');

  const tiles = [
    { label: t('gross'), value: formatPaise(totals.grossPaise), sub: t('grossSub', { count: totals.sessions }) },
    {
      label: t('commission'),
      value: formatPaise(totals.commissionPaise),
      sub: t('commissionSub', { pct: provider?.commissionPct ?? 20 }),
    },
    { label: t('net'), value: formatPaise(totals.netPaise), sub: t('netSub') },
    { label: t('pendingPayout'), value: formatPaise(allPending.pendingPayoutPaise), sub: t('pendingPayoutSub') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />

      {/* period selector */}
      <div className="flex flex-col gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {periods.map((period) => {
            const isActive = !custom && period.key === active.key;
            return (
              <Link
                key={period.key}
                href={`/pro/earnings?period=${period.key}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold no-underline',
                  isActive ? 'bg-indigo text-cream shadow-feather' : 'bg-card text-indigo shadow-feather hover:bg-lilac-tint',
                )}
              >
                {period.label}
              </Link>
            );
          })}
        </div>

        <form action="/pro/earnings" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="period" value="custom" />
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
            {t('from')}
            <input
              type="date"
              name="from"
              defaultValue={custom?.fromDate ?? active.fromDate}
              className="h-11 rounded-soft bg-card px-3 text-[14px] text-ink shadow-feather outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
            {t('to')}
            <input
              type="date"
              name="to"
              defaultValue={custom?.toDate ?? active.toDate}
              className="h-11 rounded-soft bg-card px-3 text-[14px] text-ink shadow-feather outline-none"
            />
          </label>
          <button
            type="submit"
            className={cn(
              'inline-flex min-h-11 items-center rounded-full px-5 text-[13.5px] font-semibold',
              custom ? 'bg-indigo text-cream' : 'bg-card text-indigo shadow-feather',
            )}
          >
            {t('applyRange')}
          </button>
        </form>
      </div>

      {/* tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex flex-col gap-1 pt-5">
              <span className="kicker">
                <span className="sq" /> {tile.label}
              </span>
              <p className="font-display text-2xl text-indigo-deep">{tile.value}</p>
              <p className="text-xs text-ink-soft">{tile.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ledger */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h2 className="sec-title">{t('ledger')}</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('ledgerEmpty')}</p>
          ) : (
            <>
            {/* mobile: one card per session — a 7-column table cannot be
                read at 360px, and a side-scrolling money table invites
                mis-reads (D-033). */}
            <div className="flex flex-col gap-2 md:hidden">
              {entries.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1 rounded-soft bg-cream px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-indigo-deep">{nameOf(entry.patientId)}</span>
                    <span className="text-xs text-ink-soft">{entry.serviceLabel}</span>
                    <Badge variant={entry.payoutStatus === 'paid' ? 'default' : 'secondary'} className="ml-auto">
                      {PAYOUT_LABEL[entry.payoutStatus] ?? entry.payoutStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-soft">{formatISTDate(entry.realisedAt)}</p>
                  <dl className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px]">
                    <div className="flex gap-1">
                      <dt className="text-ink-soft">{t('colGross')}</dt>
                      <dd className="font-semibold text-ink">{formatPaise(entry.grossAmountPaise)}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="text-ink-soft">{t('colCommission')}</dt>
                      <dd className="font-semibold text-ink">−{formatPaise(entry.commissionPaise)}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt className="text-ink-soft">{t('colNet')}</dt>
                      <dd className="font-semibold text-indigo-deep">
                        {formatPaise(entry.netAmountPaise - entry.refundedPaise)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-soft bg-lilac-tint px-4 py-3">
                <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.06em] text-indigo-deep">
                  {t('total')}
                </span>
                <span className="font-display text-[17px] text-indigo-deep">{formatPaise(totals.netPaise)}</span>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">
                    <th className="py-2 pr-3 font-bold">{t('colDate')}</th>
                    <th className="py-2 pr-3 font-bold">{t('colPatient')}</th>
                    <th className="py-2 pr-3 font-bold">{t('colType')}</th>
                    <th className="py-2 pr-3 text-right font-bold">{t('colGross')}</th>
                    <th className="py-2 pr-3 text-right font-bold">{t('colCommission')}</th>
                    <th className="py-2 pr-3 text-right font-bold">{t('colNet')}</th>
                    <th className="py-2 text-right font-bold">{t('colPayout')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={entry.id} className={cn(i % 2 === 1 && 'bg-cream/70')}>
                      <td className="py-2.5 pr-3 text-ink-soft">{formatISTDate(entry.realisedAt)}</td>
                      <td className="py-2.5 pr-3 font-semibold text-indigo-deep">{nameOf(entry.patientId)}</td>
                      <td className="py-2.5 pr-3 text-ink-soft">{entry.serviceLabel}</td>
                      <td className="py-2.5 pr-3 text-right text-ink">{formatPaise(entry.grossAmountPaise)}</td>
                      <td className="py-2.5 pr-3 text-right text-ink-soft">
                        −{formatPaise(entry.commissionPaise)}
                        <span className="pl-1 text-[11px]">({entry.commissionPct}%)</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-indigo-deep">
                        {formatPaise(entry.netAmountPaise - entry.refundedPaise)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant={entry.payoutStatus === 'paid' ? 'default' : 'secondary'}>
                          {PAYOUT_LABEL[entry.payoutStatus] ?? entry.payoutStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-lilac-tint">
                    <td className="py-2.5 pr-3 font-bold text-indigo-deep" colSpan={3}>
                      {t('total')}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-bold text-indigo-deep">{formatPaise(totals.grossPaise)}</td>
                    <td className="py-2.5 pr-3 text-right font-bold text-indigo-deep">−{formatPaise(totals.commissionPaise)}</td>
                    <td className="py-2.5 pr-3 text-right font-bold text-indigo-deep">{formatPaise(totals.netPaise)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* payouts */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h2 className="sec-title">{t('payouts')}</h2>
          {payouts.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('payoutsEmpty')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex flex-wrap items-center gap-3 rounded-soft bg-cream px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold text-indigo-deep">{formatPaise(payout.totalAmountPaise)}</p>
                    <p className="text-xs text-ink-soft">
                      {formatISTDate(`${payout.periodStart}T06:00:00.000Z`)} –{' '}
                      {formatISTDate(`${payout.periodEnd}T06:00:00.000Z`)}
                      {payout.bankReferenceId ? ` · ${payout.bankReferenceId}` : ''}
                    </p>
                  </div>
                  <Badge variant={payout.status === 'paid' ? 'default' : 'turmeric'}>{payout.status}</Badge>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-ink-soft">{t('payoutsNote')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

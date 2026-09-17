import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefundMarkButton } from '@/components/admin/refund-mark-button';
import { PayoutMarkPaid } from '@/components/admin/payout-mark-paid';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { patientInitials } from '@/lib/provider/earnings-totals';
import { cn, formatISTDate, formatISTDateTime, formatPaise } from '@/lib/utils';

type Tab = 'payments' | 'refunds' | 'payouts';
const TABS: Tab[] = ['payments', 'refunds', 'payouts'];

const PAYMENT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'turmeric'> = {
  captured: 'default',
  refunded: 'secondary',
  partially_refunded: 'turmeric',
  failed: 'destructive',
  attempted: 'turmeric',
  created: 'secondary',
};

/** Route /admin/payments — tabs Payments / Refunds / Payouts (D-020).
 * Refunds and payouts are marked manually by admin (D-018/D-020). */
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations('admin.payments');
  await requireAdmin();
  const params = await searchParams;
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'payments';

  const [payments, refunds, providers, payoutHistory] = await Promise.all([
    repos.payment.listForOrganization(ORG_ID),
    repos.payment.listRefundsForOrganization(ORG_ID),
    repos.provider.listAll(ORG_ID),
    repos.earnings.listPayoutsForOrganization(ORG_ID),
  ]);

  const providerNameById = new Map(providers.map((p) => [p.id, p.displayName]));
  const patientMap = new Map<string, string>();
  for (const p of await repos.patient.listForOrganization(ORG_ID)) patientMap.set(p.id, p.displayName);

  const providerOfAppointment = new Map<string, string>();
  for (const p of providers) {
    const appts = await repos.booking.listForProvider(p.id);
    for (const a of appts) providerOfAppointment.set(a.id, p.id);
  }

  const paymentRows = payments.map((p) => ({
    id: p.id,
    date: formatISTDate(p.createdAt),
    patient: patientInitials(patientMap.get(p.patientId) ?? ''),
    provider: providerNameById.get(providerOfAppointment.get(p.appointmentId) ?? '') ?? '—',
    amount: formatPaise(p.amountPaise),
    orderId: p.razorpayOrderId,
    paymentId: p.razorpayPaymentId ?? '—',
    status: p.status,
  }));

  const refundRows = refunds.map((r) => {
    const payment = payments.find((p) => p.id === r.paymentId);
    return {
      id: r.id,
      date: payment ? formatISTDate(payment.createdAt) : '—',
      patient: patientInitials(patientMap.get(payment?.patientId ?? '') ?? ''),
      amount: formatPaise(r.amountPaise),
      reason: r.reason ?? '—',
      status: r.status,
      processedAt: r.processedAt ? formatISTDateTime(r.processedAt) : null,
      processedBy: r.processedByUserId,
    };
  });

  const pendingByProvider = await Promise.all(
    providers.map(async (p) => {
      const pending = await repos.earnings.listPendingForProvider(p.id);
      const totalPaise = pending.reduce((sum, e) => sum + (e.netAmountPaise - e.refundedPaise), 0);
      return { providerId: p.id, providerName: p.displayName, count: pending.length, totalPaise };
    }),
  );
  const duePayouts = pendingByProvider.filter((row) => row.count > 0);

  const tabHref = (next: Tab) => (next === 'payments' ? '/admin/payments' : `/admin/payments?tab=${next}`);

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((tabKey) => (
          <Link
            key={tabKey}
            href={tabHref(tabKey)}
            aria-current={tab === tabKey ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold no-underline',
              tab === tabKey ? 'bg-indigo text-cream shadow-feather' : 'bg-card text-indigo shadow-feather hover:bg-lilac-tint',
            )}
          >
            {t(tabKey === 'payments' ? 'tabPayments' : tabKey === 'refunds' ? 'tabRefunds' : 'tabPayouts')}
          </Link>
        ))}
      </div>

      {tab === 'payments' ? (
        paymentRows.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-ink-soft">{t('paymentsEmpty')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* mobile: one card per payment — a 7-column table cannot be
                read at 360px (same reasoning as /pro/earnings' ledger). */}
            <div className="flex flex-col gap-2 md:hidden">
              {paymentRows.map((row) => (
                <div key={row.id} className="flex flex-col gap-1 rounded-softer bg-card px-4 py-3 shadow-feather">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-indigo-deep">{row.patient}</span>
                    <span className="text-xs text-ink-soft">· {row.provider}</span>
                    <Badge variant={PAYMENT_STATUS_VARIANT[row.status] ?? 'secondary'} className="ml-auto">
                      {row.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-soft">{row.date}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-ink-soft">{row.orderId}</span>
                    <span className="font-display text-[16px] text-indigo-deep">{row.amount}</span>
                  </div>
                </div>
              ))}
            </div>

            <Card className="hidden md:block">
              <CardContent className="pt-5">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-[14px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">
                        <th className="py-2 pr-3 font-bold">{t('colDate')}</th>
                        <th className="py-2 pr-3 font-bold">{t('colPatient')}</th>
                        <th className="py-2 pr-3 font-bold">{t('colProvider')}</th>
                        <th className="py-2 pr-3 text-right font-bold">{t('colAmount')}</th>
                        <th className="py-2 pr-3 font-bold">{t('colRazorpayOrder')}</th>
                        <th className="py-2 pr-3 font-bold">{t('colRazorpayPayment')}</th>
                        <th className="py-2 font-bold">{t('colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentRows.map((row, i) => (
                        <tr key={row.id} className={cn(i % 2 === 1 && 'bg-cream/70')}>
                          <td className="py-2.5 pr-3 text-ink-soft">{row.date}</td>
                          <td className="py-2.5 pr-3 font-semibold text-indigo-deep">{row.patient}</td>
                          <td className="py-2.5 pr-3 text-ink-soft">{row.provider}</td>
                          <td className="py-2.5 pr-3 text-right text-ink">{row.amount}</td>
                          <td className="py-2.5 pr-3 text-xs text-ink-soft">{row.orderId}</td>
                          <td className="py-2.5 pr-3 text-xs text-ink-soft">{row.paymentId}</td>
                          <td className="py-2.5">
                            <Badge variant={PAYMENT_STATUS_VARIANT[row.status] ?? 'secondary'}>{row.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )
      ) : null}

      {tab === 'refunds' ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            {refundRows.length === 0 ? (
              <p className="text-sm text-ink-soft">{t('refundsEmpty')}</p>
            ) : (
              refundRows.map((row) => (
                <div key={row.id} className="flex flex-col gap-2 rounded-soft bg-cream px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">
                      {row.patient} <span className="font-normal text-ink-soft">· {row.date}</span>
                    </p>
                    <p className="text-xs text-ink-soft">{row.reason}</p>
                    {row.status === 'processed' && row.processedAt ? (
                      <p className="text-xs text-ink-soft">
                        {t('refundsProcessedNote', { who: row.processedBy ? 'Admin' : '—', when: row.processedAt })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[16px] text-indigo-deep">{row.amount}</span>
                    {row.status === 'processed' ? (
                      <Badge>{row.status}</Badge>
                    ) : (
                      <RefundMarkButton refundId={row.id} label={t('refundsMarkProcessed')} toast={t('refundsMarked')} />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'payouts' ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 pt-5">
              <h2 className="sec-title">{t('payoutsPendingTitle')}</h2>
              {duePayouts.length === 0 ? (
                <p className="text-sm text-ink-soft">{t('payoutsPendingEmpty')}</p>
              ) : (
                duePayouts.map((row) => (
                  <div key={row.providerId} className="flex flex-col gap-2 rounded-soft bg-cream px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{row.providerName}</p>
                      <p className="text-xs text-ink-soft">{row.count} session(s) pending</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-[16px] text-indigo-deep">{formatPaise(row.totalPaise)}</span>
                      <PayoutMarkPaid
                        providerId={row.providerId}
                        referencePlaceholder={t('payoutsReferenceLabel')}
                        buttonLabel={t('payoutsMarkPaid')}
                        toastLabel={t('payoutsMarked')}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 pt-5">
              <h2 className="sec-title">{t('payoutsHistoryTitle')}</h2>
              {payoutHistory.length === 0 ? (
                <p className="text-sm text-ink-soft">{t('payoutsHistoryEmpty')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {payoutHistory.map((payout) => (
                    <div key={payout.id} className="flex flex-wrap items-center gap-3 rounded-soft bg-cream px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-semibold text-indigo-deep">
                          {providerNameById.get(payout.providerId) ?? '—'} · {formatPaise(payout.totalAmountPaise)}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {formatISTDate(`${payout.periodStart}T06:00:00.000Z`)} – {formatISTDate(`${payout.periodEnd}T06:00:00.000Z`)}
                          {payout.bankReferenceId ? ` · ${payout.bankReferenceId}` : ''}
                        </p>
                      </div>
                      <Badge variant={payout.status === 'paid' ? 'default' : 'turmeric'}>{payout.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

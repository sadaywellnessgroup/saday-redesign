import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { CLINICAL_STATUS_LABEL, clinicalStatus, lastSession, maskedPhone, sexLabel } from '@/lib/provider/patient-status';
import { cn, formatISTDate } from '@/lib/utils';

/** Route /admin/clients — name, masked phone, age·sex, provider(s),
 * session count, last session, status. Metadata only (D-020): no
 * clinical content is fetched or shown here at all. */
export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations('admin.clients');
  await requireAdmin();
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const now = new Date();

  const [patients, providers] = await Promise.all([
    repos.patient.listForOrganization(ORG_ID),
    repos.provider.listAll(ORG_ID),
  ]);
  const providerNameById = new Map(providers.map((p) => [p.id, p.displayName]));

  const rows = await Promise.all(
    patients.map(async (patient) => {
      const [appointments, user] = await Promise.all([
        repos.booking.listForPatient(patient.id),
        repos.user.getById(patient.userId),
      ]);
      const providerIds = new Set(appointments.map((a) => a.providerId));
      if (patient.assignedProviderId) providerIds.add(patient.assignedProviderId);
      const providerNames = [...providerIds].map((id) => providerNameById.get(id)).filter(Boolean) as string[];
      const last = lastSession(appointments, now);
      return {
        id: patient.id,
        name: patient.displayName,
        phone: maskedPhone(user?.phoneLast4 ?? null),
        ageSex: `${patient.ageYears} · ${sexLabel(patient.sex)}`,
        providers: providerNames.length > 0 ? providerNames.join(', ') : '—',
        sessions: appointments.length,
        lastLabel: last ? formatISTDate(last.scheduledAt) : '—',
        status: clinicalStatus(appointments, now),
      };
    }),
  );

  const filtered = rows.filter((r) => (query ? r.name.toLowerCase().includes(query.toLowerCase()) : true));

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub', { count: rows.length })} />

      <form action="/admin/clients" className="flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="h-11 w-full max-w-sm rounded-full bg-card px-4 text-[15px] text-ink shadow-feather outline-none placeholder:text-ink-soft focus:shadow-[0_0_0_2px_var(--primary)]"
        />
        <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream">
          {t('search')}
        </button>
      </form>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((row) => (
              <Link key={row.id} href={`/admin/clients/${row.id}`} className="no-underline">
                <Card>
                  <CardContent className="flex flex-col gap-2 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-[17px] text-indigo-deep">{row.name}</p>
                        <p className="text-xs text-ink-soft">
                          {row.ageSex} · {row.phone}
                        </p>
                      </div>
                      <Badge variant={row.status === 'active' ? 'default' : row.status === 'new' ? 'turmeric' : 'secondary'}>
                        {CLINICAL_STATUS_LABEL[row.status]}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                      <div className="col-span-2">
                        <dt className="text-ink-soft">{t('colProvider')}</dt>
                        <dd className="font-semibold text-ink">{row.providers}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-soft">{t('colSessions')}</dt>
                        <dd className="font-semibold text-ink">{row.sessions}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-soft">{t('colLast')}</dt>
                        <dd className="font-semibold text-ink">{row.lastLabel}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-softer bg-card shadow-feather md:block">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead>
                <tr className="bg-lilac-tint text-[11px] uppercase tracking-[0.06em] text-indigo-deep">
                  <th className="px-4 py-3 font-bold">{t('colName')}</th>
                  <th className="px-3 py-3 font-bold">{t('colPhone')}</th>
                  <th className="px-3 py-3 font-bold">{t('colAgeSex')}</th>
                  <th className="px-3 py-3 font-bold">{t('colProvider')}</th>
                  <th className="px-3 py-3 font-bold">{t('colSessions')}</th>
                  <th className="px-3 py-3 font-bold">{t('colLast')}</th>
                  <th className="px-3 py-3 font-bold">{t('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id} className={cn(i % 2 === 1 && 'bg-cream/70')}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${row.id}`} className="font-semibold text-indigo-deep no-underline hover:underline">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{row.phone}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.ageSex}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.providers}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.sessions}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.lastLabel}</td>
                    <td className="px-3 py-3">
                      <Badge variant={row.status === 'active' ? 'default' : row.status === 'new' ? 'turmeric' : 'secondary'}>
                        {CLINICAL_STATUS_LABEL[row.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

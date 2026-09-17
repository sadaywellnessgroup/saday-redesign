import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MessageSquareText, Search } from 'lucide-react';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos, ORG_ID } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import {
  CLINICAL_STATUS_LABEL,
  ONBOARDING_STATUS_LABEL,
  clinicalStatus,
  lastSession,
  nextSession,
  sexLabel,
  type ClinicalStatus,
  type OnboardingStatus,
} from '@/lib/provider/patient-status';
import { cn, formatISTDate } from '@/lib/utils';

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'new', label: 'New' },
  { value: 'inactive', label: 'Inactive' },
];

interface Row {
  id: string;
  name: string;
  ageSex: string;
  status: ClinicalStatus;
  onboarding: OnboardingStatus;
  lastLabel: string;
  nextLabel: string;
  scoreLabel: string;
  unread: number;
}

/** Route /pro/patients — search + status filter, cards at 360px and a
 * table from md up. Onboarding status is kept separate from clinical
 * status (MantraCare digest §11). */
export default async function ProviderPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const t = await getTranslations('pro.patients');
  const { providerId } = await requireProvider();
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const statusFilter = FILTERS.some((f) => f.value === params.status) ? params.status! : 'all';
  const now = new Date();

  const [patients, unreadByPatient, tools] = await Promise.all([
    repos.patient.listForProviderCaseload(providerId),
    repos.messaging.countUnreadForProvider(providerId),
    repos.psychometrics.listTools(ORG_ID),
  ]);

  const rows: Row[] = await Promise.all(
    patients.map(async (patient) => {
      const [appointments, submissions, user] = await Promise.all([
        repos.booking.listForPatient(patient.id),
        repos.psychometrics.listSubmissionsForPatient(patient.id),
        repos.user.getById(patient.userId),
      ]);
      const mine = appointments.filter((a) => a.providerId === providerId);
      const last = lastSession(mine, now);
      const next = nextSession(mine, now);

      const scored = submissions
        .filter((s) => ['tool_phq9_en', 'tool_gad7_en'].includes(s.toolId))
        .sort((a, b) => b.at.localeCompare(a.at));
      const latest = scored[0];
      const latestTool = latest ? tools.find((x) => x.id === latest.toolId) : undefined;

      return {
        id: patient.id,
        name: patient.displayName,
        ageSex: `${patient.ageYears} · ${sexLabel(patient.sex)}`,
        status: clinicalStatus(mine, now),
        onboarding: (user?.phoneVerifiedAt ? 'joined' : 'invite_sent') as OnboardingStatus,
        lastLabel: last ? formatISTDate(last.scheduledAt) : '—',
        nextLabel: next ? formatISTDate(next.scheduledAt) : '—',
        scoreLabel: latest && latestTool ? `${latestTool.code} ${latest.total} · ${latest.band}` : '—',
        unread: unreadByPatient.get(patient.id) ?? 0,
      };
    }),
  );

  const filtered = rows
    .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
    .filter((r) => (query ? r.name.toLowerCase().includes(query.toLowerCase()) : true));

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub', { count: rows.length })} />

      {/* search + filters — plain form/links, no client JS needed */}
      <div className="flex flex-col gap-3">
        <form action="/pro/patients" className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="h-11 w-full rounded-full bg-card pl-11 pr-4 text-[15px] text-ink shadow-feather outline-none placeholder:text-ink-soft focus:shadow-[0_0_0_2px_var(--primary)]"
            />
          </div>
          {statusFilter !== 'all' ? <input type="hidden" name="status" value={statusFilter} /> : null}
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream"
          >
            {t('search')}
          </button>
        </form>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => {
            const active = f.value === statusFilter;
            const search = new URLSearchParams();
            if (query) search.set('q', query);
            if (f.value !== 'all') search.set('status', f.value);
            const href = search.toString() ? `/pro/patients?${search}` : '/pro/patients';
            return (
              <Link
                key={f.value}
                href={href}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold no-underline',
                  active ? 'bg-indigo text-cream shadow-feather' : 'bg-card text-indigo shadow-feather hover:bg-lilac-tint',
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((row) => (
              <Link key={row.id} href={`/pro/patients/${row.id}`} className="no-underline">
                <Card>
                  <CardContent className="flex flex-col gap-2 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-[17px] text-indigo-deep">{row.name}</p>
                        <p className="text-xs text-ink-soft">{row.ageSex}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={row.status === 'active' ? 'default' : row.status === 'new' ? 'turmeric' : 'secondary'}>
                          {CLINICAL_STATUS_LABEL[row.status]}
                        </Badge>
                        {row.unread > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta">
                            <MessageSquareText className="h-3.5 w-3.5" /> {row.unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                      <div>
                        <dt className="text-ink-soft">{t('colLast')}</dt>
                        <dd className="font-semibold text-ink">{row.lastLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-soft">{t('colNext')}</dt>
                        <dd className="font-semibold text-ink">{row.nextLabel}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-ink-soft">{t('colScore')}</dt>
                        <dd className="font-semibold text-ink">{row.scoreLabel}</dd>
                      </div>
                    </dl>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">
                      {t('onboarding')}: {ONBOARDING_STATUS_LABEL[row.onboarding]}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* desktop table */}
          <div className="hidden overflow-hidden rounded-softer bg-card shadow-feather md:block">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-lilac-tint text-[11px] uppercase tracking-[0.06em] text-indigo-deep">
                  <th className="px-4 py-3 font-bold">{t('colName')}</th>
                  <th className="px-3 py-3 font-bold">{t('colStatus')}</th>
                  <th className="px-3 py-3 font-bold">{t('onboarding')}</th>
                  <th className="px-3 py-3 font-bold">{t('colLast')}</th>
                  <th className="px-3 py-3 font-bold">{t('colNext')}</th>
                  <th className="px-3 py-3 font-bold">{t('colScore')}</th>
                  <th className="px-3 py-3 text-right font-bold">{t('colUnread')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id} className={cn(i % 2 === 1 && 'bg-cream/70')}>
                    <td className="px-4 py-3">
                      <Link href={`/pro/patients/${row.id}`} className="font-semibold text-indigo-deep no-underline">
                        {row.name}
                      </Link>
                      <span className="block text-xs text-ink-soft">{row.ageSex}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={row.status === 'active' ? 'default' : row.status === 'new' ? 'turmeric' : 'secondary'}>
                        {CLINICAL_STATUS_LABEL[row.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{ONBOARDING_STATUS_LABEL[row.onboarding]}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.lastLabel}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.nextLabel}</td>
                    <td className="px-3 py-3 text-ink-soft">{row.scoreLabel}</td>
                    <td className="px-3 py-3 text-right">
                      {row.unread > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-terracotta">
                          <MessageSquareText className="h-3.5 w-3.5" /> {row.unread}
                        </span>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
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

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { ProviderCard } from '@/components/patient/provider-card';
import { FilterChips } from '@/components/patient/filter-chips';
import { listBookableProvidersWithEarliest } from '@/lib/booking/availability';

const PSYCHOLOGIST_TITLES = new Set(['clinical_psychologist', 'counselling_psychologist', 'psychotherapist', 'counsellor']);

function isToday(iso: string, now: Date): boolean {
  const istDate = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  return istDate(new Date(iso)) === istDate(now);
}

/** Route 3 — provider card stack (ui-references §B/§E-1). Providers with
 * zero slots in the next 14 days are dropped by
 * `listBookableProvidersWithEarliest`, never shown disabled. */
export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const t = await getTranslations('providers');
  const { f } = await searchParams;
  const filter = f ?? 'all';
  const now = new Date();

  const bookable = await listBookableProvidersWithEarliest(now);

  const filtered = bookable.filter(({ provider, earliest }) => {
    if (filter === 'psychiatrist') return provider.professionalTitle === 'psychiatrist';
    if (filter === 'psychologist') return PSYCHOLOGIST_TITLES.has(provider.professionalTitle);
    if (filter === 'hindi') return provider.languagesSpoken.includes('hi');
    if (filter === 'today') return isToday(earliest.slot.slotStart, now);
    return true;
  });

  const options = [
    { value: 'all', label: t('filterAll') },
    { value: 'psychiatrist', label: t('filterPsychiatrist') },
    { value: 'psychologist', label: t('filterPsychologist') },
    { value: 'hindi', label: t('filterHindi') },
    { value: 'today', label: t('filterToday') },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="waves" />

      <FilterChips options={options} active={filter} basePath="/providers" />

      {filtered.length === 0 ? (
        <p className="rounded-softer bg-card p-6 text-center text-sm text-ink-soft shadow-feather">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(({ provider, earliest }) => (
            <ProviderCard key={provider.id} provider={provider} earliestSlotISO={earliest.slot.slotStart} />
          ))}
        </div>
      )}

      <Link
        href="/book/earliest"
        className="flex items-center justify-between rounded-softer bg-lilac-tint px-5 py-4 no-underline transition-colors hover:bg-lilac-tint/70"
      >
        <span className="text-sm font-medium text-indigo-deep">{t('earliestOption')}</span>
        <span className="whitespace-nowrap text-sm font-semibold text-indigo">{t('earliestOptionCta')}</span>
      </Link>
    </div>
  );
}

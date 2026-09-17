import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { BookingWizard } from '@/components/patient/booking-wizard';
import { repos } from '@/lib/repos';

const SEARCH_WINDOW_DAYS = 14;

/** Route 5 — session-type selector → 7-day day strip → time-slot list →
 * summary → consent → pay (D-012). All slot search for the next 14 days
 * is done once here (server-side) and handed to the client wizard, which
 * slices it per session type/day — a fine trade-off for a mock/demo
 * dataset this small. */
export default async function BookProviderPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<{ reschedule?: string }>;
}) {
  const { providerId } = await params;
  const { reschedule } = await searchParams;
  const t = await getTranslations('booking');

  const provider = await repos.provider.getById(providerId);
  if (!provider) notFound();
  const sessionTypes = await repos.provider.listSessionTypes(providerId);

  const now = new Date();
  const fromISO = now.toISOString();
  const toISO = new Date(now.getTime() + SEARCH_WINDOW_DAYS * 86_400_000).toISOString();

  const slotsByType: Record<string, Awaited<ReturnType<typeof repos.booking.searchSlots>>> = {};
  for (const st of sessionTypes) {
    slotsByType[st.id] = await repos.booking.searchSlots({ providerId, sessionTypeId: st.id, fromISO, toISO, now });
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeading kicker={t('kicker')} title={provider.displayName} sub={t('step', { current: 1, total: 4 })} motif="waves" />
      <BookingWizard
        providerId={provider.id}
        providerName={provider.displayName}
        sessionTypes={sessionTypes}
        slotsByType={slotsByType}
        bookingChannel="patient_self"
        rescheduleFromId={reschedule}
      />
    </div>
  );
}

import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { AvailabilityEditor, type DayOffRow } from '@/components/provider/availability-editor';
import { repos, ORG_ID } from '@/lib/repos';
import { istDateKey, requireProvider } from '@/lib/provider/console-data';
import type { DraftRule } from '@/lib/provider/availability-rules';

/** Route /pro/availability — weekly recurring rules, session settings and
 * a separate Days-off table (MantraCare digest §11). */
export default async function ProviderAvailabilityPage() {
  const t = await getTranslations('pro.availability');
  const { providerId } = await requireProvider();

  const [rules, sessionTypes, blockouts, policies] = await Promise.all([
    repos.provider.listAvailabilityRules(providerId),
    repos.provider.listSessionTypes(providerId),
    repos.provider.listBlockouts(providerId),
    repos.organization.getPolicies(ORG_ID),
  ]);

  const initialRules: DraftRule[] = rules.map((r) => ({
    id: r.id,
    weekday: r.weekday,
    startTime: r.startTime,
    endTime: r.endTime,
  }));

  const first = sessionTypes[0];
  const initialSettings = {
    bufferMinutes: first?.bufferMinutes ?? 10,
    minNoticeHours: first?.minNoticeHours ?? policies?.bookingMinNoticeHours ?? 2,
    maxAdvanceDays: first?.maxAdvanceDays ?? policies?.bookingWindowDaysMax ?? 30,
  };

  const daysOff: DayOffRow[] = blockouts.map((b) => {
    const key = istDateKey(b.startsAt);
    return {
      id: b.id,
      date: key,
      dateLabel: new Date(`${key}T06:00:00.000Z`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      reason: b.reason ?? '',
      repeatsYearly: b.repeatsYearly,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />
      <AvailabilityEditor initialRules={initialRules} initialSettings={initialSettings} daysOff={daysOff} />
    </div>
  );
}

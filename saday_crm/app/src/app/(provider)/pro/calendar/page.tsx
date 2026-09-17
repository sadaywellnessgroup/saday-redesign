import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import {
  WeekCalendar,
  type CalendarBlockout,
  type CalendarDay,
  type CalendarEvent,
} from '@/components/provider/week-calendar';
import { repos } from '@/lib/repos';
import {
  addDaysKey,
  enrich,
  formatDayShort,
  IST_OFFSET_MIN,
  istDateKey,
  requireProvider,
  toSummary,
  weekStartKey,
} from '@/lib/provider/console-data';
import { formatISTTime } from '@/lib/utils';

/** Route /pro/calendar — week view (Mon–Sun on >=md, single day + day
 * strip below), month mini-picker in a Popover, tap a block for the
 * detail Sheet. */
export default async function ProviderCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; day?: string }>;
}) {
  const t = await getTranslations('pro.calendar');
  const { providerId } = await requireProvider();
  const params = await searchParams;

  const now = new Date();
  const todayKey = istDateKey(now);
  const anchorKey = params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : todayKey;
  const monday = weekStartKey(anchorKey);
  const dayKeys = Array.from({ length: 7 }, (_, i) => addDaysKey(monday, i));
  const selectedDay = params.day && dayKeys.includes(params.day) ? params.day : dayKeys.includes(todayKey) ? todayKey : monday;

  const days: CalendarDay[] = dayKeys.map((key) => {
    const short = formatDayShort(key);
    return { key, weekday: short.weekday, day: short.day, month: short.month, isToday: key === todayKey };
  });

  const [allAppointments, blockouts] = await Promise.all([
    repos.booking.listForProvider(providerId),
    repos.provider.listBlockouts(providerId),
  ]);

  const inWeek = allAppointments.filter((a) => dayKeys.includes(istDateKey(a.scheduledAt)));
  const rows = await enrich(inWeek);

  function minutesIST(iso: string): number {
    const ist = new Date(new Date(iso).getTime() + IST_OFFSET_MIN * 60_000);
    return ist.getUTCHours() * 60 + ist.getUTCMinutes();
  }

  const events: CalendarEvent[] = rows.map((row) => {
    const startMin = minutesIST(row.appointment.scheduledAt);
    const endMin = startMin + row.appointment.durationMinutes;
    return {
      dayKey: istDateKey(row.appointment.scheduledAt),
      startMin,
      endMin,
      bufferEndMin: endMin + row.appointment.bufferMinutes,
      label: row.patient?.displayName ?? 'Patient',
      timeLabel: formatISTTime(row.appointment.scheduledAt),
      summary: toSummary(row, now),
    };
  });

  const calendarBlockouts: CalendarBlockout[] = blockouts.flatMap((b) => {
    const startKey = istDateKey(b.startsAt);
    if (!dayKeys.includes(startKey)) return [];
    const startMin = minutesIST(b.startsAt);
    const rawEnd = minutesIST(b.endsAt);
    const endMin = rawEnd <= startMin ? 24 * 60 : rawEnd;
    return [{ dayKey: startKey, startMin, endMin, reason: b.reason ?? t('dayOff') }];
  });

  const weekLabel = `${formatDayShort(monday).day} ${formatDayShort(monday).month} – ${formatDayShort(dayKeys[6]!).day} ${
    formatDayShort(dayKeys[6]!).month
  }`;

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />
      <WeekCalendar
        days={days}
        events={events}
        blockouts={calendarBlockouts}
        weekLabel={weekLabel}
        prevWeek={addDaysKey(monday, -7)}
        nextWeek={addDaysKey(monday, 7)}
        selectedDayKey={selectedDay}
      />
    </div>
  );
}

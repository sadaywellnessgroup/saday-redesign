'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AppointmentSheet, type AppointmentSummary } from '@/components/provider/appointment-sheet';
import { BLOCK_CLASS } from '@/components/provider/status-pill';
import { cn } from '@/lib/utils';

/* Week view — Mon–Sun columns at >=md, one day with a day strip below it
 * (ui-references §C, D-033). Blocks are tinted by status in the muted
 * family, buffers and block-outs are hatched cream, never red (§B). */

export interface CalendarDay {
  key: string;
  weekday: string;
  day: string;
  month: string;
  isToday: boolean;
}

export interface CalendarEvent {
  dayKey: string;
  startMin: number;
  endMin: number;
  bufferEndMin: number;
  label: string;
  timeLabel: string;
  summary: AppointmentSummary;
}

export interface CalendarBlockout {
  dayKey: string;
  startMin: number;
  endMin: number;
  reason: string;
}

const DAY_START_MIN = 7 * 60;
const DAY_END_MIN = 21 * 60;
const PX_PER_MIN = 56 / 60;

const HATCH =
  'repeating-linear-gradient(45deg, rgba(62,42,120,0.10) 0, rgba(62,42,120,0.10) 4px, transparent 4px, transparent 9px)';

function top(min: number) {
  return (Math.max(min, DAY_START_MIN) - DAY_START_MIN) * PX_PER_MIN;
}
function height(startMin: number, endMin: number) {
  return Math.max(30, (Math.min(endMin, DAY_END_MIN) - Math.max(startMin, DAY_START_MIN)) * PX_PER_MIN);
}

/** A 25-minute session is only ~23px tall — too short for two lines, so
 * short blocks drop the time and keep the name legible. */
const TWO_LINE_MIN_PX = 44;

function hourLabel(hour: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${hour >= 12 ? 'pm' : 'am'}`;
}

function DayColumn({
  day,
  events,
  blockouts,
}: {
  day: CalendarDay;
  events: CalendarEvent[];
  blockouts: CalendarBlockout[];
}) {
  const dayEvents = events.filter((e) => e.dayKey === day.key);
  const dayBlocks = blockouts.filter((b) => b.dayKey === day.key);

  return (
    <div className="relative min-w-0 flex-1">
      {/* hour bands: tone, not gridlines */}
      {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 }, (_, i) => (
        <div
          key={i}
          className={cn('w-full', i % 2 === 0 ? 'bg-card' : 'bg-cream')}
          style={{ height: 56 }}
        />
      ))}

      <div className="absolute inset-0">
        {dayBlocks.map((b, i) => (
          <div
            key={`${b.dayKey}-bo-${i}`}
            className="absolute inset-x-1 rounded-soft px-2 py-1 text-[11px] font-semibold text-ink-soft"
            style={{ top: top(b.startMin), height: height(b.startMin, b.endMin), backgroundImage: HATCH }}
            title={b.reason}
          >
            <span className="line-clamp-2">{b.reason}</span>
          </div>
        ))}

        {dayEvents.map((e) => {
          const blockHeight = height(e.startMin, e.endMin);
          const compact = blockHeight < TWO_LINE_MIN_PX;
          return (
          <div key={e.summary.id}>
            {/* buffer tail — occupies the calendar, is not billed */}
            {e.bufferEndMin > e.endMin ? (
              <div
                className="absolute inset-x-1 rounded-b-soft"
                style={{ top: top(e.endMin), height: height(e.endMin, e.bufferEndMin), backgroundImage: HATCH }}
                aria-hidden="true"
              />
            ) : null}
            <div className="absolute inset-x-1" style={{ top: top(e.startMin), height: blockHeight }}>
              <AppointmentSheet
                appointment={e.summary}
                triggerClassName={cn(
                  'flex h-full w-full flex-col items-start overflow-hidden rounded-soft px-2 text-left',
                  compact ? 'justify-center py-0.5' : 'justify-start gap-0.5 py-1.5',
                  BLOCK_CLASS[e.summary.status],
                )}
              >
                <span className={cn('w-full truncate font-semibold leading-tight', compact ? 'text-[11.5px]' : 'text-[12.5px]')}>
                  {compact ? `${e.timeLabel} · ${e.label}` : e.label}
                </span>
                {compact ? null : <span className="w-full truncate text-[11px] opacity-80">{e.timeLabel}</span>}
              </AppointmentSheet>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export function WeekCalendar({
  days,
  events,
  blockouts,
  weekLabel,
  prevWeek,
  nextWeek,
  selectedDayKey,
}: {
  days: CalendarDay[];
  events: CalendarEvent[];
  blockouts: CalendarBlockout[];
  weekLabel: string;
  prevWeek: string;
  nextWeek: string;
  selectedDayKey: string;
}) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(selectedDayKey);
  const [pickerOpen, setPickerOpen] = useState(false);
  const mobileDay = days.find((d) => d.key === activeDay) ?? days[0]!;

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => router.push(`/pro/calendar?week=${prevWeek}`)}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-card text-indigo shadow-feather"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-card px-4 text-[14px] font-semibold text-indigo-deep shadow-feather"
            >
              <CalendarDays className="h-4 w-4 text-indigo" />
              {weekLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="center">
            <Calendar
              mode="single"
              defaultMonth={new Date(`${days[0]!.key}T06:00:00.000Z`)}
              selected={new Date(`${activeDay}T06:00:00.000Z`)}
              onSelect={(date) => {
                if (!date) return;
                const key = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
                setPickerOpen(false);
                router.push(`/pro/calendar?week=${key}&day=${key}`);
              }}
            />
          </PopoverContent>
        </Popover>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => router.push(`/pro/calendar?week=${nextWeek}`)}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-card text-indigo shadow-feather"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* mobile day strip */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
        {days.map((d) => {
          const isActive = d.key === activeDay;
          const count = events.filter((e) => e.dayKey === d.key).length;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveDay(d.key)}
              aria-pressed={isActive}
              className={cn(
                'flex min-h-[64px] w-[52px] flex-none flex-col items-center justify-center gap-0.5 rounded-soft text-[12px] font-semibold',
                isActive ? 'bg-indigo text-cream' : 'bg-card text-ink shadow-feather',
              )}
            >
              <span className="opacity-80">{d.weekday}</span>
              <span className="font-display text-[16px]">{d.day}</span>
              <span
                className={cn('h-1.5 w-1.5 rounded-full', count > 0 ? (isActive ? 'bg-cream' : 'bg-turmeric') : 'bg-transparent')}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="overflow-hidden rounded-softer bg-card shadow-feather">
        {/* weekday header, >=md only */}
        <div className="hidden md:flex">
          <div className="w-12 flex-none" />
          {days.map((d) => (
            <div
              key={d.key}
              className={cn(
                'min-w-0 flex-1 px-2 py-2 text-center',
                d.isToday ? 'bg-lilac-tint' : 'bg-card',
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">{d.weekday}</p>
              <p className="font-display text-[15px] text-indigo-deep">
                {d.day} {d.month}
              </p>
            </div>
          ))}
        </div>

        <div className="flex">
          {/* hour gutter */}
          <div className="w-12 flex-none pt-0">
            {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 }, (_, i) => (
              <div key={i} className="pr-2 text-right text-[10.5px] text-ink-soft" style={{ height: 56 }}>
                {hourLabel(DAY_START_MIN / 60 + i)}
              </div>
            ))}
          </div>

          {/* mobile: one day */}
          <div className="flex min-w-0 flex-1 md:hidden">
            <DayColumn day={mobileDay} events={events} blockouts={blockouts} />
          </div>

          {/* desktop: seven days */}
          <div className="hidden min-w-0 flex-1 md:flex">
            {days.map((d) => (
              <DayColumn key={d.key} day={d} events={events} blockouts={blockouts} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Hatched areas are buffers and days off — they hold the slot but are never billed.
      </p>
    </div>
  );
}

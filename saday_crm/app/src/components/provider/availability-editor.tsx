'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/provider/chip-group';
import {
  WEEKDAYS,
  formatRange,
  type DraftRule,
  type RuleValidationError,
  type SessionSettings,
} from '@/lib/provider/availability-rules';
import { addDayOffAction, removeDayOffAction, saveAvailabilityAction } from '@/app/(provider)/pro/availability/actions';
import { cn } from '@/lib/utils';

export interface DayOffRow {
  id: string;
  date: string;
  dateLabel: string;
  reason: string;
  repeatsYearly: boolean;
}

/* Weekly recurring grid and one-off "Days off" are two separate things —
 * MantraCare digest §11, the one pattern from their availability screen
 * worth keeping. Nothing here uses a hard border; rows sit on cream. */
export function AvailabilityEditor({
  initialRules,
  initialSettings,
  daysOff,
}: {
  initialRules: DraftRule[];
  initialSettings: SessionSettings;
  daysOff: DayOffRow[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<DraftRule[]>(initialRules);
  const [settings, setSettings] = useState<SessionSettings>(initialSettings);
  const [errors, setErrors] = useState<RuleValidationError[]>([]);
  const [isPending, startTransition] = useTransition();

  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newRepeats, setNewRepeats] = useState(false);

  function addRange(weekday: number) {
    setRules((prev) => [...prev, { weekday, startTime: '10:00', endTime: '13:00' }]);
  }
  function updateRule(index: number, patch: Partial<DraftRule>) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setErrors([]);
  }
  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
    setErrors([]);
  }

  function save() {
    startTransition(async () => {
      const result = await saveAvailabilityAction(rules, settings);
      if (result.ok) {
        setErrors([]);
        toast.success('Availability saved.');
        router.refresh();
      } else {
        setErrors(result.ruleErrors);
        toast.error(
          result.ruleErrors[0]?.message ?? 'Check the session settings — one of the values is out of range.',
        );
      }
    });
  }

  function addDayOff() {
    if (!newDate) return;
    startTransition(async () => {
      const result = await addDayOffAction({ date: newDate, reason: newReason, repeatsYearly: newRepeats });
      if (result.ok) {
        setNewDate('');
        setNewReason('');
        setNewRepeats(false);
        toast.success('Day off added.');
        router.refresh();
      } else {
        toast.error('Pick a valid date.');
      }
    });
  }

  function removeDayOff(id: string) {
    startTransition(async () => {
      await removeDayOffAction(id);
      toast.success('Day off removed.');
      router.refresh();
    });
  }

  const errorFor = (index: number) => errors.find((e) => e.index === index);

  return (
    <div className="flex flex-col gap-5">
      {/* weekly grid */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div>
            <h2 className="sec-title">Weekly hours</h2>
            <p className="text-sm text-ink-soft">
              Repeats every week, in IST. Slots are generated inside these windows, minus buffers and days off.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {WEEKDAYS.map((weekday) => {
              const indexed = rules
                .map((rule, index) => ({ rule, index }))
                .filter(({ rule }) => rule.weekday === weekday.value);
              return (
                <div key={weekday.value} className="flex flex-col gap-2 rounded-soft bg-cream p-3 sm:flex-row sm:items-start sm:gap-4">
                  <p className="w-24 flex-none pt-2 text-[14px] font-semibold text-indigo-deep">{weekday.long}</p>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {indexed.length === 0 ? (
                      <p className="py-2 text-sm text-ink-soft">Not available</p>
                    ) : (
                      indexed.map(({ rule, index }) => {
                        const error = errorFor(index);
                        return (
                          <div key={index} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                aria-label={`${weekday.long} start time`}
                                value={rule.startTime}
                                onChange={(e) => updateRule(index, { startTime: e.target.value })}
                                className="h-11 min-w-0 flex-1 bg-card px-2 sm:w-[124px] sm:flex-none sm:px-4"
                              />
                              <span className="flex-none text-ink-soft">–</span>
                              <Input
                                type="time"
                                aria-label={`${weekday.long} end time`}
                                value={rule.endTime}
                                onChange={(e) => updateRule(index, { endTime: e.target.value })}
                                className="h-11 min-w-0 flex-1 bg-card px-2 sm:w-[124px] sm:flex-none sm:px-4"
                              />
                              <span className="hidden text-xs text-ink-soft sm:inline">
                                {formatRange(rule.startTime, rule.endTime)}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${weekday.long} window`}
                                onClick={() => removeRule(index)}
                                className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-ink-soft hover:bg-lilac-tint hover:text-indigo sm:ml-auto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {error ? <p className="text-xs font-semibold text-terracotta-deep">{error.message}</p> : null}
                          </div>
                        );
                      })
                    )}
                    <button
                      type="button"
                      onClick={() => addRange(weekday.value)}
                      className="inline-flex min-h-11 items-center gap-2 self-start rounded-full px-3 text-[13.5px] font-semibold text-indigo hover:bg-lilac-tint"
                    >
                      <Plus className="h-4 w-4" /> Add window
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* session settings */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div>
            <h2 className="sec-title">Session settings</h2>
            <p className="text-sm text-ink-soft">Applied to every session type you offer.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Buffer after session (min)">
              <Input
                type="number"
                min={0}
                max={120}
                value={settings.bufferMinutes}
                onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })}
                className="h-11"
              />
            </Field>
            <Field label="Minimum notice (hours)">
              <Input
                type="number"
                min={0}
                max={168}
                value={settings.minNoticeHours}
                onChange={(e) => setSettings({ ...settings, minNoticeHours: Number(e.target.value) })}
                className="h-11"
              />
            </Field>
            <Field label="Book up to (days ahead)">
              <Input
                type="number"
                min={1}
                max={180}
                value={settings.maxAdvanceDays}
                onChange={(e) => setSettings({ ...settings, maxAdvanceDays: Number(e.target.value) })}
                className="h-11"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 -mx-1 bg-cream/95 px-1 py-2 backdrop-blur-sm md:bottom-0">
        <Button size="lg" className="h-12 w-full sm:w-auto" disabled={isPending} onClick={save}>
          Save availability
        </Button>
      </div>

      {/* days off */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div>
            <h2 className="sec-title">Days off</h2>
            <p className="text-sm text-ink-soft">
              One-off or annual exceptions. Kept separate from the weekly grid so a holiday never edits your hours.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {daysOff.length === 0 ? (
              <p className="text-sm text-ink-soft">No days off recorded.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="hidden gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft sm:flex">
                  <span className="w-36">Date</span>
                  <span className="flex-1">Reason</span>
                  <span className="w-28">Repeats yearly</span>
                  <span className="w-11" />
                </div>
                {daysOff.map((row) => (
                  <div
                    key={row.id}
                    className="relative flex flex-col gap-1 rounded-soft bg-cream px-3 py-2.5 pr-14 sm:flex-row sm:items-center sm:gap-3 sm:pr-3"
                  >
                    <span className="w-36 flex-none text-[14px] font-semibold text-indigo-deep">{row.dateLabel}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{row.reason || '—'}</span>
                    <span className="w-28 flex-none text-sm text-ink-soft">
                      <span className="sm:hidden">Repeats yearly: </span>
                      {row.repeatsYearly ? 'Yes' : 'No'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove day off ${row.dateLabel}`}
                      onClick={() => removeDayOff(row.id)}
                      className="absolute right-2 top-2 flex h-11 w-11 flex-none items-center justify-center rounded-full text-ink-soft hover:bg-lilac-tint hover:text-indigo sm:static"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-soft bg-lilac-tint p-3 sm:flex-row sm:items-end">
              <div className="sm:w-44">
                <Field label="Date">
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-11 bg-card" />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Reason">
                  <Input
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Holiday, conference, leave…"
                    className="h-11 bg-card"
                  />
                </Field>
              </div>
              <div className="flex min-h-11 items-center gap-3 sm:w-40">
                <Switch id="repeats" checked={newRepeats} onCheckedChange={setNewRepeats} />
                <label htmlFor="repeats" className="text-[13.5px] font-semibold text-ink">
                  Repeats yearly
                </label>
              </div>
              <Button
                variant="outline"
                className={cn('h-11', !newDate && 'opacity-60')}
                disabled={!newDate || isPending}
                onClick={addDayOff}
              >
                Add day off
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

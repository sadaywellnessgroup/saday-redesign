'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TimeStepper } from './time-stepper';
import { addSleepLogAction } from '@/app/(client)/app/track/actions';
import { cn } from '@/lib/utils';

/** Sleep quick-log form (ui-references §B "Sleep log entry") — shared by
 * the home quick-log Sheet (route 8) and the inline "today's entry" card
 * on /app/track (route 10). */
export function SleepEntryForm({ onSaved }: { onSaved?: () => void }) {
  const t = useTranslations('appTrack');
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    if (!quality) return;
    startTransition(async () => {
      const result = await addSleepLogAction({ bedTime, wakeTime, quality1to5: quality });
      if (result.ok) {
        toast.success(t('saved'));
        onSaved?.();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <TimeStepper label={t('sleepBedtime')} value={bedTime} onChange={setBedTime} />
        <TimeStepper label={t('sleepWaketime')} value={wakeTime} onChange={setWakeTime} />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-indigo">{t('sleepQuality')}</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={cn(
                'flex h-11 flex-1 items-center justify-center rounded-soft text-sm font-semibold transition-colors',
                quality === q ? 'bg-indigo text-cream' : 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint',
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="h-12" disabled={!quality || isPending} onClick={save}>
        {t('save')}
      </Button>
    </div>
  );
}

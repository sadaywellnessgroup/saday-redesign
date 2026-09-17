'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Smile, Moon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MoodEntryForm } from './mood-entry-form';
import { SleepEntryForm } from './sleep-entry-form';

/** Home quick-log row (route 8): two pill buttons that open bottom Sheets
 * (ui-references §C: Sheet, not Dialog, for mobile overlays). */
export function QuickLogSheets() {
  const t = useTranslations('appHome');
  const [open, setOpen] = useState<'mood' | 'sleep' | null>(null);
  const router = useRouter();

  function closeAndRefresh() {
    setOpen(null);
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen('mood')}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-lilac-tint px-4 text-[14.5px] font-semibold text-indigo-deep transition-colors hover:bg-lilac-tint/70"
        >
          <Smile className="h-5 w-5" strokeWidth={1.75} />
          {t('quickLogMood')}
        </button>
        <button
          type="button"
          onClick={() => setOpen('sleep')}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-lilac-tint px-4 text-[14.5px] font-semibold text-indigo-deep transition-colors hover:bg-lilac-tint/70"
        >
          <Moon className="h-5 w-5" strokeWidth={1.75} />
          {t('quickLogSleep')}
        </button>
      </div>

      <Sheet open={open === 'mood'} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-softer">
          <SheetHeader>
            <SheetTitle>{t('quickLogMood')}</SheetTitle>
          </SheetHeader>
          <div className="pt-4">
            <MoodEntryForm onSaved={closeAndRefresh} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={open === 'sleep'} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-softer">
          <SheetHeader>
            <SheetTitle>{t('quickLogSleep')}</SheetTitle>
          </SheetHeader>
          <div className="pt-4">
            <SleepEntryForm onSaved={closeAndRefresh} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

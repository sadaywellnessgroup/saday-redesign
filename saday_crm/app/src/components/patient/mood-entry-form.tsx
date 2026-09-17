'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FaceScale } from './face-scale';
import { addMoodLogAction } from '@/app/(client)/app/track/actions';
import { cn } from '@/lib/utils';

const TAG_KEYS = ['tagSleep', 'tagWork', 'tagFamily', 'tagHealth', 'tagRelationships', 'tagMoney'] as const;

/** Mood quick-log form (ui-references §B "Mood log entry") — shared by the
 * home quick-log Sheet (route 8) and the inline "today's entry" card on
 * /app/track (route 10). `face` (1-5) maps onto the domain's mood1to10
 * (face * 2) so the fixture's 1-10 scale is preserved. */
export function MoodEntryForm({ onSaved }: { onSaved?: () => void }) {
  const t = useTranslations('appTrack');
  const [face, setFace] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggleTag(key: string) {
    setTags((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function save() {
    if (!face) return;
    startTransition(async () => {
      const result = await addMoodLogAction({ mood1to10: face * 2, tags: tags.map((k) => t(k as (typeof TAG_KEYS)[number])), note });
      if (result.ok) {
        toast.success(t('saved'));
        onSaved?.();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <FaceScale value={face} onChange={setFace} />

      <div className="flex flex-col gap-2">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-indigo">{t('moodTagsLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {TAG_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleTag(key)}
              className={cn(
                'min-h-9 rounded-full px-3.5 text-[12.5px] font-medium transition-colors',
                tags.includes(key) ? 'bg-indigo text-cream' : 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint',
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-indigo" htmlFor="mood-note">
          {t('moodNoteLabel')}
        </label>
        <Textarea id="mood-note" placeholder={t('moodNotePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[80px]" />
      </div>

      <Button size="lg" className="h-12" disabled={!face || isPending} onClick={save}>
        {t('save')}
      </Button>
    </div>
  );
}

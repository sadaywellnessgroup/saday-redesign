'use client';

import { Angry, Frown, Laugh, Meh, Smile } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/* 5-point face scale (ui-references §B "Mood log entry" — Daylio-style
 * one-tap grid, warm palette). `value` is the face index 1-5; the caller
 * maps that onto the domain's mood1to10 field. */
const FACES = [
  { face: 1, Icon: Angry, key: 'moodFace1' as const },
  { face: 2, Icon: Frown, key: 'moodFace2' as const },
  { face: 3, Icon: Meh, key: 'moodFace3' as const },
  { face: 4, Icon: Smile, key: 'moodFace4' as const },
  { face: 5, Icon: Laugh, key: 'moodFace5' as const },
];

export function FaceScale({ value, onChange }: { value: number | null; onChange: (face: number) => void }) {
  const t = useTranslations('appTrack');
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('moodQuestion')}>
      {FACES.map(({ face, Icon, key }) => (
        <button
          key={face}
          type="button"
          role="radio"
          aria-checked={value === face}
          onClick={() => onChange(face)}
          className={cn(
            'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-soft bg-cream py-2 transition-colors',
            value === face ? 'bg-indigo text-cream shadow-feather' : 'text-ink-soft hover:bg-lilac-tint',
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
          <span className="text-[10px] font-semibold leading-tight">{t(key)}</span>
        </button>
      ))}
    </div>
  );
}

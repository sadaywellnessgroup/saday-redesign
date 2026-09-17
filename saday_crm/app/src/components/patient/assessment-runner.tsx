'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui/progress-dots';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PsychometricTool } from '@/lib/domain';
import { scoreAnswers } from '@/lib/psychometrics/scoring';
import { hiItemPrompt, hiOptionLabel } from '@/lib/psychometrics/hi-translations';
import { cn } from '@/lib/utils';
import { submitAssessmentAction } from '@/app/(client)/app/track/assess/actions';

/** Route 11 — assessment runner (ui-references §B): one question per
 * screen, progress bar, back allowed, per-question EN/HI toggle, result
 * screen with score + band + plain-language meaning. No contact capture —
 * the patient is already logged in (spec explicit "NO contact capture"). */
export function AssessmentRunner({ tool }: { tool: PsychometricTool }) {
  const t = useTranslations('appAssessment');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [result, setResult] = useState<{ total: number; band: string | null } | null>(null);
  const [isPending, startTransition] = useTransition();

  const item = tool.items[index];
  const isLast = index === tool.items.length - 1;

  function selectOption(value: number) {
    if (!item) return;
    setAnswers((prev) => ({ ...prev, [item.id]: value }));
  }

  function next() {
    if (!item || answers[item.id] === undefined) return;
    if (isLast) {
      const finalAnswers = answers;
      const score = scoreAnswers(tool, finalAnswers);
      setResult(score);
      startTransition(async () => {
        await submitAssessmentAction(tool.id, finalAnswers);
      });
      return;
    }
    setIndex((i) => i + 1);
  }

  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="sec-title">{t('resultTitle')}</h2>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-indigo-deep">{result.total}</span>
            <span className="text-sm text-ink-soft">{t('yourScore')}</span>
          </div>
          {result.band ? <Badge variant="turmeric">{t('yourBand', { band: result.band })}</Badge> : null}
          <div className="rounded-soft bg-cream px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-indigo">{t('meaningTitle')}</p>
            <p className="pt-1 text-sm text-ink-soft">{t('meaningBody')}</p>
          </div>
          <Button asChild size="lg" className="h-12 self-start px-8">
            <Link href="/app/track">{t('backToTrack')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!item) return null;

  const prompt = lang === 'hi' ? hiItemPrompt(tool.code, item.id, item.prompt) : item.prompt;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <ProgressBar total={tool.items.length} current={index} label={t('questionOf', { current: index + 1, total: tool.items.length })} />
          <div className="flex flex-none gap-1" role="group" aria-label={t('langToggle')}>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn('min-h-8 rounded-full px-3 text-xs font-semibold', lang === 'en' ? 'bg-indigo text-cream' : 'bg-cream text-ink-soft')}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={cn('hindi min-h-8 rounded-full px-3 text-xs font-semibold', lang === 'hi' ? 'bg-indigo text-cream' : 'bg-cream text-ink-soft')}
            >
              हिं
            </button>
          </div>
        </div>

        <h2 className={cn('sec-title', lang === 'hi' && 'hindi')}>{prompt}</h2>

        <div className="flex flex-col gap-2">
          {item.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => selectOption(opt.value)}
              className={cn(
                'min-h-12 rounded-soft bg-cream px-4 py-3 text-left text-[14.5px] font-medium transition-colors hover:bg-lilac-tint',
                lang === 'hi' && 'hindi',
                answers[item.id] === opt.value && 'bg-lilac-tint shadow-[inset_0_0_0_1.5px_var(--indigo)]',
              )}
            >
              {lang === 'hi' ? hiOptionLabel(opt.label) : opt.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={back} disabled={index === 0}>
            {t('back')}
          </Button>
          <Button onClick={next} disabled={answers[item.id] === undefined || isPending} size="lg" className="h-11 px-7">
            {isLast ? t('finish') : t('next')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

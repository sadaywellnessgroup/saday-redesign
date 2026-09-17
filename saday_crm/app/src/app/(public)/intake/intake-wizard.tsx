'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ProgressDots } from '@/components/ui/progress-dots';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Motif } from '@/components/motif/motif';
import type { Sex } from '@/lib/domain';
import { isEligibleAge } from '@/lib/booking/logic';
import { saveIntakeAction } from './actions';

type Step = 0 | 1 | 2 | 'underage' | 'choice';

const SEX_OPTIONS: { value: Sex; key: 'sexFemale' | 'sexMale' | 'sexOther' | 'sexPreferNot' }[] = [
  { value: 'female', key: 'sexFemale' },
  { value: 'male', key: 'sexMale' },
  { value: 'other', key: 'sexOther' },
  { value: 'prefer_not', key: 'sexPreferNot' },
];

export function IntakeWizard({ orgPhone }: { orgPhone: string }) {
  const t = useTranslations('intake');
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [isPending, startTransition] = useTransition();

  const age = Number(ageInput);
  const dotIndex = typeof step === 'number' ? step : 2;

  function goName() {
    if (!name.trim()) return;
    setStep(1);
  }

  function goAge() {
    if (!ageInput || !Number.isFinite(age) || age <= 0 || age > 120) {
      setAgeError(t('ageError'));
      return;
    }
    setAgeError(null);
    if (!isEligibleAge(age)) {
      setStep('underage');
      return;
    }
    setStep(2);
  }

  function finishIntake(chosenSex: Sex) {
    setSex(chosenSex);
    startTransition(async () => {
      await saveIntakeAction({ name: name.trim(), age, sex: chosenSex });
      setStep('choice');
    });
  }

  if (step === 'underage') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="sec-title">{t('underageTitle')}</h2>
          <p className="lede">{t('underageBody', { phone: orgPhone })}</p>
          <Button asChild variant="outline" className="self-start">
            <Link href="/">{t('back')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'choice') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 px-1">
          <span className="kicker">
            <span className="sq" /> {t('choiceKicker')}
          </span>
          <h2 className="sec-title">{t('choiceTitle', { name: name.trim() })}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/providers" className="group no-underline">
            <Card className="relative isolate h-full overflow-hidden transition-transform group-hover:-translate-y-1">
              <CardContent className="flex flex-col gap-2 pt-6">
                <h3 className="font-display text-xl text-indigo-deep">{t('choiceProviderTitle')}</h3>
                <p className="text-sm text-ink-soft">{t('choiceProviderSub')}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/book/earliest" className="group no-underline">
            <Card className="relative isolate h-full overflow-hidden transition-transform group-hover:-translate-y-1">
              <CardContent className="flex flex-col gap-2 pt-6">
                <h3 className="font-display text-xl text-indigo-deep">{t('choiceEarliestTitle')}</h3>
                <p className="text-sm text-ink-soft">{t('choiceEarliestSub')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        <button type="button" onClick={() => setStep(0)} className="self-start text-sm font-semibold text-indigo underline-offset-4 hover:underline">
          {t('restart')}
        </button>
      </div>
    );
  }

  return (
    <Card className="relative isolate overflow-hidden">
      <Motif name="tree-circle" size={110} className="pointer-events-none absolute -right-3 -top-3 z-0 h-24 w-24 opacity-40" />
      <CardContent className="relative z-10 flex flex-col gap-5 pt-6">
        <ProgressDots total={3} current={dotIndex} label={t('title')} />

        {step === 0 && (
          <div className="flex flex-col gap-3">
            <span className="kicker">
              <span className="sq" /> {t('step1Kicker')}
            </span>
            <Label htmlFor="intake-name">{t('nameLabel')}</Label>
            <p className="hindi text-sm text-ink-soft">{t('nameHindi')}</p>
            <Input
              id="intake-name"
              autoFocus
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goName()}
            />
            <Button onClick={goName} disabled={!name.trim()} size="lg" className="h-12 self-end px-8">
              {t('next')}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <span className="kicker">
              <span className="sq" /> {t('step2Kicker')}
            </span>
            <Label htmlFor="intake-age">{t('ageLabel')}</Label>
            <p className="hindi text-sm text-ink-soft">{t('ageHindi')}</p>
            <Input
              id="intake-age"
              inputMode="numeric"
              autoFocus
              placeholder={t('agePlaceholder')}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && goAge()}
            />
            {ageError ? <p className="text-sm text-terracotta-deep">{ageError}</p> : null}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                {t('back')}
              </Button>
              <Button onClick={goAge} disabled={!ageInput} size="lg" className="h-12 px-8">
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <span className="kicker">
              <span className="sq" /> {t('step3Kicker')}
            </span>
            <Label>{t('sexLabel')}</Label>
            <p className="hindi text-sm text-ink-soft">{t('sexHindi')}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {SEX_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => finishIntake(opt.value)}
                  className="min-h-11 rounded-soft bg-cream px-4 py-3 text-left text-[14.5px] font-medium text-ink shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors hover:bg-lilac-tint data-[selected=true]:bg-lilac-tint"
                  data-selected={sex === opt.value}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(1)} className="self-start">
              {t('back')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

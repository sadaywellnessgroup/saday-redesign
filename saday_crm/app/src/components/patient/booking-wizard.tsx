'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ProgressDots } from '@/components/ui/progress-dots';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn, formatISTTime, formatISTWeekdayShort, formatPaise } from '@/lib/utils';
import { buildDayStrip } from '@/lib/booking/logic';
import type { AvailableSlot, ProviderSessionType } from '@/lib/domain';
import { createBookingAction, type CreateBookingInput } from '@/app/(public)/book/actions';

type Step = 'type' | 'date' | 'time' | 'summary';
const STEP_ORDER: Step[] = ['type', 'date', 'time', 'summary'];
const DAY_STRIP_DAYS = 7;

export function BookingWizard({
  providerId,
  providerName,
  sessionTypes,
  slotsByType,
  bookingChannel,
  rescheduleFromId,
  initialSessionTypeId,
  initialSlot,
}: {
  providerId: string;
  providerName: string;
  sessionTypes: ProviderSessionType[];
  slotsByType: Record<string, AvailableSlot[]>;
  bookingChannel: 'patient_self' | 'earliest_available';
  rescheduleFromId?: string;
  initialSessionTypeId?: string;
  initialSlot?: AvailableSlot;
}) {
  const t = useTranslations('booking');
  const [step, setStep] = useState<Step>(initialSlot ? 'summary' : 'type');
  const [sessionTypeId, setSessionTypeId] = useState<string | null>(initialSessionTypeId ?? null);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSlot ? istDate(initialSlot.slotStart) : null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(initialSlot ?? null);
  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sessionType = sessionTypes.find((s) => s.id === sessionTypeId) ?? null;
  const dayStrip = useMemo(() => {
    const slotsForType = sessionTypeId ? (slotsByType[sessionTypeId] ?? []) : [];
    return buildDayStrip(new Date(), DAY_STRIP_DAYS, slotsForType);
  }, [sessionTypeId, slotsByType]);
  const activeDay = dayStrip.find((d) => d.dateISO === selectedDate) ?? null;

  const stepIndex = STEP_ORDER.indexOf(step);

  function chooseType(st: ProviderSessionType) {
    setSessionTypeId(st.id);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep('date');
  }
  function chooseDate(dateISO: string) {
    setSelectedDate(dateISO);
    setSelectedSlot(null);
    setStep('time');
  }
  function chooseSlot(slot: AvailableSlot) {
    setSelectedSlot(slot);
    setStep('summary');
  }

  function submit() {
    if (!sessionType || !selectedSlot) return;
    if (!consent) {
      setConsentTouched(true);
      return;
    }
    const input: CreateBookingInput = {
      providerId,
      sessionTypeId: sessionType.id,
      slotStartISO: selectedSlot.slotStart,
      durationMinutes: sessionType.durationMinutes,
      bufferMinutes: sessionType.bufferMinutes,
      pricePaise: sessionType.pricePaise,
      bookingChannel,
      rescheduleFromId,
    };
    startTransition(async () => {
      await createBookingAction(input);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={STEP_ORDER.length} current={Math.max(stepIndex, 0)} label={t('kicker')} />

      {step === 'type' && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <h2 className="sec-title">{t('chooseSessionType')}</h2>
            {sessionTypes.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => chooseType(st)}
                className={cn(
                  'flex min-h-[64px] items-center justify-between rounded-soft bg-cream px-4 py-3 text-left transition-colors hover:bg-lilac-tint',
                  sessionTypeId === st.id && 'bg-lilac-tint shadow-[inset_0_0_0_1.5px_var(--indigo)]',
                )}
              >
                <div>
                  <p className="text-[14.5px] font-semibold text-ink">{st.nameEn}</p>
                  <p className="text-xs text-ink-soft">{t('durationMinutes', { minutes: st.durationMinutes })}</p>
                </div>
                <span className="font-display text-base text-indigo-deep">{formatPaise(st.pricePaise)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 'date' && sessionType && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <button type="button" onClick={() => setStep('type')} className="self-start text-xs font-semibold text-indigo">
              ← {sessionType.nameEn}
            </button>
            <h2 className="sec-title">{t('chooseDate')}</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dayStrip.map((day) => (
                <button
                  key={day.dateISO}
                  type="button"
                  disabled={!day.hasSlots}
                  onClick={() => chooseDate(day.dateISO)}
                  className={cn(
                    'flex h-16 w-14 flex-none flex-col items-center justify-center gap-0.5 rounded-soft text-xs font-semibold transition-colors',
                    day.hasSlots ? 'bg-cream text-ink hover:bg-lilac-tint' : 'bg-cream/50 text-ink-soft/50',
                    selectedDate === day.dateISO && 'bg-indigo text-cream',
                  )}
                >
                  <span>{formatISTWeekdayShort(`${day.dateISO}T12:00:00.000Z`).split(' ')[0]}</span>
                  <span className="font-display text-base">{day.dateISO.slice(8, 10)}</span>
                  {!day.hasSlots ? <span className="text-[9px] font-normal">{t('fullDay')}</span> : null}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'time' && sessionType && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <button type="button" onClick={() => setStep('date')} className="self-start text-xs font-semibold text-indigo">
              ← {t('chooseDate')}
            </button>
            <h2 className="sec-title">{t('chooseTime')}</h2>
            {activeDay && activeDay.slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {activeDay.slots.map((slot) => (
                  <button
                    key={slot.slotStart}
                    type="button"
                    onClick={() => chooseSlot(slot)}
                    className={cn(
                      'min-h-11 rounded-soft bg-cream text-sm font-semibold text-ink transition-colors hover:bg-lilac-tint',
                      selectedSlot?.slotStart === slot.slotStart && 'bg-indigo text-cream',
                    )}
                  >
                    {formatISTTime(slot.slotStart)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">{t('noSlotsThisDay')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'summary' && sessionType && selectedSlot && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <h2 className="sec-title">{t('summaryTitle')}</h2>
              <dl className="flex flex-col gap-2 text-sm">
                <Row label={t('provider')} value={providerName} />
                <Row label={t('sessionType')} value={sessionType.nameEn} />
                <Row label={t('dateTime')} value={`${formatISTWeekdayShort(selectedSlot.slotStart)}, ${formatISTTime(selectedSlot.slotStart)} IST`} />
              </dl>
              <Separator />
              <dl className="flex flex-col gap-1.5 text-sm">
                <Row label={t('priceLabel')} value={formatPaise(sessionType.pricePaise)} />
                <Row label={t('platformFeeLabel')} value={t('included')} muted />
              </dl>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{t('totalLabel')}</span>
                <span className="font-display text-xl text-indigo-deep">{formatPaise(sessionType.pricePaise)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <h2 className="sec-title">{t('consentTitle')}</h2>
              <label className="flex items-start gap-3 text-sm text-ink-soft">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                <span>{t('consentBody')}</span>
              </label>
              {consentTouched && !consent ? <p className="text-sm text-terracotta-deep">{t('consentRequired')}</p> : null}
            </CardContent>
          </Card>

          {!initialSlot ? (
            <button type="button" onClick={() => setStep('time')} className="self-start text-xs font-semibold text-indigo">
              ← {t('backToSummary')}
            </button>
          ) : null}

          <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 -mx-4 mt-1 bg-gradient-to-t from-cream via-cream/95 to-transparent px-4 pb-3 pt-6 md:bottom-4">
            <Button size="lg" className="h-14 w-full text-base shadow-feather-lg" disabled={isPending} onClick={submit}>
              {isPending ? t('processing') : t('payCta', { price: formatPaise(sessionType.pricePaise) })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className={cn('font-medium text-ink', muted && 'text-ink-soft')}>{value}</span>
    </div>
  );
}

function istDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

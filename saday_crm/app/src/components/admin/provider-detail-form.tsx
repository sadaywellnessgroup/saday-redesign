'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChipGroup, Field } from '@/components/provider/chip-group';
import {
  saveProviderAction,
  saveSessionTypeAction,
  type AdminProviderFormInput,
} from '@/app/(admin)/admin/providers/[id]/actions';

const TITLE_OPTIONS = [
  { value: 'psychiatrist', label: 'Psychiatrist' },
  { value: 'clinical_psychologist', label: 'Clinical psychologist' },
  { value: 'counselling_psychologist', label: 'Counselling psychologist' },
  { value: 'psychotherapist', label: 'Psychotherapist' },
  { value: 'counsellor', label: 'Counsellor' },
];

export interface SessionTypeRow {
  id: string;
  nameEn: string;
  durationMinutes: number;
  bufferMinutes: number;
  pricePaise: number;
  isActive: boolean;
}

/** /admin/providers/[id] — profile fields (read/edit), commission %,
 * active/inactive and onboarding status (D-020). This is also the one
 * place session-type prices are set (README: provider console shows them
 * read-only). */
export function ProviderDetailForm({
  providerId,
  council,
  onboardingLabel,
  initial,
  sessionTypes,
  labels,
}: {
  providerId: string;
  council: string;
  onboardingLabel: string;
  initial: AdminProviderFormInput;
  sessionTypes: SessionTypeRow[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof AdminProviderFormInput>(key: K, value: AdminProviderFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveProviderAction(providerId, form);
      if (result.ok) {
        toast.success(labels.saved);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
              {labels.onboardingStatus}
            </span>
            <Badge variant={onboardingLabel === labels.verified ? 'default' : 'turmeric'}>{onboardingLabel}</Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} />
              <label htmlFor="isActive" className="text-[14px] font-semibold text-ink">
                {labels.activeLabel}
              </label>
            </div>
            <Field label={labels.commissionLabel} hint={labels.commissionHint}>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-11 w-24"
                  value={form.commissionPct}
                  onChange={(e) => set('commissionPct', Number(e.target.value))}
                />
                <span className="text-ink-soft">%</span>
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-5">
          <h2 className="sec-title">{labels.profileSection}</h2>
          <Field label={labels.professionalTitle}>
            <ChipGroup
              options={TITLE_OPTIONS}
              value={[form.professionalTitle]}
              onChange={(next) => next[0] && set('professionalTitle', next[0])}
              multiple={false}
              ariaLabel={labels.professionalTitle}
            />
          </Field>
          <Field label={labels.qualifications} hint={labels.qualificationsHint}>
            <Input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} className="h-11" />
          </Field>
          <Field label={`${council} ${labels.registrationNumber}`} hint={labels.registrationNumberHint}>
            <Input value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} className="h-11" />
          </Field>
          <Field label={labels.languagesSpoken} hint={labels.languagesSpokenHint}>
            <Input value={form.languagesSpoken} onChange={(e) => set('languagesSpoken', e.target.value)} className="h-11" />
          </Field>
          <Field label={labels.specialisations} hint={labels.specialisationsHint}>
            <Input value={form.specialisations} onChange={(e) => set('specialisations', e.target.value)} className="h-11" />
          </Field>
          <Field label={labels.bioShort}>
            <Textarea rows={2} value={form.bioShort} onChange={(e) => set('bioShort', e.target.value)} />
          </Field>
          <Field label={labels.bioLong}>
            <Textarea rows={5} value={form.bioLong} onChange={(e) => set('bioLong', e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <Switch
              id="accepting"
              checked={form.isAcceptingPatients}
              onCheckedChange={(v) => set('isAcceptingPatients', v)}
            />
            <label htmlFor="accepting" className="text-[14px] font-semibold text-ink">
              {labels.acceptingLabel}
            </label>
          </div>
          <Button size="lg" className="h-12 self-start" disabled={isPending} onClick={save}>
            {labels.save}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h2 className="sec-title">{labels.sessionTypesSection}</h2>
          <p className="text-xs text-ink-soft">{labels.sessionTypesNote}</p>
          <div className="flex flex-col gap-2">
            {sessionTypes.map((type) => (
              <SessionTypeRowEditor key={type.id} providerId={providerId} type={type} labels={labels} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionTypeRowEditor({
  providerId,
  type,
  labels,
}: {
  providerId: string;
  type: SessionTypeRow;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [name, setName] = useState(type.nameEn);
  const [rupees, setRupees] = useState(String(type.pricePaise / 100));
  const [active, setActive] = useState(type.isActive);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await saveSessionTypeAction(providerId, {
        id: type.id,
        nameEn: name,
        pricePaise: Math.round(Number(rupees) * 100),
        isActive: active,
      });
      if (result.ok) {
        toast.success(labels.saved);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const dirty = name !== type.nameEn || Math.round(Number(rupees) * 100) !== type.pricePaise || active !== type.isActive;

  return (
    <div className="flex flex-col gap-2 rounded-soft bg-cream px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 sm:max-w-[220px]" aria-label="Session type name" />
        <p className="whitespace-nowrap text-xs text-ink-soft">
          {type.durationMinutes} min + {type.bufferMinutes} min buffer
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-ink-soft">₹</span>
        <Input
          type="number"
          min={0}
          step={1}
          value={rupees}
          onChange={(e) => setRupees(e.target.value)}
          className="h-10 w-24"
          aria-label={labels.priceLabel}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} aria-label={labels.sessionTypeActive} />
        <span className="text-xs text-ink-soft">{labels.sessionTypeActive}</span>
      </div>
      <Button size="sm" variant="outline" disabled={!dirty || isPending} onClick={save}>
        {labels.save}
      </Button>
    </div>
  );
}

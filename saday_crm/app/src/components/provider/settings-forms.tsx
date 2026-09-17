'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ChipGroup, Field } from '@/components/provider/chip-group';
import { saveNotificationPrefsAction, saveProfileAction, type ProfileFormInput } from '@/app/(provider)/pro/more/actions';

const TITLE_OPTIONS = [
  { value: 'psychiatrist', label: 'Psychiatrist' },
  { value: 'clinical_psychologist', label: 'Clinical psychologist' },
  { value: 'counselling_psychologist', label: 'Counselling psychologist' },
  { value: 'psychotherapist', label: 'Psychotherapist' },
  { value: 'counsellor', label: 'Counsellor' },
];

export function ProfileForm({ initial, council }: { initial: ProfileFormInput; council: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormInput>(key: K, value: ProfileFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveProfileAction(form);
      if (result.ok) {
        toast.success('Profile saved.');
        router.refresh();
      } else {
        toast.error('Pick a professional title first.');
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-5">
        <Field label="Professional title">
          <ChipGroup
            options={TITLE_OPTIONS}
            value={[form.professionalTitle]}
            onChange={(next) => next[0] && set('professionalTitle', next[0])}
            multiple={false}
            ariaLabel="Professional title"
          />
        </Field>
        <Field label="Qualifications" hint="Comma separated — shown on your public profile.">
          <Input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} className="h-11" />
        </Field>
        <Field label={`${council} registration number`} hint="Shown publicly on your provider card (D-030).">
          <Input value={form.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value)} className="h-11" />
        </Field>
        <Field label="Languages" hint="Comma separated, e.g. en, hi, mr">
          <Input value={form.languagesSpoken} onChange={(e) => set('languagesSpoken', e.target.value)} className="h-11" />
        </Field>
        <Field label="Specialisations" hint="Comma separated.">
          <Input value={form.specialisations} onChange={(e) => set('specialisations', e.target.value)} className="h-11" />
        </Field>
        <Field label="Short bio">
          <Textarea rows={2} value={form.bioShort} onChange={(e) => set('bioShort', e.target.value)} />
        </Field>
        <Field label="Full bio">
          <Textarea rows={5} value={form.bioLong} onChange={(e) => set('bioLong', e.target.value)} />
        </Field>
        <div className="flex items-center gap-3">
          <Switch
            id="accepting"
            checked={form.isAcceptingPatients}
            onCheckedChange={(v) => set('isAcceptingPatients', v)}
          />
          <label htmlFor="accepting" className="text-[14px] font-semibold text-ink">
            Accepting new patients
          </label>
        </div>
        <Button size="lg" className="h-12 self-start" disabled={isPending} onClick={save}>
          Save profile
        </Button>
      </CardContent>
    </Card>
  );
}

const PREF_LABELS: { key: string; label: string; hint: string }[] = [
  { key: 'newBooking', label: 'New booking', hint: 'When a patient books one of your slots.' },
  { key: 'cancellation', label: 'Cancellation', hint: 'When a patient cancels or reschedules.' },
  { key: 'sessionReminder', label: 'Session reminder', hint: 'An hour before each session.' },
  { key: 'newMessage', label: 'New message', hint: 'When a patient writes to you.' },
  { key: 'followUpResponse', label: 'Follow-up response', hint: 'When a check-in or feedback answer arrives.' },
  { key: 'payoutMarked', label: 'Payout marked', hint: 'When admin marks a payout as paid.' },
];

export function NotificationForm({ initial }: { initial: Record<string, boolean> }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle(key: string, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      await saveNotificationPrefsAction(next);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-5">
        {PREF_LABELS.map((pref) => (
          <div key={pref.key} className="flex min-h-[56px] items-center gap-4 rounded-soft px-1 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-semibold text-ink">{pref.label}</p>
              <p className="text-xs text-ink-soft">{pref.hint}</p>
            </div>
            <Switch
              checked={Boolean(prefs[pref.key])}
              onCheckedChange={(v) => toggle(pref.key, v)}
              aria-label={pref.label}
              disabled={isPending}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

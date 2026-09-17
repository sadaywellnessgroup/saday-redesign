'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/provider/chip-group';
import { saveSettingsAction, type SettingsFormInput } from '@/app/(admin)/admin/settings/actions';

/** /admin/settings — org name/contacts + the four §14 Q4 policy numbers +
 * consent version, all in one save (D-020). */
export function SettingsForm({ initial, labels }: { initial: SettingsFormInput; labels: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof SettingsFormInput>(key: K, value: SettingsFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveSettingsAction(form);
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
        <CardContent className="flex flex-col gap-4 pt-5">
          <h2 className="sec-title">{labels.orgSection}</h2>
          <Field label={labels.orgName}>
            <Input value={form.orgName} onChange={(e) => set('orgName', e.target.value)} className="h-11" />
          </Field>
          <Field label={labels.orgWhatsapp}>
            <Input value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} className="h-11" />
          </Field>
          <Field label={labels.orgSupportEmail}>
            <Input type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} className="h-11" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div>
            <h2 className="sec-title">{labels.policiesSection}</h2>
            <p className="text-xs text-ink-soft">{labels.policiesNote}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.cancellationMinNoticeHours}>
              <Input
                type="number"
                min={1}
                value={form.cancellationMinNoticeHours}
                onChange={(e) => set('cancellationMinNoticeHours', Number(e.target.value))}
                className="h-11"
              />
            </Field>
            <Field label={labels.cancellationRefundPct}>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.cancellationRefundPct}
                onChange={(e) => set('cancellationRefundPct', Number(e.target.value))}
                className="h-11"
              />
            </Field>
            <Field label={labels.rescheduleMinNoticeHours}>
              <Input
                type="number"
                min={1}
                value={form.rescheduleMinNoticeHours}
                onChange={(e) => set('rescheduleMinNoticeHours', Number(e.target.value))}
                className="h-11"
              />
            </Field>
            <Field label={labels.rescheduleMaxCount}>
              <Input
                type="number"
                min={0}
                value={form.rescheduleMaxCount}
                onChange={(e) => set('rescheduleMaxCount', Number(e.target.value))}
                className="h-11"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <h2 className="sec-title">{labels.consentSection}</h2>
          <Field label={labels.consentVersion}>
            <Input
              value={form.telemedicineConsentVersion}
              onChange={(e) => set('telemedicineConsentVersion', e.target.value)}
              className="h-11 max-w-xs"
            />
          </Field>
        </CardContent>
      </Card>

      <Button size="lg" className="h-12 self-start" disabled={isPending} onClick={save}>
        {labels.save}
      </Button>
    </div>
  );
}

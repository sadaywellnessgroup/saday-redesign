'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { changeClientPhoneAction } from '@/app/(admin)/admin/clients/[id]/actions';

/** D-031 — phone is an attribute, not identity. Admin can migrate a
 * client's phone after an identity check, behind an explicit confirm
 * Sheet (never a silent inline edit — Sheet not Dialog per ui-references
 * §C). */
export function ChangePhoneSheet({
  patientId,
  currentPhone,
  labels,
}: {
  patientId: string;
  currentPhone: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await changeClientPhoneAction(patientId, phone);
      if (result.ok) {
        toast.success(labels.changePhoneSaved);
        setOpen(false);
        setPhone('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {labels.changePhone}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-softer">
          <SheetHeader>
            <SheetTitle>{labels.changePhoneSheetTitle}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 pt-3">
            <p className="text-sm text-ink-soft">{labels.changePhoneNote}</p>
            <p className="text-xs text-ink-soft">
              {labels.phone}: <span className="font-semibold text-ink">{currentPhone}</span>
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-phone" className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-indigo">
                {labels.changePhoneLabel}
              </label>
              <Input
                id="new-phone"
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="h-11 flex-1" onClick={() => setOpen(false)}>
                {labels.changePhoneCancel}
              </Button>
              <Button className="h-11 flex-1" disabled={isPending || phone.trim().length === 0} onClick={confirm}>
                {labels.changePhoneConfirm}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

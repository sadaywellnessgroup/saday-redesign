'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationPolicies } from '@/lib/domain';
import { cancelAppointmentAction } from '@/app/(client)/app/sessions/actions';

/** Reschedule/Cancel affordance on an upcoming session card (route 9).
 * Policy text is sourced live from `organization_policies` (D-029 — admin
 * has no policy on clinical-body tables, but this read is public policy
 * text, not clinical data). Sheet, not Dialog, per ui-references §C. */
export function SessionActionSheet({
  appointmentId,
  providerId,
  policies,
}: {
  appointmentId: string;
  providerId: string;
  policies: OrganizationPolicies;
}) {
  const t = useTranslations('appSessions');
  const router = useRouter();
  const [open, setOpen] = useState<'cancel' | 'reschedule' | null>(null);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  function confirmCancel() {
    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId, reason);
      if (result.ok) {
        toast.success(t('cancelledToast'));
        setOpen(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen('reschedule')} className="min-h-9 rounded-full bg-cream px-4 text-[13px] font-semibold text-indigo shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint">
          {t('reschedule')}
        </button>
        <button type="button" onClick={() => setOpen('cancel')} className="min-h-9 rounded-full bg-cream px-4 text-[13px] font-semibold text-terracotta-deep shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint">
          {t('cancel')}
        </button>
      </div>

      <Sheet open={open === 'cancel'} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-softer">
          <SheetHeader>
            <SheetTitle>{t('cancelSheetTitle')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 pt-3">
            <p className="text-sm text-ink-soft">
              {t('cancelPolicyText', { hours: policies.cancellationMinNoticeHours, pct: policies.cancellationRefundPct })}
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cancel-reason" className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-indigo">
                {t('cancelReasonLabel')}
              </label>
              <Textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[72px]" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="h-11 flex-1" onClick={() => setOpen(null)}>
                {t('cancelKeep')}
              </Button>
              <Button variant="destructive" className="h-11 flex-1" disabled={isPending} onClick={confirmCancel}>
                {t('cancelConfirm')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={open === 'reschedule'} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-softer">
          <SheetHeader>
            <SheetTitle>{t('rescheduleSheetTitle')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 pt-3">
            <p className="text-sm text-ink-soft">
              {t('reschedulePolicyText', { count: policies.rescheduleMaxCount, hours: policies.rescheduleMinNoticeHours })}
            </p>
            <Button asChild size="lg" className="h-12">
              <Link href={`/book/${providerId}?reschedule=${appointmentId}`}>{t('reschedulePick')}</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

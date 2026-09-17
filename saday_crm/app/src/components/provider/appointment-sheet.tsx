'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarX2, FileText, UserRound, Video } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusPill } from '@/components/provider/status-pill';
import { cancelByProviderAction, markCompletedAction, markNoShowAction } from '@/app/(provider)/pro/actions';
import type { AppointmentStatus } from '@/lib/domain';

/** Everything the sheet needs, already formatted on the server — no repo
 * access and no PHI beyond what the card already shows. */
export interface AppointmentSummary {
  id: string;
  patientId: string;
  patientName: string;
  sessionTypeName: string;
  whenLabel: string;
  timeLabel: string;
  durationMinutes: number;
  status: AppointmentStatus;
  isPast: boolean;
  noteId: string | null;
  noteSigned: boolean;
}

export function AppointmentSheet({
  appointment,
  children,
  triggerClassName,
  triggerLabel,
}: {
  appointment: AppointmentSummary;
  children: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const noteHref = appointment.noteId
    ? `/pro/patients/${appointment.patientId}/notes/${appointment.noteId}`
    : `/pro/patients/${appointment.patientId}/notes/new?appointment=${appointment.id}`;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(success);
        setOpen(false);
        setCancelling(false);
        setReason('');
        router.refresh();
      } else {
        toast.error(result.error === 'reason_required' ? 'Add a reason first.' : 'That did not work.');
      }
    });
  }

  const canCancel = appointment.status === 'scheduled';
  const canNoShow = appointment.status === 'scheduled' || appointment.status === 'in_progress';
  const canComplete = appointment.status === 'scheduled' && appointment.isPast;

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel ?? `${appointment.patientName}, ${appointment.timeLabel}`}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {children}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-softer sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{appointment.patientName}</SheetTitle>
            <SheetDescription>
              {appointment.sessionTypeName} · {appointment.whenLabel} · {appointment.durationMinutes} min
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 pt-4">
            <StatusPill status={appointment.status} className="self-start" />

            <div className="flex flex-col gap-2">
              <Link href={`/pro/patients/${appointment.patientId}`} className="no-underline">
                <Button variant="outline" className="h-12 w-full justify-start gap-3">
                  <UserRound className="h-4 w-4" />
                  Open patient
                </Button>
              </Link>

              <Link href={noteHref} className="no-underline">
                <Button variant="outline" className="h-12 w-full justify-start gap-3">
                  <FileText className="h-4 w-4" />
                  {appointment.noteId ? (appointment.noteSigned ? 'View note' : 'Continue draft note') : 'Write note'}
                </Button>
              </Link>

              {appointment.status === 'scheduled' && !appointment.isPast ? (
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start gap-3"
                  onClick={() => toast.info('Video rooms are minted at join time — wired with 100ms in P5 (D-013).')}
                >
                  <Video className="h-4 w-4" />
                  Join session
                </Button>
              ) : null}

              {canComplete ? (
                <Button
                  variant="secondary"
                  className="h-12 w-full justify-start gap-3"
                  disabled={isPending}
                  onClick={() => run(() => markCompletedAction(appointment.id), 'Marked completed.')}
                >
                  Mark completed
                </Button>
              ) : null}

              {canNoShow ? (
                <Button
                  variant="secondary"
                  className="h-12 w-full justify-start gap-3"
                  disabled={isPending}
                  onClick={() => run(() => markNoShowAction(appointment.id), 'Marked as a no-show.')}
                >
                  <CalendarX2 className="h-4 w-4" />
                  Mark no-show
                </Button>
              ) : null}

              {canCancel ? (
                cancelling ? (
                  <div className="flex flex-col gap-2 rounded-soft bg-cream p-3">
                    <label htmlFor="cancel-reason" className="text-[13px] font-semibold text-ink">
                      Reason for cancelling
                    </label>
                    <Textarea
                      id="cancel-reason"
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Shared with the patient in the cancellation notice."
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        className="h-11 flex-1"
                        disabled={isPending || !reason.trim()}
                        onClick={() => run(() => cancelByProviderAction(appointment.id, reason), 'Session cancelled.')}
                      >
                        Confirm cancel
                      </Button>
                      <Button variant="ghost" className="h-11" onClick={() => setCancelling(false)}>
                        Keep
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" className="h-12 w-full justify-start gap-3" onClick={() => setCancelling(true)}>
                    Cancel session…
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

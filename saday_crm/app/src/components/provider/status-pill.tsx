import type { AppointmentStatus } from '@/lib/domain';
import { cn } from '@/lib/utils';

/* Appointment status as a muted pill. ui-references §B: buffers/blockouts
 * and negative statuses read in a *muted* tone, never red — nothing in the
 * console should look like an alarm. */

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In session',
  completed: 'Completed',
  no_show: 'No-show',
  cancelled_by_patient: 'Cancelled — patient',
  cancelled_by_provider: 'Cancelled — you',
  rescheduled: 'Rescheduled',
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-lilac-tint text-indigo-deep',
  in_progress: 'bg-indigo text-cream',
  completed: 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)]',
  no_show: 'bg-turmeric/25 text-terracotta-deep',
  cancelled_by_patient: 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)]',
  cancelled_by_provider: 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)]',
  rescheduled: 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)]',
};

export function StatusPill({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]',
        STATUS_CLASS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Calendar block tint per status — same muted family, used by the week grid. */
export const BLOCK_CLASS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-lilac-tint text-indigo-deep',
  in_progress: 'bg-indigo text-cream',
  completed: 'bg-[#EFE7DA] text-ink-soft',
  no_show: 'bg-turmeric/20 text-terracotta-deep',
  cancelled_by_patient: 'bg-cream text-ink-soft line-through decoration-ink-soft/40',
  cancelled_by_provider: 'bg-cream text-ink-soft line-through decoration-ink-soft/40',
  rescheduled: 'bg-cream text-ink-soft',
};

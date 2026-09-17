import { cn } from '@/lib/utils';

/** Step-progress dots for the intake wizard (ui-references §B: "progress
 * dots top") and the assessment runner (route 11). Not a shadcn primitive
 * — small enough to keep local rather than pull in a Progress component. */
export function ProgressDots({ total, current, label }: { total: number; current: number; label?: string }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 rounded-full transition-all',
            i === current ? 'w-6 bg-indigo' : i < current ? 'w-2 bg-indigo/50' : 'w-2 bg-lilac-tint',
          )}
        />
      ))}
    </div>
  );
}

/** Linear bar variant for the assessment runner, which can run to 9
 * questions — dots alone would be cramped at 360px. */
export function ProgressBar({ total, current, label }: { total: number; current: number; label?: string }) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-lilac-tint"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-indigo transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-ink-soft">
        {current + 1} / {total}
      </span>
    </div>
  );
}

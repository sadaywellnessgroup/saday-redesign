'use client';

import { Minus, Plus } from 'lucide-react';

/* Compact time stepper (ui-references §B "Sleep log entry": "Bedtime/wake
 * as two compact steppers, IST") — +/- 15-minute increments rather than a
 * native <input type="time">, to match the app's chip/pill visual system. */
export function TimeStepper({ label, value, onChange }: { label: string; value: string; onChange: (next: string) => void }) {
  function step(deltaMin: number) {
    const [h, m] = value.split(':').map(Number);
    let total = (h * 60 + m + deltaMin + 24 * 60) % (24 * 60);
    const nh = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const nm = (total % 60).toString().padStart(2, '0');
    onChange(`${nh}:${nm}`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.07em] text-indigo">{label}</p>
      <div className="flex items-center justify-between rounded-soft bg-cream px-2 py-1.5 shadow-[inset_0_0_0_1.5px_var(--line)]">
        <button
          type="button"
          aria-label="-15 min"
          onClick={() => step(-15)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-indigo hover:bg-lilac-tint"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-display text-lg text-indigo-deep">{value}</span>
        <button
          type="button"
          aria-label="+15 min"
          onClick={() => step(15)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-indigo hover:bg-lilac-tint"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

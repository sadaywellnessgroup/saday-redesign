'use client';

import { cn } from '@/lib/utils';

/* Chip groups are the console's default input (ui-references §B: "dropdowns
 * /chips over free text"). 44px tap targets everywhere (§C). Selected =
 * solid indigo; unselected = cream with an inset hairline, never a border. */

export interface ChipOption {
  value: string;
  label: string;
}

export function ChipGroup({
  options,
  value,
  onChange,
  multiple = true,
  disabled = false,
  name,
  ariaLabel,
}: {
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  name?: string;
  ariaLabel?: string;
}) {
  function toggle(option: string) {
    if (disabled) return;
    if (!multiple) {
      onChange(value[0] === option ? [] : [option]);
      return;
    }
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={ariaLabel}
      data-name={name}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={selected}
            disabled={disabled}
            onClick={() => toggle(option.value)}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full px-4 text-[13.5px] font-semibold transition-colors',
              selected
                ? 'bg-indigo text-cream shadow-[0_4px_16px_rgba(62,42,120,0.24)]'
                : 'bg-cream text-indigo shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Label + helper wrapper used by every clinical field. */
export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
        {label}
        {required ? <span className="text-terracotta"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </div>
  );
}

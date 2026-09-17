import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

/** Sticky filter-chip row above the provider card stack (ui-references §B).
 * Plain links toggling a single `?f=` query param — no client JS needed,
 * works with the server-rendered list below. 44px tap targets (ui-refs §C). */
export function FilterChips({ options, active, basePath }: { options: FilterOption[]; active: string; basePath: string }) {
  return (
    <div className="sticky top-16 z-20 -mx-1 flex gap-2 overflow-x-auto bg-cream/95 px-1 py-2 backdrop-blur-sm">
      {options.map((opt) => {
        const isActive = opt.value === active;
        const href = opt.value === 'all' ? basePath : `${basePath}?f=${opt.value}`;
        return (
          <Link
            key={opt.value}
            href={href}
            className={cn(
              'flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold no-underline transition-colors',
              isActive ? 'bg-indigo text-cream shadow-feather' : 'bg-card text-indigo shadow-feather hover:bg-lilac-tint',
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { NAV_BY_ROLE, type NavRole } from './nav-config';

/** `horizontal` renders a scrollable pill row (used by AdminShell below
 * md, since the admin group is sidebar-only and has no bottom tab bar —
 * this is how it stays usable at 360px, D-033).
 *
 * Takes `role` (not the nav item array) so the icon *component
 * references* are only ever imported inside this Client Component's own
 * module graph, never passed as a prop from a Server Component — React
 * Server Components cannot serialize a function across that boundary. */
export function SidebarNav({ role, horizontal = false }: { role: NavRole; horizontal?: boolean }) {
  const pathname = usePathname();
  const { items, namespace } = NAV_BY_ROLE[role];
  const t = useTranslations(namespace);

  return (
    <nav
      className={cn(horizontal ? 'flex gap-2 overflow-x-auto pb-1' : 'flex flex-col gap-1')}
      aria-label="Primary"
    >
      {items.map((item, i) => {
        const active = i === 0 ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-full px-4 py-2.5 text-[14.5px] font-medium transition-colors',
              horizontal && 'flex-none whitespace-nowrap',
              active ? 'bg-lilac-tint font-semibold text-indigo-deep' : 'text-ink hover:bg-lilac-tint hover:text-indigo',
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

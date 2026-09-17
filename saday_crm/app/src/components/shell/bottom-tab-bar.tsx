'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { NAV_BY_ROLE, type NavRole } from './nav-config';

/* Fixed bottom nav, <md only (D-033: 360px-first). No hard borders — the
 * bar lifts off the page with shadow-feather like every other surface.
 * Takes `role`, not the item array — see the comment in sidebar-nav.tsx
 * about why icon components can't be passed down as a prop here. */
export function BottomTabBar({ role }: { role: NavRole }) {
  const pathname = usePathname();
  const { items, namespace } = NAV_BY_ROLE[role];
  const t = useTranslations(namespace);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around bg-card shadow-[0_-8px_24px_rgba(62,42,120,0.14)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold',
              active ? 'text-indigo' : 'text-ink-soft',
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

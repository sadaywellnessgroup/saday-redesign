import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BellRing, BookOpen, CalendarClock, ChevronRight, LogOut, UserCog } from 'lucide-react';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { requireProvider } from '@/lib/provider/console-data';

const LINKS = [
  { href: '/pro/availability', key: 'availability', icon: CalendarClock },
  { href: '/pro/more/materials', key: 'materials', icon: BookOpen },
  { href: '/pro/more/profile', key: 'profile', icon: UserCog },
  { href: '/pro/more/notifications', key: 'notifications', icon: BellRing },
] as const;

/** Route /pro/more — the fifth tab (D-035): everything that isn't a daily
 * surface lives behind it. */
export default async function ProviderMorePage() {
  const t = await getTranslations('pro.more');
  const { displayName } = await requireProvider();

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={displayName} />

      <div className="flex flex-col gap-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="no-underline">
              <Card>
                <CardContent className="flex min-h-[64px] items-center gap-4 py-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-lilac-tint text-indigo">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-indigo-deep">{t(`${link.key}Title`)}</span>
                    <span className="block text-xs text-ink-soft">{t(`${link.key}Sub`)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-none text-ink-soft" />
                </CardContent>
              </Card>
            </Link>
          );
        })}

        <Link href="/dev/switch-role" className="no-underline">
          <Card>
            <CardContent className="flex min-h-[64px] items-center gap-4 py-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-cream text-terracotta">
                <LogOut className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-indigo-deep">{t('signOutTitle')}</span>
                <span className="block text-xs text-ink-soft">{t('signOutSub')}</span>
              </span>
              <ChevronRight className="h-4 w-4 flex-none text-ink-soft" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

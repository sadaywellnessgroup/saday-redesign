import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageToggle } from '@/components/lang/language-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/lib/domain';

function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => w[0] && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || name.slice(0, 2).toUpperCase();
}

/* Server component — the top bar's content is static per request, the only
 * interactive pieces (language toggle) are their own client islands. */
export function TopBar({
  homeHref,
  displayName,
  role,
  profileHref = '/dev/switch-role',
}: {
  homeHref: string;
  displayName: string;
  role: Role;
  /** Where the avatar links to — defaults to the DEV ONLY role switcher
   * (provider/admin shells, out of this build's scope). The client shell
   * points this at /app/profile (route 14). */
  profileHref?: string;
}) {
  const t = useTranslations('common');
  return (
    <header className="sticky top-0 z-30 bg-cream/90 shadow-[0_1px_0_var(--line)] backdrop-blur-md">
      <div className="wrap flex h-16 items-center gap-3">
        <Link href={homeHref} className="font-display text-xl font-semibold text-indigo-deep no-underline">
          {t('wordmark')}
        </Link>
        <Badge variant="turmeric" className="hidden sm:inline-flex">
          {t('devOnly')} · {role}
        </Badge>
        <div className="ml-auto flex items-center gap-3">
          {/* D-039: provider/admin consoles are EN-only (D-019) — no
              language toggle to switch. */}
          {role === 'provider' || role === 'admin' ? null : <LanguageToggle />}
          <Link href={profileHref} aria-label={displayName} className="no-underline">
            <Avatar className="h-9 w-9 shadow-feather">
              <AvatarFallback>{initials(displayName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}

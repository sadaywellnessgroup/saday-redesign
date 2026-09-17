import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageToggle } from '@/components/lang/language-toggle';

/** Header for the `(public)` route group — intake/booking, deliberately
 * without any auth chrome (no avatar, no nav tabs). */
export function PublicHeader() {
  const t = useTranslations('common');
  return (
    <header className="sticky top-0 z-30 bg-cream/90 shadow-[0_1px_0_var(--line)] backdrop-blur-md">
      <div className="wrap flex h-16 items-center gap-3">
        <Link href="/" className="font-display text-xl font-semibold text-indigo-deep no-underline">
          {t('wordmark')}
        </Link>
        <div className="ml-auto">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}

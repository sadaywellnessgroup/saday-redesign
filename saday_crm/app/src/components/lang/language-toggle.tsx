'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setLocaleAction } from '@/i18n/actions';
import type { Locale } from '@/i18n/config';

/* Carries over the main site's .nav-lang pill (Nav.tsx) — same shape, now
 * wired to the locale cookie + a server action instead of a static link. */
export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations('common');
  const [isPending, startTransition] = useTransition();
  const other: Locale = locale === 'en' ? 'hi' : 'en';

  return (
    <button
      type="button"
      aria-label={t('languageToggle')}
      disabled={isPending}
      onClick={() => startTransition(() => setLocaleAction(other))}
      className="nav-lang disabled:opacity-60"
    >
      <span className={locale === 'en' ? '' : 'hindi'}>EN</span>
      <span aria-hidden="true">/</span>
      <span className={locale === 'hi' ? '' : 'hindi'}>हिं</span>
    </button>
  );
}

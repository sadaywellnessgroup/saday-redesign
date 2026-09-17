import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale } from './config';

/* next-intl request config, driven by a cookie rather than a URL prefix
   (BUILD_PLAN's P1 scope: "next-intl configured with locale cookie"). Both
   English and Hindi message catalogues are always loaded; next-intl's
   getMessageFallback renders the English key when a Hindi value is
   missing, so nothing ever shows a raw key (architecture.md §7). */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE, type Locale } from './config';

/** Server action behind the language toggle. Sets the locale cookie and
 * revalidates the whole tree so every shell picks up the new catalogue
 * on the next render (no full-page reload needed). */
export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}

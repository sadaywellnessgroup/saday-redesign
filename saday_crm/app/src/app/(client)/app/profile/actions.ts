'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEV_ROLE_COOKIE } from '@/lib/auth/session';
import { INTAKE_COOKIE } from '@/lib/intake/cookie';

/** Sign out (route 14) — clears the dev role + intake cookies. Real
 * Supabase session invalidation replaces this in P2 (D-014). */
export async function signOutAction() {
  const store = await cookies();
  store.delete(DEV_ROLE_COOKIE);
  store.delete(INTAKE_COOKIE);
  redirect('/');
}

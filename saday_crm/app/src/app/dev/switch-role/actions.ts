'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEV_ROLE_COOKIE } from '@/lib/auth/session';
import type { Role } from '@/lib/domain';

async function setRole(role: Role) {
  const cookieStore = await cookies();
  cookieStore.set(DEV_ROLE_COOKIE, role, { path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function setPatientRole() {
  await setRole('patient');
  redirect('/app');
}

export async function setProviderRole() {
  await setRole('provider');
  redirect('/pro');
}

export async function setAdminRole() {
  await setRole('admin');
  redirect('/admin');
}

export async function clearRole() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_ROLE_COOKIE);
  redirect('/dev/switch-role');
}

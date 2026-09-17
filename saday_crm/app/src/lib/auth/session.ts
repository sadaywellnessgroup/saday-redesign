/* DEV ONLY — this whole file is a placeholder. Real auth (phone OTP for
 * patients, email+TOTP for staff, Supabase Auth + RLS) lands in P2 per
 * architecture.md §2. Until then, `getSession()` reads a plain cookie set
 * by /dev/switch-role so screens can be built and demoed against a role
 * without a real login flow. Nothing here is a security boundary. */

import { cookies } from 'next/headers';
import { repos } from '@/lib/repos';
import { ORG_ID } from '@/lib/repos';
import type { Role } from '@/lib/domain';

export const DEV_ROLE_COOKIE = 'saday_dev_role';

export interface DevSession {
  role: Role;
  userId: string;
  displayName: string;
  organizationId: string;
  /** Present only for role === 'patient'. */
  patientId?: string;
  /** Present only for role === 'provider'. */
  providerId?: string;
}

/** The single patient / provider each dev role resolves to. Picking a fixed
 * id (rather than "whoever is logged in") keeps every demo screenshot
 * reproducible. */
const DEV_PATIENT_ID = 'pat_1';
const DEV_PROVIDER_ID = 'prov_aditya';
const DEV_ADMIN_USER_ID = 'usr_admin_1';

export async function getSession(): Promise<DevSession | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(DEV_ROLE_COOKIE)?.value as Role | undefined;
  if (role !== 'patient' && role !== 'provider' && role !== 'admin') return null;

  if (role === 'patient') {
    const patient = await repos.patient.getById(DEV_PATIENT_ID);
    if (!patient) return null;
    return {
      role,
      userId: patient.userId,
      displayName: patient.displayName,
      organizationId: ORG_ID,
      patientId: patient.id,
    };
  }

  if (role === 'provider') {
    const provider = await repos.provider.getById(DEV_PROVIDER_ID);
    if (!provider) return null;
    return {
      role,
      userId: provider.userId,
      displayName: provider.displayName,
      organizationId: ORG_ID,
      providerId: provider.id,
    };
  }

  const admin = await repos.user.getById(DEV_ADMIN_USER_ID);
  return {
    role: 'admin',
    userId: admin?.id ?? DEV_ADMIN_USER_ID,
    displayName: 'Admin',
    organizationId: ORG_ID,
  };
}

// Cookie writes for /dev/switch-role live in its own server actions file
// (src/app/dev/switch-role/actions.ts) so this module can stay import-safe
// from both server components and (in principle) client code that only
// needs the cookie name / types.

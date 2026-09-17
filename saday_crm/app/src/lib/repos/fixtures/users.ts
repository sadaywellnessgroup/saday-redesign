import type { User } from '@/lib/domain';
import { ORG_ID } from './organization';
import { providers } from './providers';
import { FIXTURE_NOW } from './time';

const NOW = FIXTURE_NOW.toISOString();

export const ADMIN_USER_ID = 'usr_admin_1';

const patientUserSeeds: { id: string; lang: 'en' | 'hi'; phoneLast4: string; unverified?: boolean }[] = [
  { id: 'usr_pat_1', lang: 'en' as const, phoneLast4: '4821' },
  { id: 'usr_pat_2', lang: 'en' as const, phoneLast4: '9012' },
  { id: 'usr_pat_3', lang: 'hi' as const, phoneLast4: '3345' },
  { id: 'usr_pat_4', lang: 'hi' as const, phoneLast4: '7788' },
  { id: 'usr_pat_5', lang: 'en' as const, phoneLast4: '2210' },
  // FIXTURE — pat_6 has been invited but has not verified a phone yet, so
  // the provider patient list has both onboarding states to show.
  { id: 'usr_pat_6', lang: 'en' as const, phoneLast4: '6650', unverified: true },
];

const patientUsers: User[] = patientUserSeeds.map((s) => ({
  id: s.id,
  organizationId: ORG_ID,
  authUserId: `auth_${s.id}`, // FIXTURE — no real Supabase auth row in P1
  role: 'patient',
  email: null,
  phoneLast4: s.phoneLast4,
  preferredLanguage: s.lang,
  totpEnrolledAt: null,
  totpRequired: false,
  idleTimeoutMinutes: 30,
  isActive: true,
  lastLoginAt: s.unverified ? null : NOW,
  emailVerifiedAt: null,
  phoneVerifiedAt: s.unverified ? null : NOW,
  createdAt: NOW,
  updatedAt: NOW,
}));

const providerUsers: User[] = providers.map((p) => ({
  id: p.userId,
  organizationId: ORG_ID,
  authUserId: `auth_${p.userId}`,
  role: 'provider',
  email: `${p.slug}@sadaywellness.com`, // FIXTURE
  phoneLast4: null,
  preferredLanguage: 'en',
  totpEnrolledAt: NOW,
  totpRequired: true,
  idleTimeoutMinutes: 15,
  isActive: true,
  lastLoginAt: NOW,
  emailVerifiedAt: NOW,
  phoneVerifiedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
}));

const adminUser: User = {
  id: ADMIN_USER_ID,
  organizationId: ORG_ID,
  authUserId: `auth_${ADMIN_USER_ID}`,
  role: 'admin',
  email: 'sadaywellnessgroup@gmail.com',
  phoneLast4: null,
  preferredLanguage: 'en',
  totpEnrolledAt: NOW,
  totpRequired: true,
  idleTimeoutMinutes: 15,
  isActive: true,
  lastLoginAt: NOW,
  emailVerifiedAt: NOW,
  phoneVerifiedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
};

export const users: User[] = [...patientUsers, ...providerUsers, adminUser];

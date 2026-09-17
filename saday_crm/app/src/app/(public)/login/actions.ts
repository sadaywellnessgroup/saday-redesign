'use server';

import { cookies } from 'next/headers';
import { DEV_ROLE_COOKIE } from '@/lib/auth/session';
import { STUB_OTP_CODE } from '@/lib/adapters/otp';

/** DEV ONLY stub login (task brief: "phone field + OTP field, code 000000,
 * sets dev role cookie patient and goes to /app"). Real phone-OTP auth
 * (WhatsApp-first, SMS fallback, Supabase Auth) lands in P2 per D-014 /
 * architecture.md §2 — this route only proves the booking → account
 * hand-off for the screens phase. */
export async function verifyOtpAction(otp: string): Promise<{ ok: boolean }> {
  if (otp !== STUB_OTP_CODE) return { ok: false };
  const store = await cookies();
  store.set(DEV_ROLE_COOKIE, 'patient', { path: '/', maxAge: 60 * 60 * 24 * 7 });
  return { ok: true };
}

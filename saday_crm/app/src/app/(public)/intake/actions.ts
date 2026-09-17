'use server';

import { cookies } from 'next/headers';
import { INTAKE_COOKIE, type IntakeData } from '@/lib/intake/cookie';

/** Persists the 3-field intake (D-004) into a cookie — no DB row yet (the
 * task brief is explicit: "Persist intake in a cookie/searchParams (no DB
 * yet)"). Read back by /providers, /book/[providerId], /book/earliest and
 * /booking/[id]/confirmed for display only; the booking itself is created
 * against the fixed dev patient id (see book/[providerId]/actions.ts). */
export async function saveIntakeAction(data: IntakeData) {
  const store = await cookies();
  store.set(INTAKE_COOKIE, encodeURIComponent(JSON.stringify(data)), {
    path: '/',
    maxAge: 60 * 60 * 2,
    sameSite: 'lax',
  });
}

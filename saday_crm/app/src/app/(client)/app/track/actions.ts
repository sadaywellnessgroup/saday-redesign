'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { getSession } from '@/lib/auth/session';

function todayIST(): string {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

export interface MoodLogInput {
  mood1to10: number;
  tags: string[];
  note: string;
}

export async function addMoodLogAction(input: MoodLogInput) {
  const session = await getSession();
  if (!session?.patientId) return { ok: false as const };
  const note = [input.tags.length ? `Tags: ${input.tags.join(', ')}` : null, input.note.trim() || null]
    .filter(Boolean)
    .join(' — ') || null;
  await repos.selfTracking.addMoodLog({
    organizationId: session.organizationId,
    patientId: session.patientId,
    logDate: todayIST(),
    mood1to10: input.mood1to10,
    note,
  });
  revalidatePath('/app');
  revalidatePath('/app/track');
  return { ok: true as const };
}

export interface SleepLogInput {
  bedTime: string;
  wakeTime: string;
  quality1to5: number;
}

function hoursBetween(bedTime: string, wakeTime: string): number {
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

export async function addSleepLogAction(input: SleepLogInput) {
  const session = await getSession();
  if (!session?.patientId) return { ok: false as const };
  await repos.selfTracking.addSleepLog({
    organizationId: session.organizationId,
    patientId: session.patientId,
    logDate: todayIST(),
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    hoursSlept: hoursBetween(input.bedTime, input.wakeTime),
    quality1to5: input.quality1to5,
  });
  revalidatePath('/app');
  revalidatePath('/app/track');
  return { ok: true as const };
}

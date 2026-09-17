import type { MoodLog, SleepLog } from '@/lib/domain';
import { ORG_ID } from './organization';
import { FIXTURE_NOW, dayOffset } from './time';

const NOW = FIXTURE_NOW.toISOString();

/* FIXTURE — 30 days of mood + sleep logs for pat_1 and pat_2, a gently
 * varying deterministic series (no randomness — day-index driven). */
const TRACKED_PATIENTS = ['pat_1', 'pat_2'];

function moodFor(dayIndex: number): number {
  // slow sine-ish wave between 4 and 8, deterministic
  const wave = Math.round(6 + 2 * Math.sin(dayIndex / 4));
  return Math.min(10, Math.max(1, wave));
}

function energyFor(dayIndex: number): number {
  return Math.min(10, Math.max(1, Math.round(5 + 2 * Math.cos(dayIndex / 5))));
}

function hoursFor(dayIndex: number): number {
  return Math.round((6 + 1.5 * Math.sin(dayIndex / 3)) * 10) / 10;
}

export const moodLogs: MoodLog[] = TRACKED_PATIENTS.flatMap((patientId) =>
  Array.from({ length: 30 }, (_, i) => {
    const dayIndex = -29 + i; // day -29 .. day 0 (today)
    return {
      id: `mood_${patientId}_${i}`,
      organizationId: ORG_ID,
      patientId,
      logDate: dayOffset(dayIndex),
      mood1to10: moodFor(dayIndex),
      energy1to10: energyFor(dayIndex),
      note: null,
      createdAt: NOW,
      updatedAt: NOW,
    } satisfies MoodLog;
  }),
);

export const sleepLogs: SleepLog[] = TRACKED_PATIENTS.flatMap((patientId) =>
  Array.from({ length: 30 }, (_, i) => {
    const dayIndex = -29 + i;
    return {
      id: `sleep_${patientId}_${i}`,
      organizationId: ORG_ID,
      patientId,
      logDate: dayOffset(dayIndex),
      hoursSlept: hoursFor(dayIndex),
      bedTime: '23:30',
      wakeTime: '07:00',
      quality1to5: Math.min(5, Math.max(1, Math.round(3 + Math.sin(dayIndex / 4)))),
      awakenings: dayIndex % 5 === 0 ? 1 : 0,
      note: null,
      createdAt: NOW,
      updatedAt: NOW,
    } satisfies SleepLog;
  }),
);

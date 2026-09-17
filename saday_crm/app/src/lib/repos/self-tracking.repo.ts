import { randomUUID } from 'node:crypto';
import type { MoodLog, SleepLog, UUID } from '@/lib/domain';
import { moodLogs, sleepLogs } from './fixtures';

export interface NewMoodLogInput {
  organizationId: UUID;
  patientId: UUID;
  logDate: string;
  mood1to10: number;
  energy1to10?: number | null;
  note?: string | null;
}

export interface NewSleepLogInput {
  organizationId: UUID;
  patientId: UUID;
  logDate: string;
  hoursSlept?: number | null;
  bedTime?: string | null;
  wakeTime?: string | null;
  quality1to5?: number | null;
  note?: string | null;
}

export interface SelfTrackingRepo {
  listMoodLogs(patientId: UUID, sinceDate?: string): Promise<MoodLog[]>;
  listSleepLogs(patientId: UUID, sinceDate?: string): Promise<SleepLog[]>;
  /** Screens-phase addition: quick-log entries append in-memory (D-021 —
   * mood/sleep are in-app only, no external write path exists yet). */
  addMoodLog(input: NewMoodLogInput): Promise<MoodLog>;
  addSleepLog(input: NewSleepLogInput): Promise<SleepLog>;
}

export class MockSelfTrackingRepo implements SelfTrackingRepo {
  async listMoodLogs(patientId: UUID, sinceDate?: string): Promise<MoodLog[]> {
    return moodLogs
      .filter((m) => m.patientId === patientId && (!sinceDate || m.logDate >= sinceDate))
      .sort((a, b) => a.logDate.localeCompare(b.logDate));
  }
  async listSleepLogs(patientId: UUID, sinceDate?: string): Promise<SleepLog[]> {
    return sleepLogs
      .filter((s) => s.patientId === patientId && (!sinceDate || s.logDate >= sinceDate))
      .sort((a, b) => a.logDate.localeCompare(b.logDate));
  }
  async addMoodLog(input: NewMoodLogInput): Promise<MoodLog> {
    const now = new Date().toISOString();
    const existingIdx = moodLogs.findIndex((m) => m.patientId === input.patientId && m.logDate === input.logDate);
    const entry: MoodLog = {
      id: existingIdx >= 0 ? moodLogs[existingIdx]!.id : `mood_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      logDate: input.logDate,
      mood1to10: input.mood1to10,
      energy1to10: input.energy1to10 ?? null,
      note: input.note ?? null,
      createdAt: existingIdx >= 0 ? moodLogs[existingIdx]!.createdAt : now,
      updatedAt: now,
    };
    if (existingIdx >= 0) moodLogs[existingIdx] = entry;
    else moodLogs.push(entry);
    return entry;
  }
  async addSleepLog(input: NewSleepLogInput): Promise<SleepLog> {
    const now = new Date().toISOString();
    const existingIdx = sleepLogs.findIndex((s) => s.patientId === input.patientId && s.logDate === input.logDate);
    const entry: SleepLog = {
      id: existingIdx >= 0 ? sleepLogs[existingIdx]!.id : `sleep_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      logDate: input.logDate,
      hoursSlept: input.hoursSlept ?? null,
      bedTime: input.bedTime ?? null,
      wakeTime: input.wakeTime ?? null,
      quality1to5: input.quality1to5 ?? null,
      awakenings: existingIdx >= 0 ? sleepLogs[existingIdx]!.awakenings : null,
      note: input.note ?? null,
      createdAt: existingIdx >= 0 ? sleepLogs[existingIdx]!.createdAt : now,
      updatedAt: now,
    };
    if (existingIdx >= 0) sleepLogs[existingIdx] = entry;
    else sleepLogs.push(entry);
    return entry;
  }
}

import type { ISODate, ISODateTime, UUID } from './common';

/** mood_logs — in-app only (D-021). */
export interface MoodLog {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  logDate: ISODate;
  mood1to10: number;
  energy1to10: number | null;
  note: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** sleep_logs — in-app only (D-021). */
export interface SleepLog {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  logDate: ISODate; // the date the patient woke
  hoursSlept: number | null;
  bedTime: string | null; // "HH:MM"
  wakeTime: string | null;
  quality1to5: number | null;
  awakenings: number | null;
  note: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

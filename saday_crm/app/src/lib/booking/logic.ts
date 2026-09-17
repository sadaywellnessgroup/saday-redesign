/* Pure booking-flow helpers — no I/O, no Next.js imports — so they are
 * trivially unit-testable (tests/booking-logic.test.ts) and reusable by
 * both the intake form (route 2) and the "earliest available" flow
 * (route 6). Mirrors the style of booking.repo.ts's searchAvailableSlots. */

import type { AvailableSlot, ProviderSessionType } from '@/lib/domain';

/** D-004/intake-spec: patients under 18 cannot self-book; the intake form
 * stops and shows a "book through a parent/guardian" message instead of a
 * provider/earliest choice. */
export const MIN_BOOKING_AGE = 18;

export function isEligibleAge(age: number): boolean {
  return Number.isFinite(age) && age >= MIN_BOOKING_AGE;
}

/** D-034: "earliest available" auto-assign always books a **first
 * consultation** for a patient with no prior appointment; follow-up types
 * are only offered to returning patients. A provider's first-consultation
 * type is the one sorted first (`sortOrder === 0`) — the fixtures and the
 * admin UI both keep the intake/first type at the top — with a key-name
 * fallback so a mis-sorted catalogue still resolves correctly. */
export function isFirstConsultationType(sessionType: ProviderSessionType): boolean {
  if (sessionType.sortOrder === 0) return true;
  const key = sessionType.key.toLowerCase();
  return key.includes('first') || key.includes('intake');
}

/** The session types a patient may be auto-assigned into. */
export function bookableTypesForPatient(
  sessionTypes: ProviderSessionType[],
  hasPriorAppointments: boolean,
): ProviderSessionType[] {
  if (hasPriorAppointments) return sessionTypes;
  const firstOnly = sessionTypes.filter(isFirstConsultationType);
  return firstOnly.length > 0 ? firstOnly : sessionTypes;
}

export interface EarliestCandidate {
  providerId: string;
  sessionTypeId: string;
  slot: AvailableSlot;
}

/** Cross-provider "earliest available" selection (route 6, D-004). Picks
 * the candidate with the earliest `slot.slotStart`; ties break on
 * `providerId` so the result is deterministic for a fixed input set (and
 * therefore screenshot-reproducible). Returns null for an empty list. */
export function pickEarliestCandidate<T extends EarliestCandidate>(candidates: T[]): T | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) => {
    if (current.slot.slotStart < best.slot.slotStart) return current;
    if (current.slot.slotStart === best.slot.slotStart && current.providerId < best.providerId) return current;
    return best;
  });
}

export interface DayStripEntry {
  /** IST calendar date, "YYYY-MM-DD". */
  dateISO: string;
  /** Slots on this day, sorted by start time. */
  slots: AvailableSlot[];
  /** true when there is at least one bookable slot — a day with none is
   * greyed out (not hidden), per ui-references §C / §E. */
  hasSlots: boolean;
}

const IST_OFFSET_MIN = 330;

function istDateISO(instant: Date): string {
  return new Date(instant.getTime() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

/** Buckets a flat slot list into `days` consecutive IST calendar days
 * starting at `fromDate`, for the 7-day horizontal day strip (route 5).
 * Every day in the range is present in the output — including days with
 * zero slots — so the caller can grey them out instead of omitting them. */
export function buildDayStrip(fromDate: Date, days: number, slots: AvailableSlot[]): DayStripEntry[] {
  const byDate = new Map<string, AvailableSlot[]>();
  for (const slot of slots) {
    const key = istDateISO(new Date(slot.slotStart));
    const bucket = byDate.get(key);
    if (bucket) bucket.push(slot);
    else byDate.set(key, [slot]);
  }

  const entries: DayStripEntry[] = [];
  for (let i = 0; i < days; i++) {
    const dateISO = istDateISO(new Date(fromDate.getTime() + i * 86_400_000));
    const daySlots = (byDate.get(dateISO) ?? []).slice().sort((a, b) => a.slotStart.localeCompare(b.slotStart));
    entries.push({ dateISO, slots: daySlots, hasSlots: daySlots.length > 0 });
  }
  return entries;
}

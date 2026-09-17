/* Deterministic time helpers for fixtures (architecture.md §5: "deterministic,
 * seeded IST dates"). Everything is computed from a fixed anchor, never from
 * `Date.now()`, so the mock dataset renders identically on every machine and
 * every run — including in `npm run screens`. */

/** Fixture anchor: 2026-09-17 10:00 IST. All "today/past/upcoming" fixture
 * data is expressed as an offset from this instant. */
export const FIXTURE_NOW = new Date('2026-09-17T04:30:00.000Z'); // = 10:00 IST

const IST_OFFSET_MIN = 330; // Asia/Kolkata, no DST

/** Build a UTC ISO instant from an IST wall-clock date + time. */
export function istInstant(dateISO: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  d.setUTCMinutes(d.getUTCMinutes() + h * 60 + m - IST_OFFSET_MIN);
  return d.toISOString();
}

/** Fixture anchor date offset by whole days, returned as "YYYY-MM-DD" (IST). */
export function dayOffset(days: number, from: Date = FIXTURE_NOW): string {
  const d = new Date(from.getTime() + days * 86_400_000 + IST_OFFSET_MIN * 60_000);
  return d.toISOString().slice(0, 10);
}

/** dayOffset() + a wall-clock time, as a UTC ISO instant. */
export function instantOffset(days: number, hhmm: string): string {
  return istInstant(dayOffset(days), hhmm);
}

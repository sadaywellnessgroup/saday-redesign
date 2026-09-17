/* Pure validation functions for the admin console (mirrors
 * src/lib/provider/availability-rules.ts's pattern) — run in the server
 * action today, and unit-testable on their own, independent of any repo
 * or form. */

/** Commission % is admin-set per provider (D-018) and must be a finite
 * percentage — 0 (Saday takes nothing) through 100 (provider keeps
 * nothing) inclusive. */
export function validateCommissionPct(pct: number): string | null {
  if (!Number.isFinite(pct)) return 'Enter a number.';
  if (pct < 0 || pct > 100) return 'Commission must be between 0 and 100%.';
  return null;
}

/** Follow-up flow timing (D-023): a whole number of hours after the
 * trigger event, at least 1 (immediate is not "a follow-up") and capped
 * at 30 days so a typo can't silently queue a message a year late. */
export function validateFollowUpHours(hours: number): string | null {
  if (!Number.isFinite(hours) || !Number.isInteger(hours)) return 'Enter a whole number of hours.';
  if (hours < 1) return 'Must be at least 1 hour after the trigger.';
  if (hours > 720) return 'Must be 720 hours (30 days) or fewer.';
  return null;
}

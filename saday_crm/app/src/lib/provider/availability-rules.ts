import type { ProviderAvailabilityRule } from '@/lib/domain';

/* Weekly recurring availability editor (route /pro/availability, D-035 +
 * MantraCare's "recurring grid separate from day-off exceptions" pattern,
 * digest §11). Rules are IST wall clock (architecture.md §10); validation
 * is a pure function so the same check runs in the server action today and
 * against Postgres in P2. */

export const WEEKDAYS = [
  { value: 0, short: 'Sun', long: 'Sunday' },
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
] as const;

export interface DraftRule {
  id?: string;
  weekday: number;
  startTime: string; // "HH:MM"
  endTime: string;
}

export type RuleErrorCode = 'bad_time' | 'end_before_start' | 'overlap' | 'too_short';

export interface RuleValidationError {
  index: number;
  code: RuleErrorCode;
  message: string;
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(hhmm: string): number {
  const m = HHMM.exec(hhmm);
  if (!m) return Number.NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function formatRange(startTime: string, endTime: string): string {
  return `${formatTime12(startTime)} – ${formatTime12(endTime)}`;
}

export function formatTime12(hhmm: string): string {
  const mins = toMinutes(hhmm);
  if (Number.isNaN(mins)) return hhmm;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Minimum usable window — shorter than the shortest session type (25 min)
 * plus its buffer would never generate a slot. */
const MIN_RANGE_MINUTES = 30;

/** Rejects malformed times, inverted ranges, ranges too short to ever hold
 * a session, and any two ranges on the same weekday that overlap. Ranges
 * that merely touch (10:00–13:00 and 13:00–15:00) are fine. */
export function validateAvailabilityRules(rules: DraftRule[]): RuleValidationError[] {
  const errors: RuleValidationError[] = [];

  rules.forEach((rule, index) => {
    const start = toMinutes(rule.startTime);
    const end = toMinutes(rule.endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.push({ index, code: 'bad_time', message: 'Use a 24-hour HH:MM time.' });
      return;
    }
    if (end <= start) {
      errors.push({ index, code: 'end_before_start', message: 'End time must be after start time.' });
      return;
    }
    if (end - start < MIN_RANGE_MINUTES) {
      errors.push({ index, code: 'too_short', message: `A window must be at least ${MIN_RANGE_MINUTES} minutes.` });
    }
  });

  for (let i = 0; i < rules.length; i += 1) {
    for (let j = i + 1; j < rules.length; j += 1) {
      const a = rules[i]!;
      const b = rules[j]!;
      if (a.weekday !== b.weekday) continue;
      const aStart = toMinutes(a.startTime);
      const aEnd = toMinutes(a.endTime);
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
      if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) continue;
      if (aStart < bEnd && bStart < aEnd) {
        const day = WEEKDAYS.find((w) => w.value === a.weekday)?.long ?? 'that day';
        errors.push({ index: j, code: 'overlap', message: `This window overlaps another ${day} window.` });
      }
    }
  }

  return errors;
}

export interface SessionSettings {
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
}

export function validateSessionSettings(settings: SessionSettings): string[] {
  const errors: string[] = [];
  if (settings.bufferMinutes < 0 || settings.bufferMinutes > 120) errors.push('bufferMinutes');
  if (settings.minNoticeHours < 0 || settings.minNoticeHours > 168) errors.push('minNoticeHours');
  if (settings.maxAdvanceDays < 1 || settings.maxAdvanceDays > 180) errors.push('maxAdvanceDays');
  return errors;
}

export function groupRulesByWeekday(rules: ProviderAvailabilityRule[]): Map<number, ProviderAvailabilityRule[]> {
  const map = new Map<number, ProviderAvailabilityRule[]>();
  for (const w of WEEKDAYS) map.set(w.value, []);
  for (const rule of rules) {
    map.get(rule.weekday)?.push(rule);
  }
  for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return map;
}

import { describe, expect, it } from 'vitest';
import {
  formatRange,
  toMinutes,
  validateAvailabilityRules,
  validateSessionSettings,
} from '@/lib/provider/availability-rules';
import { bookableTypesForPatient, isFirstConsultationType } from '@/lib/booking/logic';
import { providerSessionTypes } from '@/lib/repos/fixtures';

describe('availability rule validation', () => {
  it('accepts a clean weekly grid', () => {
    expect(
      validateAvailabilityRules([
        { weekday: 1, startTime: '10:00', endTime: '13:00' },
        { weekday: 1, startTime: '15:00', endTime: '18:00' },
        { weekday: 3, startTime: '10:00', endTime: '13:00' },
      ]),
    ).toEqual([]);
  });

  it('flags two overlapping windows on the same weekday', () => {
    const errors = validateAvailabilityRules([
      { weekday: 1, startTime: '10:00', endTime: '13:00' },
      { weekday: 1, startTime: '12:30', endTime: '15:00' },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ index: 1, code: 'overlap' });
    expect(errors[0]!.message).toContain('Monday');
  });

  it('allows windows that merely touch', () => {
    expect(
      validateAvailabilityRules([
        { weekday: 2, startTime: '10:00', endTime: '13:00' },
        { weekday: 2, startTime: '13:00', endTime: '16:00' },
      ]),
    ).toEqual([]);
  });

  it('allows the same clock window on two different weekdays', () => {
    expect(
      validateAvailabilityRules([
        { weekday: 1, startTime: '10:00', endTime: '13:00' },
        { weekday: 2, startTime: '10:00', endTime: '13:00' },
      ]),
    ).toEqual([]);
  });

  it('flags an inverted range, a zero-length range and a malformed time', () => {
    const errors = validateAvailabilityRules([
      { weekday: 4, startTime: '15:00', endTime: '12:00' },
      { weekday: 5, startTime: '11:00', endTime: '11:00' },
      { weekday: 6, startTime: '25:00', endTime: '26:00' },
    ]);
    expect(errors.map((e) => e.code)).toEqual(['end_before_start', 'end_before_start', 'bad_time']);
  });

  it('flags a window too short to ever hold a session', () => {
    const errors = validateAvailabilityRules([{ weekday: 1, startTime: '10:00', endTime: '10:20' }]);
    expect(errors[0]?.code).toBe('too_short');
  });

  it('detects a three-way overlap once per colliding pair', () => {
    const errors = validateAvailabilityRules([
      { weekday: 1, startTime: '10:00', endTime: '14:00' },
      { weekday: 1, startTime: '11:00', endTime: '15:00' },
      { weekday: 1, startTime: '13:00', endTime: '16:00' },
    ]);
    expect(errors.filter((e) => e.code === 'overlap')).toHaveLength(3);
  });

  it('parses and formats IST wall-clock times', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(Number.isNaN(toMinutes('9:30'))).toBe(true);
    expect(formatRange('09:30', '13:00')).toBe('9:30 AM – 1:00 PM');
  });

  it('bounds the session settings', () => {
    expect(validateSessionSettings({ bufferMinutes: 10, minNoticeHours: 2, maxAdvanceDays: 30 })).toEqual([]);
    expect(validateSessionSettings({ bufferMinutes: -1, minNoticeHours: 2, maxAdvanceDays: 30 })).toContain(
      'bufferMinutes',
    );
    expect(validateSessionSettings({ bufferMinutes: 10, minNoticeHours: 2, maxAdvanceDays: 0 })).toContain(
      'maxAdvanceDays',
    );
  });
});

describe('D-034 — earliest available books a first consultation for a new patient', () => {
  const adityaTypes = providerSessionTypes.filter((t) => t.providerId === 'prov_aditya');

  it('recognises the first-consultation type', () => {
    const first = adityaTypes.find((t) => t.id === 'st_aditya_first')!;
    const follow = adityaTypes.find((t) => t.id === 'st_aditya_follow')!;
    expect(isFirstConsultationType(first)).toBe(true);
    expect(isFirstConsultationType(follow)).toBe(false);
  });

  it('offers only the first consultation to a patient with no prior appointment', () => {
    const allowed = bookableTypesForPatient(adityaTypes, false);
    expect(allowed).toHaveLength(1);
    expect(allowed[0]!.id).toBe('st_aditya_first');
  });

  it('offers every type to a returning patient', () => {
    expect(bookableTypesForPatient(adityaTypes, true)).toHaveLength(adityaTypes.length);
  });

  it('falls back to the full catalogue if no type looks like a first consultation', () => {
    const onlyFollowUps = adityaTypes
      .filter((t) => t.id === 'st_aditya_follow')
      .map((t) => ({ ...t, sortOrder: 3 }));
    expect(bookableTypesForPatient(onlyFollowUps, false)).toEqual(onlyFollowUps);
  });
});

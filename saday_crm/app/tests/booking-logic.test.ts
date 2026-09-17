import { describe, expect, it } from 'vitest';
import { buildDayStrip, isEligibleAge, pickEarliestCandidate, MIN_BOOKING_AGE } from '@/lib/booking/logic';
import type { AvailableSlot } from '@/lib/domain';

function slot(overrides: Partial<AvailableSlot> = {}): AvailableSlot {
  return {
    providerId: 'prov_x',
    sessionTypeId: 'st_x',
    slotStart: '2026-09-21T04:30:00.000Z',
    durationMinutes: 25,
    bufferMinutes: 5,
    ...overrides,
  };
}

describe('isEligibleAge (18+ gate, D-004)', () => {
  it('rejects under-18 ages', () => {
    expect(isEligibleAge(17)).toBe(false);
    expect(isEligibleAge(0)).toBe(false);
    expect(isEligibleAge(MIN_BOOKING_AGE - 1)).toBe(false);
  });
  it('accepts 18 and above', () => {
    expect(isEligibleAge(18)).toBe(true);
    expect(isEligibleAge(19)).toBe(true);
    expect(isEligibleAge(64)).toBe(true);
  });
  it('rejects non-finite / NaN input rather than throwing', () => {
    expect(isEligibleAge(Number.NaN)).toBe(false);
  });
});

describe('pickEarliestCandidate (earliest-provider selection, route 6)', () => {
  it('picks the candidate with the soonest slotStart across providers', () => {
    const candidates = [
      { providerId: 'prov_b', sessionTypeId: 'st_b', slot: slot({ providerId: 'prov_b', slotStart: '2026-09-22T05:00:00.000Z' }) },
      { providerId: 'prov_a', sessionTypeId: 'st_a', slot: slot({ providerId: 'prov_a', slotStart: '2026-09-21T04:30:00.000Z' }) },
      { providerId: 'prov_c', sessionTypeId: 'st_c', slot: slot({ providerId: 'prov_c', slotStart: '2026-09-23T04:30:00.000Z' }) },
    ];
    const winner = pickEarliestCandidate(candidates);
    expect(winner?.providerId).toBe('prov_a');
  });

  it('breaks exact ties deterministically by providerId', () => {
    const candidates = [
      { providerId: 'prov_z', sessionTypeId: 'st_z', slot: slot({ providerId: 'prov_z', slotStart: '2026-09-21T04:30:00.000Z' }) },
      { providerId: 'prov_a', sessionTypeId: 'st_a', slot: slot({ providerId: 'prov_a', slotStart: '2026-09-21T04:30:00.000Z' }) },
    ];
    const winner = pickEarliestCandidate(candidates);
    expect(winner?.providerId).toBe('prov_a');
  });

  it('returns null for an empty candidate list', () => {
    expect(pickEarliestCandidate([])).toBeNull();
  });
});

describe('buildDayStrip (slot greying, ui-references §C/§E)', () => {
  it('returns every day in the window, including days with zero slots', () => {
    const from = new Date('2026-09-21T00:00:00.000Z'); // 2026-09-21 05:30 IST
    const strip = buildDayStrip(from, 7, [slot({ slotStart: '2026-09-21T05:00:00.000Z' })]);
    expect(strip).toHaveLength(7);
  });

  it('marks a day with a slot as bookable and a day without one as greyed (hasSlots: false)', () => {
    const from = new Date('2026-09-21T00:00:00.000Z');
    const strip = buildDayStrip(from, 3, [slot({ slotStart: '2026-09-21T05:00:00.000Z' })]); // 21 Sep 10:30 IST
    const day0 = strip[0]!;
    const day1 = strip[1]!;
    expect(day0.hasSlots).toBe(true);
    expect(day0.slots).toHaveLength(1);
    expect(day1.hasSlots).toBe(false);
    expect(day1.slots).toHaveLength(0);
  });
});

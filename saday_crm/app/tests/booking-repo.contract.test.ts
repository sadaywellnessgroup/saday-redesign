import { describe, expect, it } from 'vitest';
import { searchAvailableSlots, MockBookingRepo } from '@/lib/repos/booking.repo';
import type { Appointment, ProviderAvailabilityRule, ProviderBlockout } from '@/lib/domain';

const PROVIDER_ID = 'prov_aditya';
const SESSION_TYPE_ID = 'st_aditya_follow'; // 25 min + 5 min buffer = 30 min step (see fixtures/providers.ts)

// A Monday in the fixture universe, picked programmatically so the test
// never hardcodes a weekday that might drift if the fixture anchor moves.
const DATE_ISO = '2026-09-21';
const WEEKDAY = new Date(`${DATE_ISO}T00:00:00.000Z`).getUTCDay();

function rule(overrides: Partial<ProviderAvailabilityRule> = {}): ProviderAvailabilityRule {
  return {
    id: 'test_rule',
    organizationId: 'org_saday',
    providerId: PROVIDER_ID,
    sessionTypeId: null,
    weekday: WEEKDAY,
    startTime: '10:00',
    endTime: '11:00',
    validFrom: '2020-01-01',
    validUntil: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const FAR_PAST_NOW = new Date('2026-09-01T00:00:00.000Z');
const FROM = `${DATE_ISO}T00:00:00.000Z`;
const TO = `2026-09-22T00:00:00.000Z`;

describe('MockBookingRepo slot search (architecture.md §10)', () => {
  it('generates 15-minute-grid slots inside the IST availability window, sized to duration+buffer', () => {
    const slots = searchAvailableSlots(
      { providerId: PROVIDER_ID, sessionTypeId: SESSION_TYPE_ID, fromISO: FROM, toISO: TO, now: FAR_PAST_NOW },
      { rules: [rule()], blockouts: [], bookedAppointments: [] },
    );

    // 10:00-11:00 IST window, 30-minute step (25 duration + 5 buffer):
    // 10:00, 10:15, 10:30 fit (10:30 + 30min = 11:00, the boundary is inclusive);
    // 10:45 + 30min = 11:15 would overrun the window and must be excluded.
    expect(slots.map((s) => s.slotStart)).toEqual([
      `${DATE_ISO}T04:30:00.000Z`, // 10:00 IST
      `${DATE_ISO}T04:45:00.000Z`, // 10:15 IST
      `${DATE_ISO}T05:00:00.000Z`, // 10:30 IST
    ]);
    for (const slot of slots) {
      expect(slot.providerId).toBe(PROVIDER_ID);
      expect(slot.sessionTypeId).toBe(SESSION_TYPE_ID);
    }
  });

  it('subtracts a booked appointment that overlaps the slot range', () => {
    const busy: Appointment[] = [
      {
        id: 'appt_busy',
        organizationId: 'org_saday',
        patientId: 'pat_x',
        providerId: PROVIDER_ID,
        sessionTypeId: SESSION_TYPE_ID,
        scheduledAt: `${DATE_ISO}T04:45:00.000Z`, // 10:15 IST — collides with the middle slot
        durationMinutes: 25,
        bufferMinutes: 5,
        mode: 'online',
        status: 'scheduled',
        bookingChannel: 'patient_self',
        pricePaise: 90000,
        paymentStatus: 'paid',
        videoRoomId: null,
        videoProvider: null,
        startedAt: null,
        endedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        rescheduledToId: null,
        hasSignedNote: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const slots = searchAvailableSlots(
      { providerId: PROVIDER_ID, sessionTypeId: SESSION_TYPE_ID, fromISO: FROM, toISO: TO, now: FAR_PAST_NOW },
      { rules: [rule()], blockouts: [], bookedAppointments: busy },
    );

    // 10:00 survives (ends 10:30, booked slot starts 10:15 -> overlaps actually)
    // Overlap check: [10:00,10:30) vs [10:15,10:45) overlaps -> 10:00 excluded too.
    // [10:15,10:45) vs itself -> excluded. [10:30,11:00) vs [10:15,10:45) overlaps -> excluded.
    // So every slot in this narrow window collides with the one booked appointment.
    expect(slots).toHaveLength(0);
  });

  it('subtracts a block-out range', () => {
    const blockouts: ProviderBlockout[] = [
      {
        id: 'bo_1',
        organizationId: 'org_saday',
        providerId: PROVIDER_ID,
        startsAt: `${DATE_ISO}T04:30:00.000Z`, // 10:00 IST
        endsAt: `${DATE_ISO}T04:50:00.000Z`, // 10:20 IST
        reason: null,
        repeatsYearly: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const slots = searchAvailableSlots(
      { providerId: PROVIDER_ID, sessionTypeId: SESSION_TYPE_ID, fromISO: FROM, toISO: TO, now: FAR_PAST_NOW },
      { rules: [rule()], blockouts, bookedAppointments: [] },
    );

    // 10:00 slot [10:00,10:30) overlaps the block-out -> excluded.
    // 10:30 slot [10:30,11:00) does not overlap [10:00,10:20) -> kept.
    expect(slots.map((s) => s.slotStart)).toEqual([`${DATE_ISO}T05:00:00.000Z`]);
  });

  it('respects min-notice: nothing before now + minNoticeHours', () => {
    const almostAtSlotTime = new Date(`${DATE_ISO}T04:29:00.000Z`); // 1 minute before 10:00 IST
    const slots = searchAvailableSlots(
      {
        providerId: PROVIDER_ID,
        sessionTypeId: SESSION_TYPE_ID,
        fromISO: FROM,
        toISO: TO,
        now: almostAtSlotTime, // default min notice fallback is 2h (see booking.repo.ts)
      },
      { rules: [rule()], blockouts: [], bookedAppointments: [] },
    );
    expect(slots).toHaveLength(0);
  });

  it('MockBookingRepo.searchSlots wires the real fixtures through the same pure function', async () => {
    const repo = new MockBookingRepo();
    const slots = await repo.searchSlots({
      providerId: PROVIDER_ID,
      sessionTypeId: SESSION_TYPE_ID,
      fromISO: '2026-10-01T00:00:00.000Z',
      toISO: '2026-10-08T00:00:00.000Z',
      now: new Date('2026-09-17T04:30:00.000Z'),
    });
    expect(Array.isArray(slots)).toBe(true);
    for (const slot of slots) {
      expect(slot.providerId).toBe(PROVIDER_ID);
    }
  });
});

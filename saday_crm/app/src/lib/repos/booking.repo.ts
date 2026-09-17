import { randomUUID } from 'node:crypto';
import type { Appointment, AvailableSlot, ISODateTime, UUID } from '@/lib/domain';
import { appointments, providerAvailabilityRules, providerBlockouts, providerSessionTypes } from './fixtures';

const IST_OFFSET_MIN = 330; // Asia/Kolkata, no DST (architecture.md §7)
const SLOT_GRID_MINUTES = 15;

export interface SlotSearchQuery {
  providerId: UUID;
  sessionTypeId: UUID;
  /** Inclusive UTC ISO instant to search from. */
  fromISO: string;
  /** Exclusive UTC ISO instant to search to. */
  toISO: string;
  /** Injectable clock for deterministic tests; defaults to `new Date()`. */
  now?: Date;
}

/** Pure function mirroring architecture.md §10's slot-generation algorithm:
 * expand matching weekly rules (IST wall clock) into UTC instants on a
 * 15-minute grid, then subtract live appointments and block-outs, then
 * apply min-notice. No I/O — takes fixture arrays as plain data so it is
 * trivially unit-testable and swaps cleanly for a SQL-backed version later. */
export function searchAvailableSlots(
  query: SlotSearchQuery,
  data: {
    rules: typeof providerAvailabilityRules;
    blockouts: typeof providerBlockouts;
    bookedAppointments: Appointment[];
  },
): AvailableSlot[] {
  const sessionType = providerSessionTypes.find((s) => s.id === query.sessionTypeId);
  if (!sessionType || sessionType.providerId !== query.providerId) return [];

  const stepMinutes = sessionType.durationMinutes + sessionType.bufferMinutes;
  const now = query.now ?? new Date();
  const minNoticeHours = sessionType.minNoticeHours ?? 2; // org default fallback (organization_policies)
  const notBefore = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  const from = new Date(query.fromISO);
  const to = new Date(query.toISO);

  const rules = data.rules.filter(
    (r) =>
      r.providerId === query.providerId &&
      r.isActive &&
      (r.sessionTypeId === null || r.sessionTypeId === query.sessionTypeId),
  );
  const blockouts = data.blockouts.filter((b) => b.providerId === query.providerId);
  const busy = data.bookedAppointments.filter(
    (a) => a.providerId === query.providerId && (a.status === 'scheduled' || a.status === 'in_progress'),
  );

  const slots: AvailableSlot[] = [];

  for (let day = new Date(from); day < to; day = new Date(day.getTime() + 86_400_000)) {
    // weekday in IST
    const istDay = new Date(day.getTime() + IST_OFFSET_MIN * 60_000);
    const weekday = istDay.getUTCDay();
    const dateISO = istDay.toISOString().slice(0, 10);

    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;
      if (dateISO < rule.validFrom) continue;
      if (rule.validUntil && dateISO > rule.validUntil) continue;

      const [startH, startM] = rule.startTime.split(':').map(Number);
      const [endH, endM] = rule.endTime.split(':').map(Number);
      const dayStartUTC = new Date(`${dateISO}T00:00:00.000Z`);
      const ruleStart = new Date(dayStartUTC.getTime() + (startH * 60 + startM - IST_OFFSET_MIN) * 60_000);
      const ruleEnd = new Date(dayStartUTC.getTime() + (endH * 60 + endM - IST_OFFSET_MIN) * 60_000);

      for (
        let slotStart = new Date(ruleStart);
        slotStart.getTime() + stepMinutes * 60_000 <= ruleEnd.getTime();
        slotStart = new Date(slotStart.getTime() + SLOT_GRID_MINUTES * 60_000)
      ) {
        if (slotStart < from || slotStart >= to) continue;
        if (slotStart < notBefore) continue;

        const slotEnd = new Date(slotStart.getTime() + stepMinutes * 60_000);

        const overlapsAppointment = busy.some((a) => {
          const aStart = new Date(a.scheduledAt);
          const aEnd = new Date(aStart.getTime() + (a.durationMinutes + a.bufferMinutes) * 60_000);
          return slotStart < aEnd && aStart < slotEnd;
        });
        if (overlapsAppointment) continue;

        const overlapsBlockout = blockouts.some((b) => {
          const bStart = new Date(b.startsAt);
          const bEnd = new Date(b.endsAt);
          return slotStart < bEnd && bStart < slotEnd;
        });
        if (overlapsBlockout) continue;

        slots.push({
          providerId: query.providerId,
          sessionTypeId: query.sessionTypeId,
          slotStart: slotStart.toISOString(),
          durationMinutes: sessionType.durationMinutes,
          bufferMinutes: sessionType.bufferMinutes,
        });
      }
    }
  }

  return slots.sort((a, b) => a.slotStart.localeCompare(b.slotStart));
}

export interface NewAppointmentInput {
  organizationId: UUID;
  patientId: UUID;
  providerId: UUID;
  sessionTypeId: UUID;
  scheduledAt: ISODateTime;
  durationMinutes: number;
  bufferMinutes: number;
  pricePaise: number;
  bookingChannel: Appointment['bookingChannel'];
}

export interface BookingRepo {
  getById(id: UUID): Promise<Appointment | null>;
  listForPatient(patientId: UUID): Promise<Appointment[]>;
  listForProvider(providerId: UUID): Promise<Appointment[]>;
  listUpcomingForProvider(providerId: UUID, fromISO: string): Promise<Appointment[]>;
  /** Provider-scoped slot search — see `searchAvailableSlots` above. The
   * cross-provider "earliest available" path (D-004) is a P2 SQL function
   * (architecture.md §10) layered on the same shape. */
  searchSlots(query: SlotSearchQuery): Promise<AvailableSlot[]>;
  /** Screens-phase addition (not in the P1 foundation): appends an in-memory
   * row to the fixture `appointments` array so the booking flow (D-004) is
   * demoable end to end against mock data. Persists only for the life of
   * the running dev/server process — a real INSERT lands with Supabase in
   * P2. */
  create(input: NewAppointmentInput): Promise<Appointment>;
  /** Screens-phase addition: patient-initiated cancel (org policy text is
   * shown by the caller from `organization_policies`). */
  cancel(id: UUID, reason: string | null): Promise<Appointment | null>;
  /** Screens-phase addition: marks `id` rescheduled and links it to a newly
   * created appointment row. */
  markRescheduled(id: UUID, rescheduledToId: UUID): Promise<Appointment | null>;
  /** Provider console: `scheduled|in_progress -> no_show` (architecture.md
   * §10 status machine). */
  markNoShow(id: UUID): Promise<Appointment | null>;
  /** Provider console: `scheduled -> cancelled_by_provider`, reason
   * required by the UI so the patient's cancellation notice can quote it. */
  cancelByProvider(id: UUID, reason: string | null): Promise<Appointment | null>;
  /** Provider console: marks a past scheduled session completed so its
   * note can be written. */
  markCompleted(id: UUID): Promise<Appointment | null>;
}

export class MockBookingRepo implements BookingRepo {
  async getById(id: UUID): Promise<Appointment | null> {
    return appointments.find((a) => a.id === id) ?? null;
  }
  async listForPatient(patientId: UUID): Promise<Appointment[]> {
    return appointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  }
  async listForProvider(providerId: UUID): Promise<Appointment[]> {
    return appointments
      .filter((a) => a.providerId === providerId)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  async listUpcomingForProvider(providerId: UUID, fromISO: string): Promise<Appointment[]> {
    return appointments
      .filter(
        (a) =>
          a.providerId === providerId &&
          a.scheduledAt >= fromISO &&
          (a.status === 'scheduled' || a.status === 'in_progress'),
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  async searchSlots(query: SlotSearchQuery): Promise<AvailableSlot[]> {
    return searchAvailableSlots(query, {
      rules: providerAvailabilityRules,
      blockouts: providerBlockouts,
      bookedAppointments: appointments,
    });
  }
  async create(input: NewAppointmentInput): Promise<Appointment> {
    const now: ISODateTime = new Date().toISOString();
    const appointment: Appointment = {
      id: `appt_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      providerId: input.providerId,
      sessionTypeId: input.sessionTypeId,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      bufferMinutes: input.bufferMinutes,
      mode: 'online',
      status: 'scheduled',
      bookingChannel: input.bookingChannel,
      pricePaise: input.pricePaise,
      paymentStatus: 'paid', // StubPaymentGateway auto-captures (architecture.md §4)
      videoRoomId: null,
      videoProvider: null,
      startedAt: null,
      endedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      rescheduledToId: null,
      hasSignedNote: false,
      createdAt: now,
      updatedAt: now,
    };
    appointments.push(appointment);
    return appointment;
  }
  async cancel(id: UUID, reason: string | null): Promise<Appointment | null> {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return null;
    appt.status = 'cancelled_by_patient';
    appt.cancelledAt = new Date().toISOString();
    appt.cancellationReason = reason;
    appt.paymentStatus = 'refunded';
    appt.updatedAt = new Date().toISOString();
    return appt;
  }
  async markRescheduled(id: UUID, rescheduledToId: UUID): Promise<Appointment | null> {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return null;
    appt.status = 'rescheduled';
    appt.rescheduledToId = rescheduledToId;
    appt.updatedAt = new Date().toISOString();
    return appt;
  }
  async markNoShow(id: UUID): Promise<Appointment | null> {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return null;
    if (appt.status !== 'scheduled' && appt.status !== 'in_progress') return appt;
    appt.status = 'no_show';
    appt.updatedAt = new Date().toISOString();
    return appt;
  }
  async cancelByProvider(id: UUID, reason: string | null): Promise<Appointment | null> {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return null;
    if (appt.status !== 'scheduled') return appt;
    const now = new Date().toISOString();
    appt.status = 'cancelled_by_provider';
    appt.cancelledAt = now;
    appt.cancellationReason = reason;
    appt.paymentStatus = appt.paymentStatus === 'paid' ? 'refunded' : appt.paymentStatus;
    appt.updatedAt = now;
    return appt;
  }
  async markCompleted(id: UUID): Promise<Appointment | null> {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return null;
    if (appt.status !== 'scheduled' && appt.status !== 'in_progress') return appt;
    const now = new Date().toISOString();
    appt.status = 'completed';
    appt.endedAt = now;
    appt.updatedAt = now;
    return appt;
  }
}

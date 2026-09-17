import type { Appointment, AppointmentStatus, AppointmentPaymentStatus } from '@/lib/domain';
import { ORG_ID } from './organization';
import { providerSessionTypes } from './providers';
import { FIXTURE_NOW, instantOffset } from './time';

const NOW = FIXTURE_NOW.toISOString();

function sessionType(providerSlug: string, kind: 'first' | 'follow') {
  const st = providerSessionTypes.find((s) => s.id === `st_${providerSlug}_${kind}`);
  if (!st) throw new Error(`fixture: missing session type st_${providerSlug}_${kind}`);
  return st;
}

interface Seed {
  id: string;
  patientId: string;
  providerSlug: string;
  kind: 'first' | 'follow';
  day: number; // offset from FIXTURE_NOW, negative = past
  time: string; // IST wall clock "HH:MM"
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
}

/* FIXTURE — 20 appointments spanning ~6 weeks past to ~3 weeks upcoming,
 * across all 6 patients and their assigned providers (plus one earliest-
 * available booking for the unassigned patient). */
const SEEDS: Seed[] = [
  { id: 'appt_1', patientId: 'pat_1', providerSlug: 'janhavi', kind: 'first', day: -38, time: '11:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_2', patientId: 'pat_1', providerSlug: 'janhavi', kind: 'follow', day: -24, time: '11:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_3', patientId: 'pat_1', providerSlug: 'janhavi', kind: 'follow', day: -10, time: '11:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_4', patientId: 'pat_1', providerSlug: 'janhavi', kind: 'follow', day: 4, time: '11:00', status: 'scheduled', paymentStatus: 'paid' },

  { id: 'appt_5', patientId: 'pat_2', providerSlug: 'aditya', kind: 'first', day: -30, time: '10:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_6', patientId: 'pat_2', providerSlug: 'aditya', kind: 'follow', day: -16, time: '10:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_7', patientId: 'pat_2', providerSlug: 'aditya', kind: 'follow', day: -2, time: '10:00', status: 'no_show', paymentStatus: 'paid' },
  { id: 'appt_8', patientId: 'pat_2', providerSlug: 'aditya', kind: 'follow', day: 6, time: '10:30', status: 'scheduled', paymentStatus: 'paid' },

  { id: 'appt_9', patientId: 'pat_3', providerSlug: 'kritika', kind: 'first', day: -21, time: '12:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_10', patientId: 'pat_3', providerSlug: 'kritika', kind: 'follow', day: -7, time: '12:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_11', patientId: 'pat_3', providerSlug: 'kritika', kind: 'follow', day: 3, time: '12:00', status: 'scheduled', paymentStatus: 'paid' },

  { id: 'appt_12', patientId: 'pat_4', providerSlug: 'vikrant', kind: 'first', day: -45, time: '16:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_13', patientId: 'pat_4', providerSlug: 'vikrant', kind: 'follow', day: -31, time: '16:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_14', patientId: 'pat_4', providerSlug: 'vikrant', kind: 'follow', day: -17, time: '16:00', status: 'cancelled_by_patient', paymentStatus: 'refunded' },
  { id: 'appt_15', patientId: 'pat_4', providerSlug: 'vikrant', kind: 'follow', day: -3, time: '16:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_16', patientId: 'pat_4', providerSlug: 'vikrant', kind: 'follow', day: 11, time: '16:00', status: 'scheduled', paymentStatus: 'paid' },

  { id: 'appt_17', patientId: 'pat_5', providerSlug: 'surabhi', kind: 'first', day: -14, time: '10:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_18', patientId: 'pat_5', providerSlug: 'surabhi', kind: 'follow', day: 1, time: '10:00', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_19', patientId: 'pat_5', providerSlug: 'surabhi', kind: 'follow', day: 15, time: '10:00', status: 'scheduled', paymentStatus: 'pending' },

  { id: 'appt_20', patientId: 'pat_6', providerSlug: 'yatika', kind: 'first', day: 8, time: '15:00', status: 'scheduled', paymentStatus: 'paid' },

  /* FIXTURE — the provider console's own caseload. `getSession()` always
   * resolves the provider role to prov_aditya, so the Today / Calendar /
   * Patients screens need a real day's work behind them: sessions earlier
   * today (one already completed and still unwritten), sessions later
   * today, a no-show to act on, and past sessions across four patients. */
  { id: 'appt_21', patientId: 'pat_2', providerSlug: 'aditya', kind: 'follow', day: 0, time: '09:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_22', patientId: 'pat_3', providerSlug: 'aditya', kind: 'first', day: 0, time: '11:30', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_23', patientId: 'pat_5', providerSlug: 'aditya', kind: 'follow', day: 0, time: '14:00', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_24', patientId: 'pat_6', providerSlug: 'aditya', kind: 'first', day: 0, time: '16:30', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_25', patientId: 'pat_4', providerSlug: 'aditya', kind: 'follow', day: -5, time: '16:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_26', patientId: 'pat_3', providerSlug: 'aditya', kind: 'follow', day: -12, time: '11:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_27', patientId: 'pat_5', providerSlug: 'aditya', kind: 'follow', day: 2, time: '10:00', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_28', patientId: 'pat_6', providerSlug: 'aditya', kind: 'follow', day: 5, time: '15:00', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_29', patientId: 'pat_4', providerSlug: 'aditya', kind: 'follow', day: -1, time: '17:00', status: 'no_show', paymentStatus: 'paid' },
  { id: 'appt_30', patientId: 'pat_3', providerSlug: 'aditya', kind: 'follow', day: 1, time: '12:30', status: 'scheduled', paymentStatus: 'paid' },
  { id: 'appt_31', patientId: 'pat_2', providerSlug: 'aditya', kind: 'follow', day: -9, time: '10:00', status: 'completed', paymentStatus: 'paid' },
  { id: 'appt_32', patientId: 'pat_4', providerSlug: 'aditya', kind: 'follow', day: 3, time: '16:00', status: 'cancelled_by_provider', paymentStatus: 'refunded' },
];

export const appointments: Appointment[] = SEEDS.map((s) => {
  const st = sessionType(s.providerSlug, s.kind);
  const started = s.status === 'completed' || s.status === 'no_show';
  return {
    id: s.id,
    organizationId: ORG_ID,
    patientId: s.patientId,
    providerId: `prov_${s.providerSlug}`,
    sessionTypeId: st.id,
    scheduledAt: instantOffset(s.day, s.time),
    durationMinutes: st.durationMinutes,
    bufferMinutes: st.bufferMinutes,
    mode: 'online',
    status: s.status,
    bookingChannel: s.id === 'appt_20' ? 'earliest_available' : 'patient_self',
    pricePaise: st.pricePaise,
    paymentStatus: s.paymentStatus,
    videoRoomId: started ? `room_${s.id}` : null,
    videoProvider: started ? '100ms' : null,
    startedAt: s.status === 'completed' ? instantOffset(s.day, s.time) : null,
    endedAt:
      s.status === 'completed'
        ? instantOffset(s.day, s.time) // display-only in fixtures; real value = start + duration
        : null,
    cancelledAt: s.status.startsWith('cancelled') ? instantOffset(s.day, s.time) : null,
    cancellationReason: s.status === 'cancelled_by_patient' ? 'Schedule conflict (FIXTURE)' : null,
    rescheduledToId: null,
    hasSignedNote:
      s.status === 'completed' &&
      ['appt_1', 'appt_2', 'appt_5', 'appt_9', 'appt_12', 'appt_17', 'appt_26', 'appt_31'].includes(s.id),
    createdAt: NOW,
    updatedAt: NOW,
  };
});

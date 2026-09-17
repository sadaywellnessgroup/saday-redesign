import { redirect } from 'next/navigation';
import { getSession, type DevSession } from '@/lib/auth/session';
import { repos } from '@/lib/repos';
import type { Appointment, Patient, ProviderSessionType } from '@/lib/domain';
import type { AppointmentSummary } from '@/components/provider/appointment-sheet';
import { formatISTDate, formatISTTime } from '@/lib/utils';

/* Server-side helpers shared by every /pro route. Nothing here is a
 * security boundary (the dev session isn't one either — app/README.md);
 * it is the single place the console resolves "who am I and what is
 * mine", so the P2 swap to Supabase Auth + RLS touches one file. */

export interface ProviderContext extends DevSession {
  providerId: string;
}

export async function requireProvider(): Promise<ProviderContext> {
  const session = await getSession();
  if (!session || session.role !== 'provider' || !session.providerId) redirect('/dev/switch-role');
  return session as ProviderContext;
}

export const IST_OFFSET_MIN = 330;

/** "YYYY-MM-DD" for an instant, in IST. */
export function istDateKey(at: Date | string): string {
  const d = typeof at === 'string' ? new Date(at) : at;
  return new Date(d.getTime() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

/** Monday-anchored week start (IST) for a given date key. */
export function weekStartKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  const dow = d.getUTCDay(); // 0 Sun .. 6 Sat
  const delta = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDayHeading(dateKey: string): string {
  return new Date(`${dateKey}T06:00:00.000Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDayShort(dateKey: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${dateKey}T06:00:00.000Z`);
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
    day: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'UTC' }),
    month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }),
  };
}

export interface EnrichedAppointment {
  appointment: Appointment;
  patient: Patient | null;
  sessionType: ProviderSessionType | null;
  noteId: string | null;
  noteSigned: boolean;
}

/** Appointments + the patient, session type and note each row needs, in
 * one pass (the mock repos are in-memory; the real ones become a single
 * join in P2). */
export async function enrich(appointments: Appointment[]): Promise<EnrichedAppointment[]> {
  return Promise.all(
    appointments.map(async (appointment) => {
      const [patient, sessionTypes, note] = await Promise.all([
        repos.patient.getById(appointment.patientId),
        repos.provider.listSessionTypes(appointment.providerId),
        repos.clinical.getSessionNoteByAppointment(appointment.id),
      ]);
      return {
        appointment,
        patient,
        sessionType: sessionTypes.find((s) => s.id === appointment.sessionTypeId) ?? null,
        noteId: note?.id ?? null,
        noteSigned: Boolean(note?.signedAt),
      };
    }),
  );
}

export function toSummary(row: EnrichedAppointment, now: Date): AppointmentSummary {
  return {
    id: row.appointment.id,
    patientId: row.appointment.patientId,
    patientName: row.patient?.displayName ?? 'Patient',
    sessionTypeName: row.sessionType?.nameEn ?? 'Session',
    whenLabel: `${formatISTDate(row.appointment.scheduledAt)}, ${formatISTTime(row.appointment.scheduledAt)}`,
    timeLabel: formatISTTime(row.appointment.scheduledAt),
    durationMinutes: row.appointment.durationMinutes,
    status: row.appointment.status,
    isPast: new Date(row.appointment.scheduledAt) < now,
    noteId: row.noteId,
    noteSigned: row.noteSigned,
  };
}

export const SEVERITY_COLORS: Record<string, string> = {
  minimal: '#F1ECF9',
  mild: '#E9DCC4',
  moderate: '#E4C79A',
  moderately_severe: '#DDB694',
  severe: '#D8A98C',
};

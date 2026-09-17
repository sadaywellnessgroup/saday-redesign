import type { ISODateTime, Paise, UUID } from './common';

export type AppointmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled_by_patient'
  | 'cancelled_by_provider'
  | 'rescheduled';

export type BookingChannel = 'patient_self' | 'earliest_available' | 'admin';

export type AppointmentPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'complimentary';

export type AppointmentMode = 'online' | 'in_person';

/** appointments */
export interface Appointment {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  providerId: UUID;
  sessionTypeId: UUID;
  scheduledAt: ISODateTime;
  durationMinutes: number;
  bufferMinutes: number;
  mode: AppointmentMode;
  status: AppointmentStatus;
  bookingChannel: BookingChannel;
  pricePaise: Paise;
  paymentStatus: AppointmentPaymentStatus;
  videoRoomId: string | null;
  videoProvider: '100ms' | null;
  startedAt: ISODateTime | null;
  endedAt: ISODateTime | null;
  cancelledAt: ISODateTime | null;
  cancellationReason: string | null;
  rescheduledToId: UUID | null;
  hasSignedNote: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** A free slot returned by slot search (architecture.md §10) — not a DB row. */
export interface AvailableSlot {
  providerId: UUID;
  sessionTypeId: UUID;
  slotStart: ISODateTime;
  durationMinutes: number;
  bufferMinutes: number;
}

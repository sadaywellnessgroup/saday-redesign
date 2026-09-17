import type { ISODate, ISODateTime, Paise, UUID } from './common';

export type ProfessionalTitle =
  | 'psychiatrist'
  | 'clinical_psychologist'
  | 'counselling_psychologist'
  | 'psychotherapist'
  | 'counsellor';

export type RegistrationCouncil = 'NMC' | 'RCI' | 'none';

/** providers — public profile fields (D-030: registration number shown publicly). */
export interface Provider {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  slug: string;
  displayName: string;
  professionalTitle: ProfessionalTitle;
  qualifications: string[];
  specialisations: string[];
  concernsAddressed: string[];
  /** Free-text language list (not limited to the en/hi UI locales — a
   * provider may also list Marathi, Bengali, etc.). */
  languagesSpoken: string[];
  registrationCouncil: RegistrationCouncil;
  registrationNumber: string | null;
  registrationVerifiedAt: ISODateTime | null;
  yearsExperience: number;
  bioShort: string | null;
  bioLong: string | null;
  photoPath: string | null;
  commissionPct: number;
  bankAccountHolderName: string | null;
  isAcceptingPatients: boolean;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type SessionMode = 'online' | 'in_person' | 'either';

/** provider_session_types */
export interface ProviderSessionType {
  id: UUID;
  organizationId: UUID;
  providerId: UUID;
  key: string;
  nameEn: string;
  nameHi: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  pricePaise: Paise;
  mode: SessionMode;
  minNoticeHours: number | null;
  maxAdvanceDays: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** provider_availability_rules — stored as IST wall clock (architecture.md §10). */
export interface ProviderAvailabilityRule {
  id: UUID;
  organizationId: UUID;
  providerId: UUID;
  sessionTypeId: UUID | null;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "HH:MM" IST wall clock
  endTime: string;
  validFrom: ISODate;
  validUntil: ISODate | null;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** provider_blockouts — the "Days off" table of /pro/availability. */
export interface ProviderBlockout {
  id: UUID;
  organizationId: UUID;
  providerId: UUID;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  reason: string | null;
  /** MantraCare's "Repeat every year" day-off flag (digest §11). NOT yet a
   * column in `0001_schema.sql` — it needs
   * `repeats_yearly BOOLEAN NOT NULL DEFAULT false` in a follow-up
   * migration. Flagged for Saday; the console reads/writes it today
   * against the mock repo only. */
  repeatsYearly: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Composite shape a screen usually wants: provider + bookable config. */
export interface ProviderProfile extends Provider {
  sessionTypes: ProviderSessionType[];
}

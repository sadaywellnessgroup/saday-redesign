import type { ISODateTime, Language, UUID } from './common';

export type Sex = 'female' | 'male' | 'other' | 'prefer_not';

/** patients — intake is three fields only (D-004): name, age, sex. */
export interface Patient {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  displayName: string;
  ageYears: number;
  sex: Sex;
  preferredLanguage: Language;
  assignedProviderId: UUID | null;
  city: string | null;
  notesForProvider: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

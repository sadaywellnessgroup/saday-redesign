import type { ISODate, ISODateTime, UUID } from './common';

export type RiskChip = 'no_risk' | 'self_harm' | 'suicide' | 'violence' | 'substance';
export type SessionNoteMode = 'online' | 'in_person' | 'telephonic';

/** session_notes — Swasthmind 4-section structure (D-005), sign/lock/version
 * per architecture.md §11: a locked (signed) row is immutable; a correction
 * is a new row with `version = old + 1` and `supersedesId = old.id`. */
export interface SessionNote {
  id: UUID;
  organizationId: UUID;
  appointmentId: UUID;
  patientId: UUID;
  providerId: UUID;
  // 1 · Session details
  sessionDate: ISODate;
  durationMinutes: number;
  mode: SessionNoteMode;
  // 2 · Clinical assessment
  presentingConcern: string | null;
  mood: string | null;
  affect: string | null;
  risk: RiskChip[];
  behaviouralObservation: string | null;
  // 3 · Session narrative
  narrative: string | null;
  interventions: string[];
  // 4 · Plan & next steps
  homework: string | null;
  goals: string | null;
  nextFocus: string | null;
  progressScore: number | null; // 0-10
  followUpDate: ISODate | null;
  // sign / lock / version
  signedAt: ISODateTime | null;
  signedByUserId: UUID | null;
  isLocked: boolean;
  version: number;
  supersedesId: UUID | null;
  supersededAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** assessment_proformas — sections kept as loosely-typed JSON blobs on
 * purpose (the field-by-field spec is a later P0.3 document); the shape
 * here mirrors the JSONB columns 1:1. */
export interface AssessmentProforma {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  providerId: UUID;
  appointmentId: UUID | null;
  specVersion: string;
  sociodemographic: Record<string, unknown>;
  informant: Record<string, unknown>;
  presentIllness: Record<string, unknown>;
  biologicalFunctions: Record<string, unknown>;
  substanceUse: Record<string, unknown>;
  pastHistory: Record<string, unknown>;
  familyHistory: Record<string, unknown>;
  personalHistory: Record<string, unknown>;
  premorbidPersonality: Record<string, unknown>;
  mse: Record<string, unknown>;
  diagnosisIcd11: string[];
  formulation: string | null;
  plan: string | null;
  signedAt: ISODateTime | null;
  signedByUserId: UUID | null;
  isLocked: boolean;
  version: number;
  supersedesId: UUID | null;
  supersededAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

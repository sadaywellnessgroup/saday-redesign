import type { ISODateTime, Language, UUID } from './common';

export type PsychometricAdministeredBy = 'self' | 'clinician' | 'either';

export interface PsychometricItemOption {
  label: string;
  value: number;
}
export interface PsychometricItem {
  id: string;
  prompt: string;
  options: PsychometricItemOption[];
}
export interface PsychometricBand {
  label: string;
  min: number;
  max: number;
  severity: string;
}

/** psychometric_tools — D-024: free / public-domain tools only. */
export interface PsychometricTool {
  id: UUID;
  organizationId: UUID;
  code: string; // 'PHQ9' | 'GAD7' | 'HAMD17' | 'HAMA' | 'BPRS18' | 'YMRS' | 'ASRS_V1_1'
  name: string;
  version: string;
  language: Language;
  items: PsychometricItem[];
  scoring: Record<string, unknown>;
  bands: PsychometricBand[];
  administeredBy: PsychometricAdministeredBy;
  sourceCitation: string | null;
  licenceNote: string | null;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** psychometric_submissions — immutable from INSERT; a re-administration is
 * a new row (the serial-monitoring chart plots the series). */
export interface PsychometricSubmission {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  toolId: UUID;
  appointmentId: UUID | null;
  assignedByUserId: UUID | null;
  answers: Record<string, number>;
  total: number | null;
  subscaleTotals: Record<string, number> | null;
  band: string | null;
  administeredBy: 'self' | 'clinician';
  at: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

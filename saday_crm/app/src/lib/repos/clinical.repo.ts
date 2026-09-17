import { randomUUID } from 'node:crypto';
import type { AssessmentProforma, SessionNote, UUID } from '@/lib/domain';
import { assessmentProformas, sessionNotes } from './fixtures';
import { PROFORMA_SPEC_VERSION } from '@/lib/clinical/proforma-spec';
import { assertEditable, markSuperseded, supersedingFields } from '@/lib/clinical/immutability';

export type SessionNoteDraftPatch = Partial<
  Pick<
    SessionNote,
    | 'sessionDate'
    | 'durationMinutes'
    | 'mode'
    | 'presentingConcern'
    | 'mood'
    | 'affect'
    | 'risk'
    | 'behaviouralObservation'
    | 'narrative'
    | 'interventions'
    | 'homework'
    | 'goals'
    | 'nextFocus'
    | 'progressScore'
    | 'followUpDate'
  >
>;

export interface NewSessionNoteInput {
  organizationId: UUID;
  appointmentId: UUID;
  patientId: UUID;
  providerId: UUID;
  sessionDate: string;
  durationMinutes: number;
  mode: SessionNote['mode'];
}

export type ProformaPatch = Partial<
  Pick<
    AssessmentProforma,
    | 'sociodemographic'
    | 'informant'
    | 'presentIllness'
    | 'biologicalFunctions'
    | 'substanceUse'
    | 'pastHistory'
    | 'familyHistory'
    | 'personalHistory'
    | 'premorbidPersonality'
    | 'mse'
    | 'diagnosisIcd11'
    | 'formulation'
    | 'plan'
  >
>;

export interface NewProformaInput {
  organizationId: UUID;
  patientId: UUID;
  providerId: UUID;
  appointmentId?: UUID | null;
}

export interface ClinicalRepo {
  getSessionNote(id: UUID): Promise<SessionNote | null>;
  getSessionNoteByAppointment(appointmentId: UUID): Promise<SessionNote | null>;
  listSessionNotesForPatient(patientId: UUID): Promise<SessionNote[]>;
  listSessionNotesForProvider(providerId: UUID): Promise<SessionNote[]>;
  /** Every version of a note chain, oldest first — signed v1 stays
   * readable after a v2 supersedes it (architecture.md §11). */
  listNoteVersions(appointmentId: UUID): Promise<SessionNote[]>;
  createSessionNote(input: NewSessionNoteInput): Promise<SessionNote>;
  /** Autosave. Rejects any write to a signed row (§11.3). */
  updateSessionNoteDraft(id: UUID, patch: SessionNoteDraftPatch): Promise<SessionNote>;
  signSessionNote(id: UUID, signedByUserId: UUID): Promise<SessionNote>;
  /** Correction path: supersedes the signed note with an unsigned v2 that
   * carries its content forward; the original is never altered (§11.4). */
  supersedeSessionNote(id: UUID): Promise<SessionNote>;

  getProforma(id: UUID): Promise<AssessmentProforma | null>;
  listProformasForPatient(patientId: UUID): Promise<AssessmentProforma[]>;
  getLiveProformaForPatient(patientId: UUID): Promise<AssessmentProforma | null>;
  createProforma(input: NewProformaInput): Promise<AssessmentProforma>;
  updateProformaDraft(id: UUID, patch: ProformaPatch): Promise<AssessmentProforma>;
  signProforma(id: UUID, signedByUserId: UUID): Promise<AssessmentProforma>;
  supersedeProforma(id: UUID): Promise<AssessmentProforma>;
}

function nowISO() {
  return new Date().toISOString();
}

export class MockClinicalRepo implements ClinicalRepo {
  async getSessionNote(id: UUID): Promise<SessionNote | null> {
    return sessionNotes.find((n) => n.id === id) ?? null;
  }
  async getSessionNoteByAppointment(appointmentId: UUID): Promise<SessionNote | null> {
    return sessionNotes.find((n) => n.appointmentId === appointmentId && !n.supersededAt) ?? null;
  }
  async listSessionNotesForPatient(patientId: UUID): Promise<SessionNote[]> {
    return sessionNotes
      .filter((n) => n.patientId === patientId && !n.supersededAt)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }
  async listSessionNotesForProvider(providerId: UUID): Promise<SessionNote[]> {
    return sessionNotes.filter((n) => n.providerId === providerId && !n.supersededAt);
  }
  async listNoteVersions(appointmentId: UUID): Promise<SessionNote[]> {
    return sessionNotes
      .filter((n) => n.appointmentId === appointmentId)
      .sort((a, b) => a.version - b.version);
  }

  async createSessionNote(input: NewSessionNoteInput): Promise<SessionNote> {
    const existing = await this.getSessionNoteByAppointment(input.appointmentId);
    if (existing) return existing; // uq: one live note per appointment
    const at = nowISO();
    const note: SessionNote = {
      id: `note_${randomUUID()}`,
      organizationId: input.organizationId,
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      providerId: input.providerId,
      sessionDate: input.sessionDate,
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      presentingConcern: null,
      mood: null,
      affect: null,
      risk: [],
      behaviouralObservation: null,
      narrative: null,
      interventions: [],
      homework: null,
      goals: null,
      nextFocus: null,
      progressScore: null,
      followUpDate: null,
      signedAt: null,
      signedByUserId: null,
      isLocked: false,
      version: 1,
      supersedesId: null,
      supersededAt: null,
      createdAt: at,
      updatedAt: at,
    };
    sessionNotes.push(note);
    return note;
  }

  async updateSessionNoteDraft(id: UUID, patch: SessionNoteDraftPatch): Promise<SessionNote> {
    const note = sessionNotes.find((n) => n.id === id);
    if (!note) throw new Error(`unknown session note: ${id}`);
    assertEditable(note, 'note');
    Object.assign(note, patch);
    note.updatedAt = nowISO();
    return note;
  }

  async signSessionNote(id: UUID, signedByUserId: UUID): Promise<SessionNote> {
    const note = sessionNotes.find((n) => n.id === id);
    if (!note) throw new Error(`unknown session note: ${id}`);
    assertEditable(note, 'note');
    const at = nowISO();
    note.signedAt = at;
    note.signedByUserId = signedByUserId;
    note.isLocked = true;
    note.updatedAt = at;
    return note;
  }

  async supersedeSessionNote(id: UUID): Promise<SessionNote> {
    const previous = sessionNotes.find((n) => n.id === id);
    if (!previous) throw new Error(`unknown session note: ${id}`);
    if (previous.supersededAt) throw new Error(`session note ${id} is already superseded`);
    const at = nowISO();
    const next = supersedingFields(previous, `note_${randomUUID()}`, at);
    markSuperseded(previous, at);
    sessionNotes.push(next);
    return next;
  }

  /* ---------------- proforma (same immutability rules) ---------------- */

  async getProforma(id: UUID): Promise<AssessmentProforma | null> {
    return assessmentProformas.find((p) => p.id === id) ?? null;
  }
  async listProformasForPatient(patientId: UUID): Promise<AssessmentProforma[]> {
    return assessmentProformas
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getLiveProformaForPatient(patientId: UUID): Promise<AssessmentProforma | null> {
    return assessmentProformas.find((p) => p.patientId === patientId && !p.supersededAt) ?? null;
  }

  async createProforma(input: NewProformaInput): Promise<AssessmentProforma> {
    const live = await this.getLiveProformaForPatient(input.patientId);
    if (live && !live.signedAt) return live; // resume the open draft
    const at = nowISO();
    const proforma: AssessmentProforma = {
      id: `proforma_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      specVersion: PROFORMA_SPEC_VERSION,
      sociodemographic: {},
      informant: {},
      presentIllness: {},
      biologicalFunctions: {},
      substanceUse: {},
      pastHistory: {},
      familyHistory: {},
      personalHistory: {},
      premorbidPersonality: {},
      mse: {},
      diagnosisIcd11: [],
      formulation: null,
      plan: null,
      signedAt: null,
      signedByUserId: null,
      isLocked: false,
      version: live ? live.version + 1 : 1,
      supersedesId: live ? live.id : null,
      supersededAt: null,
      createdAt: at,
      updatedAt: at,
    };
    if (live) markSuperseded(live, at);
    assessmentProformas.push(proforma);
    return proforma;
  }

  async updateProformaDraft(id: UUID, patch: ProformaPatch): Promise<AssessmentProforma> {
    const proforma = assessmentProformas.find((p) => p.id === id);
    if (!proforma) throw new Error(`unknown proforma: ${id}`);
    assertEditable(proforma, 'proforma');
    Object.assign(proforma, patch);
    proforma.updatedAt = nowISO();
    return proforma;
  }

  async signProforma(id: UUID, signedByUserId: UUID): Promise<AssessmentProforma> {
    const proforma = assessmentProformas.find((p) => p.id === id);
    if (!proforma) throw new Error(`unknown proforma: ${id}`);
    assertEditable(proforma, 'proforma');
    const at = nowISO();
    proforma.signedAt = at;
    proforma.signedByUserId = signedByUserId;
    proforma.isLocked = true;
    proforma.updatedAt = at;
    return proforma;
  }

  async supersedeProforma(id: UUID): Promise<AssessmentProforma> {
    const previous = assessmentProformas.find((p) => p.id === id);
    if (!previous) throw new Error(`unknown proforma: ${id}`);
    if (previous.supersededAt) throw new Error(`proforma ${id} is already superseded`);
    const at = nowISO();
    const next = supersedingFields(previous, `proforma_${randomUUID()}`, at);
    markSuperseded(previous, at);
    assessmentProformas.push(next);
    return next;
  }
}

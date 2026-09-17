import { randomUUID } from 'node:crypto';
import type { PsychometricSubmission, PsychometricTool, UUID } from '@/lib/domain';
import { psychometricSubmissions, psychometricTools } from './fixtures';
import { scoreAnswers } from '@/lib/psychometrics/scoring';

export interface NewSubmissionInput {
  organizationId: UUID;
  patientId: UUID;
  toolId: UUID;
  answers: Record<string, number>;
  administeredBy: 'self' | 'clinician';
  assignedByUserId?: UUID | null;
  appointmentId?: UUID | null;
}

/** A tool a provider has asked a patient to complete. NOT yet a table in
 * `0001_schema.sql` — a `psychometric_assignments` table (patient, tool,
 * assigned_by, due, completed_submission_id) is needed in a follow-up
 * migration. Flagged for Saday; held in memory for now so the console's
 * "Assign a tool" action has somewhere to land. */
export interface PsychometricAssignment {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  toolId: UUID;
  assignedByUserId: UUID;
  administeredBy: 'self' | 'clinician';
  assignedAt: string;
  completedSubmissionId: UUID | null;
}

const assignments: PsychometricAssignment[] = [
  {
    id: 'asg_1',
    organizationId: 'org_saday',
    patientId: 'pat_3',
    toolId: 'tool_gad7_en',
    assignedByUserId: 'usr_prov_aditya',
    administeredBy: 'self',
    assignedAt: '2026-09-05T07:00:00.000Z',
    completedSubmissionId: null,
  },
];

export interface PsychometricsRepo {
  listTools(organizationId: UUID): Promise<PsychometricTool[]>;
  getTool(id: UUID): Promise<PsychometricTool | null>;
  listSubmissionsForPatient(patientId: UUID, toolId?: UUID): Promise<PsychometricSubmission[]>;
  /** Screens-phase addition: the assessment runner (route 11) appends a new
   * immutable submission row here on finish — re-administration is always a
   * new row so the serial-monitoring chart has a series to plot. */
  createSubmission(input: NewSubmissionInput): Promise<PsychometricSubmission>;
  listAssignmentsForPatient(patientId: UUID): Promise<PsychometricAssignment[]>;
  assignTool(input: {
    organizationId: UUID;
    patientId: UUID;
    toolId: UUID;
    assignedByUserId: UUID;
    administeredBy: 'self' | 'clinician';
  }): Promise<PsychometricAssignment>;
}

export class MockPsychometricsRepo implements PsychometricsRepo {
  async listTools(organizationId: UUID): Promise<PsychometricTool[]> {
    return psychometricTools.filter((t) => t.organizationId === organizationId && t.isActive);
  }
  async getTool(id: UUID): Promise<PsychometricTool | null> {
    return psychometricTools.find((t) => t.id === id) ?? null;
  }
  async listSubmissionsForPatient(patientId: UUID, toolId?: UUID): Promise<PsychometricSubmission[]> {
    return psychometricSubmissions
      .filter((s) => s.patientId === patientId && (!toolId || s.toolId === toolId))
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  async createSubmission(input: NewSubmissionInput): Promise<PsychometricSubmission> {
    const tool = psychometricTools.find((t) => t.id === input.toolId);
    if (!tool) throw new Error(`unknown psychometric tool: ${input.toolId}`);
    const { total, band } = scoreAnswers(tool, input.answers);
    const now = new Date().toISOString();
    const submission: PsychometricSubmission = {
      id: `psy_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      toolId: input.toolId,
      appointmentId: input.appointmentId ?? null,
      assignedByUserId: input.assignedByUserId ?? null,
      answers: input.answers,
      total,
      subscaleTotals: null,
      band,
      administeredBy: input.administeredBy,
      at: now,
      createdAt: now,
      updatedAt: now,
    };
    psychometricSubmissions.push(submission);
    const openAssignment = assignments.find(
      (a) => a.patientId === input.patientId && a.toolId === input.toolId && a.completedSubmissionId === null,
    );
    if (openAssignment) openAssignment.completedSubmissionId = submission.id;
    return submission;
  }
  async listAssignmentsForPatient(patientId: UUID): Promise<PsychometricAssignment[]> {
    return assignments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
  }
  async assignTool(input: {
    organizationId: UUID;
    patientId: UUID;
    toolId: UUID;
    assignedByUserId: UUID;
    administeredBy: 'self' | 'clinician';
  }): Promise<PsychometricAssignment> {
    const assignment: PsychometricAssignment = {
      id: `asg_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      toolId: input.toolId,
      assignedByUserId: input.assignedByUserId,
      administeredBy: input.administeredBy,
      assignedAt: new Date().toISOString(),
      completedSubmissionId: null,
    };
    assignments.push(assignment);
    return assignment;
  }
}

import type { FollowUpFlow, FollowUpFlowKind, FollowUpSubmission, UUID } from '@/lib/domain';
import { appointments, followUpFlows, followUpSeenIds, followUpSubmissions } from './fixtures';

export interface FollowUpFlowPatch {
  offsetHours?: number;
  messageBodyEn?: string;
  messageBodyHi?: string;
  questions?: FollowUpFlow['questions'];
  isActive?: boolean;
}

export interface FollowUpRepo {
  getFlow(organizationId: UUID, kind: FollowUpFlowKind): Promise<FollowUpFlow | null>;
  listFlows(organizationId: UUID): Promise<FollowUpFlow[]>;
  /** Admin /admin/follow-ups — org-wide flow config (D-023), including
   * inactive flows (`listFlows` hides those). */
  listAllFlows(organizationId: UUID): Promise<FollowUpFlow[]>;
  updateFlow(organizationId: UUID, kind: FollowUpFlowKind, patch: FollowUpFlowPatch): Promise<FollowUpFlow>;
  listSubmissionsForPatient(patientId: UUID): Promise<FollowUpSubmission[]>;
  /** Provider console: responses on this provider's own sessions (D-023 —
   * the flows are org-wide, the responses belong to the session). */
  listSubmissionsForProvider(providerId: UUID): Promise<FollowUpSubmission[]>;
  /** Admin Submissions tab — every response across every provider. */
  listAllSubmissions(organizationId: UUID): Promise<FollowUpSubmission[]>;
  /** Responses the provider has not opened yet — the Today screen's count. */
  countPendingForProvider(providerId: UUID): Promise<number>;
  markSubmissionsSeen(ids: UUID[]): Promise<void>;
}

export class MockFollowUpRepo implements FollowUpRepo {
  async getFlow(organizationId: UUID, kind: FollowUpFlowKind): Promise<FollowUpFlow | null> {
    return followUpFlows.find((f) => f.organizationId === organizationId && f.flowKind === kind) ?? null;
  }
  async listFlows(organizationId: UUID): Promise<FollowUpFlow[]> {
    return followUpFlows.filter((f) => f.organizationId === organizationId && f.isActive);
  }
  async listAllFlows(organizationId: UUID): Promise<FollowUpFlow[]> {
    return followUpFlows
      .filter((f) => f.organizationId === organizationId)
      .sort((a, b) => a.flowKind.localeCompare(b.flowKind));
  }
  async updateFlow(organizationId: UUID, kind: FollowUpFlowKind, patch: FollowUpFlowPatch): Promise<FollowUpFlow> {
    const flow = followUpFlows.find((f) => f.organizationId === organizationId && f.flowKind === kind);
    if (!flow) throw new Error(`unknown follow-up flow: ${kind}`);
    Object.assign(flow, patch);
    flow.updatedAt = new Date().toISOString();
    return flow;
  }
  async listSubmissionsForPatient(patientId: UUID): Promise<FollowUpSubmission[]> {
    return followUpSubmissions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
  async listSubmissionsForProvider(providerId: UUID): Promise<FollowUpSubmission[]> {
    const own = new Set(appointments.filter((a) => a.providerId === providerId).map((a) => a.id));
    return followUpSubmissions
      .filter((s) => own.has(s.appointmentId))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
  async listAllSubmissions(organizationId: UUID): Promise<FollowUpSubmission[]> {
    return followUpSubmissions
      .filter((s) => s.organizationId === organizationId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
  async countPendingForProvider(providerId: UUID): Promise<number> {
    const mine = await this.listSubmissionsForProvider(providerId);
    return mine.filter((s) => !followUpSeenIds.has(s.id)).length;
  }
  async markSubmissionsSeen(ids: UUID[]): Promise<void> {
    for (const id of ids) followUpSeenIds.add(id);
  }
}

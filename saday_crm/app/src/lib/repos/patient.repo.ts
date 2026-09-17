import type { Patient, UUID } from '@/lib/domain';
import { appointments, patients } from './fixtures';

export interface PatientRepo {
  getById(id: UUID): Promise<Patient | null>;
  getByUserId(userId: UUID): Promise<Patient | null>;
  listForOrganization(organizationId: UUID): Promise<Patient[]>;
  /** Patients with >=1 appointment with this provider (RLS "assigned" shorthand,
   * architecture.md §3) — the mock approximates it via `assignedProviderId`. */
  listAssignedToProvider(providerId: UUID): Promise<Patient[]>;
  /** The provider console's real caseload: everyone with >=1 appointment
   * with this provider, plus anyone explicitly assigned to them. Mirrors
   * the RLS "assigned patient" predicate in architecture.md §3. */
  listForProviderCaseload(providerId: UUID): Promise<Patient[]>;
}

export class MockPatientRepo implements PatientRepo {
  async getById(id: UUID): Promise<Patient | null> {
    return patients.find((p) => p.id === id) ?? null;
  }
  async getByUserId(userId: UUID): Promise<Patient | null> {
    return patients.find((p) => p.userId === userId) ?? null;
  }
  async listForOrganization(organizationId: UUID): Promise<Patient[]> {
    return patients.filter((p) => p.organizationId === organizationId);
  }
  async listAssignedToProvider(providerId: UUID): Promise<Patient[]> {
    return patients.filter((p) => p.assignedProviderId === providerId);
  }
  async listForProviderCaseload(providerId: UUID): Promise<Patient[]> {
    const seen = new Set(
      appointments.filter((a) => a.providerId === providerId).map((a) => a.patientId),
    );
    return patients
      .filter((p) => seen.has(p.id) || p.assignedProviderId === providerId)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}

import type { Organization, OrganizationPolicies, UUID, WhatsAppTemplate } from '@/lib/domain';
import { organization, organizationPolicies, whatsappTemplates } from './fixtures';

export interface OrganizationPatch {
  name?: string;
  whatsappNumber?: string | null;
  supportEmail?: string | null;
}

export interface OrganizationPoliciesPatch {
  cancellationMinNoticeHours?: number;
  cancellationRefundPct?: number;
  rescheduleMinNoticeHours?: number;
  rescheduleMaxCount?: number;
  telemedicineConsentVersion?: string;
}

export interface OrganizationRepo {
  getById(id: UUID): Promise<Organization | null>;
  getPolicies(organizationId: UUID): Promise<OrganizationPolicies | null>;
  /** Admin Settings route (D-020): org name/contacts. Screens-phase
   * addition — mutates the in-memory fixture row directly. */
  updateOrganization(id: UUID, patch: OrganizationPatch): Promise<Organization>;
  /** Admin Settings route: the four §14 Q4 numbers plus the consent text
   * version, editable per D-020. */
  updatePolicies(organizationId: UUID, patch: OrganizationPoliciesPatch): Promise<OrganizationPolicies>;
  /** Admin Settings route — read-only list (D-020): templates are
   * approved with the BSP (D-015), not edited here. */
  listWhatsAppTemplates(organizationId: UUID): Promise<WhatsAppTemplate[]>;
}

export class MockOrganizationRepo implements OrganizationRepo {
  async getById(id: UUID): Promise<Organization | null> {
    return organization.id === id ? organization : null;
  }
  async getPolicies(organizationId: UUID): Promise<OrganizationPolicies | null> {
    return organizationPolicies.organizationId === organizationId ? organizationPolicies : null;
  }
  async updateOrganization(id: UUID, patch: OrganizationPatch): Promise<Organization> {
    if (organization.id !== id) throw new Error(`unknown organization: ${id}`);
    Object.assign(organization, patch);
    organization.updatedAt = new Date().toISOString();
    return organization;
  }
  async updatePolicies(organizationId: UUID, patch: OrganizationPoliciesPatch): Promise<OrganizationPolicies> {
    if (organizationPolicies.organizationId !== organizationId) {
      throw new Error(`unknown organization: ${organizationId}`);
    }
    Object.assign(organizationPolicies, patch);
    organizationPolicies.updatedAt = new Date().toISOString();
    return organizationPolicies;
  }
  async listWhatsAppTemplates(organizationId: UUID): Promise<WhatsAppTemplate[]> {
    return whatsappTemplates
      .filter((t) => t.organizationId === organizationId)
      .sort((a, b) => a.code.localeCompare(b.code) || a.language.localeCompare(b.language));
  }
}

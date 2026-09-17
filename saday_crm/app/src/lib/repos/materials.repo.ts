import { randomUUID } from 'node:crypto';
import type { DispatchChannel, Language, MaterialDispatch, MaterialLibraryItem, UUID } from '@/lib/domain';
import { materialDispatches, materialsLibrary } from './fixtures';

export interface NewDispatchInput {
  organizationId: UUID;
  materialId: UUID;
  patientId: UUID;
  sentByUserId: UUID;
  channel: DispatchChannel;
}

export interface MaterialsRepo {
  listActive(organizationId: UUID, language?: Language): Promise<MaterialLibraryItem[]>;
  listDispatchesForPatient(patientId: UUID): Promise<MaterialDispatch[]>;
  getById(id: UUID): Promise<MaterialLibraryItem | null>;
  /** Provider console: records who sent what, to whom, when (the "each
   * dispatch records who/when" requirement). */
  createDispatch(input: NewDispatchInput): Promise<MaterialDispatch>;
}

export class MockMaterialsRepo implements MaterialsRepo {
  async listActive(organizationId: UUID, language?: Language): Promise<MaterialLibraryItem[]> {
    return materialsLibrary.filter(
      (m) => m.organizationId === organizationId && m.isActive && (!language || m.language === language),
    );
  }
  async listDispatchesForPatient(patientId: UUID): Promise<MaterialDispatch[]> {
    return materialDispatches
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }
  async getById(id: UUID): Promise<MaterialLibraryItem | null> {
    return materialsLibrary.find((m) => m.id === id) ?? null;
  }
  async createDispatch(input: NewDispatchInput): Promise<MaterialDispatch> {
    const now = new Date().toISOString();
    const dispatch: MaterialDispatch = {
      id: `disp_${randomUUID()}`,
      organizationId: input.organizationId,
      materialId: input.materialId,
      patientId: input.patientId,
      sentByUserId: input.sentByUserId,
      channel: input.channel,
      sentAt: now,
      openedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    materialDispatches.push(dispatch);
    return dispatch;
  }
}

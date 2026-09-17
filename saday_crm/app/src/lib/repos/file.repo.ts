import { randomUUID } from 'node:crypto';
import type { FileKind, FileRecord, Role, UUID } from '@/lib/domain';
import { files } from './fixtures';

export interface NewFileInput {
  organizationId: UUID;
  patientId: UUID;
  ownerUserId: UUID;
  uploadedByRole: Role;
  appointmentId?: UUID | null;
  storagePath: string;
  originalName: string | null;
  mime: string;
  bytes: number;
  kind: FileKind;
  sharedWith: Role[];
  /** "Paste a URL" dispatches (D-007: URL is one of the four allowed
   * types) carry no bytes — storagePath is a marker, externalUrl is the
   * payload. */
  externalUrl?: string | null;
  appointmentIdOverride?: never;
}

export interface FileRepo {
  getById(id: UUID): Promise<FileRecord | null>;
  listForPatient(patientId: UUID): Promise<FileRecord[]>;
  listForAppointment(appointmentId: UUID): Promise<FileRecord[]>;
  /** Screens-phase addition: records upload metadata after
   * `StubFileStorage` accepts the bytes (D-007, 25 MB / MIME-checked). */
  create(input: NewFileInput): Promise<FileRecord>;
}

export class MockFileRepo implements FileRepo {
  async getById(id: UUID): Promise<FileRecord | null> {
    return files.find((f) => f.id === id) ?? null;
  }
  async listForPatient(patientId: UUID): Promise<FileRecord[]> {
    return files
      .filter((f) => f.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listForAppointment(appointmentId: UUID): Promise<FileRecord[]> {
    return files.filter((f) => f.appointmentId === appointmentId);
  }
  async create(input: NewFileInput): Promise<FileRecord> {
    const now = new Date().toISOString();
    const record: FileRecord = {
      id: `file_${randomUUID()}`,
      organizationId: input.organizationId,
      patientId: input.patientId,
      ownerUserId: input.ownerUserId,
      uploadedByRole: input.uploadedByRole,
      appointmentId: input.appointmentId ?? null,
      storagePath: input.storagePath,
      originalName: input.originalName,
      mime: input.mime,
      bytes: input.bytes,
      kind: input.kind,
      sharedWith: input.sharedWith,
      externalUrl: input.externalUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    files.push(record);
    return record;
  }
}

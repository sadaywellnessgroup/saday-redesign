import type { ISODateTime, Language, Role, UUID } from './common';

export type FileKind = 'report' | 'prescription' | 'brochure' | 'worksheet' | 'other';

/** files — the phi bucket exchange (D-007, D-017). Named FileRecord to
 * avoid colliding with the global `File` DOM type. */
export interface FileRecord {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  ownerUserId: UUID;
  uploadedByRole: Role;
  appointmentId: UUID | null;
  storagePath: string;
  originalName: string | null;
  mime: string;
  bytes: number;
  kind: FileKind;
  sharedWith: Role[];
  externalUrl: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type MaterialKind = 'brochure' | 'worksheet' | 'article' | 'video' | 'link';

/** materials_library — generic Saday-branded catalogue (D-006). */
export interface MaterialLibraryItem {
  id: UUID;
  organizationId: UUID;
  code: string;
  title: string;
  description: string | null;
  language: Language;
  category: string;
  tags: string[];
  kind: MaterialKind;
  storagePath: string | null;
  externalUrl: string | null;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type DispatchChannel = 'portal' | 'whatsapp' | 'email';

/** material_dispatches */
export interface MaterialDispatch {
  id: UUID;
  organizationId: UUID;
  materialId: UUID;
  patientId: UUID;
  sentByUserId: UUID;
  channel: DispatchChannel;
  sentAt: ISODateTime;
  openedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

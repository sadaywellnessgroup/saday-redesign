import type { ISODateTime, UUID } from './common';

export type ThreadStatus = 'open' | 'closed';

/** message_threads — one thread per (patient, provider) pair. */
export interface MessageThread {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  providerId: UUID;
  status: ThreadStatus;
  lastMessageAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type SenderRole = 'patient' | 'provider';

/** messages — two-way async, file exchange up to 25 MB (D-007). */
export interface Message {
  id: UUID;
  organizationId: UUID;
  threadId: UUID;
  senderUserId: UUID;
  senderRole: SenderRole;
  body: string | null;
  fileId: UUID | null;
  sentAt: ISODateTime;
  readAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

import { randomUUID } from 'node:crypto';
import type { Message, MessageThread, SenderRole, UUID } from '@/lib/domain';
import { messageThreads, messages } from './fixtures';

export interface NewMessageInput {
  organizationId: UUID;
  threadId: UUID;
  senderUserId: UUID;
  senderRole: SenderRole;
  body: string | null;
  fileId?: UUID | null;
}

export interface MessagingRepo {
  listThreadsForPatient(patientId: UUID): Promise<MessageThread[]>;
  listThreadsForProvider(providerId: UUID): Promise<MessageThread[]>;
  getThread(id: UUID): Promise<MessageThread | null>;
  listMessages(threadId: UUID): Promise<Message[]>;
  /** Screens-phase addition: appends to the in-memory thread (async
   * messaging, D-007) — no PHI leaves the process. */
  sendMessage(input: NewMessageInput): Promise<Message>;
  /** Provider console: the thread for one (patient, provider) pair,
   * created on demand so a provider can always start a conversation
   * (MantraCare digest §12 — their portal has no provider-initiated
   * path; ours does). */
  getOrCreateThread(organizationId: UUID, patientId: UUID, providerId: UUID): Promise<MessageThread>;
  /** Unread inbound messages per thread, for the patient list badge. */
  countUnreadForProvider(providerId: UUID): Promise<Map<UUID, number>>;
  markThreadRead(threadId: UUID, readerRole: SenderRole): Promise<void>;
}

export class MockMessagingRepo implements MessagingRepo {
  async listThreadsForPatient(patientId: UUID): Promise<MessageThread[]> {
    return messageThreads
      .filter((t) => t.patientId === patientId)
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
  }
  async listThreadsForProvider(providerId: UUID): Promise<MessageThread[]> {
    return messageThreads
      .filter((t) => t.providerId === providerId)
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
  }
  async getThread(id: UUID): Promise<MessageThread | null> {
    return messageThreads.find((t) => t.id === id) ?? null;
  }
  async listMessages(threadId: UUID): Promise<Message[]> {
    return messages.filter((m) => m.threadId === threadId).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }
  async getOrCreateThread(organizationId: UUID, patientId: UUID, providerId: UUID): Promise<MessageThread> {
    const existing = messageThreads.find((t) => t.patientId === patientId && t.providerId === providerId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const thread: MessageThread = {
      id: `thread_${randomUUID()}`,
      organizationId,
      patientId,
      providerId,
      status: 'open',
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
    };
    messageThreads.push(thread);
    return thread;
  }
  async countUnreadForProvider(providerId: UUID): Promise<Map<UUID, number>> {
    const counts = new Map<UUID, number>();
    const threads = messageThreads.filter((t) => t.providerId === providerId);
    for (const thread of threads) {
      const unread = messages.filter(
        (m) => m.threadId === thread.id && m.senderRole === 'patient' && m.readAt === null,
      ).length;
      counts.set(thread.patientId, unread);
    }
    return counts;
  }
  async markThreadRead(threadId: UUID, readerRole: SenderRole): Promise<void> {
    const now = new Date().toISOString();
    const otherRole: SenderRole = readerRole === 'provider' ? 'patient' : 'provider';
    for (const message of messages) {
      if (message.threadId === threadId && message.senderRole === otherRole && message.readAt === null) {
        message.readAt = now;
        message.updatedAt = now;
      }
    }
  }
  async sendMessage(input: NewMessageInput): Promise<Message> {
    const now = new Date().toISOString();
    const message: Message = {
      id: `msg_${randomUUID()}`,
      organizationId: input.organizationId,
      threadId: input.threadId,
      senderUserId: input.senderUserId,
      senderRole: input.senderRole,
      body: input.body,
      fileId: input.fileId ?? null,
      sentAt: now,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    };
    messages.push(message);
    const thread = messageThreads.find((t) => t.id === input.threadId);
    if (thread) {
      thread.lastMessageAt = now;
      thread.updatedAt = now;
    }
    return message;
  }
}

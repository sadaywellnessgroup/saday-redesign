import type { NotificationLogEntry, UUID } from '@/lib/domain';
import { notificationLog } from './fixtures';

export interface NotificationRepo {
  listPending(dueBeforeISO: string): Promise<NotificationLogEntry[]>;
  listForUser(userId: UUID): Promise<NotificationLogEntry[]>;
}

export class MockNotificationRepo implements NotificationRepo {
  async listPending(dueBeforeISO: string): Promise<NotificationLogEntry[]> {
    return notificationLog.filter((n) => n.status === 'pending' && n.dueAt <= dueBeforeISO);
  }
  async listForUser(userId: UUID): Promise<NotificationLogEntry[]> {
    return notificationLog.filter((n) => n.toUserId === userId);
  }
}

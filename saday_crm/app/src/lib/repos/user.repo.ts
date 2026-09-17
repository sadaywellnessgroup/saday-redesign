import type { Role, User, UUID } from '@/lib/domain';
import { users } from './fixtures';

export interface UserRepo {
  getById(id: UUID): Promise<User | null>;
  getByAuthUserId(authUserId: UUID): Promise<User | null>;
  listByRole(organizationId: UUID, role: Role): Promise<User[]>;
  /** D-031: phone is an attribute, not identity — admin can migrate it
   * after an identity check. Only the last 4 digits are ever stored
   * (architecture.md §7); the new number is re-verified from scratch, so
   * this also clears `phoneVerifiedAt`. */
  changePhone(userId: UUID, newPhoneE164: string): Promise<User>;
}

export class MockUserRepo implements UserRepo {
  async getById(id: UUID): Promise<User | null> {
    return users.find((u) => u.id === id) ?? null;
  }
  async getByAuthUserId(authUserId: UUID): Promise<User | null> {
    return users.find((u) => u.authUserId === authUserId) ?? null;
  }
  async listByRole(organizationId: UUID, role: Role): Promise<User[]> {
    return users.filter((u) => u.organizationId === organizationId && u.role === role);
  }
  async changePhone(userId: UUID, newPhoneE164: string): Promise<User> {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error(`unknown user: ${userId}`);
    user.phoneLast4 = newPhoneE164.replace(/\D/g, '').slice(-4);
    user.phoneVerifiedAt = null;
    user.updatedAt = new Date().toISOString();
    return user;
  }
}

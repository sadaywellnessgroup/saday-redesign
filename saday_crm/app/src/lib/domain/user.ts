import type { ISODateTime, Language, Role, UUID } from './common';

/** users. Note: `phone` here is a display convenience (last 4 digits) —
 * the schema never stores a raw phone number outside `phone_encrypted`,
 * and repos must never expose more than `phoneLast4` (architecture.md §7). */
export interface User {
  id: UUID;
  organizationId: UUID;
  authUserId: UUID;
  role: Role;
  email: string | null;
  phoneLast4: string | null;
  preferredLanguage: Language;
  totpEnrolledAt: ISODateTime | null;
  totpRequired: boolean;
  idleTimeoutMinutes: number;
  isActive: boolean;
  lastLoginAt: ISODateTime | null;
  emailVerifiedAt: ISODateTime | null;
  phoneVerifiedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

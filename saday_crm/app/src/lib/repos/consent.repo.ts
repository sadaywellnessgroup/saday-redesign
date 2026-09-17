import type { Consent, ConsentType, UUID } from '@/lib/domain';
import { consents } from './fixtures';

export interface ConsentRepo {
  listForUser(userId: UUID): Promise<Consent[]>;
  hasAccepted(userId: UUID, type: ConsentType, version: string): Promise<boolean>;
}

export class MockConsentRepo implements ConsentRepo {
  async listForUser(userId: UUID): Promise<Consent[]> {
    return consents.filter((c) => c.userId === userId && !c.revokedAt);
  }
  async hasAccepted(userId: UUID, type: ConsentType, version: string): Promise<boolean> {
    return consents.some(
      (c) => c.userId === userId && c.consentType === type && c.version === version && !c.revokedAt,
    );
  }
}

import type { ISODateTime, UUID } from './common';

export type ConsentType = 'telemedicine' | 'privacy_policy' | 'terms_of_service';
export type ConsentAcceptedVia = 'portal' | 'intake' | 'migration';

/** consents */
export interface Consent {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  consentType: ConsentType;
  version: string;
  documentHash: string;
  acceptedAt: ISODateTime;
  acceptedVia: ConsentAcceptedVia;
  revokedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

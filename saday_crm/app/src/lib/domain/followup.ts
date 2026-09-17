import type { ISODateTime, Language, UUID } from './common';

export type WhatsAppTemplateCategory = 'utility' | 'marketing' | 'authentication';
export type WhatsAppTemplateStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paused';

/** whatsapp_templates */
export interface WhatsAppTemplate {
  id: UUID;
  organizationId: UUID;
  code: string;
  language: Language;
  category: WhatsAppTemplateCategory;
  metaTemplateName: string | null;
  bodyText: string;
  variables: string[];
  status: WhatsAppTemplateStatus;
  approvedAt: ISODateTime | null;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type FollowUpFlowKind = 'check_in' | 'feedback';
export type FollowUpChannel = 'whatsapp' | 'portal' | 'email';

export interface FollowUpQuestion {
  id: string;
  promptEn: string;
  promptHi: string;
  responseType: 'scale' | 'text' | 'boolean' | 'choice';
  options?: string[];
}

/** follow_up_flows — org-wide only (D-023): one check_in + one feedback flow. */
export interface FollowUpFlow {
  id: UUID;
  organizationId: UUID;
  flowKind: FollowUpFlowKind;
  title: string;
  triggerSource: 'session_end' | 'check_in_sent';
  offsetHours: number;
  channel: FollowUpChannel;
  whatsappTemplateId: UUID | null;
  /** The message body the admin panel edits (D-020/D-023), EN/HI, with
   * WhatsApp-style `{{1}}` variable placeholders. NOT yet a column in
   * `0001_schema.sql` — needs `message_body_en text`, `message_body_hi
   * text` in a follow-up migration, same pattern as
   * `provider_blockouts.repeats_yearly` (see app/README.md "Two fields
   * that need a migration before P2"). Flagged for Saday. */
  messageBodyEn: string;
  messageBodyHi: string;
  questions: FollowUpQuestion[];
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** follow_up_submissions */
export interface FollowUpSubmission {
  id: UUID;
  organizationId: UUID;
  flowId: UUID;
  appointmentId: UUID;
  patientId: UUID;
  responses: Record<string, unknown>;
  deliveredVia: FollowUpChannel;
  submittedAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push';
export type NotificationPurpose =
  | 'otp'
  | 'booking_confirmed'
  | 'session_reminder'
  | 'join_link'
  | 'cancellation'
  | 'refund'
  | 'follow_up_check_in'
  | 'follow_up_feedback'
  | 'material_dispatch'
  | 'other';
export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'skipped';

/** notification_log — outbound queue + delivery record; carries no PHI. */
export interface NotificationLogEntry {
  id: UUID;
  organizationId: UUID;
  toUserId: UUID;
  channel: NotificationChannel;
  purpose: NotificationPurpose;
  templateCode: string | null;
  language: Language;
  appointmentId: UUID | null;
  followUpFlowId: UUID | null;
  dueAt: ISODateTime;
  status: NotificationStatus;
  attempts: number;
  providerMessageId: string | null;
  errorCode: string | null;
  sentAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

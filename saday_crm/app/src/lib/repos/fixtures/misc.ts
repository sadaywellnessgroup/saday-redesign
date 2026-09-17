import type { Consent, FollowUpFlow, NotificationLogEntry, WhatsAppTemplate } from '@/lib/domain';
import { ORG_ID } from './organization';
import { FIXTURE_NOW } from './time';
import { patients } from './patients';

const NOW = FIXTURE_NOW.toISOString();

/* FIXTURE — org-wide follow-up flows (D-023): one check_in + one feedback. */
export const whatsappTemplates: WhatsAppTemplate[] = [
  {
    id: 'wa_tmpl_checkin_en',
    organizationId: ORG_ID,
    code: 'session_checkin',
    language: 'en',
    category: 'utility',
    metaTemplateName: null, // D-015 BSP still open
    bodyText: 'Hi {{1}}, how are you feeling after your session with {{2}}? Reply to let us know.',
    variables: ['patient_first_name', 'provider_name'],
    status: 'draft',
    approvedAt: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'wa_tmpl_checkin_hi',
    organizationId: ORG_ID,
    code: 'session_checkin',
    language: 'hi',
    category: 'utility',
    metaTemplateName: null,
    bodyText: 'नमस्ते {{1}}, {{2}} के साथ सत्र के बाद आप कैसा महसूस कर रहे हैं? हमें बताने के लिए जवाब दें।',
    variables: ['patient_first_name', 'provider_name'],
    status: 'draft',
    approvedAt: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'wa_tmpl_feedback_en',
    organizationId: ORG_ID,
    code: 'session_feedback',
    language: 'en',
    category: 'utility',
    metaTemplateName: null,
    bodyText: 'Hi {{1}}, one quick question — was your recent session helpful? Reply to let us know.',
    variables: ['patient_first_name'],
    status: 'draft',
    approvedAt: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'wa_tmpl_feedback_hi',
    organizationId: ORG_ID,
    code: 'session_feedback',
    language: 'hi',
    category: 'utility',
    metaTemplateName: null,
    bodyText: 'नमस्ते {{1}}, एक छोटा सवाल — क्या आपका हाल का सत्र सहायक था? हमें बताने के लिए जवाब दें।',
    variables: ['patient_first_name'],
    status: 'draft',
    approvedAt: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const followUpFlows: FollowUpFlow[] = [
  {
    id: 'flow_checkin',
    organizationId: ORG_ID,
    flowKind: 'check_in',
    title: 'Post-session check-in',
    triggerSource: 'session_end',
    offsetHours: 24,
    channel: 'whatsapp',
    whatsappTemplateId: 'wa_tmpl_checkin_en',
    messageBodyEn: 'Hi {{1}}, how are you feeling after your session with {{2}}? Reply to let us know.',
    messageBodyHi: 'नमस्ते {{1}}, {{2}} के साथ सत्र के बाद आप कैसा महसूस कर रहे हैं? हमें बताने के लिए जवाब दें।',
    questions: [
      { id: 'q1', promptEn: 'How are you feeling today?', promptHi: 'आज आप कैसा महसूस कर रहे हैं?', responseType: 'scale' },
    ],
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'flow_feedback',
    organizationId: ORG_ID,
    flowKind: 'feedback',
    title: 'Session feedback',
    triggerSource: 'check_in_sent',
    offsetHours: 24,
    channel: 'whatsapp',
    whatsappTemplateId: 'wa_tmpl_feedback_en',
    messageBodyEn: 'Hi {{1}}, one quick question — was your recent session helpful? Reply to let us know.',
    messageBodyHi: 'नमस्ते {{1}}, एक छोटा सवाल — क्या आपका हाल का सत्र सहायक था? हमें बताने के लिए जवाब दें।',
    questions: [
      { id: 'q1', promptEn: 'Was this session helpful?', promptHi: 'क्या यह सत्र सहायक था?', responseType: 'boolean' },
    ],
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

/* FIXTURE — a couple of pending queue rows (architecture.md §12), no PHI. */
export const notificationLog: NotificationLogEntry[] = [
  {
    id: 'notif_1',
    organizationId: ORG_ID,
    toUserId: 'usr_pat_1',
    channel: 'whatsapp',
    purpose: 'follow_up_check_in',
    templateCode: 'session_checkin',
    language: 'en',
    appointmentId: 'appt_2',
    followUpFlowId: 'flow_checkin',
    dueAt: NOW,
    status: 'pending',
    attempts: 0,
    providerMessageId: null,
    errorCode: null,
    sentAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

/* FIXTURE — every patient accepted the telemedicine consent + policies at
 * intake. */
export const consents: Consent[] = patients.flatMap((p) => [
  {
    id: `consent_telemed_${p.id}`,
    organizationId: ORG_ID,
    userId: p.userId,
    consentType: 'telemedicine',
    version: 'telemed-1.0',
    documentHash: 'sha256-FIXTURE',
    acceptedAt: NOW,
    acceptedVia: 'intake',
    revokedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
]);

import { randomUUID } from 'node:crypto';
import { writeOutbox } from './dev-outbox';

/* Adapter interface verbatim from architecture.md §4 (D-025). The real BSP
 * is still open (D-015); every caller codes against this interface so the
 * send adapter can be swapped without touching call sites. */
export interface WhatsAppSender {
  sendTemplate(a: {
    toPhoneE164: string;
    templateCode: string;
    language: 'en' | 'hi';
    variables: Record<string, string>;
  }): Promise<{ providerMessageId: string }>;
  sendFlow(a: {
    toPhoneE164: string;
    flowId: string;
    templateCode: string;
    variables: Record<string, string>;
  }): Promise<{ providerMessageId: string }>;
}

export class StubWhatsAppSender implements WhatsAppSender {
  async sendTemplate(a: {
    toPhoneE164: string;
    templateCode: string;
    language: 'en' | 'hi';
    variables: Record<string, string>;
  }) {
    // never logs the rendered body or the phone number in full — only the
    // template code and variable keys (architecture.md §7 PHI redaction).
    const providerMessageId = `stub_wa_${randomUUID()}`;
    await writeOutbox('whatsapp', {
      providerMessageId,
      toPhoneLast4: a.toPhoneE164.slice(-4),
      templateCode: a.templateCode,
      language: a.language,
      variableKeys: Object.keys(a.variables),
    });
    return { providerMessageId };
  }

  async sendFlow(a: { toPhoneE164: string; flowId: string; templateCode: string; variables: Record<string, string> }) {
    const providerMessageId = `stub_wa_flow_${randomUUID()}`;
    await writeOutbox('whatsapp', {
      providerMessageId,
      toPhoneLast4: a.toPhoneE164.slice(-4),
      flowId: a.flowId,
      templateCode: a.templateCode,
      variableKeys: Object.keys(a.variables),
    });
    return { providerMessageId };
  }
}

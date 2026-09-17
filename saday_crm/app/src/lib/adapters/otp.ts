import { randomUUID } from 'node:crypto';
import { writeOutbox } from './dev-outbox';
import { STUB_OTP_CODE } from './otp-code';

export { STUB_OTP_CODE } from './otp-code';

export interface OtpSender {
  send(a: {
    toPhoneE164: string;
    code: string;
    language: 'en' | 'hi';
    channel: 'whatsapp' | 'sms';
  }): Promise<{ providerMessageId: string; channel: 'whatsapp' | 'sms' }>;
}

export class StubOtpSender implements OtpSender {
  async send(a: { toPhoneE164: string; code: string; language: 'en' | 'hi'; channel: 'whatsapp' | 'sms' }) {
    const providerMessageId = `stub_otp_${randomUUID()}`;
    await writeOutbox('otp', {
      providerMessageId,
      toPhoneLast4: a.toPhoneE164.slice(-4),
      // the stub always issues STUB_OTP_CODE regardless of `code`, so a dev
      // can always sign in with 000000 without reading the outbox.
      code: STUB_OTP_CODE,
      language: a.language,
      channel: a.channel,
    });
    return { providerMessageId, channel: a.channel };
  }
}

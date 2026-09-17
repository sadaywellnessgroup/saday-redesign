/* Adapter registry (architecture.md §4, D-025). ADAPTER_MODE=stub is the
 * only mode implemented in P1 — every third-party integration is stubbed
 * so the app builds, runs and demos with zero external keys. A "live"
 * implementation is added per-adapter as each vendor account is ready
 * (D-025's "one integration pass, P5"). */

import { StubWhatsAppSender, type WhatsAppSender } from './whatsapp';
import { StubOtpSender, type OtpSender } from './otp';
import { StubPaymentGateway, type PaymentGateway } from './payment';
import { StubVideoRooms, type VideoRooms } from './video';
import { StubEmailSender, type EmailSender } from './email';
import { StubFileStorage, type FileStorage } from './file-storage';

export type { WhatsAppSender } from './whatsapp';
export type { OtpSender } from './otp';
export type { PaymentGateway } from './payment';
export type { VideoRooms } from './video';
export type { EmailSender } from './email';
export { MAX_UPLOAD_BYTES, ALLOWED_MIME, type FileStorage } from './file-storage';

export interface Adapters {
  whatsapp: WhatsAppSender;
  otp: OtpSender;
  payment: PaymentGateway;
  video: VideoRooms;
  email: EmailSender;
  fileStorage: FileStorage;
}

function liveNotImplemented(name: string): never {
  throw new Error(
    `ADAPTER_MODE=live but no live implementation is wired for "${name}" yet (P1 foundation ships stubs ` +
      'only). Set ADAPTER_MODE=stub, or implement the live adapter per architecture.md §4.',
  );
}

const stubAdapters: Adapters = {
  whatsapp: new StubWhatsAppSender(),
  otp: new StubOtpSender(),
  payment: new StubPaymentGateway(),
  video: new StubVideoRooms(),
  email: new StubEmailSender(),
  fileStorage: new StubFileStorage(),
};

const liveAdapters: Adapters = new Proxy({} as Adapters, {
  get(_target, prop: string) {
    return liveNotImplemented(prop);
  },
});

export const adapters: Adapters = process.env.ADAPTER_MODE === 'live' ? liveAdapters : stubAdapters;

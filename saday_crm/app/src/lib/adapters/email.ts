import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface EmailSender {
  send(a: {
    to: string;
    templateCode: string;
    language: 'en' | 'hi';
    variables: Record<string, string>;
    attachments?: { path: string }[];
  }): Promise<{ providerMessageId: string }>;
}

const OUTBOX_ROOT = path.join(process.cwd(), '.dev-outbox', 'email');

/** Writes a plain-text .eml stub to .dev-outbox/email/ (architecture.md §4). */
export class StubEmailSender implements EmailSender {
  async send(a: {
    to: string;
    templateCode: string;
    language: 'en' | 'hi';
    variables: Record<string, string>;
    attachments?: { path: string }[];
  }) {
    const providerMessageId = `stub_email_${randomUUID()}`;
    try {
      await mkdir(OUTBOX_ROOT, { recursive: true });
      const body = [
        `To: ${a.to}`,
        `Template: ${a.templateCode}`,
        `Language: ${a.language}`,
        `Variables: ${JSON.stringify(a.variables)}`,
        `Attachments: ${(a.attachments ?? []).map((f) => f.path).join(', ') || 'none'}`,
      ].join('\n');
      await writeFile(path.join(OUTBOX_ROOT, `${Date.now()}-${providerMessageId}.eml`), body, 'utf8');
    } catch {
      // dev-only convenience; never throw from the stub
    }
    return { providerMessageId };
  }
}

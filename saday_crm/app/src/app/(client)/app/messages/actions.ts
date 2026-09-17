'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { getSession } from '@/lib/auth/session';

export interface MessageAttachment {
  name: string;
  mime: string;
  bytes: number;
}

export async function sendMessageAction(threadId: string, body: string, attachment?: MessageAttachment) {
  const session = await getSession();
  if (!session?.patientId || (!body.trim() && !attachment)) return { ok: false as const };
  const thread = await repos.messaging.getThread(threadId);
  if (!thread || thread.patientId !== session.patientId) return { ok: false as const };

  let fileId: string | null = null;
  if (attachment) {
    const file = await repos.file.create({
      organizationId: session.organizationId,
      patientId: session.patientId,
      ownerUserId: session.userId,
      uploadedByRole: 'patient',
      storagePath: `phi/${session.patientId}/messages/${Date.now()}-${attachment.name}`,
      originalName: attachment.name,
      mime: attachment.mime,
      bytes: attachment.bytes,
      kind: 'other',
      sharedWith: ['patient', 'provider'],
    });
    fileId = file.id;
  }

  await repos.messaging.sendMessage({
    organizationId: session.organizationId,
    threadId,
    senderUserId: session.userId,
    senderRole: 'patient',
    body: body.trim() || null,
    fileId,
  });
  revalidatePath(`/app/messages/${threadId}`);
  revalidatePath('/app/messages');
  revalidatePath('/app');
  return { ok: true as const };
}

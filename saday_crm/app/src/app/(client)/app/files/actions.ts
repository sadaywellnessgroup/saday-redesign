'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { getSession } from '@/lib/auth/session';
import { MAX_UPLOAD_BYTES, ALLOWED_MIME } from '@/lib/adapters/file-storage';

export interface UploadFileInput {
  name: string;
  mime: string;
  bytes: number;
}

export type UploadFileResult = { ok: true } | { ok: false; error: 'too_large' | 'bad_type' | 'no_session' };

/** Patient-side upload (route 12, D-007: 25 MB / MIME-checked via
 * `StubFileStorage`). The mock has no real HTTP body upload — the
 * `<input type=file>` metadata is enough to exercise the size/MIME
 * validation and record the FileRepo row a real upload would produce. */
export async function uploadFileAction(input: UploadFileInput): Promise<UploadFileResult> {
  const session = await getSession();
  if (!session?.patientId) return { ok: false, error: 'no_session' };

  if (input.bytes > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };
  if (!(ALLOWED_MIME as readonly string[]).includes(input.mime)) return { ok: false, error: 'bad_type' };

  await repos.file.create({
    organizationId: session.organizationId,
    patientId: session.patientId,
    ownerUserId: session.userId,
    uploadedByRole: 'patient',
    storagePath: `phi/${session.patientId}/${Date.now()}-${input.name}`,
    originalName: input.name,
    mime: input.mime,
    bytes: input.bytes,
    kind: 'other',
    sharedWith: ['patient', 'provider'],
  });

  revalidatePath('/app/files');
  revalidatePath('/app');
  return { ok: true };
}

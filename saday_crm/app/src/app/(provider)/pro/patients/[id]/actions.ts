'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { MAX_UPLOAD_BYTES, ALLOWED_MIME } from '@/lib/adapters/file-storage';

export type SimpleResult = { ok: true } | { ok: false; error: string };

function revalidatePatient(patientId: string, tab?: string) {
  revalidatePath(`/pro/patients/${patientId}`);
  if (tab) revalidatePath(`/pro/patients/${patientId}?tab=${tab}`);
  revalidatePath('/pro/patients');
}

/** Assign a psychometric tool. Self-rated tools land in the patient's
 * Track tab; clinician-rated ones are run by the provider in the console
 * (D-024 — and MantraCare digest §0.3's warning against exposing
 * clinician-rated scales to patients). */
export async function assignToolAction(
  patientId: string,
  toolId: string,
  administeredBy: 'self' | 'clinician',
): Promise<SimpleResult> {
  const { userId, organizationId } = await requireProvider();
  const tool = await repos.psychometrics.getTool(toolId);
  if (!tool) return { ok: false, error: 'unknown_tool' };
  if (tool.administeredBy !== 'either' && tool.administeredBy !== administeredBy) {
    return { ok: false, error: 'wrong_administration' };
  }
  await repos.psychometrics.assignTool({
    organizationId,
    patientId,
    toolId,
    assignedByUserId: userId,
    administeredBy,
  });
  revalidatePatient(patientId, 'assessments');
  return { ok: true };
}

/** The inline clinician-rated runner's submit — one immutable row per
 * administration (architecture.md §11.7). */
export async function submitClinicianRatedAction(
  patientId: string,
  toolId: string,
  answers: Record<string, number>,
): Promise<SimpleResult> {
  const { userId, organizationId } = await requireProvider();
  const tool = await repos.psychometrics.getTool(toolId);
  if (!tool) return { ok: false, error: 'unknown_tool' };
  if (Object.keys(answers).length !== tool.items.length) return { ok: false, error: 'incomplete' };

  await repos.psychometrics.createSubmission({
    organizationId,
    patientId,
    toolId,
    answers,
    administeredBy: 'clinician',
    assignedByUserId: userId,
  });
  revalidatePatient(patientId, 'assessments');
  return { ok: true };
}

/** Send a library material (D-006). Each dispatch records who and when. */
export async function sendMaterialAction(patientId: string, materialId: string): Promise<SimpleResult> {
  const { userId, organizationId } = await requireProvider();
  const material = await repos.materials.getById(materialId);
  if (!material) return { ok: false, error: 'unknown_material' };
  await repos.materials.createDispatch({
    organizationId,
    materialId,
    patientId,
    sentByUserId: userId,
    channel: 'portal',
  });
  revalidatePatient(patientId, 'files');
  return { ok: true };
}

/** Upload a file to the patient (prescription photo lives here — D-017).
 * Size and MIME are checked exactly as the patient-side upload is. */
export async function sendFileAction(
  patientId: string,
  input: { name: string; mime: string; bytes: number; kind: 'prescription' | 'report' | 'worksheet' | 'other' },
): Promise<SimpleResult> {
  const { userId, organizationId } = await requireProvider();
  if (input.bytes > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };
  if (!(ALLOWED_MIME as readonly string[]).includes(input.mime)) return { ok: false, error: 'bad_type' };

  await repos.file.create({
    organizationId,
    patientId,
    ownerUserId: userId,
    uploadedByRole: 'provider',
    storagePath: `phi/${patientId}/${Date.now()}-${input.name}`,
    originalName: input.name,
    mime: input.mime,
    bytes: input.bytes,
    kind: input.kind,
    sharedWith: ['patient', 'provider'],
  });
  revalidatePatient(patientId, 'files');
  return { ok: true };
}

/** Share a URL (one of the four allowed exchange types, D-007). */
export async function sendUrlAction(patientId: string, url: string, label: string): Promise<SimpleResult> {
  const { userId, organizationId } = await requireProvider();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: 'bad_url' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { ok: false, error: 'bad_url' };

  await repos.file.create({
    organizationId,
    patientId,
    ownerUserId: userId,
    uploadedByRole: 'provider',
    storagePath: `link/${patientId}/${Date.now()}`,
    originalName: label.trim() || parsed.hostname,
    mime: 'text/uri-list',
    bytes: 0,
    kind: 'other',
    sharedWith: ['patient', 'provider'],
    externalUrl: parsed.toString(),
  });
  revalidatePatient(patientId, 'files');
  return { ok: true };
}

/** Provider seat of the same thread the patient uses. */
export async function sendProviderMessageAction(
  patientId: string,
  body: string,
  attachment?: { name: string; mime: string; bytes: number },
): Promise<SimpleResult> {
  const { providerId, userId, organizationId } = await requireProvider();
  if (!body.trim() && !attachment) return { ok: false, error: 'empty' };
  const thread = await repos.messaging.getOrCreateThread(organizationId, patientId, providerId);

  let fileId: string | null = null;
  if (attachment) {
    if (attachment.bytes > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };
    const file = await repos.file.create({
      organizationId,
      patientId,
      ownerUserId: userId,
      uploadedByRole: 'provider',
      storagePath: `phi/${patientId}/messages/${Date.now()}-${attachment.name}`,
      originalName: attachment.name,
      mime: attachment.mime,
      bytes: attachment.bytes,
      kind: 'other',
      sharedWith: ['patient', 'provider'],
    });
    fileId = file.id;
  }

  await repos.messaging.sendMessage({
    organizationId,
    threadId: thread.id,
    senderUserId: userId,
    senderRole: 'provider',
    body: body.trim() || null,
    fileId,
  });
  await repos.messaging.markThreadRead(thread.id, 'provider');
  revalidatePatient(patientId, 'messages');
  revalidatePath('/pro');
  return { ok: true };
}

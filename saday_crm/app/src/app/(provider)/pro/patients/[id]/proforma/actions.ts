'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { ImmutableRecordError } from '@/lib/clinical/immutability';
import type { ProformaPatch } from '@/lib/repos';

export type ProformaResult =
  | { ok: true; proformaId: string }
  | { ok: false; error: 'locked' | 'not_found' };

async function ownProforma(proformaId: string) {
  const { providerId, userId } = await requireProvider();
  const proforma = await repos.clinical.getProforma(proformaId);
  if (!proforma || proforma.providerId !== providerId) return null;
  return { proforma, providerId, userId };
}

/** Opens (or resumes) the patient's live proforma. A signed one is never
 * reopened — starting again supersedes it with v2 (architecture.md §11). */
export async function startProformaAction(patientId: string): Promise<ProformaResult> {
  const { providerId, organizationId } = await requireProvider();
  const appointments = await repos.booking.listForPatient(patientId);
  const mine = appointments.filter((a) => a.providerId === providerId);
  if (mine.length === 0) return { ok: false, error: 'not_found' };

  const proforma = await repos.clinical.createProforma({
    organizationId,
    patientId,
    providerId,
    appointmentId: mine[0]?.id ?? null,
  });
  revalidatePath(`/pro/patients/${patientId}`);
  return { ok: true, proformaId: proforma.id };
}

export async function saveProformaDraftAction(proformaId: string, patch: ProformaPatch): Promise<ProformaResult> {
  const found = await ownProforma(proformaId);
  if (!found) return { ok: false, error: 'not_found' };
  try {
    await repos.clinical.updateProformaDraft(proformaId, patch);
  } catch (error) {
    if (error instanceof ImmutableRecordError) return { ok: false, error: 'locked' };
    throw error;
  }
  return { ok: true, proformaId };
}

export async function signProformaAction(proformaId: string): Promise<ProformaResult> {
  const found = await ownProforma(proformaId);
  if (!found) return { ok: false, error: 'not_found' };
  try {
    await repos.clinical.signProforma(proformaId, found.userId);
  } catch (error) {
    if (error instanceof ImmutableRecordError) return { ok: false, error: 'locked' };
    throw error;
  }
  revalidatePath(`/pro/patients/${found.proforma.patientId}`);
  return { ok: true, proformaId };
}

export async function supersedeProformaAction(proformaId: string): Promise<ProformaResult> {
  const found = await ownProforma(proformaId);
  if (!found) return { ok: false, error: 'not_found' };
  const next = await repos.clinical.supersedeProforma(proformaId);
  revalidatePath(`/pro/patients/${found.proforma.patientId}`);
  return { ok: true, proformaId: next.id };
}

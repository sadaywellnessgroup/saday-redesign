'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { ImmutableRecordError } from '@/lib/clinical/immutability';
import { noteValidationErrors } from '@/lib/clinical/note-spec';
import type { SessionNoteDraftPatch } from '@/lib/repos';

export type NoteResult =
  | { ok: true; noteId: string }
  | { ok: false; error: 'locked' | 'not_found' | 'invalid'; missing?: string[] };

async function ownNote(noteId: string) {
  const { providerId, userId } = await requireProvider();
  const note = await repos.clinical.getSessionNote(noteId);
  if (!note || note.providerId !== providerId) return null;
  return { note, providerId, userId };
}

/** Creates the draft for an appointment (or returns the existing live one
 * — one live note per appointment, architecture.md §11.5). */
export async function createNoteForAppointmentAction(appointmentId: string): Promise<NoteResult> {
  const { providerId, organizationId } = await requireProvider();
  const appointment = await repos.booking.getById(appointmentId);
  if (!appointment || appointment.providerId !== providerId) return { ok: false, error: 'not_found' };

  const note = await repos.clinical.createSessionNote({
    organizationId,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    providerId,
    sessionDate: new Date(appointment.scheduledAt).toISOString().slice(0, 10),
    durationMinutes: appointment.durationMinutes,
    mode: appointment.mode === 'in_person' ? 'in_person' : 'online',
  });
  revalidatePath(`/pro/patients/${appointment.patientId}`);
  return { ok: true, noteId: note.id };
}

/** Autosave. A signed note is immutable — the repo throws and we surface
 * "locked" rather than silently dropping the write (architecture.md §11.3). */
export async function saveNoteDraftAction(noteId: string, patch: SessionNoteDraftPatch): Promise<NoteResult> {
  const found = await ownNote(noteId);
  if (!found) return { ok: false, error: 'not_found' };
  try {
    await repos.clinical.updateSessionNoteDraft(noteId, patch);
  } catch (error) {
    if (error instanceof ImmutableRecordError) return { ok: false, error: 'locked' };
    throw error;
  }
  return { ok: true, noteId };
}

export async function signNoteAction(noteId: string): Promise<NoteResult> {
  const found = await ownNote(noteId);
  if (!found) return { ok: false, error: 'not_found' };

  const missing = noteValidationErrors(found.note);
  if (missing.length > 0) return { ok: false, error: 'invalid', missing };

  try {
    await repos.clinical.signSessionNote(noteId, found.userId);
  } catch (error) {
    if (error instanceof ImmutableRecordError) return { ok: false, error: 'locked' };
    throw error;
  }

  const appointment = await repos.booking.getById(found.note.appointmentId);
  if (appointment) appointment.hasSignedNote = true;

  revalidatePath(`/pro/patients/${found.note.patientId}`);
  revalidatePath('/pro');
  return { ok: true, noteId };
}

/** Correction path: a new v2 draft that carries the signed content
 * forward; v1 stays readable and unaltered (architecture.md §11.4). */
export async function supersedeNoteAction(noteId: string): Promise<NoteResult> {
  const found = await ownNote(noteId);
  if (!found) return { ok: false, error: 'not_found' };
  const next = await repos.clinical.supersedeSessionNote(noteId);

  const appointment = await repos.booking.getById(found.note.appointmentId);
  if (appointment) appointment.hasSignedNote = false;

  revalidatePath(`/pro/patients/${found.note.patientId}`);
  revalidatePath('/pro');
  return { ok: true, noteId: next.id };
}

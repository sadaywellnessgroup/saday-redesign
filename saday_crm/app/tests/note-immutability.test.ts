import { describe, expect, it } from 'vitest';
import { MockClinicalRepo } from '@/lib/repos/clinical.repo';
import { ImmutableRecordError } from '@/lib/clinical/immutability';
import { ORG_ID } from '@/lib/repos/fixtures';

/* architecture.md §11 — a signed note is immutable; a correction is a new
 * row that keeps the original readable. These are the rules the P2
 * Postgres trigger enforces, asserted against the application mirror. */

const repo = new MockClinicalRepo();

async function freshDraft(appointmentId: string) {
  return repo.createSessionNote({
    organizationId: ORG_ID,
    appointmentId,
    patientId: 'pat_2',
    providerId: 'prov_aditya',
    sessionDate: '2026-09-10',
    durationMinutes: 25,
    mode: 'online',
  });
}

describe('session note immutability (architecture.md §11)', () => {
  it('lets the author edit an unsigned draft', async () => {
    const note = await freshDraft('appt_test_1');
    const updated = await repo.updateSessionNoteDraft(note.id, { narrative: 'First pass.' });
    expect(updated.narrative).toBe('First pass.');
    expect(updated.isLocked).toBe(false);
  });

  it('rejects an edit to a signed note', async () => {
    const note = await freshDraft('appt_test_2');
    await repo.updateSessionNoteDraft(note.id, {
      presentingConcern: 'Low mood',
      risk: ['no_risk'],
      narrative: 'Session ran to time.',
      progressScore: 6,
    });
    const signed = await repo.signSessionNote(note.id, 'usr_prov_aditya');
    expect(signed.isLocked).toBe(true);
    expect(signed.signedAt).not.toBeNull();

    await expect(repo.updateSessionNoteDraft(note.id, { narrative: 'sneaky edit' })).rejects.toBeInstanceOf(
      ImmutableRecordError,
    );

    const after = await repo.getSessionNote(note.id);
    expect(after?.narrative).toBe('Session ran to time.');
  });

  it('rejects a second signature on an already-signed note', async () => {
    const note = await freshDraft('appt_test_3');
    await repo.signSessionNote(note.id, 'usr_prov_aditya');
    await expect(repo.signSessionNote(note.id, 'usr_prov_aditya')).rejects.toBeInstanceOf(ImmutableRecordError);
  });

  it('supersede creates v2 and keeps v1 visible and unaltered', async () => {
    const note = await freshDraft('appt_test_4');
    await repo.updateSessionNoteDraft(note.id, {
      narrative: 'Original narrative.',
      risk: ['no_risk'],
      progressScore: 5,
    });
    const v1 = await repo.signSessionNote(note.id, 'usr_prov_aditya');

    const v2 = await repo.supersedeSessionNote(v1.id);
    expect(v2.version).toBe(2);
    expect(v2.supersedesId).toBe(v1.id);
    expect(v2.signedAt).toBeNull();
    expect(v2.isLocked).toBe(false);
    // content carried forward
    expect(v2.narrative).toBe('Original narrative.');

    const original = await repo.getSessionNote(v1.id);
    expect(original).not.toBeNull();
    expect(original!.narrative).toBe('Original narrative.');
    expect(original!.signedAt).toBe(v1.signedAt);
    expect(original!.supersededAt).not.toBeNull();

    // exactly one live note per appointment
    const live = await repo.getSessionNoteByAppointment('appt_test_4');
    expect(live?.id).toBe(v2.id);

    // both versions remain readable
    const chain = await repo.listNoteVersions('appt_test_4');
    expect(chain.map((n) => n.version)).toEqual([1, 2]);
  });

  it('will not supersede the same row twice', async () => {
    const note = await freshDraft('appt_test_5');
    await repo.signSessionNote(note.id, 'usr_prov_aditya');
    await repo.supersedeSessionNote(note.id);
    await expect(repo.supersedeSessionNote(note.id)).rejects.toThrow(/already superseded/);
  });
});

describe('proforma immutability', () => {
  it('locks on signing and supersedes into v2', async () => {
    const created = await repo.createProforma({
      organizationId: ORG_ID,
      patientId: 'pat_test_proforma',
      providerId: 'prov_aditya',
    });
    await repo.updateProformaDraft(created.id, { formulation: 'First formulation.' });
    const signed = await repo.signProforma(created.id, 'usr_prov_aditya');
    expect(signed.isLocked).toBe(true);

    await expect(repo.updateProformaDraft(created.id, { plan: 'edit' })).rejects.toBeInstanceOf(ImmutableRecordError);

    const v2 = await repo.supersedeProforma(signed.id);
    expect(v2.version).toBe(2);
    expect(v2.formulation).toBe('First formulation.');
    const live = await repo.getLiveProformaForPatient('pat_test_proforma');
    expect(live?.id).toBe(v2.id);
  });
});

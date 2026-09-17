import type { AssessmentProforma, SessionNote } from '@/lib/domain';

/* architecture.md §11 — note & proforma immutability, applied identically
 * to `session_notes` and `assessment_proformas`:
 *
 *  1. while `signedAt === null` the author edits freely;
 *  2. signing stamps `signedAt` + `signedByUserId`, `isLocked` follows;
 *  3. a locked row is immutable — every write is rejected;
 *  4. a correction is a NEW row (`version = old.version + 1`,
 *     `supersedesId = old.id`), and the old row's only permitted mutation
 *     is `supersededAt = now()`. The original is never altered or deleted;
 *  5. one live row per appointment (notes) / patient (proforma) — the
 *     superseded chain stays readable.
 *
 * In P2 the same rules are enforced in Postgres by a BEFORE UPDATE
 * trigger; this module is the application-side mirror so the mock repo
 * behaves the same and the rule is unit-testable today. */

export class ImmutableRecordError extends Error {
  readonly code = 'RECORD_LOCKED';
  constructor(kind: 'note' | 'proforma', id: string) {
    super(
      `${kind === 'note' ? 'Session note' : 'Proforma'} ${id} is signed and locked. ` +
        'Create a superseding version instead (architecture.md §11).',
    );
    this.name = 'ImmutableRecordError';
  }
}

type Lockable = Pick<SessionNote | AssessmentProforma, 'id' | 'signedAt' | 'isLocked' | 'supersededAt'>;

export function isLocked(row: Lockable): boolean {
  return row.signedAt !== null || row.isLocked;
}

/** Throws if the row may not be edited in place. */
export function assertEditable(row: Lockable, kind: 'note' | 'proforma'): void {
  if (isLocked(row)) throw new ImmutableRecordError(kind, row.id);
}

/** The field set a superseding version inherits from the row it replaces —
 * everything clinical, none of the lock/version bookkeeping. */
export function supersedingFields<T extends SessionNote | AssessmentProforma>(
  previous: T,
  nextId: string,
  nowISO: string,
): T {
  return {
    ...previous,
    id: nextId,
    signedAt: null,
    signedByUserId: null,
    isLocked: false,
    version: previous.version + 1,
    supersedesId: previous.id,
    supersededAt: null,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
}

/** The single mutation a locked row accepts: being marked superseded. */
export function markSuperseded<T extends SessionNote | AssessmentProforma>(row: T, nowISO: string): T {
  row.supersededAt = nowISO;
  row.updatedAt = nowISO;
  return row;
}

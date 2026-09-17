import type { RiskChip, SessionNote, SessionNoteMode } from '@/lib/domain';

/* The session-note structure is fixed by DECISION_LOG D-005 (Swasthmind
 * 4-section layout) and architecture.md §11. Nothing here is configurable
 * per provider — the four sections, the risk chips and the intervention
 * chips are the same for every note in the org. No AI drafting (D-022). */

export const NOTE_SECTIONS = [
  { id: 'details', key: 'sectionDetails' },
  { id: 'assessment', key: 'sectionAssessment' },
  { id: 'narrative', key: 'sectionNarrative' },
  { id: 'plan', key: 'sectionPlan' },
] as const;

export type NoteSectionId = (typeof NOTE_SECTIONS)[number]['id'];

/** Risk chips — required on every note (D-005 / D-009: these chips are the
 * only risk record the platform keeps). */
export const RISK_CHIPS: { value: RiskChip; label: string }[] = [
  { value: 'no_risk', label: 'No risk' },
  { value: 'self_harm', label: 'Self-harm' },
  { value: 'suicide', label: 'Suicide' },
  { value: 'violence', label: 'Violence' },
  { value: 'substance', label: 'Substance abuse' },
];

export const INTERVENTION_CHIPS: { value: string; label: string }[] = [
  { value: 'cbt', label: 'CBT' },
  { value: 'rebt', label: 'REBT' },
  { value: 'act', label: 'ACT' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'behaviour_activation', label: 'Behaviour activation' },
  { value: 'motivational_interviewing', label: 'Motivational interviewing' },
  { value: 'psychoeducation', label: 'Psychoeducation' },
  { value: 'solution_focused', label: 'Solution focused' },
  { value: 'family_therapy', label: 'Family therapy' },
];

export const NOTE_MODES: { value: SessionNoteMode; label: string }[] = [
  { value: 'online', label: 'Online (video)' },
  { value: 'in_person', label: 'In person' },
  { value: 'telephonic', label: 'Telephonic' },
];

export const MOOD_OPTIONS = ['Euthymic', 'Low', 'Anxious', 'Irritable', 'Elated', 'Labile'];
export const AFFECT_OPTIONS = ['Reactive', 'Restricted', 'Blunted', 'Flat', 'Inappropriate'];

/** Progress slider (0-10) anchor labels — D-005. */
export function progressLabel(score: number | null): string {
  if (score === null) return '—';
  if (score <= 3) return 'Regressed';
  if (score <= 6) return 'No change';
  return 'Improved';
}

export function riskLabel(chip: RiskChip): string {
  return RISK_CHIPS.find((r) => r.value === chip)?.label ?? chip;
}

export function interventionLabel(value: string): string {
  return INTERVENTION_CHIPS.find((i) => i.value === value)?.label ?? value;
}

/** A note is submittable (signable) only when the required fields of all
 * four sections are present. Risk is required (D-005). */
export function noteValidationErrors(note: Pick<
  SessionNote,
  'sessionDate' | 'durationMinutes' | 'mode' | 'presentingConcern' | 'risk' | 'narrative' | 'progressScore'
>): string[] {
  const errors: string[] = [];
  if (!note.sessionDate) errors.push('sessionDate');
  if (!note.durationMinutes || note.durationMinutes <= 0) errors.push('durationMinutes');
  if (!note.mode) errors.push('mode');
  if (!note.presentingConcern?.trim()) errors.push('presentingConcern');
  if (!note.risk || note.risk.length === 0) errors.push('risk');
  if (!note.narrative?.trim()) errors.push('narrative');
  if (note.progressScore === null || note.progressScore === undefined) errors.push('progressScore');
  return errors;
}

import type { PsychometricTool } from '@/lib/domain';

/* Pure scoring helpers — no repo/node imports, so they are safe to use from
 * a Client Component (the assessment runner shows the result immediately
 * without waiting on a server round trip) as well as from
 * psychometrics.repo.ts's createSubmission.
 *
 * `tool.scoring` is the free-form JSONB bag from `psychometric_tools`
 * (0001_schema.sql). At runtime it is whatever the matching file under
 * `src/lib/psychometrics/tools/*.json` put there (see fixtures/psychometrics.ts,
 * which is the only place that constructs a `PsychometricTool`). The types
 * below describe that shape; they are read with a cast because the domain
 * type keeps `scoring` as `Record<string, unknown>` on purpose — it is a
 * config bag, not a column list, and different tools use different rules. */

export interface Subscale {
  id: string;
  labelEn: string;
  itemIds: string[];
  /** 'sum' (default) adds the raw item values; 'threshold_count' counts how
   * many of the subscale's items meet or exceed their per-item threshold
   * (ASRS-v1.1's Inattention / Hyperactivity–impulsivity domain counts). */
  method?: 'sum' | 'threshold_count';
  thresholds?: Record<string, number>;
}

export type ScreenRule =
  | { type: 'total_cutoff'; value: number; labelEn: string }
  | { type: 'threshold_count'; itemThresholds: Record<string, number>; positiveAt: number; labelEn: string };

export type RemissionRule =
  | { type: 'total_lt'; value: number }
  | { type: 'total_lte'; value: number }
  | { type: 'item_rule'; itemIds: string[]; maxValue: number; note?: string }
  | null;

export type ResponseRule =
  | { type: 'percent_of_baseline'; fraction: number; note?: string }
  | { type: 'floor_plus_half'; floor: number; note?: string }
  | null;

export interface ToolScoring {
  method: 'sum';
  total: { min: number; max: number };
  safetyItemIds?: string[];
  subscales?: Subscale[];
  screenRule?: ScreenRule;
  remission?: RemissionRule;
  response?: ResponseRule;
}

function getScoring(tool: PsychometricTool): ToolScoring {
  return tool.scoring as unknown as ToolScoring;
}

function sumItems(itemIds: string[], answers: Record<string, number>): number {
  return itemIds.reduce((sum, id) => sum + (answers[id] ?? 0), 0);
}

function countAtOrAboveThreshold(itemIds: string[], thresholds: Record<string, number>, answers: Record<string, number>): number {
  return itemIds.filter((id) => (answers[id] ?? -Infinity) >= (thresholds[id] ?? Infinity)).length;
}

export interface ScoreResult {
  total: number;
  band: string | null;
  subscaleTotals: Record<string, number> | null;
  /** null when the tool has no `screenRule` (most clinician-rated scales). */
  screenPositive: boolean | null;
}

/** Scores one submission's answers against its tool definition: total,
 * severity band, per-subscale totals and (where the tool defines one) the
 * screen-positive flag — e.g. GAD-7's cut-off of 10, or ASRS-v1.1's Part A
 * "4 or more shaded items" rule. */
export function scoreAnswers(tool: PsychometricTool, answers: Record<string, number>): ScoreResult {
  const scoring = getScoring(tool);
  const total = sumItems(tool.items.map((item) => item.id), answers);
  const band = tool.bands.find((b) => total >= b.min && total <= b.max)?.label ?? tool.bands[0]?.label ?? null;

  const subscaleTotals = scoring.subscales
    ? Object.fromEntries(
        scoring.subscales.map((s) => [
          s.id,
          s.method === 'threshold_count'
            ? countAtOrAboveThreshold(s.itemIds, s.thresholds ?? {}, answers)
            : sumItems(s.itemIds, answers),
        ]),
      )
    : null;

  const screenPositive = scoreScreenRule(scoring.screenRule, total, answers);

  return { total, band, subscaleTotals, screenPositive };
}

function scoreScreenRule(rule: ScreenRule | undefined, total: number, answers: Record<string, number>): boolean | null {
  if (!rule) return null;
  if (rule.type === 'total_cutoff') return total >= rule.value;
  const positiveItems = countAtOrAboveThreshold(Object.keys(rule.itemThresholds), rule.itemThresholds, answers);
  return positiveItems >= rule.positiveAt;
}

export interface ProgressResult {
  /** null when the tool defines no `response` rule. */
  response: boolean | null;
  /** null when the tool defines no `remission` rule, or (for BPRS-18's
   * item-rule remission) when the current answers were not supplied. */
  remission: boolean | null;
}

/** Compares a later submission's total against a baseline (the patient's
 * first administration of the tool) using the tool's own response and
 * remission rules (D-024 — every ABC360 tracker defines both). `currentAnswers`
 * is only needed for BPRS-18's item-level remission rule; every other rule
 * works off totals alone. */
export function progress(
  baselineTotal: number,
  currentTotal: number,
  tool: PsychometricTool,
  currentAnswers?: Record<string, number>,
): ProgressResult {
  const scoring = getScoring(tool);

  let response: boolean | null = null;
  if (scoring.response) {
    if (scoring.response.type === 'percent_of_baseline') {
      response = currentTotal <= baselineTotal * scoring.response.fraction;
    } else if (scoring.response.type === 'floor_plus_half') {
      const line = scoring.response.floor + (baselineTotal - scoring.response.floor) / 2;
      response = currentTotal <= line;
    }
  }

  let remission: boolean | null = null;
  if (scoring.remission) {
    if (scoring.remission.type === 'total_lt') remission = currentTotal < scoring.remission.value;
    else if (scoring.remission.type === 'total_lte') remission = currentTotal <= scoring.remission.value;
    else if (scoring.remission.type === 'item_rule') {
      remission = currentAnswers
        ? scoring.remission.itemIds.every((id) => (currentAnswers[id] ?? Infinity) <= (scoring.remission as { maxValue: number }).maxValue)
        : null;
    }
  }

  return { response, remission };
}

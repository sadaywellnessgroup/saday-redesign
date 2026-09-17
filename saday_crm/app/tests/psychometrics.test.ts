import { describe, expect, it } from 'vitest';
import { psychometricTools } from '@/lib/repos/fixtures/psychometrics';
import { scoreAnswers, progress, type ToolScoring } from '@/lib/psychometrics/scoring';
import type { PsychometricItem, PsychometricTool } from '@/lib/domain';

function scoring(tool: PsychometricTool): ToolScoring {
  return tool.scoring as unknown as ToolScoring;
}

function minOf(item: PsychometricItem): number {
  return Math.min(...item.options.map((o) => o.value));
}
function maxOf(item: PsychometricItem): number {
  return Math.max(...item.options.map((o) => o.value));
}

function answersAtExtreme(tool: PsychometricTool, extreme: (item: PsychometricItem) => number): Record<string, number> {
  return Object.fromEntries(tool.items.map((item) => [item.id, extreme(item)]));
}

/** Greedily builds an answers record that sums to `target` — used to land
 * a submission inside a specific band without hand-picking every item's
 * answer. The scorer just sums raw values, so this only needs to be
 * achievable, not a "realistic" clinical pattern. */
function answersForTotal(tool: PsychometricTool, target: number): Record<string, number> {
  let remaining = target;
  const answers: Record<string, number> = {};
  for (const item of tool.items) {
    const max = maxOf(item);
    const take = Math.max(0, Math.min(max, remaining));
    answers[item.id] = take;
    remaining -= take;
  }
  return answers;
}

function tool(code: string): PsychometricTool {
  const t = psychometricTools.find((x) => x.code === code);
  if (!t) throw new Error(`fixture tool missing: ${code}`);
  return t;
}

describe('D-024 psychometric tools — min/max totals', () => {
  const cases: [code: string, itemCount: number, min: number, max: number][] = [
    ['PHQ9', 9, 0, 27],
    ['GAD7', 7, 0, 21],
    ['HAMD17', 17, 0, 52],
    ['HAMA', 14, 0, 56],
    ['BPRS18', 18, 18, 126],
    ['YMRS', 11, 0, 60],
    ['ASRS_V1_1', 18, 0, 72],
  ];

  it.each(cases)('%s has %i items and totals %i..%i at the answer extremes', (code, itemCount, min, max) => {
    const t = tool(code);
    expect(t.items).toHaveLength(itemCount);
    const s = scoring(t);
    expect(s.total).toEqual({ min, max });

    const lowest = scoreAnswers(t, answersAtExtreme(t, minOf));
    const highest = scoreAnswers(t, answersAtExtreme(t, maxOf));
    expect(lowest.total).toBe(min);
    expect(highest.total).toBe(max);
  });
});

describe('D-024 psychometric tools — one mid-band case each', () => {
  it('PHQ-9 total 12 bands as Moderate', () => {
    expect(scoreAnswers(tool('PHQ9'), answersForTotal(tool('PHQ9'), 12)).band).toBe('Moderate');
  });
  it('GAD-7 total 7 bands as Mild', () => {
    expect(scoreAnswers(tool('GAD7'), answersForTotal(tool('GAD7'), 7)).band).toBe('Mild');
  });
  it('HAM-D-17 total 20 bands as Moderate', () => {
    expect(scoreAnswers(tool('HAMD17'), answersForTotal(tool('HAMD17'), 20)).band).toBe('Moderate');
  });
  it('HAM-A total 10 bands as Mild', () => {
    expect(scoreAnswers(tool('HAMA'), answersForTotal(tool('HAMA'), 10)).band).toBe('Mild');
  });
  it('BPRS-18 total 45 bands as Moderately ill', () => {
    expect(scoreAnswers(tool('BPRS18'), answersForTotal(tool('BPRS18'), 45)).band).toBe('Moderately ill');
  });
  it('YMRS total 25 bands as Moderate', () => {
    expect(scoreAnswers(tool('YMRS'), answersForTotal(tool('YMRS'), 25)).band).toBe('Moderate');
  });
  it('ASRS-v1.1 has no validated severity band regardless of total', () => {
    const result = scoreAnswers(tool('ASRS_V1_1'), answersForTotal(tool('ASRS_V1_1'), 40));
    expect(result.band).toBe('No validated severity band — see the Part A screen result');
  });
});

describe('PHQ-9 remission and response (ABC360 depression tracker)', () => {
  const phq9 = tool('PHQ9');

  it('remits below 5', () => {
    expect(progress(20, 4, phq9).remission).toBe(true);
    expect(progress(20, 5, phq9).remission).toBe(false);
  });

  it('responds at half of baseline or lower', () => {
    expect(progress(20, 10, phq9).response).toBe(true);
    expect(progress(20, 11, phq9).response).toBe(false);
  });

  it('scores a full self-report submission and flags remission/response together', () => {
    const baselineAnswers = answersForTotal(phq9, 20);
    const baseline = scoreAnswers(phq9, baselineAnswers).total;
    const followUp = scoreAnswers(phq9, answersForTotal(phq9, 4));
    const result = progress(baseline, followUp.total, phq9);
    expect(result.remission).toBe(true);
    expect(result.response).toBe(true);
  });
});

describe('GAD-7 screening cut-off', () => {
  it('flags 10 or more as a positive screen', () => {
    const gad7 = tool('GAD7');
    expect(scoreAnswers(gad7, answersForTotal(gad7, 9)).screenPositive).toBe(false);
    expect(scoreAnswers(gad7, answersForTotal(gad7, 10)).screenPositive).toBe(true);
  });
});

describe('BPRS-18 remission item rule (Andreasen 2005)', () => {
  const bprs = tool('BPRS18');
  const remissionItemIds = ['bprs_4', 'bprs_7', 'bprs_8', 'bprs_11', 'bprs_12', 'bprs_15', 'bprs_16'];

  function allAt(value: number, overrides: Record<string, number> = {}): Record<string, number> {
    return Object.fromEntries(bprs.items.map((item) => [item.id, overrides[item.id] ?? value]));
  }

  it('is in remission only when every R item scores 3 (mild) or less', () => {
    const answers = allAt(2); // every item, including the 7 R items, at 2
    expect(progress(90, 36, bprs, answers).remission).toBe(true);
  });

  it('is not in remission if even one R item exceeds 3', () => {
    const answers = allAt(2, { bprs_8: 4 }); // Grandiosity (an R item) pushed to 4
    expect(progress(90, 38, bprs, answers).remission).toBe(false);
  });

  it('returns null when no current answers are supplied (the rule cannot be checked from a total alone)', () => {
    expect(progress(90, 36, bprs).remission).toBeNull();
  });

  it('the remission rule lists exactly the seven published R items', () => {
    const s = scoring(bprs);
    expect(s.remission).toMatchObject({ type: 'item_rule', itemIds: remissionItemIds, maxValue: 3 });
  });

  it('response line sits at 18 + (baseline − 18) ÷ 2', () => {
    expect(progress(90, 54, bprs).response).toBe(true); // 18 + (90-18)/2 = 54
    expect(progress(90, 55, bprs).response).toBe(false);
  });
});

describe('ASRS-v1.1 Part A screen rule', () => {
  const asrs = tool('ASRS_V1_1');
  const partA = ['asrs_1', 'asrs_2', 'asrs_3', 'asrs_4', 'asrs_5', 'asrs_6'];
  // Per-item shaded thresholds transcribed from the proforma: items 1-3 and
  // 9/12/16/18 shade at "Sometimes" (>=2); items 4-6 and the rest of Part B
  // shade at "Often" (>=3).
  const thresholds: Record<string, number> = { asrs_1: 2, asrs_2: 2, asrs_3: 2, asrs_4: 3, asrs_5: 3, asrs_6: 3 };

  function answersWithShadedCount(count: number): Record<string, number> {
    const answers: Record<string, number> = Object.fromEntries(asrs.items.map((item) => [item.id, 0]));
    partA.slice(0, count).forEach((id) => {
      answers[id] = thresholds[id]!; // exactly at threshold — still counts as shaded
    });
    return answers;
  }

  it('screens negative with 3 of 6 Part A items shaded', () => {
    const result = scoreAnswers(asrs, answersWithShadedCount(3));
    expect(result.screenPositive).toBe(false);
  });

  it('screens positive with 4 of 6 Part A items shaded', () => {
    const result = scoreAnswers(asrs, answersWithShadedCount(4));
    expect(result.screenPositive).toBe(true);
  });

  it('a Part A item just under its threshold does not count as shaded', () => {
    const answers = answersWithShadedCount(4);
    answers['asrs_4'] = thresholds['asrs_4']! - 1; // Often (3) -> Sometimes (2): drops below its threshold
    expect(scoreAnswers(asrs, answers).screenPositive).toBe(false);
  });

  it('subscale counts use each item\'s own shading threshold, not the raw sum', () => {
    const answers = answersWithShadedCount(6); // all 6 Part A items shaded
    const result = scoreAnswers(asrs, answers);
    expect(result.subscaleTotals).not.toBeNull();
    // Part A items split 4 into Inattention (1,2,3,4) and 2 into Hyperactivity-impulsivity (5,6)
    expect(result.subscaleTotals!['inattention']).toBeGreaterThanOrEqual(4);
    expect(result.subscaleTotals!['hyperactivity_impulsivity']).toBeGreaterThanOrEqual(2);
  });
});

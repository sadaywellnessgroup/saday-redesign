import { describe, expect, it } from 'vitest';
import {
  PROFORMA_SECTIONS,
  SUBSTANCE_COLUMNS,
  overallCompletion,
  sectionCompletion,
  sectionValues,
} from '@/lib/clinical/proforma-spec';
import { assessmentProformas } from '@/lib/repos/fixtures';

const section = (id: string) => PROFORMA_SECTIONS.find((s) => s.id === id)!;

describe('proforma completion %', () => {
  it('is 0% for an untouched section', () => {
    const c = sectionCompletion(section('sociodemographic'), {});
    expect(c.answered).toBe(0);
    expect(c.pct).toBe(0);
  });

  it('counts answered fields, ignoring empty strings and empty arrays', () => {
    const socio = section('sociodemographic');
    const c = sectionCompletion(socio, {
      age: 34,
      gender: 'Male',
      maritalStatus: '',
      familyType: null,
      education: undefined,
      occupation: [],
    });
    expect(c.answered).toBe(2);
    expect(c.total).toBe(socio.fields.length);
    expect(c.pct).toBe(Math.round((2 / socio.fields.length) * 100));
  });

  it('is 100% when every field in a section is answered', () => {
    const informant = section('informant');
    const values = Object.fromEntries(informant.fields.map((f) => [f.key, f.type === 'number' ? 1 : 'Yes']));
    expect(sectionCompletion(informant, values).pct).toBe(100);
  });

  it('treats the diagnosis picker as a single item', () => {
    const diagnosis = section('diagnosis');
    expect(sectionCompletion(diagnosis, { diagnosisIcd11: [] }).pct).toBe(0);
    expect(sectionCompletion(diagnosis, { diagnosisIcd11: ['6A70'] }).pct).toBe(100);
  });

  it('grows the substance section total per selected class', () => {
    const substance = section('substanceUse');

    const none = sectionCompletion(substance, { classesUsed: ['None'] });
    expect(none.total).toBe(1);
    expect(none.pct).toBe(100);

    const oneClassEmpty = sectionCompletion(substance, { classesUsed: ['Alcohol'] });
    expect(oneClassEmpty.total).toBe(1 + SUBSTANCE_COLUMNS.length);
    expect(oneClassEmpty.answered).toBe(1);

    const oneClassFull = sectionCompletion(substance, {
      classesUsed: ['Alcohol'],
      detail_Alcohol: Object.fromEntries(SUBSTANCE_COLUMNS.map((c) => [c.key, c.key === 'ageFirstUse' ? 18 : 'Daily'])),
    });
    expect(oneClassFull.pct).toBe(100);

    const twoClasses = sectionCompletion(substance, { classesUsed: ['Alcohol', 'Cannabis'] });
    expect(twoClasses.total).toBe(1 + 2 * SUBSTANCE_COLUMNS.length);
  });

  it('weights the whole proforma by field count, not by section count', () => {
    const signed = assessmentProformas.find((p) => p.id === 'proforma_1')!;
    const draft = assessmentProformas.find((p) => p.id === 'proforma_2')!;

    const signedPct = overallCompletion(signed).pct;
    const draftPct = overallCompletion(draft).pct;

    expect(signedPct).toBeGreaterThan(draftPct);
    expect(signedPct).toBeGreaterThan(80);
    expect(draftPct).toBeGreaterThan(0);
    expect(draftPct).toBeLessThan(50);

    // the MSE alone carries more weight than "Plan"
    const mse = sectionCompletion(section('mse'), sectionValues(signed, section('mse')));
    const plan = sectionCompletion(section('plan'), sectionValues(signed, section('plan')));
    expect(mse.total).toBeGreaterThan(plan.total);
  });

  it('never exceeds 100% or drops below 0%', () => {
    for (const s of PROFORMA_SECTIONS) {
      for (const proforma of assessmentProformas) {
        const pct = sectionCompletion(s, sectionValues(proforma, s)).pct;
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
    }
  });
});

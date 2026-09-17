import type { AssessmentProforma } from '@/lib/domain';

/* Online assessment proforma — the Nischay IPD Case Record File digitised
 * per BUILD_PLAN §3 and D-016. Every item is a chip group / select /
 * radio / short text; free text only where the paper form is free text.
 * Monthly income and religion are NOT fields (D-016). Full MSE, not the
 * light version.
 *
 * Each UI section declares which JSONB column of `assessment_proformas`
 * its answers live in, so the section map can grow without a migration
 * (the columns are fixed by 0001_schema.sql §7). */

export type ProformaFieldType = 'chips' | 'select' | 'radio' | 'text' | 'textarea' | 'number' | 'scale';

export interface ProformaField {
  key: string;
  label: string;
  type: ProformaFieldType;
  options?: string[];
  /** scale fields only */
  min?: number;
  max?: number;
  hint?: string;
}

/** Which JSONB column on `assessment_proformas` a section writes into. */
export type ProformaColumn =
  | 'sociodemographic'
  | 'informant'
  | 'presentIllness'
  | 'biologicalFunctions'
  | 'substanceUse'
  | 'pastHistory'
  | 'familyHistory'
  | 'personalHistory'
  | 'premorbidPersonality'
  | 'mse'
  | 'diagnosis'
  | 'formulation'
  | 'plan';

export interface ProformaSection {
  id: string;
  title: string;
  column: ProformaColumn;
  fields: ProformaField[];
  /** 'substance' renders the 8-class grid; 'diagnosis' the ICD-11 picker. */
  kind?: 'fields' | 'substance' | 'diagnosis';
}

const YES_NO_NK = ['Yes', 'No', 'Not known'];

export const SUBSTANCE_CLASSES = [
  'Alcohol',
  'Nicotine / tobacco',
  'Cannabis',
  'Opioids',
  'Sedatives / hypnotics',
  'Stimulants',
  'Inhalants',
  'Hallucinogens',
] as const;

export const SUBSTANCE_COLUMNS: ProformaField[] = [
  { key: 'ageFirstUse', label: 'Age at first use', type: 'number' },
  { key: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Most days', 'Weekly', 'Monthly', 'Occasional', 'Abstinent'] },
  { key: 'quantity', label: 'Quantity / day', type: 'text' },
  { key: 'route', label: 'Route', type: 'select', options: ['Oral', 'Smoked', 'Chewed', 'Inhaled', 'Injected', 'Other'] },
  { key: 'lastUse', label: 'Last use', type: 'select', options: ['Today', 'Within a week', 'Within a month', 'Within 6 months', 'Over a year ago'] },
];

export const PROFORMA_SECTIONS: ProformaSection[] = [
  {
    id: 'sociodemographic',
    title: 'Sociodemographic',
    column: 'sociodemographic',
    fields: [
      { key: 'age', label: 'Age (years)', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'radio', options: ['Female', 'Male', 'Other', 'Prefer not to say'] },
      { key: 'maritalStatus', label: 'Marital status', type: 'select', options: ['Unmarried', 'Married', 'Separated', 'Divorced', 'Widowed'] },
      { key: 'familyType', label: 'Family type', type: 'radio', options: ['Nuclear', 'Joint', 'Extended', 'Living alone'] },
      { key: 'livingArrangement', label: 'Living arrangement', type: 'select', options: ['With family', 'With spouse', 'Hostel / PG', 'Alone', 'Institutional'] },
      { key: 'education', label: 'Education', type: 'select', options: ['Illiterate', 'Primary', 'Middle', 'High school', 'Intermediate', 'Graduate', 'Post-graduate', 'Professional'] },
      { key: 'occupation', label: 'Occupation', type: 'select', options: ['Student', 'Employed', 'Self-employed', 'Homemaker', 'Unemployed', 'Retired'] },
      { key: 'residence', label: 'Residence', type: 'radio', options: ['Urban', 'Semi-urban', 'Rural'] },
      { key: 'referralSource', label: 'Referral source', type: 'select', options: ['Self', 'Family', 'GP / physician', 'Psychiatrist', 'Psychologist', 'Online', 'Other'] },
      { key: 'willingness', label: 'Willingness for treatment', type: 'radio', options: ['Willing', 'Ambivalent', 'Unwilling'] },
    ],
  },
  {
    id: 'informant',
    title: 'Informant',
    column: 'informant',
    fields: [
      { key: 'present', label: 'Informant present', type: 'radio', options: ['Yes', 'No'] },
      { key: 'relationship', label: 'Relationship to patient', type: 'select', options: ['Self', 'Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other relative'] },
      { key: 'knownFor', label: 'Known to patient for', type: 'select', options: ['< 1 year', '1–5 years', '5–10 years', 'Lifelong'] },
      { key: 'reliability', label: 'Reliability', type: 'radio', options: ['Reliable', 'Partly reliable', 'Unreliable'] },
      { key: 'adequacy', label: 'Adequacy', type: 'radio', options: ['Adequate', 'Inadequate'] },
    ],
  },
  {
    id: 'physical',
    title: 'Present physical illness',
    column: 'presentIllness',
    fields: [
      { key: 'physicalIllnessPresent', label: 'Current physical illness', type: 'radio', options: YES_NO_NK },
      { key: 'physicalConditions', label: 'Conditions', type: 'chips', options: ['Diabetes', 'Hypertension', 'Thyroid disorder', 'Cardiac', 'Respiratory', 'Neurological', 'Seizure disorder', 'Pregnancy', 'None'] },
      { key: 'physicalMedication', label: 'Current medication', type: 'text' },
      { key: 'allergies', label: 'Known allergies', type: 'text' },
    ],
  },
  {
    id: 'complaints',
    title: 'Presenting complaints',
    column: 'presentIllness',
    fields: [
      { key: 'complaintSource', label: 'Reported by', type: 'radio', options: ['Patient', 'Informant', 'Both'] },
      { key: 'complaintChips', label: 'Chief complaints', type: 'chips', options: ['Low mood', 'Anxiety', 'Sleep disturbance', 'Appetite change', 'Irritability', 'Suspiciousness', 'Hearing voices', 'Obsessions / compulsions', 'Substance use', 'Self-harm', 'Somatic symptoms', 'Memory complaints', 'Behavioural problems'] },
      { key: 'complaintText', label: 'Complaints in the patient’s words', type: 'textarea' },
      { key: 'duration', label: 'Total duration', type: 'select', options: ['< 1 month', '1–6 months', '6–12 months', '1–2 years', '> 2 years'] },
    ],
  },
  {
    id: 'hopi',
    title: 'History of present illness (HOPI)',
    column: 'presentIllness',
    fields: [
      { key: 'onset', label: 'Onset', type: 'radio', options: ['Abrupt', 'Acute', 'Subacute', 'Insidious'] },
      { key: 'course', label: 'Course', type: 'radio', options: ['Continuous', 'Episodic', 'Fluctuating', 'Deteriorating'] },
      { key: 'progress', label: 'Progress', type: 'radio', options: ['Improving', 'Static', 'Worsening'] },
      { key: 'predisposing', label: 'Predisposing factors', type: 'chips', options: ['Family history', 'Childhood adversity', 'Medical illness', 'Personality vulnerability', 'Substance use', 'None identified'] },
      { key: 'precipitating', label: 'Precipitating factors', type: 'chips', options: ['Bereavement', 'Relationship conflict', 'Academic stress', 'Financial stress', 'Job loss', 'Illness', 'Migration', 'None identified'] },
      { key: 'perpetuating', label: 'Perpetuating factors', type: 'chips', options: ['Ongoing conflict', 'Poor support', 'Non-adherence', 'Substance use', 'Chronic illness', 'Financial strain', 'None identified'] },
      { key: 'hopiNarrative', label: 'Narrative', type: 'textarea' },
    ],
  },
  {
    id: 'presentIllness',
    title: 'Present illness — attitude & biological functions',
    column: 'biologicalFunctions',
    fields: [
      { key: 'attitude', label: 'Attitude towards illness', type: 'radio', options: ['Accepts illness', 'Partial acceptance', 'Denies illness'] },
      { key: 'treatmentSeeking', label: 'Treatment-seeking behaviour', type: 'radio', options: ['Active', 'Passive', 'Resistant'] },
      { key: 'appetite', label: 'Appetite', type: 'radio', options: ['Normal', 'Reduced', 'Increased', 'Variable'] },
      { key: 'weight', label: 'Weight change', type: 'radio', options: ['Stable', 'Loss', 'Gain'] },
      { key: 'sleepChips', label: 'Sleep', type: 'chips', options: ['Normal', 'Initial insomnia', 'Middle insomnia', 'Early morning awakening', 'Hypersomnia', 'Non-restorative', 'Nightmares'] },
      { key: 'sleepHours', label: 'Average hours slept', type: 'number' },
      { key: 'libido', label: 'Libido', type: 'radio', options: ['Normal', 'Reduced', 'Increased', 'Not assessed'] },
      { key: 'socioOccupational', label: 'Socio-occupational functioning', type: 'radio', options: ['Unimpaired', 'Mildly impaired', 'Moderately impaired', 'Severely impaired'] },
    ],
  },
  {
    id: 'substanceUse',
    title: 'Substance use',
    column: 'substanceUse',
    kind: 'substance',
    fields: [
      { key: 'classesUsed', label: 'Substances ever used', type: 'chips', options: [...SUBSTANCE_CLASSES, 'None'] },
    ],
  },
  {
    id: 'pastHistory',
    title: 'Past psychiatric & medical history',
    column: 'pastHistory',
    fields: [
      { key: 'pastPsychiatric', label: 'Past psychiatric illness', type: 'radio', options: YES_NO_NK },
      { key: 'pastEpisodes', label: 'Number of past episodes', type: 'select', options: ['1', '2', '3', '4 or more'] },
      { key: 'pastTreatment', label: 'Past treatment', type: 'chips', options: ['Medication', 'Psychotherapy', 'ECT', 'Inpatient care', 'Rehabilitation', 'None'] },
      { key: 'adherence', label: 'Adherence to past treatment', type: 'radio', options: ['Good', 'Partial', 'Poor', 'Not applicable'] },
      { key: 'pastMedical', label: 'Past medical / surgical history', type: 'textarea' },
      { key: 'headInjury', label: 'Head injury / seizures', type: 'radio', options: YES_NO_NK },
    ],
  },
  {
    id: 'familyHistory',
    title: 'Family history',
    column: 'familyHistory',
    fields: [
      { key: 'familyPsychiatric', label: 'Psychiatric illness in family', type: 'chips', options: ['Depression', 'Bipolar disorder', 'Schizophrenia', 'Anxiety disorder', 'Substance use', 'Suicide', 'Epilepsy', 'Intellectual disability', 'None'] },
      { key: 'relationAffected', label: 'Relation affected', type: 'select', options: ['First degree', 'Second degree', 'Both', 'Not applicable'] },
      { key: 'familyAdjustment', label: 'Family adjustment pattern', type: 'radio', options: ['Harmonious', 'Occasional conflict', 'Persistent conflict', 'Estranged'] },
      { key: 'communication', label: 'Communication pattern', type: 'radio', options: ['Open', 'Restricted', 'Hostile'] },
      { key: 'familyNotes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'personalHistory',
    title: 'Personal history',
    column: 'personalHistory',
    fields: [
      { key: 'birth', label: 'Birth & early development', type: 'radio', options: ['Normal', 'Delayed milestones', 'Perinatal complications', 'Not known'] },
      { key: 'childhood', label: 'Childhood adversity', type: 'chips', options: ['Neglect', 'Physical abuse', 'Emotional abuse', 'Parental loss', 'Bullying', 'None reported'] },
      { key: 'scholastic', label: 'Scholastic history', type: 'radio', options: ['Above average', 'Average', 'Below average', 'School refusal / dropout'] },
      { key: 'occupational', label: 'Occupational history', type: 'radio', options: ['Stable', 'Frequent changes', 'Unemployed', 'Not applicable'] },
      { key: 'forensic', label: 'Forensic history', type: 'radio', options: ['Nil', 'Present'] },
      { key: 'marital', label: 'Marital / relationship history', type: 'radio', options: ['Satisfactory', 'Conflictual', 'Separated', 'Not applicable'] },
      { key: 'sexual', label: 'Sexual history (optional)', type: 'select', options: ['Not assessed', 'Unremarkable', 'Concerns reported'] },
      { key: 'personalNotes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'premorbidPersonality',
    title: 'Premorbid personality',
    column: 'premorbidPersonality',
    fields: [
      { key: 'socialRelations', label: 'Social relations', type: 'radio', options: ['Outgoing', 'Selective', 'Withdrawn'] },
      { key: 'mood', label: 'Predominant mood', type: 'radio', options: ['Stable', 'Anxious', 'Cheerful', 'Pessimistic', 'Labile'] },
      { key: 'character', label: 'Character traits', type: 'chips', options: ['Perfectionistic', 'Impulsive', 'Dependent', 'Suspicious', 'Conscientious', 'Sensitive', 'Aggressive'] },
      { key: 'habits', label: 'Habits & interests', type: 'text' },
      { key: 'religiousBeliefs', label: 'Attitude to work & responsibility', type: 'radio', options: ['Responsible', 'Variable', 'Avoidant'] },
    ],
  },
  {
    id: 'mse',
    title: 'Mental state examination',
    column: 'mse',
    fields: [
      { key: 'appearance', label: 'Appearance & behaviour', type: 'chips', options: ['Well kempt', 'Unkempt', 'Cooperative', 'Guarded', 'Restless', 'Psychomotor retardation', 'Eye contact maintained', 'Eye contact poor', 'Rapport established'] },
      { key: 'speech', label: 'Speech', type: 'chips', options: ['Normal rate', 'Increased rate', 'Decreased rate', 'Pressured', 'Monotonous', 'Relevant', 'Irrelevant', 'Circumstantial', 'Mutism'] },
      { key: 'mood', label: 'Mood (subjective)', type: 'select', options: ['Euthymic', 'Sad', 'Anxious', 'Irritable', 'Elated', 'Empty'] },
      { key: 'affect', label: 'Affect (objective)', type: 'select', options: ['Reactive', 'Restricted', 'Blunted', 'Flat', 'Labile', 'Inappropriate'] },
      { key: 'thoughtStream', label: 'Thought — stream & form', type: 'chips', options: ['Normal', 'Flight of ideas', 'Retardation', 'Loosening of associations', 'Tangentiality', 'Thought block', 'Neologism'] },
      { key: 'thoughtPossession', label: 'Thought — possession', type: 'chips', options: ['Normal', 'Obsessions', 'Thought insertion', 'Thought withdrawal', 'Thought broadcast'] },
      { key: 'thoughtContent', label: 'Thought — content', type: 'chips', options: ['No abnormality', 'Worthlessness', 'Hopelessness', 'Guilt', 'Death wishes', 'Suicidal ideation', 'Homicidal ideation', 'Overvalued ideas'] },
      { key: 'delusions', label: 'Delusions', type: 'chips', options: ['None', 'Persecutory', 'Reference', 'Grandiose', 'Nihilistic', 'Somatic', 'Control', 'Infidelity'] },
      { key: 'perception', label: 'Perception', type: 'chips', options: ['No abnormality', 'Auditory hallucinations', 'Visual hallucinations', 'Tactile hallucinations', 'Olfactory hallucinations', 'Illusions', 'Depersonalisation', 'Derealisation'] },
      { key: 'orientation', label: 'Cognition — orientation', type: 'radio', options: ['Oriented to time, place & person', 'Partially disoriented', 'Disoriented'] },
      { key: 'attention', label: 'Cognition — attention & concentration', type: 'radio', options: ['Aroused & sustained', 'Aroused, not sustained', 'Not aroused'] },
      { key: 'memory', label: 'Cognition — memory', type: 'chips', options: ['Immediate intact', 'Recent intact', 'Remote intact', 'Immediate impaired', 'Recent impaired', 'Remote impaired'] },
      { key: 'intelligence', label: 'Cognition — intelligence', type: 'radio', options: ['Average', 'Above average', 'Below average', 'Not formally assessed'] },
      { key: 'abstraction', label: 'Abstraction', type: 'radio', options: ['Abstract', 'Functional', 'Concrete'] },
      { key: 'judgement', label: 'Judgement', type: 'radio', options: ['Intact — personal, social & test', 'Partially impaired', 'Impaired'] },
      { key: 'insight', label: 'Insight (1–6)', type: 'scale', min: 1, max: 6, hint: '1 = complete denial · 6 = true emotional insight' },
    ],
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis (ICD-11)',
    column: 'diagnosis',
    kind: 'diagnosis',
    fields: [],
  },
  {
    id: 'formulation',
    title: 'Formulation',
    column: 'formulation',
    fields: [{ key: 'formulation', label: 'Case formulation', type: 'textarea' }],
  },
  {
    id: 'plan',
    title: 'Plan',
    column: 'plan',
    fields: [{ key: 'plan', label: 'Management plan', type: 'textarea' }],
  },
];

export const PROFORMA_SPEC_VERSION = 'proforma-1.0';

/* ------------------------------------------------------------------ */
/* Completion                                                          */
/* ------------------------------------------------------------------ */

export type ProformaValues = Record<string, unknown>;

function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(isAnswered);
  return true;
}

export interface SectionCompletion {
  answered: number;
  total: number;
  pct: number;
}

/** Completion for one section. The substance grid is dynamic: the
 * "substances ever used" chip row always counts, and each selected class
 * adds its five detail cells (selecting "None" adds nothing). */
export function sectionCompletion(section: ProformaSection, values: ProformaValues): SectionCompletion {
  if (section.kind === 'diagnosis') {
    const codes = values.diagnosisIcd11;
    const answered = isAnswered(codes) ? 1 : 0;
    return { answered, total: 1, pct: answered * 100 };
  }

  if (section.kind === 'substance') {
    const selected = Array.isArray(values.classesUsed) ? (values.classesUsed as string[]) : [];
    const realClasses = selected.filter((c) => c !== 'None');
    let total = 1;
    let answered = selected.length > 0 ? 1 : 0;
    for (const cls of realClasses) {
      const detail = (values[`detail_${cls}`] ?? {}) as Record<string, unknown>;
      total += SUBSTANCE_COLUMNS.length;
      answered += SUBSTANCE_COLUMNS.filter((col) => isAnswered(detail[col.key])).length;
    }
    return { answered, total, pct: Math.round((answered / total) * 100) };
  }

  const total = section.fields.length;
  if (total === 0) return { answered: 0, total: 0, pct: 0 };
  const answered = section.fields.filter((f) => isAnswered(values[f.key])).length;
  return { answered, total, pct: Math.round((answered / total) * 100) };
}

/** Values for one UI section, read out of the proforma row's JSONB blobs. */
export function sectionValues(proforma: AssessmentProforma, section: ProformaSection): ProformaValues {
  switch (section.column) {
    case 'diagnosis':
      return { diagnosisIcd11: proforma.diagnosisIcd11 };
    case 'formulation':
      return { formulation: proforma.formulation };
    case 'plan':
      return { plan: proforma.plan };
    default:
      return (proforma[section.column] ?? {}) as ProformaValues;
  }
}

/** Whole-proforma completion, weighted by field count (so the MSE counts
 * for more than "Plan" — the progress bar tracks work done, not sections
 * touched). */
export function overallCompletion(proforma: AssessmentProforma): SectionCompletion {
  let answered = 0;
  let total = 0;
  for (const section of PROFORMA_SECTIONS) {
    const c = sectionCompletion(section, sectionValues(proforma, section));
    answered += c.answered;
    total += c.total;
  }
  return { answered, total, pct: total === 0 ? 0 : Math.round((answered / total) * 100) };
}

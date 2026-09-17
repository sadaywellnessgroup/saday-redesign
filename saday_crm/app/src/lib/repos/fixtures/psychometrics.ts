import type { PsychometricSubmission, PsychometricTool } from '@/lib/domain';
import { ORG_ID } from './organization';
import { FIXTURE_NOW, dayOffset } from './time';

const NOW = FIXTURE_NOW.toISOString();

const SCALE_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

const PHQ9_PROMPTS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things',
  'Moving or speaking noticeably slowly, or being fidgety/restless',
  'Thoughts that you would be better off dead, or of hurting yourself',
];

const GAD7_PROMPTS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen',
];

export const psychometricTools: PsychometricTool[] = [
  {
    id: 'tool_phq9_en',
    organizationId: ORG_ID,
    code: 'PHQ9',
    name: 'Patient Health Questionnaire-9 (PHQ-9)',
    version: '1.0',
    language: 'en',
    items: PHQ9_PROMPTS.map((prompt, i) => ({ id: `phq9_${i + 1}`, prompt, options: SCALE_OPTIONS })),
    scoring: { method: 'sum', total: { min: 0, max: 27 } },
    bands: [
      { label: 'Minimal', min: 0, max: 4, severity: 'minimal' },
      { label: 'Mild', min: 5, max: 9, severity: 'mild' },
      { label: 'Moderate', min: 10, max: 14, severity: 'moderate' },
      { label: 'Moderately severe', min: 15, max: 19, severity: 'moderately_severe' },
      { label: 'Severe', min: 20, max: 27, severity: 'severe' },
    ],
    administeredBy: 'either',
    sourceCitation: 'Kroenke, Spitzer & Williams (2001) — public domain.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'tool_gad7_en',
    organizationId: ORG_ID,
    code: 'GAD7',
    name: 'Generalized Anxiety Disorder-7 (GAD-7)',
    version: '1.0',
    language: 'en',
    items: GAD7_PROMPTS.map((prompt, i) => ({ id: `gad7_${i + 1}`, prompt, options: SCALE_OPTIONS })),
    scoring: { method: 'sum', total: { min: 0, max: 21 } },
    bands: [
      { label: 'Minimal', min: 0, max: 4, severity: 'minimal' },
      { label: 'Mild', min: 5, max: 9, severity: 'mild' },
      { label: 'Moderate', min: 10, max: 14, severity: 'moderate' },
      { label: 'Severe', min: 15, max: 21, severity: 'severe' },
    ],
    administeredBy: 'either',
    sourceCitation: 'Spitzer, Kroenke, Williams & Löwe (2006) — public domain.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

/* ------------------------------------------------------------------ *
 * The remaining five D-024 tools. HAM-D-17 / HAM-A / BPRS-18 / YMRS are
 * clinician-rated (the provider runs them inside the console); ASRS-v1.1
 * is self-rated. Item wording is abbreviated to the published item names
 * — all five are free / public-domain instruments.
 * ------------------------------------------------------------------ */

function scale(labels: string[]) {
  return labels.map((label, value) => ({ label, value }));
}

const SCALE_0_4 = scale(['Absent', 'Mild', 'Moderate', 'Severe', 'Very severe']);
const SCALE_0_2 = scale(['Absent', 'Mild / doubtful', 'Clearly present']);
const SCALE_1_7 = ['Not present', 'Very mild', 'Mild', 'Moderate', 'Moderately severe', 'Severe', 'Extremely severe'].map(
  (label, i) => ({ label, value: i + 1 }),
);
const SCALE_0_8 = scale(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
const ASRS_SCALE = scale(['Never', 'Rarely', 'Sometimes', 'Often', 'Very often']);

function items(prompts: string[], prefix: string, options: { label: string; value: number }[]) {
  return prompts.map((prompt, i) => ({ id: `${prefix}_${i + 1}`, prompt, options }));
}

const HAMD17_0_4 = [
  'Depressed mood',
  'Feelings of guilt',
  'Suicide',
  'Work and activities',
  'Retardation (psychomotor)',
  'Agitation',
  'Psychic anxiety',
  'Somatic anxiety',
  'Hypochondriasis',
];
const HAMD17_0_2 = [
  'Insomnia — early',
  'Insomnia — middle',
  'Insomnia — late',
  'Somatic symptoms — gastrointestinal',
  'Somatic symptoms — general',
  'Genital symptoms',
  'Loss of weight',
  'Insight',
];

const HAMA_PROMPTS = [
  'Anxious mood',
  'Tension',
  'Fears',
  'Insomnia',
  'Intellectual (cognitive) difficulty',
  'Depressed mood',
  'Somatic complaints — muscular',
  'Somatic complaints — sensory',
  'Cardiovascular symptoms',
  'Respiratory symptoms',
  'Gastrointestinal symptoms',
  'Genitourinary symptoms',
  'Autonomic symptoms',
  'Behaviour at interview',
];

const BPRS_PROMPTS = [
  'Somatic concern',
  'Anxiety',
  'Emotional withdrawal',
  'Conceptual disorganisation',
  'Guilt feelings',
  'Tension',
  'Mannerisms and posturing',
  'Grandiosity',
  'Depressive mood',
  'Hostility',
  'Suspiciousness',
  'Hallucinatory behaviour',
  'Motor retardation',
  'Uncooperativeness',
  'Unusual thought content',
  'Blunted affect',
  'Excitement',
  'Disorientation',
];

const YMRS_0_4 = [
  'Elevated mood',
  'Increased motor activity / energy',
  'Sexual interest',
  'Sleep',
  'Language — thought disorder',
  'Appearance',
  'Insight',
];
const YMRS_0_8 = ['Irritability', 'Speech (rate and amount)', 'Content', 'Disruptive / aggressive behaviour'];

const ASRS_PROMPTS = [
  'Trouble wrapping up the final details of a project',
  'Difficulty getting things in order for a task requiring organisation',
  'Problems remembering appointments or obligations',
  'Avoiding or delaying tasks that require a lot of thought',
  'Fidgeting or squirming when seated for long',
  'Feeling overly active, as if driven by a motor',
  'Making careless mistakes on a boring or difficult project',
  'Difficulty keeping attention on repetitive work',
  'Difficulty concentrating on what people say to you',
  'Misplacing or having trouble finding things',
  'Being distracted by activity or noise around you',
  'Leaving your seat when you are expected to stay seated',
  'Feeling restless or fidgety',
  'Difficulty unwinding and relaxing when you have time to yourself',
  'Talking too much in social situations',
  'Finishing other people’s sentences',
  'Difficulty waiting your turn',
  'Interrupting others when they are busy',
];

psychometricTools.push(
  {
    id: 'tool_hamd17_en',
    organizationId: ORG_ID,
    code: 'HAMD17',
    name: 'Hamilton Depression Rating Scale (HAM-D-17)',
    version: '1.0',
    language: 'en',
    items: [...items(HAMD17_0_4, 'hamd_a', SCALE_0_4), ...items(HAMD17_0_2, 'hamd_b', SCALE_0_2)],
    scoring: { method: 'sum', total: { min: 0, max: 52 } },
    bands: [
      { label: 'Normal', min: 0, max: 7, severity: 'minimal' },
      { label: 'Mild', min: 8, max: 13, severity: 'mild' },
      { label: 'Moderate', min: 14, max: 18, severity: 'moderate' },
      { label: 'Severe', min: 19, max: 22, severity: 'moderately_severe' },
      { label: 'Very severe', min: 23, max: 52, severity: 'severe' },
    ],
    administeredBy: 'clinician',
    sourceCitation: 'Hamilton (1960) — public domain.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'tool_hama_en',
    organizationId: ORG_ID,
    code: 'HAMA',
    name: 'Hamilton Anxiety Rating Scale (HAM-A)',
    version: '1.0',
    language: 'en',
    items: items(HAMA_PROMPTS, 'hama', SCALE_0_4),
    scoring: { method: 'sum', total: { min: 0, max: 56 } },
    bands: [
      { label: 'Mild', min: 0, max: 17, severity: 'mild' },
      { label: 'Mild to moderate', min: 18, max: 24, severity: 'moderate' },
      { label: 'Moderate to severe', min: 25, max: 30, severity: 'moderately_severe' },
      { label: 'Severe', min: 31, max: 56, severity: 'severe' },
    ],
    administeredBy: 'clinician',
    sourceCitation: 'Hamilton (1959) — public domain.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'tool_bprs18_en',
    organizationId: ORG_ID,
    code: 'BPRS18',
    name: 'Brief Psychiatric Rating Scale (BPRS-18)',
    version: '1.0',
    language: 'en',
    items: items(BPRS_PROMPTS, 'bprs', SCALE_1_7),
    scoring: { method: 'sum', total: { min: 18, max: 126 } },
    bands: [
      { label: 'Minimal', min: 18, max: 30, severity: 'minimal' },
      { label: 'Mild', min: 31, max: 40, severity: 'mild' },
      { label: 'Moderate', min: 41, max: 52, severity: 'moderate' },
      { label: 'Severe', min: 53, max: 126, severity: 'severe' },
    ],
    administeredBy: 'clinician',
    sourceCitation: 'Overall & Gorham (1962) — public domain.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'tool_ymrs_en',
    organizationId: ORG_ID,
    code: 'YMRS',
    name: 'Young Mania Rating Scale (YMRS)',
    version: '1.0',
    language: 'en',
    items: [...items(YMRS_0_4, 'ymrs_a', SCALE_0_4), ...items(YMRS_0_8, 'ymrs_b', SCALE_0_8)],
    scoring: { method: 'sum', total: { min: 0, max: 60 } },
    bands: [
      { label: 'Remission', min: 0, max: 12, severity: 'minimal' },
      { label: 'Minimal', min: 13, max: 19, severity: 'mild' },
      { label: 'Mild', min: 20, max: 25, severity: 'moderate' },
      { label: 'Moderate', min: 26, max: 37, severity: 'moderately_severe' },
      { label: 'Severe', min: 38, max: 60, severity: 'severe' },
    ],
    administeredBy: 'clinician',
    sourceCitation: 'Young et al. (1978) — public domain.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'tool_asrs_en',
    organizationId: ORG_ID,
    code: 'ASRS_V1_1',
    name: 'Adult ADHD Self-Report Scale (ASRS-v1.1)',
    version: '1.1',
    language: 'en',
    items: items(ASRS_PROMPTS, 'asrs', ASRS_SCALE),
    scoring: { method: 'sum', total: { min: 0, max: 72 } },
    bands: [
      { label: 'Unlikely', min: 0, max: 16, severity: 'minimal' },
      { label: 'Likely', min: 17, max: 23, severity: 'moderate' },
      { label: 'Highly likely', min: 24, max: 72, severity: 'severe' },
    ],
    administeredBy: 'self',
    sourceCitation: 'Kessler et al. / WHO (2005) — free to reproduce.',
    licenceNote: 'Free to use (D-024).',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
);

function bandFor(tool: PsychometricTool, total: number): string {
  return tool.bands.find((b) => total >= b.min && total <= b.max)?.label ?? tool.bands[0]!.label;
}

/* FIXTURE — 8 weekly re-administrations per patient per tool (D-024),
 * self-administered, a slow deterministic downward trend. */
const TRACKED_PATIENTS = ['pat_1', 'pat_2', 'pat_3', 'pat_5'];
const SERIAL_TOOL_IDS = ['tool_phq9_en', 'tool_gad7_en'];

export const psychometricSubmissions: PsychometricSubmission[] = TRACKED_PATIENTS.flatMap((patientId) =>
  psychometricTools
    .filter((t) => SERIAL_TOOL_IDS.includes(t.id))
    .flatMap((tool) =>
    Array.from({ length: 8 }, (_, week) => {
      const weeksAgo = 7 - week; // week 0 = 7 weeks ago .. week 7 = this week
      const max = tool.scoring.total as { min: number; max: number };
      const startScore = Math.round(max.max * 0.55);
      const total = Math.max(2, startScore - week * 2);
      const answers = Object.fromEntries(
        tool.items.map((item, i) => [item.id, Math.min(3, Math.max(0, Math.round(total / tool.items.length) + (i % 2)))]),
      );
      return {
        id: `psy_${patientId}_${tool.code}_${week}`,
        organizationId: ORG_ID,
        patientId,
        toolId: tool.id,
        appointmentId: null,
        assignedByUserId: null,
        answers,
        total,
        subscaleTotals: null,
        band: bandFor(tool, total),
        administeredBy: 'self',
        at: `${dayOffset(-weeksAgo * 7)}T09:00:00.000Z`,
        createdAt: NOW,
        updatedAt: NOW,
      } satisfies PsychometricSubmission;
    }),
  ),
);

/* FIXTURE — three clinician-rated HAM-D-17 administrations for pat_2, so
 * the provider's scores-over-time overlay has a clinician series next to
 * the patient's self-rated ones (ui-references §D). */
const HAMD_TOOL = psychometricTools.find((t) => t.id === 'tool_hamd17_en')!;
[18, 14, 9].forEach((total, i) => {
  const weeksAgo = 6 - i * 3;
  psychometricSubmissions.push({
    id: `psy_pat_2_HAMD17_${i}`,
    organizationId: ORG_ID,
    patientId: 'pat_2',
    toolId: HAMD_TOOL.id,
    appointmentId: null,
    assignedByUserId: 'usr_prov_aditya',
    answers: Object.fromEntries(HAMD_TOOL.items.map((item) => [item.id, 1])),
    total,
    subscaleTotals: null,
    band: bandFor(HAMD_TOOL, total),
    administeredBy: 'clinician',
    at: `${dayOffset(-weeksAgo * 7)}T10:00:00.000Z`,
    createdAt: NOW,
    updatedAt: NOW,
  });
});

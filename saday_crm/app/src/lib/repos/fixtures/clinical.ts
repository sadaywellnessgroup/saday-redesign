import type { SessionNote } from '@/lib/domain';
import { ORG_ID } from './organization';
import { FIXTURE_NOW, dayOffset } from './time';

const NOW = FIXTURE_NOW.toISOString();

/* FIXTURE — 6 signed session notes, Swasthmind 4-section layout (D-005). */
interface Seed {
  id: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  sessionDate: string;
  concern: string;
  narrative: string;
}

const SEEDS: Seed[] = [
  {
    id: 'note_1',
    appointmentId: 'appt_1',
    patientId: 'pat_1',
    providerId: 'prov_janhavi',
    sessionDate: '2026-08-10',
    concern: 'Persistent low mood and worry about academic performance.',
    narrative: 'Built rapport; psychoeducation on anxiety and CBT model introduced.',
  },
  {
    id: 'note_2',
    appointmentId: 'appt_2',
    patientId: 'pat_1',
    providerId: 'prov_janhavi',
    sessionDate: '2026-08-24',
    concern: 'Follow-up: sleep improved, worry thoughts still frequent.',
    narrative: 'Reviewed thought-record homework; introduced worry-time technique.',
  },
  {
    id: 'note_3',
    appointmentId: 'appt_5',
    patientId: 'pat_2',
    providerId: 'prov_aditya',
    sessionDate: '2026-08-18',
    concern: 'Low energy, irritability over 6 weeks; sleep disturbed.',
    narrative: 'Detailed history taken; medication options discussed with patient.',
  },
  {
    id: 'note_4',
    appointmentId: 'appt_9',
    patientId: 'pat_3',
    providerId: 'prov_kritika',
    sessionDate: '2026-08-27',
    concern: 'Panic-like episodes before exams, avoidance of college.',
    narrative: 'Psychoeducation on panic cycle; breathing technique taught.',
  },
  {
    id: 'note_5',
    appointmentId: 'appt_12',
    patientId: 'pat_4',
    providerId: 'prov_vikrant',
    sessionDate: '2026-08-03',
    concern: 'Interpersonal conflict at work, emotional dysregulation.',
    narrative: 'Intake completed; DBT skills group discussed as an option.',
  },
  {
    id: 'note_6',
    appointmentId: 'appt_17',
    patientId: 'pat_5',
    providerId: 'prov_surabhi',
    sessionDate: '2026-09-03',
    concern: 'New-onset low mood after childbirth, 4 months postpartum.',
    narrative: 'Postpartum depression screening discussed; follow-up scheduled.',
  },
];

/* FIXTURE — the dev provider's own notes (prov_aditya): two more signed
 * notes on his recent sessions, plus one draft so /pro/patients/[id]/notes
 * has a "Continue draft" path and the Today screen has an unwritten note
 * to chase. */
const PROVIDER_CONSOLE_SEEDS: Seed[] = [
  {
    id: 'note_7',
    appointmentId: 'appt_26',
    patientId: 'pat_3',
    providerId: 'prov_aditya',
    sessionDate: dayOffset(-12),
    concern: 'Panic symptoms before college presentations; two episodes this fortnight.',
    narrative: 'Reviewed panic diary; graded exposure hierarchy drafted together.',
  },
  {
    id: 'note_8',
    appointmentId: 'appt_31',
    patientId: 'pat_2',
    providerId: 'prov_aditya',
    sessionDate: dayOffset(-9),
    concern: 'Mood improving on current dose; sleep still broken in the second half of the night.',
    narrative: 'Dose continued; sleep-hygiene plan agreed and worksheet shared.',
  },
];

export const sessionNotes: SessionNote[] = [...SEEDS, ...PROVIDER_CONSOLE_SEEDS].map((s) => ({
  id: s.id,
  organizationId: ORG_ID,
  appointmentId: s.appointmentId,
  patientId: s.patientId,
  providerId: s.providerId,
  sessionDate: s.sessionDate,
  durationMinutes: 50,
  mode: 'online',
  presentingConcern: s.concern,
  mood: 'Low',
  affect: 'Reactive',
  risk: ['no_risk'],
  behaviouralObservation: 'Cooperative, maintained eye contact, speech normal rate.',
  narrative: s.narrative,
  interventions: ['psychoeducation', 'cbt'],
  homework: 'Continue thought record / sleep log.',
  goals: 'Reduce anxiety symptoms; improve daily functioning.',
  nextFocus: 'Review homework, continue skills practice.',
  progressScore: 6,
  followUpDate: null,
  signedAt: NOW,
  signedByUserId: s.providerId.replace('prov_', 'usr_prov_'), // the provider's own user id
  isLocked: true,
  version: 1,
  supersedesId: null,
  supersededAt: null,
  createdAt: NOW,
  updatedAt: NOW,
}));

/* FIXTURE — one unsigned draft (appt_25, prov_aditya / pat_4). A draft is
 * an ordinary row with `signedAt === null`; only signing locks it
 * (architecture.md §11). */
sessionNotes.push({
  id: 'note_draft_1',
  organizationId: ORG_ID,
  appointmentId: 'appt_25',
  patientId: 'pat_4',
  providerId: 'prov_aditya',
  sessionDate: dayOffset(-5),
  durationMinutes: 25,
  mode: 'online',
  presentingConcern: 'Irritability at work; two arguments with supervisor this week.',
  mood: 'Irritable',
  affect: 'Reactive',
  risk: ['no_risk'],
  behaviouralObservation: 'Restless in chair, speech pressured at times.',
  narrative: null,
  interventions: [],
  homework: null,
  goals: null,
  nextFocus: null,
  progressScore: null,
  followUpDate: null,
  signedAt: null,
  signedByUserId: null,
  isLocked: false,
  version: 1,
  supersedesId: null,
  supersededAt: null,
  createdAt: `${dayOffset(-5)}T12:00:00.000Z`,
  updatedAt: `${dayOffset(-5)}T12:20:00.000Z`,
});

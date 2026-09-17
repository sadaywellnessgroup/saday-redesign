import type {
  Provider,
  ProviderAvailabilityRule,
  ProviderBlockout,
  ProviderSessionType,
  ProfessionalTitle,
  RegistrationCouncil,
} from '@/lib/domain';
import { ORG_ID } from './organization';
import { FIXTURE_NOW, dayOffset } from './time';

const NOW = FIXTURE_NOW.toISOString();

/* Seeded from _refs/main-site/lib/content.ts `team` (Jun 2026 scrape of the
 * live site) — names, roles, short bios and languages are real. Everything
 * else (registration numbers, session types, prices, availability,
 * commission %) is invented for the fixture set and marked // FIXTURE. */
interface ProviderSeed {
  slug: string;
  name: string; // becomes displayName
  role: string; // main-site "role" line, kept as bioShort context
  short: string;
  title: ProfessionalTitle;
  council: RegistrationCouncil;
  years: number; // FIXTURE
  languages: string[];
  weekday: number; // primary availability weekday, 0=Sun .. 6=Sat — FIXTURE
}

const SEEDS: ProviderSeed[] = [
  {
    slug: 'aditya',
    name: 'Dr. Aditya Agrawal',
    role: 'Psychiatrist · Co-founder',
    short: 'Gold-medallist psychiatrist (AIIMS, KGMU); addictions, child & adolescent, OCD.',
    title: 'psychiatrist',
    council: 'NMC',
    years: 5,
    languages: ['en', 'hi'],
    weekday: 1,
  },
  {
    slug: 'vikrant',
    name: 'Mr. Vikrant Patel',
    role: 'Clinical Psychologist · Co-founder',
    short: 'RCI-registered clinical psychologist; psychotherapy, neuropsychology, personality disorders.',
    title: 'clinical_psychologist',
    council: 'RCI',
    years: 6,
    languages: ['en', 'hi'],
    weekday: 2,
  },
  {
    slug: 'kritika',
    name: 'Dr. Kritika Chawla',
    role: 'Psychiatrist',
    short: 'MBBS, MD Psychiatry (KGMU); individualised therapy & medication; mindfulness.',
    title: 'psychiatrist',
    council: 'NMC',
    years: 3,
    languages: ['en', 'hi'],
    weekday: 3,
  },
  {
    slug: 'shivangini',
    name: 'Dr. Shivangini Singh',
    role: 'Psychiatrist',
    short: 'Psychiatrist (KGMU); youth mental health, anxiety, de-addiction.',
    title: 'psychiatrist',
    council: 'NMC',
    years: 3,
    languages: ['en', 'hi'],
    weekday: 4,
  },
  {
    slug: 'haifa',
    name: 'Ms. Haifa Ainbosi',
    role: 'Psychologist · Facilitator',
    short: 'Psychologist & facilitator; support groups, workshops, arts-based practice.',
    title: 'counselling_psychologist',
    council: 'RCI',
    years: 2,
    languages: ['en'],
    weekday: 5,
  },
  {
    slug: 'janhavi',
    name: 'Ms. Janhavi Laddhad',
    role: 'Clinical Psychologist',
    short: 'Clinical psychologist (CHRIST University); anxiety, depression, trauma; CBT, DBT & art therapy.',
    title: 'clinical_psychologist',
    council: 'RCI',
    years: 4,
    languages: ['en', 'hi', 'mr'],
    weekday: 1,
  },
  {
    slug: 'surabhi',
    name: 'Dr. Surabhi Sinha',
    role: 'Psychiatrist',
    short: 'Psychiatrist (MD); anxiety, mood & psychotic disorders; in-person & teleconsultation.',
    title: 'psychiatrist',
    council: 'NMC',
    years: 4,
    languages: ['en', 'hi', 'bn'],
    weekday: 2,
  },
  {
    slug: 'yatika',
    name: 'Dr. Yatika Chadha Toshniwal',
    role: 'Psychiatrist',
    short: 'Psychiatrist (MD); anxiety, depression, trauma; collaborative, individualised online care.',
    title: 'psychiatrist',
    council: 'NMC',
    years: 4,
    languages: ['en', 'hi'],
    weekday: 3,
  },
];

export const providers: Provider[] = SEEDS.map((s, i) => ({
  id: `prov_${s.slug}`,
  organizationId: ORG_ID,
  userId: `usr_prov_${s.slug}`,
  slug: s.slug,
  displayName: s.name,
  professionalTitle: s.title,
  // FIXTURE — qualifications/specialisations derived from the title so the
  // public profile and /pro/more settings screens have real-shaped content.
  qualifications: s.title === 'psychiatrist' ? ['MBBS', 'MD (Psychiatry)'] : ['MA (Psychology)', 'M.Phil (Clinical Psychology)'],
  specialisations:
    s.title === 'psychiatrist'
      ? ['Mood disorders', 'Anxiety disorders', 'Addiction psychiatry']
      : ['CBT', 'Trauma-focused therapy', 'Adolescent counselling'],
  concernsAddressed: ['Depression', 'Anxiety', 'Sleep problems', 'Stress & burnout'],
  languagesSpoken: s.languages,
  registrationCouncil: s.council,
  registrationNumber: s.council === 'none' ? null : `${s.council}-2026-${1000 + i}`, // FIXTURE
  registrationVerifiedAt: NOW,
  yearsExperience: s.years,
  bioShort: s.short,
  bioLong: s.short,
  photoPath: null,
  commissionPct: 20, // FIXTURE — default org commission (D-018)
  bankAccountHolderName: null,
  isAcceptingPatients: true,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
}));

/* FIXTURE — session types are invented; the schema has no default catalogue. */
export const providerSessionTypes: ProviderSessionType[] = SEEDS.flatMap((s, i) => {
  const isPsychiatrist = s.title === 'psychiatrist';
  const firstKey = isPsychiatrist ? 'consultation_first' : 'therapy_intake';
  const followKey = isPsychiatrist ? 'followup' : 'therapy_50';
  const firstPrice = isPsychiatrist ? 150000 : 120000; // paise, FIXTURE
  const followPrice = isPsychiatrist ? 90000 : 100000;
  return [
    {
      id: `st_${s.slug}_first`,
      organizationId: ORG_ID,
      providerId: `prov_${s.slug}`,
      key: firstKey,
      nameEn: isPsychiatrist ? 'First consultation' : 'Intake session',
      nameHi: isPsychiatrist ? 'पहली परामर्श' : 'इनटेक सत्र',
      durationMinutes: 50,
      bufferMinutes: 10,
      pricePaise: firstPrice,
      mode: 'online',
      minNoticeHours: null,
      maxAdvanceDays: null,
      sortOrder: 0,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: `st_${s.slug}_follow`,
      organizationId: ORG_ID,
      providerId: `prov_${s.slug}`,
      key: followKey,
      nameEn: isPsychiatrist ? 'Follow-up' : 'Therapy session (50 min)',
      nameHi: isPsychiatrist ? 'फॉलो-अप' : 'थेरेपी सत्र (50 मिनट)',
      durationMinutes: isPsychiatrist ? 25 : 50,
      bufferMinutes: 5,
      pricePaise: followPrice,
      mode: 'online',
      minNoticeHours: null,
      maxAdvanceDays: null,
      sortOrder: 1,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
});

/* FIXTURE — one weekly block per provider, 10:00-13:00 and 15:00-18:00 IST. */
export const providerAvailabilityRules: ProviderAvailabilityRule[] = SEEDS.flatMap((s) => [
  {
    id: `avail_${s.slug}_am`,
    organizationId: ORG_ID,
    providerId: `prov_${s.slug}`,
    sessionTypeId: null,
    weekday: s.weekday,
    startTime: '10:00',
    endTime: '13:00',
    validFrom: dayOffset(-60),
    validUntil: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: `avail_${s.slug}_pm`,
    organizationId: ORG_ID,
    providerId: `prov_${s.slug}`,
    sessionTypeId: null,
    weekday: (s.weekday + 2) % 7,
    startTime: '15:00',
    endTime: '18:00',
    validFrom: dayOffset(-60),
    validUntil: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
]);

/* FIXTURE — one-off block-outs so the booking UI has something to
 * subtract, plus the "Days off" rows the availability editor manages
 * (MantraCare digest §11: exceptions live apart from the weekly grid). */
export const providerBlockouts: ProviderBlockout[] = [
  {
    id: 'blockout_1',
    organizationId: ORG_ID,
    providerId: 'prov_aditya',
    startsAt: `${dayOffset(3)}T09:00:00.000Z`,
    endsAt: `${dayOffset(3)}T12:00:00.000Z`,
    reason: 'Conference (FIXTURE)',
    repeatsYearly: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'blockout_2',
    organizationId: ORG_ID,
    providerId: 'prov_aditya',
    startsAt: `${dayOffset(10)}T00:00:00.000Z`,
    endsAt: `${dayOffset(11)}T00:00:00.000Z`,
    reason: 'Personal leave (FIXTURE)',
    repeatsYearly: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'blockout_3',
    organizationId: ORG_ID,
    providerId: 'prov_aditya',
    startsAt: '2026-10-02T00:00:00.000Z',
    endsAt: '2026-10-03T00:00:00.000Z',
    reason: 'Gandhi Jayanti (FIXTURE)',
    repeatsYearly: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

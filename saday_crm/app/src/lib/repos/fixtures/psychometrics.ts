import type { PsychometricSubmission, PsychometricTool } from '@/lib/domain';
import { toPsychometricTool, type RawTool } from '@/lib/psychometrics/tool-schema';
import { ORG_ID } from './organization';
import { FIXTURE_NOW, dayOffset } from './time';

import phq9Json from '@/lib/psychometrics/tools/phq9.json';
import gad7Json from '@/lib/psychometrics/tools/gad7.json';
import hamd17Json from '@/lib/psychometrics/tools/hamd17.json';
import hamaJson from '@/lib/psychometrics/tools/hama.json';
import bprs18Json from '@/lib/psychometrics/tools/bprs18.json';
import ymrsJson from '@/lib/psychometrics/tools/ymrs.json';
import asrsJson from '@/lib/psychometrics/tools/asrs.json';

const NOW = FIXTURE_NOW.toISOString();

/* D-024 — the 7 free / public-domain tools, sourced verbatim from the
 * ABC360 proformas (see src/lib/psychometrics/README.md for licence status
 * and what still needs proofreading). Each JSON file under
 * src/lib/psychometrics/tools/ is the single source of truth for item
 * text, scoring, bands, and remission/response rules; this file only
 * assigns the stable fixture ids that the rest of the app links against
 * (`/app/track/assess/[toolId]`, the provider's "Assign a tool" sheet). Ids
 * are kept exactly as they were before D-024 content landed — nothing
 * downstream needs to change. */
const TOOL_IDS: Record<string, string> = {
  PHQ9: 'tool_phq9_en',
  GAD7: 'tool_gad7_en',
  HAMD17: 'tool_hamd17_en',
  HAMA: 'tool_hama_en',
  BPRS18: 'tool_bprs18_en',
  YMRS: 'tool_ymrs_en',
  ASRS_V1_1: 'tool_asrs_en',
};

function buildTool(raw: RawTool): PsychometricTool {
  const id = TOOL_IDS[raw.code];
  if (!id) throw new Error(`no fixture id mapped for psychometric tool code ${raw.code}`);
  return toPsychometricTool(raw, { id, organizationId: ORG_ID, language: 'en', createdAt: NOW, updatedAt: NOW });
}

export const psychometricTools: PsychometricTool[] = [
  buildTool(phq9Json as unknown as RawTool),
  buildTool(gad7Json as unknown as RawTool),
  buildTool(hamd17Json as unknown as RawTool),
  buildTool(hamaJson as unknown as RawTool),
  buildTool(bprs18Json as unknown as RawTool),
  buildTool(ymrsJson as unknown as RawTool),
  buildTool(asrsJson as unknown as RawTool),
];

/** Old ids some earlier fixture data or ad-hoc scripts may still reference
 * (`tool_<code>_en` was always the pattern) — kept as a defensive alias so
 * a stale reference resolves instead of throwing. Every current id above
 * already matches this pattern, so this is a no-op map today; it exists so
 * a future rename doesn't silently break `getTool`. */
export const TOOL_ID_ALIASES: Record<string, string> = {};

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

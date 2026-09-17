import type { PsychometricAdministeredBy, PsychometricTool } from '@/lib/domain';

/** Shape of the JSON files under `src/lib/psychometrics/tools/*.json` — the
 * D-024 free/public-domain tool content, extracted verbatim from the ABC360
 * proformas (see README.md in this folder). This is deliberately richer
 * than `PsychometricTool` (bilingual text, scoring rules, subscales,
 * screen/remission/response rules): `toPsychometricTool` below folds it
 * down into the `psychometric_tools` row shape the rest of the app reads,
 * keeping the extra rules inside the free-form `scoring` JSONB bag where
 * `src/lib/psychometrics/scoring.ts` reads them back out. */
export interface RawToolOption {
  value: number;
  labelEn: string;
  labelHi?: string;
}
export interface RawToolItem {
  id: string;
  textEn: string;
  textHi?: string;
  /** ASRS-v1.1 only — which half of the checklist the item belongs to. */
  part?: 'A' | 'B';
  /** BPRS-18 only — one of the seven remission items (Andreasen 2005). */
  remissionItem?: boolean;
  options: RawToolOption[];
}
export interface RawToolBand {
  min: number;
  max: number;
  labelEn: string;
  labelHi?: string;
  /** One of the severity keys `SEVERITY_COLORS` understands: minimal, mild,
   * moderate, moderately_severe, severe. */
  color: string;
}
export interface RawTool {
  code: string;
  name: string;
  version: string;
  languages: ('en' | 'hi')[];
  administeredBy: PsychometricAdministeredBy;
  sourceCitation?: string;
  licenceNote?: string;
  items: RawToolItem[];
  scoring: Record<string, unknown>;
  bands: RawToolBand[];
}

/** Folds a raw tool JSON file into a `PsychometricTool` fixture row. The
 * `id` is passed in by the caller so it stays stable across reloads (the
 * assessment runner route and the "Assign a tool" sheet both link by id). */
export function toPsychometricTool(
  raw: RawTool,
  opts: { id: string; organizationId: string; language: 'en' | 'hi'; createdAt: string; updatedAt: string },
): PsychometricTool {
  return {
    id: opts.id,
    organizationId: opts.organizationId,
    code: raw.code,
    name: raw.name,
    version: raw.version,
    language: opts.language,
    items: raw.items.map((item) => ({
      id: item.id,
      prompt: item.textEn,
      options: item.options.map((opt) => ({ label: opt.labelEn, value: opt.value })),
    })),
    scoring: raw.scoring,
    bands: raw.bands.map((band) => ({ label: band.labelEn, min: band.min, max: band.max, severity: band.color })),
    administeredBy: raw.administeredBy,
    sourceCitation: raw.sourceCitation ?? null,
    licenceNote: raw.licenceNote ?? null,
    isActive: true,
    createdAt: opts.createdAt,
    updatedAt: opts.updatedAt,
  };
}

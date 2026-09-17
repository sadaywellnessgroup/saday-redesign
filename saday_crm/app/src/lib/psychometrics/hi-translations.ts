import type { RawTool } from './tool-schema';
import phq9Json from './tools/phq9.json';
import gad7Json from './tools/gad7.json';

/* Hindi item text for the assessment runner's per-question EN/HI toggle
 * (route 11, ui-references §B "Assessment runner"). Sourced from the same
 * `textHi` / `labelHi` fields as the tool JSON itself (src/lib/psychometrics
 * /tools/{phq9,gad7}.json) — those two tools are the only ones with a
 * validated Hindi version (PHQ-9 and GAD-7, official Pfizer India
 * translations; see ROADMAP's licence table). The Hindi item text was
 * transcribed from a page image and still needs a Hindi speaker's
 * proofread before clinic use — see this folder's README.md. Clinician-
 * rated tools (HAM-D-17, HAM-A, BPRS-18, YMRS) and ASRS-v1.1 have no
 * Hindi source and are never shown to the patient, so they have no entry
 * here. */

const PHQ9 = phq9Json as unknown as RawTool;
const GAD7 = gad7Json as unknown as RawTool;

function itemHiMap(tool: RawTool): Record<string, string> {
  return Object.fromEntries(tool.items.filter((item) => item.textHi).map((item) => [item.id, item.textHi as string]));
}

function optionHiMap(tool: RawTool): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of tool.items) {
    for (const opt of item.options) {
      if (opt.labelHi) map[opt.labelEn] = opt.labelHi;
    }
  }
  return map;
}

const BY_TOOL_CODE: Record<string, Record<string, string>> = {
  PHQ9: itemHiMap(PHQ9),
  GAD7: itemHiMap(GAD7),
};

/* Option-label lookup is keyed by the English label text only, because the
 * assessment runner calls `hiOptionLabel(opt.label)` without the tool code
 * (see assessment-runner.tsx). PHQ-9 and GAD-7's official English option
 * text differs for "More than half the ..." and "Almost/Nearly every day",
 * so those resolve correctly per tool. "Several days" is worded
 * identically in both English forms but the two official Hindi
 * translations differ (PHQ-9: कई दिन · GAD-7: कई दिनों तक) — this is a
 * genuine ambiguity the shared, tool-blind lookup cannot resolve without a
 * runner change. GAD-7's translation is merged last and wins; see this
 * folder's README.md "known gap" note. */
const SCALE_OPTIONS_HI: Record<string, string> = { ...optionHiMap(PHQ9), ...optionHiMap(GAD7) };

export function hiItemPrompt(toolCode: string, itemId: string, fallback: string): string {
  return BY_TOOL_CODE[toolCode]?.[itemId] ?? fallback;
}

export function hiOptionLabel(label: string): string {
  return SCALE_OPTIONS_HI[label] ?? label;
}

# Psychometric tools (D-024)

Content for the 7 free tools lives in `tools/*.json` (one file per tool),
extracted verbatim from the ABC360 assessment proformas. `tool-schema.ts`
folds each JSON file into a `PsychometricTool` fixture row; `scoring.ts`
reads the JSON's `scoring` bag back out to compute totals, bands,
subscales, screen rules, and `progress()` (response/remission).

## Licence status (ABC360's ROADMAP.md licence table)

| Tool | Status |
|---|---|
| PHQ-9, GAD-7 | Pfizer — free, no permission needed. Official India Hindi versions. |
| HAM-D-17, HAM-A | Public domain. |
| BPRS-18 | Public domain (US VA/NIMH-funded). |
| ASRS-v1.1 | WHO — free for clinical use. |
| YMRS | © British Journal of Psychiatry 1978 — clinicians may photocopy for their own clinical use only; not public domain. |

Excluded on purpose (licensed or unclear — ROADMAP.md "Decided"): Y-BOCS,
MSI-BPD, ZAN-BPD, WURS, MDQ.

## What Saday must proofread

1. **Hindi PHQ-9** and **Hindi GAD-7** (`tools/*.json`, `textHi`) —
   transcribed from page images; the source PDFs' text layers were
   unreadable.
2. Minor gap: `hi-translations.ts` resolves the shared option "Several
   days" to one Hindi translation (GAD-7's) because the runner calls
   `hiOptionLabel(label)` without a tool code, and PHQ-9's official
   translation for just that option differs slightly. Everything else is
   exact per tool.
3. Band `labelHi` values are supplementary, not sourced from ABC360.
4. YMRS/BPRS-18 anchors came from third-party copies in ABC360 — spot-check
   against the 1978/1962 originals.

HAM-D-17 and HAM-A's *response* line (50% of baseline) isn't stated in the
source, only their remission cut-offs (≤7) are — applied here as the same
convention PHQ-9/GAD-7/YMRS use; confirm with the clinic.

## Adding a tool

1. Add `tools/<code>.json` matching `RawTool` in `tool-schema.ts`.
2. Import it in `fixtures/psychometrics.ts`, add its code to `TOOL_IDS`,
   push it into `buildTool(...)`.
3. Extend `tests/psychometrics.test.ts`'s table-driven cases.
4. Self-rated + Hindi? Add it to `hi-translations.ts`'s `BY_TOOL_CODE`.

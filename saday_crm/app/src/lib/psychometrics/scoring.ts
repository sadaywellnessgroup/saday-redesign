import type { PsychometricTool } from '@/lib/domain';

/* Pure scoring helper — no repo/node imports, so it is safe to use from a
 * Client Component (the assessment runner shows the result immediately
 * without waiting on a server round trip) as well as from
 * psychometrics.repo.ts's createSubmission. */
export function scoreAnswers(tool: PsychometricTool, answers: Record<string, number>) {
  const total = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const band = tool.bands.find((b) => total >= b.min && total <= b.max)?.label ?? tool.bands[0]?.label ?? null;
  return { total, band };
}

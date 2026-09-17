import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatISTDateTime } from '@/lib/utils';
import { patientInitials } from '@/lib/provider/earnings-totals';
import type { FollowUpFlow, FollowUpSubmission } from '@/lib/domain';

export interface SubmissionRow extends FollowUpSubmission {
  flow: FollowUpFlow | undefined;
  providerName: string;
  patientName: string;
}

/** Admin Submissions tab (D-020) — expandable rows, no `<script>` needed:
 * `<details>` gives the expand/collapse for free and still works at
 * 360px. Responses are shown as-is (mood scores, yes/no, short free
 * text) — these are follow-up survey answers, not clinical notes. */
export function SubmissionsTable({ rows, labels }: { rows: SubmissionRow[]; labels: Record<string, string> }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-ink-soft">{labels.empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <details key={row.id} className="group overflow-hidden rounded-softer bg-card shadow-feather">
          <summary className="flex cursor-pointer list-none flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 [&::-webkit-details-marker]:hidden">
            <div className="flex flex-wrap items-center gap-2 sm:contents">
              <span className="flex-none text-[13px] text-ink-soft sm:w-40">{formatISTDateTime(row.submittedAt)}</span>
              <Badge variant={row.flow?.flowKind === 'check_in' ? 'default' : 'turmeric'}>
                {row.flow?.title ?? row.flowId}
              </Badge>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:contents">
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink sm:flex-1">{row.providerName}</span>
              <span className="flex-none text-[13px] text-ink-soft">{patientInitials(row.patientName)}</span>
              <span className="flex-none text-[11px] uppercase tracking-[0.05em] text-ink-soft">{row.deliveredVia}</span>
            </div>
          </summary>
          <div className="border-t border-transparent bg-cream px-4 py-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
              {labels.responses}
            </p>
            <dl className="flex flex-col gap-1 text-[13.5px]">
              {Object.entries(row.responses).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="flex-none text-ink-soft">{key}:</dt>
                  <dd className="text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      ))}
    </div>
  );
}

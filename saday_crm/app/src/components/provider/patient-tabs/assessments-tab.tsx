import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssignToolSheet, ClinicianRunner, type ToolRow } from '@/components/provider/assessment-tools';
import { repos } from '@/lib/repos';
import type { Patient } from '@/lib/domain';
import { formatISTDate } from '@/lib/utils';

/** Assessments tab — assign a tool (self- or clinician-rated per the
 * tool's `administeredBy`, D-024), run clinician-rated tools inline, and
 * read the history. */
export async function AssessmentsTab({ patient }: { patient: Patient }) {
  const [tools, submissions, assignments] = await Promise.all([
    repos.psychometrics.listTools(patient.organizationId),
    repos.psychometrics.listSubmissionsForPatient(patient.id),
    repos.psychometrics.listAssignmentsForPatient(patient.id),
  ]);

  const toolRows: ToolRow[] = tools.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    administeredBy: t.administeredBy,
    itemCount: t.items.length,
    items: t.items,
  }));
  const clinicianTools = toolRows.filter((t) => t.administeredBy === 'clinician' || t.administeredBy === 'either');
  const history = [...submissions].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="sec-title">Assessments</h2>
        <AssignToolSheet patientId={patient.id} tools={toolRows} />
      </div>

      {assignments.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">Assigned</h3>
            {assignments.map((assignment) => {
              const tool = tools.find((t) => t.id === assignment.toolId);
              return (
                <div
                  key={assignment.id}
                  className="flex flex-wrap items-center gap-2 rounded-soft bg-cream px-4 py-3"
                >
                  <span className="font-semibold text-indigo-deep">{tool?.code ?? assignment.toolId}</span>
                  <Badge variant="secondary">{assignment.administeredBy === 'self' ? 'Self-rated' : 'Clinician-rated'}</Badge>
                  <span className="text-xs text-ink-soft">assigned {formatISTDate(assignment.assignedAt)}</span>
                  <Badge variant={assignment.completedSubmissionId ? 'default' : 'turmeric'} className="ml-auto">
                    {assignment.completedSubmissionId ? 'Completed' : 'Awaiting'}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
            Clinician-rated — run here
          </h3>
          <div className="flex flex-wrap gap-2">
            {clinicianTools.map((tool) => (
              <div key={tool.id} className="flex items-center gap-2 rounded-soft bg-cream px-3 py-2">
                <span className="text-[14px] font-semibold text-indigo-deep">{tool.code}</span>
                <span className="text-xs text-ink-soft">{tool.itemCount} items</span>
                <ClinicianRunner patientId={patient.id} tool={tool} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">History</h3>
          {history.length === 0 ? (
            <p className="text-sm text-ink-soft">No administrations recorded.</p>
          ) : (
            <div>
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.06em] text-ink-soft">
                    <th className="py-2 font-bold">Date</th>
                    <th className="py-2 font-bold">Tool</th>
                    <th className="py-2 pr-3 font-bold">Score</th>
                    <th className="py-2 font-bold">Band</th>
                    <th className="hidden py-2 font-bold sm:table-cell">Rated by</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((submission) => {
                    const tool = tools.find((t) => t.id === submission.toolId);
                    return (
                      <tr key={submission.id} className="align-top">
                        <td className="py-2 pr-2 text-ink-soft">{formatISTDate(submission.at)}</td>
                        <td className="py-2 pr-2 font-semibold text-indigo-deep">{tool?.code ?? '—'}</td>
                        <td className="py-2 pr-3 font-semibold text-ink">{submission.total ?? '—'}</td>
                        <td className="py-2 pr-2 text-ink-soft">{submission.band ?? '—'}</td>
                        <td className="hidden py-2 text-ink-soft sm:table-cell">
                          {submission.administeredBy === 'self' ? 'Patient' : 'Clinician'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { AssessmentRunner } from '@/components/patient/assessment-runner';
import { repos } from '@/lib/repos';

/** Route 11. The dynamic segment is named `submissionId` per the task
 * brief, but a submission does not exist until the runner finishes — the
 * value passed here is the psychometric tool's id (`PsychometricTool.id`),
 * i.e. "the assessment about to be submitted". No contact capture (the
 * patient is already logged in). */
export default async function AssessmentRunnerPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId: toolId } = await params;
  const t = await getTranslations('appTrack');
  const tool = await repos.psychometrics.getTool(toolId);
  if (!tool) notFound();

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('tabAssessments')} title={tool.name} motif="waves" />
      <AssessmentRunner tool={tool} />
    </div>
  );
}

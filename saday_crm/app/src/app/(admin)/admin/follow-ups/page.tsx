import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { FlowEditor } from '@/components/admin/flow-editor';
import { SubmissionsTable, type SubmissionRow } from '@/components/admin/submissions-table';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { cn } from '@/lib/utils';

type Tab = 'flows' | 'submissions';
const TABS: Tab[] = ['flows', 'submissions'];

/** Route /admin/follow-ups — org-wide flow config (D-023): Check-in +
 * Feedback flows, each with an enabled toggle, hours-after-trigger,
 * EN/HI message body and a text/single-choice question list, plus a
 * cross-provider Submissions tab. */
export default async function AdminFollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; flow?: string; provider?: string }>;
}) {
  const t = await getTranslations('admin.followUps');
  await requireAdmin();
  const params = await searchParams;
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'flows';

  const flowLabels = {
    enabledLabel: t('enabledLabel'),
    hoursLabel: t('hoursLabel'),
    messageEnLabel: t('messageEnLabel'),
    messageHiLabel: t('messageHiLabel'),
    messageHint: t('messageHint'),
    questionsLabel: t('questionsLabel'),
    questionPromptEn: t('questionPromptEn'),
    questionPromptHi: t('questionPromptHi'),
    questionType: t('questionType'),
    questionTypeText: t('questionTypeText'),
    questionTypeChoice: t('questionTypeChoice'),
    questionOptions: t('questionOptions'),
    addQuestion: t('addQuestion'),
    removeQuestion: t('removeQuestion'),
    save: t('save'),
    saved: t('saved'),
    sendTest: t('sendTest'),
    sendTestSent: t('sendTestSent'),
  };

  const tabHref = (next: Tab) => (next === 'flows' ? '/admin/follow-ups' : `/admin/follow-ups?tab=${next}`);

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((tabKey) => (
          <Link
            key={tabKey}
            href={tabHref(tabKey)}
            aria-current={tab === tabKey ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold no-underline',
              tab === tabKey ? 'bg-indigo text-cream shadow-feather' : 'bg-card text-indigo shadow-feather hover:bg-lilac-tint',
            )}
          >
            {t(tabKey === 'flows' ? 'tabFlows' : 'tabSubmissions')}
          </Link>
        ))}
      </div>

      {tab === 'flows' ? <FlowsTab labels={flowLabels} /> : <SubmissionsTab params={params} t={t} />}
    </div>
  );
}

async function FlowsTab({ labels }: { labels: Record<string, string> }) {
  const t = await getTranslations('admin.followUps');
  const [checkIn, feedback] = await Promise.all([
    repos.followUp.getFlow(ORG_ID, 'check_in'),
    repos.followUp.getFlow(ORG_ID, 'feedback'),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {checkIn ? (
        <FlowEditor
          kind="check_in"
          title={t('checkInTitle')}
          hoursHint={t('hoursCheckInHint')}
          initial={{
            offsetHours: checkIn.offsetHours,
            isActive: checkIn.isActive,
            messageBodyEn: checkIn.messageBodyEn,
            messageBodyHi: checkIn.messageBodyHi,
            questions: checkIn.questions,
          }}
          labels={labels}
        />
      ) : null}
      {feedback ? (
        <FlowEditor
          kind="feedback"
          title={t('feedbackTitle')}
          hoursHint={t('hoursFeedbackHint')}
          initial={{
            offsetHours: feedback.offsetHours,
            isActive: feedback.isActive,
            messageBodyEn: feedback.messageBodyEn,
            messageBodyHi: feedback.messageBodyHi,
            questions: feedback.questions,
          }}
          labels={labels}
        />
      ) : null}
    </div>
  );
}

async function SubmissionsTab({
  params,
  t,
}: {
  params: { flow?: string; provider?: string };
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const [submissions, flows, providers, patients] = await Promise.all([
    repos.followUp.listAllSubmissions(ORG_ID),
    repos.followUp.listAllFlows(ORG_ID),
    repos.provider.listAll(ORG_ID),
    repos.patient.listForOrganization(ORG_ID),
  ]);

  const providerById = new Map(providers.map((p) => [p.id, p]));
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const flowById = new Map(flows.map((f) => [f.id, f]));

  const providerOfAppointment = new Map<string, string>();
  for (const p of providers) {
    const appts = await repos.booking.listForProvider(p.id);
    for (const a of appts) providerOfAppointment.set(a.id, p.id);
  }

  const flowFilter = params.flow && params.flow !== 'all' ? params.flow : null;
  const providerFilter = params.provider && params.provider !== 'all' ? params.provider : null;

  const rows: SubmissionRow[] = submissions
    .filter((s) => (flowFilter ? s.flowId === flowFilter : true))
    .filter((s) => (providerFilter ? providerOfAppointment.get(s.appointmentId) === providerFilter : true))
    .map((s) => ({
      ...s,
      flow: flowById.get(s.flowId),
      providerName: providerById.get(providerOfAppointment.get(s.appointmentId) ?? '')?.displayName ?? '—',
      patientName: patientById.get(s.patientId)?.displayName ?? '',
    }));

  return (
    <div className="flex flex-col gap-3">
      <form action="/admin/follow-ups" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="tab" value="submissions" />
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
          {t('submissionsFilterFlow')}
          <select name="flow" defaultValue={params.flow ?? 'all'} className="h-11 rounded-soft bg-card px-3 text-[14px] text-ink shadow-feather outline-none">
            <option value="all">{t('submissionsFilterAll')}</option>
            {flows.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
          {t('submissionsFilterProvider')}
          <select name="provider" defaultValue={params.provider ?? 'all'} className="h-11 rounded-soft bg-card px-3 text-[14px] text-ink shadow-feather outline-none">
            <option value="all">{t('submissionsFilterAll')}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 text-[13.5px] font-semibold text-cream">
          {t('submissionsApply')}
        </button>
      </form>

      <SubmissionsTable
        rows={rows}
        labels={{ empty: t('submissionsEmpty'), responses: t('submissionsResponses') }}
      />
    </div>
  );
}

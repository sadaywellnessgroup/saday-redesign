import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PatientTabNav, normaliseTab } from '@/components/provider/patient-tab-nav';
import { OverviewTab } from '@/components/provider/patient-tabs/overview-tab';
import { NotesTab } from '@/components/provider/patient-tabs/notes-tab';
import { ProformaTab } from '@/components/provider/patient-tabs/proforma-tab';
import { AssessmentsTab } from '@/components/provider/patient-tabs/assessments-tab';
import { FilesTab } from '@/components/provider/patient-tabs/files-tab';
import { MessagesTab } from '@/components/provider/patient-tabs/messages-tab';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { CLINICAL_STATUS_LABEL, clinicalStatus, maskedPhone, sexLabel } from '@/lib/provider/patient-status';
import { formatISTDate, initials } from '@/lib/utils';

/** Route /pro/patients/[id] — the patient record. Sticky tabs:
 * Overview · Notes · Proforma · Assessments · Files · Messages. */
export default async function ProviderPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = normaliseTab(tabParam);
  const { providerId } = await requireProvider();

  const patient = await repos.patient.getById(id);
  if (!patient) notFound();

  const appointments = await repos.booking.listForPatient(patient.id);
  const mine = appointments.filter((a) => a.providerId === providerId);
  if (mine.length === 0 && patient.assignedProviderId !== providerId) notFound();

  const user = await repos.user.getById(patient.userId);
  const now = new Date();
  const status = clinicalStatus(mine, now);
  const firstSeen = [...mine].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  return (
    <div className="flex flex-col gap-4">
      {/* identity strip */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-5">
          <Avatar className="h-12 w-12 shadow-feather">
            <AvatarFallback>{initials(patient.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[22px] text-indigo-deep sm:text-[26px]">{patient.displayName}</h1>
              <Badge variant={status === 'active' ? 'default' : status === 'new' ? 'turmeric' : 'secondary'}>
                {CLINICAL_STATUS_LABEL[status]}
              </Badge>
            </div>
            <p className="text-sm text-ink-soft">
              {patient.ageYears} yrs · {sexLabel(patient.sex)} · {maskedPhone(user?.phoneLast4 ?? null)}
              {firstSeen ? ` · with you since ${formatISTDate(firstSeen.scheduledAt)}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <PatientTabNav patientId={patient.id} active={tab} />

      {tab === 'overview' ? <OverviewTab patient={patient} appointments={mine} /> : null}
      {tab === 'notes' ? <NotesTab patient={patient} appointments={mine} /> : null}
      {tab === 'proforma' ? <ProformaTab patient={patient} /> : null}
      {tab === 'assessments' ? <AssessmentsTab patient={patient} /> : null}
      {tab === 'files' ? <FilesTab patient={patient} /> : null}
      {tab === 'messages' ? <MessagesTab patient={patient} providerId={providerId} /> : null}
    </div>
  );
}

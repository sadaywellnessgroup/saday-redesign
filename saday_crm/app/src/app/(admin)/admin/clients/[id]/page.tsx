import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChangePhoneSheet } from '@/components/admin/change-phone-sheet';
import { repos } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import {
  CLINICAL_STATUS_LABEL,
  ONBOARDING_STATUS_LABEL,
  clinicalStatus,
  lastSession,
  maskedPhone,
  nextSession,
  sexLabel,
  type OnboardingStatus,
} from '@/lib/provider/patient-status';
import { formatISTDate } from '@/lib/utils';

/** Route /admin/clients/[id] — metadata only (D-020/D-029): no notes,
 * proforma content, scores or message content. Notes/proforma show only
 * that one exists and its date; messages show only a thread count. */
export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations('admin.clientDetail');
  await requireAdmin();
  const { id } = await params;

  const patient = await repos.patient.getById(id);
  if (!patient) notFound();
  const now = new Date();

  const [user, appointments, provider, notes, proformas, threads] = await Promise.all([
    repos.user.getById(patient.userId),
    repos.booking.listForPatient(patient.id),
    patient.assignedProviderId ? repos.provider.getById(patient.assignedProviderId) : Promise.resolve(null),
    repos.clinical.listSessionNotesForPatient(patient.id),
    repos.clinical.listProformasForPatient(patient.id),
    repos.messaging.listThreadsForPatient(patient.id),
  ]);

  const status = clinicalStatus(appointments, now);
  const onboarding: OnboardingStatus = user?.phoneVerifiedAt ? 'joined' : 'invite_sent';
  const last = lastSession(appointments, now);
  const next = nextSession(appointments, now);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo no-underline hover:underline">
        <ChevronLeft className="h-4 w-4" /> {t('back')}
      </Link>
      <ConsoleHeading kicker={t('kicker')} title={patient.displayName} sub={t('sub')} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 pt-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px] sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('phone')}</dt>
                <dd className="font-semibold text-ink">{maskedPhone(user?.phoneLast4 ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('age')}</dt>
                <dd className="font-semibold text-ink">{patient.ageYears}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('sex')}</dt>
                <dd className="font-semibold text-ink">{sexLabel(patient.sex)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('city')}</dt>
                <dd className="font-semibold text-ink">{patient.city ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('provider')}</dt>
                <dd className="font-semibold text-ink">{provider?.displayName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('onboarding')}</dt>
                <dd>
                  <Badge variant={onboarding === 'joined' ? 'default' : 'turmeric'}>
                    {ONBOARDING_STATUS_LABEL[onboarding]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('clinicalStatus')}</dt>
                <dd>
                  <Badge variant={status === 'active' ? 'default' : status === 'new' ? 'turmeric' : 'secondary'}>
                    {CLINICAL_STATUS_LABEL[status]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('lastSession')}</dt>
                <dd className="font-semibold text-ink">{last ? formatISTDate(last.scheduledAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('nextSession')}</dt>
                <dd className="font-semibold text-ink">{next ? formatISTDate(next.scheduledAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft">{t('sessionsCount')}</dt>
                <dd className="font-semibold text-ink">{appointments.length}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <h2 className="sec-title">{t('changePhone')}</h2>
            <ChangePhoneSheet
              patientId={patient.id}
              currentPhone={maskedPhone(user?.phoneLast4 ?? null)}
              labels={{
                phone: t('phone'),
                changePhone: t('changePhone'),
                changePhoneSheetTitle: t('changePhoneSheetTitle'),
                changePhoneNote: t('changePhoneNote'),
                changePhoneLabel: t('changePhoneLabel'),
                changePhoneConfirm: t('changePhoneConfirm'),
                changePhoneCancel: t('changePhoneCancel'),
                changePhoneSaved: t('changePhoneSaved'),
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* D-020/D-029: metadata only — never the note/proforma content, a
          score, or a message body. Just that something exists, and when. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="sec-title">{t('notesSection')}</h2>
            {notes.length === 0 ? (
              <p className="text-sm text-ink-soft">{t('notesEmpty')}</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {notes.map((note) => (
                  <li key={note.id} className="text-[13.5px] text-ink">
                    {t('notesRow', {
                      date: formatISTDate(`${note.sessionDate}T06:00:00.000Z`),
                      signed: note.signedAt ? t('signedSuffix') : t('draftSuffix'),
                    })}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="sec-title">{t('proformaSection')}</h2>
            {proformas.length === 0 ? (
              <p className="text-sm text-ink-soft">{t('proformaEmpty')}</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {proformas.map((p) => (
                  <li key={p.id} className="text-[13.5px] text-ink">
                    {t('proformaRow', {
                      date: formatISTDate(p.createdAt),
                      signed: p.signedAt ? t('signedSuffix') : t('draftSuffix'),
                    })}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="sec-title">{t('messagesSection')}</h2>
            <p className="text-sm text-ink-soft">{t('messagesNote', { count: threads.length })}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionActionSheet } from '@/components/patient/session-action-sheet';
import { getSession } from '@/lib/auth/session';
import { repos, ORG_ID } from '@/lib/repos';
import type { Appointment, ProviderSessionType } from '@/lib/domain';
import { formatISTDateTime, initials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const STATUS_KEY: Record<Appointment['status'], string> = {
  scheduled: 'statusScheduled',
  in_progress: 'statusScheduled',
  completed: 'statusCompleted',
  no_show: 'statusNoShow',
  cancelled_by_patient: 'statusCancelled',
  cancelled_by_provider: 'statusCancelled',
  rescheduled: 'statusRescheduled',
};

/** Route 9 — upcoming / past session tabs. Upcoming cards get the
 * Reschedule/Cancel Sheet (session-action-sheet.tsx); past cards show a
 * collapsible "files from this session" list. */
export default async function SessionsPage() {
  const t = await getTranslations('appSessions');
  const session = await getSession();
  const patientId = session?.patientId;
  const now = new Date().toISOString();

  const [appointments, policies] = await Promise.all([
    patientId ? repos.booking.listForPatient(patientId) : Promise.resolve([]),
    repos.organization.getPolicies(ORG_ID),
  ]);

  const providerIds = [...new Set(appointments.map((a) => a.providerId))];
  const providers = await Promise.all(providerIds.map((id) => repos.provider.getById(id)));
  const providerById = new Map(providers.filter(Boolean).map((p) => [p!.id, p!]));

  const sessionTypeLists = await Promise.all(providerIds.map((id) => repos.provider.listSessionTypes(id)));
  const sessionTypeById = new Map<string, ProviderSessionType>();
  sessionTypeLists.flat().forEach((st) => sessionTypeById.set(st.id, st));

  const upcoming = appointments.filter((a) => a.status === 'scheduled' && a.scheduledAt >= now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = appointments.filter((a) => a.status !== 'scheduled' || a.scheduledAt < now).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="waves" />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">{t('upcoming')}</TabsTrigger>
          <TabsTrigger value="past">{t('past')}</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <p className="rounded-softer bg-card p-6 text-center text-sm text-ink-soft shadow-feather">{t('noUpcoming')}</p>
          ) : (
            upcoming.map((appt) => {
              const provider = providerById.get(appt.providerId);
              const st = sessionTypeById.get(appt.sessionTypeId);
              return (
                <Card key={appt.id}>
                  <CardContent className="flex flex-col gap-3 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 shadow-feather">
                          <AvatarFallback>{provider ? initials(provider.displayName) : '—'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-display text-base text-indigo-deep">{provider?.displayName ?? '—'}</p>
                          <p className="text-xs text-ink-soft">{st?.nameEn}</p>
                        </div>
                      </div>
                      <Badge>{t(STATUS_KEY[appt.status])}</Badge>
                    </div>
                    <p className="text-sm text-ink-soft">{formatISTDateTime(appt.scheduledAt)} IST</p>
                    {policies ? <SessionActionSheet appointmentId={appt.id} providerId={appt.providerId} policies={policies} /> : null}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="past" className="flex flex-col gap-3">
          {past.length === 0 ? (
            <p className="rounded-softer bg-card p-6 text-center text-sm text-ink-soft shadow-feather">{t('noPast')}</p>
          ) : (
            await Promise.all(
              past.map(async (appt) => {
                const provider = providerById.get(appt.providerId);
                const st = sessionTypeById.get(appt.sessionTypeId);
                const files = await repos.file.listForAppointment(appt.id);
                return (
                  <Card key={appt.id}>
                    <CardContent className="flex flex-col gap-3 pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 shadow-feather">
                            <AvatarFallback>{provider ? initials(provider.displayName) : '—'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-display text-base text-indigo-deep">{provider?.displayName ?? '—'}</p>
                            <p className="text-xs text-ink-soft">{st?.nameEn}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{t(STATUS_KEY[appt.status])}</Badge>
                      </div>
                      <p className="text-sm text-ink-soft">{formatISTDateTime(appt.scheduledAt)} IST</p>
                      <details className="group">
                        <summary className="cursor-pointer list-none text-[13px] font-semibold text-indigo">
                          {t('filesFromSession')}
                        </summary>
                        <div className="pt-2">
                          {files.length > 0 ? (
                            <ul className="flex flex-col gap-1.5">
                              {files.map((f) => (
                                <li key={f.id} className="truncate text-sm text-ink-soft">
                                  {f.originalName ?? f.storagePath}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-ink-soft">{t('noFilesFromSession')}</p>
                          )}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                );
              }),
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookingWizard } from '@/components/patient/booking-wizard';
import { repos } from '@/lib/repos';
import { getSession } from '@/lib/auth/session';
import { earliestAcrossAllProviders } from '@/lib/booking/availability';
import { bookableTypesForPatient } from '@/lib/booking/logic';
import { initials } from '@/lib/utils';

/** Route 6 — cross-provider "earliest available" (D-004). Provider is
 * pre-assigned; the wizard opens straight on the summary/consent/pay step
 * with a "change" link back to the browse-by-provider flow.
 *
 * D-034: a patient with no prior appointment is auto-assigned a **first
 * consultation** — never a follow-up type, whichever happens to have the
 * soonest slot. */
export default async function BookEarliestPage() {
  const t = await getTranslations('booking');
  const session = await getSession();
  const priorAppointments = session?.patientId
    ? await repos.booking.listForPatient(session.patientId)
    : [];
  const hasPriorAppointments = priorAppointments.length > 0;
  const winner = await earliestAcrossAllProviders(new Date(), hasPriorAppointments);

  if (!winner) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeading kicker={t('kicker')} title={t('assignedTitle')} motif="waves" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-soft">{t('noEarliestAvailable')}</p>
            <Link href="/providers" className="mt-3 inline-block text-sm font-semibold text-indigo">
              {t('change')}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allTypes = await repos.provider.listSessionTypes(winner.provider.id);
  const sessionTypes = bookableTypesForPatient(allTypes, hasPriorAppointments);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeading kicker={t('kicker')} title={t('assignedTitle')} sub={t('assignedSub')} motif="waves" />

      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-feather">
              <AvatarFallback>{initials(winner.provider.displayName)}</AvatarFallback>
            </Avatar>
            <p className="font-display text-lg text-indigo-deep">{winner.provider.displayName}</p>
          </div>
          <Link href="/providers" className="text-sm font-semibold text-indigo">
            {t('change')}
          </Link>
        </CardContent>
      </Card>

      <BookingWizard
        providerId={winner.provider.id}
        providerName={winner.provider.displayName}
        sessionTypes={sessionTypes}
        slotsByType={{ [winner.sessionTypeId]: [winner.slot] }}
        bookingChannel="earliest_available"
        initialSessionTypeId={winner.sessionTypeId}
        initialSlot={winner.slot}
      />
    </div>
  );
}

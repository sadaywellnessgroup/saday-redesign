import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { repos } from '@/lib/repos';
import { getIntake } from '@/lib/intake/cookie';
import { formatISTDateTime, initials } from '@/lib/utils';

/** Route 7 — booking confirmation: date/time, provider, join-link
 * placeholder (real 100ms join link is minted server-side closer to the
 * session, D-013), "add to calendar" (ICS download via the sibling
 * route.ts), and the WhatsApp-confirmation note (no in-app safety/helpline
 * module per D-009 — just this footer-style note). */
export default async function BookingConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('confirmed');

  const appointment = await repos.booking.getById(id);
  if (!appointment) notFound();
  const provider = await repos.provider.getById(appointment.providerId);
  const intake = await getIntake();
  const name = intake?.name || 'there';

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title', { name })} sub={t('sub')} motif="deepa" />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-feather">
              <AvatarFallback>{provider ? initials(provider.displayName) : '—'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-soft">{t('provider')}</p>
              <p className="font-display text-lg text-indigo-deep">{provider?.displayName ?? '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">{t('when')}</p>
            <p className="text-[15px] font-medium text-ink">{formatISTDateTime(appointment.scheduledAt)} IST</p>
          </div>
          <div className="rounded-soft bg-cream px-4 py-3 text-sm text-ink-soft">{t('joinPlaceholder')}</div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg" className="h-12 flex-1">
          <a href={`/booking/${appointment.id}/ics`} download>
            {t('addToCalendar')}
          </a>
        </Button>
        <Button asChild size="lg" className="h-12 flex-1">
          <Link href="/app/sessions">{t('goToSessions')}</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <h2 className="sec-title">{t('whatsNextTitle')}</h2>
          <p className="lede">{t('whatsNextBody')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

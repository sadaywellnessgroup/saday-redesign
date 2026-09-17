import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getSession } from '@/lib/auth/session';
import { repos } from '@/lib/repos';
import { formatISTDateTime, initials } from '@/lib/utils';

/** Route 13 — thread list. Async-notice banner up top (ui-references §B
 * "Messages thread"); no provider phone/email anywhere (§E-10). */
export default async function MessagesPage() {
  const t = await getTranslations('appMessages');
  const session = await getSession();
  const patientId = session?.patientId;

  const threads = patientId ? await repos.messaging.listThreadsForPatient(patientId) : [];
  const withProvider = await Promise.all(
    threads.map(async (thread) => {
      const provider = await repos.provider.getById(thread.providerId);
      const messages = await repos.messaging.listMessages(thread.id);
      const last = messages.at(-1);
      const unread = messages.filter((m) => m.senderRole === 'provider' && !m.readAt).length;
      return { thread, provider, last, unread };
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="waves" />

      <div className="rounded-soft bg-lilac-tint px-4 py-3 text-sm text-indigo-deep">{t('asyncNotice')}</div>

      {withProvider.length === 0 ? (
        <p className="rounded-softer bg-card p-6 text-center text-sm text-ink-soft shadow-feather">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {withProvider.map(({ thread, provider, last, unread }) => (
            <Link key={thread.id} href={`/app/messages/${thread.id}`} className="no-underline">
              <Card className="transition-transform hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 pt-6">
                  <Avatar className="h-11 w-11 flex-none shadow-feather">
                    <AvatarFallback>{provider ? initials(provider.displayName) : '—'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base text-indigo-deep">{provider?.displayName ?? '—'}</p>
                    <p className="truncate text-sm text-ink-soft">{last?.body ?? ''}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1">
                    {thread.lastMessageAt ? <span className="text-xs text-ink-soft">{formatISTDateTime(thread.lastMessageAt)}</span> : null}
                    {unread > 0 ? <Badge variant="turmeric">{unread}</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

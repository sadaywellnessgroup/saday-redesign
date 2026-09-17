import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageComposer } from '@/components/patient/message-composer';
import { getSession } from '@/lib/auth/session';
import { repos } from '@/lib/repos';
import { cn, formatISTDateTime, initials } from '@/lib/utils';

/** Route 13b — thread view: chat bubbles, sticky composer (route 13's
 * message-composer.tsx). No provider phone/email shown. */
export default async function MessageThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const t = await getTranslations('appMessages');
  const session = await getSession();

  const thread = await repos.messaging.getThread(threadId);
  if (!thread || thread.patientId !== session?.patientId) notFound();
  const provider = await repos.provider.getById(thread.providerId);
  const messages = await repos.messaging.listMessages(threadId);

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/app/messages" className="text-sm font-semibold text-indigo no-underline">
          ← {t('backToThreads')}
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-softer bg-card px-4 py-3 shadow-feather">
        <Avatar className="h-10 w-10 shadow-feather">
          <AvatarFallback>{provider ? initials(provider.displayName) : '—'}</AvatarFallback>
        </Avatar>
        <p className="font-display text-base text-indigo-deep">{provider?.displayName ?? '—'}</p>
      </div>

      <div className="rounded-soft bg-lilac-tint px-4 py-2.5 text-xs text-indigo-deep">{t('asyncNotice')}</div>

      <div className="flex flex-1 flex-col gap-3 pb-2">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-soft">{t('noMessages')}</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col gap-0.5', m.senderRole === 'patient' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-softer px-4 py-2.5 text-[14.5px] leading-relaxed shadow-feather',
                  m.senderRole === 'patient' ? 'bg-indigo text-cream' : 'bg-card text-ink',
                )}
              >
                {m.body}
              </div>
              <span className="px-1 text-[11px] text-ink-soft">{formatISTDateTime(m.sentAt)}</span>
            </div>
          ))
        )}
      </div>

      <MessageComposer threadId={threadId} />
    </div>
  );
}

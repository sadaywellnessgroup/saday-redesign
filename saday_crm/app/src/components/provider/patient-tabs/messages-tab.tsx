import { ProviderComposer } from '@/components/provider/provider-composer';
import { repos } from '@/lib/repos';
import type { Patient } from '@/lib/domain';
import { cn, formatISTDateTime } from '@/lib/utils';

/** Messages tab — the same thread the patient sees, from the provider
 * seat. No async-notice banner here (that is a patient-side reassurance);
 * attachments are allowed both ways. */
export async function MessagesTab({ patient, providerId }: { patient: Patient; providerId: string }) {
  const thread = await repos.messaging.getOrCreateThread(patient.organizationId, patient.id, providerId);
  const [messages, files] = await Promise.all([
    repos.messaging.listMessages(thread.id),
    repos.file.listForPatient(patient.id),
  ]);

  return (
    <div className="flex min-h-[54vh] flex-col gap-4">
      <h2 className="sec-title">Messages</h2>

      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">No messages yet — say hello.</p>
        ) : (
          messages.map((message) => {
            const attachment = message.fileId ? files.find((f) => f.id === message.fileId) : null;
            const mine = message.senderRole === 'provider';
            return (
              <div key={message.id} className={cn('flex flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-softer px-4 py-2.5 text-[14.5px] leading-relaxed shadow-feather',
                    mine ? 'bg-indigo text-cream' : 'bg-card text-ink',
                  )}
                >
                  {message.body}
                  {attachment ? (
                    <span className={cn('mt-1 block text-xs', mine ? 'text-cream/80' : 'text-ink-soft')}>
                      📎 {attachment.originalName ?? 'Attachment'}
                    </span>
                  ) : null}
                </div>
                <span className="px-1 text-[11px] text-ink-soft">
                  {mine ? 'You' : patient.displayName} · {formatISTDateTime(message.sentAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <ProviderComposer patientId={patient.id} />
    </div>
  );
}

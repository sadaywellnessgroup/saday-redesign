'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Paperclip, SendHorizontal, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { sendMessageAction } from '@/app/(client)/app/messages/actions';

/** Sticky composer with attachment clip (ui-references §B "Messages
 * thread"). No provider phone/email is shown anywhere near it — see the
 * async-notice banner on the parent page (§E-10). */
export function MessageComposer({ threadId }: { threadId: string }) {
  const t = useTranslations('appMessages');
  const router = useRouter();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function send() {
    if (!body.trim() && !file) return;
    startTransition(async () => {
      const result = await sendMessageAction(
        threadId,
        body,
        file ? { name: file.name, mime: file.type, bytes: file.size } : undefined,
      );
      if (result.ok) {
        setBody('');
        setFile(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] -mx-4 flex flex-col gap-2 bg-cream/95 px-4 pb-3 pt-2 backdrop-blur-sm md:bottom-0">
      {file ? (
        <div className="flex items-center gap-2 self-start rounded-full bg-lilac-tint px-3 py-1.5 text-xs font-medium text-indigo-deep">
          {file.name}
          <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-softer bg-card p-2 shadow-feather">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          aria-label={t('attach')}
          onClick={() => inputRef.current?.click()}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-indigo hover:bg-lilac-tint"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('composerPlaceholder')}
          className="min-h-11 flex-1 resize-none border-none shadow-none"
          rows={1}
        />
        <button
          type="button"
          aria-label={t('send')}
          disabled={(!body.trim() && !file) || isPending}
          onClick={send}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-indigo text-cream disabled:opacity-40"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

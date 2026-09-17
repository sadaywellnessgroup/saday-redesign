'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, SendHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { sendProviderMessageAction } from '@/app/(provider)/pro/patients/[id]/actions';

/** Provider seat of the patient thread — same composer shape as the
 * patient side, attachments allowed (D-007). No phone or email is ever
 * surfaced in messaging (ui-references §E-10). */
export function ProviderComposer({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function send() {
    if (!body.trim() && !file) return;
    startTransition(async () => {
      const result = await sendProviderMessageAction(
        patientId,
        body,
        file ? { name: file.name, mime: file.type, bytes: file.size } : undefined,
      );
      if (result.ok) {
        setBody('');
        setFile(null);
        router.refresh();
      } else {
        toast.error(result.error === 'too_large' ? 'Attachments must be 25 MB or smaller.' : 'Message not sent.');
      }
    });
  }

  return (
    <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-10 flex flex-col gap-2 bg-cream/95 pt-2 backdrop-blur-sm md:bottom-0">
      {file ? (
        <div className="flex items-center gap-2 self-start rounded-full bg-lilac-tint px-3 py-1.5 text-xs font-medium text-indigo-deep">
          {file.name}
          <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-softer bg-card p-2 shadow-feather">
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button
          type="button"
          aria-label="Attach a file"
          onClick={() => inputRef.current?.click()}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-indigo hover:bg-lilac-tint"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply…"
          aria-label="Message"
          className="min-h-11 flex-1 resize-none border-none shadow-none"
          rows={1}
        />
        <button
          type="button"
          aria-label="Send"
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

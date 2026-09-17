'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { uploadFileAction } from '@/app/(client)/app/files/actions';

/** Upload Sheet (route 12, ui-references §C: Sheet not Dialog). */
export function FileUploadSheet() {
  const t = useTranslations('appFiles');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload() {
    if (!file) return;
    startTransition(async () => {
      const result = await uploadFileAction({ name: file.name, mime: file.type, bytes: file.size });
      if (result.ok) {
        toast.success(t('uploadSuccess'));
        setOpen(false);
        setFile(null);
        router.refresh();
      } else if (result.error === 'too_large') {
        setError(t('uploadTooLarge'));
      } else {
        setError(t('uploadBadType'));
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        {t('upload')}
      </Button>

      <Sheet open={open} onOpenChange={(v) => (setOpen(v), !v && setFile(null))}>
        <SheetContent side="bottom" className="rounded-t-softer">
          <SheetHeader>
            <SheetTitle>{t('uploadSheetTitle')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 pt-3">
            <p className="text-sm text-ink-soft">{t('uploadSheetSub')}</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                setError(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-14 items-center justify-center rounded-soft bg-cream px-4 text-sm font-semibold text-indigo shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-lilac-tint"
            >
              {file ? file.name : t('chooseFile')}
            </button>
            {error ? <p className="text-sm text-terracotta-deep">{error}</p> : null}
            <Button size="lg" className="h-12" disabled={!file || isPending} onClick={upload}>
              {t('uploadCta')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
